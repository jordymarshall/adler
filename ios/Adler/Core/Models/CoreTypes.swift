import Foundation

// Types shared by more than one view payload. Mirrors `shared/app-views.ts` §shared plus the
// saved records it embeds verbatim (`shared/planning.ts`, `shared/behavioral-reasoning.ts`,
// `shared/research-claims.ts`, `shared/projection-model.ts`, `shared/adaptive-plan.ts`).

// MARK: - Goal reference

nonisolated struct GoalRef: Codable, Sendable, Equatable, Hashable, Identifiable {
    let id: String
    let title: String
    let status: GoalStatus
    /// An `hsl(H S% L%)` string from `src/goal-colors.ts`. Parsed by the design system.
    let color: String
}

// MARK: - Measures

nonisolated struct InputMeasureView: Codable, Sendable, Equatable, Hashable {
    let metric: MeasureMetric
    let label: String
    let unit: String
    let target: Double?
}

/// The outcome measurement saved on a goal (`Goal["measure"]`).
nonisolated struct GoalMeasure: Codable, Sendable, Equatable, Hashable {
    let label: String
    let unit: String
    let target: Double
    let baseline: Double?
    let aggregation: String?
    let period: String?
}

// MARK: - Work blocks

nonisolated struct WorkBlockView: Codable, Sendable, Equatable, Hashable, Identifiable {
    let id: String
    let goalId: String
    /// The action title this block holds time for.
    let action: String
    let start: Timestamp
    let end: Timestamp
    let provider: CalendarProvider
    let status: WorkBlockStatus
    let eventId: String?
    let checkInId: String?
}

/// `CalendarView.blocks[]` — a work block with the two extra fields the week view needs.
nonisolated struct CalendarBlockView: Codable, Sendable, Equatable, Hashable, Identifiable {
    let id: String
    let goalId: String
    let action: String
    let start: Timestamp
    let end: Timestamp
    let provider: CalendarProvider
    let status: WorkBlockStatus
    let eventId: String?
    let checkInId: String?
    let goalTitle: String
    let actionOutcome: Outcome?
}

// MARK: - Actions

nonisolated struct ActionReportView: Codable, Sendable, Equatable, Hashable {
    let outcome: Outcome?
    /// `nil` means unknown. It is never written as `0` to mean "not measured".
    let amount: Double?
    let actualMinutes: Double?
    let note: String?
    let at: Timestamp
}

nonisolated struct ActionView: Codable, Sendable, Equatable, Hashable, Identifiable {
    let id: String
    let goalId: String
    let goalTitle: String
    let title: String
    let criterion: String
    let timing: String
    /// `nil` when the action is unscheduled.
    let date: YMD?
    let planVersion: Int
    let stepId: String?
    let milestoneId: String?
    let occurrence: String?
    let outcome: Outcome?
    /// `nil` means unknown, never zero.
    let amount: Double?
    let actualMinutes: Double?
    let note: String?
    let startedAt: Timestamp?
    let retiredAt: YMD?
    let unplanned: Bool
    let ready: Bool
    let durationMinutes: Int
    let measure: InputMeasureView
    /// The reported input in the step's own metric; `nil` when unknown.
    let reported: Double?
    let execution: ExecutionStatus
    let executionLabel: String
    let block: WorkBlockView?
    let history: [ActionReportView]
}

// MARK: - Evidence sources

/// A saved record resolved for display, with an `adler://` destination.
/// `kind` stays a plain string: observation sources carry no saved kind.
nonisolated struct SourceView: Codable, Sendable, Equatable, Hashable, Identifiable {
    let id: String
    let kind: String
    let label: String
    let text: String
    /// `nil` when the record no longer resolves.
    let deepLink: String?
}

// MARK: - Research

nonisolated struct ResearchSource: Codable, Sendable, Equatable, Hashable, Identifiable {
    let id: String
    let title: String
    let authors: String
    let year: String
    let doi: String?
    let url: String
    let summary: String
    let kind: String
    let access: SourceAccess
    let retrievedAt: Timestamp
}

