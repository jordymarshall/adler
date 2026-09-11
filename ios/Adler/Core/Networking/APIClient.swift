import Foundation
import os

/// `{ "error": string }` — the shape of every 4xx body, plus `revision` on a 409.
private nonisolated struct APIErrorBody: Decodable {
    let error: String?
    let revision: Int?
}

/// The one place that talks HTTP.
///
/// - Cookie session: `URLSession` stores `adler_session` in the shared `HTTPCookieStorage`
///   automatically. No `Origin` header is ever added, which is why the server's CSRF check
///   passes for native requests.
/// - Errors: `{ "error": … }` bodies become `.server(message:status:)`, 401 `.unauthenticated`,
///   409 `.staleRevision(current:)`, anything without a response `.transport`.
/// - Idempotency: the **caller** generates `requestId` and reuses it verbatim after a timeout.
///   The server replays the first result for an identical `{changes, revision, requestId}`.
///   Never auto-retry in a loop — the chat rate limit (20/minute) is consumed before the
///   idempotency check, so a retry storm locks the person out of their own coach.
actor APIClient {
    private(set) var configuration: ServerConfiguration
    private let session: URLSession
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()
    private let logger = Logger(subsystem: "com.withadler.app", category: "api")

    init(
        configuration: ServerConfiguration = .load(),
        session: URLSession? = nil
    ) {
        self.configuration = configuration
        self.session = session ?? APIClient.makeSession()
    }

    /// A long resource budget so a slow coaching turn is not cut off mid-flight; the per-request
    /// `timeoutInterval` is what actually bounds each call (30 s reads, 240 s coach).
    nonisolated static func makeSession(protocolClasses: [AnyClass]? = nil) -> URLSession {
        let configuration = URLSessionConfiguration.default
        configuration.httpCookieStorage = HTTPCookieStorage.shared
        configuration.httpCookieAcceptPolicy = .always
        configuration.httpShouldSetCookies = true
        configuration.timeoutIntervalForRequest = Endpoints.coachTimeout
        configuration.timeoutIntervalForResource = 600
        configuration.waitsForConnectivity = false
        configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
        if let protocolClasses { configuration.protocolClasses = protocolClasses }
        return URLSession(configuration: configuration)
    }

    func update(configuration: ServerConfiguration) {
        self.configuration = configuration
        configuration.save()
    }

    var baseURL: URL { configuration.baseURL }

    /// Releases the session's delegate queue and connection pool. Only for short-lived probe
    /// clients (`SessionStore.ping`); the app's one long-lived client is never invalidated.
    func invalidate() {
        session.invalidateAndCancel()
    }

    /// Drops the session cookie locally. Signing out also calls the server.
    func clearCookies() {
        let storage = session.configuration.httpCookieStorage
        for cookie in storage?.cookies(for: configuration.baseURL) ?? [] {
            storage?.deleteCookie(cookie)
        }
    }

    // MARK: - Sending

    func send<Response>(_ endpoint: Endpoint<Response>) async throws(APIError) -> Response {
        let body = try await data(for: endpoint)
        do {
            return try decoder.decode(Response.self, from: body)
        } catch {
            logger.error("decode \(endpoint.path, privacy: .public) failed: \(error)")
            throw APIError.decoding(
                message: "The server sent something this version of Adler cannot read.")
        }
    }

    /// The raw 2xx body, for callers that want JSON the models do not cover.
    func data<Response>(for endpoint: Endpoint<Response>) async throws(APIError) -> Data {
        let request = try makeRequest(endpoint)
        #if DEBUG
            let started = ContinuousClock.now
            logger.debug(
                "→ \(endpoint.method.rawValue, privacy: .public) \(request.url?.absoluteString ?? endpoint.path, privacy: .public)"
            )
        #endif

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw APIClient.transportError(error)
        }

        guard let http = response as? HTTPURLResponse else {
            throw APIError.transport(message: "No response from the server.", kind: .other)
        }

        #if DEBUG
            let elapsed = started.duration(to: .now)
            logger.debug(
                "← \(http.statusCode, privacy: .public) \(endpoint.path, privacy: .public) \(data.count, privacy: .public)B in \(elapsed.description, privacy: .public)"
            )
        #endif

        guard (200..<300).contains(http.statusCode) else {
            throw APIClient.failure(status: http.statusCode, body: data)
        }
        return data
    }

    // MARK: - Request building

    private func makeRequest<Response>(_ endpoint: Endpoint<Response>) throws(APIError)
        -> URLRequest
    {
        let badAddress = APIError.invalidRequest(
            message: "That server address could not be used. Check it in Settings › Server.")
        guard
            var components = URLComponents(
                url: configuration.baseURL.appending(path: endpoint.path),
                resolvingAgainstBaseURL: false)
        else { throw badAddress }
        if !endpoint.query.isEmpty { components.queryItems = endpoint.query }
        guard let url = components.url else { throw badAddress }

        var request = URLRequest(url: url)
        request.httpMethod = endpoint.method.rawValue
        request.timeoutInterval = endpoint.timeout
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.httpShouldHandleCookies = true
        if let body = endpoint.body {
            do {
                request.httpBody = try encoder.encode(body)
            } catch {
                throw APIError.invalidRequest(message: "That request could not be encoded.")
            }
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }
        return request
    }

    // MARK: - Error mapping

    nonisolated static func failure(status: Int, body: Data) -> APIError {
        let parsed = try? JSONDecoder().decode(APIErrorBody.self, from: body)
        switch status {
        case 401:
            return .unauthenticated
        case 409:
            return .staleRevision(current: parsed?.revision ?? 0)
        default:
            let fallback = String(data: body, encoding: .utf8).flatMap {
                $0.isEmpty ? nil : $0
            }
            return .server(
                message: parsed?.error ?? fallback ?? "The request could not complete.",
                status: status)
        }
    }

    nonisolated static func transportError(_ error: any Error) -> APIError {
        let urlError = error as? URLError
        let kind: TransportKind =
            switch urlError?.code {
            case .some(.timedOut):
                .timeout
            case .some(.notConnectedToInternet), .some(.networkConnectionLost),
                .some(.dataNotAllowed), .some(.cannotConnectToHost), .some(.cannotFindHost):
                .offline
            case .some(.cancelled):
                .cancelled
            default:
                .other
            }
        let message =
            switch kind {
            case .offline:
                "Adler can’t reach the server. Check your connection and the server address."
            case .timeout:
                "The server took too long to answer. You can retry the same request."
            case .cancelled:
                "That request was cancelled."
            case .other:
                urlError?.localizedDescription ?? error.localizedDescription
            }
        return .transport(message: message, kind: kind)
    }
}
