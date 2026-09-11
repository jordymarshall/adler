import SwiftUI

// Settings › Coaching program (DESIGN.md §5.10, COPY.md §12).
//
// Saving writes a **new program version** with the reason given, which is why the reason field is
// required and why the earlier versions stay visible below.

struct ProgramSettingsView: View {
    @Environment(WorkspaceStore.self) private var workspace

    @State private var draft: ProgramFormDraft?
    @State private var receipt: String?
    @State private var errorMessage: String?
    @State private var isSaving = false

    private var settings: SettingsView? { workspace.settings }

    var body: some View {
        Form {
            Section {
                Text(SettingsCopy.programTitle)
                    .adlerText(.title3)
                    .foregroundStyle(Color.inkHeading)
                SettingsHint(text: SettingsCopy.programBody)
            }
            if let draft, let settings {
                form(draft: draft, settings: settings)
            } else if workspace.state(.settings).isLoading {
                Section { SkeletonRow() }
            }
        }
        .scrollContentBackground(.hidden)
        .background(Color.canvas)
        .navigationTitle(SettingsCopy.program)
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await workspace.loadSettings()
            if draft == nil, let program = workspace.settings?.program {
                draft = ProgramFormDraft.from(program)
            }
        }
    }

    @ViewBuilder private func form(draft: ProgramFormDraft, settings: SettingsView) -> some View {
        let binding = Binding(get: { draft }, set: { self.draft = $0 })

        Section {
            Stepper(value: binding.weeklyMinutes, in: 15...3000, step: 15) {
                Text("\(SettingsCopy.programWeeklyMinutes): \(draft.weeklyMinutes)")
                    .adlerText(.body, numeric: true)
                    .foregroundStyle(Color.ink)
            }
            Stepper(value: binding.sessionMinutes, in: 5...240, step: 5) {
                Text("\(SettingsCopy.programSessionMinutes): \(draft.sessionMinutes)")
                    .adlerText(.body, numeric: true)
                    .foregroundStyle(Color.ink)
            }
            DatePicker(
                SettingsCopy.programWorkStart,
                selection: SettingsTime.binding(binding.workStart),
                displayedComponents: .hourAndMinute)
                .environment(\.timeZone, TimeZone(secondsFromGMT: 0) ?? .gmt)
            DatePicker(
                SettingsCopy.programWorkEnd,
                selection: SettingsTime.binding(binding.workEnd),
                displayedComponents: .hourAndMinute)
                .environment(\.timeZone, TimeZone(secondsFromGMT: 0) ?? .gmt)
        } footer: {
            SettingsHint(text: SettingsCopy.programHint)
        }

        Section(SettingsCopy.programWorkDays) {
            ForEach(SettingsWeekday.order, id: \.self) { index in
                Toggle(
                    SettingsWeekday.name(index),
                    isOn: Binding(
                        get: { draft.workDays.contains(index) },
                        set: { isOn in
                            var days = Set(draft.workDays)
                            if isOn { days.insert(index) } else { days.remove(index) }
                            self.draft?.workDays = days.sorted()
                        }))
            }
        }

        Section {
            Picker(SettingsCopy.programReviewDay, selection: binding.reviewDay) {
                ForEach(SettingsWeekday.order, id: \.self) { index in
                    Text(SettingsWeekday.name(index)).tag(SettingsWeekday.name(index))
                }
            }
            Picker(SettingsCopy.programFocusGoal, selection: binding.focusGoalId) {
                Text("—").tag("")
                ForEach(settings.goals) { goal in
                    Text(goal.title).tag(goal.id)
                }
            }
            VStack(alignment: .leading, spacing: Space.xs) {
                Text(SettingsCopy.programApproach)
                    .adlerText(.subhead)
                    .foregroundStyle(Color.inkMuted)
                TextField(SettingsCopy.programApproach, text: binding.approach, axis: .vertical)
                    .lineLimit(2...6)
            }
        }

        Section(SettingsCopy.programMethods) {
            ForEach(settings.methods) { method in
                Toggle(
                    isOn: Binding(
                        get: { draft.enabledMethods.contains(method.id) },
                        set: { isOn in
                            var enabled = Set(draft.enabledMethods)
                            if isOn { enabled.insert(method.id) } else { enabled.remove(method.id) }
                            self.draft?.enabledMethods = settings.methods.map(\.id)
                                .filter(enabled.contains)
                        })
                ) {
                    VStack(alignment: .leading, spacing: 1) {
                        Text(method.name).adlerText(.body).foregroundStyle(Color.ink)
                        // The method's own stated boundary, verbatim.
                        Text(method.limit)
                            .adlerText(.footnote)
                            .foregroundStyle(Color.inkMuted)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
            }
        }

        Section {
            TextField(SettingsCopy.programDefaultReason, text: binding.reason, axis: .vertical)
                .lineLimit(2...5)
            if let problem = draft.validationError, !draft.reason.isEmpty {
                SettingsError(text: problem)
            }
            if let errorMessage { SettingsError(text: errorMessage) }
            if let receipt { SettingsReceipt(text: receipt) }
            Button(SettingsCopy.programSave) { Task { await save() } }
                .disabled(isSaving || draft.validationError != nil)
        } header: {
            Text(SettingsCopy.programReason)
        }

        Section(SettingsCopy.disclosureHistory) {
            ForEach(settings.programs.sorted { $0.version > $1.version }) { entry in
                VStack(alignment: .leading, spacing: 1) {
                    Text("v\(entry.version) · \(entry.date.raw)")
                        .adlerText(.subhead, numeric: true)
                        .foregroundStyle(Color.ink)
                    // The saved reason for that revision, verbatim.
                    Text(entry.reason)
                        .adlerText(.footnote)
                        .foregroundStyle(Color.inkMuted)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
    }

    private func save() async {
        guard let draft, draft.validationError == nil else { return }
        isSaving = true
        defer { isSaving = false }
        errorMessage = nil
        receipt = nil
        do {
            try await workspace.updateProgram(
                reason: draft.reason,
                focusGoalId: draft.focusGoalId.isEmpty ? nil : draft.focusGoalId,
                weeklyMinutes: draft.weeklyMinutes,
                workStart: draft.workStart,
                workEnd: draft.workEnd,
                workDays: draft.workDays,
                sessionMinutes: draft.sessionMinutes,
                reviewDay: Weekday(rawValue: draft.reviewDay),
                enabledMethods: draft.enabledMethods,
                approach: draft.approach)
            if let program = workspace.settings?.program {
                self.draft = ProgramFormDraft.from(program)
                receipt = "Saved as program v\(program.version)."
            }
        } catch {
            errorMessage = error.serverMessage ?? error.errorDescription
        }
    }
}
