import SwiftUI

/// Create account or sign in, with the goal draft visible so it is obvious nothing was lost
/// (DESIGN.md §5.3).
///
/// Failures print the server's own sentence — `That username is unavailable.`,
/// `Too many requests. Please try again later.` — because those are the words written for the
/// person reading them. The client only pre-checks what would certainly be refused, so the
/// button is not live while the request cannot succeed.
struct AuthView: View {
    let mode: AuthMode

    @Environment(SessionStore.self) private var session
    @Environment(AppRouter.self) private var router

    @State private var selected: AuthMode
    @State private var username = ""
    @State private var password = ""
    @State private var isWorking = false
    @State private var failure: APIError?
    @State private var handoff: FirstPlanStart?
    @FocusState private var focus: Field?

    private enum Field: Hashable { case username, password }

    init(mode: AuthMode) {
        self.mode = mode
        _selected = State(initialValue: mode)
    }

    private var timeZoneIdentifier: String { TimeZone.current.identifier }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Space.l) {
                Text(OnboardingCopy.authEyebrow)
                    .adlerText(.eyebrow)
                    .foregroundStyle(Color.inkMuted)

                Text(selected.title)
                    .adlerText(.title1)
                    .foregroundStyle(Color.inkHeading)
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityAddTraits(.isHeader)

                Text(OnboardingCopy.authBody)
                    .adlerText(.callout)
                    .foregroundStyle(Color.inkMuted)
                    .fixedSize(horizontal: false, vertical: true)

                Picker(OnboardingCopy.authSegmentLabel, selection: $selected) {
                    Text(OnboardingCopy.authTabRegister).tag(AuthMode.register)
                    Text(OnboardingCopy.authTabLogin).tag(AuthMode.login)
                }
                .pickerStyle(.segmented)
                .accessibilityLabel(OnboardingCopy.authSegmentLabel)

                if let failure {
                    ErrorBanner(kind: .of(failure), actionTitle: nil, action: nil) {
                        self.failure = nil
                    }
                    .accessibilityAddTraits(.isStaticText)
                }

                fields

                if selected == .register {
                    Text(OnboardingCopy.authTimeZone(timeZoneIdentifier))
                        .adlerText(.footnote, numeric: true)
                        .foregroundStyle(Color.inkMuted)
                        .fixedSize(horizontal: false, vertical: true)
                }

                Button {
                    Task { await submit() }
                } label: {
                    HStack(spacing: Space.s) {
                        if isWorking { ProgressView().controlSize(.small).tint(Color.surface) }
                        Text(isWorking ? OnboardingCopy.authBusy : selected.actionTitle)
                            .adlerText(.headline)
                    }
                    .frame(maxWidth: .infinity, minHeight: 52 - Space.xl)
                }
                .buttonStyle(.glassProminent)
                .tint(Color.accentGreen)
                .disabled(isWorking || !OnboardingValidation.canSubmit(username: username, password: password))
                .accessibilityIdentifier("Auth submit")

                if session.draft.hasText {
                    Label {
                        Text(OnboardingCopy.draftKept(shortDraft))
                            .adlerText(.footnote)
                            .foregroundStyle(Color.inkMuted)
                            .fixedSize(horizontal: false, vertical: true)
                    } icon: {
                        Image(systemName: "text.quote")
                            .font(.caption2)
                            .foregroundStyle(Color.inkMuted)
                    }
                    .padding(.top, Space.xs)
                }
            }
            .padding(.horizontal, AdlerLayout.screenMargin)
            .padding(.bottom, AdlerLayout.screenMargin)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(Color.canvas)
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(item: $handoff) { FirstPlanView(start: $0) }
    }

    private var shortDraft: String {
        let text = session.draft.text.trimmingCharacters(in: .whitespacesAndNewlines)
        return text.count > 90 ? String(text.prefix(90)) + "…" : text
    }

    @ViewBuilder
    private var fields: some View {
        VStack(alignment: .leading, spacing: Space.m) {
            VStack(alignment: .leading, spacing: Space.xs) {
                Text(OnboardingCopy.authUsername)
                    .adlerText(.caption)
                    .foregroundStyle(Color.inkMuted)
                TextField("", text: $username)
                    .adlerText(.body)
                    .textContentType(.username)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .focused($focus, equals: .username)
                    .submitLabel(.next)
                    .onSubmit { focus = .password }
                    .adlerWell()
                    .accessibilityLabel(OnboardingCopy.authUsername)
                    .accessibilityIdentifier("Username")
                if selected == .register {
                    Text(OnboardingCopy.authUsernameHint)
                        .adlerText(.footnote)
                        .foregroundStyle(Color.inkMuted)
                }
            }

            VStack(alignment: .leading, spacing: Space.xs) {
                Text(OnboardingCopy.authPassword)
                    .adlerText(.caption)
                    .foregroundStyle(Color.inkMuted)
                SecureField("", text: $password)
                    .adlerText(.body)
                    .textContentType(selected == .register ? .newPassword : .password)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .focused($focus, equals: .password)
                    .submitLabel(.go)
                    .onSubmit { Task { await submit() } }
                    .adlerWell()
                    .accessibilityLabel(OnboardingCopy.authPassword)
                    .accessibilityIdentifier("Password")
                Text(OnboardingCopy.authHint)
                    .adlerText(.footnote)
                    .foregroundStyle(Color.inkMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }

    private func submit() async {
        guard !isWorking,
            OnboardingValidation.canSubmit(username: username, password: password)
        else { return }
        isWorking = true
        defer { isWorking = false }
        failure = nil
        focus = nil
        do {
            let view = try await OnboardingAuth.authenticate(
                mode: selected,
                username: OnboardingValidation.normalisedUsername(username),
                password: password,
                configuration: session.serverConfiguration)
            if let opening = session.draft.coachOpening {
                handoff = FirstPlanStart(message: opening, coachConfigured: view.coachConfigured)
            } else {
                // A returning person with nothing in flight goes straight to Today.
                router.openToday(card: .doNext)
                await session.bootstrap()
            }
        } catch {
            failure = error
        }
    }
}

/// What the hand-off needs to start, small enough to be a navigation value.
nonisolated struct FirstPlanStart: Hashable, Sendable {
    /// The opening message, already wrapped by `PendingDraft.coachOpening`.
    let message: String
    /// `GET /api/app/session` → `status.coach.configured` for the account that just signed in.
    let coachConfigured: Bool
}

#Preview("Create account") {
    NavigationStack { AuthView(mode: .register) }
        .environment(SessionStore(client: APIClient()))
        .environment(WorkspaceStore(client: APIClient()))
        .environment(AppRouter())
}
