import SwiftUI

/// The only place an outcome is recorded (DESIGN.md §4.2).
///
/// Rules encoded here:
/// - no default outcome; `Save` stays disabled until one is chosen;
/// - an omitted amount stays **unknown** — it is never sent as `0`;
/// - a report is dated (the action's saved date by default), not "now";
/// - saving shows an inline receipt with `Correct`, and a correction keeps
///   the previous value visible as `Corrected from …`.
struct ReportSheet: View {
    let actionTitle: String
    /// The date being reported — defaults to the action's saved date.
    let plannedDate: Date
    /// The saved unit of the plan's input measure (`minutes`, `pages`).
    /// `nil` when the plan defines no input measure: then no amount field.
    var unit: String?
    /// `true` when the action carries `durationMinutes`.
    var asksMinutes: Bool = false
    /// A receipt from an earlier save; showing it turns the sheet into the
    /// correction flow.
    var receipt: ReportReceipt?
    /// What the fields start on. A correction **must** pass the values behind
    /// `receipt`, or the person retypes a measurement they already recorded.
    /// `nil` means an empty sheet (a first report).
    var initialDraft: ReportDraft?
    var errorMessage: String?
    let onSave: (ReportDraft) -> Void
    var onCancel: () -> Void = {}

    @State private var draft: ReportDraft
    @State private var amountText: String = ""
    @State private var minutesText: String = ""
    @State private var showsDatePicker = false
    @Environment(\.adlerMotion) private var motion

    init(
        actionTitle: String,
        plannedDate: Date,
        unit: String? = nil,
        asksMinutes: Bool = false,
        receipt: ReportReceipt? = nil,
        errorMessage: String? = nil,
        initialDraft: ReportDraft? = nil,
        onSave: @escaping (ReportDraft) -> Void,
        onCancel: @escaping () -> Void = {}
    ) {
        self.actionTitle = actionTitle
        self.plannedDate = plannedDate
        self.unit = unit
        self.asksMinutes = asksMinutes
        self.receipt = receipt
        self.initialDraft = initialDraft
        self.errorMessage = errorMessage
        self.onSave = onSave
        self.onCancel = onCancel
        // A correction reopens on what was saved, including the amount. An
        // explicit `initialDraft` wins; otherwise the receipt's own values are
        // used, so `Correct this report` never presents a measured amount as
        // an empty field.
        let seed = initialDraft ?? receipt?.draft(on: plannedDate)
        _draft = State(initialValue: seed ?? ReportDraft(date: plannedDate))
        _amountText = State(initialValue: seed?.amount.map(Self.numberText) ?? "")
        _minutesText = State(initialValue: seed?.minutes.map(String.init) ?? "")
    }

