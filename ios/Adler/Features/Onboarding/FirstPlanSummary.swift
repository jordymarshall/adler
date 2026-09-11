import Foundation

/// What the saved goal actually contains, read straight off `GET /api/app/goals/:id`.
///
/// The one rule this type exists to enforce: **a Draft with no milestones and no actions is a
/// valid outcome** (FLOWS.md §1). It is reported as saved with no plan started, and no milestone,
/// action, amount or date is invented to make the screen look finished.
nonisolated struct FirstPlanSummary: Equatable, Sendable {
    nonisolated struct MilestoneLine: Equatable, Sendable, Identifiable {
        let id: String
        let title: String
        /// The saved success criterion; empty when the record has none.
        let criterion: String
        /// `nil` when the milestone has no due date — not a guess.
        let due: YMD?
        /// The server's own `statusLabel`, printed verbatim.
        let statusLabel: String
    }

    nonisolated struct ActionLine: Equatable, Sendable {
        let id: String
        let title: String
        let criterion: String
        let timing: String
        let date: YMD?
        let durationMinutes: Int
    }

    let goalId: String
    let goalTitle: String
    /// The server's `hsl(H S% L%)` string.
    let goalColor: String
    /// `Draft` · `Active` · `Paused` · `Completed` · `Set aside`, verbatim.
    let statusLabel: String
    /// `Case studies published · target 3` — only when a measure is saved.
    let outcomeLine: String?
    let targetDate: YMD?
    let milestones: [MilestoneLine]
    let firstAction: ActionLine?

    /// A goal the coach saved without any work attached. DESIGN.md calls this state out
    /// explicitly so nobody reads "saved" as "planned".
    var isUnplannedDraft: Bool { milestones.isEmpty && firstAction == nil }

    static func make(from detail: GoalDetailView) -> FirstPlanSummary {
        FirstPlanSummary(
            goalId: detail.goal.id,
            goalTitle: detail.goal.title,
            goalColor: detail.goal.color,
            statusLabel: detail.goal.status.rawValue,
            outcomeLine: outcome(from: detail),
            targetDate: detail.targetDate,
            milestones: detail.milestones
                .filter { !$0.title.isEmpty }
                .map {
                    MilestoneLine(
                        id: $0.id, title: $0.title, criterion: $0.criterion, due: $0.dueDate,
                        statusLabel: $0.statusLabel)
                },
            firstAction: firstAction(from: detail))
    }

    /// The measure and target as saved. No measure means no line at all: "unknown" stays
    /// unknown rather than becoming a zero.
    private static func outcome(from detail: GoalDetailView) -> String? {
        let label = detail.measure?.label ?? detail.resultLabel
        guard !label.isEmpty else { return nil }
        guard let target = detail.target else { return label }
        let unit = detail.unit ?? detail.measure?.unit
        let amount = target == target.rounded() ? String(Int(target)) : String(target)
        return unit.map { "\(label) · target \(amount) \($0)" } ?? "\(label) · target \(amount)"
    }

    /// The soonest piece of work that is still live: the earliest date on or after today,
    /// otherwise the earliest dated action, otherwise an unscheduled one. `actions` arrives
    /// newest-date-first, so the order is rebuilt rather than assumed.
    private static func firstAction(from detail: GoalDetailView) -> ActionLine? {
        let live = detail.actions.filter { $0.retiredAt == nil }
        guard !live.isEmpty else { return nil }
        let dated = live.filter { $0.date != nil }.sorted { ($0.date?.raw ?? "") < ($1.date?.raw ?? "") }
        let chosen =
            dated.first(where: { ($0.date?.raw ?? "") >= detail.today.raw })
            ?? dated.first
            ?? live.first
        guard let action = chosen else { return nil }
        return ActionLine(
            id: action.id, title: action.title, criterion: action.criterion,
            timing: action.timing, date: action.date, durationMinutes: action.durationMinutes)
    }
}
