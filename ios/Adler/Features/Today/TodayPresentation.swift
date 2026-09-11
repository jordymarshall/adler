import Foundation

// Pure mapping from the `TodayView` payload (Core/Models) to the value types the design system
// draws (DesignSystem/Components). No view code, no network, no derived *labels* — every label
// the server computes (`stateLabel`, `statusLabel`, `standingLabel`, `label`, `actionLabel`,
// `footnote`, `phaseLabel`) is printed verbatim. What is derived here is layout-shaped only:
// which controls a phase permits, how a date reads, which chart series exist.
//
// Everything in this file is a `nonisolated` value type so `AdlerTests/TodayPresentationTests`
// can exercise it without a store, a server or a simulator window.

// MARK: - Deck index

/// The three chapters, and the arithmetic that keeps `AppRouter.todayCard` and the
/// `CardDeck` integer selection in step. `TodayCard.allCases` is the single ordering.
nonisolated enum TodayDeck {
    static let cards: [TodayCard] = TodayCard.allCases
    static let count = TodayCard.allCases.count

    /// Short chapter titles for the pager pill (COPY.md `today.card1…3`).
    static let titles = ["Do", "Progress", "Learn"]
    /// COPY.md `today.card1Title…card3Title`.
    static let cardTitles = [
        "What you need to do today", "Your progress", "What we’re learning",
    ]
    /// COPY.md `a11y.today.card1…3`.
    static let accessibilityLabels = [
        "1 of 3: What you need to do today",
        "2 of 3: Your progress",
        "3 of 3: What we’re learning",
    ]

    static func index(of card: TodayCard) -> Int {
        cards.firstIndex(of: card) ?? 0
    }

    /// Out-of-range indexes clamp rather than crash: the deck is driven by a scroll position
    /// and by deep links, and neither is guaranteed to be in range.
    static func card(at index: Int) -> TodayCard {
        cards[min(max(index, 0), count - 1)]
    }

    /// `01 / 03` (COPY.md `today.position`).
    static func position(_ index: Int) -> String {
        String(format: "%02d / %02d", min(max(index, 0), count - 1) + 1, count)
    }
}

// MARK: - Dates

/// One place where a `YMD` becomes a printable string, always in the workspace time zone
/// (never the device's). COPY.md conventions: `d MMM`, or `d MMM yyyy` across a year boundary.
nonisolated struct TodayDates: Equatable, Sendable {
    let today: YMD
    let timeZone: TimeZone

    init(today: YMD, timeZone: TimeZone) {
        self.today = today
        self.timeZone = timeZone
    }

    var calendar: Calendar {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = timeZone
        calendar.locale = Locale(identifier: "en_GB")
        return calendar
    }

    /// Midday, matching the anchor the web uses when it formats a bare day.
    var todayDate: Date { today.noon(in: timeZone) ?? Date() }

    func date(_ day: YMD) -> Date? { day.noon(in: timeZone) }

    /// `13 Oct`. `nil` for an unparseable day, so a malformed value is omitted rather than
    /// printed as a wrong date.
    func short(_ day: YMD?) -> String? {
        guard let day, let date = date(day) else { return nil }
        return AdlerDate.short(date, today: todayDate, calendar: calendar)
    }

    /// `Tue 13 Oct` — the deck header.
    func headerDate() -> String {
        AdlerDate.weekdayShort(todayDate, today: todayDate, calendar: calendar)
    }

    func time(_ timestamp: Timestamp?) -> String? {
        guard let date = timestamp?.date else { return nil }
        return AdlerDate.time(date, calendar: calendar)
    }

    /// `Earlier work · 11 Oct` / `Coming up · 15 Oct` (COPY.md `do.earlier` / `do.upcoming`).
    /// `nil` when the action is dated today or has no date — a note is only shown when it is true.
    func workDateNote(for day: YMD?) -> String? {
        guard let day, day != today, let text = short(day) else { return nil }
        return day < today ? "Earlier work · \(text)" : "Coming up · \(text)"
    }
}

// MARK: - Goal colours

