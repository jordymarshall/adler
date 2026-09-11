import SwiftUI

/// Today 02 Progress — every goal's recorded result beside the plan it agreed to
/// (DESIGN.md §5.4).
///
/// Rules encoded here: every goal appears, including Draft, Paused and Completed; there is no
/// aggregate percentage across goals; action completion never appears; the server's delta label
/// is printed verbatim; a goal with no measure gets no invented target; and no projection is
/// drawn on this card — a conditional model belongs next to its assumptions on goal detail.
struct TodayProgressCard: View {
    let today: TodayView
    let dates: TodayDates
    let onSheet: (TodaySheet) -> Void
    let onCoach: (TodayCoachPrompt) -> Void

    @Environment(AppRouter.self) private var router
    @Environment(WorkspaceStore.self) private var workspace

    private var rows: [ProgressRowPresentation] {
        today.progress.map { ProgressRowPresentation.make($0, dates: dates) }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AdlerLayout.sectionGap) {
                CardHeading(
                    number: "02", title: TodayDeck.cardTitles[1],
                    trailing: goalCount)
                intro

                if rows.isEmpty {
                    EmptyStateView(
                        title: EmptyStateCopy.noGoals.title,
                        message: EmptyStateCopy.noGoals.body,
                        actionTitle: "Start with a goal",
                        action: {
                            onCoach(TodayCoachPrompt(prompt: "I want to start a goal"))
                        }
                    )
                } else {
                    ForEach(Array(rows.enumerated()), id: \.element.id) { index, row in
                        if index > 0 { Divider().overlay(Color.separator) }
                        ProgressGoalRow(
                            row: row,
                            onOpenGoal: { router.openGoal(id: row.goal.id) },
                            onAction: { act(on: row) }
                        )
                    }
                }

                note
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(AdlerLayout.todayCardPadding)
        }
        .scrollBounceBehavior(.basedOnSize)
        .refreshable { await workspace.loadToday() }
        .adlerFanBackground(seed: 1)
        .overlay {
            RoundedRectangle(cornerRadius: Radii.largeCard)
                .strokeBorder(Color.separator, lineWidth: 1)
        }
        .clipShape(.rect(cornerRadius: Radii.largeCard))
    }

    private var goalCount: String {
        let count = rows.count
        let noun = count == 1 ? "GOAL" : "GOALS"
        let date = dates.short(dates.today) ?? ""
        return date.isEmpty ? "\(count) \(noun)" : "\(count) \(noun) · \(date)"
    }

    private var intro: some View {
        VStack(alignment: .leading, spacing: Space.xs) {
            Text("The whole picture.")
                .adlerText(.title2)
                .foregroundStyle(Color.inkHeading)
            Text("Where each goal stands. Next to the plan you chose.")
                .adlerText(.callout)
                .foregroundStyle(Color.inkMuted)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private var note: some View {
        HStack(alignment: .top, spacing: Space.s) {
            Image(systemName: "flag")
                .foregroundStyle(Color.inkMuted)
                .accessibilityHidden(true)
            Text(
                "Checkpoints are commitments, not forecasts. Lines join saved reports; changes between reports are unknown."
            )
            .adlerText(.footnote)
            .foregroundStyle(Color.inkMuted)
            .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .adlerWell()
    }

    /// FLOWS.md §5: a measured goal that needs a result opens AddResult; everything else routes
    /// to the coach with the prompt the server wrote.
    private func act(on row: ProgressRowPresentation) {
        if row.opensAddResult,
            let source = today.progress.first(where: { $0.goal.id == row.id })
        {
            onSheet(.addResult(row: source))
        } else {
            onCoach(TodayCoachPrompt(prompt: row.prompt, goalId: row.goal.id))
        }
    }
}

// MARK: - One goal

private struct ProgressGoalRow: View {
    let row: ProgressRowPresentation
    let onOpenGoal: () -> Void
    let onAction: () -> Void

    @ScaledMetric(relativeTo: .title3) private var ruleHeight: CGFloat = 22

    var body: some View {
        VStack(alignment: .leading, spacing: Space.m) {
            Button(action: onOpenGoal) {
                HStack(spacing: Space.s) {
                    GoalRule(color: row.goalColor).frame(height: ruleHeight)
                    Text(row.goal.title)
                        .adlerText(.headline)
                        .foregroundStyle(Color.inkHeading)
                        .multilineTextAlignment(.leading)
                    Image(systemName: "arrow.up.right")
                        .font(.caption2)
                        .foregroundStyle(Color.inkMuted)
                    Spacer(minLength: 0)
                }
                .contentShape(.rect)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("\(row.goal.title). Open goal.")

            result

            OutcomeChart(content: row.chart, goal: row.goalColor, height: 150)

            comparison
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.vertical, Space.xs)
    }

    private var result: some View {
        VStack(alignment: .leading, spacing: Space.xxs) {
            HStack(alignment: .firstTextBaseline, spacing: Space.xs) {
                Text(row.resultValue)
                    .adlerText(.title3, numeric: true)
                    .foregroundStyle(Color.ink)
                if let target = row.resultTarget {
                    Text("/ \(target)")
                        .adlerText(.subhead, numeric: true)
                        .foregroundStyle(Color.inkMuted)
                }
                Text(row.resultUnit)
                    .adlerText(.subhead)
                    .foregroundStyle(Color.inkMuted)
            }
            Text(row.resultNote)
                .adlerText(.footnote, numeric: true)
                .foregroundStyle(Color.inkMuted)
        }
        .accessibilityElement(children: .combine)
    }

    private var comparison: some View {
        VStack(alignment: .leading, spacing: Space.xs) {
            Text(row.comparisonLabel)
                .adlerText(.headline)
                .foregroundStyle(Color.inkHeading)
            ForEach(row.comparisonLines, id: \.self) { line in
                Text(line)
                    .adlerText(.footnote, numeric: true)
                    .foregroundStyle(Color.inkMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            AdlerSecondaryButton(title: row.actionLabel, action: onAction)
                .padding(.top, Space.xxs)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
