import Foundation
import Synchronization
import XCTest

@testable import Adler

/// Every example file is `{ "request": string, "status": number, "response": … }`.
nonisolated struct Fixture<Response: Decodable & Sendable>: Decodable, Sendable {
    let request: String
    let status: Int
    let response: Response
}

/// Anchors `Bundle(for:)` on the test bundle. `AdlerTests/Fixtures` is a folder reference, so
/// the JSON lands in a `Fixtures` subdirectory inside the bundle.
nonisolated final class FixtureAnchor {}

nonisolated enum Fixtures {
    /// Read out of the test bundle rather than hardcoded, so a new example in
    /// `docs/ios-api-examples/` cannot drift from a third copy of the list.
    /// `ios/scripts/check-fixtures.sh` keeps the bundle copies in step with the source.
    static let all: [String] = {
        let bundle = Bundle(for: FixtureAnchor.self)
        let urls =
            bundle.urls(forResourcesWithExtension: "json", subdirectory: "Fixtures")
            ?? bundle.urls(forResourcesWithExtension: "json", subdirectory: nil)
            ?? []
        return urls.map { $0.deletingPathExtension().lastPathComponent }.sorted()
    }()

    static func data(_ name: String) throws -> Data {
        let bundle = Bundle(for: FixtureAnchor.self)
        guard
            let url = bundle.url(
                forResource: name, withExtension: "json", subdirectory: "Fixtures")
                ?? bundle.url(forResource: name, withExtension: "json")
        else {
            throw XCTSkip(
                "Fixture \(name).json is not in the test bundle. Run ios/scripts/sync-fixtures.sh.")
        }
        return try Data(contentsOf: url)
    }

    static func load<Response: Decodable & Sendable>(
        _ type: Response.Type, _ name: String
    ) throws -> Fixture<Response> {
        try JSONDecoder().decode(Fixture<Response>.self, from: data(name))
    }

    /// The raw `response` object, for assertions about keys the models do not model.
    static func raw(_ name: String) throws -> [String: Any] {
        let object = try JSONSerialization.jsonObject(with: data(name)) as? [String: Any]
        return object?["response"] as? [String: Any] ?? [:]
    }
}

// MARK: - URLProtocol stub

/// Feeds canned responses to a `URLSession`, so error mapping is tested without a server.
nonisolated final class StubURLProtocol: URLProtocol, @unchecked Sendable {
    nonisolated struct Stub: Sendable {
        var status: Int = 200
        var body: Data = Data()
        var headers: [String: String] = ["Content-Type": "application/json"]
        var error: URLError?
        /// Held open this long before answering, so a test can observe two requests overlapping
        /// (or prove that they never do).
        var delay: TimeInterval = 0
    }

    /// One request as the stub saw it. `URLProtocol` moves `httpBody` into `httpBodyStream`, so
    /// the body has to be read here or it is gone by the time a test looks.
    nonisolated struct Seen: Sendable {
        let url: URL?
        let method: String?
        let headers: [String: String]
        let body: Data?

        var path: String? { url.flatMap { URLComponents(url: $0, resolvingAgainstBaseURL: false)?.path } }
        var json: [String: Any]? {
            body.flatMap { try? JSONSerialization.jsonObject(with: $0) as? [String: Any] }
        }
    }

    private static let queued = Mutex<[Stub]>([])
    private static let seen = Mutex<[Seen]>([])
    private static let concurrency = Mutex<(current: Int, peak: Int)>((0, 0))

    static func reset() {
        queued.withLock { $0 = [] }
        seen.withLock { $0 = [] }
        concurrency.withLock { $0 = (0, 0) }
    }

    static func enqueue(status: Int, json: String, delay: TimeInterval = 0) {
        queued.withLock {
            $0.append(Stub(status: status, body: Data(json.utf8), delay: delay))
        }
    }

    static func enqueue(error: URLError) {
        queued.withLock { $0.append(Stub(error: error)) }
    }

    static var seenRequests: [Seen] { seen.withLock { $0 } }

    /// The most requests that were ever in flight at once.
    static var peakConcurrency: Int { concurrency.withLock { $0.peak } }

    static func requests(path: String) -> [Seen] { seenRequests.filter { $0.path == path } }

    static func session() -> URLSession {
        APIClient.makeSession(protocolClasses: [StubURLProtocol.self])
    }

    static func client(base: String = "http://localhost:8080") -> APIClient {
        APIClient(
            configuration: ServerConfiguration(text: base)!,
            session: session())
    }

    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

    override func startLoading() {
        Self.seen.withLock {
            $0.append(
                Seen(
                    url: request.url,
                    method: request.httpMethod,
                    headers: request.allHTTPHeaderFields ?? [:],
                    body: request.httpBody ?? request.httpBodyStream.map(Self.read)))
        }
        Self.concurrency.withLock {
            $0.current += 1
            $0.peak = max($0.peak, $0.current)
        }
        defer { Self.concurrency.withLock { $0.current -= 1 } }
        let stub = Self.queued.withLock { $0.isEmpty ? nil : $0.removeFirst() }
        guard let stub else {
            client?.urlProtocol(self, didFailWithError: URLError(.unsupportedURL))
            return
        }
        if stub.delay > 0 { Thread.sleep(forTimeInterval: stub.delay) }
        if let error = stub.error {
            client?.urlProtocol(self, didFailWithError: error)
            return
        }
        let response = HTTPURLResponse(
            url: request.url!, statusCode: stub.status, httpVersion: "HTTP/1.1",
            headerFields: stub.headers)!
        client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
        client?.urlProtocol(self, didLoad: stub.body)
        client?.urlProtocolDidFinishLoading(self)
    }

    override func stopLoading() {}

    private static func read(_ stream: InputStream) -> Data {
        stream.open()
        defer { stream.close() }
        var data = Data()
        let size = 4096
        var buffer = [UInt8](repeating: 0, count: size)
        while stream.hasBytesAvailable {
            let read = stream.read(&buffer, maxLength: size)
            if read <= 0 { break }
            data.append(buffer, count: read)
        }
        return data
    }
}
