import SwiftUI

/// A concrete change awaiting a decision (DESIGN.md §4.4). One coherent
/// suggestion is one decision, even when it touches several actions.
///
/// Rules encoded here: unchanged fields render `(no change)` — they are
/// shown, not hidden, so the scope of acceptance is legible; the
/// consequences line is always visible and states what accepting does **and
/// does not** do (it does not book anything unless a booking line says so);
/// after approval the card becomes a dated receipt, not a disappearing card.
struct ProposalCard: View {
    let content: ProposalContent
    var onApprove: (() -> Void)?
    var onDismiss: (() -> Void)?
    var onReviewChanges: (() -> Void)?
    var onWhyThis: (() -> Void)?
    var onViewPlan: (() -> Void)?

    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @ScaledMetric(relativeTo: .caption2) private var ruleHeight: CGFloat = 14

    var body: some View {
        VStack(alignment: .leading, spacing: Space.m) {
            header
            Text(content.title)
                .adlerText(.title2)
                .foregroundStyle(Color.inkHeading)
                .fixedSize(horizontal: false, vertical: true)

            VStack(alignment: .leading, spacing: Space.s) {
                ForEach(content.comparisons) { row in
                    ChangeComparison(row: row, goal: content.goal?.color)
                }
            }

            Text(content.affectedSummary)
                .adlerText(.footnote, numeric: true)
                .foregroundStyle(Color.inkMuted)

            VStack(alignment: .leading, spacing: Space.xxs) {
                Text(content.consequence)
                    .adlerText(.callout)
                    .foregroundStyle(Color.ink)
                    .fixedSize(horizontal: false, vertical: true)
                if let booking = content.bookingConsequence {
                    Text(booking)
                        .adlerText(.callout)
                        .foregroundStyle(Color.ink)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }

            if let expires = content.expiryNote {
                Text(expires)
                    .adlerText(.footnote, numeric: true)
                    .foregroundStyle(Color.inkMuted)
            }

            controls
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
                stateChip
            }
        } else {
            HStack(spacing: Space.s) {
                goalLabel
                Spacer(minLength: Space.s)
                stateChip
            }
        }
    }

    @ViewBuilder
    private var goalLabel: some View {
        if let goal = content.goal {
            HStack(spacing: Space.s) {
                GoalRule(color: goal.color).frame(height: ruleHeight)
                Text(goal.title)
                    .adlerText(.eyebrow)
                    .foregroundStyle(Color.inkMuted)
            }
        }
    }

    @ViewBuilder
    private var stateChip: some View {
        Group {
            switch content.state {
            case .pending:
                AdlerChip(label: "Proposed change")
            case .approved(let date):
                AdlerChip(label: "Approved \(AdlerDate.short(date))", emphasis: .filled, symbol: "checkmark")
            case .dismissed:
                AdlerChip(label: "Dismissed")
            }
        }
    }

    @ViewBuilder
    private var controls: some View {
        switch content.state {
        case .pending:
            VStack(alignment: .leading, spacing: Space.s) {
                if let onReviewChanges {
                    AdlerSecondaryButton(title: "Review changes", action: onReviewChanges)
                }
                let layout = dynamicTypeSize.prefersStackedControls
                    ? AnyLayout(VStackLayout(alignment: .leading, spacing: Space.xs))
                    : AnyLayout(HStackLayout(alignment: .center, spacing: Space.m))
                layout {
                    if let onApprove { AdlerPrimaryButton(title: "Approve", action: onApprove) }
                    if let onDismiss { AdlerQuietButton(title: "Dismiss", action: onDismiss) }
                    if let onWhyThis {
                        AdlerQuietButton(title: "Why this?", systemImage: "chevron.down", symbolTrailing: true, action: onWhyThis)
                    }
                }
            }
        case .approved:
            if let onViewPlan { AdlerSecondaryButton(title: "View the plan", action: onViewPlan) }
        case .dismissed:
            EmptyView()
        }
    }
}

/// One `Current → Suggested` row. Unchanged fields are shown, not hidden.
struct ChangeComparison: View {
    let row: ChangeComparisonRow
    var goal: GoalColor?
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    /// Two columns only when both values are short enough to scan side by
    /// side, and never at accessibility sizes (DESIGN.md §3.3).
    private var useTwoColumns: Bool {
        guard !dynamicTypeSize.prefersStackedControls else { return false }
        let longest = max(row.current?.count ?? 0, row.suggested?.count ?? 0)
        return longest <= 28
    }

