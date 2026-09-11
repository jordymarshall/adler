import SwiftUI

// Settings › AI provider (DESIGN.md §5.10, COPY.md §12, FLOWS.md §9).
//
// Two arrangements, both reported by the server: this server's own API account
// (`serverKeysAllowed` plus a key for that provider), or a personal key per provider. A saved key
// is never returned by any endpoint, so it is never displayed — the form says it is saved and
// accepts a replacement.

struct ProviderSettingsView: View {
    @Environment(WorkspaceStore.self) private var workspace

    @State private var draft: ProviderFormDraft?
    @State private var receipt: String?
    @State private var errorMessage: String?
    @State private var isWorking = false

    private var status: ProviderStatusView? { workspace.settings?.provider }
    private var serverKeysAllowed: Bool { workspace.settings?.status.serverKeysAllowed ?? false }

    private var option: ProviderOption? {
        guard let draft, let status else { return nil }
        return status.providers.first { $0.provider == draft.provider }
    }

    var body: some View {
        Form {
            Section {
                Text(SettingsCopy.providerTitle)
                    .adlerText(.title3)
                    .foregroundStyle(Color.inkHeading)
                SettingsHint(text: SettingsCopy.providerBody)
            }
            if let draft, let status {
                form(draft: draft, status: status)
            } else if workspace.state(.settings).isLoading {
                Section { SkeletonRow() }
            }
        }
        .scrollContentBackground(.hidden)
        .background(Color.canvas)
        .navigationTitle(SettingsCopy.provider)
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await workspace.loadSettings()
            if draft == nil, let status = workspace.settings?.provider {
                draft = ProviderFormDraft.from(status)
            }
        }
    }

    @ViewBuilder private func form(draft: ProviderFormDraft, status: ProviderStatusView)
        -> some View
    {
        let binding = Binding(get: { draft }, set: { self.draft = $0 })

        Section {
            Picker(SettingsCopy.providerProvider, selection: binding.provider) {
                ForEach(status.providers) { option in
                    Text(Self.displayName(option.provider)).tag(option.provider)
                }
            }
            .onChange(of: draft.provider) { _, provider in
                // The model default belongs to the provider, so switching resets it.
                guard let option = status.providers.first(where: { $0.provider == provider })
                else { return }
                self.draft?.model = option.defaultModel
                self.draft?.key = ""
                if !option.serverAvailable { self.draft?.useServer = false }
                receipt = nil
            }
            HStack {
                Text(SettingsCopy.providerModel).adlerText(.body).foregroundStyle(Color.ink)
                Spacer()
                TextField(option?.defaultModel ?? "", text: binding.model)
                    .multilineTextAlignment(.trailing)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
            }
            if serverKeysAllowed, option?.serverAvailable == true {
                Toggle(SettingsCopy.providerUseServer, isOn: binding.useServer)
            }
        }

        if !draft.useServer {
            Section {
                SecureField(SettingsCopy.providerKeyPlaceholder, text: binding.key)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                if option?.personalConfigured == true {
                    SettingsHint(text: SettingsCopy.providerKeySaved)
                }
            } header: {
                Text(SettingsCopy.providerKey)
            } footer: {
                SettingsHint(text: SettingsCopy.providerKeyHint)
            }
        }

        Section {
            if let errorMessage { SettingsError(text: errorMessage) }
            if let receipt { SettingsReceipt(text: receipt) }
            if let testedLine { SettingsReceipt(text: testedLine) }
            Button(SettingsCopy.providerSave) { Task { await save(test: false) } }
                .disabled(isWorking || saveError != nil)
            Button(SettingsCopy.providerSaveTest) { Task { await save(test: true) } }
                .disabled(isWorking || saveError != nil)
            if let saveError { SettingsError(text: saveError) }
            if option?.personalConfigured == true {
                Button(SettingsCopy.providerRemove, role: .destructive) {
                    Task { await removeKey() }
                }
                .disabled(isWorking)
            }
        } footer: {
            SettingsHint(text: SettingsCopy.providerTestHint)
        }
    }

    private var saveError: String? {
        guard let draft else { return nil }
        return draft.validationError
            ?? draft.keyError(personalConfigured: option?.personalConfigured ?? false)
    }

    /// The provider payload reports `testedAt: null` for a server key even right after a
    /// successful test, so the in-memory result is what this line reads (Core/README.md).
    private var testedLine: String? {
        if let test = workspace.lastProviderTest, test.connected,
            test.provider == draft?.provider
        {
            return SettingsCopy.providerTested(
                model: test.model, at: time(test.testedAt))
        }
        if let testedAt = option?.testedAt {
            return SettingsCopy.providerTested(
                model: draft?.model ?? "", at: time(testedAt))
        }
        return nil
    }

    private func time(_ stamp: Timestamp) -> String {
        guard let date = stamp.date else { return stamp.raw }
        return AdlerDate.time(date, calendar: SettingsTime.calendar(in: workspace.timeZone))
    }

    static func displayName(_ provider: String) -> String {
        switch provider {
        case "gemini": "Google Gemini"
        case "openai": "OpenAI GPT"
        case "anthropic": "Anthropic Claude"
        default: provider
        }
    }

    // MARK: Calls

    private func save(test: Bool) async {
        guard let draft else { return }
        isWorking = true
        defer { isWorking = false }
        errorMessage = nil
        receipt = nil
        do {
            _ = try await workspace.saveProvider(
                provider: draft.provider, model: draft.model, useServer: draft.useServer,
                key: draft.keyToSend)
            self.draft?.key = ""
            receipt = SettingsCopy.providerSaved
            if test { _ = try await workspace.testProvider() }
        } catch {
            errorMessage = error.serverMessage ?? error.errorDescription
        }
    }

    private func removeKey() async {
        guard let draft else { return }
        isWorking = true
        defer { isWorking = false }
        errorMessage = nil
        do {
            _ = try await workspace.saveProvider(
                provider: draft.provider, model: draft.model, useServer: false, removeKey: true)
            self.draft?.key = ""
            receipt = SettingsCopy.providerRemoved
        } catch {
            errorMessage = error.serverMessage ?? error.errorDescription
        }
    }
}
