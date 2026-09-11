import Foundation

/// Who is signed in, and where the app is pointed.
///
/// The session is the HttpOnly cookie `adler_session` (30 days). There is no token to keep:
/// `URLSession` stores the cookie, so "am I signed in?" is answered by asking the server.
@MainActor
@Observable
final class SessionStore {
    nonisolated enum State: Sendable, Equatable {
        case loading
        case signedOut
        case signedIn(SessionView)

        var session: SessionView? {
            if case .signedIn(let session) = self { return session }
            return nil
        }

        var isSignedIn: Bool { session != nil }
    }

    private(set) var state: State = .loading
    /// Set when bootstrap or an auth call failed for a reason other than "not signed in".
    private(set) var error: APIError?
    private(set) var isWorking = false

    var serverConfiguration: ServerConfiguration
    /// Result of the last `ping()`: `nil` until one runs.
    private(set) var lastPing: Result<Bool, APIError>?

    let draft: PendingDraft
    private let client: APIClient
    private let cache: ViewCache

    init(
        client: APIClient,
        cache: ViewCache = ViewCache(),
        draft: PendingDraft = PendingDraft(),
        configuration: ServerConfiguration = .load()
    ) {
        self.client = client
        self.cache = cache
        self.draft = draft
        self.serverConfiguration = configuration
    }

    var user: UserRef? { state.session?.user }
    var timeZone: TimeZone { state.session?.timeZone ?? .current }
    /// Onboarding only shows provider setup when this is false.
    var coachConfigured: Bool { state.session?.coachConfigured ?? true }

    // MARK: - Lifecycle

    /// `GET /api/app/session`. A 401 is the normal signed-out answer, not an error to show.
    func bootstrap() async {
        state = .loading
        error = nil
        do {
            try await adopt(client.send(Endpoints.session()))
        } catch {
            state = .signedOut
            if case .unauthenticated = error { return }
            self.error = error
        }
    }

    /// Records the session and points the disk cache at this account. A different account than
    /// the one the cache belongs to clears it — see `ViewCache.use(scope:)`.
    private func adopt(_ session: SessionView) async {
        state = .signedIn(session)
        await cache.use(scope: session.user.id)
    }

    /// Re-reads the session without dropping to `.loading`, for a foreground resync.
    func refresh() async {
        guard state.isSignedIn else { return }
        do {
            try await adopt(client.send(Endpoints.session()))
            error = nil
        } catch {
            if case .unauthenticated = error {
                state = .signedOut
            } else {
                self.error = error
            }
        }
    }

    // MARK: - Auth

    func register(username: String, password: String) async throws(APIError) {
        try await authenticate(
            Endpoints.register(
                Credentials(
                    username: username, password: password,
                    timeZone: TimeZone.current.identifier)))
    }

    func login(username: String, password: String) async throws(APIError) {
        try await authenticate(
            Endpoints.login(
                Credentials(username: username, password: password, timeZone: nil)))
    }

    private func authenticate(_ endpoint: Endpoint<AuthResponse>) async throws(APIError) {
        isWorking = true
        defer { isWorking = false }
        error = nil
        do {
            _ = try await client.send(endpoint)
            // The cookie is set; read the typed session so every screen has preferences+status.
            try await adopt(client.send(Endpoints.session()))
        } catch {
            self.error = error
            throw error
        }
    }

    /// Signs out server-side, drops the cookie and clears the disk cache. The goal draft is kept
    /// deliberately: someone who signs out mid-onboarding should not lose what they typed.
    func logout() async {
        isWorking = true
        defer { isWorking = false }
        _ = try? await client.send(Endpoints.logout())
        await client.clearCookies()
        await cache.clear()
        state = .signedOut
    }

    // MARK: - Server configuration

    /// Health-check an address before saving it, so a typo is caught in Settings rather than at
    /// the next write. Returns true when the server answered.
    @discardableResult
    func ping(_ configuration: ServerConfiguration? = nil) async -> Bool {
        let target = configuration ?? serverConfiguration
        let probe = APIClient(configuration: target)
        // `URLSession(configuration:)` keeps its delegate queue and connection pool alive for the
        // process unless it is invalidated, and Settings › Server can be tapped many times.
        defer { Task { await probe.invalidate() } }
        do {
            _ = try await probe.send(Endpoints.health())
            lastPing = .success(true)
            return true
        } catch {
            lastPing = .failure(error)
            return false
        }
    }

    /// Points the app at a new server. Anything cached belonged to the old one.
    func apply(serverConfiguration configuration: ServerConfiguration) async {
        // Order matters: `clearCookies()` enumerates cookies for the *current* base URL, so it
        // has to run before the switch or the old server's 30-day `adler_session` survives on the
        // device and silently restores a session the person believed they had left.
        await client.clearCookies()
        serverConfiguration = configuration
        await client.update(configuration: configuration)
        // …and again for the new address, in case a stale cookie is already stored for it.
        await client.clearCookies()
        await cache.clear()
        lastPing = nil
        state = .signedOut
        await bootstrap()
    }

    func clearError() { error = nil }
}
