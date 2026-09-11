import Foundation
import XCTest

@testable import Adler

/// `WorkspaceStore` is where all the stateful risk lives — revision monotonicity, the retry
/// ticket, 409 recovery, `sessionExpired` propagation, cache save/clear ordering — and none of it
/// ran by default before these tests. Everything here drives the real store against
/// `StubURLProtocol`; no live server.
nonisolated final class CoreStoreTests: XCTestCase {

    override func setUp() {
        super.setUp()
        StubURLProtocol.reset()
    }

    // MARK: - Helpers

    @MainActor
    private func makeStore(cacheName: String = #function) async -> (WorkspaceStore, ViewCache) {
        let cache = ViewCache(
            directoryName: "AdlerTests-\(cacheName.replacingOccurrences(of: "()", with: ""))",
            defaults: Self.scratchDefaults())
        await cache.clear()
        return (WorkspaceStore(client: StubURLProtocol.client(), cache: cache), cache)
    }

    /// A `UserDefaults` suite of its own, so a test's cache scope never touches the real one.
    private static func scratchDefaults() -> UserDefaults {
        UserDefaults(suiteName: "adler.tests.\(UUID().uuidString)") ?? .standard
    }

    /// The smallest body `TodayView` decodes, with a settable revision.
    private func todayJSON(revision: Int) throws -> String {
        let data = try Fixtures.data("today")
        let envelope = try XCTUnwrap(
            JSONSerialization.jsonObject(with: data) as? [String: Any])
        var response = try XCTUnwrap(envelope["response"] as? [String: Any])
        response["revision"] = revision
        let encoded = try JSONSerialization.data(withJSONObject: response)
        return String(decoding: encoded, as: UTF8.self)
    }

    /// A `WriteResult`: `{ revision, today }`, `goal` omitted.
    private func writeResultJSON(revision: Int) throws -> String {
        let today = try todayJSON(revision: revision)
        return #"{"revision":\#(revision),"today":\#(today)}"#
    }

    // MARK: - C1 · the retry ticket pins the revision

    /// The server's idempotency key is `digest({changes, revision})`. Replaying the original
    /// `requestId` with a *newer* revision is refused with 400 "A request ID cannot be reused for
    /// different changes." — so a write that actually landed would show as a permanent failure.
    @MainActor
    func testRetryResendsTheOriginalRequestIdAndTheOriginalRevision() async throws {
        let (store, _) = await makeStore()
        StubURLProtocol.enqueue(status: 200, json: try todayJSON(revision: 11))
        store.markVisible(.today)
        await store.loadToday()
        XCTAssertEqual(store.revision, 11)

        // The write times out; the server applied it and broadcast revision 12.
        StubURLProtocol.enqueue(error: URLError(.timedOut))
        do {
            try await store.reportAction(id: "a", goalId: "g", outcome: .done, minutes: 20)
            XCTFail("expected a timeout")
        } catch {
            XCTAssertTrue(error.isRetryableWithSameRequestID)
        }
        let ticket = try XCTUnwrap(store.pendingWrite)
        XCTAssertEqual(ticket.revision, 11)

        StubURLProtocol.enqueue(status: 200, json: try todayJSON(revision: 12))
        await store.handleRevisionEvent(12)
        XCTAssertEqual(store.revision, 12)

        StubURLProtocol.enqueue(status: 200, json: try writeResultJSON(revision: 12))
        _ = try await store.retryPendingWrite()

        let writes = StubURLProtocol.requests(path: "/api/app/changes")
        XCTAssertEqual(writes.count, 2)
        let first = try XCTUnwrap(writes.first?.json)
        let second = try XCTUnwrap(writes.last?.json)
        XCTAssertEqual(first["requestId"] as? String, second["requestId"] as? String)
        XCTAssertEqual(first["revision"] as? Int, 11)
        XCTAssertEqual(
            second["revision"] as? Int, 11,
            "the replay must carry the revision the first attempt was hashed with")
        XCTAssertNil(store.pendingWrite, "a successful replay clears the ticket")
    }

    /// A 409 is thrown before the idempotency row is written, so the replay needs a *new* id and
    /// the server's current revision — the opposite of the timeout case.
    @MainActor
    func testAStaleRevisionMintsAFreshTicket() async throws {
        let (store, _) = await makeStore()
        StubURLProtocol.enqueue(status: 200, json: try todayJSON(revision: 4))
        await store.loadToday()

        StubURLProtocol.enqueue(status: 409, json: #"{"error":"stale","revision":9}"#)
        StubURLProtocol.enqueue(status: 200, json: try todayJSON(revision: 9))  // recovery refetch
        do {
            try await store.reportAction(id: "a", goalId: "g", outcome: .done)
            XCTFail("expected a stale revision")
        } catch {
            XCTAssertEqual(error, .staleRevision(current: 9))
        }
        XCTAssertEqual(store.revision, 9, "the store takes the server's revision")
        let ticket = try XCTUnwrap(store.pendingWrite)
        XCTAssertEqual(ticket.revision, 9, "the fresh ticket carries the current revision")

        let firstId = try XCTUnwrap(
            StubURLProtocol.requests(path: "/api/app/changes").first?.json?["requestId"] as? String)
        XCTAssertNotEqual(ticket.requestId, firstId, "a 409 replay needs a new request id")
    }

    // MARK: - C6 · revision monotonicity and refresh coalescing

    @MainActor
    func testRevisionNeverMovesBackwards() async throws {
        let (store, _) = await makeStore()
        StubURLProtocol.enqueue(status: 200, json: try todayJSON(revision: 9))
        store.markVisible(.today)
        await store.handleRevisionEvent(9)
        XCTAssertEqual(store.revision, 9)

        // A replayed or out-of-order frame must be ignored outright — no refetch either.
        await store.handleRevisionEvent(7)
        XCTAssertEqual(store.revision, 9)
        XCTAssertEqual(StubURLProtocol.requests(path: "/api/app/today").count, 1)
    }

    /// Two revisions arriving inside one refresh window used to run `refreshVisible()` twice in
    /// parallel: two GETs for the same key in flight at once, and the *earlier* response could be
    /// assigned last.
    @MainActor
    func testConcurrentRefreshesNeverOverlap() async throws {
        let (store, _) = await makeStore()
        store.markVisible(.today)
        for _ in 0..<6 {
            StubURLProtocol.enqueue(status: 200, json: try todayJSON(revision: 3), delay: 0.05)
        }

        async let first: Void = store.handleRevisionEvent(2)
        async let second: Void = store.handleRevisionEvent(3)
        async let third: Void = store.refreshVisible()
        _ = await (first, second, third)

        XCTAssertEqual(
            StubURLProtocol.peakConcurrency, 1,
            "requests must be strictly sequential, never two for one key at once")
        XCTAssertLessThanOrEqual(
            StubURLProtocol.requests(path: "/api/app/today").count, 2,
            "a burst coalesces into the in-flight round plus at most one follow-up")
    }

    // MARK: - C7 · 401 is never invisible

    @MainActor
    func testEveryStoreCallMapsA401ToSessionExpired() async throws {
        let unauthorised = #"{"error":"Sign in to your workspace."}"#

        // Each entry is one public method that used to swallow the 401 entirely.
        let calls: [(String, @MainActor (WorkspaceStore) async -> Void)] = [
            ("loadToday", { await $0.loadToday() }),
            ("reactToMessage", { try? await $0.reactToMessage(id: "m", reaction: .like) }),
            ("providerStatus", { _ = try? await $0.providerStatus() }),
            (
                "saveProvider",
                { _ = try? await $0.saveProvider(provider: "gemini", model: "m", useServer: true) }
            ),
            ("testProvider", { _ = try? await $0.testProvider() }),
            ("connections", { _ = try? await $0.connections() }),
            ("pairPhone", { _ = try? await $0.pairPhone(address: "+10000000000") }),
            ("unlinkPhone", { try? await $0.unlinkPhone() }),
            (
                "createToken",
                { _ = try? await $0.createToken(name: "n", scope: .mcp, days: 7) }
            ),
            ("revokeToken", { try? await $0.revokeToken(id: "t") }),
            ("externalCalendars", { _ = try? await $0.externalCalendars() }),
            ("disconnectCalendar", { try? await $0.disconnectCalendar(provider: "google") }),
            (
                "connectAppleCalendar",
                {
                    try? await $0.connectAppleCalendar(
                        email: "casey@example.com", password: "fictional")
                }
            ),
            ("deleteGoal", { _ = try? await $0.deleteGoal(id: "g") }),
            ("startAction", { _ = try? await $0.startAction(id: "a", goalId: "g") }),
            ("startGoal", { _ = try? await $0.startGoal(id: "g") }),
            (
                "sendCoachMessage",
                { _ = try? await $0.sendCoachMessage(text: "hello") }
            ),
        ]

        for (name, call) in calls {
            StubURLProtocol.reset()
            let (store, _) = await makeStore(cacheName: "401-\(name)")
            // Enough 401s for the call and any follow-up load it makes.
            for _ in 0..<6 { StubURLProtocol.enqueue(status: 401, json: unauthorised) }
            await call(store)
            XCTAssertTrue(store.sessionExpired, "\(name) must set sessionExpired on a 401")
        }
    }

    // MARK: - C4 · a write's cache save can never land after sign-out

    @MainActor
    func testResetLeavesTheCacheEmptyEvenWithAWriteJustAbsorbed() async throws {
        let (store, cache) = await makeStore()
        StubURLProtocol.enqueue(status: 200, json: try writeResultJSON(revision: 2))
        _ = try await store.reportAction(id: "a", goalId: "g", outcome: .done)
        let saved = await cache.load(TodayView.self, key: ViewKey.today.cacheKey)
        XCTAssertNotNil(saved, "a write persists Today for the next cold start")

        await store.reset()
        let afterReset = await cache.load(TodayView.self, key: ViewKey.today.cacheKey)
        XCTAssertNil(afterReset, "sign-out must not leave the previous account's views on disk")
        XCTAssertNil(store.today)
        XCTAssertEqual(store.revision, 0)
    }

    /// C20: the big per-record payloads were written on every load and never read back.
    @MainActor
    func testOnlyRestorableViewsAreWrittenToDisk() async throws {
        let (store, cache) = await makeStore()
        StubURLProtocol.enqueue(status: 200, json: try todayJSON(revision: 1))
        await store.loadToday()
        let goal = try Fixtures.load(GoalDetailView.self, "goal-detail").response
        let goalJSON = String(decoding: try JSONEncoder().encode(goal), as: UTF8.self)
        StubURLProtocol.enqueue(status: 200, json: goalJSON)
        await store.loadGoal(id: goal.goal.id)

        let restoredToday = await cache.load(TodayView.self, key: ViewKey.today.cacheKey)
        XCTAssertNotNil(restoredToday)
        let restoredGoal = await cache.load(
            GoalDetailView.self, key: ViewKey.goal(goal.goal.id).cacheKey)
        XCTAssertNil(restoredGoal, "a goal detail is never restored, so it is never written")
    }

    // MARK: - Retry ticket semantics

    @MainActor
    func testASuccessfulWriteClearsTheTicketAndAbsorbsTheResult() async throws {
        let (store, _) = await makeStore()
        StubURLProtocol.enqueue(status: 200, json: try writeResultJSON(revision: 21))
        let result = try await store.reportAction(id: "a", goalId: "g", outcome: .done, amount: 25)
        XCTAssertEqual(result.revision, 21)
        XCTAssertEqual(store.revision, 21)
        XCTAssertNotNil(store.today)
        XCTAssertNil(store.pendingWrite)

        // The amount is on the wire; an absent one is omitted, never sent as null.
        let body = try XCTUnwrap(StubURLProtocol.requests(path: "/api/app/changes").first?.json)
        let changes = try XCTUnwrap(body["changes"] as? [[String: Any]])
        let values = try XCTUnwrap(changes.first?["values"] as? String)
        XCTAssertTrue(values.contains("\"amount\":25"))
    }

    @MainActor
    func testDiscardingATicketDropsIt() async throws {
        let (store, _) = await makeStore()
        StubURLProtocol.enqueue(error: URLError(.notConnectedToInternet))
        _ = try? await store.reportAction(id: "a", goalId: "g", outcome: .partly)
        XCTAssertNotNil(store.pendingWrite)
        store.discardPendingWrite()
        XCTAssertNil(store.pendingWrite)
        let nothing = try await store.retryPendingWrite()
        XCTAssertNil(nothing)
    }

    // MARK: - Cold start

    @MainActor
    func testAnotherAccountSigningInDropsTheRestoredViews() async throws {
        let (store, cache) = await makeStore()
        await cache.use(scope: "user-a")
        StubURLProtocol.enqueue(status: 200, json: try writeResultJSON(revision: 5))
        _ = try await store.reportAction(id: "a", goalId: "g", outcome: .done)
        await store.restoreFromCache()
        XCTAssertNotNil(store.today)

        let other = try Fixtures.load(SessionView.self, "session").response
        store.adopt(session: other)
        XCTAssertNil(
            store.today,
            "a different account must not inherit the previous person's cached Today")
    }
}
