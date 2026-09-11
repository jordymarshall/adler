import SwiftUI

/// All Goals (DESIGN.md §5.5): the weekly capacity bar, then one aligned row per goal grouped
/// by status. The GitHub-style activity grid lives here and nowhere else.
struct GoalsRootView: View {
    @Environment(WorkspaceStore.self) private var workspace
    @Environment(AppRouter.self) private var router

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AdlerLayout.sectionGap) {
                if let error = workspace.state(.goals).error, workspace.goals != nil {
                    ErrorBanner(kind: banner(for: error)) { Task { await workspace.loadGoals() } }
                }
                content
            }
            .padding(.horizontal, AdlerLayout.screenMargin)
            .padding(.vertical, AdlerLayout.screenMargin)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(Color.canvas)
        .overlay(alignment: .top) {
            if workspace.state(.goals).isLoading && workspace.goals != nil { RefreshHairline() }
        }
        .refreshable { await workspace.loadGoals() }
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    CoachHandoff.open(router, prompt: CoachHandoff.newGoal)
                } label: {
                    Label(GoalCopy.newGoal, systemImage: "plus")
                }
                .accessibilityLabel(GoalCopy.newGoal)
            }
        }
        .task {
            workspace.markVisible(.goals)
            await workspace.loadGoals()
        }
        .onDisappear { workspace.markHidden(.goals) }
    }

    @ViewBuilder
    private var content: some View {
        if let goals = workspace.goals {
            if goals.rows.isEmpty {
                EmptyStateView(
                    title: EmptyStateCopy.noGoals.title,
                    message: EmptyStateCopy.noGoals.body,
                    actionTitle: "Start with a goal",
                    action: { CoachHandoff.open(router, prompt: CoachHandoff.newGoal) }
                )
            } else {
                loaded(goals)
            }
        } else if let error = workspace.state(.goals).error {
            ErrorBanner(kind: banner(for: error)) { Task { await workspace.loadGoals() } }
        } else {
            VStack(spacing: AdlerLayout.sectionGap) {
                SkeletonCard()
                SkeletonRow()
                SkeletonRow()
                SkeletonRow()
            }
            .accessibilityLabel("Loading")
        }
    }

    @ViewBuilder
    private func loaded(_ goals: GoalsView) -> some View {
        VStack(alignment: .leading, spacing: Space.s) {
            WeeklyBudgetBar(budget: GoalPresentation.budget(goals.budget)) {
                router.openCalendar(weekStart: goals.budget.weekStart)
            }
            Text(weekRange(goals.budget))
                .adlerText(.caption, numeric: true)
                .foregroundStyle(Color.inkMuted)
            Text(goals.budget.sourceNote)
                .adlerText(.caption)
                .foregroundStyle(Color.inkMuted)
                .fixedSize(horizontal: false, vertical: true)
        }

        ForEach(GoalPresentation.sections(goals)) { section in
            VStack(alignment: .leading, spacing: Space.m) {
                Text(section.title.uppercased())
                    .adlerText(.eyebrow)
                    .foregroundStyle(Color.inkMuted)
                    .accessibilityAddTraits(.isHeader)
                ForEach(section.goalIds, id: \.self) { goalId in
                    if let row = goals.row(goalId) {
                        GoalSummaryRow(
                            content: GoalPresentation.rowContent(
                                row, today: goals.today, timeZone: workspace.timeZone)
                        ) {
                            router.push(.goal(id: row.goal.id))
                        }
                    }
                }
            }
        }
    }

    private func weekRange(_ budget: WeeklyBudgetView) -> String {
        let zone = workspace.timeZone
        guard let start = GoalPresentation.date(budget.weekStart, in: zone),
            let end = GoalPresentation.date(budget.weekEnd, in: zone)
        else { return "" }
        return "\(AdlerDate.short(start)) – \(AdlerDate.short(end))"
    }

    private func banner(for error: APIError) -> ErrorBanner.Kind {
        switch error {
        case .transport(_, let kind): kind == .timeout ? .timeout : .offline
        case .unauthenticated: .signedOut
        default: .server(detail: error.serverMessage)
        }
    }
}

#Preview {
    NavigationStack { GoalsRootView() }
}
