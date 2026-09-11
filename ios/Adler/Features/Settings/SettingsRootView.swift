import SwiftUI

// Settings (DESIGN.md §5.10). A `.large` sheet with its own `NavigationStack`: ordinary
// preferences first, advanced last. Every page shows real state — a capability the server has
// not configured says so instead of offering a control that cannot work.

/// Where the Settings stack can go. The six deep-linkable pages are `SettingsPage` (owned by
/// `Core/State/AppRoute.swift`); the time-zone picker is local to this sheet.
nonisolated enum SettingsDestination: Hashable, Sendable {
    case page(SettingsPage)
    case timeZone
}

struct SettingsRootView: View {
    @Environment(SessionStore.self) private var session
    @Environment(WorkspaceStore.self) private var workspace
    @Environment(AppRouter.self) private var router
    @Environment(\.dismiss) private var dismiss

    @State private var path: [SettingsDestination] = []
    @State private var appearance = AppearanceStore.shared
    @State private var isConfirmingSignOut = false
    @State private var appearanceError: String?
    @State private var didOpenDeepLink = false

    private var settings: SettingsView? { workspace.settings }

    var body: some View {
        NavigationStack(path: $path) {
            Form {
                account
                preferences
                coaching
                advanced
                signOutSection
            }
            .scrollContentBackground(.hidden)
            .background(Color.canvas)
            .navigationTitle(SettingsCopy.title)
            .navigationBarTitleDisplayMode(.inline)
            .navigationDestination(for: SettingsDestination.self) { destination($0) }
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Close") {
                        router.dismissSettings()
                        dismiss()
                    }
                }
            }
        }
        .preferredColorScheme(appearance.colorScheme)
        .task {
            workspace.markVisible(.settings)
            await workspace.loadSettings()
            openDeepLinkedPage()
        }
        .onDisappear { workspace.markHidden(.settings) }
    }

    @ViewBuilder private func destination(_ destination: SettingsDestination) -> some View {
        switch destination {
        case .page(.provider): ProviderSettingsView()
        case .page(.checkIns): CheckInsSettingsView()
        case .page(.connections): ConnectionsSettingsView()
        case .page(.program): ProgramSettingsView()
        case .page(.server): ServerSettingsView()
        case .page(.about): AboutSettingsView()
        case .timeZone: TimeZoneSettingsView()
        }
    }

    /// `adler://settings/<page>` lands on the page itself, once.
    private func openDeepLinkedPage() {
        guard !didOpenDeepLink, let page = router.settingsPage else { return }
        didOpenDeepLink = true
        path = [.page(page)]
    }

    // MARK: Sections

    private var account: some View {
        Section {
            HStack(spacing: Space.m) {
                MonogramAvatar()
                VStack(alignment: .leading, spacing: 1) {
                    Text(session.user?.username ?? settings?.user.username ?? "")
                        .adlerText(.headline)
                        .foregroundStyle(Color.ink)
                    Text(SettingsCopy.signedIn)
                        .adlerText(.footnote)
                        .foregroundStyle(Color.inkMuted)
                }
            }
            .padding(.vertical, Space.xxs)
            if let settings, !settings.status.coach.configured {
                ErrorBanner(kind: .noProvider, actionTitle: SettingsCopy.setUp) {
                    path = [.page(.provider)]
                }
                .listRowInsets(EdgeInsets())
            }
        }
    }

    private var preferences: some View {
        Section(SettingsCopy.preferences) {
            SettingsLinkRow(
                title: SettingsCopy.timeZone,
                detail: settings?.preferences.timeZone ?? workspace.timeZone.identifier,
                value: SettingsDestination.timeZone)
            Picker(SettingsCopy.appearance, selection: appearanceBinding) {
                ForEach(AppearancePreference.allCases) { option in
                    Text(option.label).tag(option)
                }
            }
            if let appearanceError { SettingsError(text: appearanceError) }
            SettingsHint(text: SettingsCopy.appearanceHint)
        }
    }

    private var appearanceBinding: Binding<AppearancePreference> {
        Binding(
            get: { appearance.preference },
            set: { newValue in
                appearance.preference = newValue
                guard let theme = newValue.serverTheme,
                    theme != settings?.preferences.theme
                else { return }
                Task { await saveTheme(theme) }
            })
    }

    /// Light and dark are saved to the workspace so the web reads the same value; `System` is
    /// device-local and writes nothing.
    private func saveTheme(_ theme: Theme) async {
        appearanceError = nil
        do {
            try await workspace.updatePreferences(theme: theme)
        } catch {
            appearanceError = error.serverMessage ?? error.errorDescription
        }
    }

    private var coaching: some View {
        Section(SettingsCopy.coaching) {
            SettingsLinkRow(
                title: SettingsCopy.program, detail: programDetail,
                value: SettingsDestination.page(.program))
            SettingsLinkRow(
                title: SettingsCopy.checkIns, detail: checkInsDetail,
                value: SettingsDestination.page(.checkIns))
            SettingsLinkRow(
                title: SettingsCopy.connections, detail: connectionsDetail,
                value: SettingsDestination.page(.connections))
            SettingsLinkRow(
                title: SettingsCopy.provider, detail: providerDetail,
                value: SettingsDestination.page(.provider))
        }
    }

    private var advanced: some View {
        Section(SettingsCopy.advanced) {
            SettingsLinkRow(
                title: SettingsCopy.server, detail: session.serverConfiguration.displayText,
                value: SettingsDestination.page(.server))
            SettingsLinkRow(
                title: SettingsCopy.about, detail: nil,
                value: SettingsDestination.page(.about))
        }
    }

    private var signOutSection: some View {
        Section {
            Button(SettingsCopy.signOut, role: .destructive) { isConfirmingSignOut = true }
                .confirmationDialog(
                    SettingsCopy.signOutConfirm, isPresented: $isConfirmingSignOut,
                    titleVisibility: .visible
                ) {
                    Button(SettingsCopy.signOutAction, role: .destructive) {
                        Task {
                            router.dismissSettings()
                            dismiss()
                            await session.logout()
                            await workspace.reset()
                            router.reset()
                        }
                    }
                    Button("Cancel", role: .cancel) {}
                }
        }
    }

    // MARK: Row details

    private var programDetail: String? {
        guard let program = settings?.program else { return nil }
        return "\(program.weeklyMinutes) min/week"
    }

    private var checkInsDetail: String? {
        guard let automation = settings?.preferences.automation else { return nil }
        guard automation.enabled else { return SettingsCopy.checkInsOff }
        return "On · \(automation.checkInTime)"
    }

    private var connectionsDetail: String? {
        guard let connections = settings?.connections else { return nil }
        if !connections.configured { return SettingsCopy.calendarOptional }
        return connections.link == nil ? SettingsCopy.phoneNotLinked : SettingsCopy.phoneLinked
    }

    private var providerDetail: String? {
        guard let provider = settings?.provider.selected else { return nil }
        let source =
            provider.useServer ? SettingsCopy.serverKeyLabel : SettingsCopy.personalKeyLabel
        return "\(source) · \(provider.provider)"
    }
}

