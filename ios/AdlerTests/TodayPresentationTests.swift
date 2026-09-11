import Foundation
import XCTest

@testable import Adler

/// The pure half of the Today feature: deck index arithmetic, date labels, the phase →
/// controls mapping, receipts, and the two comparison blocks on cards 02 and 03.
///
/// Payload values are taken from `docs/ios-api-examples/today.json` and patched per test, so a
/// contract change breaks these rather than passing against a hand-written stand-in.
nonisolated final class TodayPresentationTests: XCTestCase {

    // MARK: - Fixtures

    private static let timeZone = TimeZone(identifier: "Europe/London")!

    private func todayView() throws -> TodayView {
        try Fixtures.load(TodayView.self, "today").response
    }

    private func dates(_ view: TodayView) -> TodayDates {
        TodayDates(today: view.today, timeZone: Self.timeZone)
    }

    /// The fixture's `next`, with the given JSON fields replaced, re-decoded through the real
    /// `Codable` conformance.
    private func nextStep(_ overrides: [String: Any?] = [:]) throws -> TodayNextStep {
        let data = try Fixtures.data("today")
        let root = try XCTUnwrap(
            JSONSerialization.jsonObject(with: data) as? [String: Any])
        let response = try XCTUnwrap(root["response"] as? [String: Any])
        var next = try XCTUnwrap(response["next"] as? [String: Any])
        for (key, value) in overrides {
            if let value { next[key] = value } else { next[key] = NSNull() }
        }
        let patched = try JSONSerialization.data(withJSONObject: next)
        return try JSONDecoder().decode(TodayNextStep.self, from: patched)
    }

    private func actionJSON(_ overrides: [String: Any?] = [:]) throws -> [String: Any] {
        let data = try Fixtures.data("today")
        let root = try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
        let response = try XCTUnwrap(root["response"] as? [String: Any])
        let next = try XCTUnwrap(response["next"] as? [String: Any])
        var action = try XCTUnwrap(next["action"] as? [String: Any])
        for (key, value) in overrides {
            if let value { action[key] = value } else { action[key] = NSNull() }
        }
        return action
    }

    private func action(_ overrides: [String: Any?] = [:]) throws -> ActionView {
        let patched = try JSONSerialization.data(withJSONObject: actionJSON(overrides))
        return try JSONDecoder().decode(ActionView.self, from: patched)
    }

    // MARK: - Deck index maths

    func testDeckIndexRoundTripsEveryCard() {
        XCTAssertEqual(TodayDeck.count, 3)
        for card in TodayCard.allCases {
            XCTAssertEqual(TodayDeck.card(at: TodayDeck.index(of: card)), card)
        }
        XCTAssertEqual(TodayDeck.index(of: .doNext), 0)
        XCTAssertEqual(TodayDeck.index(of: .progress), 1)
        XCTAssertEqual(TodayDeck.index(of: .learn), 2)
    }

    func testDeckIndexClampsOutOfRangeValues() {
        // A scroll position or a deep link can hand over any integer; the deck must not trap.
        XCTAssertEqual(TodayDeck.card(at: -4), .doNext)
        XCTAssertEqual(TodayDeck.card(at: 99), .learn)
    }

    func testDeckPositionIsZeroPadded() {
        XCTAssertEqual(TodayDeck.position(0), "01 / 03")
        XCTAssertEqual(TodayDeck.position(2), "03 / 03")
        XCTAssertEqual(TodayDeck.position(9), "03 / 03")
    }

    func testDeckLabelsMatchCopy() {
        XCTAssertEqual(TodayDeck.titles, ["Do", "Progress", "Learn"])
        XCTAssertEqual(TodayDeck.accessibilityLabels[0], "1 of 3: What you need to do today")
        XCTAssertEqual(TodayDeck.accessibilityLabels[1], "2 of 3: Your progress")
        XCTAssertEqual(TodayDeck.accessibilityLabels[2], "3 of 3: What we’re learning")
    }

    // MARK: - Date labels

    func testWorkDateNoteNamesEarlierAndFutureWork() throws {
        let dates = TodayDates(today: "2026-10-13", timeZone: Self.timeZone)
        XCTAssertEqual(dates.workDateNote(for: "2026-10-11"), "Earlier work · 11 Oct")
        XCTAssertEqual(dates.workDateNote(for: "2026-10-15"), "Coming up · 15 Oct")
    }

    func testWorkDateNoteIsAbsentForTodayAndForUndatedWork() {
        let dates = TodayDates(today: "2026-10-13", timeZone: Self.timeZone)
        XCTAssertNil(dates.workDateNote(for: "2026-10-13"))
        XCTAssertNil(dates.workDateNote(for: nil))
    }

    func testDatesAcrossAYearBoundaryCarryTheYear() {
        let dates = TodayDates(today: "2026-12-30", timeZone: Self.timeZone)
        XCTAssertEqual(dates.short("2027-01-09"), "9 Jan 2027")
        XCTAssertEqual(dates.short("2026-12-24"), "24 Dec")
    }

    func testMalformedDayPrintsNothingRatherThanAWrongDate() {
        let dates = TodayDates(today: "2026-10-13", timeZone: Self.timeZone)
        XCTAssertNil(dates.short("not-a-date"))
        XCTAssertNil(dates.workDateNote(for: "not-a-date"))
    }

    func testHeaderDateIncludesTheWeekday() {
        let dates = TodayDates(today: "2026-10-13", timeZone: Self.timeZone)
        XCTAssertEqual(dates.headerDate(), "Tue 13 Oct")
    }

    func testDayBoundaryUsesTheWorkspaceTimeZoneNotTheDevice() {
        let tokyo = TodayDates(today: "2026-10-13", timeZone: TimeZone(identifier: "Asia/Tokyo")!)
        let losAngeles = TodayDates(
            today: "2026-10-13", timeZone: TimeZone(identifier: "America/Los_Angeles")!)
        XCTAssertEqual(tokyo.headerDate(), "Tue 13 Oct")
        XCTAssertEqual(losAngeles.headerDate(), "Tue 13 Oct")
        XCTAssertNotEqual(tokyo.todayDate, losAngeles.todayDate)
    }

    // MARK: - Phase → controls

    func testReadyPhaseOffersStartReportAndSchedule() throws {
        let view = try todayView()
        let next = try nextStep()
        XCTAssertEqual(next.phase, .ready)
        let presentation = NextStepPresentation.make(next: next, dates: dates(view))
        XCTAssertTrue(presentation.showsStart)
        XCTAssertTrue(presentation.showsReport)
        XCTAssertTrue(presentation.showsSchedule)
        XCTAssertFalse(presentation.isReadOnly)
        XCTAssertEqual(presentation.card.state, .planned)
        XCTAssertEqual(presentation.phaseLabel, "YOUR NEXT STEP")
    }

    func testWaitingPhaseIsReadOnlyBecauseTheServerRefusesStartAndReport() throws {
        let view = try todayView()
        let next = try nextStep([
            "phase": "waiting", "phaseLabel": "YOU’RE SET",
            "canStartAction": false, "canReport": false, "canSchedule": true,
            "action": try actionJSON(["date": "2026-09-15"]),
        ])
        let presentation = NextStepPresentation.make(next: next, dates: dates(view))
        XCTAssertFalse(presentation.showsStart)
        XCTAssertFalse(presentation.showsReport)
        XCTAssertTrue(presentation.showsSchedule)
        // `ActionCardState.planned` would draw Start and Report, so the card is drawn read-only.
        XCTAssertTrue(presentation.isReadOnly)
        XCTAssertEqual(presentation.dateNote, "Coming up · 15 Sep")
    }

    func testBlockedWorkOffersNoControls() throws {
        let view = try todayView()
        let next = try nextStep([
            "canStartAction": false, "canReport": false, "canSchedule": false,
            "action": try actionJSON(["ready": false]),
        ])
        let presentation = NextStepPresentation.make(next: next, dates: dates(view))
        XCTAssertFalse(presentation.showsStart)
        XCTAssertFalse(presentation.showsReport)
        XCTAssertFalse(presentation.showsSchedule)
        XCTAssertTrue(presentation.isReadOnly)
    }

    func testDraftGoalOffersNoReportControls() throws {
        let view = try todayView()
        let next = try nextStep([
            "phase": "draft", "phaseLabel": "YOUR PLAN IS READY",
            "canStartGoal": true, "canStartAction": false, "canReport": false,
            "canSchedule": false,
        ])
        let presentation = NextStepPresentation.make(next: next, dates: dates(view))
        XCTAssertEqual(presentation.card.state, .draftGoal)
        XCTAssertFalse(presentation.card.showsReport)
        XCTAssertFalse(presentation.card.showsStart)
        XCTAssertTrue(presentation.showsStartGoal)
        // A Draft is never drawn read-only: `.draftGoal` already suppresses every control.
        XCTAssertFalse(presentation.isReadOnly)
    }

    func testDraftWithNoChosenWorkRoutesToTheCoach() throws {
        let view = try todayView()
        let next = try nextStep([
            "phase": "draft", "action": nil, "step": nil,
            "canStartGoal": false, "canStartAction": false, "canReport": false,
            "canSchedule": false,
        ])
        let presentation = NextStepPresentation.make(next: next, dates: dates(view))
        XCTAssertTrue(presentation.showsPlanFirstAction)
        XCTAssertNil(presentation.actionId)
    }

    func testStartedActionShowsTheStartedReceiptNotAReport() throws {
        let view = try todayView()
        let next = try nextStep([
            "phase": "working", "phaseLabel": "ONE THING TO FOCUS ON",
            "canStartAction": false, "canReport": true, "canSchedule": true,
            "action": try actionJSON(["startedAt": "2026-09-11T08:31:00.000Z"]),
        ])
        let presentation = NextStepPresentation.make(next: next, dates: dates(view))
        guard case .started = presentation.card.state else {
            return XCTFail("expected .started, got \(presentation.card.state)")
        }
        XCTAssertFalse(presentation.card.showsStart)
        XCTAssertTrue(presentation.card.reportIsProminent)
        XCTAssertFalse(presentation.isReadOnly)
        // `ActionCardState.started` is formatted by the design system with `Calendar.current`,
        // so only the shape is asserted here — the clock is the device's, not the workspace's.
        let started = try XCTUnwrap(presentation.card.receiptLine)
        XCTAssertTrue(started.hasPrefix("Started "))
        XCTAssertTrue(started.hasSuffix(" · not yet reported"))
    }

    func testReportedActionCollapsesToCorrectThisReport() throws {
        let view = try todayView()
        let next = try nextStep([
            "phase": "next", "phaseLabel": "CHECK-IN SAVED",
            "canStartAction": false, "canReport": true, "canSchedule": false,
            "action": try actionJSON([
                "outcome": "Done", "amount": 420,
                "history": [[
                    "outcome": "Done", "amount": 420, "actualMinutes": 25, "note": NSNull(),
                    "at": "2026-09-11T08:56:00.000Z",
                ]],
            ]),
        ])
        let presentation = NextStepPresentation.make(next: next, dates: dates(view))
        XCTAssertEqual(presentation.card.reportTitle, "Correct this report")
        XCTAssertFalse(presentation.card.showsStart)
        XCTAssertFalse(presentation.isReadOnly)
        // The card's receipt line reads the clock in the workspace time zone.
        XCTAssertEqual(presentation.card.state, .reported(receipt: "Saved 9:56 · Done · 420 words"))
    }

    func testInactiveGoalIsReadOnlyAndKeepsTheServerStatusLabel() throws {
        let view = try todayView()
        let next = try nextStep([
            "phase": "inactive", "phaseLabel": "PAUSED",
            "headline": "Pick this up when you’re ready.",
            "canStartAction": false, "canReport": false, "canSchedule": false,
        ])
        let presentation = NextStepPresentation.make(next: next, dates: dates(view))
        XCTAssertTrue(presentation.isReadOnly)
        XCTAssertEqual(presentation.phaseLabel, "PAUSED")
        XCTAssertEqual(presentation.headline, "Pick this up when you’re ready.")
    }

    // MARK: - Receipts

    func testUnreportedAmountReadsAsUnknownNeverZero() throws {
        let view = try todayView()
        let reported = try action([
            "outcome": "Partly", "amount": nil,
            "history": [[
                "outcome": "Partly", "amount": NSNull(), "actualMinutes": NSNull(),
                "note": NSNull(), "at": "2026-09-11T09:10:00.000Z",
            ]],
        ])
        let receipt = try XCTUnwrap(reportReceipt(for: reported, dates: dates(view)))
        XCTAssertNil(receipt.amountText)
        XCTAssertEqual(
            receiptSummary(receipt, dates: dates(view)),
            "Saved 10:10 · Partly · amount not reported")
    }

    func testACorrectionKeepsThePreviousValueVisible() throws {
        let view = try todayView()
        let corrected = try action([
            "outcome": "Partly", "amount": 120,
            "history": [
                [
                    "outcome": "Done", "amount": 400, "actualMinutes": 20, "note": NSNull(),
                    "at": "2026-09-11T08:56:00.000Z",
                ],
                [
                    "outcome": "Partly", "amount": 120, "actualMinutes": 10, "note": NSNull(),
                    "at": "2026-09-11T09:30:00.000Z",
                ],
            ],
        ])
        let receipt = try XCTUnwrap(reportReceipt(for: corrected, dates: dates(view)))
        XCTAssertEqual(receipt.correctedFrom, "Done · 400 words")
        XCTAssertEqual(
            receiptSummary(receipt, dates: dates(view)), "Saved 10:30 · Partly · 120 words")
    }

    func testAnUnreportedActionHasNoReceipt() throws {
        let view = try todayView()
        XCTAssertNil(reportReceipt(for: try action(), dates: dates(view)))
    }

    // MARK: - Lineup

    func testLineupPrintsTheServerStateLabelVerbatim() throws {
        let view = try todayView()
        let rows = view.lineup.map { LineupRow.make($0, palette: TodayGoalPalette(view)) }
        XCTAssertEqual(rows.first?.stateLabel, "Up next")
        XCTAssertEqual(rows.first?.state, .next)
        XCTAssertTrue(rows.first?.isEnabled == true)
        XCTAssertFalse(rows.first?.opensReport == true)
    }

    func testBlockedLineupRowIsInert() throws {
        let view = try todayView()
        let item = try XCTUnwrap(view.lineup.first)
        let blocked = TodayLineupItem(
            action: item.action, state: .blocked, stateLabel: "Waiting on earlier work",
            selected: false)
        let row = LineupRow.make(blocked, palette: TodayGoalPalette(view))
        XCTAssertFalse(row.isEnabled)
        XCTAssertEqual(row.stateLabel, "Waiting on earlier work")
    }

    func testReportedLineupRowOpensTheReportToCorrectIt() throws {
        let view = try todayView()
        let item = try XCTUnwrap(view.lineup.first)
        let done = TodayLineupItem(
            action: try action(["outcome": "Done"]), state: .done, stateLabel: "Done",
            selected: item.selected)
        let row = LineupRow.make(done, palette: TodayGoalPalette(view))
        XCTAssertTrue(row.opensReport)
        XCTAssertEqual(row.symbol, "checkmark.circle.fill")
    }

    // MARK: - 02 Progress

    func testMeasuredGoalShowsResultTargetUnitAndReportDate() throws {
        let view = try todayView()
        let row = try XCTUnwrap(view.progress.first { $0.measured })
        let presentation = ProgressRowPresentation.make(row, dates: dates(view))
        XCTAssertEqual(presentation.resultValue, "2,330")
        XCTAssertEqual(presentation.resultTarget, "20,000")
        XCTAssertEqual(presentation.resultUnit, "words")
        XCTAssertEqual(presentation.resultNote, "Reported 4 Sep")
    }

    func testMilestoneGoalSaysItsCountsAreVerified() throws {
        let view = try todayView()
        let row = try XCTUnwrap(view.progress.first { !$0.measured && $0.hasOutcome })
        let presentation = ProgressRowPresentation.make(row, dates: dates(view))
        XCTAssertEqual(presentation.resultUnit, "milestones verified")
        XCTAssertEqual(presentation.chart.measure, "Verified milestones")
    }

    func testTheServerDeltaLabelIsPrintedVerbatim() throws {
        let view = try todayView()
        for row in view.progress {
            let presentation = ProgressRowPresentation.make(row, dates: dates(view))
            XCTAssertEqual(presentation.comparisonLabel, row.label)
            XCTAssertEqual(presentation.actionLabel, row.actionLabel)
            XCTAssertEqual(presentation.prompt, row.prompt)
        }
    }

    func testComparisonNamesTheDueCheckpointTheGapAndTheNextOne() throws {
        let view = try todayView()
        let dates = dates(view)
        let row = try XCTUnwrap(view.progress.first { $0.measured && $0.due != nil })
        let due = try XCTUnwrap(row.due)
        let lines = ProgressRowPresentation.comparisonLines(row, dates: dates)
        // Built from the payload, so a regenerated fixture cannot silently pass.
        XCTAssertEqual(
            lines.first,
            "\(TodayNumber.short(due.value)) \(row.unit) planned by \(dates.short(due.date) ?? "")")
        let delta = try XCTUnwrap(row.delta)
        XCTAssertTrue(
            lines.contains(
                delta == 0 ? "Matches the saved checkpoint" : "\(TodayNumber.signed(delta)) vs checkpoint"))
        let next = try XCTUnwrap(row.next)
        XCTAssertTrue(
            lines.contains(
                "Next: \(TodayNumber.short(next.value)) \(row.unit) · \(dates.short(next.date) ?? "")"))
    }

    func testAMatchingResultSaysSoRatherThanShowingZero() throws {
        let view = try todayView()
        let row = try XCTUnwrap(view.progress.first { $0.delta == 0 && $0.due != nil })
        let lines = ProgressRowPresentation.comparisonLines(row, dates: dates(view))
        XCTAssertTrue(lines.contains("Matches the saved checkpoint"))
    }

    func testANegativeDeltaUsesTheMinusSignNotAHyphen() {
        XCTAssertEqual(TodayNumber.signed(-12), "−12")
        XCTAssertEqual(TodayNumber.signed(12), "+12")
    }

    func testAGoalWithNoMeasureGetsNoInventedTarget() throws {
        let view = try todayView()
        let row = try XCTUnwrap(view.progress.first { !$0.hasOutcome })
        let presentation = ProgressRowPresentation.make(row, dates: dates(view))
        XCTAssertEqual(presentation.resultUnit, "No outcome measure saved")
        XCTAssertEqual(presentation.resultValue, "—")
        XCTAssertNil(presentation.resultTarget)
        XCTAssertNil(presentation.chart.target)
        XCTAssertEqual(
            presentation.comparisonLines,
            ["Your actions stay separate from an outcome comparison."])
    }

    func testADraftWithNoReportSaysThePlanHasNotStarted() throws {
        let view = try todayView()
        let row = try XCTUnwrap(
            view.progress.first { $0.goal.status == .draft && $0.observedAt == nil })
        XCTAssertEqual(
            ProgressRowPresentation.make(row, dates: dates(view)).resultNote,
            "Goal saved · plan not started")
    }

    func testAnOutdatedReportAsksForANewerOneAndMarksTheChartStale() throws {
        let view = try todayView()
        let source = try XCTUnwrap(view.progress.first { $0.measured })
        let stale = GoalProgressRow(
            goal: source.goal, measured: true, actual: source.actual, target: source.target,
            unit: source.unit, observedAt: source.observedAt, observations: source.observations,
            checkpoints: source.checkpoints, due: source.due, next: source.next, delta: nil,
            comparable: false, label: "Update needed", tone: .attention, openMilestones: [],
            hasOutcome: true, needsUpdate: true, evidenceNote: nil, startDate: source.startDate,
            prompt: source.prompt, actionLabel: "Update progress")
        let presentation = ProgressRowPresentation.make(stale, dates: dates(view))
        XCTAssertTrue(
            presentation.comparisonLines.contains(
                "A newer report will make the comparison useful."))
        XCTAssertEqual(presentation.chart.staleNote, "Last report 4 Sep")
        // A measured goal that needs a result opens AddResult; everything else goes to the coach.
        XCTAssertTrue(presentation.opensAddResult)
    }

    func testAMilestoneGoalNeedingVerificationDoesNotOpenAddResult() throws {
        let view = try todayView()
        let source = try XCTUnwrap(view.progress.first { !$0.measured && $0.hasOutcome })
        let needsVerification = GoalProgressRow(
            goal: source.goal, measured: false, actual: source.actual, target: source.target,
            unit: source.unit, observedAt: source.observedAt, observations: source.observations,
            checkpoints: source.checkpoints, due: source.due, next: source.next, delta: nil,
            comparable: false, label: "Verify the milestone", tone: .attention,
            openMilestones: [OpenMilestoneRef(id: "m1", title: "Case study 2")],
            hasOutcome: true, needsUpdate: true, evidenceNote: nil, startDate: source.startDate,
            prompt: source.prompt, actionLabel: "Update progress")
        let presentation = ProgressRowPresentation.make(needsVerification, dates: dates(view))
        XCTAssertFalse(presentation.opensAddResult)
        XCTAssertTrue(presentation.comparisonLines.contains("Still open: Case study 2"))
    }

    func testFutureDatedReportsAreExcludedFromTheChart() throws {
        let view = try todayView()
        let source = try XCTUnwrap(view.progress.first { $0.measured })
        let withFuture = GoalProgressRow(
            goal: source.goal, measured: true, actual: source.actual, target: source.target,
            unit: source.unit, observedAt: source.observedAt,
            observations: source.observations + [
                ProgressObservation(date: "2027-01-01", value: 9_000)
            ],
            checkpoints: source.checkpoints, due: source.due, next: source.next,
            delta: source.delta, comparable: source.comparable, label: source.label,
            tone: source.tone, openMilestones: [], hasOutcome: true, needsUpdate: false,
            evidenceNote: nil, startDate: source.startDate, prompt: source.prompt,
            actionLabel: source.actionLabel)
        let chart = ProgressRowPresentation.chart(withFuture, dates: dates(view))
        XCTAssertEqual(chart.observed.count, source.observations.count)
    }

    func testTheProgressChartCarriesNoProjection() throws {
        let view = try todayView()
        for row in view.progress {
            let chart = ProgressRowPresentation.chart(row, dates: dates(view))
            XCTAssertNil(chart.projection, "Today 02 never draws a conditional projection")
            XCTAssertNil(chart.unavailableReason)
        }
    }

    // MARK: - 03 Learn

    func testLearningCardPrintsTheServerLabelsAndStatusSentence() throws {
        let view = try todayView()
        let card = try XCTUnwrap(view.learning.first)
        let presentation = LearningCardPresentation.make(
            card, dates: dates(view), palette: TodayGoalPalette(view))
        XCTAssertEqual(presentation.statusLabel, card.statusLabel)
        XCTAssertEqual(presentation.standingLabel, card.standingLabel)
        XCTAssertEqual(presentation.footnote, card.footnote)
        XCTAssertEqual(presentation.watchingLabel, card.watchingLabel)
        XCTAssertEqual(presentation.prompt, card.prompt)
    }

    func testDiscussTitleFollowsTheWorkflowLabel() {
        XCTAssertEqual(
            LearningCardPresentation.discussTitle(for: "Ready to review"), "Review with Adler")
        XCTAssertEqual(
            LearningCardPresentation.discussTitle(for: "Live experiment"), "Share an update")
        XCTAssertEqual(LearningCardPresentation.discussTitle(for: "Paused"), "Discuss with Adler")
        XCTAssertEqual(
            LearningCardPresentation.discussTitle(for: "Suggested"), "Discuss with Adler")
    }

    func testAPendingDecisionOffersReviewSuggestionInsteadOfExplore() throws {
        let view = try todayView()
        let card = try XCTUnwrap(view.learning.first)
        let palette = TodayGoalPalette(view)
        XCTAssertEqual(
            LearningCardPresentation.make(card, dates: dates(view), palette: palette).detailTitle,
            card.needsDecision ? "Review suggestion" : "Explore the experiment")
    }

    func testOnlyReportedAttemptsCountOnTheTimeline() throws {
        let view = try todayView()
        let source = try XCTUnwrap(view.learning.first)
        // A scheduled occurrence inside the test window with no report yet is not an attempt:
        // a planned date is not evidence that anything happened.
        let card = TodayLearningCard(
            recordId: source.recordId, version: source.version, actionVersion: source.actionVersion,
            controls: source.controls,
            attempts: source.attempts + [LearningAttempt(date: view.today, outcome: nil, actionId: nil)],
            activeVersion: source.activeVersion, pendingVersion: source.pendingVersion,
            state: source.state, standing: source.standing, statusLabel: source.statusLabel,
            standingLabel: source.standingLabel, goalIds: source.goalIds,
            goalTitles: source.goalTitles, change: source.change, observation: source.observation,
            hypothesis: source.hypothesis, watching: source.watching,
            watchingLabel: source.watchingLabel, startDate: source.startDate,
            reviewDate: source.reviewDate, needsDecision: source.needsDecision,
            reviewCount: source.reviewCount, footnote: source.footnote, prompt: source.prompt)
        let presentation = LearningCardPresentation.make(
            card, dates: dates(view), palette: TodayGoalPalette(view))
        XCTAssertEqual(presentation.attempts, card.attempts.filter { $0.outcome != nil }.count)
        XCTAssertLessThan(presentation.attempts, card.attempts.count)
    }

    func testControlTitlesMatchCopy() {
        XCTAssertEqual(LearningCardPresentation.controlTitle(.agree), "Try this")
        XCTAssertEqual(LearningCardPresentation.controlTitle(.decline), "No thanks")
        XCTAssertEqual(LearningCardPresentation.controlTitle(.pause), "Pause")
        XCTAssertEqual(LearningCardPresentation.controlTitle(.resume), "Resume")
        XCTAssertEqual(LearningCardPresentation.controlTitle(.close), "Finish trying this")
    }

    func testAgreeAndDeclineUseTheActionVersionAndTheRestUseTheCurrentOne() throws {
        let view = try todayView()
        let card = try XCTUnwrap(view.learning.first)
        XCTAssertEqual(card.version(for: .agree), card.actionVersion)
        XCTAssertEqual(card.version(for: .decline), card.actionVersion)
        XCTAssertEqual(card.version(for: .pause), card.version)
        XCTAssertEqual(card.version(for: .resume), card.version)
        XCTAssertEqual(card.version(for: .close), card.version)
    }

    func testOnlyTheControlsTheServerOffersAreShown() throws {
        let view = try todayView()
        for card in view.learning {
            let available = card.controls.available
            XCTAssertEqual(available.contains(.agree), card.controls.agree)
            XCTAssertEqual(available.contains(.resume), card.controls.resume)
        }
    }

    func testReconsiderStandingRaisesTheEvidenceChangedNote() throws {
        let view = try todayView()
        let palette = TodayGoalPalette(view)
        for card in view.learning {
            let presentation = LearningCardPresentation.make(
                card, dates: dates(view), palette: palette)
            XCTAssertEqual(presentation.showsReconsiderNote, card.standing == .reconsider)
        }
    }

    // MARK: - Goal colours

    func testPaletteResolvesColoursForLineupAndLearningGoals() throws {
        let view = try todayView()
        let palette = TodayGoalPalette(view)
        let guide = try XCTUnwrap(view.goals.first { $0.id == "guide" })
        XCTAssertEqual(palette.color("guide"), GoalColor.parse(guide.color))
        XCTAssertEqual(palette.title("guide"), guide.title)
        // An unknown goal falls back rather than inventing a hue.
        XCTAssertEqual(palette.color("no-such-goal"), GoalColor.parse(nil))
    }
}
