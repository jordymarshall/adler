import XCTest

/// The shell's own smoke flow: sign in, walk the four tabs, open Settings from the avatar, and
/// land a deferred deep link on a pushed detail. It drives the real tab bar and the real
/// toolbar, which unit tests over `AppRouter` cannot.
///
/// Requires the dev server on `http://localhost:8080` (`npm run dev -- --port 8080`) and the
/// DEBUG "Developer sign-in" control on the placeholder onboarding screen.
nonisolated final class ShellUITests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    @MainActor
    private func signedInApp(route: String? = nil) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments += ["-resetSession"]
        if let route { app.launchArguments += ["-route", route] }
        app.launch()

        XCTAssertTrue(app.staticTexts["Onboarding"].waitForExistence(timeout: 15))
        app.buttons["Developer sign-in"].tap()
        return app
    }

    @MainActor
    func testSignInShowsTheFourTabsAndEachOneNavigates() {
        let app = signedInApp()

        let tabBar = app.tabBars.firstMatch
        XCTAssertTrue(tabBar.waitForExistence(timeout: 30))
        XCTAssertTrue(app.navigationBars["Today"].waitForExistence(timeout: 5))

        for title in ["Goals", "Coach", "Calendar", "Today"] {
            tabBar.buttons[title].tap()
            XCTAssertTrue(
                app.navigationBars[title].waitForExistence(timeout: 5),
                "tapping \(title) should show its root")
        }
    }

    @MainActor
    func testAvatarOpensSettingsAsASheet() {
        let app = signedInApp()
        XCTAssertTrue(app.tabBars.firstMatch.waitForExistence(timeout: 30))

        app.buttons["Open settings"].firstMatch.tap()
        XCTAssertTrue(app.navigationBars["Settings"].waitForExistence(timeout: 5))

        app.buttons["Close"].firstMatch.tap()
        XCTAssertFalse(app.navigationBars["Settings"].waitForExistence(timeout: 2))
    }

    /// A link that arrives while signed out is replayed after sign-in and pushes its detail.
    @MainActor
    func testDeferredDeepLinkPushesGoalDetailAfterSignIn() {
        let app = signedInApp(route: "adler://goals/g-example")
        XCTAssertTrue(app.tabBars.firstMatch.waitForExistence(timeout: 30))

        // The real Goal detail is now behind this route; `g-example` is not a saved goal, so it
        // reports that inline rather than leaving a blank screen. The shell's job here is the
        // push and the way back.
        XCTAssertTrue(app.navigationBars["Goal"].waitForExistence(timeout: 5))

        // Back to the Goals root.
        app.navigationBars["Goal"].buttons.firstMatch.tap()
        XCTAssertTrue(app.navigationBars["Goals"].waitForExistence(timeout: 5))
    }
}
