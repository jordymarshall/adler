import XCTest

@testable import Adler

/// Goal detail: plan version selection, the milestone rail, the report payload and the
/// projection's honest framing.
nonisolated final class GoalDetailPresentationTests: XCTestCase {
    private let zone = TimeZone(identifier: "Europe/London")!

    private func portfolio() throws -> GoalDetailView {
        try Fixtures.load(GoalDetailView.self, "goal-detail").response
    }

    private func guide() throws -> GoalDetailView {
        try Fixtures.load(GoalDetailView.self, "goal-detail-projection").response
    }

    // MARK: - Plan version selection

    func testChoosingTheCurrentPlanClearsTheVersionQuery() throws {
        let detail = try portfolio()
        let current = try XCTUnwrap(detail.plans.first { $0.current })

        XCTAssertNil(
            GoalDetailPresentation.planQuery(version: current.version, plans: detail.plans),
            "the current plan is requested without ?plan=, so the canvas stays editable")
    }

    func testChoosingAnEarlierPlanSendsThatVersion() {
        let plans = [makePlan(version: 1, current: false), makePlan(version: 2, current: true)]

        XCTAssertEqual(GoalDetailPresentation.planQuery(version: 1, plans: plans), 1)
        XCTAssertNil(GoalDetailPresentation.planQuery(version: 2, plans: plans))
    }

    func testTheLoadedPayloadSaysWhetherAnEarlierPlanIsShowing() throws {
        let detail = try portfolio()
        XCTAssertFalse(GoalDetailPresentation.isEarlierPlan(detail))
        XCTAssertEqual(detail.selectedPlanVersion, detail.currentPlan?.version)
    }

    func testSelectedPlanIsFoundByVersionNotByPosition() throws {
        let detail = try portfolio()
        let selected = try XCTUnwrap(detail.selectedPlan)
        XCTAssertEqual(selected.version, detail.selectedPlanVersion)
    }

    // MARK: - Milestone rail

    func testRailCarriesMilestonesCheckpointsAndReviewsWithTheirSavedState() throws {
        let detail = try portfolio()
        let markers = GoalDetailPresentation.markers(detail, timeZone: zone)

        XCTAssertEqual(markers.count, detail.execution.markers.count)
        XCTAssertTrue(markers.contains { $0.kind == .milestone })
        XCTAssertTrue(markers.contains { $0.kind == .review })
        XCTAssertTrue(markers.contains { $0.kind == .checkpoint })
        // A review marker is never "verified" — a date is not a result.
        XCTAssertTrue(markers.filter { $0.kind == .review }.allSatisfy { $0.state == .review })
    }

    func testMilestoneWithNoDueDateHasNoInventedDate() throws {
        let detail = try portfolio()
        let markers = GoalDetailPresentation.markers(detail, timeZone: zone)
        let milestone = try XCTUnwrap(markers.first { $0.id == "case-study-1" })

        XCTAssertNil(milestone.due)
        XCTAssertEqual(milestone.state, .open)
    }

    func testMarkerCountsAreSpelledOut() throws {
        let detail = try portfolio()
        let counts = GoalDetailPresentation.markerCounts(
            GoalDetailPresentation.markers(detail, timeZone: zone))

        XCTAssertTrue(counts.contains("verified"))
        XCTAssertTrue(counts.contains("open"))
        XCTAssertTrue(counts.contains("due for review"))
    }

    // MARK: - Reports

    func testABlankAmountStaysUnknownRatherThanZero() throws {
        let draft = ReportDraft(outcome: .done, amount: nil, minutes: nil, date: Date())
        let values = try XCTUnwrap(GoalDetailPresentation.reportValues(draft))

        XCTAssertEqual(values.outcome, .done)
        XCTAssertNil(values.amount)
        XCTAssertNil(values.minutes)
    }

    func testDidNotHappenRecordsAMeasuredZero() throws {
        let draft = ReportDraft(outcome: .missed, amount: nil, minutes: nil, date: Date())
        let values = try XCTUnwrap(GoalDetailPresentation.reportValues(draft))

        XCTAssertEqual(values.outcome, .didntHappen)
        XCTAssertEqual(values.outcome.rawValue, "Didn’t happen")
        XCTAssertEqual(values.amount, 0)
        XCTAssertEqual(values.minutes, 0)
    }

    func testAnExplicitAmountSurvivesUnchanged() throws {
        let draft = ReportDraft(outcome: .partly, amount: 1.5, minutes: 20, date: Date())
        let values = try XCTUnwrap(GoalDetailPresentation.reportValues(draft))

        XCTAssertEqual(values.outcome, .partly)
        XCTAssertEqual(values.amount, 1.5)
        XCTAssertEqual(values.minutes, 20)
    }

    func testNoOutcomeMeansNoPayload() {
        XCTAssertNil(GoalDetailPresentation.reportValues(ReportDraft(date: Date())))
    }

    func testReportedActionShowsItsAmountAndAnUnmeasuredOneSaysSo() throws {
        let detail = try portfolio()
        let reported = try XCTUnwrap(detail.actions.first { $0.outcome != nil && $0.amount != nil })
        let line = GoalDetailPresentation.receiptLine(
            outcome: try XCTUnwrap(reported.outcome), action: reported)

        XCTAssertTrue(line.hasPrefix(try XCTUnwrap(reported.outcome).rawValue))
        XCTAssertTrue(line.contains(reported.measure.unit))
        XCTAssertFalse(line.contains("amount not reported"))
    }

    // MARK: - Action selection

    func testCanvasOpensOnWorkThatIsStillToReport() throws {
        let detail = try guide()
        let action = try XCTUnwrap(
            GoalDetailPresentation.defaultAction(detail.planActions, today: detail.today))

        if detail.planActions.contains(where: { $0.outcome == nil && ($0.date ?? detail.today) >= detail.today }) {
            XCTAssertNil(action.outcome)
            XCTAssertGreaterThanOrEqual(try XCTUnwrap(action.date), detail.today)
        }
    }

    func testCanvasFallsBackToTheMostRecentDatedWork() throws {
        let detail = try portfolio()
        let action = try XCTUnwrap(
            GoalDetailPresentation.defaultAction(detail.planActions, today: detail.today))
        XCTAssertTrue(detail.planActions.contains { $0.id == action.id })
    }

    // MARK: - Outcome and projection

    func testProjectionIsRenderedAsAConditionalScenarioWithItsRange() throws {
        let detail = try guide()
        let content = try XCTUnwrap(
            GoalDetailPresentation.outcomeContent(detail, timeZone: zone))
        let projection = try XCTUnwrap(content.projection)

        XCTAssertTrue(projection.ifLabel.hasPrefix("If your reported pace continues"))
        XCTAssertEqual(
            projection.notProbability, "A scenario range, not a probability or a promised date.")
        XCTAssertFalse(projection.band.isEmpty)
        XCTAssertEqual(projection.line.count, projection.band.count)
        XCTAssertNil(content.unavailableReason, "a live projection never shows an unavailable reason too")
    }

    func testAScenarioWithNoLatestDateSaysBeyondTheHorizon() throws {
        let detail = try guide()
        let scenario = try XCTUnwrap(detail.projection.projection)
        let label = GoalDetailPresentation.rangeLabel(scenario, timeZone: zone)

        if scenario.latestDate == nil, scenario.earliestDate != nil {
            XCTAssertEqual(label?.contains("beyond this horizon"), true)
        }
        XCTAssertEqual(label?.hasPrefix("Scenario range · "), true)
    }

    func testNoProjectionPrintsTheSavedReasonVerbatimAndNoEmptyPanel() throws {
        let detail = try portfolio()
        let content = try XCTUnwrap(
            GoalDetailPresentation.outcomeContent(detail, timeZone: zone))

        XCTAssertNil(detail.projection.projection)
        XCTAssertNil(content.projection)
        XCTAssertEqual(content.unavailableReason, detail.projection.unavailableReason)
        XCTAssertEqual(
            content.unavailableReason,
            "Drafted sections and a published case study are tracked separately. There is no established conversion from sections drafted to a publication date."
        )
    }

    func testObservedResultsAreNeverFutureDatedAndBaselineIsLabelled() throws {
        let detail = try guide()
        let content = try XCTUnwrap(
            GoalDetailPresentation.outcomeContent(detail, timeZone: zone))
        let today = try XCTUnwrap(GoalPresentation.date(detail.today, in: zone))

        XCTAssertFalse(content.observed.contains { $0.date > today })
        XCTAssertEqual(content.measure, detail.projection.trackingLabel)
        XCTAssertEqual(content.startsFromBaseline, detail.checkpoints.first?.label == "Starting point")
    }

    // MARK: - Plan rationale

    func testRationaleBecomesAnEvidenceRecordWithItsClaimsAndSources() throws {
        let detail = try portfolio()
        let record = try XCTUnwrap(
            GoalDetailPresentation.evidenceRecord(detail.rationale, timeZone: zone))
        let reasoning = try XCTUnwrap(detail.rationale.reasoning)

        XCTAssertEqual(record.mechanism, reasoning.mechanism)
        XCTAssertEqual(record.fit, reasoning.fit)
        XCTAssertEqual(record.prediction, reasoning.prediction)
        XCTAssertEqual(record.reviewRule, reasoning.reviewRule)
        XCTAssertEqual(record.limitation, reasoning.limitation)
        XCTAssertEqual(record.claims.count, detail.rationale.grounding.count)
        XCTAssertEqual(record.sources.count, detail.rationale.sources.count)
        XCTAssertTrue(record.identifiers.contains("Plan v\(detail.rationale.planVersion)"))
    }

    func testClaimKeepsItsRelationGradeAndApplication() throws {
        let detail = try portfolio()
        let record = try XCTUnwrap(
            GoalDetailPresentation.evidenceRecord(detail.rationale, timeZone: zone))
        let claim = try XCTUnwrap(record.claims.first)
        let binding = try XCTUnwrap(detail.rationale.grounding.first)

        XCTAssertEqual(claim.relation.rawValue, binding.relation.rawValue)
        XCTAssertEqual(claim.application, binding.application)
        XCTAssertEqual(claim.statement, binding.claim?.statement)
        XCTAssertEqual(claim.grade, binding.claim?.grade)
        XCTAssertFalse(try XCTUnwrap(claim.grade).isEmpty, "a grade is saved prose, not a number")
    }

    func testAPlanWithNoSavedRationaleProducesNoRecord() {
        let empty = RationaleView(
            planVersion: 2, basis: nil, reasoning: nil, grounding: [], sources: [],
            recommendations: [], decisionId: nil, windowRationale: nil, assessmentQuestion: nil,
            note: "This plan records your chosen work.")

        XCTAssertNil(GoalDetailPresentation.evidenceRecord(empty, timeZone: zone))
    }

    // MARK: - Header

    func testTargetLineNamesTheDeadlineFlexibilityItSaved() throws {
        let detail = try portfolio()
        let line = try XCTUnwrap(GoalDetailPresentation.targetLine(detail, timeZone: zone))

        XCTAssertTrue(line.contains("Target · "))
        XCTAssertTrue(line.contains("Flexible timeline"))
        XCTAssertTrue(line.contains(try XCTUnwrap(detail.unit)))
    }

    // MARK: - Helpers

    private func makePlan(version: Int, current: Bool) -> PlanView {
        PlanView(
            version: version, date: YMD("2026-09-01"), current: current, action: "Work",
            criterion: "Done", timing: "Morning", durationMinutes: 25, approach: nil, window: nil,
            assessment: nil, experiment: nil, steps: [], projection: nil,
            projectionUnavailableReason: nil, hasBasis: false, hasReasoning: false)
    }
}