/// `ActionView` and `TodayLearningCard` carry a goal **id** but no colour, so the colour comes
/// from the `GoalRef`s the same payload supplies. Never re-implement `src/goal-colors.ts`
/// (DESIGN.md §3.1) — the server's `hsl(H S% L%)` string is the only source.
nonisolated struct TodayGoalPalette: Equatable, Sendable {
    private let colors: [String: String]
    private let titles: [String: String]

    init(_ view: TodayView) {
        var colors: [String: String] = [:]
        var titles: [String: String] = [:]
        for ref in view.goals + view.progress.map(\.goal) + [view.next?.goal].compactMap({ $0 }) {
            colors[ref.id] = ref.color
            titles[ref.id] = ref.title
        }
        self.colors = colors
        self.titles = titles
    }

    init(colors: [String: String], titles: [String: String] = [:]) {
        self.colors = colors
        self.titles = titles
    }

    /// Falls back to the design system's neutral goal colour rather than inventing a hue.
    func color(_ goalId: String?) -> GoalColor {
        GoalColor.parse(goalId.flatMap { colors[$0] })
    }

    func title(_ goalId: String?) -> String? {
        goalId.flatMap { titles[$0] }
    }
}

// MARK: - Numbers

nonisolated enum TodayNumber {
    /// Matches the web's `toLocaleString(undefined, { maximumFractionDigits: 1 })`.
    static func short(_ value: Double) -> String {
        value.formatted(.number.precision(.fractionLength(0...1)))
    }

    /// `+330` / `−12`, using U+2212 for the minus, as the web does.
    static func signed(_ value: Double) -> String {
        (value > 0 ? "+" : "−") + short(abs(value))
    }
}

// MARK: - 01 Do — the next step

/// What the phase and the server's capability flags permit for the featured action.
///
/// The server decides: `canStartAction`, `canReport`, `canSchedule` and `canStartGoal` are
/// computed in `shared/app-views.ts` from the goal status, the plan phase, the action's date
/// and its prerequisites. Nothing is inferred from the action alone here.
nonisolated struct NextStepPresentation: Equatable, Sendable {
    /// `YOUR NEXT STEP`, `YOUR PLAN IS READY`, … verbatim from the payload; empty for an
    /// inactive goal, where the payload sends the uppercased goal status instead.
    let phaseLabel: String
    let headline: String
    let goal: GoalRef
    let card: ActionCardModel
    /// `Earlier work · 11 Oct` / `Coming up · 15 Oct`, or `nil`.
    let dateNote: String?
    let showsStart: Bool
    let showsReport: Bool
    let showsSchedule: Bool
    /// A Draft plan the person can activate (`POST /api/app/goals/:id/start`).
    let showsStartGoal: Bool
    /// A Draft goal with nothing chosen yet — routes to the coach, never to a report.
    let showsPlanFirstAction: Bool
    /// `true` when the design system's ``ActionCard`` cannot express the permitted control set
    /// (its controls are inferred from `ActionCardState`, which has no "scheduled ahead" or
    /// "waiting on earlier work" case). The Do card draws the read-only variant instead.
    let isReadOnly: Bool
    /// The action the controls act on; `nil` for a Draft with no chosen work.
    let action: ActionView?
    /// The single-line receipt for a reported action (`Saved 8:56 · Done · 25 minutes`).
    let receipt: ReportReceipt?

    var actionId: String? { action?.id }

    static func make(next: TodayNextStep, dates: TodayDates) -> NextStepPresentation {
        let goal = next.goal
        let action = next.action
        let isDraftGoal = next.phase == .draft || goal.status == .draft
        let receipt = action.flatMap { reportReceipt(for: $0, dates: dates) }

        let state: ActionCardState
        if let action, action.retiredAt != nil {
            state = .retired
        } else if isDraftGoal {
            state = .draftGoal
        } else if let receipt {
            state = .reported(receipt: receiptSummary(receipt, dates: dates))
        } else if let started = action?.startedAt?.date {
            state = .started(at: started)
        } else if let block = action?.block, let start = block.start.date {
            state = .scheduled(at: start)
        } else {
            state = .planned
        }

        // The permitted set, straight from the payload.
        let canStart = next.canStartAction && action != nil
        let canReport = next.canReport && action != nil
        let canSchedule = next.canSchedule && action != nil

        // `ActionCardState` decides which buttons ``ActionCard`` draws. Where that inference
        // would show a control the server has refused — a future-dated action, work waiting on
        // an earlier step, a paused goal — the Do card draws its own read-only card instead.
        let inferredStart = state == .planned || isScheduled(state)
        let inferredReport: Bool = {
            switch state {
            case .planned, .started, .scheduled, .reported: true
            case .draftGoal, .restDay, .retired: false
            }
        }()
        let inferredSchedule: Bool = {
            switch state {
            case .planned, .started, .scheduled: true
            case .reported, .draftGoal, .restDay, .retired: false
            }
        }()
        let mismatched =
            (inferredStart && !canStart) || (inferredReport && !canReport)
            || (inferredSchedule && !canSchedule)

        let model = ActionCardModel(
            goal: DisplayGoal(id: goal.id, title: goal.title, hsl: goal.color),
            title: next.headline,
            criterion: trimmed(next.criterionLabel),
            timing: trimmed(next.timingLabel),
            cue: cue(for: action, next: next),
            state: state
        )

        return NextStepPresentation(
            phaseLabel: next.phaseLabel,
            headline: next.headline,
            goal: goal,
            card: model,
            dateNote: dates.workDateNote(for: action?.date),
            showsStart: canStart,
            showsReport: canReport,
            showsSchedule: canSchedule,
            showsStartGoal: next.canStartGoal,
            showsPlanFirstAction: isDraftGoal && action == nil,
            isReadOnly: mismatched && !isDraftGoal,
            action: action,
            receipt: receipt
        )
    }

    private static func isScheduled(_ state: ActionCardState) -> Bool {
        if case .scheduled = state { return true }
        return false
    }

    /// The step's saved cue, but only when it is not already the action's `timing` — the
    /// criterion line omits repeats rather than printing the same phrase twice.
    private static func cue(for action: ActionView?, next: TodayNextStep) -> String? {
        guard let cue = trimmed(next.step?.cue) else { return nil }
        if let timing = trimmed(action?.timing), timing == cue { return nil }
        if next.timingLabel?.contains(cue) == true { return nil }
        return cue
    }

    private static func trimmed(_ value: String?) -> String? {
        guard let value else { return nil }
        let text = value.trimmingCharacters(in: .whitespacesAndNewlines)
        return text.isEmpty ? nil : text
    }
}

