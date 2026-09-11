import SwiftUI

// MARK: - Chip shapes

/// Two independent chip families that must never merge into one badge
/// (DESIGN.md §4.7). A workflow chip alone never implies evidence; an
/// evidence chip alone never implies the test is running.
///
/// Both print the server's string verbatim. The client maps nothing.

/// Workflow state — the server's `learningStatus` value.
/// Filled `surfaceSunken`, `caption`, radius 8.
struct WorkflowChip: View {
    /// Server string, printed verbatim: `Suggested` · `Live experiment` ·
    /// `Starting soon` · `Ready to review` · `Reviewed` · `Paused` ·
    /// `Finished` · `Declined` · `Needs another look`.
    let label: String
    /// `state == .reconsider` from the server. Deciding emphasis by matching the label's
    /// *words* means one edit to the server's copy silently removes the warning triangle,
    /// with no compile error anywhere. `nil` falls back to the old string match so callers
    /// that have not adopted it yet keep their current behaviour.
    var isAttention: Bool?

    /// The one state that also carries a warning symbol.
    private var needsAttention: Bool { isAttention ?? (label == "Needs another look") }

    var body: some View {
        ChipBody(
            label: label,
            symbol: needsAttention ? "exclamationmark.triangle" : nil,
            symbolColor: .warning,
            foreground: .ink,
            fill: .surfaceSunken,
            border: nil
        )
        .accessibilityLabel(needsAttention ? "\(label). Needs attention." : label)
    }
}

/// Evidence standing — the server's `learningStanding` value.
/// Outlined 1pt `separator`, `caption`, `inkMuted`, radius 8.
/// VoiceOver reads it with an `Evidence: ` prefix so the two families stay
/// distinguishable without sight.
struct EvidenceChip: View {
    /// Server string, printed verbatim: `Waiting to learn` ·
    /// `More context needed` · `Consistent so far` · `Mixed observations` ·
    /// `Not supported in this context` · `Evidence has changed`.
    let label: String
    /// `standing == .reconsider` from the server — see `WorkflowChip.isAttention`.
    var hasChanged: Bool?

    private var changed: Bool { hasChanged ?? (label == "Evidence has changed") }

    var body: some View {
        ChipBody(
            label: label,
            symbol: changed ? "exclamationmark.triangle" : nil,
            symbolColor: .warning,
            foreground: .inkMuted,
            fill: .clear,
            border: .separator
        )
        .accessibilityLabel("Evidence: \(label)")
    }
}

/// Single-purpose chips: goal status (`Draft` · `Active` · `Paused` ·
/// `Completed` · `Set aside`), priority (`Focus`), data quality (`Stale` ·
/// `No measure` · `Unknown`), proposal state (`Proposed change` ·
/// `Approved 13 Oct` · `Dismissed`), and `Retired`.
struct AdlerChip: View {
    /// `nonisolated` so value-level tests and `nonisolated` content structs can compare it —
    /// the target defaults to MainActor isolation, which otherwise isolates its `Equatable`
    /// conformance to the main actor.
    nonisolated enum Emphasis: Sendable, Equatable {
        /// Filled `surfaceSunken` — a state the person acted on.
        case filled
        /// Outlined — a quieter qualifier.
        case outlined
        /// Outlined in `warning` with a triangle — stale or missing data.
        case attention
    }

    let label: String
    var emphasis: Emphasis = .outlined
    var symbol: String?

    var body: some View {
        ChipBody(
            label: label,
            symbol: emphasis == .attention ? (symbol ?? "exclamationmark.triangle") : symbol,
            symbolColor: emphasis == .attention ? .warning : .inkMuted,
            foreground: emphasis == .filled ? .ink : .inkMuted,
            fill: emphasis == .filled ? .surfaceSunken : .clear,
            border: emphasis == .filled ? nil : (emphasis == .attention ? .warning : .separator)
        )
    }
}

private struct ChipBody: View {
    let label: String
    let symbol: String?
    let symbolColor: Color
    let foreground: Color
    let fill: Color
    let border: Color?

    var body: some View {
        HStack(spacing: Space.xs) {
            if let symbol {
                Image(systemName: symbol)
                    .font(.caption2)
                    .foregroundStyle(symbolColor)
            }
            Text(label)
                .adlerText(.caption)
                .foregroundStyle(foreground)
        }
        .padding(.horizontal, Space.s)
        .padding(.vertical, Space.xs + 1)
        .background(fill, in: .rect(cornerRadius: Radii.chip))
        .overlay {
            if let border {
                RoundedRectangle(cornerRadius: Radii.chip)
                    .strokeBorder(border, lineWidth: 1)
            }
        }
        .accessibilityElement(children: .combine)
    }
}

// MARK: - The pair

/// Workflow state and evidence standing on one line, workflow first, 8pt
/// apart — never combined into a sentence. Stacks above `.accessibility1`.
struct StatusChipPair: View {
    let workflow: String?
    let standing: String?
    /// Server values, so neither chip has to match its own label — see `WorkflowChip`.
    var workflowIsAttention: Bool?
    var standingHasChanged: Bool?
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    var body: some View {
        let layout = dynamicTypeSize.prefersStackedControls
            ? AnyLayout(VStackLayout(alignment: .leading, spacing: Space.xs))
            : AnyLayout(HStackLayout(alignment: .center, spacing: Space.s))

        layout {
            if let workflow { WorkflowChip(label: workflow, isAttention: workflowIsAttention) }
            if let standing { EvidenceChip(label: standing, hasChanged: standingHasChanged) }
        }
    }
}

/// Fictional design data.
#Preview("Status chips") {
    ScrollView {
        VStack(alignment: .leading, spacing: Space.l) {
            Text("Workflow state").adlerText(.eyebrow).foregroundStyle(Color.inkMuted)
            ForEach(["Suggested", "Live experiment", "Ready to review", "Paused", "Needs another look"], id: \.self) {
                WorkflowChip(label: $0)
            }
            Text("Evidence standing").adlerText(.eyebrow).foregroundStyle(Color.inkMuted)
            ForEach(["Waiting to learn", "Consistent so far", "Mixed observations", "Evidence has changed"], id: \.self) {
                EvidenceChip(label: $0)
            }
            Text("Both, never merged").adlerText(.eyebrow).foregroundStyle(Color.inkMuted)
            StatusChipPair(workflow: "Live experiment", standing: "Consistent so far")
            StatusChipPair(workflow: "Needs another look", standing: "Evidence has changed")
            Text("Single purpose").adlerText(.eyebrow).foregroundStyle(Color.inkMuted)
            HStack(spacing: Space.s) {
                AdlerChip(label: "Focus", emphasis: .filled)
                AdlerChip(label: "Active")
                AdlerChip(label: "Stale", emphasis: .attention)
                AdlerChip(label: "Approved 13 Oct", emphasis: .filled, symbol: "checkmark")
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(AdlerLayout.screenMargin)
    }
    .background(Color.canvas)
}
