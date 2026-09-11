import Foundation

// Shapes for the pre-existing routes the app still uses (contract §6). These endpoints predate
// `/api/app/*`; several of them return the whole workspace under `data`, which the app never
// reads — it refetches the typed views instead. Every model here decodes only what we need.

// MARK: - Auth

/// `POST /api/auth/register|login` → `{ user, revision, data }`. `GET /api/auth` →
/// `{ user: User | null, ... }` with no `revision` when signed out.
nonisolated struct AuthResponse: Codable, Sendable, Equatable {
    let user: UserRef?
    let revision: Int?
}

nonisolated struct Credentials: Codable, Sendable, Equatable {
    let username: String
    let password: String
    /// Sent on register so the workspace starts in the device's zone.
    let timeZone: String?
}

nonisolated struct SignOutResponse: Codable, Sendable, Equatable {
    let signedOut: Bool
}

// MARK: - Coach

nonisolated struct CoachRequest: Codable, Sendable, Equatable {
    let message: String
    /// `general` for a cross-goal conversation; the server defaults to it when omitted.
    let goalId: String?
    let conversationId: String?
    /// Attributes the person's message to this goal without moving the conversation.
    let focusGoalId: String?
    let requestId: String
}

/// `POST /api/coach` → `{ conversationId, reply, proposal, revision, data, provider, model }`.
/// `data` (the whole workspace) is deliberately not decoded.
nonisolated struct CoachReply: Codable, Sendable, Equatable {
    let conversationId: String
    let reply: String
    /// A pending proposal the coach created, or `nil` when it applied or proposed nothing.
    let proposal: RawProposal?
    let revision: Int
    let provider: String
    let model: String
}

/// The proposal record as the chat route returns it — the coach's own shape, not `ProposalView`.
/// Refetch `GET /api/app/coach/:id` for the rendered card.
nonisolated struct RawProposal: Codable, Sendable, Equatable {
    let id: String
    let summary: String
    let changes: [Change]
    let status: ProposalStatus
    /// Epoch milliseconds.
    let expires: Double
    let channel: MessageChannel
    let goalId: String
    let decisionId: String?
    let conversationId: String?
    let createdAt: Timestamp?
}

// MARK: - Proposals

/// `POST /api/proposals/:id/preview` → the execution summary each affected goal would have.
nonisolated struct ProposalPreview: Codable, Sendable, Equatable {
    let execution: [ProposalPreviewGoal]
}

nonisolated struct ProposalPreviewGoal: Codable, Sendable, Equatable, Identifiable {
    let goalId: String
    let today: YMD
    let cycles: [ExecutionCycle]
    let current: PlanWindowView?
    let unscheduledIds: [String]
    let actionIds: [String]
    let weeks: [ExecutionWeek]
    let markers: [ExecutionMarker]
    let summary: ExecutionCounts
    let start: YMD
    let end: YMD

    var id: String { goalId }
}

/// `POST /api/proposals/:id/approve` → `{ revision, data, ... }`; only `revision` is read.
nonisolated struct RevisionResponse: Codable, Sendable, Equatable {
    let revision: Int
}

nonisolated struct DismissResponse: Codable, Sendable, Equatable {
    let dismissed: Bool
}

// MARK: - Learning

/// `POST /api/learning`. Send `actionVersion` with agree/decline and `version` with
/// pause/resume/close — the server rejects the other one. `LearningActionKind.usesActionVersion`
/// and `LearningRow.version(for:)` pick the right number.
nonisolated struct LearningActionRequest: Codable, Sendable, Equatable {
    let id: String
    let version: Int
    let action: LearningActionKind
    let requestId: String
}

// MARK: - Provider

nonisolated struct ProviderSaveRequest: Codable, Sendable, Equatable {
    let provider: String
    let model: String
    let useServer: Bool
    /// Omitted unless the person entered a key.
    let key: String?
    let removeKey: Bool?
}

nonisolated struct ProviderTestResponse: Codable, Sendable, Equatable {
    let connected: Bool
    let provider: String
    let model: String
    let testedAt: Timestamp
}

/// `GET /api/status` → the coach and calendar status without a workspace read.
nonisolated struct ServerStatus: Codable, Sendable, Equatable {
    let coach: CoachStatus
    let google: GoogleCalendarStatus
    let apple: AppleCalendarStatus
}

