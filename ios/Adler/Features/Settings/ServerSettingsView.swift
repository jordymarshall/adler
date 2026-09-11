import SwiftUI

// Settings › Server (DESIGN.md §5.10, docs/ios-app.md).
//
// Changing the address points the app at a different workspace, so it signs the session out and
// clears the cache. `Ping` checks the address first, so a typo is caught here rather than at the
// next write.

struct ServerSettingsView: View {
    @Environment(SessionStore.self) private var session
    @Environment(WorkspaceStore.self) private var workspace

    @State private var draft = ServerFormDraft(text: "")
    @State private var pingResult: String?
    @State private var pingFailed = false
    @State private var isWorking = false
    @State private var loaded = false

    var body: some View {
        Form {
            Section {
                TextField("http://localhost:8080", text: $draft.text)
                    .keyboardType(.URL)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                if let problem = draft.validationError, !draft.text.isEmpty {
                    SettingsError(text: problem)
                }
            } header: {
                Text(SettingsCopy.server)
            } footer: {
                SettingsHint(text: SettingsCopy.serverLANHint)
            }

            Section {
                Button(SettingsCopy.serverPing) { Task { await ping() } }
                    .disabled(isWorking || draft.configuration == nil)
                if let pingResult {
                    if pingFailed {
                        SettingsError(text: pingResult)
                    } else {
                        SettingsReceipt(text: pingResult)
                    }
                }
            }

            Section {
                Button(SettingsCopy.serverApply) { Task { await apply() } }
                    .disabled(
                        isWorking || draft.configuration == nil
                            || draft.configuration == session.serverConfiguration)
            } footer: {
                SettingsHint(text: SettingsCopy.serverChange)
            }
        }
        .scrollContentBackground(.hidden)
        .background(Color.canvas)
        .navigationTitle(SettingsCopy.server)
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            guard !loaded else { return }
            draft.text = session.serverConfiguration.displayText
            loaded = true
        }
    }

    private func ping() async {
        guard let configuration = draft.configuration else { return }
        isWorking = true
        defer { isWorking = false }
        pingResult = nil
        let ok = await session.ping(configuration)
        pingFailed = !ok
        if ok {
            pingResult = SettingsCopy.serverPingOK
        } else if case .failure(let error) = session.lastPing {
            pingResult = error.serverMessage ?? error.errorDescription
        }
    }

    private func apply() async {
        guard let configuration = draft.configuration else { return }
        isWorking = true
        defer { isWorking = false }
        configuration.save()
        await workspace.reset()
        await session.apply(serverConfiguration: configuration)
    }
}
