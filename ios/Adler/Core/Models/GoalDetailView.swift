import Foundation

// `GET /api/app/goals/:id?plan=&step=&milestone=`
// → docs/ios-api-examples/goal-detail.json, goal-detail-projection.json

// MARK: - Records

nonisolated struct GoalResult: Codable, Sendable, Equatable, Hashable, Identifiable {
    let id: String
    let date: YMD
    let value: Double
    let source: String
}

nonisolated struct CheckpointView: Codable, Sendable, Equatable, Hashable, Identifiable {
    let id: String
    let date: YMD
    let value: Double
    let label: String
}

/// Archived when the measurement changed — the results recorded under the previous one.
nonisolated struct MeasurementHistoryEntry: Codable, Sendable, Equatable, Hashable {
    let date: YMD
    let label: String
    let unit: String
    let results: [GoalResult]
    let reason: String
}

nonisolated struct CheckpointHistoryEntry: Codable, Sendable, Equatable, Hashable {
    /// An ISO instant — this one is written with `new Date().toISOString()`, unlike the rest.
    let date: Timestamp
    let checkpoints: [CheckpointView]
    /// May be empty when the goal had no target date.
    let targetDate: YMD
    let reason: String
}

nonisolated struct MilestoneView: Codable, Sendable, Equatable, Hashable, Identifiable {
    let id: String
    let title: String
    let criterion: String
    let done: Bool
    let dueDate: YMD?
    let completedAt: YMD?
    let stepIds: [String]
    /// Which work contributes to this milestone.
    let actionIds: [String]
    /// `Verified` / `In progress` / `Not started`.
    let statusLabel: String
}

// MARK: - Streak

nonisolated struct StreakDay: Codable, Sendable, Equatable, Hashable, Identifiable {
    let date: YMD
    let status: StreakDayStatus
    let streak: Int

    var id: String { date.raw }
}

nonisolated struct StreakView: Codable, Sendable, Equatable, Hashable {
    let count: Int
    /// Actions reported `Done` inside the days this streak covers.
    let completedCount: Int
    let days: [StreakDay]
}

// MARK: - Execution

nonisolated struct ExecutionCounts: Codable, Sendable, Equatable, Hashable {
    let done: Int
    let partial: Int
    let missed: Int
    let unknown: Int
    let upcoming: Int
    let planned: Int
    let reported: Int
    /// Percent of reported actions that were `Done`; `nil` when nothing was reported.
    let completion: Double?
}

nonisolated struct ExecutionCycle: Codable, Sendable, Equatable, Hashable, Identifiable {
    let start: YMD
    let end: YMD
    let label: String
    let rationale: String
    let capacityMinutes: Int
    let capacityStatus: CapacityStatus
    let version: Int
    let current: Bool

    var id: Int { version }
}

nonisolated struct ExecutionWeek: Codable, Sendable, Equatable, Hashable, Identifiable {
    let start: YMD
    let end: YMD
    let done: Int
    let partial: Int
    let missed: Int
    let unknown: Int
    let upcoming: Int
    let planned: Int
    let reported: Int
    let completion: Double?
    let actionIds: [String]

    var id: String { start.raw }
}

/// `Review` / `Milestone` / `Checkpoint`. `date` is absent when a milestone has no due date.
nonisolated struct ExecutionMarker: Codable, Sendable, Equatable, Hashable, Identifiable {
    let id: String
    let label: String
    let date: YMD?
    let detail: String
    let done: Bool
    let kind: String
}

nonisolated struct ExecutionSummaryView: Codable, Sendable, Equatable, Hashable {
    let today: YMD
    let cycles: [ExecutionCycle]
    /// Omitted when the current plan has no adaptive window.
    let current: PlanWindowView?
    let unscheduledIds: [String]
    let actionIds: [String]
    let weeks: [ExecutionWeek]
    let markers: [ExecutionMarker]
    let summary: ExecutionCounts
    let start: YMD
    let end: YMD
}

// MARK: - Projection

nonisolated struct ProjectionPointView: Codable, Sendable, Equatable, Hashable, Identifiable {
    let date: YMD
    let low: Double
    let expected: Double
    let high: Double

    var id: String { date.raw }
}

nonisolated struct ProjectionAssumption: Codable, Sendable, Equatable, Hashable, Identifiable {
    let label: String
    let text: String

    var id: String { label }
}

/// A conditional scenario with stated assumptions — never a probability.
nonisolated struct ProjectionScenario: Codable, Sendable, Equatable, Hashable {
    let origin: YMD
    let horizon: YMD
    let expectedDate: YMD?
    let earliestDate: YMD?
    let latestDate: YMD?
    let points: [ProjectionPointView]
    let yieldRange: ProjectionRange
    let assumptions: [ProjectionAssumption]
}

