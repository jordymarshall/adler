import SwiftUI

// Settings › About & method (DESIGN.md §5.10).
//
// The version of this build, the coaching model actually in use, and a link to the method the
// server publishes. The link is built from the server this app is pointed at, because that is the
// copy of the method this workspace is coached by.

struct AboutSettingsView: View {
    @Environment(SessionStore.self) private var session
    @Environment(WorkspaceStore.self) private var workspace

    private var version: String {
        let info = Bundle.main.infoDictionary
        let short = info?["CFBundleShortVersionString"] as? String ?? "—"
        let build = info?["CFBundleVersion"] as? String ?? "—"
        return "\(short) (\(build))"
    }

    private var methodURL: URL? {
        URL(string: "/method", relativeTo: session.serverConfiguration.baseURL)?.absoluteURL
    }

    var body: some View {
        Form {
            Section {
                SettingsHint(text: SettingsCopy.aboutBody)
            }
            Section {
                HStack {
                    Text(SettingsCopy.aboutVersion).adlerText(.body).foregroundStyle(Color.ink)
                    Spacer()
                    Text(version)
                        .adlerText(.subhead, numeric: true)
                        .foregroundStyle(Color.inkMuted)
                }
                HStack {
                    Text(SettingsCopy.server).adlerText(.body).foregroundStyle(Color.ink)
                    Spacer()
                    Text(session.serverConfiguration.displayText)
                        .adlerText(.subhead)
                        .foregroundStyle(Color.inkMuted)
                        .lineLimit(1)
                        .truncationMode(.middle)
                }
                if let coach = workspace.settings?.status.coach {
                    HStack {
                        Text(SettingsCopy.provider).adlerText(.body).foregroundStyle(Color.ink)
                        Spacer()
                        Text(
                            coach.configured
                                ? "\(coach.provider) · \(coach.model)" : SettingsCopy.noProvider
                        )
                        .adlerText(.subhead)
                        .foregroundStyle(Color.inkMuted)
                        .lineLimit(1)
                        .truncationMode(.middle)
                    }
                }
            }
            if let methodURL {
                Section {
                    Link(SettingsCopy.aboutMethod, destination: methodURL)
                }
            }
            if let methods = workspace.settings?.methods, !methods.isEmpty {
                Section(SettingsCopy.programMethods) {
                    ForEach(methods) { method in
                        VStack(alignment: .leading, spacing: 1) {
                            Text(method.name).adlerText(.body).foregroundStyle(Color.ink)
                            // Source and stated limit, verbatim from the saved record.
                            Text(method.source)
                                .adlerText(.footnote)
                                .foregroundStyle(Color.inkMuted)
                            Text(method.limit)
                                .adlerText(.footnote)
                                .foregroundStyle(Color.inkMuted)
                                .fixedSize(horizontal: false, vertical: true)
                            if let url = URL(string: method.url) {
                                Link(method.evidence, destination: url)
                                    .adlerText(.footnote)
                            }
                        }
                        .padding(.vertical, Space.xxs)
                    }
                }
            }
        }
        .scrollContentBackground(.hidden)
        .background(Color.canvas)
        .navigationTitle(SettingsCopy.about)
        .navigationBarTitleDisplayMode(.inline)
        .task { await workspace.loadSettings() }
    }
}
