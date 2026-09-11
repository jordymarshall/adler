import XCTest

/// Settings as a person actually reaches it: the avatar on a tab root, a preference that is saved
/// and reverted, and signing out and back in.
///
/// Requires the dev server on `http://localhost:8080` (`npm run dev -- --port 8080`) and the
/// DEBUG "Developer sign-in" control on the placeholder onboarding screen.
nonisolated final class SettingsUITests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    @MainActor
    private func signedInApp() -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments += ["-resetSession"]
        app.launch()

        XCTAssertTrue(app.staticTexts["Onboarding"].waitForExistence(timeout: 15))
        app.buttons["Developer sign-in"].tap()
        XCTAssertTrue(app.tabBars.firstMatch.waitForExistence(timeout: 30))
        return app
    }

    @MainActor
    private func openSettings(_ app: XCUIApplication) {
        app.buttons["Open settings"].firstMatch.tap()
        XCTAssertTrue(app.navigationBars["Settings"].waitForExistence(timeout: 10))
    }

    /// A `Form` row that is below the fold is not in the accessibility tree at all, so anything
    /// near the bottom of Settings has to be scrolled to before it can be found. `timeout` is per
    /// attempt: the default suits pure scrolling, but a row that only appears after a network
    /// round trip (a save, a reload) needs more than a couple of seconds per try.
    @MainActor
    private func reveal(_ element: XCUIElement, in app: XCUIApplication, timeout: TimeInterval = 2)
        -> Bool
    {
        for _ in 0..<4 {
            if element.waitForExistence(timeout: timeout) { return true }
            app.swipeUp()
        }
        return element.waitForExistence(timeout: timeout)
    }

    @MainActor
    func testSettingsSheetListsEveryPage() {
        let app = signedInApp()
        openSettings(app)

        for row in [
            "Time zone", "Appearance", "Coaching program", "Check-ins", "Connections",
            "AI provider", "Server", "About & method", "Sign out",
        ] {
            XCTAssertTrue(
                reveal(app.descendants(matching: .any)[row].firstMatch, in: app),
                "Settings should list \(row)")
        }
    }

    @MainActor
    func testChangingAppearanceIsSavedAndRevertible() {
        let app = signedInApp()
        openSettings(app)

        let picker = app.buttons["Appearance"].firstMatch
        XCTAssertTrue(picker.waitForExistence(timeout: 10))

        picker.tap()
        app.buttons["Dark"].firstMatch.tap()
        XCTAssertTrue(
            app.buttons["Appearance"].firstMatch.waitForExistence(timeout: 5),
            "the picker keeps its place after choosing Dark")

        // Put it back, so the run leaves the fictional account as it found it.
        app.buttons["Appearance"].firstMatch.tap()
        app.buttons["Light"].firstMatch.tap()
        XCTAssertTrue(app.buttons["Appearance"].firstMatch.waitForExistence(timeout: 5))
    }

    @MainActor
    func testSignOutReturnsToOnboardingAndSignInComesBack() {
        let app = signedInApp()
        openSettings(app)

        XCTAssertTrue(reveal(app.buttons["Sign out"].firstMatch, in: app))
        app.buttons["Sign out"].firstMatch.tap()
        // The confirmation names the consequence before it happens.
        XCTAssertTrue(
            app.staticTexts["Sign out? Your goals and history stay on the server."]
                .waitForExistence(timeout: 5))
        // Two controls read `Sign out`: the row and the dialog's destructive button.
        app.buttons.matching(identifier: "Sign out").element(boundBy: 1).tap()

        XCTAssertTrue(app.buttons["Developer sign-in"].waitForExistence(timeout: 15))
        app.buttons["Developer sign-in"].tap()
        XCTAssertTrue(app.tabBars.firstMatch.waitForExistence(timeout: 30))
    }

    @MainActor
    func testCalendarWeekPagesAndOpensADay() {
        let app = signedInApp()
        app.tabBars.firstMatch.buttons["Calendar"].tap()
        XCTAssertTrue(app.navigationBars["Calendar"].waitForExistence(timeout: 10))

        let next = app.buttons["Next week"].firstMatch
        XCTAssertTrue(next.waitForExistence(timeout: 10))
        next.tap()
        app.buttons["Previous week"].firstMatch.tap()

        XCTAssertTrue(
            app.buttons["Today"].firstMatch.waitForExistence(timeout: 5),
            "the week header offers a way back to today")
    }

    /// The round trip DESIGN.md §5.9 and the agent notes (decision 7) depend on: a tentative
    /// suggestion is a real action, `Move` opens SchedulePlacement on it, `Save time` creates a
    /// local Adler block with the action's own id (so it moves the action rather than duplicating
    /// it), and `Remove this block` deletes it again. Self-cleaning: creates and deletes one block.
    @MainActor
    func testPlacementSheetCreatesAndRemovesALocalBlock() {
        let app = signedInApp()
        app.tabBars.firstMatch.buttons["Calendar"].tap()
        XCTAssertTrue(app.navigationBars["Calendar"].waitForExistence(timeout: 10))

        // A tentative row's accessibility label always includes the static "Tentative" kind chip
        // (CalendarCopy.tentative), so this does not depend on which action is currently
        // suggested or which goal it belongs to.
        let tentativeRow = app.buttons.matching(
            NSPredicate(format: "label CONTAINS[c] %@", "Tentative")
        ).firstMatch
        XCTAssertTrue(
            reveal(tentativeRow, in: app),
            "expected at least one tentative block on the current week")
        tentativeRow.tap()
        saveScreenshot(app, name: "calendar-day")

        let moveButton = app.buttons["Move"].firstMatch
        XCTAssertTrue(reveal(moveButton, in: app))
        moveButton.tap()

        XCTAssertTrue(app.navigationBars["Schedule"].waitForExistence(timeout: 10))
        saveScreenshot(app, name: "calendar-placement")
        let saveTimeButton = app.buttons["Save time"].firstMatch
        XCTAssertTrue(reveal(saveTimeButton, in: app))
        saveTimeButton.tap()
        XCTAssertTrue(
            app.staticTexts["Saves in Adler only."].waitForExistence(timeout: 15),
            "saving locally shows the Adler-only receipt, never a booking")
        app.buttons["Close"].firstMatch.tap()

        // Rather than trust the already-on-screen DayDetailView to reactively notice the store
        // update, pop back to the week and back in: that re-triggers `.task`, so what's checked
        // next came from a fresh `GET /api/app/calendar`, not a SwiftUI re-render race.
        app.navigationBars.buttons.firstMatch.tap()
        let adlerBlockRow = app.buttons.matching(
            NSPredicate(format: "label CONTAINS[c] %@", "Adler plan")
        ).firstMatch
        XCTAssertTrue(
            reveal(adlerBlockRow, in: app, timeout: 8),
            "the week view now shows the saved block as an Adler plan entry, not tentative")
        adlerBlockRow.tap()

        // The same action now has a saved Adler block, so its row offers Remove instead of Move.
        let removeButton = app.buttons["Remove this block"].firstMatch
        XCTAssertTrue(
            reveal(removeButton, in: app, timeout: 8),
            "the saved block's row offers Remove this block")
        removeButton.tap()
        app.buttons["Delete"].firstMatch.tap()
        XCTAssertTrue(
            removeButton.waitForNonExistence(timeout: 15), "the block is gone after deleting it")
    }

    /// `Save & test connection` spends one real provider API request (Core/README.md §7), so —
    /// like `CoreLiveTests` — this is skipped unless `ADLER_LIVE=1` is set (`TEST_RUNNER_ADLER_LIVE=1`
    /// for `xcodebuild`) and must never run on a routine pass. The account's saved selection is
    /// already the server key (`settings.json`: `useServer: true`, `gemini`, `serverAvailable:
    /// true`), so this only taps the button — it does not change the provider first.
    @MainActor
    func testProviderSaveAndTestConnectionLive() throws {
        try XCTSkipUnless(
            ProcessInfo.processInfo.environment["ADLER_LIVE"] == "1",
            "spends one real provider API call; set ADLER_LIVE=1 to run")

        let app = signedInApp()
        openSettings(app)

        // `SettingsLinkRow` combines the title and the trailing detail ("Server key · gemini")
        // into one row, so — as in `testSettingsSheetListsEveryPage` — the row is found through
        // `.any` rather than `.buttons`: the row's own accessibility element is not typed as a
        // button the way a plain SwiftUI `Button` is.
        let providerRow = app.descendants(matching: .any)["AI provider"].firstMatch
        XCTAssertTrue(reveal(providerRow, in: app))
        providerRow.tap()
        XCTAssertTrue(app.navigationBars["AI provider"].waitForExistence(timeout: 10))
        saveScreenshot(app, name: "settings-provider")

        let saveTest = app.buttons["Save & test connection"].firstMatch
        XCTAssertTrue(reveal(saveTest, in: app))
        saveTest.tap()

        let tested = app.staticTexts.matching(
            NSPredicate(format: "label CONTAINS[c] %@", "test request succeeded")
        ).firstMatch
        XCTAssertTrue(
            reveal(tested, in: app, timeout: 30),
            "Save & test shows the in-memory connected/model/testedAt result "
                + "(GET /api/provider reports testedAt: null for a server key)")
    }

    /// Best-effort screenshot capture for evidence, written straight to the repo's
    /// `.context/shots/` (the Simulator, unlike a device, does not sandbox this process away from
    /// the host filesystem). `#filePath` anchors the path to wherever this file actually is,
    /// rather than hard-coding an absolute path that only matches one checkout. Never fails the
    /// test: a screenshot is evidence, not a correctness check.
    @MainActor
    private func saveScreenshot(_ app: XCUIApplication, name: String) {
        let repoRoot = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()  // AdlerUITests
            .deletingLastPathComponent()  // ios
            .deletingLastPathComponent()  // repo root
        let shotsDir = repoRoot.appendingPathComponent(".context/shots")
        try? FileManager.default.createDirectory(at: shotsDir, withIntermediateDirectories: true)
        try? app.screenshot().pngRepresentation.write(
            to: shotsDir.appendingPathComponent("\(name).png"))
    }
}
