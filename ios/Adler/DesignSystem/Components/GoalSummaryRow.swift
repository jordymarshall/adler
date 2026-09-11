import SwiftUI

/// One aligned row per goal on All Goals (DESIGN.md §4.8). Identical column
/// order for every goal so the list scans.
///
/// The ``ActivityGrid`` appears here and nowhere else. A Draft goal shows no
/// grid and no sparkline — it shows `Goal saved · plan not started`, never an
/// empty chart that implies missing work.
struct GoalSummaryRow: View {
    let content: GoalSummaryRowContent
    var onOpen: (() -> Void)?

    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @ScaledMetric(relativeTo: .headline) private var ruleHeight: CGFloat = 18

    var body: some View {
        VStack(alignment: .leading, spacing: Space.s) {
            header

            Text(content.resultLine)
                .adlerText(.subhead, numeric: true)
                .foregroundStyle(Color.inkMuted)
                .fixedSize(horizontal: false, vertical: true)

            if let activity = content.activity {
                ActivityGrid(layout: activity, goal: content.goal.color, showsCaption: true)
            }

            if let input = content.input {
                InputChart(series: input, goal: content.goal.color, scale: .compact)
            }

            if let nextLine = content.nextLine {
                HStack(spacing: Space.s) {
                    Text(nextLine)
                        .adlerText(.footnote, numeric: true)
                        .foregroundStyle(Color.inkMuted)
                    if let delta = content.deltaLabel {
                        AdlerChip(label: delta, emphasis: content.deltaEmphasis)
                    }
                }
                .fixedSize(horizontal: false, vertical: true)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(AdlerLayout.cardPadding)
        .adlerCard()
        .contentShape(.rect)
        .onTapGesture { onOpen?() }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(content.accessibilityLabel)
        .accessibilityAddTraits(onOpen == nil ? [] : .isButton)
        .accessibilityAction { onOpen?() }
    }

    @ViewBuilder
    private var header: some View {
        if dynamicTypeSize.prefersStackedControls {
            VStack(alignment: .leading, spacing: Space.xs) {
                titleLabel
                chipRow
            }
        } else {
            HStack(alignment: .top, spacing: Space.s) {
                titleLabel
                Spacer(minLength: Space.s)
                chipRow
            }
        }
    }

    private var titleLabel: some View {
        HStack(alignment: .top, spacing: Space.s) {
            GoalRule(color: content.goal.color).frame(height: ruleHeight)
            Text(content.goal.title)
                .adlerText(.headline)
                .foregroundStyle(Color.inkHeading)
                .lineLimit(2)
        }
    }

    private var chipRow: some View {
        FlowLayout(spacing: Space.xs, lineSpacing: Space.xs) {
            ForEach(content.chips, id: \.self) { chip in
                AdlerChip(label: chip, emphasis: chip == content.primaryChip ? .filled : .outlined)
            }
        }
    }
}

/// The server's `tone` for a progress or outlook label, mirroring contract §3
/// `ProgressTone`. The design system takes the value, never the prose.
nonisolated enum DeltaTone: String, Sendable, Equatable, CaseIterable {
    case quiet
    case attention
    case positive
}

nonisolated struct GoalSummaryRowContent: Equatable, Sendable {
    let goal: DisplayGoal
    /// Priority and status, printed verbatim (`Focus`, `Active`, `Draft`…).
    var chips: [String] = []
    /// Recorded result vs target in the goal's own units, or
    /// `No outcome measure saved`, or `Goal saved · plan not started`.
    let resultLine: String
    /// `nil` for a Draft goal — no grid rather than an empty one.
    var activity: ActivityGridLayout?
    /// `nil` for a Draft goal.
    var input: InputSeries?
    /// `Next: case study 2 by 1 Nov`.
    var nextLine: String?
    /// The server's delta label, verbatim (`Below checkpoint`,
    /// `Update needed`, `Verify the milestone`…).
    var deltaLabel: String?
    /// The server's saved tone for `deltaLabel` (contract §3 `progress[].tone`).
    /// Pass it: deciding emphasis by matching the label's *words* means one
    /// edit to the server's copy silently removes the warning triangle, with
    /// no compile error anywhere. `nil` falls back to the old string match so
    /// callers that have not adopted it yet keep their current behaviour.
    var deltaTone: DeltaTone?
    /// Which chip is the state the person acted on, drawn filled. The label is
    /// still the server's; only the caller decides which one is primary.
    var primaryChip: String? = "Focus"

    /// The two delta labels that mean something is missing rather than
    /// merely behind. Legacy fallback for `deltaTone == nil` only.
    var deltaNeedsAttention: Bool {
        if let deltaTone { return deltaTone == .attention }
        return deltaLabel == "Update needed" || deltaLabel == "Verify the milestone"
    }

    var deltaEmphasis: AdlerChip.Emphasis { deltaNeedsAttention ? .attention : .outlined }

    /// The row replaces its children's labels, so anything the grid or the sparkline would
    /// have announced has to be folded back in here — otherwise a VoiceOver user hears a goal
    /// row with no minutes, no unit and no per-week breakdown, and the sparkline is invisible.
    var accessibilityLabel: String {
        var parts = [goal.title]
        parts.append(contentsOf: chips)
        parts.append(resultLine)
        if let activity {
            parts.append("Activity: \(activity.doneCount) done, \(activity.reportedCount) reported")
            parts.append(activity.caption)
        }
        if let input { parts.append(input.accessibilityLabel) }
        if let nextLine { parts.append(nextLine) }
        if let deltaLabel { parts.append(deltaLabel) }
        return parts.joined(separator: ". ")
    }
}

// MARK: - Previews

#if DEBUG

/// Fictional design data.
#Preview("Goal rows") {
    ScrollView {
        VStack(spacing: Space.l) {
            GoalSummaryRow(
                content: GoalSummaryRowContent(
                    goal: DisplayGoal(id: "g1", title: "Publish a portfolio", hsl: "hsl(142 45% 35%)"),
                    chips: ["Focus", "Active"],
                    resultLine: "1 of 3 case studies published · target 3 by 1 Nov",
                    activity: ActivityGridLayout(marks: previewActivityMarks(), today: .now, weekCount: 8),
                    input: previewInputSeries(),
                    nextLine: "Next: case study 2 by 1 Nov",
                    deltaLabel: "Update needed"
                ),
                onOpen: {}
            )
            GoalSummaryRow(
                content: GoalSummaryRowContent(
                    goal: DisplayGoal(id: "g2", title: "Read 24 books", hsl: "hsl(28 52% 35%)"),
                    chips: ["Active"],
                    resultLine: "No outcome measure saved",
                    activity: ActivityGridLayout(marks: previewActivityMarks(), today: .now, weekCount: 8),
                    input: nil,
                    nextLine: nil,
                    deltaLabel: "No outcome measure"
                ),
                onOpen: {}
            )
            GoalSummaryRow(
                content: GoalSummaryRowContent(
                    goal: DisplayGoal(id: "g3", title: "Learn to swim front crawl", hsl: "hsl(210 40% 35%)"),
                    chips: ["Draft"],
                    resultLine: "Goal saved · plan not started"
                ),
                onOpen: {}
            )
        }
        .padding(AdlerLayout.screenMargin)
    }
    .background(Color.canvas)
}
#endif
