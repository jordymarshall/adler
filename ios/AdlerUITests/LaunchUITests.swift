import XCTest

// XCTestCase's overridable init/lifecycle methods are nonisolated; opt this
// type out of the project's MainActor-by-default isolation so overrides
// match (Swift 6 strict concurrency would otherwise error on the mismatch).
nonisolated final class LaunchUITests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    // XCUIApplication/XCUIElement are @MainActor; re-isolate just this
    // method (the class itself must stay nonisolated for the init override
    // above to match XCTestCase's nonisolated designated initializers).
    //
    // There is no tab bar before sign-in (DESIGN.md §2.1): a launch with no session lands on
    // the onboarding stack. `ShellUITests` covers the signed-in shell.
    @MainActor
    func testAppLaunchesToTheOnboardingRootWhenSignedOut() {
        let app = XCUIApplication()
        app.launchArguments += ["-resetSession"]
        app.launch()

        XCTAssertTrue(app.staticTexts["Onboarding"].waitForExistence(timeout: 15))
        XCTAssertFalse(app.tabBars.firstMatch.exists)
    }
}
