import SwiftUI

/// Every saved report for one action, newest first, with its corrections.
///
/// A correction does not replace the earlier report: the server appends to `action.history`, so
/// both stay readable and the row says what changed.
struct ActionHistoryView: View {
    let goalId: String
    let actionId: String

    @Environment(WorkspaceStore.self) private var workspace
    @Environment(AppRouter.self) private var router

    private var detail: GoalDetailView? { workspace.goalDetails[goalId] }
    private var action: ActionView? { detail?.action(actionId) }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AdlerLayout.sectionGap) {
                if let detail, let action {
                    header(detail, action)
                    reports(action)
                } else if detail != nil {
                    EmptyStateView(
                        title: "This record is no longer here.",
                        actionTitle: "Back to the goal",
                        action: { router.pop() })
                } else {
                    SkeletonCard()
                }
            }
            .padding(.horizontal, AdlerLayout.screenMargin)
            .padding(.vertical, AdlerLayout.screenMargin)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(Color.canvas)
        .navigationTitle("Reports")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            workspace.markVisible(.goal(goalId))
            if detail == nil { await workspace.loadGoal(id: goalId) }
        }
    }

    private func header(_ detail: GoalDetailView, _ action: ActionView) -> some View {
        VStack(alignment: .leading, spacing: Space.s) {
            Text("ACTION")
                .adlerText(.eyebrow)
                .foregroundStyle(Color.inkMuted)
                .accessibilityAddTraits(.isHeader)
            Text(action.title)
                .adlerText(.title3)
                .foregroundStyle(Color.inkHeading)
                .fixedSize(horizontal: false, vertical: true)
            Text(
                [
                    action.criterion, action.timing,
                    action.date.flatMap { GoalPresentation.date($0, in: workspace.timeZone) }
                        .map { AdlerDate.short($0) } ?? "",
                ]
                .filter { !$0.isEmpty }
                .joined(separator: " · ")
            )
            .adlerText(.subhead, numeric: true)
            .foregroundStyle(Color.inkMuted)
            .fixedSize(horizontal: false, vertical: true)
            HStack(spacing: Space.s) {
                AdlerChip(label: action.executionLabel)
                if action.retiredAt != nil { AdlerChip(label: "Retired") }
                Text("Plan v\(action.planVersion)")
                    .adlerText(.caption, numeric: true)
                    .foregroundStyle(Color.inkMuted)
            }
            if let milestoneId = action.milestoneId,
                let milestone = detail.milestone(milestoneId)
            {
                Text("Contributes to · \(milestone.title)")
                    .adlerText(.footnote)
                    .foregroundStyle(Color.inkMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(AdlerLayout.cardPadding)
        .adlerCard()
    }

    private func reports(_ action: ActionView) -> some View {
        VStack(alignment: .leading, spacing: Space.m) {
            Text("REPORTS · \(action.history.count)")
                .adlerText(.eyebrow, numeric: true)
                .foregroundStyle(Color.inkMuted)
                .accessibilityAddTraits(.isHeader)

            if action.history.isEmpty {
                Text(
                    action.outcome == nil
                        ? "Nothing has been reported for this action. What was not reported stays unknown."
                        : "One report is saved. Its earlier versions would appear here."
                )
                .adlerText(.footnote)
                .foregroundStyle(Color.inkMuted)
                .fixedSize(horizontal: false, vertical: true)
            }

            ForEach(Array(action.history.enumerated().reversed()), id: \.offset) { index, report in
                VStack(alignment: .leading, spacing: Space.xxs) {
                    HStack(spacing: Space.s) {
                        Text(index == 0 ? "Reported" : "Corrected")
                            .adlerText(.caption)
                            .foregroundStyle(index == 0 ? Color.inkMuted : Color.warning)
                        Text(savedAt(report))
                            .adlerText(.caption, numeric: true)
                            .foregroundStyle(Color.inkMuted)
                    }
                    Text(line(report, action: action))
                        .adlerText(.subhead, numeric: true)
                        .foregroundStyle(Color.ink)
                        .fixedSize(horizontal: false, vertical: true)
                    if let note = report.note, !note.isEmpty {
                        Text(note)
                            .adlerText(.footnote)
                            .foregroundStyle(Color.inkMuted)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    if index > 0, index - 1 < action.history.count {
                        Text("Corrected from \(line(action.history[index - 1], action: action))")
                            .adlerText(.caption, numeric: true)
                            .foregroundStyle(Color.inkMuted)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .adlerWell()
                .accessibilityElement(children: .combine)
            }

            Text("A correction is saved beside the earlier report, never instead of it.")
                .adlerText(.caption)
                .foregroundStyle(Color.inkMuted)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(AdlerLayout.cardPadding)
        .adlerCard()
    }

    private func savedAt(_ report: ActionReportView) -> String {
        guard let date = report.at.date else { return report.at.raw }
        return "\(AdlerDate.short(date)) · \(AdlerDate.time(date))"
    }

    /// `Done · 25 minutes`, or `Done · amount not reported` — a blank amount is never `0`.
    private func line(_ report: ActionReportView, action: ActionView) -> String {
        var parts = [report.outcome?.rawValue ?? "No outcome recorded"]
        if let amount = report.amount {
            parts.append("\(GoalDetailPresentation.formatted(amount)) \(action.measure.unit)")
        } else {
            parts.append("amount not reported")
        }
        if let minutes = report.actualMinutes {
            parts.append("\(GoalDetailPresentation.formatted(minutes)) min")
        }
        return parts.joined(separator: " · ")
    }
}
