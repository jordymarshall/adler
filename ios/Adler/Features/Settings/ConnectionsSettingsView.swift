import SwiftUI
import UIKit

// Settings › Connections (DESIGN.md §5.10, COPY.md §12, FLOWS.md §10).
//
// Three capabilities, each shown only in the state the server actually reports: phone pairing
// (a one-use code redeemed by a signed inbound message from that number), MCP/webhook access
// tokens (plaintext shown exactly once), and calendar connections.

struct ConnectionsSettingsView: View {
    @Environment(WorkspaceStore.self) private var workspace
    @Environment(SessionStore.self) private var session

    @State private var live: ConnectionsResponse?
    @State private var pairing = PairingFormDraft()
    @State private var pairCode: PairResponse?
    @State private var token = TokenFormDraft()
    @State private var createdToken: CreateTokenResponse?
    @State private var calendars: CalendarList?
    @State private var apple = AppleCalendarCredentials(email: "", password: "")
    @State private var revoking: APITokenView?
    @State private var receipt: String?
    @State private var errorMessage: String?
    @State private var isWorking = false

    private var settings: SettingsView? { workspace.settings }

    private var connections: ConnectionsView? {
        if let live {
            return ConnectionsView(
                configured: live.configured, provider: live.provider, number: live.number,
                publicUrl: live.publicUrl, link: live.link, jobs: live.jobs,
                deliveries: live.deliveries)
        }
        return settings?.connections
    }

    private var tokens: [APITokenView] { live?.tokens ?? settings?.tokens ?? [] }

