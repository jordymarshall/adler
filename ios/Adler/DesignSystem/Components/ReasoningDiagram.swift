import SwiftUI

/// The relationship between what Adler saw and what it suggests — *not* six
/// equal boxes (DESIGN.md §4.6).
///
/// Emphasis is the message: two quiet parallel inputs, one prominent working
/// explanation, the action with its controls, then dated feedback in the
/// quietest weight. Connectors are 1pt `separator` lines, never arrows as
/// decoration. The diagram never says or implies "therefore" or "caused".
///
/// Under Reduce Motion or at accessibility sizes it becomes the same four
/// blocks stacked with their `eyebrow` labels and no connectors.
struct ReasoningDiagram: View {
    let content: ReasoningDiagramContent
    /// The action's own control, when the diagram is shown beside a pending
    /// decision. Omitted inside the evidence sheet of a settled record.
    var controlTitle: String?
    var onControl: (() -> Void)?

    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @Environment(\.adlerMotion) private var motion

    private var stacked: Bool {
        dynamicTypeSize.prefersStackedControls || motion.reduceMotion
    }

    var body: some View {
        VStack(alignment: .leading, spacing: Space.s) {
            inputs
            if !stacked { Connector() }
            explanation
            if !stacked { Connector() }
            actionRow
            if !stacked { Connector() }
            feedback
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Inputs, then working explanation, then the action, then later feedback.")
    }

    @ViewBuilder
    private var inputs: some View {
        let layout = stacked
            ? AnyLayout(VStackLayout(alignment: .leading, spacing: Space.s))
            : AnyLayout(HStackLayout(alignment: .top, spacing: Space.s))

        layout {
            InputChip(title: "YOUR REPORTS", value: content.reports)
            InputChip(title: "RESEARCH", value: content.research)
        }
    }

    private var explanation: some View {
        HStack(alignment: .top, spacing: Space.m) {
            RoundedRectangle(cornerRadius: 1.5)
                .fill(content.goalColor?.color ?? Color.accentGreen)
                .frame(width: AdlerLayout.goalRuleWidth)
            VStack(alignment: .leading, spacing: Space.xs) {
                Text("WORKING EXPLANATION")
                    .adlerText(.eyebrow)
                    .foregroundStyle(Color.inkMuted)
                Text(content.explanation)
                    .adlerText(.title3)
                    .foregroundStyle(Color.inkHeading)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(Space.m)
        .frame(maxWidth: .infinity, alignment: .leading)
        .adlerCard(.flat)
    }

    @ViewBuilder
    private var actionRow: some View {
        let layout = stacked
            ? AnyLayout(VStackLayout(alignment: .leading, spacing: Space.s))
            : AnyLayout(HStackLayout(alignment: .center, spacing: Space.m))

        layout {
            Text(content.action)
                .adlerText(.callout)
                .foregroundStyle(Color.ink)
                .padding(.horizontal, Space.m)
                .padding(.vertical, Space.s)
                .background(Color.surfaceSunken, in: .rect(cornerRadius: Radii.chip))
                .fixedSize(horizontal: false, vertical: true)
            if let controlTitle, let onControl {
                AdlerPrimaryButton(title: controlTitle, action: onControl)
            }
        }
    }

    private var feedback: some View {
        VStack(alignment: .leading, spacing: Space.xxs) {
            Text("LATER FEEDBACK")
                .adlerText(.eyebrow)
                .foregroundStyle(Color.inkMuted)
            Text(content.laterFeedback ?? "No feedback reported yet.")
                .adlerText(.footnote, numeric: true)
                .foregroundStyle(Color.inkMuted)
        }
    }
}

private struct InputChip: View {
    let title: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: Space.xxs) {
            Text(title)
                .adlerText(.eyebrow)
                .foregroundStyle(Color.inkMuted)
            Text(value)
                .adlerText(.caption, numeric: true)
                .foregroundStyle(Color.inkMuted)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(Space.s)
        .background(Color.surfaceSunken, in: .rect(cornerRadius: Radii.chip))
        .accessibilityElement(children: .combine)
    }
}

/// A 1pt `separator` stem — a connector, not an arrow.
private struct Connector: View {
    var body: some View {
        Rectangle()
            .fill(Color.separator)
            .frame(width: 1, height: 14)
            .padding(.leading, Space.xl)
            .accessibilityHidden(true)
    }
}

nonisolated struct ReasoningDiagramContent: Equatable, Sendable {
    /// Dates of the reports that fed the explanation, e.g. `1 Oct · 10 Oct`.
    let reports: String
    /// The principle or method reference, e.g. `P7 · Situation modification`.
    let research: String
    /// `reasoning.mechanism` — saved prose, printed verbatim.
    let explanation: String
    /// `recommendation.action` — saved prose, printed verbatim.
    let action: String
    /// Dated feedback so far, e.g. `13 Oct · 15 Oct · review 25 Oct`.
    /// `nil` when nothing has been reported — never an invented date.
    var laterFeedback: String?
    var goalColor: GoalColor?
}

/// Fictional design data.
#Preview("Reasoning diagram") {
    ScrollView {
        ReasoningDiagram(
            content: ReasoningDiagramContent(
                reports: "1 Oct · 10 Oct",
                research: "P7 · Situation modification",
                explanation: "Changing the setup may reduce the pull to check the phone during a writing session.",
                action: "Leave the phone in the kitchen",
                laterFeedback: "13 Oct · 15 Oct · review 25 Oct",
                goalColor: GoalColor(hue: 142, saturation: 45)
            ),
            controlTitle: "Try this",
            onControl: {}
        )
        .padding(AdlerLayout.screenMargin)
    }
    .background(Color.canvas)
}

/// Fictional design data.
#Preview("Reasoning diagram — no feedback yet") {
    ReasoningDiagram(
        content: ReasoningDiagramContent(
            reports: "3 Oct",
            research: "P2 · Implementation intentions",
            explanation: "Naming when and where the work happens may reduce the decision cost at the moment it starts.",
            action: "Write at 8:30 at the kitchen table",
            laterFeedback: nil,
            goalColor: GoalColor(hue: 28, saturation: 52)
        )
    )
    .padding(AdlerLayout.screenMargin)
    .background(Color.canvas)
}
