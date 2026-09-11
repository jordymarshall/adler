import SwiftUI

/// Inline error, placed above the content it concerns. Never a modal alert
/// for a recoverable error (DESIGN.md §4.18).
struct ErrorBanner: View {
    enum Kind: Equatable {
        case offline
        /// The server's `error` string, printed verbatim under the app's
        /// own sentence.
        case server(detail: String?)
        case signedOut
        case noProvider
        case timeout

        var message: String {
            switch self {
            case .offline: "You’re offline. Showing the last saved view."
            case .server: "The request could not be completed."
            case .signedOut: "Your session ended. Sign in to continue."
            case .noProvider: "No AI provider is configured on this server."
            case .timeout: "This is taking longer than expected."
            }
        }

        var detail: String? {
            if case .server(let detail) = self { return detail }
            return nil
        }

        /// The label of the affirmative control, when the kind implies one.
        var defaultActionTitle: String {
            switch self {
            case .offline, .server, .timeout: "Retry"
            case .signedOut: "Sign in"
            case .noProvider: "Set up"
            }
        }
    }

    let kind: Kind
    var actionTitle: String?
    var action: (() -> Void)?
    var onDismiss: (() -> Void)?

    var body: some View {
        BannerShell(
            symbol: "exclamationmark.triangle",
            message: kind.message,
            detail: kind.detail,
            primaryTitle: action == nil ? nil : (actionTitle ?? kind.defaultActionTitle),
            primaryAction: action,
            onDismiss: onDismiss
        )
    }
}

/// A `409` from a change or proposal route (DESIGN.md §4.19).
///
/// Keeps the person's input, names what changed, and retries with the **same
/// `requestId`** so a duplicate never applies twice. When the record itself
/// disappeared the banner switches to `recordGone` and offers `Refresh`.
struct StaleRevisionBanner: View {
    /// The server-derived sentence naming what changed, e.g.
    /// `the 8:30 session moved to 9:00`. Optional — no diff is invented.
    let changeSummary: String?
    /// `true` when the underlying record is gone rather than merely stale.
    var recordGone: Bool = false
    var onRetry: (() -> Void)?
    var onRefresh: (() -> Void)?

    var body: some View {
        BannerShell(
            symbol: recordGone ? "questionmark.circle" : "arrow.triangle.2.circlepath",
            message: recordGone
                ? "This record is no longer here."
                : "Your workspace changed somewhere else. Review the update, then try again.",
            detail: recordGone ? nil : changeSummary.map { "Changed since you opened this: \($0)" },
            primaryTitle: recordGone ? "Refresh" : "Retry",
            primaryAction: recordGone ? onRefresh : onRetry,
            onDismiss: nil
        )
    }
}

private struct BannerShell: View {
    let symbol: String
    let message: String
    let detail: String?
    let primaryTitle: String?
    let primaryAction: (() -> Void)?
    let onDismiss: (() -> Void)?
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    var body: some View {
        let layout = dynamicTypeSize.prefersStackedControls
            ? AnyLayout(VStackLayout(alignment: .leading, spacing: Space.s))
            : AnyLayout(HStackLayout(alignment: .top, spacing: Space.s))

        layout {
            HStack(alignment: .top, spacing: Space.s) {
                Image(systemName: symbol)
                    .foregroundStyle(Color.warning)
                    .accessibilityHidden(true)
                VStack(alignment: .leading, spacing: Space.xxs) {
                    Text(message)
                        .adlerText(.subhead)
                        .foregroundStyle(Color.ink)
                    if let detail {
                        Text(detail)
                            .adlerText(.footnote)
                            .foregroundStyle(Color.inkMuted)
                    }
                }
                .fixedSize(horizontal: false, vertical: true)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            HStack(spacing: Space.m) {
                if let primaryTitle, let primaryAction {
                    Button(primaryTitle, action: primaryAction)
                        .adlerText(.subhead)
                        .foregroundStyle(Color.accentInk)
                }
                if let onDismiss {
                    Button("Dismiss", action: onDismiss)
                        .adlerText(.subhead)
                        .foregroundStyle(Color.inkMuted)
                }
            }
            .buttonStyle(.plain)
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

/// Fictional design data.
#Preview("Banners") {
    ScrollView {
        VStack(spacing: Space.l) {
            ErrorBanner(kind: .offline, action: {})
            ErrorBanner(kind: .server(detail: "Proposal 4f2 is no longer pending."), action: {}, onDismiss: {})
            ErrorBanner(kind: .noProvider, action: {})
            StaleRevisionBanner(changeSummary: "the 8:30 session moved to 9:00", onRetry: {})
            StaleRevisionBanner(changeSummary: nil, recordGone: true, onRefresh: {})
        }
        .padding(AdlerLayout.screenMargin)
    }
    .background(Color.canvas)
}
