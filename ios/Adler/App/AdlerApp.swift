import SwiftUI

/// The app shell. Everything long-lived is created here, exactly once, and handed to the view
/// tree through `.environment(...)`. Nothing below this file constructs a store or an
/// `APIClient`; the client itself stays private, because feature code talks to the two stores
/// (see `Core/README.md`).
@main
struct AdlerApp: App {
    @State private var session: SessionStore
    @State private var workspace: WorkspaceStore
    @State private var sse: SSEClient
    @State private var connectivity: ConnectivityMonitor
    @State private var router = AppRouter()

    @Environment(\.scenePhase) private var scenePhase

    init() {
        AdlerFont.verifyRegistered()
        NavigationBarAppearance.install()
        // One client and one disk cache behind both stores: a sign-out has to clear the same
        // cache the workspace wrote, and a server change has to move both.
        let client = APIClient()
        let cache = ViewCache()
        _session = State(initialValue: SessionStore(client: client, cache: cache))
        _workspace = State(initialValue: WorkspaceStore(client: client, cache: cache))
        _sse = State(initialValue: SSEClient(client: client))
        _connectivity = State(initialValue: ConnectivityMonitor())
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(session)
                .environment(workspace)
                .environment(router)
                .environment(sse)
                .environment(connectivity)
                .task { await start() }
                .onChange(of: scenePhase) { _, phase in scenePhaseChanged(to: phase) }
                .onChange(of: session.state.isSignedIn) { _, signedIn in
                    signedInChanged(to: signedIn)
                }
                .onOpenURL { open($0) }
        }
    }

    // MARK: - Lifecycle

    /// Cold start: show whatever was cached, then ask the server who is signed in.
    private func start() async {
        // The handler is assigned before the monitor starts: NWPathMonitor delivers its first
        // path update immediately, and that one is the reconnect an app launched offline needs.
        connectivity.onReconnect = { Task { await workspace.refreshVisible() } }
        connectivity.start()
        #if DEBUG
        await applyLaunchArguments()
        #endif
        await workspace.restoreFromCache()
        await session.bootstrap()
    }

    #if DEBUG
    /// Two hooks the screenshot and UI-test scripts drive, in the style of the design system's
    /// `-gallery`. `simctl openurl` cannot be used for this: it raises a system confirmation
    /// dialog that a script cannot tap.
    ///
    ///     xcrun simctl launch <udid> com.withadler.app -resetSession -route adler://goals/g-1
    ///
    /// `-route` goes through the *deferred* link path on purpose, so the screenshot run
    /// exercises the same replay-after-sign-in code an incoming link would.
    private func applyLaunchArguments() async {
        let arguments = ProcessInfo.processInfo.arguments
        if arguments.contains("-resetSession") { await session.logout() }
        // `-signIn <username> <password>` signs a smoke or screenshot run into an existing
        // fictional account without driving the keyboard. DEBUG only, simulator only in
        // practice; the credentials come from the command line, never from the bundle.
        if let index = arguments.firstIndex(of: "-signIn"),
            arguments.indices.contains(index + 2)
        {
            try? await session.login(
                username: arguments[index + 1], password: arguments[index + 2])
        }
        if let index = arguments.firstIndex(of: "-route"),
            arguments.indices.contains(index + 1),
            let route = AppRoute(string: arguments[index + 1])
        {
            session.draft.pendingRoute = route
        }
    }
    #endif

    /// `.inactive` is a transient state (app switcher, Control Centre pull). Only a real
    /// background stops the stream, so a glance at Notification Centre does not churn it.
    private func scenePhaseChanged(to phase: ScenePhase) {
        switch phase {
        case .active:
            connectivity.start()
            startLiveUpdates()
            guard session.state.isSignedIn else { return }
            Task {
                await session.refresh()
                await workspace.refreshVisible()
            }
        case .background:
            sse.stop()
            connectivity.stop()
        default:
            break
        }
    }

    private func signedInChanged(to signedIn: Bool) {
        guard signedIn else {
            sse.stop()
            router.reset()
            Task { await workspace.reset() }
            return
        }
        if let view = session.state.session { workspace.adopt(session: view) }
        startLiveUpdates()
        // A link that arrived while signed out waits in the draft and lands now (FLOWS.md §12).
        if let route = session.draft.takePendingRoute() { router.go(route) }
    }

    /// `SSEClient.start` is idempotent, so calling this on both paths is safe.
    private func startLiveUpdates() {
        guard session.state.isSignedIn else { return }
        // A 401 on the stream means the cookie is gone: stop reconnecting into it and let the
        // banner say so, rather than retrying every 30 s behind a signed-in-looking shell.
        sse.onUnauthenticated = { workspace.noteSessionExpired() }
        sse.start { revision in
            Task { await workspace.handleRevisionEvent(revision) }
        }
    }

    // MARK: - Deep links

    private func open(_ url: URL) {
        #if DEBUG
        // The design system's hidden route, `adler://gallery[?item=…]`. Checked first so it
        // never reaches `AppRoute`, which would not recognise it.
        if GalleryPresentation.shared.handle(url) { return }
        #endif
        if session.state.isSignedIn {
            router.handle(url: url)
        } else if let route = AppRoute(url: url) {
            session.draft.pendingRoute = route
        } else if url.scheme?.lowercased() == AppRoute.scheme {
            // Mirrors the signed-in branch: a dead `adler://` link tapped before signing in
            // gets the same "that link no longer resolves" notice rather than silence.
            router.deepLinkMissing = true
        }
    }
}
