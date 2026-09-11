import XCTest

/// Drives the real onboarding flow on the simulator.
///
/// The first six tests touch no coaching turn and run on every `ios/scripts/test.sh --ui`.
/// `testFirstPlanEndToEndWithTheLiveCoach` registers a **new fictional account** and spends real
/// provider calls, so it is skipped unless `ADLER_LIVE_ONBOARDING=1` is set. `xcodebuild` only
/// forwards variables prefixed `TEST_RUNNER_`:
///
///     npm run dev -- --port 8080          # from the repo root, in another shell
///     cd ios && TEST_RUNNER_ADLER_LIVE_ONBOARDING=1 xcodebuild -project Adler.xcodeproj \
///       -scheme Adler -destination 'platform=iOS Simulator,id=9D3C9873-…' \
///       -derivedDataPath .build -resultBundlePath .build/onboarding.xcresult \
///       -only-testing:AdlerUITests/OnboardingUITests test
///
/// Screenshots are attached with `.keepAlways`, so they can be pulled out of the result bundle
/// with `xcrun xcresulttool export attachments`.
nonisolated final class OnboardingUITests: XCTestCase {
    /// A first goal turn has a median of 27 s and can pass 60 s
    /// (`.context/notes/agent-system.md` §3). Nothing here waits less than two minutes on it.
    private let coachTimeout: TimeInterval = 180

    private let liveGoal =
        "Publish 3 portfolio case studies by December 15; I can write Tuesdays and Thursdays at 8:30 for 25 minutes"

    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    // MARK: - Helpers

    @MainActor
    private func launch(resetSession: Bool = true) -> XCUIApplication {
        let app = XCUIApplication()
        if resetSession { app.launchArguments += ["-resetSession"] }
        app.launch()
        return app
    }

    @MainActor
    private func snap(_ app: XCUIApplication, _ name: String) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    /// Types the goal into the multiline field, clearing anything a previous run left behind
    /// (the draft is deliberately kept across sign-out).
    @MainActor
    private func enterGoal(_ app: XCUIApplication, _ text: String) {
        let field = app.textViews["Goal field"]
        XCTAssertTrue(field.waitForExistence(timeout: 10), "the goal field should be on screen")
        field.tap()
        if let existing = field.value as? String, !existing.isEmpty {
            field.typeText(String(repeating: XCUIKeyboardKey.delete.rawValue, count: existing.count))
        }
        field.typeText(text)
    }

    @MainActor
    private func element(_ app: XCUIApplication, _ identifier: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: identifier).firstMatch
    }

    // MARK: - Offline-ish flow (no coaching turn)

    @MainActor
    func testWelcomeOpensTheGoalInputBeforeAskingForAnAccount() {
        let app = launch()
        XCTAssertTrue(app.staticTexts["Following through is the hard part."].waitForExistence(timeout: 15))
        XCTAssertTrue(app.buttons["I already have an account"].exists)
        snap(app, "welcome")

        app.buttons["Start with a goal"].tap()
        XCTAssertTrue(app.staticTexts["What would you like to achieve?"].waitForExistence(timeout: 5))
        // No account has been asked for yet — that is the whole point of the order.
        XCTAssertFalse(app.secureTextFields["Password"].exists)
        snap(app, "goal-input")
    }

    @MainActor
    func testAnExampleChipFillsTheFieldWithoutSendingAnything() {
        let app = launch()
        app.buttons["Start with a goal"].tap()
        let field = app.textViews["Goal field"]
        XCTAssertTrue(field.waitForExistence(timeout: 10))
        field.tap()
        if let existing = field.value as? String, !existing.isEmpty {
            field.typeText(String(repeating: XCUIKeyboardKey.delete.rawValue, count: existing.count))
        }

        let example = "Publish 3 portfolio case studies by December 15"
        app.buttons[example].firstMatch.tap()
        XCTAssertEqual(field.value as? String, example)
        // Still on the same screen: a chip inserts, it never submits.
        XCTAssertTrue(app.staticTexts["What would you like to achieve?"].exists)
    }

    @MainActor
    func testTheDraftSurvivesARelaunch() {
        let app = launch()
        app.buttons["Start with a goal"].tap()
        enterGoal(app, liveGoal)
        app.terminate()

        // A cold launch, with no session reset, is what a person coming back would do.
        let relaunched = launch(resetSession: false)
        XCTAssertTrue(relaunched.buttons["Start with a goal"].waitForExistence(timeout: 15))
        relaunched.buttons["Start with a goal"].tap()
        let field = relaunched.textViews["Goal field"]
        XCTAssertTrue(field.waitForExistence(timeout: 10))
        XCTAssertEqual(field.value as? String, liveGoal)
    }

    @MainActor
    func testTheAccountScreenKeepsTheGoalAndRefusesAShortPassword() {
        let app = launch()
        app.buttons["Start with a goal"].tap()
        enterGoal(app, liveGoal)
        app.buttons["Continue"].tap()

        XCTAssertTrue(app.staticTexts["Create an account to save your goal."].waitForExistence(timeout: 10))
        // The draft is visible, so it is obvious nothing was lost.
        XCTAssertTrue(app.staticTexts.containing(NSPredicate(format: "label CONTAINS %@", "Your goal is saved")).firstMatch.exists)

        let submit = element(app, "Auth submit")
        app.textFields["Username"].tap()
        app.textFields["Username"].typeText("onboard-ui-check")
        app.secureTextFields["Password"].tap()
        app.secureTextFields["Password"].typeText("short")
        XCTAssertFalse(submit.isEnabled, "10 characters is the server's rule; the button stays off")

        app.secureTextFields["Password"].typeText("-but-now-long-enough")
        XCTAssertTrue(submit.isEnabled)
        snap(app, "create-account")
    }

    @MainActor
    func testReturningUserWithNoDraftGoesStraightToToday() {
        let app = launch()
        app.buttons["Start with a goal"].tap()
        // An empty draft is a valid, intentional state — `hasText` is false and `coachOpening`
        // is nil, exactly what a returning person with nothing typed looks like.
        enterGoal(app, "")
        app.terminate()

        let relaunched = launch()
        XCTAssertTrue(relaunched.buttons["I already have an account"].waitForExistence(timeout: 15))
        relaunched.buttons["I already have an account"].tap()
        XCTAssertTrue(relaunched.staticTexts["Welcome back."].waitForExistence(timeout: 5))

        // A fictional account already registered on the dev server (`App/README.md` §2).
        relaunched.textFields["Username"].tap()
        relaunched.textFields["Username"].typeText("shell-example")
        relaunched.secureTextFields["Password"].tap()
        relaunched.secureTextFields["Password"].typeText("fictional-example-password")
        element(relaunched, "Auth submit").tap()

        // Straight to the shell — never through the first-plan hand-off.
        XCTAssertTrue(relaunched.tabBars.firstMatch.waitForExistence(timeout: 20))
        XCTAssertFalse(element(relaunched, "First plan progress").exists)
        snap(relaunched, "returning-user-today")
    }

    @MainActor
    func testAdvancedServerFieldShowsAReadableErrorForADeadPortAndPingRecovers() {
        let app = launch()
        XCTAssertTrue(app.buttons["Start with a goal"].waitForExistence(timeout: 15))

        let advanced = element(app, "Advanced")
        XCTAssertTrue(advanced.waitForExistence(timeout: 5))
        advanced.tap()

        let field = app.textFields["Server address"]
        XCTAssertTrue(field.waitForExistence(timeout: 5))
        func replace(with text: String) {
            field.tap()
            if let existing = field.value as? String, !existing.isEmpty {
                field.typeText(String(repeating: XCUIKeyboardKey.delete.rawValue, count: existing.count))
            }
            field.typeText(text)
        }

        // A port nothing listens on — `APIClient.transportError` reads this as `.offline` and
        // prints its own sentence, never a bare "failed" or a raw `URLError`.
        replace(with: "http://127.0.0.1:59999")
        app.buttons["Test connection"].tap()
        XCTAssertTrue(
            app.staticTexts["Adler can\u{2019}t reach the server. Check your connection and the server address."]
                .waitForExistence(timeout: 15),
            "a dead port should show a readable, non-generic error")
        snap(app, "server-dead-port")

        // Pointed back at a real server, the same control succeeds.
        replace(with: "http://localhost:8080")
        app.buttons["Test connection"].tap()
        XCTAssertTrue(
            app.staticTexts["Reached the server. http://localhost:8080"].waitForExistence(timeout: 15),
            "pinging a reachable server should succeed")
        snap(app, "server-ping-recovered")
    }

    // MARK: - The live run

    @MainActor
    func testFirstPlanEndToEndWithTheLiveCoach() throws {
        try XCTSkipUnless(
            ProcessInfo.processInfo.environment["ADLER_LIVE_ONBOARDING"] == "1",
            "Set TEST_RUNNER_ADLER_LIVE_ONBOARDING=1 to spend real coaching turns.")

        let app = launch()
        XCTAssertTrue(app.buttons["Start with a goal"].waitForExistence(timeout: 20))
        snap(app, "live-welcome")

        app.buttons["Start with a goal"].tap()
        enterGoal(app, liveGoal)
        snap(app, "live-goal-input")
        app.buttons["Continue"].tap()

        // A fictional account, created for this run only.
        let username = "onboard-\(Int(Date().timeIntervalSince1970))"
        XCTAssertTrue(app.textFields["Username"].waitForExistence(timeout: 10))
        app.textFields["Username"].tap()
        app.textFields["Username"].typeText(username)
        app.secureTextFields["Password"].tap()
        app.secureTextFields["Password"].typeText("fictional-onboarding-pass")
        snap(app, "live-create-account")
        element(app, "Auth submit").tap()

        let progress = element(app, "First plan progress")
        XCTAssertTrue(progress.waitForExistence(timeout: 30), "the staged wait should appear")
        snap(app, "live-progress")

        // Each outcome is recognised by a control or heading only it has.
        let saved = app.staticTexts["Goal saved"]
        let failed = app.buttons["Continue in Coach"]
        let approve = app.buttons["Approve"]
        let send = app.buttons["Send"]
        func awaitOutcome() -> Bool {
            let settled = { saved.exists || failed.exists || approve.exists || send.exists }
            var waited: TimeInterval = 0
            while waited < coachTimeout && !settled() {
                _ = saved.waitForExistence(timeout: 5)
                waited += 5
            }
            return settled()
        }

        XCTAssertTrue(awaitOutcome(), "no outcome after \(Int(coachTimeout))s")

        // `.context/ios-brief.md`: at most 6 billable coach turns in total, the opening message
        // being the first. A clarifying question is answered here rather than left on screen, so
        // the run reaches one of the three documented terminal outcomes.
        var turnsSpent = 1
        let maxTurns = 6
        while send.exists, !saved.exists, !approve.exists, !failed.exists {
            XCTAssertLessThan(turnsSpent, maxTurns, "still asking after \(maxTurns) turns")
            snap(app, "live-question-\(turnsSpent)")
            let field = element(app, "Answer field")
            XCTAssertTrue(field.exists, "a question reply needs the answer field")
            field.tap()
            field.typeText("Yes, that works for me.")
            send.tap()
            turnsSpent += 1
            XCTAssertTrue(awaitOutcome(), "no outcome after answering the question")
        }

        if failed.exists {
            snap(app, "live-failure")
            XCTFail("the coach turn failed; the screenshot has the server's message")
            return
        }

        if approve.exists {
            snap(app, "live-proposal")
            approve.tap()
            XCTAssertTrue(saved.waitForExistence(timeout: 60), "approving should save the goal")
        }

        XCTAssertTrue(saved.exists, "the turn should end in a saved goal after \(turnsSpent) turn(s)")

        snap(app, "live-goal-saved")
        // The "what you contribute, what Adler manages" card sits below the goal card and the
        // start-plan controls — scroll to it so this required screen is actually verified rather
        // than assumed from the top of the view.
        app.swipeUp()
        app.swipeUp()
        XCTAssertTrue(
            app.staticTexts["What you contribute, what Adler manages"].waitForExistence(timeout: 5),
            "the contribution card should be on the hand-off screen")
        snap(app, "live-goal-saved-scrolled")

        let toToday = app.buttons["Go to Today"]
        XCTAssertTrue(toToday.exists)
        toToday.tap()
        XCTAssertTrue(app.tabBars.firstMatch.waitForExistence(timeout: 30), "the shell should take over")
        snap(app, "live-today")
    }
}
