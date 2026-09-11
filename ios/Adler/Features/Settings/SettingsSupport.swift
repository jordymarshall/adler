import SwiftUI

// Copy, form values and shared rows for Settings (DESIGN.md §5.10, COPY.md §12).
//
// Every string below is COPY.md verbatim unless it is in the "Not in COPY.md" block, which is
// listed in `.context/notes/calendar-settings.md` so the copy owner can fold them in. Server
// messages — refusals, provider errors, delivery states, program reasons — are printed as they
// arrive and are never re-worded.

nonisolated enum SettingsCopy {
    static let title = "Settings"
    static let preferences = "Preferences"
    static let timeZone = "Time zone"
    static let appearance = "Appearance"
    static let appearanceSystem = "System"
    static let appearanceLight = "Light"
    static let appearanceDark = "Dark"
    static let coaching = "Coaching"
    static let program = "Coaching program"
    static let checkIns = "Check-ins"
    static let connections = "Connections"
    static let provider = "AI provider"
    static let advanced = "Advanced"
    static let server = "Server"
    static let about = "About & method"
    static let signOut = "Sign out"
    static let signOutConfirm = "Sign out? Your goals and history stay on the server."
    static let serverChange = "Changing the server signs you out of this session."

    // Provider
    static let providerTitle = "Choose the model behind Adler."
    static let providerBody =
        "Goal setup and ongoing coaching use your selected provider. Your program, records and proposed changes work the same way."
    static let providerProvider = "Provider"
    static let providerModel = "Model"
    static let providerUseServer = "Use this server’s configured API account"
    static let providerKey = "API key"
    static let providerKeyPlaceholder = "Paste your provider API key"
    static let providerKeySaved = "Saved securely — enter a replacement to change it"
    static let providerKeyHint =
        "Keys are encrypted on the server and never returned to the app. API billing is separate from a ChatGPT, Gemini or Claude subscription."
    static let providerSave = "Save provider"
    static let providerSaveTest = "Save & test connection"
    static let providerRemove = "Remove key"
    static let providerTestHint =
        "The connection test makes one small paid API request, without your workspace data."
    static let providerSaved =
        "Provider settings saved. Test the connection to check this account’s API access."
    static let providerRemoved = "Saved key removed."

    static func providerTested(model: String, at time: String) -> String {
        "Connected to \(model). A small test request succeeded at \(time)."
    }

    // Check-ins
    static let checkInsEnable = "Send me scheduled check-ins and a weekly review invitation"
    static let checkInsWhen = "When to check in"
    static let checkInsAfterSession = "After scheduled work"
    static let checkInsEndOfDay = "At the end of my day"
    static let checkInsDailyTime = "Daily check-in time"
    static let checkInsQuietStart = "Quiet hours start"
    static let checkInsQuietEnd = "Quiet hours end"
    static let checkInsHint =
        "Requires a linked phone. Scheduled messages wait during quiet hours. Daily check-ins ask about your day while you have active goals; they do not assume unreported work was missed."
    static let checkInsStatus = "Scheduled work and delivery status"
    static let checkInsNoJobs = "No jobs scheduled yet."

    static func checkInsReviewTime(_ day: String) -> String { "\(day) review time" }

    // Connections
    static let connectionsTitle = "The same Adler, wherever you reply."
    static let connectionsTextTitle = "Text Adler from your phone"
    static let connectionsPhone = "Your phone number"
    static let connectionsGetCode = "Get pairing code"
    static let connectionsReady = "Ready for replies"
    static let connectionsOptedOut = "Texts stopped. Send START to resume."
    static let connectionsUnlink = "Unlink phone"
    static let connectionsNotConfigured =
        "Phone messaging has not been connected on this server yet."
    static let connectionsTokens = "MCP & incoming webhooks"
    static let connectionsTokenType = "Access token type"
    static let connectionsTokenMcp = "MCP access"
    static let connectionsTokenWebhook = "Incoming webhook access"
    static let connectionsCreate30Day = "Create 30-day token"
    static let connectionsCopyOnce = "Copy this now. The token is shown only once."
    static let connectionsCopy = "Copy connection details"
    static let connectionsCopied = "Connection details copied."
    static let connectionsHide = "Hide token"
    static let connectionsRevoke = "Revoke"
    static let calendarConnected = "Connected"
    static let calendarOptional = "Optional"
    static let connect = "Connect"
    static let disconnect = "Disconnect"

    static func connectionsLinked(_ address: String) -> String { "Linked: \(address)" }

    static func connectionsCodeInstruction(from address: String, to destination: String) -> String {
        "From \(address), text this to \(destination) within 10 minutes:"
    }

    // Program
    static let programTitle = "Time & coaching"
    static let programBody =
        "Set when you have time and how often you want to look back. Each goal’s planning cycle adapts to your input."
    static let programWeeklyMinutes = "Minutes per week"
    static let programSessionMinutes = "Session length"
    static let programWorkStart = "Work window starts"
    static let programWorkEnd = "Work window ends"
    static let programWorkDays = "Days available"
    static let programReviewDay = "Weekly review day"
    static let programFocusGoal = "Focus goal"
    static let programApproach = "Current approach"
    static let programMethods = "Methods Adler may use"
    static let programReason = "Reason for this revision"
    static let programSave = "Save preferences"
    static let programHint =
        "These are planning preferences. Adler still checks your capacity and asks before booking time."
    static let programDefaultReason = "You updated your coaching preferences."

    // Errors (COPY.md §13)
    static let noProvider = "No AI provider is configured on this server."

    // MARK: Not in COPY.md — added by this screen, listed in the agent notes.

    static let signedIn = "Signed in"
    static let serverKeyLabel = "Server key"
    static let personalKeyLabel = "Your key"
    static let phoneLinked = "Phone linked"
    static let phoneNotLinked = "Not linked"
    static let checkInsOff = "Off"
    static let setUp = "Set up"
    static let appearanceHint =
        "System follows the device. Light and dark are saved to your workspace and used on the web too."
    static let createToken = "Create token"
    static let tokenName = "Name"
    static let tokenDays = "Days until expiry"
    static let tokenNameRequired = "Name this token so you can recognise it later."
    static let noTokens = "No access tokens."
    static let reasonRequired = "Describe why you are changing your program."
    static let modelRequired = "Enter the model to use, or leave the default."
    static let keyRequired = "Paste a key, or use this server’s configured account."
    static let serverURLInvalid = "Enter an http or https address, for example http://localhost:8080."
    static let serverLANHint =
        "On a phone, use the Mac’s private address, for example http://192.168.1.24:8080. Plain HTTP works only for localhost and private networks."
    static let serverPing = "Ping"
    static let serverPingOK = "The server answered."
    static let serverApply = "Use this server"
    static let googleNotConfigured =
        "Google Calendar is not configured on this server. The operator sets GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI."
    static let googleConnectNote =
        "Connecting Google opens Adler on the web in Safari. Sign in there first — the app’s session is not shared with the browser."
    static let appleConnect = "Apple Calendar (CalDAV)"
    static let appleEmail = "Apple ID"
    static let applePassword = "App-specific password"
    static let applePasswordHint =
        "Use an app-specific password from appleid.apple.com, not your account password."
    static let calendarsTitle = "Calendars"
    static let aboutVersion = "Version"
    static let aboutMethod = "Read the method"
    static let aboutBody =
        "Adler turns a goal into work you can do and records what happens. Recommendations name the research behind them and its limits."
    static let signOutAction = "Sign out"
    static let phoneFormat = "Use an international phone number, including + and country code."
    static let expires = "Expires"
    static let writable = "Writable"
    static let disclosureHistory = "History & settings"
    static let googleCalendar = "Google Calendar"
}

