import XCTest

@testable import Adler

// XCTestCase's overridable lifecycle members are nonisolated, and the target builds with
// SWIFT_DEFAULT_ACTOR_ISOLATION = MainActor — so the class opts out and the methods that touch
// `AppRouter` (which is `@MainActor`) opt back in.
nonisolated final class AppRouterTests: XCTestCase {

    @MainActor
    private func router() -> AppRouter {
        AppRouter()
    }

    private func url(_ string: String) throws -> URL {
        try XCTUnwrap(URL(string: string))
    }

    // MARK: - Tabs

    @MainActor
    func testTodayLinkSelectsTheCard() throws {
        let router = router()
        XCTAssertTrue(router.handle(url: try url("adler://today?card=learn")))
        XCTAssertEqual(router.selection, .today)
        XCTAssertEqual(router.todayCard, .learn)

        XCTAssertTrue(router.handle(url: try url("adler://today")))
        XCTAssertEqual(router.todayCard, .doNext)
    }

    /// Contract §7 spelling — what the server writes into `SourceView.deepLink`.
    @MainActor
    func testGoalLinkServerSpelling() throws {
        let router = router()
        XCTAssertTrue(router.handle(url: try url("adler://goals/g-42")))
        XCTAssertEqual(router.selection, .goals)
        XCTAssertEqual(router.goalsPath, [.goal(id: "g-42")])
    }

    /// DESIGN.md §2.4's older singular spelling has to reach the same place.
    @MainActor
    func testGoalLinkSingularSpellingReachesTheSamePlace() throws {
        let plural = router()
        let singular = router()
        XCTAssertTrue(plural.handle(url: try url("adler://goals/g-42")))
        XCTAssertTrue(singular.handle(url: try url("adler://goal/g-42")))
        XCTAssertEqual(plural.selection, singular.selection)
        XCTAssertEqual(plural.goalsPath, singular.goalsPath)
    }

    @MainActor
    func testGoalsListLinkClearsTheStack() throws {
        let router = router()
        router.push(.goal(id: "g-1"))
        router.push(.milestone(goalId: "g-1", id: "m-2"))
        XCTAssertTrue(router.handle(url: try url("adler://goals")))
        XCTAssertEqual(router.goalsPath, [])
    }

    @MainActor
    func testConversationLink() throws {
        let router = router()
        XCTAssertTrue(router.handle(url: try url("adler://coach/c-7")))
        XCTAssertEqual(router.selection, .coach)
        XCTAssertEqual(router.coachSegment, .conversation)
        XCTAssertEqual(router.coachPath, [.conversation(id: "c-7")])
    }

    @MainActor
    func testCoachRootLinkShowsTheConversationSegment() throws {
        let router = router()
        router.openRecord(id: "l-1")
        XCTAssertTrue(router.handle(url: try url("adler://coach")))
        XCTAssertEqual(router.coachSegment, .conversation)
        XCTAssertEqual(router.coachPath, [])
    }

    /// Both spellings of a learning record: contract §7 (`adler://insights/<id>`) and
    /// DESIGN.md §2.4 (`adler://coach/insights?record=<id>`).
    @MainActor
    func testLearningRecordLinkBothSpellings() throws {
        let contract = router()
        XCTAssertTrue(contract.handle(url: try url("adler://insights/l-9")))
        XCTAssertEqual(contract.selection, .coach)
        XCTAssertEqual(contract.coachSegment, .insights)
        XCTAssertEqual(contract.coachPath, [.record(id: "l-9")])

        let design = router()
        XCTAssertTrue(design.handle(url: try url("adler://coach/insights?record=l-9")))
        XCTAssertEqual(design.selection, contract.selection)
        XCTAssertEqual(design.coachSegment, contract.coachSegment)
        XCTAssertEqual(design.coachPath, contract.coachPath)
    }

    @MainActor
    func testInsightsListLinkHasNoRecordPushed() throws {
        let router = router()
        XCTAssertTrue(router.handle(url: try url("adler://insights")))
        XCTAssertEqual(router.coachSegment, .insights)
        XCTAssertEqual(router.coachPath, [])
    }

    @MainActor
    func testCalendarLinkCarriesTheWeek() throws {
        let router = router()
        XCTAssertTrue(router.handle(url: try url("adler://calendar?start=2026-09-14")))
        XCTAssertEqual(router.selection, .calendar)
        XCTAssertEqual(router.calendarWeekStart, YMD("2026-09-14"))
        XCTAssertEqual(router.calendarPath, [])
    }

    /// Settings is a sheet, so the link must not move the person off the tab they were on.
    @MainActor
    func testSettingsLinkPresentsASheetWithoutChangingTab() throws {
        let router = router()
        router.selectTab(.calendar)
        XCTAssertTrue(router.handle(url: try url("adler://settings/provider")))
        XCTAssertEqual(router.selection, .calendar)
        XCTAssertTrue(router.isSettingsPresented)
        XCTAssertEqual(router.settingsPage, .provider)
    }

    // MARK: - Bad links

    @MainActor
    func testUnparseableAdlerLinkRaisesTheMissingBanner() throws {
        let router = router()
        XCTAssertFalse(router.handle(url: try url("adler://nowhere/at-all")))
        XCTAssertTrue(router.deepLinkMissing)
        // Nothing moved.
        XCTAssertEqual(router.selection, .today)
        XCTAssertEqual(router.goalsPath, [])
    }

    @MainActor
    func testForeignSchemeIsIgnoredSilently() throws {
        let router = router()
        XCTAssertFalse(router.handle(url: try url("https://withadler.com/goals/g-1")))
        XCTAssertFalse(router.deepLinkMissing)
    }

    @MainActor
    func testHandlingAGoodLinkClearsTheMissingBanner() throws {
        let router = router()
        router.deepLinkMissing = true
        XCTAssertTrue(router.handle(url: try url("adler://goals/g-1")))
        XCTAssertFalse(router.deepLinkMissing)
    }

    // MARK: - Secondary identifiers

    /// The shell does not act on `message`/`decision`/`memory`/`record`, but it must not throw
    /// them away: the feature screen reads them off `lastRoute`.
    @MainActor
    func testSecondaryIdentifiersSurviveOnLastRoute() throws {
        let router = router()
        XCTAssertTrue(router.handle(url: try url("adler://coach/c-7?message=m-3")))
        XCTAssertEqual(router.lastRoute, .conversation(id: "c-7", messageId: "m-3"))
    }

    // MARK: - Stacks

    @MainActor
    func testPushSelectsTheOwningTab() {
        let router = router()
        router.push(.day(date: YMD("2026-09-14")))
        XCTAssertEqual(router.selection, .calendar)
        XCTAssertEqual(router.calendarPath, [.day(date: YMD("2026-09-14"))])

        router.push(.source(claimId: "claim-1"))
        XCTAssertEqual(router.selection, .coach)
        XCTAssertEqual(router.coachPath, [.source(claimId: "claim-1")])
    }

    @MainActor
    func testPopOnlyTouchesTheVisibleTab() {
        let router = router()
        router.push(.goal(id: "g-1"))
        router.push(.milestone(goalId: "g-1", id: "m-2"))
        router.push(.day(date: YMD("2026-09-14")))  // moves to Calendar

        router.pop()
        XCTAssertEqual(router.calendarPath, [])
        XCTAssertEqual(router.goalsPath, [.goal(id: "g-1"), .milestone(goalId: "g-1", id: "m-2")])

        router.selectTab(.goals)
        router.pop()
        XCTAssertEqual(router.goalsPath, [.goal(id: "g-1")])
    }

    @MainActor
    func testPopOnAnEmptyStackIsHarmless() {
        let router = router()
        router.selectTab(.today)
        router.pop()
        XCTAssertEqual(router.selection, .today)
    }

    @MainActor
    func testResetEmptiesTheShell() throws {
        let router = router()
        XCTAssertTrue(router.handle(url: try url("adler://goals/g-1")))
        router.push(.milestone(goalId: "g-1", id: "m-2"))
        router.presentSettings(page: .server)
        router.deepLinkMissing = true

        router.reset()

        XCTAssertEqual(router.selection, .today)
        XCTAssertEqual(router.todayCard, .doNext)
        XCTAssertEqual(router.goalsPath, [])
        XCTAssertEqual(router.coachSegment, .conversation)
        XCTAssertNil(router.calendarWeekStart)
        XCTAssertFalse(router.isSettingsPresented)
        XCTAssertNil(router.settingsPage)
        XCTAssertFalse(router.deepLinkMissing)
        XCTAssertNil(router.lastRoute)
    }

    // MARK: - Deferred route replay

    /// A link that arrives while signed out waits in `PendingDraft` and is replayed once, after
    /// sign-in — the path `AdlerApp.open(_:)` / `signedInChanged(to:)` takes.
    @MainActor
    func testDeferredRouteIsReplayedOnceAfterSignIn() throws {
        let defaults = try XCTUnwrap(UserDefaults(suiteName: #function))
        defaults.removePersistentDomain(forName: #function)
        defer { defaults.removePersistentDomain(forName: #function) }

        let draft = PendingDraft(defaults: defaults)
        let router = router()

        // Signed out: the link is stored, the shell does not move.
        let route = try XCTUnwrap(AppRoute(url: try url("adler://insights/l-9")))
        draft.pendingRoute = route
        XCTAssertEqual(router.selection, .today)

        // Sign-in: replay.
        let replayed = try XCTUnwrap(draft.takePendingRoute())
        router.go(replayed)
        XCTAssertEqual(router.selection, .coach)
        XCTAssertEqual(router.coachSegment, .insights)
        XCTAssertEqual(router.coachPath, [.record(id: "l-9")])

        // Once only, and not again after a relaunch.
        XCTAssertNil(draft.takePendingRoute())
        XCTAssertNil(PendingDraft(defaults: defaults).pendingRoute)
    }

    /// The deferred link survives a cold launch: it is written through `UserDefaults`.
    @MainActor
    func testDeferredRouteSurvivesRelaunchAndKeepsItsSpelling() throws {
        let defaults = try XCTUnwrap(UserDefaults(suiteName: #function))
        defaults.removePersistentDomain(forName: #function)
        defer { defaults.removePersistentDomain(forName: #function) }

        // Stored using DESIGN.md's spelling…
        PendingDraft(defaults: defaults).pendingRoute = AppRoute(
            url: try url("adler://goal/g-42"))

        // …restored after relaunch and routed to the same place.
        let restored = try XCTUnwrap(PendingDraft(defaults: defaults).takePendingRoute())
        let router = router()
        router.go(restored)
        XCTAssertEqual(router.selection, .goals)
        XCTAssertEqual(router.goalsPath, [.goal(id: "g-42")])
    }
}
