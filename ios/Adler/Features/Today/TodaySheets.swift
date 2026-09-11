import SwiftUI

// The three decision sheets Today raises (DESIGN.md §2.3). Each owns its own state; the shell
// owns only the Settings sheet.

// MARK: - Report

/// The only place an outcome is recorded (FLOWS.md §2 steps 5–9).
///
/// An omitted amount stays **unknown** all the way to the wire — `ChangeBuilder` drops it from
/// `values` rather than sending `0`. A correction is a second report with a new `requestId`;
/// the server appends to `action.history`, so the earlier value stays visible.
struct TodayReportSheet: View {
    let action: ActionView
    /// `true` when the action already carries a saved report: the sheet opens pre-filled as a
    /// correction and writes through `correctAction`.
    let isCorrection: Bool
    let dates: TodayDates
    let onDismiss: () -> Void

    @Environment(WorkspaceStore.self) private var workspace
    @State private var errorMessage: String?
    @State private var saving = false

    var body: some View {
        ReportSheet(
            actionTitle: title,
            plannedDate: dates.date(action.date ?? dates.today) ?? dates.todayDate,
            unit: unit,
            asksMinutes: action.durationMinutes > 0,
            receipt: isCorrection ? reportReceipt(for: action, dates: dates) : nil,
            errorMessage: errorMessage,
            onSave: { draft in Task { await save(draft) } },
            onCancel: onDismiss
        )
        .disabled(saving)
    }

    private var title: String {
        guard let date = dates.short(action.date ?? dates.today) else { return action.title }
        return "\(action.title) · \(date)"
    }

    /// Only when the plan defines an input measure. `completion` has nothing to count.
    private var unit: String? {
        switch action.measure.metric {
        case .amount, .hours: action.measure.unit
        case .completion, .unknown: nil
        }
    }

    private func save(_ draft: ReportDraft) async {
        guard let outcome = draft.outcome.flatMap({ Outcome(rawValue: $0.rawValue) }) else {
            return
        }
        saving = true
        defer { saving = false }
        errorMessage = nil
        let note = draft.note.trimmingCharacters(in: .whitespacesAndNewlines)
        do {
            if isCorrection {
                try await workspace.correctAction(
                    id: action.id, goalId: action.goalId, outcome: outcome,
                    amount: draft.amount, minutes: draft.minutes.map(Double.init),
                    note: note.isEmpty ? nil : note)
            } else {
                try await workspace.reportAction(
                    id: action.id, goalId: action.goalId, outcome: outcome,
                    amount: draft.amount, minutes: draft.minutes.map(Double.init),
                    note: note.isEmpty ? nil : note)
            }
            onDismiss()
        } catch {
            // The server's refusals are product copy; they are shown as written.
            errorMessage = error.serverMessage ?? error.errorDescription
        }
    }
}

// MARK: - Choose something else

/// Today's actions come from the server's next-step selection. This sheet is how a person
/// overrides it: any active or draft goal, plus a route to start a new one.
struct ChooseActionSheet: View {
    let goals: [GoalRef]
    let onOpenGoal: (String) -> Void
    let onNewGoal: () -> Void
    let onClose: () -> Void

    private var choosable: [GoalRef] {
        goals.filter { $0.status == .active || $0.status == .draft }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Space.s) {
                    if choosable.isEmpty {
                        EmptyStateView(
                            title: EmptyStateCopy.noGoals.title,
                            message: EmptyStateCopy.noGoals.body)
                    }
                    ForEach(choosable) { goal in
                        Button {
                            onOpenGoal(goal.id)
                        } label: {
                            HStack(spacing: Space.m) {
                                GoalRule(color: GoalColor.parse(goal.color)).frame(height: 24)
                                Text(goal.title)
                                    .adlerText(.subhead)
                                    .foregroundStyle(Color.ink)
                                    .multilineTextAlignment(.leading)
                                Spacer(minLength: Space.s)
                                Text(goal.status == .draft ? "Plan" : "View")
                                    .adlerText(.caption)
                                    .foregroundStyle(Color.inkMuted)
                                Image(systemName: "arrow.up.right")
                                    .font(.caption2)
                                    .foregroundStyle(Color.inkMuted)
                            }
                            .frame(minHeight: AdlerLayout.minimumHitTarget)
                            .contentShape(.rect)
                        }
                        .buttonStyle(.plain)
                        Divider().overlay(Color.separator)
                    }
                    AdlerSecondaryButton(title: "Start a new goal", action: onNewGoal)
                        .padding(.top, Space.s)
                }
                .padding(AdlerLayout.screenMargin)
            }
            .background(Color.canvas)
            .navigationTitle("Choose something else")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close", action: onClose)
                }
            }
        }
    }
}

// MARK: - Add a result

/// Recording an outcome (FLOWS.md §5 step 5). Completing actions never writes a result — this
/// sheet and milestone verification are the only two ways one is saved.
struct AddResultSheet: View {
    let row: GoalProgressRow
    let today: YMD
    let timeZone: TimeZone
    let onClose: () -> Void

    @Environment(WorkspaceStore.self) private var workspace
    @State private var valueText = ""
    @State private var date = Date()
    @State private var errorMessage: String?
    @State private var saving = false

    private var value: Double? {
        Double(valueText.replacingOccurrences(of: ",", with: "."))
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: AdlerLayout.sectionGap) {
                    if let errorMessage {
                        ErrorBanner(kind: .server(detail: errorMessage), action: { save() })
                    }

                    VStack(alignment: .leading, spacing: Space.xs) {
                        Text(row.goal.title)
                            .adlerText(.headline)
                            .foregroundStyle(Color.inkHeading)
                        Text(row.label)
                            .adlerText(.footnote)
                            .foregroundStyle(Color.inkMuted)
                    }

                    VStack(alignment: .leading, spacing: Space.xs) {
                        Text("Result (\(row.unit))")
                            .adlerText(.subhead)
                            .foregroundStyle(Color.ink)
                        TextField("", text: $valueText)
                            .keyboardType(.decimalPad)
                            .adlerText(.body, numeric: true)
                            .padding(Space.s)
                            .background(Color.surface, in: .rect(cornerRadius: Radii.control))
                            .overlay {
                                RoundedRectangle(cornerRadius: Radii.control)
                                    .strokeBorder(Color.separator, lineWidth: 1)
                            }
                            .accessibilityLabel("Result")
                            .accessibilityValue(
                                valueText.isEmpty ? "not entered" : "\(valueText) \(row.unit)")
                    }

                    DatePicker(
                        "Date of this result", selection: $date, displayedComponents: .date
                    )
                    .datePickerStyle(.compact)
                    .adlerText(.subhead)

                    Text("A result is dated. It records what was true on that day, not today.")
                        .adlerText(.footnote)
                        .foregroundStyle(Color.inkMuted)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .padding(AdlerLayout.screenMargin)
            }
            .background(Color.canvas)
            .navigationTitle("Add a result")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel", action: onClose)
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { save() }
                        .disabled(value == nil || saving)
                }
            }
        }
        .onAppear { date = today.noon(in: timeZone) ?? Date() }
    }

    private func save() {
        guard let value else { return }
        saving = true
        errorMessage = nil
        Task {
            defer { saving = false }
            do {
                try await workspace.addResult(
                    goalId: row.goal.id, value: value, date: YMD(date, in: timeZone),
                    source: "Reported in the app")
                onClose()
            } catch let error as APIError {
                errorMessage = error.serverMessage ?? error.errorDescription
            }
        }
    }
}