// MARK: - Appearance

/// Light, dark or the device setting. The workspace stores only `light`/`dark` (the web reads the
/// same field), so `system` is a device-local choice and writes nothing.
nonisolated enum AppearancePreference: String, CaseIterable, Sendable, Identifiable {
    case system
    case light
    case dark

    var id: String { rawValue }

    var label: String {
        switch self {
        case .system: SettingsCopy.appearanceSystem
        case .light: SettingsCopy.appearanceLight
        case .dark: SettingsCopy.appearanceDark
        }
    }

    var colorScheme: ColorScheme? {
        switch self {
        case .system: nil
        case .light: .light
        case .dark: .dark
        }
    }

    /// What to save on the server, or `nil` when there is nothing to save.
    var serverTheme: Theme? {
        switch self {
        case .system: nil
        case .light: .light
        case .dark: .dark
        }
    }

    static func from(_ theme: Theme) -> AppearancePreference {
        theme == .dark ? .dark : .light
    }
}

/// The device-local appearance choice. `MainTabView` and the Settings sheet both read it, so the
/// whole app changes the moment it is set.
@Observable
final class AppearanceStore {
    static let shared = AppearanceStore()

    static let storageKey = "adler.appearance"

    var preference: AppearancePreference {
        didSet { defaults.set(preference.rawValue, forKey: Self.storageKey) }
    }

