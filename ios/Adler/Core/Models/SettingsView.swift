import Foundation

// `GET /api/app/session` → docs/ios-api-examples/session.json
// `GET /api/app/settings` → docs/ios-api-examples/settings.json

// MARK: - Session

nonisolated struct SessionCounts: Codable, Sendable, Equatable, Hashable {
    let goals: Int
    let activeGoals: Int
    let drafts: Int
    let conversations: Int
}

nonisolated struct SessionView: Codable, Sendable, Equatable, WorkspaceView {
    let revision: Int
    let today: YMD
    let user: UserRef
    let preferences: PreferencesView
    let status: WorkspaceStatus
    let counts: SessionCounts
    let reviewDue: Bool
    let hasGoals: Bool

    /// Onboarding shows provider setup only when this is false.
    var coachConfigured: Bool { status.coach.configured }
    var timeZone: TimeZone { preferences.resolvedTimeZone }
}

// MARK: - Program

nonisolated struct ProgramVersion: Codable, Sendable, Equatable, Hashable, Identifiable {
    let version: Int
    let date: YMD
    let focusGoalId: String
    let sprintStart: YMD
    let sprintEnd: YMD
    let sprintResult: String
    let weeklyMinutes: Int
    /// `HH:MM`.
    let workStart: String
    let workEnd: String
    /// `0` is Sunday.
    let workDays: [Int]
    let sessionMinutes: Int
    let reviewDay: String
    let enabledMethods: [String]
    let approach: String
    let reason: String

    var id: Int { version }
}

nonisolated struct ProgramHistoryEntry: Codable, Sendable, Equatable, Hashable, Identifiable {
    let version: Int
    let date: YMD
    let reason: String

    var id: Int { version }
}

// MARK: - Methods

nonisolated struct MethodView: Codable, Sendable, Equatable, Hashable, Identifiable {
    let id: String
    let name: String
    let question: String
    let action: String
    let example: String
    let evidence: String
    let source: String
    let url: String
    /// The stated boundary of the method. Never hide it.
    let limit: String
    let enabled: Bool
}

// MARK: - Provider

nonisolated struct ProviderSelection: Codable, Sendable, Equatable, Hashable {
    let provider: String
    let model: String
    /// Use this server's configured API account rather than a personal key.
    let useServer: Bool
}

nonisolated struct ProviderOption: Codable, Sendable, Equatable, Hashable, Identifiable {
    let provider: String
    let defaultModel: String
    let personalConfigured: Bool
    let serverAvailable: Bool
    let testedAt: Timestamp?

    var id: String { provider }
}

/// Secrets are never returned. Keys are written with `POST /api/provider`.
nonisolated struct ProviderStatusView: Codable, Sendable, Equatable, Hashable {
    let selected: ProviderSelection
    let providers: [ProviderOption]
}

// MARK: - Connections

/// `channels.status()` verbatim, which is why two fields keep their SQLite snake_case names.
nonisolated struct ConnectionLink: Codable, Sendable, Equatable, Hashable {
    let address: String
    /// `0` or `1`.
    let optedOut: Int
    /// Epoch milliseconds.
    let lastInbound: Double

    private enum CodingKeys: String, CodingKey {
        case address
        case optedOut = "opted_out"
        case lastInbound = "last_inbound"
    }

    var isOptedOut: Bool { optedOut != 0 }
}

nonisolated struct ConnectionJob: Codable, Sendable, Equatable, Hashable, Identifiable {
    let id: String
    let kind: String
    let status: String
    /// Epoch milliseconds.
    let due: Double
    let error: String?
}

nonisolated struct ConnectionDelivery: Codable, Sendable, Equatable, Hashable, Identifiable {
    let id: String
    let messageId: String?
    let status: String
    let sid: String?
    /// Epoch milliseconds.
    let at: Double
    let error: String?

    private enum CodingKeys: String, CodingKey {
        case id
        case messageId = "message_id"
        case status
        case sid
        case at
        case error
    }
}

nonisolated struct ConnectionsView: Codable, Sendable, Equatable, Hashable {
    /// False when the server has no SMS provider — pairing must stay disabled.
    let configured: Bool
    let provider: String
    let number: String?
    let publicUrl: String?
    let link: ConnectionLink?
    let jobs: [ConnectionJob]
    let deliveries: [ConnectionDelivery]
}

nonisolated struct APITokenView: Codable, Sendable, Equatable, Hashable, Identifiable {
    let id: String
    let name: String
    let scope: TokenScope
    /// Epoch milliseconds.
    let expires: Double

    var expiresAt: Date { Date(timeIntervalSince1970: expires / 1000) }
}

// MARK: - Settings view

nonisolated struct SettingsView: Codable, Sendable, Equatable, WorkspaceView {
    let revision: Int
    let today: YMD
    let user: UserRef
    let preferences: PreferencesView
    let status: WorkspaceStatus
    let provider: ProviderStatusView
    let connections: ConnectionsView
    let tokens: [APITokenView]
    let publicUrl: String?
    let program: ProgramVersion
    let programs: [ProgramHistoryEntry]
    /// The seven method records with their `enabled` flag.
    let methods: [MethodView]
    let goals: [GoalRef]
}
