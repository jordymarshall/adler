import SwiftUI

/// A learning record as a row (DESIGN.md §4.5): Insights "Trying now",
/// Today 03 Learn, and the Goal-detail journey.
///
/// The two chips are always both present and never merge: a workflow chip
/// alone never implies evidence, and an evidence chip alone never implies
/// the test is running.
struct LearningSummaryRow: View {
    let content: LearningSummaryRowContent
    var onOpen: (() -> Void)?

    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @ScaledMetric(relativeTo: .caption2) private var ruleHeight: CGFloat = 14

    var body: some View {
        VStack(alignment: .leading, spacing: Space.s) {
            header

            Text(content.change)
                .adlerText(.headline)
                .foregroundStyle(Color.inkHeading)
                .fixedSize(horizontal: false, vertical: true)

            Text(content.summaryLine)
                .adlerText(.footnote, numeric: true)
                .foregroundStyle(Color.inkMuted)

            LearningTimeline(layout: content.timeline, goal: content.goal.color)
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
                goalLabel
                StatusChipPair(workflow: content.workflowLabel, standing: content.standingLabel)
            }
        } else {
            HStack(alignment: .top, spacing: Space.s) {
                goalLabel
                Spacer(minLength: Space.s)
                StatusChipPair(workflow: content.workflowLabel, standing: content.standingLabel)
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
}

nonisolated struct LearningSummaryRowContent: Equatable, Sendable {
    let goal: DisplayGoal
    /// The agreed or suggested change, verbatim.
    let change: String
    /// The server's `learningStatus` value, verbatim.
    let workflowLabel: String
    /// The server's `learningStanding` value, verbatim.
    let standingLabel: String
    let attemptsReported: Int
    let timeline: LearningTimelineLayout

    /// `2 attempts reported · Review 25 Oct`, or the honest alternatives
    /// when either number is missing. Never an invented review date.
    var summaryLine: String {
        let attempts = attemptsReported == 0
            ? "No attempts reported yet"
            : (attemptsReported == 1 ? "1 attempt reported" : "\(attemptsReported) attempts reported")
        let review = timeline.review.map { "Review \(AdlerDate.short($0))" } ?? "Review after useful feedback"
        return "\(attempts) · \(review)"
    }

    var accessibilityLabel: String {
        "\(goal.title). \(change). \(workflowLabel). Evidence: \(standingLabel). "
            + "\(summaryLine). \(timeline.accessibilitySummary)"
    }
}

// MARK: - Previews

/// Fictional design data.
private func previewLearningRow(
    workflow: String,
    standing: String,
    attempts: Int,
    review: Date?
) -> LearningSummaryRowContent {
    let today = Date()
    let day: TimeInterval = 86_400
    let attemptDates = (0..<attempts).map { today.addingTimeInterval(Double(-7 + $0 * 2) * day) }
    return LearningSummaryRowContent(
        goal: DisplayGoal(id: "g1", title: "Portfolio", hsl: "hsl(142 45% 35%)"),
        change: "Leave the phone in the kitchen",
        workflowLabel: workflow,
        standingLabel: standing,
        attemptsReported: attempts,
        timeline: LearningTimelineLayout(
            plannedStart: today.addingTimeInterval(-8 * day),
            attempts: attemptDates,
            review: review,
            today: today
        )
    )
}

/// Fictional design data.
#Preview("Learning rows") {
    ScrollView {
        VStack(spacing: Space.l) {
            LearningSummaryRow(
                content: previewLearningRow(
                    workflow: "Live experiment",
                    standing: "Consistent so far",
                    attempts: 2,
                    review: Date().addingTimeInterval(12 * 86_400)
                ),
                onOpen: {}
            )
            LearningSummaryRow(
                content: previewLearningRow(
                    workflow: "Suggested",
                    standing: "Waiting to learn",
                    attempts: 0,
                    review: nil
                ),
                onOpen: {}
            )
            LearningSummaryRow(
                content: previewLearningRow(
                    workflow: "Needs another look",
                    standing: "Evidence has changed",
                    attempts: 3,
                    review: Date().addingTimeInterval(2 * 86_400)
                ),
                onOpen: {}
            )
        }
        .padding(AdlerLayout.screenMargin)
    }
    .background(Color.canvas)
}
