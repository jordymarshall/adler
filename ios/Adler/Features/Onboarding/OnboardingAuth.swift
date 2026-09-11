import Foundation

/// Registering or signing in **without** handing the shell the keys yet.
///
/// `RootView` switches on `SessionStore.state`, so the moment the app's own session store says
/// `.signedIn` the onboarding stack is torn down and replaced by the tab bar. The first-plan
/// hand-off has to run *after* the cookie exists and *before* that swap, so the request is made
/// through a throwaway `SessionStore` of its own. The cookie lands in
/// `HTTPCookieStorage.shared` — which `APIClient.makeSession()` sets explicitly — so every later
/// call from the app's client is authenticated, and `FirstPlanView` finishes by calling the real
/// `SessionStore.bootstrap()`, which is what actually moves the app into the shell.
///
/// The alternative was a hook in `App/RootView.swift`; that file belongs to the shell agent.
/// This keeps the whole flow inside `Features/Onboarding`.
enum OnboardingAuth {
    static func authenticate(
        mode: AuthMode,
        username: String,
        password: String,
        configuration: ServerConfiguration
    ) async throws(APIError) -> SessionView {
        let store = SessionStore(client: APIClient(configuration: configuration))
        switch mode {
        case .register:
            try await store.register(username: username, password: password)
        case .login:
            try await store.login(username: username, password: password)
        }
        guard let view = store.state.session else {
            throw APIError.decoding(
                message: "The server sent something this version of Adler cannot read.")
        }
        return view
    }
}

/// Maps Core's one error type onto the design system's banner, and gives the screens a single
/// place to read the server's own sentence.
extension ErrorBanner.Kind {
    static func of(_ error: APIError) -> ErrorBanner.Kind {
        switch error {
        case .unauthenticated:
            .signedOut
        case .transport(_, let kind) where kind == .offline:
            .offline
        case .transport(_, let kind) where kind == .timeout:
            .timeout
        default:
            .server(detail: OnboardingErrorText.verbatim(error))
        }
    }
}

nonisolated enum OnboardingErrorText {
    /// The server's refusal is product copy — it is printed as written, never re-worded
    /// (`Core/README.md` §3). Only when there is no response does the transport's own
    /// description stand in.
    static func verbatim(_ error: APIError) -> String {
        error.serverMessage ?? error.errorDescription ?? "The request could not be completed."
    }

    /// FLOWS.md §11: past 240 characters the raw message moves into a `What happened`
    /// disclosure so the screen stays readable — the text itself is never shortened.
    static let inlineLimit = 240

    static func isLong(_ message: String) -> Bool { message.count > inlineLimit }
}