nonisolated struct ProjectionDailyInput: Codable, Sendable, Equatable, Hashable, Identifiable {
    let date: YMD
    let amount: Double?
    let status: String
    let sourceIds: [String]

    var id: String { date.raw }
}

nonisolated struct ProjectionPair: Codable, Sendable, Equatable, Hashable {
    let input: Double
    let outcome: Double
    let start: YMD
    let end: YMD
    let sourceIds: [String]
}

nonisolated struct ProjectionExcludedPeriod: Codable, Sendable, Equatable, Hashable {
    let input: Double?
    let outcome: Double
    let start: YMD
    let end: YMD
    let sourceIds: [String]
    let reason: String
}

nonisolated struct ProjectionEvidence: Codable, Sendable, Equatable, Hashable {
    let unit: String
    /// `Observed input pace` or `Provisional input pace`.
    let paceSource: String
    let pace: ProjectionRange
    let plannedDaily: Double
    let measured: Int
    let due: Int
    let daily: [ProjectionDailyInput]
    let pairs: [ProjectionPair]
    let excludedPeriods: [ProjectionExcludedPeriod]
    let sourceIds: [String]
}

nonisolated struct ProjectionView: Codable, Sendable, Equatable, Hashable {
    let status: String
    let current: Double?
    let target: Double
    let progress: Double?
    let observedAt: YMD?
    let observations: [GoalResult]
    /// Print this verbatim when `projection` is `nil`. Never render an empty forecast panel.
    let unavailableReason: String?
    let trackingLabel: String
    let inputLabel: String
    let projection: ProjectionScenario?
    let evidence: ProjectionEvidence?
}

// MARK: - Journey

nonisolated struct JourneyEntry: Codable, Sendable, Equatable, Hashable, Identifiable {
    let id: String
    /// A `YYYY-MM-DD` day, even for entries derived from timestamps.
    let at: YMD
    let kind: JourneyEntryKind
    let label: String
    let title: String
    let detail: String?
    let planVersion: Int?
    let recordId: String?
    let decisionId: String?
}

// MARK: - Goal detail

nonisolated struct GoalExperimentRef: Codable, Sendable, Equatable, Hashable, Identifiable {
    let recordId: String
    let version: Int
    let statusLabel: String
    let current: Bool

    var id: String { recordId }
}

/// An editable suggestion for this week — never a booking.
nonisolated struct TentativeBlock: Codable, Sendable, Equatable, Hashable, Identifiable {
    let id: String
    let goalId: String
    let title: String
    let start: Timestamp
    let end: Timestamp
}

nonisolated struct GoalDetailView: Codable, Sendable, Equatable, WorkspaceView {
    let revision: Int
    let today: YMD
    let goal: GoalRef
    let kind: GoalKind
    let why: String
    let success: String
    let area: String
    let tags: [String]
    let priority: GoalPriority?
    let targetDate: YMD?
    let deadline: DeadlineFlexibility
    let startDate: YMD?
    let measure: GoalMeasure?
    let target: Double?
    let unit: String?
    let resultLabel: String
    let results: [GoalResult]
    let checkpoints: [CheckpointView]
    let measurementHistory: [MeasurementHistoryEntry]
    let checkpointHistory: [CheckpointHistoryEntry]
    let needsPlanReview: Bool
    let statusOptions: [GoalStatus]
    let selectedPlanVersion: Int
    let selectedStepId: String?
    let selectedMilestoneId: String?
    /// The full chain, oldest first.
    let plans: [PlanView]
    let milestones: [MilestoneView]
    /// Every action for the goal, newest date first.
    let actions: [ActionView]
    /// The actions belonging to the selected plan/step/milestone.
    let planActions: [ActionView]
    let series: InputSeriesView
    let streak: StreakView
    let progress: GoalProgressRow
    let execution: ExecutionSummaryView
    let projection: ProjectionView
    /// Scoped to `selectedPlanVersion` — that is how the journey opens "Why this version?".
    let rationale: RationaleView
    let experiment: GoalExperimentRef?
    let journey: [JourneyEntry]
    let conversations: [ConversationRef]
    let tentative: [TentativeBlock]
    let pendingProposalIds: [String]
    let nextReviewAt: Timestamp?

    var currentPlan: PlanView? { plans.first { $0.current } ?? plans.last }
    var selectedPlan: PlanView? { plans.first { $0.version == selectedPlanVersion } }
    func action(_ id: String) -> ActionView? { actions.first { $0.id == id } }
    func milestone(_ id: String) -> MilestoneView? { milestones.first { $0.id == id } }
}
