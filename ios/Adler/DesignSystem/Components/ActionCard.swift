import SwiftUI

/// The one thing to do (DESIGN.md §4.1). Full width on Today 01 Do,
/// compact in Goal detail.
///
/// Truthfulness rules encoded here: the criterion line omits empty parts
/// rather than printing a placeholder; `Started` is a receipt, never a
/// report; a reported action shows its saved receipt and only offers
/// `Correct this report`; a Draft goal offers no report controls at all.
struct ActionCard: View {
    enum Scale {
        /// Today 01 Do.
        case full
        /// Goal detail canvas.
        case compact

        var titleStyle: AdlerTextStyle { self == .full ? .title2 : .headline }
        var padding: CGFloat { self == .full ? AdlerLayout.todayCardPadding : AdlerLayout.cardPadding }
    }

    let model: ActionCardModel
    var scale: Scale = .full
    var onStart: (() -> Void)?
    var onReport: (() -> Void)?
    var onSchedule: (() -> Void)?
    var onChoose: (() -> Void)?

    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    var body: some View {
        HStack(alignment: .top, spacing: Space.m) {
            GoalRule(color: model.goal.color)
            VStack(alignment: .leading, spacing: Space.s) {
                header
                Text(model.title)
                    .adlerText(scale.titleStyle)
                    .foregroundStyle(Color.inkHeading)
                    .lineLimit(2)
                    .truncationMode(.tail)
                if let criterion = model.criterionLine {
                    Text(criterion)
                        .adlerText(.subhead, numeric: true)
                        .foregroundStyle(Color.inkMuted)
                        .fixedSize(horizontal: false, vertical: true)
                }
                controls
                if let receipt = model.receiptLine {
                    Text(receipt)
                        .adlerText(.footnote, numeric: true)
                        .foregroundStyle(Color.inkMuted)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .fixedSize(horizontal: false, vertical: true)
        .padding(scale.padding)
        .adlerCard()
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(model.accessibilityLabel)
        .accessibilityActions {
            if model.showsStart, let onStart { Button("Start", action: onStart) }
            if model.showsReport, let onReport {
                Button(model.reportTitle, action: onReport)
            }
            if model.showsSchedule, let onSchedule { Button("Schedule", action: onSchedule) }
            if let onChoose { Button("Choose something else", action: onChoose) }
        }
    }

    private var header: some View {
        HStack(alignment: .firstTextBaseline) {
            Text(model.goal.title)
                .adlerText(.eyebrow)
                .foregroundStyle(Color.inkMuted)
                .lineLimit(1)
            Spacer(minLength: Space.s)
            if let chip = model.stateChip {
                AdlerChip(label: chip.label, emphasis: .filled, symbol: chip.symbol)
            }
            if onChoose != nil {
                Button {
                    onChoose?()
                } label: {
                    Image(systemName: "ellipsis.circle")
                        .foregroundStyle(Color.inkMuted)
                        .frame(width: AdlerLayout.minimumHitTarget, height: AdlerLayout.minimumHitTarget, alignment: .trailing)
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Choose something else")
            }
        }
        .accessibilityHidden(true)
    }

    @ViewBuilder
    private var controls: some View {
        if model.showsAnyControl {
            let layout = dynamicTypeSize.prefersStackedControls
                ? AnyLayout(VStackLayout(alignment: .leading, spacing: Space.s))
                : AnyLayout(HStackLayout(spacing: Space.s))

            layout {
                if model.showsStart {
                    AdlerPrimaryButton(title: "Start") { onStart?() }
                }
                if model.showsReport {
                    if model.reportIsProminent {
                        AdlerPrimaryButton(title: model.reportTitle) { onReport?() }
                    } else {
                        AdlerSecondaryButton(title: model.reportTitle) { onReport?() }
                    }
                }
                if model.showsSchedule {
                    AdlerQuietButton(title: model.scheduleTitle, systemImage: model.scheduleSymbol) {
                        onSchedule?()
                    }
                }
            }
            .accessibilityHidden(true)
        }
    }
}

// MARK: - Model

nonisolated struct ActionCardModel: Equatable, Sendable {
    let goal: DisplayGoal
    let title: String
    /// What counts as done, e.g. `25 minutes of drafting`.
    var criterion: String?
    /// When it is planned for, e.g. `8:30`.
    var timing: String?
    /// The cue saved with the action, e.g. `Phone in kitchen`.
    var cue: String?
    var state: ActionCardState

    /// `criterion · timing · cue`, with empty parts **omitted** — never a
    /// placeholder.
    var criterionLine: String? {
        var parts = [criterion, timing, cue].compactMap { $0 }
        if case .scheduled(let at) = state {
            parts.append("Booked \(AdlerDate.time(at))")
        }
        let line = parts.filter { !$0.isEmpty }.joined(separator: " · ")
        return line.isEmpty ? nil : line
    }

    var receiptLine: String? {
        switch state {
        case .started(let at): "Started \(AdlerDate.time(at)) · not yet reported"
        case .reported(let receipt): receipt
        case .retired: "Retired · read only"
        default: nil
        }
    }

    var stateChip: (label: String, symbol: String?)? {
        switch state {
        case .reported: ("Reported", "checkmark.circle.fill")
        case .draftGoal: ("Proposed", nil)
        case .restDay: ("Planned day off", nil)
        case .retired: ("Retired", nil)
        case .scheduled: ("Scheduled", "calendar.badge.checkmark")
        default: nil
        }
    }

    var showsStart: Bool {
        switch state {
        case .planned, .scheduled: true
        default: false
        }
    }

    var showsReport: Bool {
        switch state {
        case .planned, .started, .scheduled, .reported: true
        case .draftGoal, .restDay, .retired: false
        }
    }

    var reportIsProminent: Bool {
        if case .started = state { return true }
        return false
    }

    var reportTitle: String {
        if case .reported = state { return "Correct this report" }
        return "Report"
    }

    var showsSchedule: Bool {
        switch state {
        case .planned, .started, .scheduled: true
        case .reported, .draftGoal, .restDay, .retired: false
        }
    }

    var scheduleTitle: String {
        if case .scheduled(let at) = state { return AdlerDate.time(at) }
        return "Schedule"
    }

    var scheduleSymbol: String? {
        if case .scheduled = state { return "calendar.badge.checkmark" }
        return nil
    }

    var showsAnyControl: Bool { showsStart || showsReport || showsSchedule }

    var accessibilityLabel: String {
        var parts = [goal.title, title]
        if let criterion { parts.append(criterion) }
        if let timing { parts.append(timing) }
        if let cue { parts.append(cue) }
        if let receiptLine { parts.append(receiptLine) }
        // The header carrying the chip is `.accessibilityHidden`, so without this a planned
        // rest day was announced with no controls and no explanation — it read as a broken
        // card rather than a planned day off.
        if let chip = stateChip?.label, receiptLine == nil { parts.append(chip) }
        if case .draftGoal = state { parts.append("Draft goal. No report controls until the work is chosen.") }
        return parts.joined(separator: ". ")
    }
}

nonisolated enum ActionCardState: Equatable, Sendable {
    case planned
    case started(at: Date)
    /// The saved receipt line, e.g. `Saved 8:56 · Done · 25 minutes`.
    case reported(receipt: String)
    case scheduled(at: Date)
    /// The goal is a Draft: no report controls, `Choose the work` instead.
    case draftGoal
    case restDay
    case retired
}

// MARK: - Previews

/// Fictional design data.
private let previewGoal = DisplayGoal(id: "g1", title: "Portfolio", hsl: "hsl(142 45% 35%)")

/// Fictional design data.
private func previewModel(_ state: ActionCardState) -> ActionCardModel {
    ActionCardModel(
        goal: previewGoal,
        title: "Write for 25 minutes",
        criterion: "25 minutes of drafting",
        timing: "8:30",
        cue: "Phone in the kitchen",
        state: state
    )
}

/// Fictional design data.
#Preview("Action card — states") {
    ScrollView {
        VStack(spacing: Space.l) {
            ActionCard(model: previewModel(.planned), onStart: {}, onReport: {}, onSchedule: {}, onChoose: {})
            ActionCard(model: previewModel(.started(at: .now)), onStart: {}, onReport: {}, onSchedule: {})
            ActionCard(
                model: previewModel(.reported(receipt: "Saved 8:56 · Done · 25 minutes")),
                onReport: {}
            )
            ActionCard(model: previewModel(.scheduled(at: .now)), onStart: {}, onReport: {}, onSchedule: {})
            ActionCard(
                model: ActionCardModel(goal: previewGoal, title: "Publish a portfolio", state: .draftGoal),
                onChoose: {}
            )
            ActionCard(model: previewModel(.retired))
        }
        .padding(AdlerLayout.screenMargin)
    }
    .background(Color.canvas)
}

/// Fictional design data.
#Preview("Action card — compact") {
    VStack {
        ActionCard(model: previewModel(.planned), scale: .compact, onStart: {}, onReport: {}, onSchedule: {})
    }
    .padding(AdlerLayout.screenMargin)
    .background(Color.canvas)
}
