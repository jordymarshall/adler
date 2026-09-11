import Foundation

/// Converts the server's goal payloads into the design system's value types.
///
/// This file only translates — dates into `Date`, `hsl(…)` into `GoalColor`, server enum names
/// into `DayState`. Every label, delta, standing, outlook and projection sentence is printed as
/// the server sent it (contract §1, DESIGN.md §6 rule 6). Nothing here derives one.
nonisolated enum GoalPresentation {

    // MARK: - Goal identity

    static func displayGoal(_ ref: GoalRef) -> DisplayGoal {
        DisplayGoal(id: ref.id, title: ref.title, hsl: ref.color)
    }

    // MARK: - Dates

    /// Midday in the workspace zone: the anchor that survives being re-read in another
    /// calendar without sliding onto the previous or next day.
    static func date(_ day: YMD, in timeZone: TimeZone) -> Date? {
        day.noon(in: timeZone)
    }

    /// A Monday-first calendar in the workspace zone, so the activity grid's rows line up with
    /// the weeks the server counted.
    static func calendar(in timeZone: TimeZone) -> Calendar {
        var calendar = Calendar(identifier: .iso8601)
        calendar.firstWeekday = 2
        calendar.timeZone = timeZone
        return calendar
    }

    // MARK: - Day states

    /// `ActivityState` is what the activity grid counts. `rest` is the server's word for "no
    /// action was scheduled that day" (`shared/app-views.ts` `activityGrid`), which is
    /// `absent` here — not a *planned* day off, which only the streak knows about.
    static func dayState(activity: ActivityState) -> DayState {
        switch activity {
        case .done: .done
        case .partly: .partly
        case .missed: .missed
        case .rest: .absent
        case .unknown: .unknown
        case .planned: .upcoming
        }
    }

    static func dayState(execution: ExecutionStatus) -> DayState {
        switch execution {
        case .done: .done
        case .partial: .partly
        case .missed: .missed
        case .unknown: .unknown
        case .upcoming: .upcoming
        }
    }

    /// The streak's own vocabulary: `off` really is a planned day off, and it continues the
    /// count without adding completed work (COPY `streak.explain`).
    static func dayState(streak: StreakDayStatus, isFuture: Bool) -> DayState {
        if isFuture { return .upcoming }
        switch streak {
        case .on: return .done
        case .off: return .rest
        case .short: return .short
        case .unknown: return .unknown
        }
    }

    // MARK: - Activity grid

    /// All Goals only (structure decision; DESIGN.md §4.9).
    static func activityLayout(
        _ cells: [ActivityCell], today: YMD, timeZone: TimeZone, weeks: Int = 12
    ) -> ActivityGridLayout? {
        guard let todayDate = date(today, in: timeZone) else { return nil }
        let marks = cells.compactMap { cell -> DayMark? in
            guard let day = date(cell.date, in: timeZone) else { return nil }
            return DayMark(date: day, state: dayState(activity: cell.state))
        }
        return ActivityGridLayout(
            marks: marks, today: todayDate, weekCount: weeks, calendar: calendar(in: timeZone))
    }

    // MARK: - Streak

    static func streakDays(_ streak: StreakView, today: YMD, timeZone: TimeZone) -> [DayMark] {
        streak.days.compactMap { day in
            guard let date = date(day.date, in: timeZone) else { return nil }
            return DayMark(
                date: date, state: dayState(streak: day.status, isFuture: day.date > today))
        }
    }

    // MARK: - Input series

    /// Only real occurrences are plotted. A day the plan never asked for is left out
    /// altogether, so it can never be read as a missing report (the chart annotates every
    /// plotted day that has no amount with `No report`).
    ///
    /// `actions` supplies the reported state per date when it is known — in Goal detail the
    /// action records are in the same payload. All Goals has no action records, so a reported
    /// amount reads as `done` and an unreported occurrence stays `unknown`.
    static func inputSeries(
        _ view: InputSeriesView,
        today: YMD,
        timeZone: TimeZone,
        actions: [String: ActionView] = [:],
        isOneTime: Bool = false
    ) -> InputSeries? {
        let occurrences = view.points.filter { point in
            point.scheduled || point.amount != nil || point.planned != nil
                || !point.actionIds.isEmpty
        }
        guard !occurrences.isEmpty else { return nil }

        let points = occurrences.compactMap { point -> InputPoint? in
            guard let date = date(point.date, in: timeZone) else { return nil }
            let action = point.actionIds.compactMap { actions[$0] }.first
            let state: DayState
            if let action {
                state = dayState(execution: action.execution)
            } else if point.future || point.date > today {
                state = .upcoming
            } else if point.amount != nil {
                state = .done
            } else {
                state = .unknown
            }
            return InputPoint(
                date: date,
                amount: point.amount,
                planned: point.planned,
                state: state,
                retired: point.retired)
        }
        guard !points.isEmpty else { return nil }
        return InputSeries(
            points: points,
            unit: view.measure.unit,
            measure: view.measure.label,
            isOneTime: isOneTime)
    }

    // MARK: - All Goals rows

    static func rowContent(_ row: GoalRow, today: YMD, timeZone: TimeZone) -> GoalSummaryRowContent
    {
        let isDraft = row.goal.status == .draft
        var chips: [String] = []
        if row.priority == .focus { chips.append(GoalPriority.focus.rawValue) }
        chips.append(row.goal.status.rawValue)

        var result = isDraft ? GoalCopy.noPlan : row.resultLabel
        if !isDraft, let observed = row.observedAt, let date = date(observed, in: timeZone) {
            result += " · Reported \(AdlerDate.short(date))"
        }

        var next: [String] = [row.implication]
        if let action = row.nextAction {
            var line = "Next: \(action.title)"
            if let date = action.date, let day = self.date(date, in: timeZone) {
                line += " · \(AdlerDate.short(day))"
            }
            next.append(line)
        }
        if let note = row.outlookNote { next.append(note) }

        return GoalSummaryRowContent(
            goal: displayGoal(row.goal),
            chips: chips,
            resultLine: result,
            activity: isDraft
                ? nil : activityLayout(row.activity, today: today, timeZone: timeZone),
            input: isDraft
                ? nil
                : row.series.flatMap { inputSeries($0, today: today, timeZone: timeZone) },
            nextLine: {
                let line = next.filter { !$0.isEmpty }.joined(separator: " · ")
                return line.isEmpty ? nil : line
            }(),
            deltaLabel: row.outlook.isEmpty ? nil : row.outlook)
    }

    // MARK: - Weekly budget

    static func budget(_ view: WeeklyBudgetView) -> WeeklyBudget {
        WeeklyBudget(
            segments: view.goals.map { share in
                BudgetSegment(
                    id: share.goalId,
                    goal: DisplayGoal(id: share.goalId, title: share.title, hsl: share.color),
                    minutes: share.minutes)
            },
            budgetMinutes: view.budgetMinutes)
    }

    // MARK: - Grouping

    /// `Focus · Active · Draft · Paused · Completed · Set aside` (DESIGN.md §5.5), built from
    /// the server's own `groups[]` order. `Focus` is the priority the server saved, lifted out
    /// of the Active group only: a paused goal is not what you are focusing on now, and its
    /// `Focus` chip still shows in its own section.
    static func sections(_ view: GoalsView) -> [GoalSection] {
        let focusIds = view.groups
            .first { $0.status == .active }?
            .goalIds
            .filter { view.row($0)?.priority == .focus } ?? []

        var sections: [GoalSection] = []
        if !focusIds.isEmpty {
            sections.append(GoalSection(id: "Focus", title: "Focus", goalIds: focusIds))
        }
        for group in view.groups {
            let ids = group.goalIds.filter { !focusIds.contains($0) }
            guard !ids.isEmpty else { continue }
            sections.append(
                GoalSection(
                    id: group.status.rawValue, title: group.status.rawValue, goalIds: ids))
        }
        return sections
    }
}