    /// `25`, not `25.0`; `1.5` keeps its fraction.
    private static func numberText(_ value: Double) -> String {
        value.rounded() == value ? String(Int(value)) : String(value)
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: AdlerLayout.sectionGap) {
                    if let errorMessage {
                        ErrorBanner(kind: .server(detail: errorMessage), action: save)
                    }
                    heading
                    outcomePicker
                    if unit != nil || asksMinutes { amountFields }
                    noteField
                    Text("What you don’t report stays unknown. It is not recorded as zero.")
                        .adlerText(.footnote)
                        .foregroundStyle(Color.inkMuted)
                    if let receipt { receiptView(receipt) }
                }
                .padding(AdlerLayout.screenMargin)
            }
            .background(Color.canvas)
            .navigationTitle(receipt == nil ? "Report" : "Correct your report")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel", action: onCancel)
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save", action: save)
                        .disabled(draft.outcome == nil)
                }
            }
        }
    }

    private var heading: some View {
        VStack(alignment: .leading, spacing: Space.xs) {
            Text(actionTitle)
                .adlerText(.headline)
                .foregroundStyle(Color.inkHeading)
            Button {
                withAnimation(motion.disclosure) { showsDatePicker.toggle() }
            } label: {
                HStack(spacing: Space.xs) {
                    Text("Date reported · \(AdlerDate.short(draft.date))")
                        .adlerText(.footnote, numeric: true)
                    Image(systemName: showsDatePicker ? "chevron.up" : "chevron.down")
                        .font(.caption2)
                }
                .foregroundStyle(Color.inkMuted)
            }
            .buttonStyle(.plain)
            if showsDatePicker {
                DatePicker("Date reported", selection: $draft.date, displayedComponents: .date)
                    .datePickerStyle(.compact)
                    .labelsHidden()
            }
        }
    }

    private var outcomePicker: some View {
        VStack(alignment: .leading, spacing: Space.s) {
            Text("What happened?")
                .adlerText(.eyebrow)
                .foregroundStyle(Color.inkMuted)
            // Exactly three options and no placeholder segment: with a nil
            // selection none is highlighted, which is what "no default
            // outcome" has to look like.
            Picker("Outcome", selection: $draft.outcome) {
                ForEach(ReportOutcome.allCases) { outcome in
                    Text(outcome.rawValue).tag(ReportOutcome?.some(outcome))
                }
            }
            .pickerStyle(.segmented)
            .accessibilityLabel("Outcome")
            if draft.outcome == .partly {
                Text("Record what you did. A partial report is not a failure.")
                    .adlerText(.footnote)
                    .foregroundStyle(Color.inkMuted)
            }
        }
    }

    private var amountFields: some View {
        VStack(alignment: .leading, spacing: Space.m) {
            if let unit {
                VStack(alignment: .leading, spacing: Space.xs) {
                    Text("How much? (\(unit))")
                        .adlerText(.subhead)
                        .foregroundStyle(Color.ink)
                    TextField("", text: $amountText)
                        .keyboardType(.decimalPad)
                        .adlerText(.body, numeric: true)
                        .padding(Space.s)
                        .background(Color.surface, in: .rect(cornerRadius: Radii.control))
                        .overlay {
                            RoundedRectangle(cornerRadius: Radii.control)
                                .strokeBorder(Color.separator, lineWidth: 1)
                        }
                        .accessibilityLabel("Amount")
                        .accessibilityValue(amountText.isEmpty ? "not reported, in \(unit)" : "\(amountText) \(unit)")
                    Text("Leave blank if you don’t know the amount.")
                        .adlerText(.footnote)
                        .foregroundStyle(Color.inkMuted)
                }
            }
            if asksMinutes {
                VStack(alignment: .leading, spacing: Space.xs) {
                    Text("Actual time (minutes, optional)")
                        .adlerText(.subhead)
                        .foregroundStyle(Color.ink)
                    TextField("", text: $minutesText)
                        .keyboardType(.numberPad)
                        .adlerText(.body, numeric: true)
                        .padding(Space.s)
                        .background(Color.surface, in: .rect(cornerRadius: Radii.control))
                        .overlay {
                            RoundedRectangle(cornerRadius: Radii.control)
                                .strokeBorder(Color.separator, lineWidth: 1)
                        }
                        .accessibilityLabel("Actual time in minutes")
                }
            }
        }
    }

    private var noteField: some View {
        VStack(alignment: .leading, spacing: Space.xs) {
            Text("Anything to remember? (optional)")
                .adlerText(.subhead)
                .foregroundStyle(Color.ink)
            TextField("", text: $draft.note, axis: .vertical)
                .lineLimit(3...6)
                .adlerText(.body)
                .padding(Space.s)
                .background(Color.surface, in: .rect(cornerRadius: Radii.control))
                .overlay {
                    RoundedRectangle(cornerRadius: Radii.control)
                        .strokeBorder(Color.separator, lineWidth: 1)
                }
                .accessibilityLabel("Note")
        }
    }

    private func receiptView(_ receipt: ReportReceipt) -> some View {
        VStack(alignment: .leading, spacing: Space.xs) {
            HStack(spacing: Space.s) {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundStyle(Color.accentInk)
                Text(receipt.summary)
                    .adlerText(.footnote, numeric: true)
                    .foregroundStyle(Color.ink)
                Spacer(minLength: Space.s)
            }
            if let correctedFrom = receipt.correctedFrom {
                Text("Corrected from \(correctedFrom)")
                    .adlerText(.footnote, numeric: true)
                    .foregroundStyle(Color.inkMuted)
            }
        }
        .adlerWell()
        .accessibilityElement(children: .combine)
        .accessibilityAddTraits(.updatesFrequently)
    }

    private func save() {
        // An empty field means **unknown**, which the change builder expresses by
        // omitting the key — and an omitted key leaves the saved value untouched
        // server-side (`patch.amount ?? existing.amount` in `server/commands.ts`).
        // So correcting only the note never overwrites a measured amount.
        draft.amount = Double(amountText.replacingOccurrences(of: ",", with: "."))
        draft.minutes = Int(minutesText)
        onSave(draft)
    }
}

// MARK: - Value types

/// Matches `Outcome` in `shared/workspace.ts` exactly — the raw values are
/// sent to the server, so they must not be re-worded.
nonisolated enum ReportOutcome: String, CaseIterable, Identifiable, Sendable {
    case done = "Done"
    case partly = "Partly"
    case missed = "Didn’t happen"

    var id: String { rawValue }
}

/// What the sheet hands back. `amount == nil` means **unknown**, never zero.
nonisolated struct ReportDraft: Equatable, Sendable {
    var outcome: ReportOutcome?
    var amount: Double?
    var minutes: Int?
    var note: String = ""
    var date: Date
}

/// The saved receipt shown after a report, and the source of the
/// `Correct this report` line on ``ActionCard``.
nonisolated struct ReportReceipt: Equatable, Sendable {
    let savedAt: Date
    let outcome: ReportOutcome
    /// Rendered amount with unit, e.g. `25 minutes`. `nil` when no amount was
    /// reported — which is unknown, not zero.
    var amountText: String?
    var correctedFrom: String?
    /// The saved values behind `amountText`, so a correction can reopen on them
    /// rather than on empty fields. `nil` means unknown, never zero.
    var amount: Double?
    var minutes: Int?
    var note: String = ""

    /// The draft `Correct this report` starts from. Never parsed out of
    /// `amountText`: prose is for reading, not for round-tripping.
    func draft(on date: Date) -> ReportDraft {
        ReportDraft(outcome: outcome, amount: amount, minutes: minutes, note: note, date: date)
    }

    /// `Saved 8:56 · Done · 25 minutes`, or
    /// `Saved 8:56 · Done · amount not reported`.
    var summary: String {
        "Saved \(AdlerDate.time(savedAt)) · \(outcome.rawValue) · \(amountText ?? "amount not reported")"
    }
}

/// Fictional design data.
#Preview("Report sheet — empty") {
    ReportSheet(
        actionTitle: "Write for 25 minutes · Tue 13 Oct",
        plannedDate: .now,
        unit: "minutes",
        asksMinutes: false,
        onSave: { _ in }
    )
}

/// Fictional design data.
#Preview("Report sheet — saved receipt") {
    ReportSheet(
        actionTitle: "Write for 25 minutes · Tue 13 Oct",
        plannedDate: .now,
        unit: "pages",
        asksMinutes: true,
        receipt: ReportReceipt(
            savedAt: .now,
            outcome: .done,
            amountText: nil,
            correctedFrom: "Partly · 1 page"
        ),
        onSave: { _ in }
    )
}