    var body: some View {
        VStack(alignment: .leading, spacing: Space.xxs) {
            Text(row.field)
                .adlerText(.caption)
                .foregroundStyle(Color.inkMuted)
            if useTwoColumns {
                HStack(alignment: .top, spacing: Space.s) {
                    currentValue
                    Image(systemName: "arrow.right")
                        .font(.caption2)  // scales with Dynamic Type; a fixed 11pt did not
                        .foregroundStyle(Color.inkMuted)
                        .padding(.top, 2)
                    suggestedValue
                }
            } else {
                VStack(alignment: .leading, spacing: Space.xs) {
                    currentValue
                    HStack(alignment: .top, spacing: Space.s) {
                        Image(systemName: "arrow.turn.down.right")
                            .font(.caption2)  // scales with Dynamic Type; a fixed 11pt did not
                            .foregroundStyle(Color.inkMuted)
                        suggestedValue
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(row.accessibilityLabel)
    }

    private var currentValue: some View {
        Text(row.currentText)
            .adlerText(.callout, numeric: true)
            .foregroundStyle(Color.inkMuted)
            .strikethrough(row.removed, color: .inkMuted)
            .frame(maxWidth: .infinity, alignment: .leading)
            .fixedSize(horizontal: false, vertical: true)
    }

    private var suggestedValue: some View {
        HStack(alignment: .top, spacing: Space.s) {
            RoundedRectangle(cornerRadius: 1)
                .fill(goal?.color ?? Color.accentGreen)
                .frame(width: 2)
            Text(row.suggestedText)
                .adlerText(.callout, numeric: true)
                .foregroundStyle(row.suggested == nil ? Color.inkMuted : Color.ink)
                .fixedSize(horizontal: false, vertical: true)
        }
        .fixedSize(horizontal: false, vertical: true)
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

// MARK: - Value types

nonisolated struct ProposalContent: Equatable, Sendable {
    var goal: DisplayGoal?
    /// The proposal's saved summary title.
    let title: String
    let comparisons: [ChangeComparisonRow]
    /// `Affects 2 actions · 1 plan version` — counted from the saved change
    /// set, never estimated.
    let affectedSummary: String
    /// `Accepting this saves the plan. It does not book anything.`
    var consequence: String = "Accepting this saves the plan. It does not book anything."
    /// Present only when the change really does book time.
    var bookingConsequence: String?
    var expiryNote: String?
    var state: ProposalState = .pending
}

nonisolated enum ProposalState: Equatable, Sendable {
    case pending
    case approved(at: Date)
    case dismissed
}

nonisolated struct ChangeComparisonRow: Identifiable, Equatable, Sendable {
    let id: String
    /// The saved change label: `Goal` · `Plan` · `Milestone` · `Action` …
    let field: String
    /// `nil` renders `(no change)`.
    var current: String?
    /// `nil` renders `(no change)`.
    var suggested: String?
    /// Struck through when the value is being removed.
    var removed: Bool = false
    /// True only when the proposal genuinely leaves this field alone. An absent `current` means
    /// *nothing is saved yet*, which is a different fact.
    var unchanged: Bool = false

    /// "Nothing is set today" and "this field is unaffected" are different facts and must not
    /// share a string: `current: nil, suggested: "Review on 25 Oct"` read as *"Current: no
    /// change. Suggested: Review on 25 Oct"* — the card stating the review is unchanged while
    /// proposing one.
    var currentText: String { current ?? (unchanged ? "(no change)" : "(none saved)") }
    var suggestedText: String { suggested ?? (unchanged ? "(no change)" : "(removed)") }

    var accessibilityLabel: String {
        "\(field). Current: \(currentText). Suggested: \(suggestedText)."
    }
}

// MARK: - Previews

/// Fictional design data.
private let proposalPreviewContent = ProposalContent(
    goal: DisplayGoal(id: "g1", title: "Portfolio", hsl: "hsl(142 45% 35%)"),
    title: "New writing plan",
    comparisons: [
        ChangeComparisonRow(id: "1", field: "Action", current: "Write 25 min at 8:30", suggested: "Leave the phone in the kitchen, then write 25 min at 8:30"),
        ChangeComparisonRow(id: "2", field: "Review", current: nil, suggested: "Review on 25 Oct"),
        ChangeComparisonRow(id: "3", field: "Milestone", current: "Case study 2 by 20 Oct", suggested: nil),
        ChangeComparisonRow(id: "4", field: "Action", current: "Read 20 pages on Sunday", suggested: nil, removed: true)
    ],
    affectedSummary: "Affects 2 actions · 1 plan version",
    expiryNote: "Expires 20 Oct. If your workspace has changed, Adler will need to make an updated proposal."
)

/// Fictional design data.
#Preview("Proposal — pending") {
    ScrollView {
        ProposalCard(
            content: proposalPreviewContent,
            onApprove: {}, onDismiss: {}, onReviewChanges: {}, onWhyThis: {}
        )
        .padding(AdlerLayout.screenMargin)
    }
    .background(Color.canvas)
}

/// Fictional design data.
#Preview("Proposal — booking, approved, dismissed") {
    ScrollView {
        VStack(spacing: Space.l) {
            ProposalCard(
                content: {
                    var content = proposalPreviewContent
                    content.bookingConsequence = "Accepting this also books 8:30–8:55 on Tuesday in Work calendar."
                    return content
                }(),
                onApprove: {}, onDismiss: {}, onReviewChanges: {}, onWhyThis: {}
            )
            ProposalCard(
                content: {
                    var content = proposalPreviewContent
                    content.state = .approved(at: .now)
                    return content
                }(),
                onViewPlan: {}
            )
            ProposalCard(
                content: {
                    var content = proposalPreviewContent
                    content.state = .dismissed
                    return content
                }()
            )
        }
        .padding(AdlerLayout.screenMargin)
    }
    .background(Color.canvas)
}