nonisolated struct ClaimReview: Codable, Sendable, Equatable, Hashable {
    let status: ClaimReviewStatus
    let by: String
    let at: YMD
}

nonisolated struct ResearchClaim: Codable, Sendable, Equatable, Hashable, Identifiable {
    let id: String
    let version: String
    let statement: String
    let role: ClaimRole
    let construct: String
    let label: String?
    let methodIds: [String]
    let principleIds: [String]
    let source: ResearchSource
    let locator: String
    let scope: String
    let grade: String
    let limitations: [String]
    let review: ClaimReview
}

// MARK: - Behavioural reasoning

nonisolated struct ReasoningGrounding: Codable, Sendable, Equatable, Hashable {
    let claimId: String
    let version: String
    let relation: ClaimRelation
    let application: String
}

nonisolated struct ReasoningBarrier: Codable, Sendable, Equatable, Hashable {
    let domain: BarrierDomain
    let status: BarrierStatus
    let explanation: String
    let sourceIds: [String]
}

nonisolated struct BehavioralReasoning: Codable, Sendable, Equatable, Hashable {
    let grounding: [ReasoningGrounding]?
    let principleIds: [String]
    let goalRoute: GoalRoute
    let ruleExceptions: [String]
    let barrier: ReasoningBarrier
    let methodId: String
    let researchSourceIds: [String]
    let mechanism: String
    let fit: String
    let prediction: String
    let reviewRule: String
    let limitation: String
}

// MARK: - Planning basis

nonisolated struct BasisAlternative: Codable, Sendable, Equatable, Hashable {
    let option: String
    let tradeoff: String
}

nonisolated struct BasisActionMeasure: Codable, Sendable, Equatable, Hashable {
    let label: String
    let unit: String
    let period: MeasurePeriod
    let target: Double?
    let rationale: String
}

nonisolated struct BasisEvidence: Codable, Sendable, Equatable, Hashable {
    let sourceId: String
    let finding: String
    let application: String
    let limitation: String
}

nonisolated struct BasisReview: Codable, Sendable, Equatable, Hashable {
    let date: YMD
    let question: String
    let adaptation: String
}

nonisolated struct PlanningBasis: Codable, Sendable, Equatable, Hashable {
    let interpretation: String
    let decisionNote: String?
    let strategy: String
    let outcomeRationale: String
    let alternatives: [BasisAlternative]
    let actionMeasure: BasisActionMeasure?
    let evidence: [BasisEvidence]
    let assumptions: [String]
    let uncertainty: String
    let review: BasisReview
    let sources: [ResearchSource]?
}

// MARK: - Plan

nonisolated struct PlanStepRecurrence: Codable, Sendable, Equatable, Hashable {
    let everyDays: Int
    /// `0` is Sunday, matching `program.workDays`.
    let weekdays: [Int]?
    let until: YMD
}

nonisolated struct BehaviorMeasure: Codable, Sendable, Equatable, Hashable, Identifiable {
    let id: String
    let label: String
    let unit: String
    let target: Double?
}

nonisolated struct PlanStepView: Codable, Sendable, Equatable, Hashable, Identifiable {
    let id: String
    let type: PlanStepType
    let title: String
    let criterion: String
    let reason: String
    let durationMinutes: Int
    let cue: String
    let scheduledDate: YMD
    let recurrence: PlanStepRecurrence?
    let dependsOn: [String]
    let milestoneId: String?
    let measure: BehaviorMeasure?
    let fallback: String?
    let contextIds: [String]
    /// The occurrence dates this step materialises into.
    let dates: [YMD]
}

nonisolated struct PlanWindowView: Codable, Sendable, Equatable, Hashable {
    let start: YMD
    let end: YMD
    let label: String
    let rationale: String
    let capacityMinutes: Int
    let capacityStatus: CapacityStatus
}

