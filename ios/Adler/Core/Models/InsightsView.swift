import Foundation

// `GET /api/app/insights?goal=` and `GET /api/app/insights/:recordId`
// → docs/ios-api-examples/insights.json, insight-record.json

// MARK: - Learning rows

nonisolated struct LearningReviewSummary: Codable, Sendable, Equatable, Hashable, Identifiable {
    let id: String
    let at: Timestamp
    let summary: String
    let implication: String?
    let nextQuestion: String?
    let decision: ReviewDecision
    let standing: ReviewStanding
    let standingLabel: String
    let exposure: ReviewExposure
    let exposureLabel: String
}

/// One learning record as Insights and Today show it. Workflow `state` and evidence `standing`
/// are separate labels: acceptance is not a result.
nonisolated struct LearningRow: Codable, Sendable, Equatable, Hashable, Identifiable {
    let recordId: String
    let version: Int
    let activeVersion: Int?
    let pendingVersion: Int?
    let state: LearningState
    let standing: LearningStanding
    let statusLabel: String
    let standingLabel: String
    let timingLabel: String
    let goals: [GoalRef]
    let change: String
    let observation: String
    let hypothesis: String
    let behaviorSignal: String
    let mechanismSignal: String?
    let outcomeSignal: String?
    let prediction: String
    let reviewRule: String
    let comparison: String
    let design: TestDesign
    let alternatives: [String]
    let transfer: String?
    let start: YMD?
    let reviewAfter: YMD?
    let nextReviewAfter: YMD?
    let reports: Int
    let latestReview: LearningReviewSummary?
    let controls: LearningControls
    let actionVersion: Int
    /// Dated action reports inside the test window, oldest first, last 30.
    let attempts: [LearningAttempt]
    /// The current version's resolved evidence records, excluding `measurement` sources.
    let sources: [SourceView]
    let prompt: String

    var id: String { recordId }

    /// The version number `POST /api/learning` expects for this control.
    func version(for action: LearningActionKind) -> Int {
        action.usesActionVersion ? actionVersion : version
    }
}

// MARK: - Record detail

nonisolated struct EvidenceRevision: Codable, Sendable, Equatable, Hashable, Identifiable {
    let id: String
    let version: String
    let kind: String
    let occurredAt: String?
    let reportedAt: String?
}

nonisolated struct LearningTest: Codable, Sendable, Equatable, Hashable {
    let change: String
    let design: TestDesign
    let prediction: String
    let comparison: String
    let start: YMD?
    let reviewAfter: YMD?
    let reviewRule: String
    let mechanismSignal: String?
    let behaviorSignal: String
    let inputStepIds: [String]?
    let outcomeSignal: String?
    let alternatives: [String]
}

nonisolated struct LearningVersionView: Codable, Sendable, Equatable, Hashable, Identifiable {
    let version: Int
    let at: Timestamp
    let decisionId: String
    let goalIds: [String]
    let observation: String
    let hypothesis: String
    let transfer: String?
    let proposalId: String?
    let test: LearningTest
    let sources: [EvidenceRevision]
    /// The full original reasoning saved with this version.
    let reasoning: BehavioralReasoning
    let grounding: [ClaimBindingView]
    let researchSources: [ResearchSource]

    var id: Int { version }
}

nonisolated struct LearningReviewView: Codable, Sendable, Equatable, Hashable, Identifiable {
    let id: String
    let version: Int
    let goalIds: [String]?
    let decisionId: String
    let at: Timestamp
    let sources: [EvidenceRevision]
    let exposure: ReviewExposure
    let mechanism: String?
    let behavior: String?
    let outcome: String?
    let confounds: [String]
    let decision: ReviewDecision
    let standing: ReviewStanding
    let nextReviewAfter: YMD?
    let summary: String
    let implication: String?
    let nextQuestion: String?
    let standingLabel: String
    let exposureLabel: String
}

nonisolated struct LearningEvent: Codable, Sendable, Equatable, Hashable {
    let at: Timestamp
    let state: LearningState
    let reason: String
}

nonisolated struct LearningInvalidation: Codable, Sendable, Equatable, Hashable {
    let at: Timestamp
    let sourceId: String
    let replacementSourceIds: [String]?
    let reason: String
    let version: Int
}

nonisolated struct LearningDetailView: Codable, Sendable, Equatable, WorkspaceView {
    let revision: Int
    let today: YMD
    let row: LearningRow
    let versions: [LearningVersionView]
    let reviews: [LearningReviewView]
    let events: [LearningEvent]
    let invalidations: [LearningInvalidation]
    /// A revision the coach proposed that has not been decided.
    let pending: LearningVersionView?
}

// MARK: - Observations

/// The decision-derived rows `src/Insights.tsx` also renders. A decision already carried by a
/// learning record's version or review is omitted, so the two lists do not double-count.
nonisolated struct ObservationLearningView: Codable, Sendable, Equatable, Hashable {
    let recordId: String?
    let goalIds: [String]
    let hypothesis: String
    let experiment: String
    let insight: String?
    let nextHypothesis: String?
    let previousInsightId: String?
    let transfer: String?
    let result: ObservationResult?
    let reasoning: BehavioralReasoning?
    let grounding: [ClaimBindingView]
}

nonisolated struct ObservationResult: Codable, Sendable, Equatable, Hashable {
    let summary: String
    let sourceIds: [String]
}

nonisolated struct ObservationRow: Codable, Sendable, Equatable, Hashable, Identifiable {
    let id: String
    let decisionId: String
    let proposalId: String?
    let date: YMD
    let finding: String
    let status: ObservationStatus
    /// `Working insight` / `Hypothesis` / `Your observation`.
    let kindLabel: String
    let headline: String
    let statusLabel: String
    let implication: String
    let implicationLabel: String
    let changeStatus: String
    let changes: [Change]
    let goals: [GoalRef]
    let goalIds: [String]
    let goalTitle: String
    let sources: [SourceView]
    let resultSources: [SourceView]
    let research: [ResearchSource]
    let learning: ObservationLearningView?
}

// MARK: - Memories

nonisolated struct MemoryCorrection: Codable, Sendable, Equatable, Hashable, Identifiable {
    let id: String
    let reason: String
    let at: Timestamp
}

nonisolated struct MemoryView: Codable, Sendable, Equatable, Hashable, Identifiable {
    let id: String
    let text: String
    let date: YMD
    let corrected: Bool
    let corrections: [MemoryCorrection]
}

// MARK: - Insights view

nonisolated struct InsightsView: Codable, Sendable, Equatable, WorkspaceView {
    let revision: Int
    let today: YMD
    /// Pending revision, or state suggested/agreed/paused, or standing `reconsider`,
    /// or a reviewed record with a next review date.
    let tryingNow: [LearningRow]
    /// Finished records with at least one saved review.
    let learned: [LearningRow]
    /// Finished records with no review (declined, or closed without feedback).
    let history: [LearningRow]
    let observations: [ObservationRow]
    let memories: [MemoryView]
    let goals: [GoalRef]

    func record(_ recordId: String) -> LearningRow? {
        (tryingNow + learned + history).first { $0.recordId == recordId }
    }
}
