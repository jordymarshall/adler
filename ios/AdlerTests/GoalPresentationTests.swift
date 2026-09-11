import XCTest

@testable import Adler

/// All Goals: grouping, the weekly budget, the activity grid and the input sparkline.
///
/// Assertions are on relations and content, never on literal dates or ids — the fixtures are
/// regenerated relative to their run date (Core/README.md §6).
nonisolated final class GoalPresentationTests: XCTestCase {
    private let zone = TimeZone(identifier: "Europe/London")!

    private func goals() throws -> GoalsView {
        try Fixtures.load(GoalsView.self, "goals").response
    }

    // MARK: - Grouping

    func testSectionsPutFocusFirstAndKeepTheServerOrder() throws {
        let view = try goals()
        let sections = GoalPresentation.sections(view)

        XCTAssertEqual(sections.first?.title, "Focus")
        XCTAssertEqual(sections.first?.goalIds, ["portfolio"])
        XCTAssertEqual(sections.map(\.title), ["Focus", "Active", "Draft", "Paused"])
    }

    func testFocusGoalIsNotRepeatedInItsStatusGroup() throws {
        let view = try goals()
        let sections = GoalPresentation.sections(view)
        let active = try XCTUnwrap(sections.first { $0.title == "Active" })

        XCTAssertFalse(active.goalIds.contains("portfolio"))
        XCTAssertEqual(active.goalIds, ["guide"])
        XCTAssertEqual(sections.flatMap(\.goalIds).count, Set(sections.flatMap(\.goalIds)).count)
    }

    func testEmptyGroupsAreOmitted() throws {
        let view = try goals()
        let sections = GoalPresentation.sections(view)

        XCTAssertFalse(sections.contains { $0.goalIds.isEmpty })
        XCTAssertFalse(sections.contains { $0.title == "Completed" })
    }

    func testNoFocusSectionWhenNoActiveGoalHasFocusPriority() throws {
        let view = try goals()
        let withoutFocus = GoalsView(
            revision: view.revision,
            today: view.today,
            budget: view.budget,
            rows: view.rows.filter { $0.goal.id != "portfolio" },
            groups: view.groups.map { group in
                GoalGroup(
                    status: group.status,
                    goalIds: group.goalIds.filter { $0 != "portfolio" })
            },
            areas: view.areas,
            tags: view.tags)

        let sections = GoalPresentation.sections(withoutFocus)
        XCTAssertFalse(sections.contains { $0.title == "Focus" })
    }

    // MARK: - Rows

    func testActiveRowCarriesActivityGridSparklineAndServerOutlook() throws {
        let view = try goals()
        let row = try XCTUnwrap(view.row("guide"))
        let content = GoalPresentation.rowContent(row, today: view.today, timeZone: zone)

        XCTAssertNotNil(content.activity)
        XCTAssertNotNil(content.input)
        XCTAssertEqual(content.deltaLabel, row.outlook)
        XCTAssertTrue(content.resultLine.hasPrefix(row.resultLabel))
        XCTAssertTrue(content.chips.contains("Active"))
        // `Conditional on input pace` must stay visible next to the estimate.
        XCTAssertTrue(content.nextLine?.contains(row.outlookNote ?? "•") == true)
    }

    func testFocusPriorityShowsAsAChipButMaintainDoesNot() throws {
        let view = try goals()
        let focus = GoalPresentation.rowContent(
            try XCTUnwrap(view.row("portfolio")), today: view.today, timeZone: zone)
        let maintain = GoalPresentation.rowContent(
            try XCTUnwrap(view.row("guide")), today: view.today, timeZone: zone)

        XCTAssertEqual(focus.chips, ["Focus", "Active"])
        XCTAssertEqual(maintain.chips, ["Active"])
    }

    func testDraftRowHasNoChartsAndSaysThePlanHasNotStarted() throws {
        let view = try goals()
        let row = try XCTUnwrap(view.row("running"))
        let content = GoalPresentation.rowContent(row, today: view.today, timeZone: zone)

        XCTAssertNil(content.activity, "a Draft shows no grid rather than an empty one")
        XCTAssertNil(content.input)
        XCTAssertEqual(content.resultLine, "Goal saved · plan not started")
        XCTAssertTrue(content.chips.contains("Draft"))
    }

    // MARK: - Activity grid

    func testActivityGridIsSevenRowsEndingWithTheCurrentWeek() throws {
        let view = try goals()
        let row = try XCTUnwrap(view.row("portfolio"))
        let layout = try XCTUnwrap(
            GoalPresentation.activityLayout(
                row.activity, today: view.today, timeZone: zone, weeks: 12))

        XCTAssertEqual(layout.weeks.count, 12)
        XCTAssertTrue(layout.weeks.allSatisfy { $0.days.count == 7 })
        let today = try XCTUnwrap(GoalPresentation.date(view.today, in: zone))
        XCTAssertLessThanOrEqual(layout.start, today)
        XCTAssertGreaterThanOrEqual(layout.end, today)
    }

    func testServerRestMeansNothingWasScheduledNotAPlannedDayOff() {
        XCTAssertEqual(GoalPresentation.dayState(activity: .rest), .absent)
        XCTAssertEqual(GoalPresentation.dayState(activity: .planned), .upcoming)
        XCTAssertEqual(GoalPresentation.dayState(activity: .unknown), .unknown)
        XCTAssertEqual(GoalPresentation.dayState(activity: .missed), .missed)
    }

    func testAnUnreportedDayIsNeverDrawnAsMissed() throws {
        let view = try goals()
        let row = try XCTUnwrap(view.row("guide"))
        let layout = try XCTUnwrap(
            GoalPresentation.activityLayout(row.activity, today: view.today, timeZone: zone))
        let missed = layout.allDays.count { $0.state == .missed }
        let serverMissed = row.activity.count { $0.state == .missed }

        XCTAssertEqual(missed, serverMissed)
    }

    // MARK: - Input series

    func testSparklineOnlyPlotsRealOccurrencesAndKeepsUnknownAsUnknown() throws {
        let view = try goals()
        let row = try XCTUnwrap(view.row("guide"))
        let series = try XCTUnwrap(
            GoalPresentation.inputSeries(
                try XCTUnwrap(row.series), today: view.today, timeZone: zone))

        let saved = try XCTUnwrap(row.series)
        let occurrences = saved.points.filter {
            $0.scheduled || $0.amount != nil || $0.planned != nil || !$0.actionIds.isEmpty
        }
        XCTAssertEqual(series.points.count, occurrences.count)
        XCTAssertLessThan(series.points.count, saved.points.count)
        XCTAssertEqual(series.unit, "words")
        // A day the plan never asked for is absent from the chart, so it can never be read as
        // a missing report.
        let plotted = Set(series.points.map(\.date))
        let expected = Set(occurrences.compactMap { GoalPresentation.date($0.date, in: zone) })
        XCTAssertEqual(plotted, expected)
    }

    func testAnUnknownAmountIsNeverTurnedIntoZero() throws {
        let view = try goals()
        let row = try XCTUnwrap(view.row("guide"))
        let source = try XCTUnwrap(row.series)
        let series = try XCTUnwrap(
            GoalPresentation.inputSeries(source, today: view.today, timeZone: zone))

        for point in series.points {
            let saved = source.points.first { GoalPresentation.date($0.date, in: zone) == point.date }
            XCTAssertEqual(point.amount, saved?.amount)
        }
        XCTAssertFalse(series.points.contains { $0.amount == 0 && $0.state == .unknown })
    }

    func testGoalWithNoRepeatingMeasuredStepHasNoSparkline() throws {
        let view = try goals()
        let row = try XCTUnwrap(view.row("running"))
        XCTAssertNil(row.series)
    }

    // MARK: - Weekly budget

    func testBudgetSegmentsSumToTheServerTotal() throws {
        let view = try goals()
        let budget = GoalPresentation.budget(view.budget)

        XCTAssertEqual(budget.plannedMinutes, view.budget.totalMinutes)
        XCTAssertEqual(budget.budgetMinutes, view.budget.budgetMinutes)
        XCTAssertEqual(budget.segments.count, view.budget.goals.count)
    }

    func testBudgetFormatsHoursAndMinutes() {
        XCTAssertEqual(WeeklyBudget.duration(250), "4 h 10 min")
        XCTAssertEqual(WeeklyBudget.duration(45), "45 min")
        XCTAssertEqual(WeeklyBudget.duration(300), "5 h")

        let budget = WeeklyBudget(
            segments: [
                BudgetSegment(
                    id: "g", goal: DisplayGoal(id: "g", title: "G", hsl: "hsl(142 45% 35%)"),
                    minutes: 250)
            ],
            budgetMinutes: 300)
        XCTAssertEqual(budget.plannedText, "4 h 10 min planned of 5 h budget")
        XCTAssertFalse(budget.isOverBudget)
    }

    func testOverBudgetWeekIsHonestRatherThanClipped() {
        let budget = WeeklyBudget(
            segments: [
                BudgetSegment(
                    id: "g", goal: DisplayGoal(id: "g", title: "G", hsl: "hsl(142 45% 35%)"),
                    minutes: 420)
            ],
            budgetMinutes: 300)

        XCTAssertTrue(budget.isOverBudget)
        XCTAssertEqual(budget.scaleMinutes, 420, "the bar scales past the budget rule")
        // `overText` states the specific overage inline, so "over" is mid-sentence, not the
        // capitalised start of the COPY.md fallback string.
        XCTAssertTrue(budget.accessibilityLabel.contains("over your saved budget"))
    }

    // MARK: - Streak

    func testStreakDaysKeepPlannedRestDistinctFromAMiss() throws {
        let detail = try Fixtures.load(GoalDetailView.self, "goal-detail").response
        let days = GoalPresentation.streakDays(
            detail.streak, today: detail.today, timeZone: zone)

        XCTAssertEqual(days.count, detail.streak.days.count)
        for (mark, day) in zip(days, detail.streak.days) where day.date <= detail.today {
            switch day.status {
            case .on: XCTAssertEqual(mark.state, .done)
            case .off: XCTAssertEqual(mark.state, .rest)
            case .short: XCTAssertEqual(mark.state, .short)
            case .unknown: XCTAssertEqual(mark.state, .unknown)
            }
        }
        XCTAssertFalse(days.contains { $0.state == .missed })
    }

    func testStreakLabelSeparatesDaysOnPlanFromCompletedWork() {
        XCTAssertEqual(
            StreakSummary.label(daysOnPlan: 7, actionsCompleted: 4),
            "7 days on plan · 4 actions completed")
        XCTAssertEqual(
            StreakSummary.label(daysOnPlan: 1, actionsCompleted: 1),
            "1 day on plan · 1 action completed")
    }

    func testFixtureStreakCountsAreNotConflated() throws {
        let detail = try Fixtures.load(GoalDetailView.self, "goal-detail").response
        XCTAssertNotEqual(
            detail.streak.count, detail.streak.completedCount,
            "the seeded goal has planned rest inside its streak, which is the case the label exists for")
        XCTAssertEqual(
            StreakSummary.label(
                daysOnPlan: detail.streak.count, actionsCompleted: detail.streak.completedCount),
            "\(detail.streak.count) days on plan · \(detail.streak.completedCount) actions completed")
    }
}