/// `Saved 8:56 · Done · 25 words`, built from the action's newest saved report.
/// An unreported amount reads `amount not reported` — never `0`.
///
/// `ReportReceipt.summary` formats its time with `Calendar.current`, i.e. the **device's** time
/// zone. Every other time in Today is read in the workspace time zone, so the card's receipt
/// line is built by ``receiptSummary(_:dates:)`` instead. (Design-system follow-up: let
/// `ReportReceipt` carry a calendar.)
nonisolated func reportReceipt(for action: ActionView, dates: TodayDates) -> ReportReceipt? {
    guard let outcome = action.outcome, let reported = ReportOutcome(rawValue: outcome.rawValue)
    else { return nil }
    let history = action.history
    let latest = history.last
    let savedAt = latest?.at.date ?? action.startedAt?.date ?? dates.todayDate
    let amount = action.amount ?? latest?.amount
    let unit = action.measure.unit
    let amountText = amount.map { "\(TodayNumber.short($0)) \(unit)" }
    let previous = history.count > 1 ? history[history.count - 2] : nil
    let correctedFrom = previous.flatMap { entry -> String? in
        guard let earlier = entry.outcome else { return nil }
        let value = entry.amount.map { " · \(TodayNumber.short($0)) \(unit)" } ?? ""
        return "\(earlier.rawValue)\(value)"
    }
    return ReportReceipt(
        savedAt: savedAt, outcome: reported, amountText: amountText, correctedFrom: correctedFrom)
}

/// The same sentence as `ReportReceipt.summary`, with the clock read in the **workspace** time
/// zone rather than the device's.
nonisolated func receiptSummary(_ receipt: ReportReceipt, dates: TodayDates) -> String {
    let time = AdlerDate.time(receipt.savedAt, calendar: dates.calendar)
    let amount = receipt.amountText ?? "amount not reported"
    return "Saved \(time) · \(receipt.outcome.rawValue) · \(amount)"
}

