import Foundation
import os

/// Listens to `GET /api/events`, which emits `data: {"revision":N}` on every workspace change
/// (and a keep-alive every 25 s).
///
/// The stream is opened on foreground and closed on background — see `WorkspaceStore.scenePhase`.
/// It reconnects with capped exponential backoff; `stop()` cancels cleanly without a reconnect.
@MainActor
@Observable
final class SSEClient {
    private(set) var isConnected = false
    private(set) var lastRevision: Int?

    private let client: APIClient
    private let session: URLSession
    private let logger = Logger(subsystem: "com.withadler.app", category: "sse")
    private var task: Task<Void, Never>?
    private var onRevision: (@MainActor (Int) -> Void)?

    /// Called once when the stream is refused with a 401, just before the client gives up.
    /// The shell maps it to `WorkspaceStore.noteSessionExpired()`; without it the stream
    /// reconnected into the same 401 every 30 s and nothing routed the person to sign-in.
    var onUnauthenticated: (@MainActor () -> Void)?

    /// 1 s, 2 s, 4 s, 8 s, 16 s, then every 30 s.
    private static let backoff: [Duration] = [
        .seconds(1), .seconds(2), .seconds(4), .seconds(8), .seconds(16), .seconds(30),
    ]

    init(client: APIClient, session: URLSession? = nil) {
        self.client = client
        self.session = session ?? SSEClient.makeSession()
    }

    nonisolated static func makeSession(protocolClasses: [AnyClass]? = nil) -> URLSession {
        let configuration = URLSessionConfiguration.default
        configuration.httpCookieStorage = HTTPCookieStorage.shared
        configuration.httpCookieAcceptPolicy = .always
        configuration.httpShouldSetCookies = true
        // An event stream is idle most of the time; neither timeout may cut it off.
        configuration.timeoutIntervalForRequest = 300
        configuration.timeoutIntervalForResource = .greatestFiniteMagnitude
        configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
        if let protocolClasses { configuration.protocolClasses = protocolClasses }
        return URLSession(configuration: configuration)
    }

    /// Idempotent: calling `start` while connected does nothing.
    func start(onRevision: @escaping @MainActor (Int) -> Void) {
        guard task == nil else { return }
        self.onRevision = onRevision
        task = Task { [weak self] in await self?.run() }
    }

    func stop() {
        task?.cancel()
        task = nil
        // The closure captures the shell's stores; a stopped stream has no reason to hold them.
        onRevision = nil
        isConnected = false
    }

    private func run() async {
        var attempt = 0
        while !Task.isCancelled {
            var cleanEnd = false
            do {
                try await listen()
                cleanEnd = true
                attempt = 0
            } catch is CancellationError {
                break
            } catch APIError.unauthenticated {
                // Reconnecting cannot help: the cookie is gone. Surface it and stop.
                isConnected = false
                task = nil
                onRevision = nil
                onUnauthenticated?()
                return
            } catch {
                logger.debug("sse dropped: \(error.localizedDescription, privacy: .public)")
            }
            isConnected = false
            if Task.isCancelled { break }
            // A clean end of stream reconnects immediately; a failure backs off.
            if !cleanEnd {
                let delay = Self.backoff[min(attempt, Self.backoff.count - 1)]
                attempt += 1
                do { try await Task.sleep(for: delay) } catch { break }
            }
        }
        isConnected = false
    }

    private func listen() async throws {
        let base = await client.baseURL
        var request = URLRequest(url: base.appending(path: Endpoints.eventsPath))
        request.setValue("text/event-stream", forHTTPHeaderField: "Accept")
        request.timeoutInterval = 300
        request.httpShouldHandleCookies = true

        let (stream, response) = try await session.bytes(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw APIError.transport(message: "The event stream refused to open.", kind: .other)
        }
        if http.statusCode == 401 { throw APIError.unauthenticated }
        guard (200..<300).contains(http.statusCode) else {
            throw APIError.transport(message: "The event stream refused to open.", kind: .other)
        }
        isConnected = true
        for try await line in stream.lines {
            try Task.checkCancellation()
            guard let revision = Self.revision(fromLine: line) else { continue }
            lastRevision = revision
            onRevision?(revision)
        }
    }

    /// `data: {"revision":7}` → `7`. Comments (`:`), blank lines and other fields are ignored.
    nonisolated static func revision(fromLine line: String) -> Int? {
        guard line.hasPrefix("data:") else { return nil }
        let payload = line.dropFirst(5).trimmingCharacters(in: .whitespaces)
        guard let data = payload.data(using: .utf8),
            let event = try? JSONDecoder().decode(RevisionEvent.self, from: data)
        else { return nil }
        return event.revision
    }

    nonisolated struct RevisionEvent: Decodable, Sendable, Equatable {
        let revision: Int
    }
}
