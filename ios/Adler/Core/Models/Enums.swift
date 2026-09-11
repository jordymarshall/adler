import Foundation

// Every closed value set the server documents in docs/ios-api-contract.md §3.
//
// All of them decode unrecognised values to `.unknown` rather than failing, so a server that
// adds a case keeps working. Labels are never derived here: the payload always carries the
// display string the web renders (`stateLabel`, `statusLabel`, `executionLabel`, …).

// MARK: - Goals

nonisolated enum GoalStatus: String, UnknownTolerantEnum {
    case draft = "Draft"
    case active = "Active"
    case paused = "Paused"
    case completed = "Completed"
    case setAside = "Set aside"
    case unknown
}

nonisolated enum GoalKind: String, UnknownTolerantEnum {
    case project
    case learning
    case practical
    case unknown
}

nonisolated enum GoalArea: String, UnknownTolerantEnum {
    case unassigned = "Unassigned"
    case career = "Career"
    case learning = "Learning"
    case personal = "Personal"
    case unknown
}

nonisolated enum GoalPriority: String, UnknownTolerantEnum {
    case focus = "Focus"
    case maintain = "Maintain"
    case later = "Later"
    case unknown
}

nonisolated enum DeadlineFlexibility: String, UnknownTolerantEnum {
    case firm
    case preferred
    case none
    case unknown
}

// MARK: - Work and reporting

/// `Didn’t happen` uses U+2019, exactly as `shared/workspace.ts` writes it.
nonisolated enum Outcome: String, UnknownTolerantEnum {
    case done = "Done"
    case partly = "Partly"
    case didntHappen = "Didn’t happen"
    case unknown
}

nonisolated enum StepPhase: String, UnknownTolerantEnum {
    case draft
    case schedule
    case ready
    case working
    case checkin
    case waiting
    case next
    case inactive
    case unknown
}

nonisolated enum LineupState: String, UnknownTolerantEnum {
    case done
    case partly
    case missed
    case started
    case blocked
    case next
    case open
    case unknown
}

/// `unknown` here is the server's own "awaiting check-in" state, and doubles as the fallback.
nonisolated enum ExecutionStatus: String, UnknownTolerantEnum {
    case done
    case partial
    case missed
    case unknown
    case upcoming
}

nonisolated enum ActivityState: String, UnknownTolerantEnum {
    case done
    case partly
    case missed
    case rest
    case unknown
    case planned
}

nonisolated enum ProgressTone: String, UnknownTolerantEnum {
    case quiet
    case attention
    case positive
    case unknown
}

nonisolated enum StreakDayStatus: String, UnknownTolerantEnum {
    case on
    case off
    case short
    case unknown
}

nonisolated enum PlanStepType: String, UnknownTolerantEnum {
    case task
    case behavior
    case unknown
}

nonisolated enum CapacityStatus: String, UnknownTolerantEnum {
    case confirmed
    case provisional
    case unknown
}

nonisolated enum AssessmentTrigger: String, UnknownTolerantEnum {
    case checkIn = "check-in"
    case result
    case blocker
    case milestone
    case windowEnd = "window-end"
    case unknown
}

nonisolated enum ComparisonStatus: String, UnknownTolerantEnum {
    case unknown
    case reported
}

nonisolated enum MeasureMetric: String, UnknownTolerantEnum {
    case amount
    case hours
    case completion
    case unknown
}

// MARK: - Learning

nonisolated enum LearningState: String, UnknownTolerantEnum {
    case suggested
    case agreed
    case paused
    case reviewed
    case closed
    case declined
    case unknown
}

nonisolated enum LearningStanding: String, UnknownTolerantEnum {
    case untested
    case insufficient
    case consistent
    case mixed
    case inconsistent
    case reconsider
    case unknown
}

/// The standing a saved review can record — narrower than `LearningStanding`.
nonisolated enum ReviewStanding: String, UnknownTolerantEnum {
    case insufficient
    case consistent
    case mixed
    case inconsistent
    case unknown
}

nonisolated enum TestDesign: String, UnknownTolerantEnum {
    case observation
    case prospective
    case comparison
    case unknown
}

nonisolated enum ReviewExposure: String, UnknownTolerantEnum {
    case unknown
    case notUsed = "not-used"
    case used
}

nonisolated enum ReviewDecision: String, UnknownTolerantEnum {
    case keep
    case adjust
    case clarify
    case pause
    case close
    case unknown
}

/// The five controls the server may offer on a learning record.
nonisolated enum LearningActionKind: String, Codable, Sendable, Hashable, CaseIterable {
    case agree
    case decline
    case pause
    case resume
    case close

    /// `POST /api/learning` wants `actionVersion` for agree/decline and `version` for the rest.
    var usesActionVersion: Bool { self == .agree || self == .decline }
}

