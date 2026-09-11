import SwiftUI
import XCTest
@testable import Adler

// XCTestCase's overridable lifecycle members are nonisolated, so this class
// opts out of the project's MainActor-by-default isolation (see
// `.context/notes/scaffold.md`). Everything exercised here is pure value
// logic marked `nonisolated` in the design system.
nonisolated final class DesignSystemTests: XCTestCase {

    // MARK: - Goal colour parsing and the dark-mode lightness override

    func testParsesSpaceSeparatedHSL() {
        let color = GoalColor(hsl: "hsl(142 45% 35%)")
        XCTAssertEqual(color?.hue, 142)
        XCTAssertEqual(color?.saturation, 45)
    }

    func testParsesCommaSeparatedAndDegreeSuffixedHSL() {
        XCTAssertEqual(GoalColor(hsl: "hsl(28, 52%, 35%)")?.hue, 28)
        XCTAssertEqual(GoalColor(hsl: "hsl(210deg 40% 35%)")?.saturation, 40)
    }

    func testNormalisesOutOfRangeHueAndSaturation() {
        let wrapped = GoalColor(hue: 400, saturation: 140)
        XCTAssertEqual(wrapped.hue, 40)
        XCTAssertEqual(wrapped.saturation, 100)
        XCTAssertEqual(GoalColor(hue: -20, saturation: -5).hue, 340)
        XCTAssertEqual(GoalColor(hue: -20, saturation: -5).saturation, 0)
    }

    func testRejectsUnparseableColourSoCallersCanFallBack() {
        XCTAssertNil(GoalColor(hsl: "not a colour"))
        XCTAssertNil(GoalColor(hsl: "hsl(142)"))
        XCTAssertEqual(GoalColor.parse(nil), GoalColor.fallback)
        XCTAssertEqual(GoalColor.parse("rgb(x)"), GoalColor.fallback)
    }

    /// The lightness in the incoming string is ignored: the app applies 35%
    /// in light and 62% in dark so contrast holds in both appearances.
    func testIgnoresSuppliedLightnessAndAppliesTheAppsOwn() {
        XCTAssertEqual(GoalColor.lightness(for: .light), 35)
        XCTAssertEqual(GoalColor.lightness(for: .dark), 62)

        let fromDarkString = GoalColor(hsl: "hsl(142 45% 90%)")
        XCTAssertEqual(fromDarkString?.hue, 142, "lightness must not leak into hue/saturation")

        let (lightR, lightG, lightB) = GoalColor.rgb(hue: 142, saturation: 45, lightness: 35)
        let (darkR, darkG, darkB) = GoalColor.rgb(hue: 142, saturation: 45, lightness: 62)
        XCTAssertGreaterThan(darkR + darkG + darkB, lightR + lightG + lightB, "dark appearance must be lighter")
    }

    func testHSLToRGBMatchesKnownValues() {
        let (r, g, b) = GoalColor.rgb(hue: 0, saturation: 100, lightness: 50)
        XCTAssertEqual(r, 1, accuracy: 0.001)
        XCTAssertEqual(g, 0, accuracy: 0.001)
        XCTAssertEqual(b, 0, accuracy: 0.001)

        let (gr, gg, gb) = GoalColor.rgb(hue: 200, saturation: 0, lightness: 40)
        XCTAssertEqual(gr, 0.4, accuracy: 0.001)
        XCTAssertEqual(gg, 0.4, accuracy: 0.001)
        XCTAssertEqual(gb, 0.4, accuracy: 0.001)
    }

    // MARK: - Chart domains

    func testEmptySeriesGivesAnEmptyDomainNotAFabricatedOne() {
        XCTAssertEqual(ChartDomain.y([]).lowerBound, 0)
        XCTAssertEqual(ChartDomain.y([]).upperBound, 1)
    }

    func testNonNegativeSeriesIsAnchoredAtZero() {
        let domain = ChartDomain.y([25, 40])
        XCTAssertEqual(domain.lowerBound, 0)
        XCTAssertEqual(domain.upperBound, 43.2, accuracy: 0.001)
    }

    func testNegativeValuesExtendBelowZero() {
        let domain = ChartDomain.y([-5, 5])
        XCTAssertEqual(domain.lowerBound, -5.8, accuracy: 0.001)
        XCTAssertEqual(domain.upperBound, 5.8, accuracy: 0.001)
    }

    func testXDomainAlwaysContainsToday() {
        let first = Date(timeIntervalSince1970: 1_000_000)
        let last = first.addingTimeInterval(86_400 * 5)
        let today = last.addingTimeInterval(86_400 * 30)
        let domain = ChartDomain.x(dates: [first, last], today: today)
        XCTAssertLessThanOrEqual(domain.lowerBound, first)
        XCTAssertGreaterThanOrEqual(domain.upperBound, today)
        XCTAssertEqual(domain.lowerBound, first.addingTimeInterval(-43_200))
    }

    func testAxisTicksCollapseToThreeAtAccessibilitySizes() {
        let dates = (0..<10).map { Date(timeIntervalSince1970: Double($0) * 86_400) }
        let simplified = ChartDomain.ticks(dates, simplified: true)
        XCTAssertEqual(simplified.count, 3)
        XCTAssertEqual(simplified.first, dates.first)
        XCTAssertEqual(simplified.last, dates.last)
    }

    func testAxisTicksThinToAvoidCollidingLabels() {
        let dates = (0..<10).map { Date(timeIntervalSince1970: Double($0) * 86_400) }
        let ticks = ChartDomain.ticks(dates, simplified: false)
        XCTAssertLessThanOrEqual(ticks.count, 6)
        XCTAssertEqual(ticks, ticks.sorted())
        XCTAssertEqual(ticks.first, dates.first)
        XCTAssertEqual(ticks.last, dates.last)

        let minimumGap = dates[9].timeIntervalSince(dates[0]) / 5
        for (earlier, later) in zip(ticks, ticks.dropFirst()) {
            XCTAssertGreaterThanOrEqual(later.timeIntervalSince(earlier), minimumGap)
        }
    }

    /// A date with no report must keep its label: the `No report` note under
    /// it is the only place that fact appears on the chart.
    func testAxisTicksAlwaysKeepDatesWithNoReport() {
        let dates = (0..<10).map { Date(timeIntervalSince1970: Double($0) * 86_400) }
        let ticks = ChartDomain.ticks(dates, simplified: false, keeping: [dates[8]])
        XCTAssertTrue(ticks.contains(dates[8]))
        XCTAssertLessThanOrEqual(ticks.count, 6)
    }

    func testShortSeriesKeepsEveryTick() {
        let dates = (0..<3).map { Date(timeIntervalSince1970: Double($0) * 86_400) }
        XCTAssertEqual(ChartDomain.ticks(dates, simplified: false), dates)
    }

    func testMeasureCaptionNeverRepeatsTheUnit() {
        XCTAssertEqual(ChartDomain.measureAndUnit("Drafting time", "minutes"), "Drafting time in minutes")
        XCTAssertEqual(ChartDomain.measureAndUnit("Case studies published", "case studies"), "Case studies published")
    }

    // MARK: - Activity grid layout

    private var utcMonday: Calendar {
        var calendar = Calendar(identifier: .iso8601)
        calendar.firstWeekday = 2
        calendar.timeZone = TimeZone(identifier: "UTC")!
        return calendar
    }

    /// 2026-09-11 is a Friday.
    private var referenceToday: Date {
        utcMonday.date(from: DateComponents(year: 2026, month: 9, day: 11))!
    }

    func testGridIsSevenRowsByRequestedWeeksEndingInTodaysWeek() {
        let layout = ActivityGridLayout(marks: [], today: referenceToday, weekCount: 4, calendar: utcMonday)
        XCTAssertEqual(layout.weeks.count, 4)
        XCTAssertTrue(layout.weeks.allSatisfy { $0.days.count == 7 })

        let lastWeek = layout.weeks.last!
        XCTAssertTrue(
            lastWeek.days.contains { utcMonday.isDate($0.date, inSameDayAs: referenceToday) },
            "today must sit in the right-hand column"
        )
        XCTAssertEqual(utcMonday.mondayIndex(of: lastWeek.days[0].date), 0, "columns start on Monday")
        XCTAssertEqual(utcMonday.mondayIndex(of: referenceToday), 4, "Friday is index 4")
    }

    func testWeekCountIsCappedAtFourteen() {
        let layout = ActivityGridLayout(marks: [], today: referenceToday, weekCount: 40, calendar: utcMonday)
        XCTAssertEqual(layout.weeks.count, 14)
    }

    func testDaysWithoutAMarkAreAbsentNotMissed() {
        let layout = ActivityGridLayout(marks: [], today: referenceToday, weekCount: 2, calendar: utcMonday)
        XCTAssertTrue(layout.allDays.allSatisfy { $0.state == .absent })
        XCTAssertEqual(layout.reportedCount, 0)
        XCTAssertEqual(layout.caption, "No check-ins yet")
    }

    func testMarksLandOnTheirOwnDayAndAreCounted() {
        let marks = [
            DayMark(date: referenceToday, state: .done),
            DayMark(date: referenceToday.addingTimeInterval(-86_400), state: .partly),
            DayMark(date: referenceToday.addingTimeInterval(-2 * 86_400), state: .unknown),
            DayMark(date: referenceToday.addingTimeInterval(-3 * 86_400), state: .rest)
        ]
        let layout = ActivityGridLayout(marks: marks, today: referenceToday, weekCount: 2, calendar: utcMonday)
        let today = layout.allDays.first { utcMonday.isDate($0.date, inSameDayAs: referenceToday) }
        XCTAssertEqual(today?.state, .done)
        XCTAssertEqual(layout.doneCount, 1)
        XCTAssertEqual(layout.reportedCount, 2, "unknown and rest are not reports")
        XCTAssertTrue(layout.caption.contains("1 completed · 2 reported"))
    }

    /// Every state is announced separately. Folding `unknown`, `upcoming` and `absent` into one
    /// "no report" number told a VoiceOver user that future days and days the plan never asked
    /// for were neglected, and dropped `rest` and `short` entirely — so a week of below-plan
    /// reports and planned days off read as "0 done, 0 partly, 0 didn't happen".
    func testWeekAccessibilityLabelNamesEveryStateSeparately() {
        let day: TimeInterval = 86_400
        let marks = [
            DayMark(date: referenceToday, state: .done),
            DayMark(date: referenceToday.addingTimeInterval(-day), state: .short),
            DayMark(date: referenceToday.addingTimeInterval(-2 * day), state: .rest),
            DayMark(date: referenceToday.addingTimeInterval(-3 * day), state: .unknown),
            DayMark(date: referenceToday.addingTimeInterval(-4 * day), state: .missed),
            DayMark(date: referenceToday.addingTimeInterval(day), state: .upcoming)
        ]
        let layout = ActivityGridLayout(marks: marks, today: referenceToday, weekCount: 1, calendar: utcMonday)
        let label = layout.weeks[0].accessibilityLabel
        XCTAssertTrue(label.contains("1 done"), label)
        XCTAssertTrue(label.contains("1 reported below plan"), label)
        XCTAssertTrue(label.contains("1 planned day off"), label)
        XCTAssertTrue(label.contains("1 awaiting check-in"), label)
        XCTAssertTrue(label.contains("1 didn’t happen"), label)
        XCTAssertTrue(label.contains("1 upcoming"), label)
        XCTAssertFalse(label.contains("no report"), "the four states must not be merged: \(label)")
        // Zero counts are omitted rather than announced as "0 partly".
        XCTAssertFalse(label.contains("0 "), label)
    }

    /// D7. A goal created three weeks ago must not show eleven columns asserting that nothing
    /// was scheduled for dates before it existed.
    func testGridDoesNotInventHistoryBeforeTheFirstMark() {
        let day: TimeInterval = 86_400
        let marks = (0..<14).map {
            DayMark(date: referenceToday.addingTimeInterval(-Double($0) * day), state: .done)
        }
        let layout = ActivityGridLayout(
            marks: marks, today: referenceToday, weekCount: 14, calendar: utcMonday)
        XCTAssertLessThanOrEqual(layout.weeks.count, 3, "14 days of marks span at most 3 weeks")
        let firstMark = try? XCTUnwrap(marks.map(\.date).min())
        if let firstMark, let start = layout.weeks.first?.days.first?.date {
            XCTAssertLessThanOrEqual(
                start, firstMark, "the first column contains the earliest mark")
            XCTAssertLessThanOrEqual(
                firstMark.timeIntervalSince(start), 7 * day,
                "and starts no more than one week before it")
        }
    }

    /// D7. The caption is the server's `activitySummary.label`, not a client recomputation that
    /// can disagree with the server's own summary.
    func testGridPrefersTheServersCaption() {
        let marks = [DayMark(date: referenceToday, state: .done)]
        let layout = ActivityGridLayout(
            marks: marks, today: referenceToday, weekCount: 2, calendar: utcMonday,
            caption: "33% completed")
        XCTAssertTrue(layout.caption.hasPrefix("33% completed · "), layout.caption)
        XCTAssertFalse(layout.caption.contains("1 completed"), layout.caption)
    }

    // MARK: - Streak formatting

    func testStreakLabelKeepsDaysAndCompletionsSeparate() {
        XCTAssertEqual(
            StreakSummary.label(daysOnPlan: 7, actionsCompleted: 4),
            "7 days on plan · 4 actions completed"
        )
    }

    func testStreakLabelUsesSingularForOne() {
        XCTAssertEqual(
            StreakSummary.label(daysOnPlan: 1, actionsCompleted: 1),
            "1 day on plan · 1 action completed"
        )
        XCTAssertEqual(
            StreakSummary.label(daysOnPlan: 3, actionsCompleted: 0),
            "3 days on plan · 0 actions completed"
        )
    }

    // MARK: - Learning timeline date maths

    func testTimelinePlacesMarksAcrossTheLaneInOrder() {
        let start = Date(timeIntervalSince1970: 0)
        let day: TimeInterval = 86_400
        let layout = LearningTimelineLayout(
            plannedStart: start,
            attempts: [start + 5 * day, start + 1 * day],
            review: start + 10 * day,
            today: start + 6 * day
        )
        XCTAssertEqual(layout.marks.count, 4)
        XCTAssertEqual(layout.marks.map(\.kind), [.start, .attempt, .attempt, .review])
        XCTAssertEqual(layout.attempts, [start + 1 * day, start + 5 * day], "attempts are sorted")
        XCTAssertEqual(layout.marks[0].position, 0, accuracy: 0.0001)
        XCTAssertEqual(layout.marks[1].position, 0.1, accuracy: 0.0001)
        XCTAssertEqual(layout.marks[2].position, 0.5, accuracy: 0.0001)
        XCTAssertEqual(layout.marks[3].position, 1, accuracy: 0.0001)
        XCTAssertEqual(layout.runningFraction, 0.5, accuracy: 0.0001)
    }

    func testTimelineLeavesRoomForAFutureStart() {
        let today = Date(timeIntervalSince1970: 0)
        let day: TimeInterval = 86_400
        let layout = LearningTimelineLayout(
            plannedStart: today + 2 * day,
            attempts: [],
            review: nil,
            today: today
        )
        XCTAssertEqual(layout.startFraction, 1, accuracy: 0.0001)
        XCTAssertEqual(layout.runningFraction, 0, accuracy: 0.0001, "nothing is running before the start")
        XCTAssertEqual(layout.marks.count, 1)
    }

    func testTimelineSummaryNeverImpliesAReviewIsAResult() {
        let start = Date(timeIntervalSince1970: 0)
        let day: TimeInterval = 86_400
        let layout = LearningTimelineLayout(
            plannedStart: start,
            attempts: [start + day],
            review: start + 5 * day,
            today: start + 2 * day
        )
        let summary = layout.accessibilitySummary
        XCTAssertTrue(summary.contains("1 reported attempt:"), summary)
        XCTAssertTrue(summary.hasSuffix("A review date is not a result."), summary)

        let noReview = LearningTimelineLayout(plannedStart: start, attempts: [], review: nil, today: start)
        XCTAssertTrue(noReview.accessibilitySummary.contains("No attempts reported yet."))
        XCTAssertTrue(noReview.accessibilitySummary.contains("Review when there’s useful feedback."))
    }

    // MARK: - Report receipts: an omitted amount stays unknown

    func testReceiptSaysAmountNotReportedRatherThanZero() {
        let receipt = ReportReceipt(
            savedAt: Date(timeIntervalSince1970: 0),
            outcome: .done,
            amountText: nil
        )
        XCTAssertTrue(receipt.summary.hasSuffix("Done · amount not reported"), receipt.summary)
        XCTAssertFalse(receipt.summary.contains("Done · 0"), receipt.summary)
    }

    func testReceiptPrintsTheSavedAmountWhenThereIsOne() {
        let receipt = ReportReceipt(
            savedAt: Date(timeIntervalSince1970: 0),
            outcome: .partly,
            amountText: "12 pages"
        )
        XCTAssertTrue(receipt.summary.hasSuffix("Partly · 12 pages"), receipt.summary)
    }

    func testOutcomeRawValuesMatchTheServerContract() {
        XCTAssertEqual(ReportOutcome.done.rawValue, "Done")
        XCTAssertEqual(ReportOutcome.partly.rawValue, "Partly")
        XCTAssertEqual(ReportOutcome.missed.rawValue, "Didn’t happen")
    }

    // MARK: - DEBUG gallery deep link

    /// `GalleryPresentation` is MainActor-isolated like the rest of the
    /// module, so this one test re-isolates (the class itself must stay
    /// nonisolated for XCTestCase's initialiser overrides).
    @MainActor
    func testGalleryDeepLinkParsing() {
        let presentation = GalleryPresentation.shared
        presentation.isPresented = false
        presentation.item = nil

        XCTAssertFalse(presentation.handle(URL(string: "adler://goal/123")!))
        XCTAssertFalse(presentation.isPresented)

        XCTAssertTrue(presentation.handle(URL(string: "adler://gallery")!))
        XCTAssertTrue(presentation.isPresented)
        XCTAssertNil(presentation.item)

        XCTAssertTrue(presentation.handle(URL(string: "adler://gallery?item=outcome-chart")!))
        XCTAssertEqual(presentation.item, .outcomeChart)

        XCTAssertTrue(presentation.handle(URL(string: "adler://gallery?item=not-a-component")!))
        XCTAssertNil(presentation.item, "an unknown item opens the index rather than failing")

        presentation.isPresented = false
        presentation.item = nil
    }

    // MARK: - Weekly budget formatting

    func testBudgetDurationFormatting() {
        XCTAssertEqual(WeeklyBudget.duration(250), "4 h 10 min")
        XCTAssertEqual(WeeklyBudget.duration(45), "45 min")
        XCTAssertEqual(WeeklyBudget.duration(300), "5 h")
    }

    func testBudgetReportsOverBudgetAndScalesBeyondTheRule() {
        let goal = DisplayGoal(id: "g", title: "Portfolio", hsl: "hsl(142 45% 35%)")
        let budget = WeeklyBudget(
            segments: [BudgetSegment(id: "1", goal: goal, minutes: 400)],
            unplacedMinutes: 30,
            budgetMinutes: 300
        )
        XCTAssertTrue(budget.isOverBudget)
        XCTAssertEqual(budget.scaleMinutes, 430)
        XCTAssertEqual(budget.plannedText, "6 h 40 min planned of 5 h budget")
        // Unplaced work counts as over budget — the bar already draws it past the rule.
        XCTAssertEqual(budget.overMinutes, 130)
    }

    /// D8. The server returns `totalMinutes`, `overMinutes` and `scaleMinutes`; recomputing them
    /// lets the bar disagree with the same capacity validation the server refuses plans on.
    func testBudgetUsesTheServersFiguresWhenSupplied() {
        let goal = DisplayGoal(id: "g", title: "Portfolio", hsl: "hsl(142 45% 35%)")
        let budget = WeeklyBudget(
            segments: [BudgetSegment(id: "1", goal: goal, minutes: 400)],
            unplacedMinutes: 30,
            budgetMinutes: 300,
            serverTotalMinutes: 380,
            serverOverMinutes: 80,
            serverScaleMinutes: 500,
            sourceNote: "From your saved weekly minutes."
        )
        XCTAssertEqual(budget.plannedMinutes, 380)
        XCTAssertEqual(budget.overMinutes, 80)
        XCTAssertEqual(budget.scaleMinutes, 500)
        XCTAssertTrue(budget.isOverBudget)
        XCTAssertTrue(budget.overText.hasPrefix("1 h 20 min over"), budget.overText)
        // The breakdown and the provenance must reach VoiceOver, which gets no children.
        XCTAssertTrue(budget.accessibilityLabel.contains("Portfolio, 6 h 40 min."))
        XCTAssertTrue(budget.accessibilityLabel.contains("From your saved weekly minutes."))
    }

    // MARK: - Server-supplied tone and state (D6, D16)

    /// D6. Deciding emphasis by matching the label's words means one edit to the server's copy
    /// silently removes the warning triangle, with no compile error anywhere.
    func testDeltaEmphasisFollowsTheServersToneNotItsWords() {
        let goal = DisplayGoal(id: "g", title: "Portfolio", hsl: "hsl(142 45% 35%)")
        let unknownWording = GoalSummaryRowContent(
            goal: goal, resultLine: "1 of 3", deltaLabel: "Below checkpoint",
            deltaTone: .attention)
        XCTAssertEqual(unknownWording.deltaEmphasis, .attention)

        let quiet = GoalSummaryRowContent(
            goal: goal, resultLine: "1 of 3", deltaLabel: "Update needed", deltaTone: .quiet)
        XCTAssertEqual(quiet.deltaEmphasis, .outlined, "the value wins over the prose")

        // Without a tone the old string match still applies, so unadopted callers are unchanged.
        let legacy = GoalSummaryRowContent(
            goal: goal, resultLine: "1 of 3", deltaLabel: "Update needed")
        XCTAssertEqual(legacy.deltaEmphasis, .attention)
    }

    /// D9. The row replaces its children's accessibility, so the grid's period and the
    /// sparkline's measure and units have to be folded back into the row label.
    func testGoalRowLabelKeepsTheChartsInformation() {
        let goal = DisplayGoal(id: "g", title: "Portfolio", hsl: "hsl(142 45% 35%)")
        let series = InputSeries(
            points: [InputPoint(date: referenceToday, amount: 25, planned: 25, state: .done)],
            unit: "minutes",
            measure: "Drafting time")
        let content = GoalSummaryRowContent(
            goal: goal,
            resultLine: "1 of 3",
            activity: ActivityGridLayout(
                marks: [DayMark(date: referenceToday, state: .done)], today: referenceToday,
                weekCount: 2, calendar: utcMonday, caption: "50% completed"),
            input: series)
        let label = content.accessibilityLabel
        XCTAssertTrue(label.contains("50% completed"), label)
        XCTAssertTrue(label.contains("minutes"), label)
    }

    /// D16. Same class of bug as D6, in the two chip families.
    func testChipAttentionFollowsTheServerValue() {
        let pair = StatusChipPair(
            workflow: "Under review", standing: "Re-examining",
            workflowIsAttention: true, standingHasChanged: true)
        XCTAssertEqual(pair.workflow, "Under review")
        XCTAssertEqual(pair.workflowIsAttention, true)
        XCTAssertEqual(pair.standingHasChanged, true)
    }

    // MARK: - Forecast panel exclusivity (D5)

    /// Contract §4: never render an empty forecast panel. A projection with no line, or a blank
    /// assumption sentence, printed a legend claiming a projection over a chart with no marks.
    func testAnEmptyProjectionIsNeverRendered() {
        var content = OutcomeChartContent(
            unit: "case studies", measure: "Case studies published")
        content.projection = ProjectionContent(line: [], band: [], ifLabel: "If your pace holds")
        content.unavailableReason = "Two reports are not enough to project."
        XCTAssertNil(content.renderedProjection)
        XCTAssertEqual(content.renderedUnavailableReason, "Two reports are not enough to project.")

        content.unavailableReason = nil
        XCTAssertNil(content.renderedProjection, "an empty line is not a projection")
        XCTAssertNil(content.renderedUnavailableReason)

        content.projection = ProjectionContent(
            line: [OutcomePoint(date: referenceToday, value: 2)], band: [], ifLabel: "   ")
        XCTAssertNil(content.renderedProjection, "a blank assumption sentence states nothing")
    }

    func testTheUnavailableReasonWinsWhenBothAreSet() {
        var content = OutcomeChartContent(
            unit: "case studies", measure: "Case studies published")
        content.projection = ProjectionContent(
            line: [OutcomePoint(date: referenceToday, value: 2)],
            band: [ProjectionBandPoint(date: referenceToday, lower: 1, upper: 3)],
            ifLabel: "If your reported pace continues",
            rangeLabel: "Scenario range · 2 – 4 case studies")
        XCTAssertNotNil(content.renderedProjection)
        content.unavailableReason = "No outcome measure is saved."
        XCTAssertNil(content.renderedProjection, "they are documented as mutually exclusive")
        XCTAssertEqual(content.renderedUnavailableReason, "No outcome measure is saved.")
    }

    /// The dotted band boundaries compute to under the 3:1 non-text minimum, so the range has to
    /// be obtainable without sight.
    func testTheScenarioBandReachesVoiceOver() {
        var content = OutcomeChartContent(
            unit: "case studies", measure: "Case studies published")
        content.projection = ProjectionContent(
            line: [OutcomePoint(date: referenceToday, value: 2)],
            band: [ProjectionBandPoint(date: referenceToday, lower: 1, upper: 3)],
            ifLabel: "If your reported pace continues",
            rangeLabel: "Scenario range · 2 – 4 case studies")
        XCTAssertTrue(content.accessibilityLabel.contains("Scenario range · 2 – 4 case studies"))
        let names = content.descriptor().series.map(\.name)
        XCTAssertTrue(names.contains("Scenario range, lower boundary"), "\(names)")
        XCTAssertTrue(names.contains("Scenario range, upper boundary"), "\(names)")
    }

    // MARK: - Learning timeline: planned is not reported

    /// A record whose caption reads "No attempts reported yet" drew three filled dots, because
    /// every dated occurrence was passed as an attempt. A planned day the plan offered and
    /// nothing was reported for is an opportunity, not a result.
    func testPlannedOccurrencesAreNotAttempts() {
        let day: TimeInterval = 86_400
        let layout = LearningTimelineLayout(
            plannedStart: referenceToday.addingTimeInterval(-9 * day),
            occurrences: [
                .init(date: referenceToday.addingTimeInterval(-9 * day), reported: false),
                .init(date: referenceToday.addingTimeInterval(-7 * day), reported: false),
                .init(date: referenceToday.addingTimeInterval(-4 * day), reported: true)
            ],
            review: referenceToday.addingTimeInterval(5 * day),
            today: referenceToday)

        XCTAssertEqual(layout.attempts.count, 1)
        XCTAssertEqual(layout.plannedOccurrences.count, 2)
        XCTAssertEqual(layout.marks.filter { $0.kind == .attempt }.count, 1)
        XCTAssertEqual(layout.marks.filter { $0.kind == .planned }.count, 2)

        let summary = layout.accessibilitySummary
        XCTAssertTrue(summary.contains("2 planned days with no report"), summary)
        XCTAssertTrue(summary.contains("1 reported attempt"), summary)
        XCTAssertTrue(summary.contains("A review date is not a result."), summary)
    }

    /// Only a reported attempt advances the running segment. A planned date that came and went
    /// with no report is not progress.
    func testOnlyReportedAttemptsAdvanceTheLane() {
        let day: TimeInterval = 86_400
        let start = referenceToday.addingTimeInterval(-10 * day)
        let plannedOnly = LearningTimelineLayout(
            plannedStart: start,
            occurrences: [
                .init(date: referenceToday.addingTimeInterval(-8 * day), reported: false),
                .init(date: referenceToday.addingTimeInterval(-6 * day), reported: false)
            ],
            review: nil,
            today: referenceToday)
        XCTAssertEqual(plannedOnly.runningFraction, 0, accuracy: 0.0001)
        XCTAssertTrue(
            plannedOnly.accessibilitySummary.contains("No attempts reported yet"),
            plannedOnly.accessibilitySummary)
    }

    /// The review, the first occurrence and the last occurrence always keep their labels; when
    /// they are too close to a neighbour they move to the other side of the axis instead.
    func testTimelineLabelsAvoidCollisions() {
        let day: TimeInterval = 86_400
        let layout = LearningTimelineLayout(
            plannedStart: referenceToday.addingTimeInterval(-6 * day),
            attempts: (1...5).map { referenceToday.addingTimeInterval(-Double($0) * day) },
            review: referenceToday.addingTimeInterval(day),
            today: referenceToday)
        let review = try? XCTUnwrap(layout.marks.first { $0.kind == .review })
        XCTAssertEqual(review?.showsLabel, true)
        let occurrences = layout.marks.filter { $0.kind == .attempt || $0.kind == .planned }
        XCTAssertEqual(occurrences.first?.showsLabel, true)
        XCTAssertEqual(occurrences.last?.showsLabel, true)
        // Some middle labels must have been dropped, or they would overlap.
        XCTAssertLessThan(
            layout.marks.count { $0.showsLabel }, layout.marks.count)
    }

    /// The Today rule's label runs away from the nearer edge, so it cannot be clipped or pushed
    /// into the target label at the top-left.
    func testTodayLabelSideFollowsItsPositionInTheDomain() {
        let day: TimeInterval = 86_400
        var early = OutcomeChartContent(unit: "milestones", measure: "Milestones verified")
        early.today = referenceToday
        early.observed = [
            OutcomePoint(date: referenceToday, value: 0),
            OutcomePoint(date: referenceToday.addingTimeInterval(30 * day), value: 1)
        ]
        XCTAssertTrue(early.todayIsNearLeadingEdge)

        var late = early
        late.observed = [
            OutcomePoint(date: referenceToday.addingTimeInterval(-30 * day), value: 0),
            OutcomePoint(date: referenceToday, value: 1)
        ]
        XCTAssertFalse(late.todayIsNearLeadingEdge)
    }

    // MARK: - Report sheet pre-fill (D1)

    /// A correction that only edits the note must not present a measured amount as an empty
    /// field: the person retypes it, or believes it was lost.
    func testACorrectionReopensOnTheSavedValues() {
        let receipt = ReportReceipt(
            savedAt: referenceToday, outcome: .done, amountText: "25 minutes",
            correctedFrom: nil, amount: 25, minutes: 25, note: "Wrote in the morning.")
        let draft = receipt.draft(on: referenceToday)
        XCTAssertEqual(draft.outcome, .done)
        XCTAssertEqual(draft.amount, 25)
        XCTAssertEqual(draft.minutes, 25)
        XCTAssertEqual(draft.note, "Wrote in the morning.")
    }

    func testAReceiptWithNoAmountStaysUnknown() {
        let receipt = ReportReceipt(
            savedAt: referenceToday, outcome: .partly, amountText: nil, correctedFrom: nil)
        XCTAssertNil(receipt.draft(on: referenceToday).amount, "unknown is never zero")
        XCTAssertTrue(receipt.summary.contains("amount not reported"))
    }

    // MARK: - Evidence disclosure sections (D2)

    /// An empty WHAT REMAINS UNCERTAIN panel reads as "nothing is uncertain" — the opposite of
    /// the truth, and the most load-bearing honesty affordance in the recommendation UI.
    func testSparseEvidenceRecordHidesTheEmptySections() {
        let sparse = EvidenceRecord(mechanism: "A cue can start the work.")
        XCTAssertFalse(sparse.hasLimitations)
        XCTAssertFalse(sparse.hasVersionHistory)

        var withLimitation = sparse
        withLimitation.limitation = "Two reports are not a conclusion."
        XCTAssertTrue(withLimitation.hasLimitations)

        var withClaimLimitation = sparse
        withClaimLimitation.claims = [
            EvidenceClaim(
                id: "c1", relation: .supports, label: "Theory", statement: "Cues help.",
                role: .theory, limitations: ["Studied over single sessions."])
        ]
        XCTAssertTrue(withClaimLimitation.hasLimitations)

        var withHistory = sparse
        withHistory.identifiers = ["P7 · method: situation-modification"]
        XCTAssertTrue(withHistory.hasVersionHistory)
    }
}
