import SwiftUI

/// The one global banner slot, pinned above the tab content.
///
/// It carries only the conditions that are true of the *whole app*: no network, an expired
/// session, a link that resolved to nothing, and a dropped event stream. Everything a single
/// screen owns — a failed load, a stale revision, a refused write — stays on that screen with
/// its own `ErrorBanner` (see `Core/README.md` §3), so a person never sees the same problem
/// reported twice.
///
/// Priority is worst-first: if the session is gone, nothing else matters. When nothing is
/// wrong the slot occupies no space at all.
struct AppErrorBanner: View {
    @Environment(SessionStore.self) private var session
    @Environment(WorkspaceStore.self) private var workspace
    @Environment(AppRouter.self) private var router
    @Environment(ConnectivityMonitor.self) private var connectivity
    @Environment(SSEClient.self) private var sse

    /// Set only after the stream has been down for a grace period, so a normal launch (or a
    /// reconnect that takes a second) never flashes a warning.
    @State private var liveUpdatesDown = false

    private static let liveUpdatesGrace = Duration.seconds(5)

    enum Notice: Equatable {
        case sessionExpired
        case offline
        case deepLinkMissing
        case liveUpdatesDisconnected
    }

    var body: some View {
        Group {
            if let notice {
                banner(for: notice)
                    .padding(.horizontal, AdlerLayout.screenMargin)
                    .padding(.bottom, Space.s)
            }
        }
        .task(id: liveUpdatesSettled) { await watchLiveUpdates() }
    }

    private var notice: Notice? {
        if workspace.sessionExpired { return .sessionExpired }
        if !connectivity.isOnline { return .offline }
        if router.deepLinkMissing { return .deepLinkMissing }
        if liveUpdatesDown { return .liveUpdatesDisconnected }
        return nil
    }

    @ViewBuilder
    private func banner(for notice: Notice) -> some View {
        switch notice {
        case .sessionExpired:
            ErrorBanner(kind: .signedOut) { Task { await session.logout() } }
        case .offline:
            ErrorBanner(kind: .offline) { Task { await workspace.refreshVisible() } }
        case .deepLinkMissing:
            ShellNoticeBanner(
                symbol: "exclamationmark.triangle",
                message: "That link no longer points to anything saved.",
                onDismiss: { router.deepLinkMissing = false })
        case .liveUpdatesDisconnected:
            // The sentence the web app shows (`src/store.tsx`): a notice, not an error. The app
            // keeps working; it just will not update itself until the stream is back.
            ShellNoticeBanner(
                symbol: "antenna.radiowaves.left.and.right.slash",
                message: "Live updates are disconnected. Adler will reconnect automatically.",
                onDismiss: nil)
        }
    }

    // MARK: - Live updates

    /// True whenever there is nothing to watch for: connected, signed out, or already offline
    /// (the offline banner says it better).
    private var liveUpdatesSettled: Bool {
        sse.isConnected || !session.state.isSignedIn || !connectivity.isOnline
    }

    private func watchLiveUpdates() async {
        guard !liveUpdatesSettled else {
            liveUpdatesDown = false
            return
        }
        try? await Task.sleep(for: Self.liveUpdatesGrace)
        guard !Task.isCancelled else { return }
        liveUpdatesDown = !sse.isConnected
    }
}

/// The two shell notices the design system has no `ErrorBanner.Kind` for. Same shape as
/// DESIGN.md §4.18 so the slot reads as one thing.
private struct ShellNoticeBanner: View {
    let symbol: String
    let message: String
    let onDismiss: (() -> Void)?

    var body: some View {
        HStack(alignment: .top, spacing: Space.s) {
            Image(systemName: symbol)
                .foregroundStyle(Color.warning)
                .accessibilityHidden(true)
            Text(message)
                .adlerText(.subhead)
                .foregroundStyle(Color.ink)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
            if let onDismiss {
                Button("Dismiss", action: onDismiss)
                    .buttonStyle(.plain)
                    .adlerText(.subhead)
                    .foregroundStyle(Color.inkMuted)
            }
        }
        .padding(Space.m)
        .background(Color.surfaceSunken, in: .rect(cornerRadius: Radii.control))
        .overlay {
            RoundedRectangle(cornerRadius: Radii.control)
                .strokeBorder(Color.warning, lineWidth: 1)
        }
        .accessibilityElement(children: .contain)
    }
}

#Preview {
    VStack(spacing: Space.l) {
        ShellNoticeBanner(
            symbol: "exclamationmark.triangle",
            message: "That link no longer points to anything saved.",
            onDismiss: {})
        ShellNoticeBanner(
            symbol: "antenna.radiowaves.left.and.right.slash",
            message: "Live updates are disconnected. Adler will reconnect automatically.",
            onDismiss: nil)
    }
    .padding(AdlerLayout.screenMargin)
    .background(Color.canvas)
}