// MARK: - Time zone

/// Every day boundary in the app is read in this zone, so it is a real preference, not a display
/// nicety. Saving writes `preferences.timeZone`.
struct TimeZoneSettingsView: View {
    @Environment(WorkspaceStore.self) private var workspace
    @Environment(\.dismiss) private var dismiss

    @State private var query = ""
    @State private var errorMessage: String?
    @State private var isSaving = false

    private var current: String { workspace.settings?.preferences.timeZone ?? "" }

    private var identifiers: [String] {
        let all = TimeZone.knownTimeZoneIdentifiers.sorted()
        guard !query.isEmpty else { return all }
        return all.filter { $0.localizedCaseInsensitiveContains(query) }
    }

    var body: some View {
        List {
            if let errorMessage {
                Section { SettingsError(text: errorMessage) }
            }
            Section {
                ForEach(identifiers, id: \.self) { identifier in
                    Button {
                        Task { await save(identifier) }
                    } label: {
                        HStack {
                            Text(identifier).adlerText(.body).foregroundStyle(Color.ink)
                            Spacer()
                            if identifier == current {
                                Image(systemName: "checkmark").foregroundStyle(Color.accentInk)
                            }
                        }
                    }
                    .disabled(isSaving)
                }
            }
        }
        .searchable(text: $query)
        .navigationTitle(SettingsCopy.timeZone)
        .navigationBarTitleDisplayMode(.inline)
    }

    private func save(_ identifier: String) async {
        isSaving = true
        defer { isSaving = false }
        errorMessage = nil
        do {
            try await workspace.updatePreferences(timeZone: identifier)
            dismiss()
        } catch {
            errorMessage = error.serverMessage ?? error.errorDescription
        }
    }
}
