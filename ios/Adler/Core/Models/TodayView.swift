import Foundation

// `GET /api/app/today` → docs/ios-api-examples/today.json

nonisolated struct TodayLineupItem: Codable, Sendable, Equatable, Hashable, Identifiable {
    let action: ActionView
    let state: LineupState
    /// `Done`, `Partly`, `Didn’t happen`, `Started`, `Waiting on earlier work`, `Up next`, `View action`.
    let stateLabel: String
    let selected: Bool

    var id: String { action.id }
}

nonisolated struct TodayNextStep: Codable, Sendable, Equatable, Hashable {
    let goal: GoalRef
    let phase: StepPhase
    /// `YOUR NEXT STEP`, `YOUR PLAN IS READY`, … or the uppercased status when `phase == .inactive`.
    let phaseLabel: String
    let headline: String
    let planVersion: Int
    let planAction: String
    let planCriterion: String
    let planTiming: String
    /// `Finished when …`
    let criterionLabel: String?
    let timingLabel: String?
    let durationMinutes: Int
    let needsPlanReview: Bool
    let canStartGoal: Bool
    let canStartAction: Bool
    let canReport: Bool
    let canSchedule: Bool
    let action: ActionView?
    let step: PlanStepView?
    let block: WorkBlockView?
    let successLabel: String
    let decisionNote: String?
}

/// Today card 03 Learn. `version` drives pause/resume/close; `actionVersion` drives agree/decline.
nonisolated struct TodayLearningCard: Codable, Sendable, Equatable, Hashable, Identifiable {
    let recordId: String
    let version: Int
    let actionVersion: Int
    let controls: LearningControls
    let attempts: [LearningAttempt]
    let activeVersion: Int?
    let pendingVersion: Int?
    let state: LearningState
    let standing: LearningStanding
    let statusLabel: String
    let standingLabel: String
    let goalIds: [String]
    let goalTitles: [String]
    let change: String
    let observation: String
    let hypothesis: String
    let watching: String
    /// `LATEST FEEDBACK` or `WHAT WE’RE WATCHING`.
    let watchingLabel: String
    let startDate: YMD?
    let reviewDate: YMD?
    let needsDecision: Bool
    let reviewCount: Int
    let footnote: String
    let prompt: String

    var id: String { recordId }

    /// The version number `POST /api/learning` expects for this control.
    func version(for action: LearningActionKind) -> Int {
        action.usesActionVersion ? actionVersion : version
    }
}

nonisolated struct MemoryRef: Codable, Sendable, Equatable, Hashable, Identifiable {
    let id: String
    let text: String
    let date: YMD
}

nonisolated struct TodayView: Codable, Sendable, Equatable, WorkspaceView {
    let revision: Int
    /// The account-local date, computed in the workspace time zone.
    let today: YMD
    let reviewDue: Bool
    let reviewDate: YMD
    let next: TodayNextStep?
    let lineup: [TodayLineupItem]
    /// The ring: actions reported `Done` today out of today's actions.
    let doneCount: Int
    let plannedCount: Int
    /// No active or draft goal produced a next step — render the rest state.
    let quietDay: Bool
    /// The lineup is empty, though a goal may still have a next step.
    let nothingScheduled: Bool
    let progress: [GoalProgressRow]
    let learning: [TodayLearningCard]
    let latestMemory: MemoryRef?
    /// For "choose something else".
    let goals: [GoalRef]
}
