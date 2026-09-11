import Foundation

// `GET /api/app/coach` and `GET /api/app/coach/:conversationId`
// → docs/ios-api-examples/coach.json, coach-conversation.json

nonisolated struct MessageGoalLink: Codable, Sendable, Equatable, Hashable {
    let goalId: String
    let goalTitle: String
    let tab: MessageLinkTab
}

nonisolated struct MessageReference: Codable, Sendable, Equatable, Hashable {
    let text: String
    let recordId: String
}

nonisolated struct MessageReaction: Codable, Sendable, Equatable, Hashable {
    let actor: MessageRole
    let type: ReactionType?
    let at: Timestamp
}

nonisolated struct DecisionCheck: Codable, Sendable, Equatable, Hashable, Identifiable {
    let id: String
    let label: String
    let finding: String
    let sources: [String]
}

nonisolated struct DecisionMethod: Codable, Sendable, Equatable, Hashable, Identifiable {
    let id: String
    let name: String
    let url: String
}

nonisolated struct MessageView: Codable, Sendable, Equatable, Hashable, Identifiable {
    let id: String
    let conversationId: String?
    let goalId: String
    let goalTitle: String
    let role: MessageRole
    let origin: MessageOrigin
    let channel: MessageChannel
    let text: String
    let at: Timestamp?
    let decisionId: String?
    let links: [MessageGoalLink]
    let references: [MessageReference]
    let reactions: [MessageReaction]
    /// `Adler` / `You` / `Connected update`.
    let authorLabel: String
    /// Whether this message is one of the saved evidence records.
    let saved: Bool
    let recommendations: [RecommendationView]
    let decisionSummary: String?
    let decisionChecks: [DecisionCheck]
    let decisionMethods: [DecisionMethod]
}

// MARK: - Proposals

/// Present only when the proposal creates an **external** calendar event.
/// `calendarName` is the saved calendar identifier (Google an address, Apple a CalDAV URL).
nonisolated struct ProposalBooking: Codable, Sendable, Equatable, Hashable {
    let provider: String
    let calendarName: String
    let start: Timestamp
    let end: Timestamp
    let includesCheckIn: Bool
}

nonisolated struct ProposalAffected: Codable, Sendable, Equatable, Hashable {
    /// Counts `action` and `workBlock` changes.
    let actions: Int
    let milestones: Int
    /// Distinct goals receiving a new plan version.
    let planVersions: Int
}

nonisolated struct ProposalView: Codable, Sendable, Equatable, Hashable, Identifiable {
    let id: String
    let summary: String
    let headline: String
    /// What accepting does, stated before it happens. Empty when the changes carry none.
    let consequences: [String]
    let booking: ProposalBooking?
    let affected: ProposalAffected
    let goalId: String
    let goalTitle: String
    let conversationId: String?
    let decisionId: String?
    let status: ProposalStatus
    let channel: MessageChannel
    /// Epoch milliseconds.
    let expires: Double
    let expired: Bool
    let createdAt: Timestamp?
    let changes: [Change]
    /// Opaque JSON in the command catalog's shape, positionally matched to `changes`.
    /// Decode lazily for Current → Suggested, or call `POST /api/proposals/:id/preview`.
    let before: [JSONValue]?
    let recommendations: [RecommendationView]
    let researchClaims: [ResearchClaim]
    let researchSources: [ResearchSource]

    var expiresAt: Date { Date(timeIntervalSince1970: expires / 1000) }
}

// MARK: - Quick prompts

/// Send `prompt` verbatim as the message body of `POST /api/coach`.
nonisolated struct QuickPrompt: Codable, Sendable, Equatable, Hashable, Identifiable {
    let id: String
    let label: String
    let prompt: String
    let goalId: String
}

// MARK: - Coach view

nonisolated struct CoachView: Codable, Sendable, Equatable, WorkspaceView {
    let revision: Int
    let today: YMD
    /// Most recent first.
    let conversations: [ConversationRef]
    /// `nil` on the list route.
    let selectedConversationId: String?
    /// Only populated when a conversation is selected.
    let messages: [MessageView]
    /// Pending proposals only, filtered to the conversation when one is selected.
    let proposals: [ProposalView]
    /// At most six.
    let quickPrompts: [QuickPrompt]
    let model: CoachStatus
    let goals: [GoalRef]
}