    private let defaults: UserDefaults

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        preference =
            defaults.string(forKey: Self.storageKey)
            .flatMap(AppearancePreference.init(rawValue:)) ?? .system
    }

    var colorScheme: ColorScheme? { preference.colorScheme }
}

// MARK: - Times

/// `HH:MM` in the workspace zone, bridged to the `DatePicker` a Form wants.
nonisolated enum SettingsTime {
    /// A fixed reference day so a time picker only ever edits hours and minutes.
    static let reference = Date(timeIntervalSince1970: 0)

    static func date(_ text: String) -> Date {
        let minutes = DayMinutes.parse(text) ?? 0
        return reference.addingTimeInterval(TimeInterval(minutes * 60))
    }

    static func text(_ date: Date) -> String {
        var calendar = YMD.calendar
        calendar.timeZone = TimeZone(secondsFromGMT: 0) ?? .gmt
        let parts = calendar.dateComponents([.hour, .minute], from: date)
        return DayMinutes.text((parts.hour ?? 0) * 60 + (parts.minute ?? 0))
    }

    static func binding(_ source: Binding<String>) -> Binding<Date> {
        Binding(get: { date(source.wrappedValue) }, set: { source.wrappedValue = text($0) })
    }

    /// The workspace calendar, so a time-of-day is formatted in the account's zone rather than
    /// the device's.
    static func calendar(in timeZone: TimeZone) -> Calendar {
        var calendar = YMD.calendar
        calendar.timeZone = timeZone
        return calendar
    }
}

// MARK: - Form drafts

/// The provider form. The key is write-only: it is sent once and never read back.
nonisolated struct ProviderFormDraft: Equatable, Sendable {
    var provider: String
    var model: String
    var useServer: Bool
    var key: String = ""

    /// `nil` when the form can be saved.
    var validationError: String? {
        if model.trimmingCharacters(in: .whitespaces).isEmpty { return SettingsCopy.modelRequired }
        return nil
    }

    /// A key is only needed when this is the first personal save for the provider.
    func keyError(personalConfigured: Bool) -> String? {
        guard !useServer, !personalConfigured,
            key.trimmingCharacters(in: .whitespaces).isEmpty
        else { return nil }
        return SettingsCopy.keyRequired
    }

    var keyToSend: String? {
        let trimmed = key.trimmingCharacters(in: .whitespaces)
        return trimmed.isEmpty ? nil : trimmed
    }

    static func from(_ status: ProviderStatusView) -> ProviderFormDraft {
        ProviderFormDraft(
            provider: status.selected.provider,
            model: status.selected.model,
            useServer: status.selected.useServer)
    }
}

