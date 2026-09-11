import SwiftUI

/// The canonical decision surface (DESIGN.md §4.3, `coaching-engineering.md`
/// §8). Renders a saved `Recommendation` — **the client never writes any of
/// these sentences.**
///
/// Rules encoded here:
/// - the four controls appear only while a decision is pending;
/// - text labels, never a tick (a tick would ambiguously mean "done");
/// - `Try this` is prominent, the other three are quiet but have the same
///   44pt target, so declining is never harder than agreeing;
/// - `reasoning.limitation` renders **outside** the disclosure, always
///   visible;
/// - an agreed card states that agreeing is not evidence anything happened.
struct RecommendationCard: View {
    let content: RecommendationContent
    var onTryThis: (() -> Void)?
    var onNoThanks: (() -> Void)?
    var onDiscuss: (() -> Void)?
    var onEdit: (() -> Void)?
    var onCorrect: (() -> Void)?
    var onWhyThis: (() -> Void)?

    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    /// The goal rule has to grow with the eyebrow beside it, or it shrinks
    /// to a speck at accessibility sizes.
    @ScaledMetric(relativeTo: .caption2) private var ruleHeight: CGFloat = 14

    var body: some View {
        VStack(alignment: .leading, spacing: Space.m) {
            header
            Text(content.action)
                .adlerText(.title1)
                .foregroundStyle(Color.inkHeading)
                .fixedSize(horizontal: false, vertical: true)
            controls
            Divider().overlay(Color.separator)
            rows
            Divider().overlay(Color.separator)
            if let limitation = content.limitation {
                Text(limitation)
                    .adlerText(.footnote)
                    .foregroundStyle(Color.inkMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            if content.state == .agreed {
                Text("Agreeing to a change is not evidence that it happened or worked.")
                    .adlerText(.footnote)
                    .foregroundStyle(Color.inkMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            if let onWhyThis {
                Button(action: onWhyThis) {
                    HStack(spacing: Space.xs) {
                        Text("Why this?").adlerText(.subhead)
                        Image(systemName: "chevron.down").font(.caption2)
                    }
                    .foregroundStyle(Color.accentInk)
                    .frame(minHeight: AdlerLayout.minimumHitTarget, alignment: .leading)
                    .contentShape(.rect)
                }
                .buttonStyle(.plain)
                .accessibilityHint("Opens the saved rationale, claims and sources")
            }
        }
        .padding(AdlerLayout.cardPadding)
        .adlerCard(.raised)
        .accessibilityElement(children: .contain)
    }

    @ViewBuilder
    private var header: some View {
        if dynamicTypeSize.prefersStackedControls {
            VStack(alignment: .leading, spacing: Space.xs) {
                goalLabel
                WorkflowChip(label: content.stateLabel)
            }
        } else {
            HStack(spacing: Space.s) {
                goalLabel
                Spacer(minLength: Space.s)
                WorkflowChip(label: content.stateLabel)
            }
        }
    }

    private var goalLabel: some View {
        HStack(spacing: Space.s) {
            GoalRule(color: content.goal.color).frame(height: ruleHeight)
            Text(content.goal.title)
                .adlerText(.eyebrow)
                .foregroundStyle(Color.inkMuted)
        }
    }

    @ViewBuilder
    private var controls: some View {
        if content.state == .pending {
            if dynamicTypeSize.prefersStackedControls {
                VStack(alignment: .leading, spacing: Space.xs) { controlButtons }
            } else {
                // One row when the four labels fit; otherwise stacked, so a
                // label never wraps mid-word.
                ViewThatFits(in: .horizontal) {
                    HStack(alignment: .center, spacing: Space.m) { controlButtons }
                    VStack(alignment: .leading, spacing: Space.xs) { controlButtons }
                }
            }
        } else if let onCorrect {
            AdlerQuietButton(title: "Correct this", action: onCorrect)
        }
    }

    @ViewBuilder
    private var controlButtons: some View {
        if let onTryThis { AdlerPrimaryButton(title: "Try this", action: onTryThis) }
        if let onNoThanks { AdlerQuietButton(title: "No thanks", action: onNoThanks) }
        if let onDiscuss { AdlerQuietButton(title: "Discuss", action: onDiscuss) }
        if let onEdit { AdlerQuietButton(title: "Edit", action: onEdit) }
    }

    private var rows: some View {
        VStack(alignment: .leading, spacing: Space.m) {
            LabelledRow(label: "OBSERVATION", text: content.observation)
            LabelledRow(label: "BEHAVIOURAL SCIENCE", text: content.interpretation, chip: content.methodReference)
            LabelledRow(label: "WHAT WE’RE TESTING", text: content.expectedEffect)
        }
    }
}

/// One `eyebrow`-labelled row with a leading 92pt column, stacking above
/// `.accessibility1`.
private struct LabelledRow: View {
    let label: String
    let text: String
    var chip: String?
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    /// The goal rule has to grow with the eyebrow beside it, or it shrinks
    /// to a speck at accessibility sizes.
    @ScaledMetric(relativeTo: .caption2) private var ruleHeight: CGFloat = 14

    var body: some View {
        let layout = dynamicTypeSize.prefersStackedControls
            ? AnyLayout(VStackLayout(alignment: .leading, spacing: Space.xs))
            : AnyLayout(HStackLayout(alignment: .top, spacing: Space.m))

        layout {
            Text(label)
                .adlerText(.eyebrow)
                .foregroundStyle(Color.inkMuted)
                .frame(
                    width: dynamicTypeSize.prefersStackedControls ? nil : AdlerLayout.eyebrowColumn,
                    alignment: .leading
                )
            VStack(alignment: .leading, spacing: Space.xs) {
                Text(text)
                    .adlerText(.callout)
                    .foregroundStyle(Color.ink)
                    .fixedSize(horizontal: false, vertical: true)
                if let chip {
                    HStack(spacing: Space.xs) {
                        Image(systemName: "arrow.turn.down.right")
                            .font(.caption2)
                            .foregroundStyle(Color.inkMuted)
                        AdlerChip(label: chip)
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .accessibilityElement(children: .combine)
    }
}

// MARK: - Value types

nonisolated struct RecommendationContent: Equatable, Sendable {
    let goal: DisplayGoal
    /// `recommendation.action` — verbatim.
    let action: String
    /// `recommendation.observation` — verbatim.
    let observation: String
    /// `recommendation.interpretation` — verbatim.
    let interpretation: String
    /// The saved principle/method reference, e.g. `P7 · Situation modification`.
    var methodReference: String?
    /// `recommendation.expectedEffect` — verbatim.
    let expectedEffect: String
    /// `reasoning.limitation` — verbatim, always visible, never hidden in the
    /// disclosure.
    var limitation: String?
    var state: RecommendationState
    /// The server's workflow label, printed verbatim (`Suggested`,
    /// `Live experiment`, `Declined`, …).
    let stateLabel: String
}

nonisolated enum RecommendationState: String, Sendable {
    /// A decision is open: all four controls show.
    case pending
    /// The person chose `Try this`. No decision buttons, only `Correct this`.
    case agreed
    /// The person chose `No thanks`. No reason was asked for and none is shown.
    case declined
    /// The agreed change has been written into the plan.
    case applied
}

// MARK: - Previews

/// Fictional design data.
private let recommendationPreviewGoal = DisplayGoal(id: "g1", title: "Portfolio", hsl: "hsl(142 45% 35%)")

/// Fictional design data.
private func previewRecommendation(
    _ state: RecommendationState,
    label: String
) -> RecommendationContent {
    RecommendationContent(
        goal: recommendationPreviewGoal,
        action: "Leave your phone in the kitchen before writing.",
        observation: "You had 25 minutes to write on 1 and 10 October and reported spending them on your phone.",
        interpretation: "Situation modification changes what is available at the moment of the decision, rather than relying on resisting it.",
        methodReference: "P7 · Situation modification",
        expectedEffect: "Whether you report fewer interrupted sessions over the next two writing days.",
        limitation: "Two reports support trying this again, not a conclusion about what works for you.",
        state: state,
        stateLabel: label
    )
}

/// Fictional design data.
#Preview("Recommendation — pending") {
    ScrollView {
        RecommendationCard(
            content: previewRecommendation(.pending, label: "Suggested"),
            onTryThis: {}, onNoThanks: {}, onDiscuss: {}, onEdit: {}, onWhyThis: {}
        )
        .padding(AdlerLayout.screenMargin)
    }
    .background(Color.canvas)
}

/// Fictional design data.
#Preview("Recommendation — agreed / declined / applied") {
    ScrollView {
        VStack(spacing: Space.l) {
            RecommendationCard(
                content: previewRecommendation(.agreed, label: "Live experiment"),
                onCorrect: {}, onWhyThis: {}
            )
            RecommendationCard(
                content: previewRecommendation(.declined, label: "Declined"),
                onWhyThis: {}
            )
            RecommendationCard(
                content: previewRecommendation(.applied, label: "Reviewed"),
                onWhyThis: {}
            )
        }
        .padding(AdlerLayout.screenMargin)
    }
    .background(Color.canvas)
}