nonisolated struct PlanAssessmentView: Codable, Sendable, Equatable, Hashable {
    let at: Timestamp
    let question: String
    let adaptation: String
    let feedbackDelayDays: Int
    let triggers: [AssessmentTrigger]
}

nonisolated struct PlanExperimentView: Codable, Sendable, Equatable, Hashable {
    let hypothesis: String
    let inputStepIds: [String]
    let outcomeSignal: String
    let comparison: String
    let comparisonStatus: ComparisonStatus
    let comparisonSourceIds: [String]
    let decisionRule: String
    let alternativeExplanations: [String]
}

nonisolated struct ProjectionRange: Codable, Sendable, Equatable, Hashable {
    let low: Double
    let expected: Double
    let high: Double
}

/// The saved input→outcome model (`shared/projection-model.ts`), not a forecast.
nonisolated struct ProjectionModel: Codable, Sendable, Equatable, Hashable {
    let kind: ProjectionKind
    let driverStepId: String
    let inputMetric: ProjectionInputMetric
    let outcomeUnit: String
    let observationStart: YMD
    let horizonDays: Int
    let feedbackDelayDays: Int
    let inputPerOutcome: ProjectionRange?
    let rationale: String
}

nonisolated struct PlanView: Codable, Sendable, Equatable, Hashable, Identifiable {
    let version: Int
    let date: YMD
    let current: Bool
    let action: String
    let criterion: String
    let timing: String
    let durationMinutes: Int?
    let approach: String?
    let window: PlanWindowView?
    let assessment: PlanAssessmentView?
    let experiment: PlanExperimentView?
    let steps: [PlanStepView]
    let projection: ProjectionModel?
    /// Print this verbatim instead of an empty forecast panel.
    let projectionUnavailableReason: String?
    let hasBasis: Bool
    let hasReasoning: Bool

    var id: Int { version }
}

// MARK: - Rationale

nonisolated struct ClaimBindingView: Codable, Sendable, Equatable, Hashable {
    let claimId: String
    let version: String
    let relation: ClaimRelation
    let application: String
    /// `nil` when the claim version is no longer in the catalog.
    let claim: ResearchClaim?
}

/// A saved coaching recommendation. Render it; never compose a new explanation on device.
nonisolated struct RecommendationView: Codable, Sendable, Equatable, Hashable {
    let action: String
    let observation: String
    let interpretation: String
    let expectedEffect: String
    let goalIds: [String]
    let sourceIds: [String]
    let reasoning: BehavioralReasoning
    let grounding: [ClaimBindingView]
    let sources: [ResearchSource]
}

nonisolated struct RationaleView: Codable, Sendable, Equatable, Hashable {
    let planVersion: Int
    let basis: PlanningBasis?
    let reasoning: BehavioralReasoning?
    let grounding: [ClaimBindingView]
    let sources: [ResearchSource]
    let recommendations: [RecommendationView]
    let decisionId: String?
    let windowRationale: String?
    let assessmentQuestion: String?
    /// Set only when nothing is saved — show this instead of an empty panel.
    let note: String?
}

// MARK: - Progress

nonisolated struct ProgressObservation: Codable, Sendable, Equatable, Hashable {
    let date: YMD
    let value: Double
}

nonisolated struct ProgressCheckpoint: Codable, Sendable, Equatable, Hashable {
    let date: YMD
    let value: Double
    let label: String
}

nonisolated struct OpenMilestoneRef: Codable, Sendable, Equatable, Hashable, Identifiable {
    let id: String
    let title: String
}