/// The program form. A revision always carries a reason — the server refuses one without it.
nonisolated struct ProgramFormDraft: Equatable, Sendable {
    var weeklyMinutes: Int
    var sessionMinutes: Int
    var workStart: String
    var workEnd: String
    var workDays: [Int]
    var reviewDay: String
    var focusGoalId: String
    var approach: String
    var enabledMethods: [String]
    var reason: String = ""

    var validationError: String? {
        if reason.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return SettingsCopy.reasonRequired
        }
        guard let open = DayMinutes.parse(workStart), let close = DayMinutes.parse(workEnd),
            close > open
        else { return "Set a work window that ends after it starts." }
        if workDays.isEmpty { return "Choose at least one day you are available." }
        if weeklyMinutes < sessionMinutes {
            return "Minutes per week must cover at least one session."
        }
        return nil
    }

    static func from(_ program: ProgramVersion) -> ProgramFormDraft {
        ProgramFormDraft(
            weeklyMinutes: program.weeklyMinutes,
            sessionMinutes: program.sessionMinutes,
            workStart: program.workStart,
            workEnd: program.workEnd,
            workDays: program.workDays.sorted(),
            reviewDay: program.reviewDay,
            focusGoalId: program.focusGoalId,
            approach: program.approach,
            enabledMethods: program.enabledMethods)
    }
}

nonisolated struct TokenFormDraft: Equatable, Sendable {
    var name: String = ""
    var scope: TokenScope = .mcp
    var days: Int = 30

    var validationError: String? {
        name.trimmingCharacters(in: .whitespaces).isEmpty ? SettingsCopy.tokenNameRequired : nil
    }

    var buttonTitle: String {
        days == 30 ? SettingsCopy.connectionsCreate30Day : SettingsCopy.createToken
    }
}

/// The phone pairing form. The rule matches the server's, so the same sentence explains it.
nonisolated struct PairingFormDraft: Equatable, Sendable {
    var address: String = ""

    var validationError: String? {
        let trimmed = address.trimmingCharacters(in: .whitespaces)
        guard trimmed.first == "+", trimmed.dropFirst().allSatisfy(\.isNumber),
            (8...15).contains(trimmed.dropFirst().count), trimmed.dropFirst().first != "0"
        else { return SettingsCopy.phoneFormat }
        return nil
    }
}

nonisolated struct ServerFormDraft: Equatable, Sendable {
    var text: String

    var configuration: ServerConfiguration? { ServerConfiguration(text: text) }
    var validationError: String? { configuration == nil ? SettingsCopy.serverURLInvalid : nil }
}

// MARK: - Rows

/// A `Form` row that shows a saved value on its trailing edge and pushes a page.
struct SettingsLinkRow<Value: Hashable>: View {
    let title: String
    var detail: String?
    let value: Value

    var body: some View {
        NavigationLink(value: value) {
            HStack {
                Text(title).adlerText(.body).foregroundStyle(Color.ink)
                Spacer(minLength: Space.s)
                if let detail {
                    Text(detail)
                        .adlerText(.subhead)
                        .foregroundStyle(Color.inkMuted)
                        .lineLimit(1)
                        .truncationMode(.middle)
                }
            }
        }
    }
}

/// The inline receipt a save leaves behind — never a toast (DESIGN.md §5.10).
struct SettingsReceipt: View {
    let text: String

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: Space.xs) {
            Image(systemName: "checkmark.circle").font(.caption)
            Text(text).adlerText(.footnote).fixedSize(horizontal: false, vertical: true)
        }
        .foregroundStyle(Color.accentInk)
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

/// A server refusal, kept beside the control that caused it, with the input retained.
struct SettingsError: View {
    let text: String

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: Space.xs) {
            Image(systemName: "exclamationmark.triangle").font(.caption)
            Text(text).adlerText(.footnote).fixedSize(horizontal: false, vertical: true)
        }
        .foregroundStyle(Color.warning)
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

/// The consequence footnote every toggle and section carries.
struct SettingsHint: View {
    let text: String

    var body: some View {
        Text(text)
            .adlerText(.footnote)
            .foregroundStyle(Color.inkMuted)
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}

// MARK: - Weekdays

nonisolated enum SettingsWeekday {
    /// `0` is Sunday, as the program stores it.
    static let names = [
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
    ]
    static let short = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    /// Monday first, the order the program is read in.
    static let order = [1, 2, 3, 4, 5, 6, 0]

    static func name(_ index: Int) -> String { names[((index % 7) + 7) % 7] }
}
