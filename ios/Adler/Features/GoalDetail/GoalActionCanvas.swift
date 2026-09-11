import SwiftUI

/// `MILESTONE` → `ACTION`: the rail that scopes the canvas, and the canvas itself.
///
/// Selecting a milestone re-scopes the work below it (the server returns `planActions` for the
/// selected milestone). Completing an action never verifies a milestone — that control lives in
/// the milestone's own screen.
struct GoalActionCanvas: View {
    let detail: GoalDetailView
    let timeZone: TimeZone
    @Binding var selectedMarkerId: String?
    @Binding var selectedActionId: String?
    let isEarlierPlan: Bool
    var onScopeMilestone: (String?) -> Void
    var onOpenMilestone: (String) -> Void
    var onStart: (ActionView) -> Void
    var onReport: (ActionView) -> Void
    var onSchedule: (ActionView) -> Void
    var onChoose: (ActionView) -> Void
    var onPlanMilestoneActions: (String) -> Void

    private var goalColor: GoalColor { GoalColor.parse(detail.goal.color) }
    private var markers: [MilestoneMarker] {
        GoalDetailPresentation.markers(detail, timeZone: timeZone)
    }
    private var selectedMilestone: MilestoneView? {
        detail.milestones.first { $0.id == selectedMarkerId }
    }
    private var selectedMarker: MilestoneMarker? {
        markers.first { $0.id == selectedMarkerId }
    }
    private var selectedAction: ActionView? {
        detail.planActions.first { $0.id == selectedActionId }
    }
    private var actionLookup: [String: ActionView] {
        Dictionary(detail.actions.map { ($0.id, $0) }, uniquingKeysWith: { first, _ in first })
    }
    private var step: PlanStepView? {
        detail.plans.first { $0.version == detail.selectedPlanVersion }?
            .steps.first { $0.id == detail.selectedStepId }
    }
    private var isOneTime: Bool { step.map { $0.recurrence == nil } ?? false }
    private var series: InputSeries? {
        GoalPresentation.inputSeries(
            detail.series, today: detail.today, timeZone: timeZone, actions: actionLookup,
            isOneTime: isOneTime)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: AdlerLayout.sectionGap) {
            milestoneSection
            actionSection
        }
    }

    // MARK: - Milestone

    private var milestoneSection: some View {
        VStack(alignment: .leading, spacing: Space.s) {
            HStack(alignment: .firstTextBaseline, spacing: Space.s) {
                Text("MILESTONE")
                    .adlerText(.eyebrow)
                    .foregroundStyle(Color.inkMuted)
                    .accessibilityAddTraits(.isHeader)
                Spacer(minLength: Space.s)
                if detail.selectedMilestoneId != nil || selectedMarkerId != nil {
                    Button(GoalCopy.allActions) {
                        selectedMarkerId = nil
                        onScopeMilestone(nil)
                    }
                    .adlerText(.subhead)
                    .foregroundStyle(Color.accentInk)
                    .buttonStyle(.plain)
                    .frame(minHeight: AdlerLayout.minimumHitTarget)
                }
            }

            if markers.isEmpty {
                Text("No milestones, checkpoints or reviews are saved for this goal.")
                    .adlerText(.footnote)
                    .foregroundStyle(Color.inkMuted)
                    .fixedSize(horizontal: false, vertical: true)
            } else {
                Text(GoalDetailPresentation.markerCounts(markers))
                    .adlerText(.caption, numeric: true)
                    .foregroundStyle(Color.inkMuted)

                MilestoneRail(markers: markers, goal: goalColor, selection: $selectedMarkerId)
                    .onChange(of: selectedMarkerId) { _, id in
                        // Only a milestone scopes the canvas; a checkpoint or a review is a
                        // dated marker with no work of its own.
                        let isMilestone = detail.milestones.contains { $0.id == id }
                        onScopeMilestone(isMilestone ? id : nil)
                    }
            }

            if let marker = selectedMarker {
                VStack(alignment: .leading, spacing: Space.xs) {
                    if let criterion = marker.criterion {
                        Text("\(GoalCopy.resultToReach): \(criterion)")
                            .adlerText(.subhead)
                            .foregroundStyle(Color.ink)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    if let milestone = selectedMilestone {
                        HStack(spacing: Space.s) {
                            AdlerChip(label: milestone.statusLabel)
                            Text("\(milestone.actionIds.count) contributing actions")
                                .adlerText(.caption, numeric: true)
                                .foregroundStyle(Color.inkMuted)
                        }
                        AdlerQuietButton(
                            title: "Open milestone", systemImage: "chevron.right",
                            symbolTrailing: true
                        ) {
                            onOpenMilestone(milestone.id)
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .adlerWell()
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - Action

    private var actionSection: some View {
        VStack(alignment: .leading, spacing: Space.m) {
            HStack(alignment: .firstTextBaseline, spacing: Space.s) {
                Text("ACTION")
                    .adlerText(.eyebrow)
                    .foregroundStyle(Color.inkMuted)
                    .accessibilityAddTraits(.isHeader)
                if let milestone = selectedMilestone {
                    Text(String(format: GoalCopy.showingFor, milestone.title))
                        .adlerText(.caption)
                        .foregroundStyle(Color.inkMuted)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }

            if detail.planActions.isEmpty {
                emptyCanvas
            } else {
                canvas
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    @ViewBuilder
    private var emptyCanvas: some View {
        if let milestone = selectedMilestone {
            EmptyStateView(
                title: "No actions are linked to this milestone yet.",
                actionTitle: "Plan its actions",
                action: { onPlanMilestoneActions(milestone.title) })
        } else {
            EmptyStateView(
                title: EmptyStateCopy.draftNoPlan.title,
                message: EmptyStateCopy.draftNoPlan.body,
                actionTitle: "Plan first action",
                action: { onPlanMilestoneActions(detail.goal.title) })
        }
    }

    @ViewBuilder
    private var canvas: some View {
        if let action = selectedAction {
            VStack(alignment: .leading, spacing: Space.s) {
                // An earlier plan version is read only: it shows what was saved and carries no
                // controls at all, rather than controls that quietly do nothing.
                if isEarlierPlan {
                    earlierPlanCard(action)
                } else {
                    ActionCard(
                        model: GoalDetailPresentation.actionCard(
                            action, goal: detail.goal, timeZone: timeZone),
                        scale: .compact,
                        onStart: { onStart(action) },
                        onReport: { onReport(action) },
                        onSchedule: { onSchedule(action) },
                        onChoose: { onChoose(action) })
                }
                if let note = action.note, !note.isEmpty {
                    Text(note)
                        .adlerText(.footnote)
                        .foregroundStyle(Color.inkMuted)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }

        if let series {
            VStack(alignment: .leading, spacing: Space.s) {
                Text(isOneTime ? GoalCopy.oneTimeWork : GoalCopy.dailyReports)
                    .adlerText(.caption)
                    .foregroundStyle(Color.inkMuted)
                InputChart(
                    series: series, goal: goalColor, scale: .full,
                    today: GoalPresentation.date(detail.today, in: timeZone) ?? Date())
                ReportStrip(series: series, goal: goalColor) { point in
                    select(occurrence: point)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(AdlerLayout.cardPadding)
            .adlerCard()
        }

        if !isOneTime && detail.streak.count + detail.streak.completedCount > 0 {
            StreakLane(
                daysOnPlan: detail.streak.count,
                actionsCompleted: detail.streak.completedCount,
                days: GoalPresentation.streakDays(
                    detail.streak, today: detail.today, timeZone: timeZone),
                goal: goalColor)
        }

        planActionList
    }

    private var planActionList: some View {
        VStack(alignment: .leading, spacing: Space.xs) {
            Text("WORK IN THIS PLAN · \(detail.planActions.count)")
                .adlerText(.eyebrow, numeric: true)
                .foregroundStyle(Color.inkMuted)
                .accessibilityAddTraits(.isHeader)
            ForEach(detail.planActions) { action in
                Button {
                    selectedActionId = action.id
                } label: {
                    HStack(spacing: Space.s) {
                        DayStateCell(
                            state: GoalPresentation.dayState(execution: action.execution),
                            goal: goalColor, size: 10)
                        Text(dateLabel(action))
                            .adlerText(.caption, numeric: true)
                            .foregroundStyle(Color.inkMuted)
                            .frame(width: 54, alignment: .leading)
                        Text(action.title)
                            .adlerText(.subhead)
                            .foregroundStyle(Color.ink)
                            .lineLimit(1)
                        Spacer(minLength: Space.s)
                        Text(action.executionLabel)
                            .adlerText(.caption)
                            .foregroundStyle(Color.inkMuted)
                        if action.id == selectedActionId {
                            Image(systemName: "chevron.right")
                                .font(.caption)
                                .foregroundStyle(Color.accentInk)
                                .accessibilityHidden(true)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.vertical, Space.xs)
                    .contentShape(.rect)
                }
                .buttonStyle(.plain)
                .accessibilityElement(children: .combine)
                .accessibilityAddTraits(action.id == selectedActionId ? [.isButton, .isSelected] : .isButton)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(AdlerLayout.cardPadding)
        .adlerCard()
    }

    private func earlierPlanCard(_ action: ActionView) -> some View {
        VStack(alignment: .leading, spacing: Space.xs) {
            HStack(spacing: Space.s) {
                Text(GoalCopy.earlierPlan)
                    .adlerText(.eyebrow)
                    .foregroundStyle(Color.inkMuted)
                AdlerChip(label: "Read only")
            }
            Text(action.title)
                .adlerText(.headline)
                .foregroundStyle(Color.inkHeading)
                .fixedSize(horizontal: false, vertical: true)
            Text([action.criterion, action.timing, dateLabel(action)]
                .filter { !$0.isEmpty }
                .joined(separator: " · "))
                .adlerText(.subhead, numeric: true)
                .foregroundStyle(Color.inkMuted)
                .fixedSize(horizontal: false, vertical: true)
            if let outcome = action.outcome {
                Text(GoalDetailPresentation.receiptLine(outcome: outcome, action: action))
                    .adlerText(.footnote, numeric: true)
                    .foregroundStyle(Color.inkMuted)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(AdlerLayout.cardPadding)
        .adlerCard()
    }

    private func dateLabel(_ action: ActionView) -> String {
        guard let day = action.date, let date = GoalPresentation.date(day, in: timeZone) else {
            return "No date"
        }
        return AdlerDate.short(date)
    }

    /// A dated report chip selects its occurrence and opens the report for it (DESIGN.md §4.10).
    private func select(occurrence point: InputPoint) {
        let day = YMD(point.date, in: timeZone)
        guard let action = detail.planActions.first(where: { $0.date == day })
                ?? detail.actions.first(where: { $0.date == day })
        else { return }
        selectedActionId = action.id
        guard !isEarlierPlan, action.retiredAt == nil, detail.goal.status != .draft else { return }
        onReport(action)
    }
}