// MARK: - Connections and tokens

/// `GET /api/connections` — `channels.status()` plus `publicUrl` and `tokens`.
nonisolated struct ConnectionsResponse: Codable, Sendable, Equatable {
    let configured: Bool
    let provider: String
    let number: String?
    let link: ConnectionLink?
    let jobs: [ConnectionJob]
    let deliveries: [ConnectionDelivery]
    let publicUrl: String?
    let tokens: [APITokenView]
}

nonisolated struct PairRequest: Codable, Sendable, Equatable {
    let address: String
}

/// `POST /api/connections/pair` → the code, the exact text to send, the destination number
/// and the ten-minute window (epoch milliseconds).
nonisolated struct PairResponse: Codable, Sendable, Equatable {
    let code: String
    let send: String
    let to: String?
    let expires: Double

    var expiresAt: Date { Date(timeIntervalSince1970: expires / 1000) }
}

nonisolated struct UnlinkResponse: Codable, Sendable, Equatable {
    let unlinked: Bool
}

nonisolated struct CreateTokenRequest: Codable, Sendable, Equatable {
    let name: String
    let scope: TokenScope
    let days: Int
}

/// The plaintext `token` is shown once and never returned again.
nonisolated struct CreateTokenResponse: Codable, Sendable, Equatable {
    let id: String
    let token: String
    /// Epoch milliseconds.
    let expires: Double
}

nonisolated struct RevokeTokenRequest: Codable, Sendable, Equatable {
    let id: String
}

nonisolated struct RevokeTokenResponse: Codable, Sendable, Equatable {
    let revoked: Bool
}

// MARK: - Calendars (server/calendar-api.ts)

nonisolated struct ExternalCalendar: Codable, Sendable, Equatable, Hashable, Identifiable {
    /// Google returns an address; Apple returns a CalDAV URL.
    let id: String
    let name: String
    let writable: Bool
}

/// `GET /api/calendars`
nonisolated struct CalendarList: Codable, Sendable, Equatable {
    let google: [ExternalCalendar]
    let apple: [ExternalCalendar]
}

/// `POST /api/availability` — the range must be at most six calendar weeks.
nonisolated struct AvailabilityRequest: Codable, Sendable, Equatable {
    let provider: String
    let calendarIds: [String]
    let start: Timestamp
    let end: Timestamp
}

nonisolated struct AvailabilityResponse: Codable, Sendable, Equatable {
    let busy: [BusyInterval]
    let checkedAt: Timestamp
}

/// `POST /api/bookings`. `id` is the action id; a work block must last 1 minute to 4 hours.
nonisolated struct BookingRequest: Codable, Sendable, Equatable {
    let id: String
    let goalId: String
    let provider: String
    let calendarId: String
    /// Every calendar to check for conflicts.
    let conflictIds: [String]
    let title: String
    let start: Timestamp
    let end: Timestamp
    let checkIn: Bool
}

/// A partial booking is a real state: retry the identical request to finish the missing event.
nonisolated struct BookingResponse: Codable, Sendable, Equatable {
    let id: String
    let workDone: Bool
    let checkInDone: Bool?
    let workId: String?
    let checkInId: String?
    let error: String?

    var isComplete: Bool { workDone && (checkInDone ?? true) }
}

nonisolated struct CalendarConnectionResponse: Codable, Sendable, Equatable {
    let connected: Bool
}

nonisolated struct AppleCalendarCredentials: Codable, Sendable, Equatable {
    let email: String
    /// An Apple app-specific password (`abcd-efgh-ijkl-mnop`), not the account password.
    let password: String
}

nonisolated struct DisconnectCalendarRequest: Codable, Sendable, Equatable {
    let provider: String
}

// MARK: - App write requests

nonisolated struct ChangesRequest: Codable, Sendable, Equatable {
    /// 1 to 50 commands from the shared catalog.
    let changes: [Change]
    let revision: Int
    /// 8–100 characters. Reused verbatim on retry so a replay never applies twice.
    let requestId: String
    /// When present and the goal exists, the response includes its refreshed detail.
    let goalId: String?
}

nonisolated struct StartActionRequest: Codable, Sendable, Equatable {
    let goalId: String?
}

// MARK: - Health

nonisolated struct HealthResponse: Codable, Sendable, Equatable {
    let ok: Bool?
    let status: String?
}