nonisolated enum ObservationStatus: String, UnknownTolerantEnum {
    case reported = "Reported"
    case toTest = "To test"
    case unknown
}

// MARK: - Reasoning and research

nonisolated enum ClaimRelation: String, UnknownTolerantEnum {
    case supports
    case defines
    case motivates
    case limits
    case contradicts
    case unknown
}

nonisolated enum ClaimRole: String, UnknownTolerantEnum {
    case theory
    case technique
    case empirical
    case heuristic
    case unknown
}

nonisolated enum ClaimReviewStatus: String, UnknownTolerantEnum {
    case sourceChecked = "source-checked"
    case candidate
    case withdrawn
    case superseded
    case unknown
}

nonisolated enum SourceAccess: String, UnknownTolerantEnum {
    case abstract
    case methodSummary = "method summary"
    case fullTextExcerpt = "full text excerpt"
    case unknown
}

nonisolated enum GoalRoute: String, UnknownTolerantEnum {
    case habitShaped = "habit-shaped"
    case structural
    case session
    case campaign
    case dyadic
    case uncertain
    case unknown
}

nonisolated enum BarrierDomain: String, UnknownTolerantEnum {
    case capability
    case opportunity
    case motivation
    case uncertain
    case unknown
}

nonisolated enum BarrierStatus: String, UnknownTolerantEnum {
    case reported
    case tentative
    case unknown
}

nonisolated enum MeasurePeriod: String, UnknownTolerantEnum {
    case action
    case day
    case week
    case unknown
}

// MARK: - Projection

nonisolated enum ProjectionKind: String, UnknownTolerantEnum {
    case direct
    case learned
    case unknown
}

nonisolated enum ProjectionInputMetric: String, UnknownTolerantEnum {
    case amount
    case hours
    case unknown
}

// MARK: - Calendar and work blocks

nonisolated enum CalendarProvider: String, UnknownTolerantEnum {
    case local
    case google
    case apple
    case unknown
}

nonisolated enum WorkBlockStatus: String, UnknownTolerantEnum {
    case scheduled = "Scheduled"
    case done = "Done"
    case partly = "Partly"
    case didntHappen = "Didn’t happen"
    case unknown
}

nonisolated enum AvailabilityCoverage: String, UnknownTolerantEnum {
    case checked
    case unknown
}

// MARK: - Conversation

nonisolated enum MessageRole: String, UnknownTolerantEnum {
    case user
    case coach
    case unknown
}

nonisolated enum MessageOrigin: String, UnknownTolerantEnum {
    case user
    case connected
    case system
    case unknown
}

nonisolated enum MessageChannel: String, UnknownTolerantEnum {
    case web
    case sms
    case imessage
    case rcs
    case whatsapp
    case mcp
    case job
    case unknown
}

nonisolated enum ReactionType: String, UnknownTolerantEnum {
    case love
    case like
    case dislike
    case laugh
    case emphasize
    case question
    case unknown
}

nonisolated enum MessageLinkTab: String, UnknownTolerantEnum {
    case progress
    case plan
    case unknown
}

nonisolated enum ProposalStatus: String, UnknownTolerantEnum {
    case pending
    case applied
    case dismissed
    case stale
    case unknown
}

nonisolated enum JourneyEntryKind: String, UnknownTolerantEnum {
    case plan
    case learningVersion = "learning-version"
    case learningReview = "learning-review"
    case decision
    case unknown
}

// MARK: - Preferences

nonisolated enum Theme: String, UnknownTolerantEnum {
    case light
    case dark
    case unknown
}

nonisolated enum CheckInMode: String, UnknownTolerantEnum {
    case afterSession = "after-session"
    case endOfDay = "end-of-day"
    case unknown
}

nonisolated enum Weekday: String, UnknownTolerantEnum {
    case monday = "Monday"
    case tuesday = "Tuesday"
    case wednesday = "Wednesday"
    case thursday = "Thursday"
    case friday = "Friday"
    case saturday = "Saturday"
    case sunday = "Sunday"
    case unknown
}

// MARK: - Commands

nonisolated enum ChangeEntity: String, UnknownTolerantEnum {
    case goal
    case plan
    case milestone
    case checkpoint
    case action
    case result
    case memory
    case program
    case review
    case preferences
    case workBlock
    case conversation
    case unknown
}

nonisolated enum ChangeOperation: String, UnknownTolerantEnum {
    case create
    case update
    case delete
    case unknown
}

nonisolated enum TokenScope: String, UnknownTolerantEnum {
    case mcp
    case webhook
    case unknown
}
