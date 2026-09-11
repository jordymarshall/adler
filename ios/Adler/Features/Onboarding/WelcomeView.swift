import SwiftUI

/// The promise, in three short lines, and one primary action that opens the goal input before
/// asking for an account (DESIGN.md §5.1).
///
/// Nothing is fetched here, so there is no loading state. The server field lives under an
/// `Advanced` disclosure because almost nobody needs it and the one screenful belongs to the
/// promise.
struct WelcomeView: View {
    @Environment(SessionStore.self) private var session
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Space.xl) {
                Text(OnboardingCopy.appName)
                    .adlerText(.title2)
                    .foregroundStyle(Color.inkHeading)
                    // Names the screen for `ShellUITests`, which waits for the onboarding root
                    // before tapping the DEBUG sign-in control.
                    .accessibilityIdentifier("Onboarding")

                VStack(alignment: .leading, spacing: Space.m) {
                    Text(OnboardingCopy.welcomeHeadline)
                        .adlerText(.display)
                        .foregroundStyle(Color.inkHeading)
                        .fixedSize(horizontal: false, vertical: true)
                        .accessibilityAddTraits(.isHeader)
                    Text(OnboardingCopy.welcomeBody)
                        .adlerText(.callout)
                        .foregroundStyle(Color.inkMuted)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .padding(.top, Space.xxxl)

                VStack(spacing: Space.m) {
                    NavigationLink(value: OnboardingStep.goal) {
                        Text(OnboardingCopy.welcomePrimary)
                            .adlerText(.headline)
                            .frame(maxWidth: .infinity, minHeight: 52 - Space.xl)
                    }
                    .buttonStyle(.glassProminent)
                    .tint(Color.accentGreen)

                    NavigationLink(value: OnboardingStep.auth(.login)) {
                        Text(OnboardingCopy.welcomeSignIn)
                            .adlerText(.subhead)
                            .foregroundStyle(Color.accentInk)
                            .frame(maxWidth: .infinity, minHeight: AdlerLayout.minimumHitTarget)
                    }
                    .buttonStyle(.plain)
                }

            }
            .padding(.horizontal, AdlerLayout.screenMargin)
            .padding(.bottom, AdlerLayout.screenMargin)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .scrollBounceBehavior(.basedOnSize)
        // The advanced row belongs at the foot of the screen (DESIGN.md §5.1) and must stay
        // reachable at accessibility sizes, so it is an inset rather than a trailing `Spacer`.
        .safeAreaInset(edge: .bottom, spacing: 0) {
            VStack(alignment: .leading, spacing: Space.xs) {
                Divider().overlay(Color.separator)
                ServerDisclosure()
                #if DEBUG
                DeveloperSignIn()
                #endif
            }
            .padding(.horizontal, AdlerLayout.screenMargin)
            .padding(.top, Space.s)
            .padding(.bottom, Space.s)
            .background(Color.canvas)
        }
        .background {
            ZStack(alignment: .topTrailing) {
                Color.canvas
                // At accessibility sizes the art is removed rather than scaled (DESIGN.md §5.1),
                // and it never sits under text: the canvas gradient scrims it.
                if !dynamicTypeSize.prefersStackedControls {
                    // Seed 0 puts the strongest fan in the top-right corner, as the wireframe
                    // draws it. The scrim keeps the art under the text, never behind it.
                    // Full-bleed, with the scrim heaviest where the promise sits: the art
                    // lives in the empty lower half and never competes with the headline.
                    GeometricFans(seed: 3, maximumOpacity: 0.16)
                        .overlay {
                            LinearGradient(
                                colors: [Color.canvas.opacity(0.85), Color.canvas.opacity(0.2)],
                                startPoint: .top, endPoint: .bottom)
                        }
                }
            }
            .ignoresSafeArea()
        }
        .toolbar(.hidden, for: .navigationBar)
        .task {
            // A typo in the address should be visible before the first request, not after it.
            if session.lastPing == nil { await session.ping() }
        }
    }
}

/// Base URL plus the result of a real `GET /api/health`. Collapsed by default.
private struct ServerDisclosure: View {
    @Environment(SessionStore.self) private var session
    @State private var isExpanded = false
    @State private var text = ""
    @State private var isTesting = false
    @State private var invalid = false

