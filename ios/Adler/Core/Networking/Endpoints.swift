import Foundation

nonisolated enum HTTPMethod: String, Sendable {
    case get = "GET"
    case post = "POST"
}

/// One typed route. `Response` is what a 2xx body decodes to.
nonisolated struct Endpoint<Response: Decodable & Sendable>: Sendable {
    let method: HTTPMethod
    let path: String
    var query: [URLQueryItem] = []
    var body: (any Encodable & Sendable)?
    /// Per-request budget. Reads and deterministic writes get 30 s; `POST /api/coach` gets 240 s
    /// because one turn can make up to eight provider calls, each with its own 60 s abort.
    var timeout: TimeInterval = Endpoints.defaultTimeout
}

/// Every route the app uses, in the order docs/ios-api-contract.md lists them.
nonisolated enum Endpoints {
    static let defaultTimeout: TimeInterval = 30
    static let coachTimeout: TimeInterval = 240

    // MARK: Reads (/api/app)

    static func session() -> Endpoint<SessionView> {
        Endpoint(method: .get, path: "/api/app/session")
    }

    static func today() -> Endpoint<TodayView> {
        Endpoint(method: .get, path: "/api/app/today")
    }

    /// `weeks` sizes the activity grid (1–52, default 12).
    static func goals(weeks: Int? = nil) -> Endpoint<GoalsView> {
        Endpoint(
            method: .get, path: "/api/app/goals",
            query: items(["weeks": weeks.map(String.init)]))
    }

    /// Selecting `plan` re-scopes `planActions`, `series` and `rationale` to that version.
    static func goal(
        id: String, plan: Int? = nil, step: String? = nil, milestone: String? = nil
    ) -> Endpoint<GoalDetailView> {
        Endpoint(
            method: .get, path: "/api/app/goals/\(escape(id))",
            query: items([
                "plan": plan.map(String.init), "step": step, "milestone": milestone,
            ]))
    }

    static func coach() -> Endpoint<CoachView> {
        Endpoint(method: .get, path: "/api/app/coach")
    }

    static func coach(conversationId: String) -> Endpoint<CoachView> {
        Endpoint(method: .get, path: "/api/app/coach/\(escape(conversationId))")
    }

    static func insights(goalId: String? = nil) -> Endpoint<InsightsView> {
        Endpoint(method: .get, path: "/api/app/insights", query: items(["goal": goalId]))
    }

    static func insightRecord(recordId: String) -> Endpoint<LearningDetailView> {
        Endpoint(method: .get, path: "/api/app/insights/\(escape(recordId))")
    }

    /// Any date inside the wanted week; the server snaps to Monday.
    static func calendar(start: YMD? = nil) -> Endpoint<CalendarView> {
        Endpoint(method: .get, path: "/api/app/calendar", query: items(["start": start?.raw]))
    }

    static func settings() -> Endpoint<SettingsView> {
        Endpoint(method: .get, path: "/api/app/settings")
    }

    // MARK: Writes (/api/app)

    static func changes(_ request: ChangesRequest) -> Endpoint<WriteResult> {
        Endpoint(method: .post, path: "/api/app/changes", body: request)
    }

    static func startAction(id: String, goalId: String?) -> Endpoint<WriteResult> {
        Endpoint(
            method: .post, path: "/api/app/actions/\(escape(id))/start",
            body: StartActionRequest(goalId: goalId))
    }

    static func startGoal(id: String) -> Endpoint<WriteResult> {
        Endpoint(method: .post, path: "/api/app/goals/\(escape(id))/start")
    }

    // MARK: Auth

    static func register(_ credentials: Credentials) -> Endpoint<AuthResponse> {
        Endpoint(method: .post, path: "/api/auth/register", body: credentials)
    }

    static func login(_ credentials: Credentials) -> Endpoint<AuthResponse> {
        Endpoint(method: .post, path: "/api/auth/login", body: credentials)
    }

    static func auth() -> Endpoint<AuthResponse> {
        Endpoint(method: .get, path: "/api/auth")
    }

    static func logout() -> Endpoint<SignOutResponse> {
        Endpoint(method: .post, path: "/api/auth/logout")
    }

    // MARK: Coach and proposals

    static func coachMessage(_ request: CoachRequest) -> Endpoint<CoachReply> {
        Endpoint(method: .post, path: "/api/coach", body: request, timeout: coachTimeout)
    }

    static func proposals() -> Endpoint<[RawProposal]> {
        Endpoint(method: .get, path: "/api/proposals")
    }

    static func approveProposal(id: String) -> Endpoint<RevisionResponse> {
        Endpoint(method: .post, path: "/api/proposals/\(escape(id))/approve")
    }

    static func dismissProposal(id: String) -> Endpoint<DismissResponse> {
        Endpoint(method: .post, path: "/api/proposals/\(escape(id))/dismiss")
    }

    static func previewProposal(id: String) -> Endpoint<ProposalPreview> {
        Endpoint(method: .post, path: "/api/proposals/\(escape(id))/preview")
    }

    static func messageReaction(id: String, reaction: ReactionType, remove: Bool)
        -> Endpoint<RevisionResponse>
    {
        Endpoint(
            method: .post, path: "/api/messages/\(escape(id))/reaction",
            body: ReactionRequest(reaction: reaction.rawValue, remove: remove))
    }

    // MARK: Learning

    static func learning(_ request: LearningActionRequest) -> Endpoint<RevisionResponse> {
        Endpoint(method: .post, path: "/api/learning", body: request)
    }

    // MARK: Provider and status

    static func providerStatus() -> Endpoint<ProviderStatusView> {
        Endpoint(method: .get, path: "/api/provider")
    }

    static func saveProvider(_ request: ProviderSaveRequest) -> Endpoint<ProviderStatusView> {
        Endpoint(method: .post, path: "/api/provider", body: request)
    }

    static func testProvider() -> Endpoint<ProviderTestResponse> {
        Endpoint(method: .post, path: "/api/provider/test", timeout: 60)
    }

    static func status() -> Endpoint<ServerStatus> {
        Endpoint(method: .get, path: "/api/status")
    }

    static func health() -> Endpoint<HealthResponse> {
        Endpoint(method: .get, path: "/api/health", timeout: 8)
    }

    // MARK: Connections and tokens

    static func connections() -> Endpoint<ConnectionsResponse> {
        Endpoint(method: .get, path: "/api/connections")
    }

    static func pair(address: String) -> Endpoint<PairResponse> {
        Endpoint(
            method: .post, path: "/api/connections/pair", body: PairRequest(address: address))
    }

    static func unlink() -> Endpoint<UnlinkResponse> {
        Endpoint(method: .post, path: "/api/connections/unlink", body: EmptyBody())
    }

    static func createToken(_ request: CreateTokenRequest) -> Endpoint<CreateTokenResponse> {
        Endpoint(method: .post, path: "/api/tokens", body: request)
    }

    static func revokeToken(id: String) -> Endpoint<RevokeTokenResponse> {
        Endpoint(method: .post, path: "/api/tokens/revoke", body: RevokeTokenRequest(id: id))
    }

    // MARK: Calendars

    static func calendars() -> Endpoint<CalendarList> {
        Endpoint(method: .get, path: "/api/calendars", timeout: 60)
    }

    static func availability(_ request: AvailabilityRequest) -> Endpoint<AvailabilityResponse> {
        Endpoint(method: .post, path: "/api/availability", body: request, timeout: 60)
    }

    static func booking(_ request: BookingRequest) -> Endpoint<BookingResponse> {
        Endpoint(method: .post, path: "/api/bookings", body: request, timeout: 60)
    }

    static func connectApple(_ credentials: AppleCalendarCredentials)
        -> Endpoint<CalendarConnectionResponse>
    {
        Endpoint(
            method: .post, path: "/api/calendar/apple/connect", body: credentials, timeout: 60)
    }

    static func disconnectCalendar(provider: String) -> Endpoint<CalendarConnectionResponse> {
        Endpoint(
            method: .post, path: "/api/calendar/disconnect",
            body: DisconnectCalendarRequest(provider: provider), timeout: 60)
    }

    /// Opened in Safari, not URLSession: it is a 302 into Google's consent screen.
    static func googleConnectURL(base: URL) -> URL {
        base.appending(path: "/api/calendar/google/connect")
    }

    /// The SSE stream. Handled by `SSEClient`, not `APIClient.send`.
    static let eventsPath = "/api/events"

    // MARK: Helpers

    private static func items(_ values: [String: String?]) -> [URLQueryItem] {
        values.compactMap { key, value in
            value.map { URLQueryItem(name: key, value: $0) }
        }
        .sorted { $0.name < $1.name }
    }

    /// Record ids are opaque, so `/` and `?` must not survive into the path.
    private static let pathComponentAllowed = CharacterSet.urlPathAllowed.subtracting(
        CharacterSet(charactersIn: "/?#"))

    private static func escape(_ component: String) -> String {
        component.addingPercentEncoding(withAllowedCharacters: pathComponentAllowed) ?? component
    }
}

nonisolated struct EmptyBody: Codable, Sendable, Equatable {}

nonisolated struct ReactionRequest: Codable, Sendable, Equatable {
    let reaction: String
    let remove: Bool
}
