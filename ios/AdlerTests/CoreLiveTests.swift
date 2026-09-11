import Foundation
import XCTest

@testable import Adler

/// One real round trip against a running dev server, exercising the stores end to end.
///
/// Skipped unless `ADLER_LIVE=1`. It registers a **fictional** account named
/// `ios-core-<timestamp>` — never a real person's data — and leaves it behind in the dev
/// database. Point it elsewhere with `ADLER_BASE_URL`.
///
///     cd ios && ADLER_LIVE=1 xcodebuild -project Adler.xcodeproj -scheme Adler \
///       -destination 'platform=iOS Simulator,id=<udid>' -derivedDataPath .build \
///       -only-testing:AdlerTests/CoreLiveTests test
nonisolated final class CoreLiveTests: XCTestCase {

    private var isLive: Bool { ProcessInfo.processInfo.environment["ADLER_LIVE"] == "1" }

    private var baseURL: String {
        ProcessInfo.processInfo.environment["ADLER_BASE_URL"] ?? "http://localhost:8080"
    }

    @MainActor
    func testLiveRoundTrip() async throws {
        try XCTSkipUnless(isLive, "set ADLER_LIVE=1 to run against a dev server")

        let configuration = try XCTUnwrap(ServerConfiguration(text: baseURL))
        let client = APIClient(configuration: configuration)
        let cache = ViewCache(directoryName: "AdlerLiveTest")
        await cache.clear()

        let suite = "adler.tests.live"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defaults.removePersistentDomain(forName: suite)
        defer { defaults.removePersistentDomain(forName: suite) }

        let session = SessionStore(
            client: client, cache: cache, draft: PendingDraft(defaults: defaults),
            configuration: configuration)
        let workspace = WorkspaceStore(client: client, cache: cache)

        // 0. The server is up.
        let reachable = await session.ping(configuration)
        XCTAssertTrue(reachable, "dev server not reachable at \(baseURL)")

        // 1. Register a fictional account and bootstrap the typed session.
        let username = "ios-core-\(Int(Date().timeIntervalSince1970))"
        try await session.register(username: username, password: "example-password-1")
        let signedIn = try XCTUnwrap(session.state.session, "register did not produce a session")
        XCTAssertEqual(signedIn.user.username, username)
        XCTAssertFalse(signedIn.hasGoals)
        workspace.adopt(session: signedIn)
        let startingRevision = workspace.revision

        // 2. Every read the app makes on a fresh workspace.
        await workspace.loadToday()
        await workspace.loadGoals()
        await workspace.loadCoach()
        await workspace.loadInsights()
        await workspace.loadCalendar()
        await workspace.loadSettings()
        for key in [ViewKey.today, .goals, .coach, .insights, .settings] {
            XCTAssertNil(workspace.state(key).error, "\(key.cacheKey) failed")
            XCTAssertTrue(workspace.state(key).hasContent, "\(key.cacheKey) has no content")
        }
        let today = try XCTUnwrap(workspace.today)
        XCTAssertTrue(today.quietDay, "a brand new workspace has nothing to do")
        XCTAssertTrue(try XCTUnwrap(workspace.goals).rows.isEmpty)
        XCTAssertFalse(workspace.calendars.isEmpty)
        XCTAssertEqual(try XCTUnwrap(workspace.settings).methods.count, 7)
        workspace.adopt(session: signedIn)

        // 3. Create a draft goal with a first action through the shared command catalog.
        let goalId = "ios-core-goal"
        let actionDate = today.today
        let create = ChangeBuilder.change(
            .goal, .create, id: goalId, parentId: nil,
            reason: "Created by the iOS core round-trip check (fictional account).",
            values: [
                "title": .of("Draft the portfolio case studies"),
                "kind": .of(GoalKind.project.rawValue),
                "why": .of("The writing hour disappears once the workday starts."),
                "success": .of("Three case studies are published."),
                "area": .of(GoalArea.career.rawValue),
                "tags": .of([String]()),
                "targetDate": .of(""),
                "status": .of(GoalStatus.draft.rawValue),
                "milestones": .array([
                    .object([
                        "title": .of("First case study published"),
                        "criterion": .of("A published URL with the result."),
                    ])
                ]),
                "assessmentTarget": .of(8),
                "baseline": .null,
                "action": .of("Draft one case-study section"),
                "criterion": .of("One section is written end to end."),
                "timing": .of("Right after breakfast"),
                "actionDate": .of(actionDate),
            ])
        let created = try await workspace.apply(changes: [create], goalId: goalId)
        XCTAssertGreaterThan(created.revision, startingRevision, "a write must bump the revision")
        let draft = try XCTUnwrap(created.goal, "goalId was sent, so the detail must come back")
        XCTAssertEqual(draft.goal.status, .draft)
        XCTAssertEqual(draft.milestones.count, 1)
        XCTAssertEqual(draft.actions.count, 1)
        XCTAssertNil(workspace.pendingWrite, "a successful write clears the retry ticket")

        // 4. Start the plan. The refusal path is real: an unplanned draft is rejected by name.
        let afterCreate = workspace.revision
        let started = try await workspace.startGoal(id: goalId)
        XCTAssertGreaterThan(started.revision, afterCreate)
        XCTAssertEqual(try XCTUnwrap(started.goal).goal.status, .active)

        // 5. Start and report today's action.
        let actionId = try XCTUnwrap(
            started.goal?.actions.first?.id, "the started plan should have an action")
        let afterStart = workspace.revision
        let begun = try await workspace.startAction(id: actionId, goalId: goalId)
        XCTAssertGreaterThan(begun.revision, afterStart)
        XCTAssertNotNil(begun.goal?.action(actionId)?.startedAt)

        let afterBegin = workspace.revision
        let reported = try await workspace.reportAction(
            id: actionId, goalId: goalId, outcome: .done, minutes: 25,
            note: "Reported by the iOS core round-trip check.")
        XCTAssertGreaterThan(reported.revision, afterBegin)
        let action = try XCTUnwrap(reported.goal?.action(actionId))
        XCTAssertEqual(action.outcome, .done)
        XCTAssertEqual(action.actualMinutes, 25)
        // An unknown amount stays unknown; it is never recorded as a measured zero.
        XCTAssertNil(action.amount)
        XCTAssertEqual(action.execution, .done)
        XCTAssertEqual(action.executionLabel, "Done")
        XCTAssertEqual(reported.today.doneCount, 1)

        // 6. Idempotent replay: the identical requestId returns the first result unchanged.
        let replayRevision = workspace.revision
        let replayId = UUID().uuidString
        let replayChange = ChangeBuilder.reportAction(
            id: actionId, goalId: goalId, outcome: .partly, minutes: 10,
            reason: "Corrected by the round-trip check.")
        let request = ChangesRequest(
            changes: [replayChange], revision: replayRevision, requestId: replayId,
            goalId: goalId)
        let first = try await client.send(Endpoints.changes(request))
        XCTAssertGreaterThan(first.revision, replayRevision)
        let afterFirst = try XCTUnwrap(first.goal?.action(actionId))
        XCTAssertEqual(afterFirst.outcome, .partly)

        let second = try await client.send(Endpoints.changes(request))
        XCTAssertEqual(
            second.revision, first.revision,
            "replaying the same requestId must not apply the change twice")
        let afterSecond = try XCTUnwrap(second.goal?.action(actionId))
        XCTAssertEqual(afterSecond.outcome, .partly)
        XCTAssertEqual(
            afterSecond.history.count, afterFirst.history.count,
            "a replay must not append another correction")

        // Reusing the id with different content is a 400, not a silent second write.
        do {
            _ = try await client.send(
                Endpoints.changes(
                    ChangesRequest(
                        changes: [
                            ChangeBuilder.reportAction(
                                id: actionId, goalId: goalId, outcome: .done)
                        ], revision: first.revision, requestId: replayId, goalId: goalId)))
            XCTFail("a reused requestId with different changes must be refused")
        } catch {
            XCTAssertEqual(
                error.serverMessage, "A request ID cannot be reused for different changes.")
        }

        // 7. A stale revision is refused with the server's current one.
        do {
            _ = try await client.send(
                Endpoints.changes(
                    ChangesRequest(
                        changes: [
                            ChangeBuilder.setGoalStatus(id: goalId, status: .paused)
                        ], revision: 0, requestId: UUID().uuidString, goalId: goalId)))
            XCTFail("a stale revision must be refused")
        } catch {
            guard case .staleRevision(let current) = error else {
                return XCTFail("expected staleRevision, got \(error)")
            }
            XCTAssertEqual(current, first.revision)
        }

        // 8. The stale-revision recovery refetches and rethrows, leaving a retry ticket.
        workspace.markVisible(.goal(goalId))
        // Force the store's revision out of date, then let a mutation hit the 409 path.
        _ = try await client.send(
            Endpoints.changes(
                ChangesRequest(
                    changes: [ChangeBuilder.saveMemory(text: "Round-trip check memory.")],
                    revision: first.revision, requestId: UUID().uuidString, goalId: nil)))
        do {
            _ = try await workspace.setGoalStatus(id: goalId, status: .paused)
            XCTFail("expected the stale write to be refused")
        } catch {
            guard case .staleRevision = error else {
                return XCTFail("expected staleRevision, got \(error)")
            }
        }
        XCTAssertNotNil(workspace.pendingWrite, "the retry ticket keeps the original requestId")
        let ticket = try XCTUnwrap(workspace.pendingWrite)
        let retryResult = try await workspace.retryPendingWrite()
        let retried = try XCTUnwrap(retryResult)
        XCTAssertEqual(workspace.pendingWrite, nil)
        XCTAssertEqual(retried.goal?.goal.status, .paused)
        XCTAssertEqual(ticket.requestId, ticket.requestId)

        // 9. Reads reflect everything.
        await workspace.loadGoals()
        let goals = try XCTUnwrap(workspace.goals)
        XCTAssertEqual(goals.rows.count, 1)
        XCTAssertEqual(goals.rows.first?.goal.status, .paused)
        XCTAssertEqual(goals.revision, workspace.revision)

        await workspace.loadInsights()
        XCTAssertEqual(try XCTUnwrap(workspace.insights).memories.count, 1)

        // 10. Sign out and confirm the session really ended.
        await session.logout()
        XCTAssertFalse(session.state.isSignedIn)
        do {
            _ = try await client.send(Endpoints.session())
            XCTFail("the session cookie should be gone")
        } catch {
            XCTAssertEqual(error, .unauthenticated)
        }
        await cache.clear()
    }

    /// One real coaching turn. Separately gated (`ADLER_LIVE_COACH=1`) because it spends a
    /// provider call and the chat route is rate limited to 20 per minute.
    @MainActor
    func testLiveCoachTurn() async throws {
        try XCTSkipUnless(isLive, "set ADLER_LIVE=1 to run against a dev server")
        try XCTSkipUnless(
            ProcessInfo.processInfo.environment["ADLER_LIVE_COACH"] == "1",
            "set ADLER_LIVE_COACH=1 to spend a provider call")

        let configuration = try XCTUnwrap(ServerConfiguration(text: baseURL))
        let client = APIClient(configuration: configuration)
        let cache = ViewCache(directoryName: "AdlerLiveCoach")
        let suite = "adler.tests.livecoach"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defaults.removePersistentDomain(forName: suite)
        defer { defaults.removePersistentDomain(forName: suite) }

        let session = SessionStore(
            client: client, cache: cache, draft: PendingDraft(defaults: defaults),
            configuration: configuration)
        let workspace = WorkspaceStore(client: client, cache: cache)
        try await session.register(
            username: "ios-core-\(Int(Date().timeIntervalSince1970))-coach",
            password: "example-password-1")
        let signedIn = try XCTUnwrap(session.state.session)
        try XCTSkipUnless(signedIn.coachConfigured, "this server has no usable provider key")
        workspace.adopt(session: signedIn)

        // The goal-first onboarding hand-off: the stored draft becomes the first message.
        session.draft.text = "Publish three case studies by the end of the year"
        let opening = try XCTUnwrap(session.draft.coachOpening)

        let reply = try await workspace.sendCoachMessage(text: opening)
        XCTAssertFalse(reply.reply.isEmpty)
        XCTAssertFalse(reply.conversationId.isEmpty)
        XCTAssertGreaterThan(reply.revision, 0)
        XCTAssertFalse(reply.model.isEmpty)
        XCTAssertNil(workspace.pendingCoach, "a completed turn clears the retry ticket")
        session.draft.clear()

        let conversation = try XCTUnwrap(workspace.conversations[reply.conversationId])
        XCTAssertEqual(conversation.selectedConversationId, reply.conversationId)
        XCTAssertTrue(conversation.messages.contains { $0.role == .user && $0.text == opening })
        XCTAssertTrue(conversation.messages.contains { $0.role == .coach })

        await session.logout()
        await cache.clear()
    }

    /// The one refusal the goal-first onboarding flow will actually hit: an unplanned Draft has
    /// no first action, and the server says so in words the UI shows verbatim.
    @MainActor
    func testLiveUnplannedDraftCannotStart() async throws {
        try XCTSkipUnless(isLive, "set ADLER_LIVE=1 to run against a dev server")

        let configuration = try XCTUnwrap(ServerConfiguration(text: baseURL))
        let client = APIClient(configuration: configuration)
        let cache = ViewCache(directoryName: "AdlerLiveTest2")
        let suite = "adler.tests.live2"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defaults.removePersistentDomain(forName: suite)
        defer { defaults.removePersistentDomain(forName: suite) }

        let session = SessionStore(
            client: client, cache: cache, draft: PendingDraft(defaults: defaults),
            configuration: configuration)
        let workspace = WorkspaceStore(client: client, cache: cache)
        let username = "ios-core-\(Int(Date().timeIntervalSince1970))-draft"
        try await session.register(username: username, password: "example-password-1")
        workspace.adopt(session: try XCTUnwrap(session.state.session))

        let goalId = "ios-core-unplanned"
        _ = try await workspace.apply(
            changes: [
                ChangeBuilder.createDraftGoal(
                    id: goalId,
                    title: "Read the four books on my shelf",
                    kind: .practical,
                    why: "They have been sitting there since spring.",
                    success: "All four are finished.")
            ], goalId: goalId)

        do {
            _ = try await workspace.startGoal(id: goalId)
            XCTFail("an unplanned draft must not start")
        } catch {
            XCTAssertEqual(
                error.serverMessage, "Choose a first action before starting this goal’s plan.")
        }

        await session.logout()
        await cache.clear()
    }
}