    var body: some View {
        DisclosureGroup(isExpanded: $isExpanded) {
            VStack(alignment: .leading, spacing: Space.s) {
                Text(OnboardingCopy.welcomeServerField)
                    .adlerText(.caption)
                    .foregroundStyle(Color.inkMuted)
                TextField(ServerConfiguration.defaultBaseURL.absoluteString, text: $text)
                    .adlerText(.body, numeric: true)
                    .textContentType(.URL)
                    .keyboardType(.URL)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .adlerWell()
                    .accessibilityLabel(OnboardingCopy.welcomeServerField)

                HStack(spacing: Space.m) {
                    AdlerSecondaryButton(
                        title: OnboardingCopy.welcomeServerTest, isEnabled: !isTesting
                    ) {
                        Task { await test() }
                    }
                    if isTesting { ProgressView().controlSize(.small) }
                }

                Text(statusText)
                    .adlerText(.footnote)
                    .foregroundStyle(statusIsFailure ? Color.warning : Color.inkMuted)
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityAddTraits(.isStaticText)
            }
            .padding(.top, Space.s)
        } label: {
            Text(OnboardingCopy.welcomeAdvanced)
                .adlerText(.footnote)
                .foregroundStyle(Color.inkMuted)
        }
        .tint(Color.inkMuted)
        .onAppear { if text.isEmpty { text = session.serverConfiguration.displayText } }
    }

    private var statusIsFailure: Bool {
        if invalid { return true }
        if case .failure = session.lastPing { return true }
        return false
    }

    private var statusText: String {
        if invalid { return OnboardingCopy.welcomeServerInvalid }
        switch session.lastPing {
        case .success:
            return "\(OnboardingCopy.welcomeServerOk) \(session.serverConfiguration.displayText)"
        case .failure(let error):
            // The server's own words where it managed to answer; the transport's otherwise.
            return error.serverMessage ?? error.errorDescription ?? OnboardingCopy.welcomeServerInvalid
        case nil:
            return OnboardingCopy.welcomeServerUntested
        }
    }

    private func test() async {
        invalid = false
        guard let configuration = ServerConfiguration(text: text) else {
            invalid = true
            return
        }
        isTesting = true
        defer { isTesting = false }
        let reachable = await session.ping(configuration)
        // Only adopt an address that answered: a save that silently breaks every later request
        // is worse than no save at all. A failed test leaves the typed text alone, so the person
        // can see and correct it instead of watching it silently revert to the old address.
        guard reachable else { return }
        if configuration != session.serverConfiguration {
            await session.apply(serverConfiguration: configuration)
            _ = await session.ping()
        }
        text = session.serverConfiguration.displayText
    }
}

#if DEBUG
/// A way into the signed-in shell without spending a coaching turn. DEBUG only — compiled out
/// of Release entirely. `ShellUITests` taps `app.buttons["Developer sign-in"]`
/// (`App/README.md` §2), so the label is load-bearing.
///
/// The accounts below are fictional test accounts on a local dev server, documented in
/// `.context/ios-brief.md`. Nothing here is a real credential.
private struct DeveloperSignIn: View {
    @Environment(SessionStore.self) private var session
    @State private var isWorking = false
    @State private var failure: String?

    private static let accounts = [
        (username: "casey-example", password: "fictional-example-password"),
        (username: "shell-example", password: "fictional-example-password"),
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: Space.xs) {
            if let failure {
                Text(failure)
                    .adlerText(.footnote)
                    .foregroundStyle(Color.warning)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Button {
                Task { await signIn() }
            } label: {
                HStack(spacing: Space.s) {
                    if isWorking { ProgressView().controlSize(.small) }
                    Text("Developer sign-in")
                        .adlerText(.footnote)
                        .foregroundStyle(Color.inkMuted)
                }
                .frame(minHeight: AdlerLayout.minimumHitTarget, alignment: .leading)
                .contentShape(.rect)
            }
            .buttonStyle(.plain)
            .disabled(isWorking)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func signIn() async {
        isWorking = true
        defer { isWorking = false }
        failure = nil
        for account in Self.accounts {
            do {
                try await session.login(username: account.username, password: account.password)
                return
            } catch {
                // `/api/auth` is rate limited; trying the next account would only burn the
                // budget further and the reason would be invisible.
                if error.isRateLimited {
                    failure = error.serverMessage ?? error.errorDescription
                    return
                }
                continue
            }
        }
        let fallback = Self.accounts[1]
        do {
            try await session.register(username: fallback.username, password: fallback.password)
        } catch {
            failure = error.serverMessage ?? error.errorDescription
        }
    }
}
#endif

#Preview {
    NavigationStack { WelcomeView() }
        .environment(SessionStore(client: APIClient()))
}