    var body: some View {
        Form {
            Section {
                Text(SettingsCopy.connectionsTitle)
                    .adlerText(.title3)
                    .foregroundStyle(Color.inkHeading)
                if let errorMessage { SettingsError(text: errorMessage) }
                if let receipt { SettingsReceipt(text: receipt) }
            }
            phone
            tokensSection
            calendarsSection
        }
        .scrollContentBackground(.hidden)
        .background(Color.canvas)
        .navigationTitle(SettingsCopy.connections)
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await workspace.loadSettings()
            await refresh()
            await loadCalendars()
        }
        // While a code is outstanding the link only appears once the person's text arrives, so
        // the screen polls until it does (FLOWS.md §10 step 5).
        .task(id: pairCode?.code) {
            guard pairCode != nil else { return }
            for _ in 0..<60 {
                try? await Task.sleep(for: .seconds(5))
                if Task.isCancelled { return }
                await refresh()
                if connections?.link != nil {
                    pairCode = nil
                    return
                }
            }
        }
        .confirmationDialog(
            SettingsCopy.connectionsRevoke, isPresented: revokingBinding, titleVisibility: .visible
        ) {
            Button(SettingsCopy.connectionsRevoke, role: .destructive) {
                if let revoking { Task { await revoke(revoking) } }
            }
            Button("Cancel", role: .cancel) { revoking = nil }
        } message: {
            Text(revoking.map { "\($0.name) · \($0.scope.rawValue)" } ?? "")
        }
    }

    private var revokingBinding: Binding<Bool> {
        Binding(get: { revoking != nil }, set: { if !$0 { revoking = nil } })
    }

    // MARK: Phone

    @ViewBuilder private var phone: some View {
        Section {
            if connections?.configured == false {
                SettingsHint(text: SettingsCopy.connectionsNotConfigured)
            } else if let link = connections?.link {
                VStack(alignment: .leading, spacing: Space.xs) {
                    Text(SettingsCopy.connectionsLinked(link.address))
                        .adlerText(.subhead)
                        .foregroundStyle(Color.ink)
                    Text(
                        link.isOptedOut
                            ? SettingsCopy.connectionsOptedOut : SettingsCopy.connectionsReady
                    )
                    .adlerText(.footnote)
                    .foregroundStyle(link.isOptedOut ? Color.warning : Color.inkMuted)
                }
                Button(SettingsCopy.connectionsUnlink, role: .destructive) {
                    Task { await unlink() }
                }
                .disabled(isWorking)
            } else {
                TextField(SettingsCopy.connectionsPhone, text: $pairing.address)
                    .keyboardType(.phonePad)
                    .textContentType(.telephoneNumber)
                if let problem = pairing.validationError, !pairing.address.isEmpty {
                    SettingsError(text: problem)
                }
                Button(SettingsCopy.connectionsGetCode) { Task { await pair() } }
                    .disabled(isWorking || pairing.validationError != nil)
                if let pairCode { codePanel(pairCode) }
            }
        } header: {
            Text(SettingsCopy.connectionsTextTitle)
        }
    }

    /// The exact text to send, the number to send it to, and the ten-minute window.
    private func codePanel(_ code: PairResponse) -> some View {
        VStack(alignment: .leading, spacing: Space.s) {
            Text(
                SettingsCopy.connectionsCodeInstruction(
                    from: pairing.address, to: code.to ?? connections?.number ?? "")
            )
            .adlerText(.footnote)
            .foregroundStyle(Color.inkMuted)
            .fixedSize(horizontal: false, vertical: true)
            // `send` is the server's exact message; it is shown and copied unchanged.
            Text(code.send)
                .font(.system(.body, design: .monospaced))
                .textSelection(.enabled)
                .frame(maxWidth: .infinity, alignment: .leading)
                .adlerWell()
            HStack(spacing: Space.m) {
                Button(SettingsCopy.connectionsCopy) {
                    UIPasteboard.general.string = code.send
                    receipt = SettingsCopy.connectionsCopied
                }
                Spacer()
                Text(expiry(code.expires))
                    .adlerText(.footnote, numeric: true)
                    .foregroundStyle(Color.inkMuted)
            }
        }
    }

    // MARK: Tokens

    @ViewBuilder private var tokensSection: some View {
        Section {
            TextField(SettingsCopy.tokenName, text: $token.name)
            Picker(SettingsCopy.connectionsTokenType, selection: $token.scope) {
                Text(SettingsCopy.connectionsTokenMcp).tag(TokenScope.mcp)
                Text(SettingsCopy.connectionsTokenWebhook).tag(TokenScope.webhook)
            }
            Stepper(value: $token.days, in: 1...365, step: 1) {
                Text("\(SettingsCopy.tokenDays): \(token.days)")
                    .adlerText(.body, numeric: true)
                    .foregroundStyle(Color.ink)
            }
            if let problem = token.validationError, !token.name.isEmpty {
                SettingsError(text: problem)
            }
            Button(token.buttonTitle) { Task { await create() } }
                .disabled(isWorking || token.validationError != nil)
            if let createdToken { createdPanel(createdToken) }
        } header: {
            Text(SettingsCopy.connectionsTokens)
        }

        Section {
            if tokens.isEmpty {
                SettingsHint(text: SettingsCopy.noTokens)
            }
            ForEach(tokens) { item in
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 1) {
                        Text(item.name).adlerText(.subhead).foregroundStyle(Color.ink)
                        Text("\(item.scope.rawValue) · \(SettingsCopy.expires) \(expiry(item.expires))")
                            .adlerText(.footnote, numeric: true)
                            .foregroundStyle(Color.inkMuted)
                    }
                    Spacer(minLength: Space.s)
                    Button(SettingsCopy.connectionsRevoke, role: .destructive) { revoking = item }
                        .buttonStyle(.borderless)
                }
            }
        }
    }

    /// The plaintext token, shown exactly once.
    private func createdPanel(_ created: CreateTokenResponse) -> some View {
        VStack(alignment: .leading, spacing: Space.s) {
            SettingsError(text: SettingsCopy.connectionsCopyOnce)
            Text(created.token)
                .font(.system(.footnote, design: .monospaced))
                .textSelection(.enabled)
                .frame(maxWidth: .infinity, alignment: .leading)
                .adlerWell()
            HStack(spacing: Space.m) {
                Button(SettingsCopy.connectionsCopy) {
                    UIPasteboard.general.string = created.token
                    receipt = SettingsCopy.connectionsCopied
                }
                Button(SettingsCopy.connectionsHide) { createdToken = nil }
                Spacer()
                Text(expiry(created.expires))
                    .adlerText(.footnote, numeric: true)
                    .foregroundStyle(Color.inkMuted)
            }
        }
    }

    // MARK: Calendars

    @ViewBuilder private var calendarsSection: some View {
        let google = settings?.status.calendars.google
        let appleConnected = settings?.status.calendars.apple.connected ?? false

        Section {
            HStack {
                Text("Google Calendar").adlerText(.body).foregroundStyle(Color.ink)
                Spacer()
                AdlerChip(
                    label: google?.connected == true
                        ? SettingsCopy.calendarConnected : SettingsCopy.calendarOptional,
                    emphasis: google?.connected == true ? .filled : .outlined)
            }
            if google?.configured != true {
                SettingsHint(text: SettingsCopy.googleNotConfigured)
            } else if google?.connected == true {
                calendarList(calendars?.google ?? [])
                Button(SettingsCopy.disconnect, role: .destructive) {
                    Task { await disconnect("google") }
                }
            } else if let url = googleConnectURL {
                Link(SettingsCopy.connect, destination: url)
                SettingsHint(text: SettingsCopy.googleConnectNote)
            }
        } header: {
            Text(SettingsCopy.calendarsTitle)
        }

        Section {
            HStack {
                Text(SettingsCopy.appleConnect).adlerText(.body).foregroundStyle(Color.ink)
                Spacer()
                AdlerChip(
                    label: appleConnected
                        ? SettingsCopy.calendarConnected : SettingsCopy.calendarOptional,
                    emphasis: appleConnected ? .filled : .outlined)
            }
            if appleConnected {
                calendarList(calendars?.apple ?? [])
                Button(SettingsCopy.disconnect, role: .destructive) {
                    Task { await disconnect("apple") }
                }
            } else {
                TextField(SettingsCopy.appleEmail, text: appleEmail)
                    .keyboardType(.emailAddress)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                SecureField(SettingsCopy.applePassword, text: applePassword)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                SettingsHint(text: SettingsCopy.applePasswordHint)
                Button(SettingsCopy.connect) { Task { await connectApple() } }
                    .disabled(isWorking || apple.email.isEmpty || apple.password.isEmpty)
            }
        }
    }

    @ViewBuilder private func calendarList(_ list: [ExternalCalendar]) -> some View {
        ForEach(list) { calendar in
            HStack {
                Text(calendar.name).adlerText(.subhead).foregroundStyle(Color.ink).lineLimit(1)
                Spacer(minLength: Space.s)
                if calendar.writable {
                    AdlerChip(label: SettingsCopy.writable, emphasis: .outlined)
                }
            }
        }
    }

    private var appleEmail: Binding<String> {
        Binding(
            get: { apple.email },
            set: { apple = AppleCalendarCredentials(email: $0, password: apple.password) })
    }

    private var applePassword: Binding<String> {
        Binding(
            get: { apple.password },
            set: { apple = AppleCalendarCredentials(email: apple.email, password: $0) })
    }

    /// The server's own OAuth start route. It needs a signed-in *browser* session, which the
    /// app's cookie is not, so the note beside it says so rather than implying one tap is enough.
    private var googleConnectURL: URL? {
        URL(string: "/api/calendar/google/connect", relativeTo: baseURL)?.absoluteURL
    }

    private var baseURL: URL { session.serverConfiguration.baseURL }

    private func expiry(_ milliseconds: Double) -> String {
        let date = Date(timeIntervalSince1970: milliseconds / 1000)
        let calendar = SettingsTime.calendar(in: workspace.timeZone)
        return "\(AdlerDate.short(date, today: .now, calendar: calendar)) \(AdlerDate.time(date, calendar: calendar))"
    }

    // MARK: Calls

    private func refresh() async {
        do { live = try await workspace.connections() } catch {
            errorMessage = error.serverMessage ?? error.errorDescription
        }
    }

    private func loadCalendars() async {
        guard settings?.status.calendars.google.connected == true
            || settings?.status.calendars.apple.connected == true
        else { return }
        calendars = try? await workspace.externalCalendars()
    }

    private func pair() async {
        isWorking = true
        defer { isWorking = false }
        errorMessage = nil
        do {
            pairCode = try await workspace.pairPhone(address: pairing.address)
        } catch {
            errorMessage = error.serverMessage ?? error.errorDescription
        }
    }

    private func unlink() async {
        isWorking = true
        defer { isWorking = false }
        errorMessage = nil
        do {
            try await workspace.unlinkPhone()
            pairCode = nil
            await refresh()
        } catch {
            errorMessage = error.serverMessage ?? error.errorDescription
        }
    }

    private func create() async {
        isWorking = true
        defer { isWorking = false }
        errorMessage = nil
        do {
            createdToken = try await workspace.createToken(
                name: token.name, scope: token.scope, days: token.days)
            token.name = ""
            await refresh()
        } catch {
            errorMessage = error.serverMessage ?? error.errorDescription
        }
    }

    private func revoke(_ item: APITokenView) async {
        revoking = nil
        isWorking = true
        defer { isWorking = false }
        errorMessage = nil
        do {
            try await workspace.revokeToken(id: item.id)
            if createdToken?.id == item.id { createdToken = nil }
            await refresh()
        } catch {
            errorMessage = error.serverMessage ?? error.errorDescription
        }
    }

    private func connectApple() async {
        isWorking = true
        defer { isWorking = false }
        errorMessage = nil
        do {
            try await workspace.connectAppleCalendar(
                email: apple.email, password: apple.password)
            apple = AppleCalendarCredentials(email: "", password: "")
            await loadCalendars()
        } catch {
            errorMessage = error.serverMessage ?? error.errorDescription
        }
    }

    private func disconnect(_ provider: String) async {
        isWorking = true
        defer { isWorking = false }
        errorMessage = nil
        do {
            try await workspace.disconnectCalendar(provider: provider)
            calendars = nil
        } catch {
            errorMessage = error.serverMessage ?? error.errorDescription
        }
    }
}
