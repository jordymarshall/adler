import XCTest

/// Today's two irreducible interactions, driven through the real deck and the real sheet:
/// paging all three chapters by every route the design specifies, and reporting an outcome.
///
/// Requires the dev server on `http://localhost:8080` (`npm run dev -- --port 8080`) and the
/// DEBUG "Developer sign-in" control on the placeholder onboarding screen, which signs in as
/// the fictional `casey-example` account.
///
/// Timeouts are generous: the first Today load waits on a real HTTP round trip and on the
/// server refreshing plan occurrences before it answers.
nonisolated final class TodayUITests: XCTestCase {
    private let load: TimeInterval = 40
    private let interaction: TimeInterval = 10

    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    @MainActor
    private func todayApp() -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments += ["-resetSession"]
        app.launch()

        XCTAssertTrue(app.staticTexts["Onboarding"].waitForExistence(timeout: 15))
        app.buttons["Developer sign-in"].tap()

        XCTAssertTrue(
            app.staticTexts["Your daily story"].waitForExistence(timeout: load),
            "Today's header should appear after sign-in")
        return app
    }

    /// The pager pill, the Back/Next footer and a swipe are three equivalent routes to the same
    /// chapter, and the footer always says which one of three is showing.
    @MainActor
    func testPagesAllThreeChaptersByPillFooterAndSwipe() {
        let app = todayApp()

        // 01 Do is where a fresh launch starts.
        XCTAssertTrue(app.buttons["Do, 1 of 3"].waitForExistence(timeout: interaction))
        XCTAssertTrue(app.staticTexts["Card 1 of 3"].exists)
        XCTAssertTrue(
            app.staticTexts["What you need to do today"].waitForExistence(timeout: interaction))

        // The pager pill.
        app.buttons["Progress, 2 of 3"].tap()
        XCTAssertTrue(app.staticTexts["Card 2 of 3"].waitForExistence(timeout: interaction))
        XCTAssertTrue(app.staticTexts["The whole picture."].waitForExistence(timeout: interaction))

        // The footer buttons.
        app.buttons["Next card"].tap()
        XCTAssertTrue(app.staticTexts["Card 3 of 3"].waitForExistence(timeout: interaction))
        XCTAssertTrue(
            app.staticTexts["What we’re learning"].waitForExistence(timeout: interaction))
        XCTAssertFalse(app.buttons["Next card"].isEnabled, "the last chapter has no next")

        app.buttons["Previous card"].tap()
        XCTAssertTrue(app.staticTexts["Card 2 of 3"].waitForExistence(timeout: interaction))

        // A swipe.
        app.scrollViews.firstMatch.swipeRight()
        XCTAssertTrue(app.staticTexts["Card 1 of 3"].waitForExistence(timeout: interaction))
        XCTAssertFalse(app.buttons["Previous card"].isEnabled, "the first chapter has no back")
    }

    /// Report today's due action as `Done` with the minutes it took, then correct it to
    /// `Partly`. The lineup row is both the control and the assertion: its trailing state label
    /// is the server's (`Up next` → `Done` → `Partly`), so a green run proves the write landed.
    @MainActor
    func testReportsTheDueActionAndThenCorrectsIt() throws {
        let app = todayApp()

        let upNext = app.buttons.matching(
            NSPredicate(format: "label ENDSWITH %@", "Up next.")
        ).firstMatch
        guard upNext.waitForExistence(timeout: load) else {
            throw XCTSkip(
                "No action is up next for this account — the report flow has nothing to drive.")
        }
        upNext.tap()

        XCTAssertTrue(app.navigationBars["Report"].waitForExistence(timeout: interaction))
        // No outcome is preselected, so Save starts disabled.
        XCTAssertFalse(app.buttons["Save"].isEnabled)

        app.buttons["Done"].firstMatch.tap()
        XCTAssertTrue(app.buttons["Save"].isEnabled)

        let minutes = app.textFields["Actual time in minutes"]
        if minutes.waitForExistence(timeout: 3) {
            minutes.tap()
            minutes.typeText("25")
        }
        app.buttons["Save"].tap()

        let reported = app.buttons.matching(
            NSPredicate(format: "label ENDSWITH %@", "Done.")
        ).firstMatch
        XCTAssertTrue(
            reported.waitForExistence(timeout: load),
            "the lineup row should carry the server's saved outcome")

        // Correcting reopens the same sheet pre-filled, and the row follows the new outcome.
        reported.tap()
        XCTAssertTrue(
            app.navigationBars["Correct your report"].waitForExistence(timeout: interaction))
        app.buttons["Partly"].firstMatch.tap()
        app.buttons["Save"].tap()

        XCTAssertTrue(
            app.buttons.matching(NSPredicate(format: "label ENDSWITH %@", "Partly."))
                .firstMatch.waitForExistence(timeout: load))
    }
}