/// One row of `TODAY’S LINEUP`. `stateLabel` is the server's string, printed verbatim.
nonisolated struct LineupRow: Equatable, Sendable, Identifiable {
    let id: String
    let title: String
    let goalTitle: String
    let goalColor: GoalColor
    /// `Done` · `Partly` · `Didn’t happen` · `Waiting on earlier work` · `Started` · `Up next` ·
    /// `View action` — the server's `stateLabel`.
    let stateLabel: String
    let state: LineupState
    let selected: Bool
    /// Blocked work is inert: a prerequisite is not met, so there is nothing to do here yet.
    let isEnabled: Bool
    /// Tapping a reported row reopens the report to correct it.
    let opensReport: Bool
    let goalId: String
    let symbol: String

    var accessibilityLabel: String {
        "\(title). \(goalTitle). \(stateLabel)."
    }

    static func make(_ item: TodayLineupItem, palette: TodayGoalPalette) -> LineupRow {
        let action = item.action
        let symbol: String =
            switch item.state {
            case .done: "checkmark.circle.fill"
            case .partly: "circle.lefthalf.filled"
            case .missed: "slash.circle"
            case .started: "play.circle"
            case .blocked: "lock.circle"
            default: "circle"
            }
        return LineupRow(
            id: action.id,
            title: action.title,
            goalTitle: action.goalTitle,
            goalColor: palette.color(action.goalId),
            stateLabel: item.stateLabel,
            state: item.state,
            selected: item.selected,
            isEnabled: action.outcome != nil || item.state != .blocked,
            opensReport: action.outcome != nil,
            goalId: action.goalId,
            symbol: symbol
        )
    }
}

// MARK: - 02 Progress

/// One goal row on card 02. Every sentence here comes from `GoalProgressRow`; the only thing
/// composed locally is the arrangement, using the COPY.md §5b formats.
nonisolated struct ProgressRowPresentation: Equatable, Sendable, Identifiable {
    let id: String
    let goal: GoalRef
    let goalColor: GoalColor
    /// `1 / 3` — or `—` when nothing is recorded. Never an invented zero.
    let resultValue: String
    let resultTarget: String?
    /// `words`, `milestones verified`, or `No outcome measure saved`.
    let resultUnit: String
    /// `Reported 8 Oct` · `Saved starting point` · `Goal saved · plan not started`.
    let resultNote: String
    /// The server's delta label, verbatim.
    let comparisonLabel: String
    let comparisonLines: [String]
    let chart: OutcomeChartContent
    let actionLabel: String
    let prompt: String
    /// `Add a result` / `Update needed` on a measured goal opens AddResult; everything else
    /// routes to the coach (FLOWS.md §5).
    let opensAddResult: Bool

    static func make(_ row: GoalProgressRow, dates: TodayDates) -> ProgressRowPresentation {
        let unit =
            row.hasOutcome
            ? (row.measured ? row.unit : "\(row.unit) verified") : "No outcome measure saved"

        let note: String
        if let observedAt = row.observedAt, let text = dates.short(observedAt) {
            note = "Reported \(text)"
        } else if row.measured, row.actual != nil {
            note = "Saved starting point"
        } else if row.goal.status == .draft {
            note = "Goal saved · plan not started"
        } else {
            note = "Current saved record"
        }

        return ProgressRowPresentation(
            id: row.goal.id,
            goal: row.goal,
            goalColor: GoalColor.parse(row.goal.color),
            resultValue: row.actual.map(TodayNumber.short) ?? "—",
            resultTarget: row.target > 0 ? TodayNumber.short(row.target) : nil,
            resultUnit: unit,
            resultNote: note,
            comparisonLabel: row.label,
            comparisonLines: comparisonLines(row, dates: dates),
            chart: chart(row, dates: dates),
            actionLabel: row.actionLabel,
            prompt: row.prompt,
            opensAddResult: row.needsUpdate && row.measured
        )
    }

    static func comparisonLines(_ row: GoalProgressRow, dates: TodayDates) -> [String] {
        var lines: [String] = []
        if let due = row.due {
            if let date = dates.short(due.date) {
                lines.append("\(TodayNumber.short(due.value)) \(row.unit) planned by \(date)")
            }
            if !row.openMilestones.isEmpty {
                lines.append(
                    "Still open: " + row.openMilestones.map(\.title).joined(separator: ", "))
            } else if let delta = row.delta {
                lines.append(
                    delta == 0
                        ? "Matches the saved checkpoint"
                        : "\(TodayNumber.signed(delta)) vs checkpoint")
            }
            if row.needsUpdate {
                lines.append(
                    row.observedAt != nil
                        ? "A newer report will make the comparison useful."
                        : "Update the result to compare it with the plan.")
            }
            if let next = row.next, let date = dates.short(next.date) {
                lines.append("Next: \(TodayNumber.short(next.value)) \(row.unit) · \(date)")
            }
        } else if let next = row.next, let date = dates.short(next.date) {
            lines.append("Next checkpoint · \(date)")
            lines.append("\(TodayNumber.short(next.value)) \(row.unit) planned")
        } else if row.hasOutcome {
            lines.append("Add a dated checkpoint to compare your result with the plan.")
        } else {
            lines.append("Your actions stay separate from an outcome comparison.")
        }
        return lines
    }

    /// Observations and saved checkpoints only. Today card 02 never shows a projection —
    /// the conditional model belongs on goal detail, next to its assumptions.
    static func chart(_ row: GoalProgressRow, dates: TodayDates) -> OutcomeChartContent {
        let observed =
            row.observations
            .filter { $0.date <= dates.today }
            .compactMap { point in
                dates.date(point.date).map { OutcomePoint(date: $0, value: point.value) }
            }
        let checkpoints = row.checkpoints.compactMap { point in
            dates.date(point.date).map { OutcomePoint(date: $0, value: point.value) }
        }
        var content = OutcomeChartContent(
            observed: observed,
            checkpoints: checkpoints,
            target: row.target > 0 ? row.target : nil,
            unit: row.unit,
            measure: row.measured ? "Recorded result" : "Verified milestones",
            today: dates.todayDate
        )
        content.startsFromBaseline = row.checkpoints.first?.label == "Starting point"
        if row.needsUpdate, let observedAt = row.observedAt, let text = dates.short(observedAt) {
            content.staleNote = "Last report \(text)"
        }
        return content
    }
}

