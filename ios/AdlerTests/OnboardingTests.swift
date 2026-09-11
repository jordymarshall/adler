import XCTest

@testable import Adler

/// Unit cover for the Welcome → goal → account → first-plan flow: what the client refuses to
/// send, how the wait is described, what survives a relaunch, and how a saved goal and a pending
/// proposal are read back.
nonisolated final class OnboardingTests: XCTestCase {

    // MARK: - Validation (server rules, mirrored only to disable a doomed button)

    func testUsernameMatchesTheServersRules() {
        XCTAssertTrue(OnboardingValidation.isUsernameAcceptable("onboard-1757570000"))
        XCTAssertTrue(OnboardingValidation.isUsernameAcceptable("casey.example@adler"))
        XCTAssertTrue(OnboardingValidation.isUsernameAcceptable("a_b"))
        // Under three characters, over eighty, and characters the regex refuses.
        XCTAssertFalse(OnboardingValidation.isUsernameAcceptable("ab"))
        XCTAssertFalse(OnboardingValidation.isUsernameAcceptable(String(repeating: "a", count: 81)))
        XCTAssertFalse(OnboardingValidation.isUsernameAcceptable("has space"))
        XCTAssertFalse(OnboardingValidation.isUsernameAcceptable("emoji🙂name"))
        XCTAssertFalse(OnboardingValidation.isUsernameAcceptable("semi;colon"))
    }

    func testUsernameIsTrimmedTheWayTheServerTrimsIt() {
        XCTAssertTrue(OnboardingValidation.isUsernameAcceptable("  casey  "))
        XCTAssertEqual(OnboardingValidation.normalisedUsername("  casey  "), "casey")
    }

    func testPasswordNeedsTenCharactersAndIsNeverTrimmed() {
        XCTAssertFalse(OnboardingValidation.isPasswordAcceptable("123456789"))
        XCTAssertTrue(OnboardingValidation.isPasswordAcceptable("1234567890"))
        XCTAssertTrue(OnboardingValidation.isPasswordAcceptable("fictional-onboarding-pass"))
        XCTAssertFalse(OnboardingValidation.isPasswordAcceptable(String(repeating: "x", count: 201)))
        // Nine characters plus a trailing space is ten characters the person chose.
        XCTAssertTrue(OnboardingValidation.isPasswordAcceptable("123456789 "))
    }

    func testSubmitIsOnlyLiveWhenBothFieldsCouldSucceed() {
        XCTAssertFalse(OnboardingValidation.canSubmit(username: "ab", password: "1234567890"))
        XCTAssertFalse(OnboardingValidation.canSubmit(username: "casey", password: "short"))
        XCTAssertTrue(OnboardingValidation.canSubmit(username: "casey", password: "1234567890"))
    }

    func testGoalMustHaveSomethingOtherThanWhitespace() {
        XCTAssertFalse(OnboardingValidation.isGoalAcceptable(""))
        XCTAssertFalse(OnboardingValidation.isGoalAcceptable("   \n "))
        XCTAssertTrue(OnboardingValidation.isGoalAcceptable("Publish 3 portfolio case studies"))
    }

    func testCharacterCountIsAnnouncedOnlyNearTheLimit() {
        XCTAssertNil(OnboardingValidation.remainingCharactersToAnnounce("short"))
        let near = String(repeating: "x", count: OnboardingCopy.goalCharacterLimit - 100)
        XCTAssertEqual(OnboardingValidation.remainingCharactersToAnnounce(near), 100)
        let full = String(repeating: "x", count: OnboardingCopy.goalCharacterLimit)
        XCTAssertEqual(OnboardingValidation.remainingCharactersToAnnounce(full), 0)
    }

    // MARK: - Staged progress (time-based, never a percentage)

    func testStagesAdvanceOnTheirOwnBoundaries() {
        XCTAssertEqual(OnboardingProgress.stage(atElapsed: 0).label, OnboardingCopy.planStageReading)
        XCTAssertEqual(OnboardingProgress.stage(atElapsed: 11.9).label, OnboardingCopy.planStageReading)
        XCTAssertEqual(OnboardingProgress.stage(atElapsed: 12).label, OnboardingCopy.planStageChecking)
        XCTAssertEqual(OnboardingProgress.stage(atElapsed: 29.9).label, OnboardingCopy.planStageChecking)
        XCTAssertEqual(OnboardingProgress.stage(atElapsed: 30).label, OnboardingCopy.planStageDrafting)
        // Past the last stage the label holds; it never claims to be finishing.
        XCTAssertEqual(OnboardingProgress.stage(atElapsed: 600).label, OnboardingCopy.planStageDrafting)
        XCTAssertEqual(OnboardingProgress.index(atElapsed: 600), OnboardingProgress.stages.count - 1)
    }

    func testStageIndexIsNeverNegative() {
        XCTAssertEqual(OnboardingProgress.index(atElapsed: -5), 0)
    }

    func testTheNoticeChangesOnlyWhenTheWaitIsUnusual() {
        XCTAssertEqual(OnboardingProgress.notice(atElapsed: 0), OnboardingCopy.planUsualWait)
        XCTAssertEqual(OnboardingProgress.notice(atElapsed: 74.9), OnboardingCopy.planUsualWait)
        XCTAssertEqual(
            OnboardingProgress.notice(atElapsed: OnboardingProgress.patienceNoticeAt),
            OnboardingCopy.planStillWorking)
    }

    func testProgressIsSpokenAsAPositionNotAPercentage() {
        let spoken = OnboardingProgress.accessibilityLabel(atElapsed: 12)
        XCTAssertTrue(spoken.contains("step 2 of 3"), spoken)
        XCTAssertFalse(spoken.contains("%"), spoken)
    }

    // MARK: - Draft persistence (survives auth and relaunch)

    @MainActor
    func testDraftSurvivesARelaunchAndIsClearedOnlyExplicitly() throws {
        let suite = "adler.onboarding.tests.\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }

        let typed = PendingDraft(defaults: defaults)
        typed.text = "Publish 3 portfolio case studies by December 15"
        XCTAssertTrue(typed.hasText)

        // A new instance is what a cold launch builds.
        let afterRelaunch = PendingDraft(defaults: defaults)
        XCTAssertEqual(afterRelaunch.text, "Publish 3 portfolio case studies by December 15")

        afterRelaunch.clear()
        XCTAssertFalse(PendingDraft(defaults: defaults).hasText)
        XCTAssertNil(defaults.string(forKey: PendingDraft.goalKey))
    }

    @MainActor
    func testTheOpeningMessageWrapsTheGoalExactlyAsTheFlowSpecifies() throws {
        let suite = "adler.onboarding.tests.\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }

        let draft = PendingDraft(defaults: defaults)
        XCTAssertNil(draft.coachOpening)
        draft.text = "  Publish 3 portfolio case studies by December 15  "
        XCTAssertEqual(
            draft.coachOpening,
            "Help me develop this goal and a plan around how I work: "
                + "Publish 3 portfolio case studies by December 15")
    }

    // MARK: - Reading back the saved goal

    func testASavedGoalSummaryReadsMilestonesAndTheEarliestLiveAction() throws {
        let fixture = try Fixtures.load(GoalDetailView.self, "goal-detail")
        let summary = FirstPlanSummary.make(from: fixture.response)

        XCTAssertEqual(summary.goalTitle, fixture.response.goal.title)
        XCTAssertEqual(summary.statusLabel, fixture.response.goal.status.rawValue)
        XCTAssertFalse(summary.isUnplannedDraft)
        XCTAssertEqual(summary.milestones.count, fixture.response.milestones.count)
        // Every action in this example is already in the past, so the earliest dated one stands
        // in — the list arrives newest-first, so this also proves the order is rebuilt.
        let earliest = fixture.response.actions.compactMap(\.date).map(\.raw).min()
        XCTAssertEqual(summary.firstAction?.date?.raw, earliest)
    }

    func testADraftWithNoWorkIsReportedAsUnplanned() {
        let summary = FirstPlanSummary(
            goalId: "g-1", goalTitle: "Run a 10k without walking", goalColor: "hsl(20 60% 35%)",
            statusLabel: "Draft", outcomeLine: nil, targetDate: nil, milestones: [],
            firstAction: nil)
        XCTAssertTrue(summary.isUnplannedDraft)
    }

    func testAMilestoneWithNoDueDateKeepsNoDate() throws {
        let fixture = try Fixtures.load(GoalDetailView.self, "goal-detail")
        let summary = FirstPlanSummary.make(from: fixture.response)
        for (line, saved) in zip(summary.milestones, fixture.response.milestones) {
            XCTAssertEqual(line.due?.raw, saved.dueDate?.raw)
            XCTAssertEqual(line.statusLabel, saved.statusLabel)
        }
    }

    // MARK: - The proposal card

    func testACreateReadsAsNotAddedYetRatherThanNoChange() throws {
        let fixture = try Fixtures.load(CoachView.self, "coach")
        let proposal = try XCTUnwrap(fixture.response.proposals.first)
        let rows = FirstPlanProposal.comparisons(for: proposal)
        XCTAssertEqual(rows.count, proposal.changes.count)
        let created = try XCTUnwrap(zip(rows, proposal.changes).first { $0.1.operation == .create }?.0)
        XCTAssertEqual(created.current, "Not added yet")
        XCTAssertNotEqual(created.suggested, nil)
        XCTAssertFalse(created.removed)
    }

    func testChangeLabelsAreTheSavedRecordLabels() {
        XCTAssertEqual(FirstPlanProposal.label(for: .checkpoint), "Progress check")
        XCTAssertEqual(FirstPlanProposal.label(for: .workBlock), "Calendar")
        XCTAssertEqual(FirstPlanProposal.label(for: .memory), "Saved information")
        XCTAssertEqual(FirstPlanProposal.label(for: .action), "Action")
    }

    func testTheChangeLineReadsTheSavedValuesAndNothingElse() {
        let values = JSONValue.decoding(
            jsonString: #"{"title":"Write for 25 minutes","timing":"8:30","amount":25,"unit":"minutes"}"#)
        let line = try? XCTUnwrap(FirstPlanProposal.line(from: values))
        XCTAssertEqual(line, "Write for 25 minutes · 8:30 · 25 minutes")
        // A deletion carries `{}` — there is nothing to print, and nothing is invented.
        XCTAssertNil(FirstPlanProposal.line(from: JSONValue.decoding(jsonString: "{}")))
        XCTAssertNil(FirstPlanProposal.line(from: nil))
    }

    func testTheAffectedLineSaysWhenTheCardIsShowingOnlyPartOfTheChangeSet() throws {
        let fixture = try Fixtures.load(CoachView.self, "coach")
        let proposal = try XCTUnwrap(fixture.response.proposals.first)
        let whole = FirstPlanProposal.affectedSummary(for: proposal, shown: proposal.changes.count)
        XCTAssertFalse(whole.contains("showing"))
        let partial = FirstPlanProposal.affectedSummary(for: proposal, shown: 0)
        XCTAssertTrue(partial.contains("showing 0 of \(proposal.changes.count) changes"), partial)
    }

    func testTheConsequenceSentenceIsAlwaysPresentAndBookingIsNeverImplied() throws {
        let fixture = try Fixtures.load(CoachView.self, "coach")
        let proposal = try XCTUnwrap(fixture.response.proposals.first)
        let content = FirstPlanProposal.content(for: proposal, goalColor: "hsl(184 28% 35%)")
        XCTAssertFalse(content.consequence.isEmpty)
        XCTAssertEqual(content.bookingConsequence == nil, proposal.booking == nil)
        XCTAssertEqual(content.title, proposal.headline)
        XCTAssertLessThanOrEqual(content.comparisons.count, FirstPlanProposal.visibleComparisonLimit)
    }

    // MARK: - Errors are the server's words

    /// `ErrorBanner.Kind` is a SwiftUI type, so it is main-actor isolated.
    @MainActor
    func testServerRefusalsArePrintedVerbatim() {
        let rateLimited = APIError.server(message: "Too many requests. Please try again later.", status: 429)
        XCTAssertEqual(
            OnboardingErrorText.verbatim(rateLimited), "Too many requests. Please try again later.")
        XCTAssertEqual(ErrorBanner.Kind.of(rateLimited).detail, "Too many requests. Please try again later.")

        let taken = APIError.server(message: "That username is unavailable.", status: 400)
        XCTAssertEqual(OnboardingErrorText.verbatim(taken), "That username is unavailable.")
    }

    @MainActor
    func testTransportFailuresMapToTheirOwnBanners() {
        XCTAssertEqual(
            ErrorBanner.Kind.of(.transport(message: "offline", kind: .offline)), .offline)
        XCTAssertEqual(
            ErrorBanner.Kind.of(.transport(message: "timed out", kind: .timeout)), .timeout)
        XCTAssertEqual(ErrorBanner.Kind.of(.unauthenticated), .signedOut)
    }

    func testAVeryLongCoachErrorMovesIntoADisclosure() {
        XCTAssertFalse(OnboardingErrorText.isLong(String(repeating: "x", count: 240)))
        XCTAssertTrue(OnboardingErrorText.isLong(String(repeating: "x", count: 241)))
    }
}
