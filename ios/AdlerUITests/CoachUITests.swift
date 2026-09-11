import XCTest

/// The Coach tab end to end: both segments, a learning record pushed from Insights, and the
/// Current → Suggested preview behind `Review changes`.
///
/// Requires the dev server on `http://localhost:8080` (`npm run dev -- --port 8080`) with the
/// seeded fictional account `casey-example`, which the DEBUG "Developer sign-in" control uses.
/// It reads and previews only — no proposal is approved and no coach turn is spent.
nonisolated final class CoachUITests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    @MainActor
    private func coachApp(route: String = "adler://coach") -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments += ["-resetSession", "-route", route]
        app.launch()

        XCTAssertTrue(app.buttons["Developer sign-in"].waitForExistence(timeout: 15))
        app.buttons["Developer sign-in"].tap()
        XCTAssertTrue(app.navigationBars["Coach"].waitForExistence(timeout: 40))
        return app
    }

    @MainActor
    func testSegmentsSwitchBetweenConversationAndInsights() {
        let app = coachApp()

        // Conversation: the picker and the composer are both on screen.
        XCTAssertTrue(app.buttons["Conversations"].waitForExistence(timeout: 15))
        XCTAssertTrue(app.textFields["Message Adler"].waitForExistence(timeout: 10))

        app.buttons["Insights"].firstMatch.tap()
        // The goal filter is a tappable `AdlerChip`; match by label regardless of the exact
        // element type SwiftUI's accessibility bridging exposes it as.
        let goalFilter = app.descendants(matching: .any).matching(
            NSPredicate(format: "label == %@", "All goals")
        ).firstMatch
        XCTAssertTrue(goalFilter.waitForExistence(timeout: 15), "Insights shows the goal filter")
        XCTAssertFalse(app.textFields["Message Adler"].exists, "Insights has no composer")

        app.buttons["Conversation"].firstMatch.tap()
        XCTAssertTrue(app.textFields["Message Adler"].waitForExistence(timeout: 10))
    }

    @MainActor
    func testInsightsOpensALearningRecordWithBothChips() {
        let app = coachApp(route: "adler://insights")

        let row = app.buttons.containing(
            NSPredicate(format: "label CONTAINS[c] %@", "Evidence:")).firstMatch
        XCTAssertTrue(row.waitForExistence(timeout: 20), "a learning row reads its evidence standing")
        row.tap()

        XCTAssertTrue(
            app.navigationBars["Hypothesis and change"].waitForExistence(timeout: 15),
            "the record detail is pushed")
        // Workflow state and evidence standing stay two separate labels.
        XCTAssertTrue(app.staticTexts["Observation"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.staticTexts["Dated reports"].exists)
    }

    /// This account is shared with other concurrently running agents, so whether a proposal is
    /// currently pending is external, mutable state — not something this test can assume. If
    /// none is pending right now, that is a legitimate state to render (no card), so the test
    /// skips rather than failing; when a proposal is present it verifies the preview fully.
    @MainActor
    func testProposalPreviewShowsCurrentAndSuggested() throws {
        let app = coachApp()

        let review = app.buttons["Review changes"].firstMatch
        guard review.waitForExistence(timeout: 20) else {
            throw XCTSkip("No proposal is currently pending on the shared account.")
        }
        review.tap()

        XCTAssertTrue(app.navigationBars["Review changes"].waitForExistence(timeout: 15))
        XCTAssertTrue(app.staticTexts["Current → Suggested"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.staticTexts["Affected work"].exists)
        // Nothing is decided from this test.
        app.buttons["Close"].firstMatch.tap()
        XCTAssertFalse(app.navigationBars["Review changes"].waitForExistence(timeout: 3))
    }
}