// MARK: - 03 Learn

/// The current learning card. Everything printed here is saved text: the change, the
/// hypothesis, what is being watched, the two server labels and the server's status footnote.
nonisolated struct LearningCardPresentation: Equatable, Sendable, Identifiable {
    let id: String
    let goalEyebrow: String
    let goalColor: GoalColor
    let goalId: String?
    let change: String
    let hypothesis: String
    let observation: String
    /// `LATEST FEEDBACK` or `WHAT WE’RE WATCHING`, from the payload.
    let watchingLabel: String
    let watching: String
    let statusLabel: String
    let standingLabel: String
    /// The server's status sentence (reconsider / paused / pending revision / reviewed / review
    /// date), printed verbatim.
    let footnote: String
    let prompt: String
    /// `Review suggestion` when a decision is pending, `Explore the experiment` otherwise.
    let detailTitle: String
    /// `Review with Adler` · `Share an update` · `Discuss with Adler`, chosen by the server's
    /// workflow label.
    let discussTitle: String
    let controls: LearningControls
    let attempts: Int
    let timeline: LearningTimelineLayout
    let needsDecision: Bool
    let hasPendingRevision: Bool
    let showsReconsiderNote: Bool

    static func make(_ card: TodayLearningCard, dates: TodayDates, palette: TodayGoalPalette)
        -> LearningCardPresentation
    {
        let attemptDates = card.attempts
            .filter { $0.outcome != nil }
            .compactMap { dates.date($0.date) }
        let start = card.startDate.flatMap { dates.date($0) } ?? dates.todayDate
        let goalId = card.goalIds.count == 1 ? card.goalIds.first : nil
        return LearningCardPresentation(
            id: card.recordId,
            goalEyebrow: card.goalTitles.joined(separator: " · "),
            goalColor: palette.color(goalId),
            goalId: goalId,
            change: card.change,
            hypothesis: card.hypothesis,
            observation: card.observation,
            watchingLabel: card.watchingLabel,
            watching: card.watching,
            statusLabel: card.statusLabel,
            standingLabel: card.standingLabel,
            footnote: card.footnote,
            prompt: card.prompt,
            detailTitle: card.needsDecision ? "Review suggestion" : "Explore the experiment",
            discussTitle: discussTitle(for: card.statusLabel),
            controls: card.controls,
            attempts: attemptDates.count,
            timeline: LearningTimelineLayout(
                plannedStart: start,
                attempts: attemptDates,
                review: card.reviewDate.flatMap { dates.date($0) },
                today: dates.todayDate
            ),
            needsDecision: card.needsDecision,
            hasPendingRevision: card.pendingVersion != nil && card.activeVersion != nil,
            showsReconsiderNote: card.standing == .reconsider
        )
    }

    /// COPY.md §5c. The workflow label is the server's, so the choice keys off it directly.
    static func discussTitle(for statusLabel: String) -> String {
        switch statusLabel {
        case "Ready to review": "Review with Adler"
        case "Live experiment": "Share an update"
        default: "Discuss with Adler"
        }
    }

    /// COPY.md §5c wording for each control, so the five server flags read as decisions.
    static func controlTitle(_ kind: LearningActionKind) -> String {
        switch kind {
        case .agree: "Try this"
        case .decline: "No thanks"
        case .pause: "Pause"
        case .resume: "Resume"
        case .close: "Finish trying this"
        }
    }
}