/// One goal's recorded result against its saved checkpoints (Today card 02, goal detail).
nonisolated struct GoalProgressRow: Codable, Sendable, Equatable, Hashable {
    let goal: GoalRef
    let measured: Bool
    let actual: Double?
    let target: Double
    let unit: String
    let observedAt: YMD?
    let observations: [ProgressObservation]
    let checkpoints: [ProgressCheckpoint]
    let due: ProgressCheckpoint?
    let next: ProgressCheckpoint?
    let delta: Double?
    let comparable: Bool
    /// Server-derived; never recompute (`Below checkpoint`, `Update needed`, …).
    let label: String
    let tone: ProgressTone
    let openMilestones: [OpenMilestoneRef]
    let hasOutcome: Bool
    let needsUpdate: Bool
    let evidenceNote: String?
    let startDate: YMD
    /// Opening text for `POST /api/coach` when the person routes to the coach from here.
    let prompt: String
    let actionLabel: String
}

// MARK: - Learning controls

nonisolated struct LearningControls: Codable, Sendable, Equatable, Hashable {
    let agree: Bool
    let decline: Bool
    let pause: Bool
    let resume: Bool
    let close: Bool

    func allows(_ action: LearningActionKind) -> Bool {
        switch action {
        case .agree: agree
        case .decline: decline
        case .pause: pause
        case .resume: resume
        case .close: close
        }
    }

    var available: [LearningActionKind] { LearningActionKind.allCases.filter(allows) }
}

/// A dated action report inside a test window. A reported attempt is not evidence the change worked.
nonisolated struct LearningAttempt: Codable, Sendable, Equatable, Hashable {
    let date: YMD
    let outcome: Outcome?
    let actionId: String?
}

// MARK: - Input series

nonisolated struct InputSeriesPoint: Codable, Sendable, Equatable, Hashable {
    let date: YMD
    /// `nil` is unknown, not zero.
    let amount: Double?
    let planned: Double?
    let retired: Bool
    let future: Bool
    let scheduled: Bool
    /// A planned day with no work — a rest day, not a miss.
    let off: Bool
    let actionIds: [String]
}

nonisolated struct InputSeriesView: Codable, Sendable, Equatable, Hashable {
    let measure: InputMeasureView
    let start: YMD
    let end: YMD
    let points: [InputSeriesPoint]
    let reported: Double
    let plannedTotal: Double
    let unknown: Double
}

// MARK: - Conversations

nonisolated struct ConversationRef: Codable, Sendable, Equatable, Hashable, Identifiable {
    let id: String
    let title: String
    let goalId: String
    let goalTitle: String
    let createdAt: Timestamp
    let messageCount: Int
    let lastMessageAt: Timestamp?
    let lastMessage: String?
}

// MARK: - Model status

nonisolated struct CoachStatus: Codable, Sendable, Equatable, Hashable {
    let configured: Bool
    let provider: String
    let model: String
}

nonisolated struct GoogleCalendarStatus: Codable, Sendable, Equatable, Hashable {
    let configured: Bool
    let connected: Bool
}

nonisolated struct AppleCalendarStatus: Codable, Sendable, Equatable, Hashable {
    let connected: Bool
}

nonisolated struct CalendarStatus: Codable, Sendable, Equatable, Hashable {
    let google: GoogleCalendarStatus
    let apple: AppleCalendarStatus
}

nonisolated struct WorkspaceStatus: Codable, Sendable, Equatable, Hashable {
    let coach: CoachStatus
    let calendars: CalendarStatus
    let serverKeysAllowed: Bool
}

// MARK: - Preferences

nonisolated struct AutomationView: Codable, Sendable, Equatable, Hashable {
    let enabled: Bool
    let checkInMode: CheckInMode
    /// `HH:MM` in the workspace time zone.
    let checkInTime: String
    let reviewTime: String
    let quietStart: String
    let quietEnd: String
}

nonisolated struct PreferencesView: Codable, Sendable, Equatable, Hashable {
    /// IANA identifier. Every day boundary in the app is read in this zone.
    let timeZone: String
    let theme: Theme
    let reviewDay: String
    let automation: AutomationView

    var resolvedTimeZone: TimeZone { TimeZone(identifier: timeZone) ?? .current }
}

nonisolated struct UserRef: Codable, Sendable, Equatable, Hashable, Identifiable {
    let id: String
    let username: String
}
