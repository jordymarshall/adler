import Foundation
import XCTest

@testable import Adler

/// Deep links arrive from two places with slightly different spellings: the app's own links
/// (DESIGN.md §2.4) and `SourceView.deepLink` written by the server (contract §7). Both must
/// resolve to the same destination.
nonisolated final class CoreRouteTests: XCTestCase {

    private func route(_ string: String) throws -> AppRoute {
        try XCTUnwrap(AppRoute(string: string), "failed to parse \(string)")
    }

    func testTodayLinks() throws {
        XCTAssertEqual(try route("adler://today"), .today(card: .doNext))
        XCTAssertEqual(try route("adler://today?card=do"), .today(card: .doNext))
        XCTAssertEqual(try route("adler://today?card=progress"), .today(card: .progress))
        XCTAssertEqual(try route("adler://today?card=learn"), .today(card: .learn))
        // An unknown card falls back to the first one rather than failing the link.
        XCTAssertEqual(try route("adler://today?card=elsewhere"), .today(card: .doNext))
        XCTAssertEqual(try route("adler://today").tab, .today)
    }

    func testGoalLinksAcceptBothSpellings() throws {
        // Contract §7.
        XCTAssertEqual(
            try route("adler://goals/portfolio"), .goal(id: "portfolio", recordId: nil))
        XCTAssertEqual(
            try route("adler://goals/portfolio?record=result-1"),
            .goal(id: "portfolio", recordId: "result-1"))
        // DESIGN.md §2.4.
        XCTAssertEqual(
            try route("adler://goal/portfolio"), .goal(id: "portfolio", recordId: nil))
        XCTAssertEqual(try route("adler://goals"), .goals)
        XCTAssertEqual(try route("adler://goals/portfolio").tab, .goals)
    }

    func testCoachLinks() throws {
        XCTAssertEqual(
            try route("adler://coach/chat-portfolio"),
            .conversation(id: "chat-portfolio", messageId: nil))
        XCTAssertEqual(
            try route("adler://coach/chat-portfolio?message=message-1"),
            .conversation(id: "chat-portfolio", messageId: "message-1"))
        XCTAssertEqual(try route("adler://coach?goal=portfolio"), .coach(goalId: "portfolio"))
        XCTAssertEqual(try route("adler://coach"), .coach(goalId: nil))
        XCTAssertEqual(try route("adler://coach/chat-1").tab, .coach)
    }

    func testInsightsLinks() throws {
        XCTAssertEqual(
            try route("adler://insights/learning-breakfast-cue"),
            .insights(recordId: "learning-breakfast-cue", decisionId: nil, memoryId: nil))
        XCTAssertEqual(
            try route("adler://insights?decision=decision-portfolio-cue"),
            .insights(recordId: nil, decisionId: "decision-portfolio-cue", memoryId: nil))
        XCTAssertEqual(
            try route("adler://insights?memory=memory-morning"),
            .insights(recordId: nil, decisionId: nil, memoryId: "memory-morning"))
        // DESIGN.md's spelling of the same screen.
        XCTAssertEqual(
            try route("adler://coach/insights?record=learning-breakfast-cue"),
            .insights(recordId: "learning-breakfast-cue", decisionId: nil, memoryId: nil))
        XCTAssertEqual(try route("adler://insights/x").tab, .coach)
        XCTAssertTrue(try route("adler://insights/x").showsInsightsSegment)
    }

    func testCalendarAndSettingsLinks() throws {
        XCTAssertEqual(
            try route("adler://calendar?start=2026-09-11"),
            .calendar(start: YMD("2026-09-11"), goalId: nil))
        XCTAssertEqual(
            try route("adler://calendar?goal=guide"), .calendar(start: nil, goalId: "guide"))
        XCTAssertEqual(try route("adler://settings/program"), .settings(page: .program))
        XCTAssertEqual(try route("adler://settings"), .settings(page: nil))
        // Settings is a sheet, not a tab, so it does not steal the current tab.
        XCTAssertNil(try route("adler://settings/program").tab)
    }

    func testPercentEncodedIdentifiersAreDecoded() throws {
        XCTAssertEqual(
            try route("adler://goals/case%20study%201"),
            .goal(id: "case study 1", recordId: nil))
    }

    func testUnknownAndForeignURLsAreRejected() {
        XCTAssertNil(AppRoute(string: "https://withadler.com/app/today"))
        XCTAssertNil(AppRoute(string: "adler://wormhole"))
        XCTAssertNil(AppRoute(string: "not a url at all ///"))
    }

    func testRoundTripThroughURL() throws {
        let routes: [AppRoute] = [
            .today(card: .doNext),
            .today(card: .learn),
            .goals,
            .goal(id: "portfolio", recordId: nil),
            .goal(id: "portfolio", recordId: "result-1"),
            .coach(goalId: nil),
            .coach(goalId: "guide"),
            .conversation(id: "chat-portfolio", messageId: nil),
            .conversation(id: "chat-portfolio", messageId: "message-1"),
            .insights(recordId: "learning-breakfast-cue", decisionId: nil, memoryId: nil),
            .insights(recordId: nil, decisionId: "decision-1", memoryId: nil),
            .insights(recordId: nil, decisionId: nil, memoryId: "memory-morning"),
            .calendar(start: YMD("2026-09-11"), goalId: nil),
            .calendar(start: nil, goalId: "guide"),
            .settings(page: nil),
            .settings(page: .program),
            .settings(page: .checkIns),
        ]
        for value in routes {
            XCTAssertEqual(
                AppRoute(url: value.url), value,
                "\(value) did not survive \(value.url.absoluteString)")
        }
    }

    func testEveryServerGeneratedLinkShapeResolves() throws {
        // The exact templates in docs/ios-api-contract.md §7.
        let links = [
            "adler://insights/learning-1",
            "adler://insights?decision=decision-1",
            "adler://insights?memory=memory-1",
            "adler://coach/chat-1?message=message-1",
            "adler://coach?goal=portfolio",
            "adler://goals/portfolio",
            "adler://goals/portfolio?record=action-1",
            "adler://calendar?goal=portfolio",
            "adler://settings/program",
        ]
        for link in links {
            XCTAssertNotNil(AppRoute(string: link), "\(link) did not resolve")
        }
    }

    func testDeepLinksInTheInsightsFixtureAllResolve() throws {
        let insights = try Fixtures.load(InsightsView.self, "insights").response
        let links =
            (insights.tryingNow + insights.learned + insights.history)
            .flatMap(\.sources)
            .compactMap(\.deepLink)
            + insights.observations.flatMap { $0.sources + $0.resultSources }
            .compactMap(\.deepLink)
        XCTAssertFalse(links.isEmpty, "the fixture should carry at least one deep link")
        for link in links {
            XCTAssertNotNil(AppRoute(string: link), "\(link) did not resolve")
        }
    }

    // MARK: - Pending draft

    @MainActor
    func testPendingDraftSurvivesAndBuildsTheCoachOpening() throws {
        let suite = "adler.tests.draft"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defaults.removePersistentDomain(forName: suite)
        defer { defaults.removePersistentDomain(forName: suite) }

        let draft = PendingDraft(defaults: defaults)
        XCTAssertFalse(draft.hasText)
        XCTAssertNil(draft.coachOpening)

        draft.text = "  Publish three case studies  "
        XCTAssertTrue(draft.hasText)
        XCTAssertEqual(
            draft.coachOpening,
            "Help me develop this goal and a plan around how I work: Publish three case studies")

        // A fresh instance reads the same store, which is what survives register/login.
        XCTAssertEqual(PendingDraft(defaults: defaults).text, "  Publish three case studies  ")

        draft.clear()
        XCTAssertEqual(PendingDraft(defaults: defaults).text, "")
    }

    @MainActor
    func testPendingRouteIsHandedBackOnce() throws {
        let suite = "adler.tests.route"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defaults.removePersistentDomain(forName: suite)
        defer { defaults.removePersistentDomain(forName: suite) }

        let draft = PendingDraft(defaults: defaults)
        draft.pendingRoute = .goal(id: "portfolio", recordId: nil)
        XCTAssertEqual(
            PendingDraft(defaults: defaults).pendingRoute, .goal(id: "portfolio", recordId: nil))
        XCTAssertEqual(draft.takePendingRoute(), .goal(id: "portfolio", recordId: nil))
        XCTAssertNil(draft.takePendingRoute())
        XCTAssertNil(PendingDraft(defaults: defaults).pendingRoute)
    }
}
