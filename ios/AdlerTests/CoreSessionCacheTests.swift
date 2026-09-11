import Foundation
import XCTest

@testable import Adler

/// `SessionStore`, `ViewCache` and `SSEClient` lifecycle. All against the stub transport.
nonisolated final class CoreSessionCacheTests: XCTestCase {

    override func setUp() {
        super.setUp()
        StubURLProtocol.reset()
    }

    private static func scratchDefaults() -> UserDefaults {
        UserDefaults(suiteName: "adler.tests.\(UUID().uuidString)") ?? .standard
    }

    private func scratchCache(_ name: String = #function) -> ViewCache {
        ViewCache(
            directoryName: "AdlerTests-\(name.replacingOccurrences(of: "()", with: ""))",
            defaults: Self.scratchDefaults())
    }

    // MARK: - SessionStore

    @MainActor
    func testBootstrapTreatsA401AsSignedOutNotAnError() async throws {
        StubURLProtocol.enqueue(status: 401, json: #"{"error":"Sign in to your workspace."}"#)
        let store = SessionStore(client: StubURLProtocol.client(), cache: scratchCache())
        await store.bootstrap()
        XCTAssertEqual(store.state, .signedOut)
        XCTAssertNil(store.error, "not being signed in is the normal answer, not a failure")
    }

    @MainActor
    func testBootstrapKeepsARealFailureVisible() async throws {
        StubURLProtocol.enqueue(status: 500, json: #"{"error":"Something broke."}"#)
        let store = SessionStore(client: StubURLProtocol.client(), cache: scratchCache())
        await store.bootstrap()
        XCTAssertEqual(store.state, .signedOut)
        XCTAssertEqual(store.error, .server(message: "Something broke.", status: 500))
    }

    @MainActor
    func testSigningInScopesTheCacheToTheAccount() async throws {
        let cache = scratchCache()
        let session = try Fixtures.data("session")
        let response = try XCTUnwrap(
            (try JSONSerialization.jsonObject(with: session) as? [String: Any])?["response"])
        let json = String(
            decoding: try JSONSerialization.data(withJSONObject: response), as: UTF8.self)
        StubURLProtocol.enqueue(status: 200, json: json)
        let store = SessionStore(client: StubURLProtocol.client(), cache: cache)
        await store.bootstrap()
        XCTAssertTrue(store.state.isSignedIn)
        let scope = await cache.scope
        XCTAssertEqual(scope, store.user?.id)
    }

    /// C8. `APIClient.clearCookies()` enumerates cookies for the *current* base URL, so clearing
    /// after the switch deleted the new server's cookies and left the old server's session live.
    @MainActor
    func testSwitchingServersClearsTheOldServersCookie() async throws {
        let oldServer = try XCTUnwrap(ServerConfiguration(text: "http://127.0.0.1:8080"))
        let newServer = try XCTUnwrap(ServerConfiguration(text: "http://10.0.0.24:8080"))
        let cookie = try XCTUnwrap(
            HTTPCookie(properties: [
                .domain: "127.0.0.1", .path: "/", .name: "adler_session",
                .value: "fictional-session", .expires: Date().addingTimeInterval(3600),
            ]))
        HTTPCookieStorage.shared.setCookie(cookie)
        XCTAssertFalse(HTTPCookieStorage.shared.cookies(for: oldServer.baseURL)?.isEmpty ?? true)

        let client = APIClient(
            configuration: oldServer,
            session: StubURLProtocol.session())
        StubURLProtocol.enqueue(status: 401, json: #"{"error":"Sign in."}"#)
        let store = SessionStore(
            client: client, cache: scratchCache(),
            configuration: oldServer)
        await store.apply(serverConfiguration: newServer)

        XCTAssertTrue(
            HTTPCookieStorage.shared.cookies(for: oldServer.baseURL)?.isEmpty ?? true,
            "the old server's session must not survive the switch")
        XCTAssertEqual(store.serverConfiguration, newServer)
    }

    // MARK: - ViewCache

    func testCacheRoundTripsAndClears() async throws {
        let cache = scratchCache()
        await cache.clear()
        let today = try Fixtures.load(TodayView.self, "today").response
        await cache.save(today, key: "today")
        let loaded = await cache.load(TodayView.self, key: "today")
        XCTAssertEqual(loaded, today)
        await cache.clear()
        let gone = await cache.load(TodayView.self, key: "today")
        XCTAssertNil(gone)
    }

    func testCacheKeepsAccountsApart() async throws {
        let cache = scratchCache()
        await cache.clear()
        let today = try Fixtures.load(TodayView.self, "today").response
        await cache.use(scope: "user-a")
        await cache.save(today, key: "today")
        let mine = await cache.load(TodayView.self, key: "today")
        XCTAssertNotNil(mine)

        await cache.use(scope: "user-b")
        let theirs = await cache.load(TodayView.self, key: "today")
        XCTAssertNil(theirs, "one account must never read another's cached views")
        await cache.clear()
    }

    func testCacheRemembersItsScopeAcrossLaunches() async throws {
        let suite = "adler.tests.\(UUID().uuidString)"
        let first = ViewCache(
            directoryName: "AdlerTests-scope", defaults: UserDefaults(suiteName: suite) ?? .standard)
        await first.clear()
        await first.use(scope: "user-a")
        let today = try Fixtures.load(TodayView.self, "today").response
        await first.save(today, key: "today")

        // A cold start reads the cache before anyone knows who is signed in.
        let second = ViewCache(
            directoryName: "AdlerTests-scope", defaults: UserDefaults(suiteName: suite) ?? .standard)
        let scope = await second.scope
        XCTAssertEqual(scope, "user-a")
        let restored = await second.load(TodayView.self, key: "today")
        XCTAssertNotNil(restored)
        await second.clear()

        let third = ViewCache(
            directoryName: "AdlerTests-scope", defaults: UserDefaults(suiteName: suite) ?? .standard)
        let cleared = await third.scope
        XCTAssertNil(cleared, "signing out forgets the scope as well as the files")
    }

    // MARK: - SSEClient

    func testRevisionLineParsing() {
        XCTAssertEqual(SSEClient.revision(fromLine: #"data: {"revision":7}"#), 7)
        XCTAssertEqual(SSEClient.revision(fromLine: #"data:{"revision":0}"#), 0)
        XCTAssertNil(SSEClient.revision(fromLine: ": keep-alive"))
        XCTAssertNil(SSEClient.revision(fromLine: ""))
        XCTAssertNil(SSEClient.revision(fromLine: "event: message"))
        XCTAssertNil(SSEClient.revision(fromLine: #"data: {"other":1}"#))
        XCTAssertNil(SSEClient.revision(fromLine: "data: not json"))
    }

    @MainActor
    func testStartIsIdempotentAndStopDisconnects() async throws {
        let client = SSEClient(
            client: StubURLProtocol.client(),
            session: SSEClient.makeSession(protocolClasses: [StubURLProtocol.self]))
        StubURLProtocol.enqueue(status: 200, json: "", delay: 0.2)
        client.start { _ in }
        client.start { _ in }  // must not open a second stream
        try await Task.sleep(for: .milliseconds(120))
        XCTAssertEqual(
            StubURLProtocol.requests(path: "/api/events").count, 1,
            "start is idempotent — one stream, never two")
        client.stop()
        XCTAssertFalse(client.isConnected)
    }

    /// C7. Every non-2xx used to become the same anonymous transport error and reconnect forever
    /// on the 30 s backoff, so an expired cookie left the shell looking signed in.
    @MainActor
    func testA401StopsTheStreamAndReportsIt() async throws {
        let client = SSEClient(
            client: StubURLProtocol.client(),
            session: SSEClient.makeSession(protocolClasses: [StubURLProtocol.self]))
        let reported = Expectation()
        client.onUnauthenticated = { reported.fulfil() }
        StubURLProtocol.enqueue(status: 401, json: #"{"error":"Sign in."}"#)
        client.start { _ in }

        for _ in 0..<40 where !reported.isFulfilled {
            try await Task.sleep(for: .milliseconds(25))
        }
        XCTAssertTrue(reported.isFulfilled, "a 401 must surface, not retry silently")
        XCTAssertEqual(
            StubURLProtocol.requests(path: "/api/events").count, 1,
            "no reconnect into the same 401")
        XCTAssertFalse(client.isConnected)
    }
}

/// A tiny main-actor flag; `XCTestExpectation` cannot be fulfilled from a `@MainActor` closure
/// without extra ceremony in a `nonisolated` test class.
@MainActor
private final class Expectation {
    private(set) var isFulfilled = false
    func fulfil() { isFulfilled = true }
}
