import XCTest

/// Opens a goal from All Goals and reports one of its actions against the running dev server.
///
/// Requires `npm run dev -- --port 8080` and the seeded fictional account the DEBUG
/// "Developer sign-in" control signs in as (`casey-example`).
nonisolated final class GoalDetailUITests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    @MainActor
    private func openGoals() -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments += ["-resetSession"]
        app.launch()

        // A generous first wait: a cold launch's first frame is the slowest step under a loaded
        // CI/shared machine, and every later wait in this file only has to catch up from there.
        XCTAssertTrue(app.otherElements["Onboarding"].waitForExistence(timeout: 60))
        app.buttons["Developer sign-in"].tap()

        let tabBar = app.tabBars.firstMatch
        XCTAssertTrue(tabBar.waitForExistence(timeout: 30))
        tabBar.buttons["Goals"].tap()
        XCTAssertTrue(app.navigationBars["Goals"].waitForExistence(timeout: 20))
        return app
    }

    @MainActor
    private func openFirstGoal(_ app: XCUIApplication) -> XCUIElement {
        // A goal row is one combined element labelled title, chips, result, activity, outlook.
        let row = app.buttons
            .matching(NSPredicate(format: "label CONTAINS %@", "Write the onboarding guide"))
            .firstMatch
        XCTAssertTrue(row.waitForExistence(timeout: 20), "the seeded goal row should be listed")
        row.tap()
        return app.navigationBars["Write the onboarding guide"]
    }

    /// The structure decision, on screen: Goal → Plan → Milestone → Action, then Outcome.
    @MainActor
    func testOpeningAGoalShowsTheLabelledStructure() {
        let app = openGoals()
        let bar = openFirstGoal(app)
        XCTAssertTrue(bar.waitForExistence(timeout: 20))

        for label in ["GOAL", "MILESTONE", "ACTION", "OUTCOME"] {
            XCTAssertTrue(
                app.staticTexts[label].waitForExistence(timeout: 10),
                "the \(label) section label should be on screen")
        }
        XCTAssertTrue(
            app.staticTexts.matching(NSPredicate(format: "label BEGINSWITH %@", "PLAN · v"))
                .firstMatch.exists,
            "the plan section names its saved version")
    }

    /// Report an action from the dated report strip and see the saved receipt.
    @MainActor
    func testReportingAnActionSavesAReceiptThatCanBeCorrected() {
        let app = openGoals()
        let bar = openFirstGoal(app)
        XCTAssertTrue(bar.waitForExistence(timeout: 20))

        // Report-strip chips read "11 September. Awaiting check-in".
        let chip = app.buttons
            .matching(NSPredicate(format: "label MATCHES %@", "^[0-9]{1,2} [A-Za-z]+\\. .+$"))
            .firstMatch
        XCTAssertTrue(chip.waitForExistence(timeout: 15), "a dated report chip should be listed")
        chip.tap()

        XCTAssertTrue(app.navigationBars["Report"].waitForExistence(timeout: 10))

        // No outcome is preselected, so Save stays disabled until one is chosen.
        let save = app.buttons["Save"].firstMatch
        XCTAssertTrue(save.exists)
        XCTAssertFalse(save.isEnabled, "Save is disabled until an outcome is chosen")

        app.segmentedControls.firstMatch.buttons["Done"].tap()
        XCTAssertTrue(save.isEnabled)
        save.tap()

        // The saved receipt turns the sheet into a correction, which is how a report is fixed.
        XCTAssertTrue(
            app.navigationBars["Correct your report"].waitForExistence(timeout: 30),
            "saving should show the receipt and offer a correction")

        app.buttons["Cancel"].firstMatch.tap()
        XCTAssertTrue(bar.waitForExistence(timeout: 10))
    }
}
