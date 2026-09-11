import XCTest

@testable import Adler

/// Settings form validation, the pairing instruction, and the two places where the app must not
/// say more than the payload does (a server key reports `testedAt: null`; a key is never read
/// back).
nonisolated final class SettingsFormTests: XCTestCase {
    private func settings() throws -> SettingsView {
        try Fixtures.load(SettingsView.self, "settings").response
    }

    // MARK: Provider

    func testProviderDraftStartsFromTheSavedSelection() throws {
        let status = try settings().provider
        let draft = ProviderFormDraft.from(status)
        XCTAssertEqual(draft.provider, status.selected.provider)
        XCTAssertEqual(draft.model, status.selected.model)
        XCTAssertEqual(draft.useServer, status.selected.useServer)
        XCTAssertTrue(draft.key.isEmpty, "a saved key is never returned, so it is never prefilled")
        XCTAssertNil(draft.keyToSend)
    }

    func testProviderRequiresAModel() {
        var draft = ProviderFormDraft(provider: "gemini", model: "", useServer: true)
        XCTAssertEqual(draft.validationError, SettingsCopy.modelRequired)
        draft.model = "   "
        XCTAssertEqual(draft.validationError, SettingsCopy.modelRequired)
        draft.model = "gemini-3.8-flash"
        XCTAssertNil(draft.validationError)
    }

    func testAPersonalKeyIsOnlyRequiredForTheFirstSave() {
        var draft = ProviderFormDraft(provider: "openai", model: "gpt-5.6-luna", useServer: false)
        XCTAssertEqual(draft.keyError(personalConfigured: false), SettingsCopy.keyRequired)
        XCTAssertNil(draft.keyError(personalConfigured: true))

        draft.key = "  fictional-test-key  "
        XCTAssertNil(draft.keyError(personalConfigured: false))
        XCTAssertEqual(draft.keyToSend, "fictional-test-key")

        draft.useServer = true
        draft.key = ""
        XCTAssertNil(draft.keyError(personalConfigured: false))
    }

    func testTheServerKeyOptionDependsOnBothFlags() throws {
        let view = try settings()
        XCTAssertTrue(view.status.serverKeysAllowed)
        let gemini = try XCTUnwrap(view.provider.providers.first { $0.provider == "gemini" })
        let openai = try XCTUnwrap(view.provider.providers.first { $0.provider == "openai" })
        XCTAssertTrue(gemini.serverAvailable)
        XCTAssertFalse(openai.serverAvailable, "the option is hidden for a provider with no server key")
    }

    func testAServerKeyReportsNoTestedAt() throws {
        // `POST /api/provider/test` does not persist `testedAt` for a server key, so Settings
        // must read the in-memory result instead of claiming the account was never tested.
        let view = try settings()
        XCTAssertTrue(view.provider.selected.useServer)
        XCTAssertTrue(view.provider.providers.allSatisfy { $0.testedAt == nil })
    }

    @MainActor
    func testProviderDisplayNames() {
        XCTAssertEqual(ProviderSettingsView.displayName("gemini"), "Google Gemini")
        XCTAssertEqual(ProviderSettingsView.displayName("openai"), "OpenAI GPT")
        XCTAssertEqual(ProviderSettingsView.displayName("anthropic"), "Anthropic Claude")
        XCTAssertEqual(ProviderSettingsView.displayName("mystery"), "mystery")
    }

    // MARK: Program

    func testProgramDraftRequiresAReason() throws {
        var draft = ProgramFormDraft.from(try settings().program)
        XCTAssertEqual(draft.validationError, SettingsCopy.reasonRequired)
        draft.reason = "   \n "
        XCTAssertEqual(draft.validationError, SettingsCopy.reasonRequired)
        draft.reason = "Moved my sessions to the morning."
        XCTAssertNil(draft.validationError)
    }

    func testProgramDraftRejectsAnImpossibleSchedule() throws {
        var draft = ProgramFormDraft.from(try settings().program)
        draft.reason = "Testing validation."

        draft.workEnd = "08:00"
        XCTAssertNotNil(draft.validationError)

        draft = ProgramFormDraft.from(try settings().program)
        draft.reason = "Testing validation."
        draft.workDays = []
        XCTAssertNotNil(draft.validationError)

        draft = ProgramFormDraft.from(try settings().program)
        draft.reason = "Testing validation."
        draft.weeklyMinutes = 10
        draft.sessionMinutes = 25
        XCTAssertNotNil(draft.validationError)
    }

    func testProgramDraftMirrorsTheSavedProgram() throws {
        let program = try settings().program
        let draft = ProgramFormDraft.from(program)
        XCTAssertEqual(draft.weeklyMinutes, program.weeklyMinutes)
        XCTAssertEqual(draft.workDays, program.workDays.sorted())
        XCTAssertEqual(draft.enabledMethods, program.enabledMethods)
        XCTAssertEqual(draft.reviewDay, program.reviewDay)
        XCTAssertTrue(draft.reason.isEmpty, "a revision reason is never prefilled")
    }

    func testTheSevenMethodsAreNamedAndCarryTheirLimit() throws {
        let methods = try settings().methods
        XCTAssertEqual(methods.count, 7)
        XCTAssertTrue(methods.allSatisfy { !$0.name.isEmpty && !$0.limit.isEmpty })
    }

    // MARK: Tokens

    func testTokenNameIsRequiredAndTheLabelFollowsTheExpiry() {
        var draft = TokenFormDraft()
        XCTAssertEqual(draft.validationError, SettingsCopy.tokenNameRequired)
        XCTAssertEqual(draft.buttonTitle, SettingsCopy.connectionsCreate30Day)

        draft.name = "Claude Desktop"
        XCTAssertNil(draft.validationError)
        XCTAssertEqual(draft.scope, .mcp)

        draft.days = 7
        XCTAssertEqual(draft.buttonTitle, SettingsCopy.createToken)
    }

    // MARK: Pairing

    func testPhoneNumberValidation() {
        var draft = PairingFormDraft()
        XCTAssertNotNil(draft.validationError)
        draft.address = "4165550123"
        XCTAssertEqual(draft.validationError, SettingsCopy.phoneFormat)
        draft.address = "+0165550123"
        XCTAssertEqual(draft.validationError, SettingsCopy.phoneFormat)
        draft.address = "+14165550123"
        XCTAssertNil(draft.validationError)
        draft.address = "  +14165550123  "
        XCTAssertNil(draft.validationError)
    }

    /// The text the person must send is the server's `send` field, not something the app builds.
    func testPairingInstructionAndTheExactLinkText() throws {
        let json = """
            {"code":"9F2C41AB7D30","send":"LINK 9F2C41AB7D30","to":"+15550000000",
             "expires":1789999999000}
            """
        let response = try JSONDecoder().decode(PairResponse.self, from: Data(json.utf8))
        XCTAssertEqual(response.send, "LINK \(response.code)")
        XCTAssertEqual(
            SettingsCopy.connectionsCodeInstruction(
                from: "+14165550123", to: response.to ?? ""),
            "From +14165550123, text this to +15550000000 within 10 minutes:")
        XCTAssertEqual(
            response.expiresAt.timeIntervalSince1970, 1_789_999_999, accuracy: 0.001)
    }

    func testConnectionsFixtureIsNotConfiguredSoPairingStaysDisabled() throws {
        let connections = try settings().connections
        XCTAssertFalse(connections.configured)
        XCTAssertNil(connections.link)
        XCTAssertTrue(connections.jobs.isEmpty)
    }

    func testAnOptedOutLinkIsReadFromTheSnakeCaseField() throws {
        let json = """
            {"address":"+14165550123","opted_out":1,"last_inbound":1789000000000}
            """
        let link = try JSONDecoder().decode(ConnectionLink.self, from: Data(json.utf8))
        XCTAssertTrue(link.isOptedOut)
        XCTAssertEqual(SettingsCopy.connectionsLinked(link.address), "Linked: +14165550123")
    }

    // MARK: Server

    func testServerDraftAcceptsABareHostAndRejectsNonsense() {
        XCTAssertEqual(
            ServerFormDraft(text: "192.168.1.24:8080").configuration?.baseURL.absoluteString,
            "http://192.168.1.24:8080")
        XCTAssertEqual(
            ServerFormDraft(text: "http://localhost:8080/").configuration?.baseURL.absoluteString,
            "http://localhost:8080")
        XCTAssertEqual(
            ServerFormDraft(text: "ftp://example.com").validationError,
            SettingsCopy.serverURLInvalid)
        XCTAssertEqual(ServerFormDraft(text: "").validationError, SettingsCopy.serverURLInvalid)
    }

    func testLocalNetworkAddressesAreRecognised() {
        XCTAssertTrue(ServerFormDraft(text: "http://localhost:8080").configuration!.isLocalNetwork)
        XCTAssertTrue(ServerFormDraft(text: "10.0.0.24:8080").configuration!.isLocalNetwork)
        XCTAssertFalse(ServerFormDraft(text: "https://example.com").configuration!.isLocalNetwork)
    }

    // MARK: Appearance and times

    func testSystemAppearanceWritesNothingToTheWorkspace() {
        XCTAssertNil(AppearancePreference.system.serverTheme)
        XCTAssertNil(AppearancePreference.system.colorScheme)
        XCTAssertEqual(AppearancePreference.light.serverTheme, .light)
        XCTAssertEqual(AppearancePreference.dark.serverTheme, .dark)
        XCTAssertEqual(AppearancePreference.from(.dark), .dark)
    }

    @MainActor
    func testAppearanceStorePersists() throws {
        let suite = try XCTUnwrap(UserDefaults(suiteName: "adler.tests.appearance"))
        suite.removePersistentDomain(forName: "adler.tests.appearance")
        let store = AppearanceStore(defaults: suite)
        XCTAssertEqual(store.preference, .system)
        store.preference = .dark
        XCTAssertEqual(AppearanceStore(defaults: suite).preference, .dark)
        suite.removePersistentDomain(forName: "adler.tests.appearance")
    }

    func testTimeOfDayRoundTrips() {
        for text in ["00:00", "07:30", "19:00", "23:59"] {
            XCTAssertEqual(SettingsTime.text(SettingsTime.date(text)), text)
        }
    }

    func testAutomationFixtureValues() throws {
        let automation = try settings().preferences.automation
        XCTAssertFalse(automation.enabled)
        XCTAssertEqual(automation.checkInMode, .afterSession)
        XCTAssertEqual(SettingsTime.text(SettingsTime.date(automation.quietStart)), "21:00")
    }

    func testWeekdayNamesMatchTheProgramEncoding() {
        XCTAssertEqual(SettingsWeekday.name(0), "Sunday")
        XCTAssertEqual(SettingsWeekday.name(1), "Monday")
        XCTAssertEqual(SettingsWeekday.order, [1, 2, 3, 4, 5, 6, 0])
        XCTAssertEqual(SettingsWeekday.order.map(SettingsWeekday.name).last, "Sunday")
        XCTAssertNotNil(Weekday(rawValue: "Sunday"))
    }
}
