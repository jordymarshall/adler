import SwiftUI

// Settings › Check-ins (DESIGN.md §5.10, COPY.md §12).
//
// These settings schedule *messages*, which the server sends to a linked phone. The hint saying
// so is always visible, and so is the rule that a missing daily reply is not read as missed work.

struct CheckInsSettingsView: View {
    @Environment(WorkspaceStore.self) private var workspace

    @State private var enabled = false
    @State private var mode: CheckInMode = .afterSession
    @State private var checkInTime = "19:00"
    @State private var reviewTime = "17:00"
    @State private var quietStart = "21:00"
    @State private var quietEnd = "08:00"
    @State private var reviewDay = "Sunday"
    @State private var loaded = false
    @State private var receipt: String?
    @State private var errorMessage: String?
    @State private var isSaving = false

    private var settings: SettingsView? { workspace.settings }

    var body: some View {
        Form {
            Section {
                Toggle(SettingsCopy.checkInsEnable, isOn: $enabled)
            } footer: {
                SettingsHint(text: SettingsCopy.checkInsHint)
            }

            if settings?.connections.configured == false {
                Section { SettingsError(text: SettingsCopy.connectionsNotConfigured) }
            }

            Section {
                Picker(SettingsCopy.checkInsWhen, selection: $mode) {
                    Text(SettingsCopy.checkInsAfterSession).tag(CheckInMode.afterSession)
                    Text(SettingsCopy.checkInsEndOfDay).tag(CheckInMode.endOfDay)
                }
                if mode == .endOfDay {
                    DatePicker(
                        SettingsCopy.checkInsDailyTime,
                        selection: SettingsTime.binding($checkInTime),
                        displayedComponents: .hourAndMinute)
                        .environment(\.timeZone, TimeZone(secondsFromGMT: 0) ?? .gmt)
                }
                Picker(SettingsCopy.programReviewDay, selection: $reviewDay) {
                    ForEach(SettingsWeekday.order, id: \.self) { index in
                        Text(SettingsWeekday.name(index)).tag(SettingsWeekday.name(index))
                    }
                }
                DatePicker(
                    SettingsCopy.checkInsReviewTime(reviewDay),
                    selection: SettingsTime.binding($reviewTime),
                    displayedComponents: .hourAndMinute)
                    .environment(\.timeZone, TimeZone(secondsFromGMT: 0) ?? .gmt)
            }

            Section {
                DatePicker(
                    SettingsCopy.checkInsQuietStart,
                    selection: SettingsTime.binding($quietStart),
                    displayedComponents: .hourAndMinute)
                    .environment(\.timeZone, TimeZone(secondsFromGMT: 0) ?? .gmt)
                DatePicker(
                    SettingsCopy.checkInsQuietEnd,
                    selection: SettingsTime.binding($quietEnd),
                    displayedComponents: .hourAndMinute)
                    .environment(\.timeZone, TimeZone(secondsFromGMT: 0) ?? .gmt)
            }

            Section {
                if let errorMessage { SettingsError(text: errorMessage) }
                if let receipt { SettingsReceipt(text: receipt) }
                Button(SettingsCopy.programSave) { Task { await save() } }
                    .disabled(isSaving || !loaded)
            }

            status
        }
        .scrollContentBackground(.hidden)
        .background(Color.canvas)
        .navigationTitle(SettingsCopy.checkIns)
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await workspace.loadSettings()
            adopt()
        }
    }

    /// The scheduled jobs and delivery attempts the server reports, verbatim.
    @ViewBuilder private var status: some View {
        Section(SettingsCopy.checkInsStatus) {
            let jobs = settings?.connections.jobs ?? []
            let deliveries = settings?.connections.deliveries ?? []
            if jobs.isEmpty && deliveries.isEmpty {
                SettingsHint(text: SettingsCopy.checkInsNoJobs)
            }
            ForEach(jobs) { job in
                VStack(alignment: .leading, spacing: 1) {
                    Text("\(job.kind) · \(job.status)")
                        .adlerText(.subhead)
                        .foregroundStyle(Color.ink)
                    Text(epoch(job.due))
                        .adlerText(.footnote, numeric: true)
                        .foregroundStyle(Color.inkMuted)
                    if let error = job.error { SettingsError(text: error) }
                }
            }
            ForEach(deliveries) { delivery in
                VStack(alignment: .leading, spacing: 1) {
                    Text(delivery.status).adlerText(.subhead).foregroundStyle(Color.ink)
                    Text(epoch(delivery.at))
                        .adlerText(.footnote, numeric: true)
                        .foregroundStyle(Color.inkMuted)
                    if let error = delivery.error { SettingsError(text: error) }
                }
            }
        }
    }

    private func epoch(_ milliseconds: Double) -> String {
        let date = Date(timeIntervalSince1970: milliseconds / 1000)
        let calendar = SettingsTime.calendar(in: workspace.timeZone)
        return "\(AdlerDate.short(date, today: .now, calendar: calendar)) · \(AdlerDate.time(date, calendar: calendar))"
    }

    private func adopt() {
        guard !loaded, let settings else { return }
        let automation = settings.preferences.automation
        enabled = automation.enabled
        mode = automation.checkInMode
        checkInTime = automation.checkInTime
        reviewTime = automation.reviewTime
        quietStart = automation.quietStart
        quietEnd = automation.quietEnd
        reviewDay = settings.program.reviewDay
        loaded = true
    }

    private func save() async {
        guard let settings else { return }
        isSaving = true
        defer { isSaving = false }
        errorMessage = nil
        receipt = nil
        do {
            try await workspace.updatePreferences(
                automation: AutomationView(
                    enabled: enabled, checkInMode: mode, checkInTime: checkInTime,
                    reviewTime: reviewTime, quietStart: quietStart, quietEnd: quietEnd))
            // The review day lives on the coaching program, not on preferences, so it is a
            // separate revision with its own reason.
            if reviewDay != settings.program.reviewDay,
                let day = Weekday(rawValue: reviewDay)
            {
                try await workspace.updateProgram(
                    reason: SettingsCopy.programDefaultReason, reviewDay: day)
            }
            receipt = "Saved \(AdlerDate.time(.now, calendar: SettingsTime.calendar(in: workspace.timeZone)))"
        } catch {
            errorMessage = error.serverMessage ?? error.errorDescription
        }
    }
}