/// One `Section` on All Goals. Empty groups are omitted before this is built.
nonisolated struct GoalSection: Identifiable, Equatable, Sendable {
    let id: String
    let title: String
    let goalIds: [String]
}

/// App-owned strings for the two goal screens (COPY.md §6 and §7). Server text is never
/// listed here — it is printed from the payload.
nonisolated enum GoalCopy {
    static let newGoal = "New goal"
    static let noPlan = "Goal saved · plan not started"
    static let allActions = "All actions"
    static let resultToReach = "Result to reach"
    static let showingFor = "Showing work for %@"
    static let markVerified = "Mark this milestone verified"
    static let verifiedNote =
        "A milestone result is verified separately from the actions contributing to it."
    static let startPlan = "Start plan"
    static let editGoal = "Edit goal"
    static let editMilestone = "Edit milestone"
    static let pause = "Pause goal"
    static let resume = "Resume goal"
    static let setAside = "Set goal aside"
    static let complete = "Complete goal"
    static let delete = "Delete goal"
    static let deleteConfirm =
        "Delete this goal? Its plan, actions, reports and learning records are removed."
    static let completeConfirm = "Confirm you’ve met your success criterion: %@"
    static let pauseConfirm =
        "This goal leaves your active list. Its actions, results and history stay here."
    static let learningHistory = "Learning history"
    static let learningEmpty = "Learning begins with your first actions."
    static let earlierPlan = "EARLIER PLAN"
    static let dailyReports = "Daily reports"
    static let oneTimeWork = "One-time work"
    static let historyAndSettings = "History & settings"
    static let whyThisPlan = "Why this plan?"
    static let assumptions = "Assumptions"
    static let whatWouldHelp = "What would make this possible?"
    static let flexible = "Flexible timeline"
    static let deadlineFirm = "Firm deadline"
    static let noDeadline = "No target date"
    static let conversations = "Conversations"
    static let allReports = "All reports & corrections"
    static let discussAction = "Discuss this action"
    static let report = "Report"
    static let correctReport = "Correct this report"

    static func targetDate(_ text: String) -> String { "Target · \(text)" }
    static func planVersion(_ version: Int) -> String { "PLAN · v\(version)" }
}
