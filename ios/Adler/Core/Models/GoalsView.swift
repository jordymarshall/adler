import Foundation

// `GET /api/app/goals?weeks=` → docs/ios-api-examples/goals.json

/// One cell of the GitHub-style activity grid (All Goals rows only).
nonisolated struct ActivityCell: Codable, Sendable, Equatable, Hashable, Identifiable {
    let date: YMD
    let state: ActivityState
    let done: Int
    let partly: Int
    let missed: Int
    let unknown: Int
    let planned: Int
    /// 0–4, the grid's ink level.
    let level: Int

    var id: String { date.raw }
}

nonisolated struct ActivitySummary: Codable, Sendable, Equatable, Hashable {
    let reported: Int
    let done: Int
    let completion: Double?
    /// `N% completed` or `No check-ins yet`.
    let label: String
}

nonisolated struct BudgetGoalShare: Codable, Sendable, Equatable, Hashable, Identifiable {
    let goalId: String
    let title: String
    let status: GoalStatus
    let color: String
    let minutes: Int
    /// True for time the app placed tentatively rather than time the person booked.
    let proposed: Bool

    var id: String { goalId }
}

nonisolated struct WeeklyBudgetView: Codable, Sendable, Equatable, Hashable {
    let weekStart: YMD
    let weekEnd: YMD
    let totalMinutes: Int
    let budgetMinutes: Int
    let overMinutes: Int
    let scaleMinutes: Int
    let goals: [BudgetGoalShare]
    let sourceNote: String
    let programReason: String
}

nonisolated struct GoalRowNextAction: Codable, Sendable, Equatable, Hashable, Identifiable {
    let id: String
    let title: String
    let date: YMD?
    let phase: StepPhase
}

nonisolated struct GoalRowMilestone: Codable, Sendable, Equatable, Hashable, Identifiable {
    let id: String
    let title: String
    let dueDate: YMD?
}

nonisolated struct GoalRow: Codable, Sendable, Equatable, Hashable, Identifiable {
    let goal: GoalRef
    let kind: GoalKind
    let priority: GoalPriority?
    let area: String
    let tags: [String]
    let success: String
    let resultLabel: String
    let current: Double?
    let target: Double
    let unit: String
    let observedAt: YMD?
    /// Complete Monday–Sunday week columns ending with the current week.
    let activity: [ActivityCell]
    let activitySummary: ActivitySummary
    /// 14-day input sparkline, `nil` when the goal has no repeating measured step.
    let series: InputSeriesView?
    let stepTitle: String?
    let nextAction: GoalRowNextAction?
    let completedActions: Int
    let milestone: GoalRowMilestone?
    let implication: String
    let outlook: String
    let outlookNote: String?
    let projectionStatus: String

    var id: String { goal.id }
}

nonisolated struct GoalGroup: Codable, Sendable, Equatable, Hashable, Identifiable {
    let status: GoalStatus
    let goalIds: [String]

    var id: String { status.rawValue }
}

nonisolated struct GoalsView: Codable, Sendable, Equatable, WorkspaceView {
    let revision: Int
    let today: YMD
    let budget: WeeklyBudgetView
    let rows: [GoalRow]
    /// Ordered `Active`, `Draft`, `Paused`, `Completed`, `Set aside`; empty groups are omitted.
    let groups: [GoalGroup]
    let areas: [String]
    let tags: [String]

    func row(_ goalId: String) -> GoalRow? { rows.first { $0.goal.id == goalId } }
}
