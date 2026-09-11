import SwiftUI

/// Goal detail (DESIGN.md §5.6). The structure decision made literal:
/// **Goal → Plan → Milestone → Action**, each under its own label, then the subordinate
/// outcome projection, then history. The activity grid is not here — it belongs to All Goals.
struct GoalDetailRootView: View {
    let goalId: String

    init(goalId: String) {
        self.goalId = goalId
    }

    @Environment(WorkspaceStore.self) private var workspace
    @Environment(AppRouter.self) private var router

    // Scope: which saved plan version and which milestone the canvas below is showing.
    @State private var planVersion: Int?
    @State private var milestoneFilter: String?
    @State private var selectedMarkerId: String?
    @State private var selectedActionId: String?
    @State private var scopedRevision: Int?

    // Sheets and dialogs.
    @State private var reportingAction: ActionView?
    @State private var receipt: ReportReceipt?
    @State private var reportError: String?
    @State private var showsRationale = false
    @State private var showsAssumptions = false
    @State private var showsEdit = false
    @State private var actionMenu: ActionView?
    @State private var confirmDelete = false
    @State private var confirmComplete = false
    @State private var confirmPause = false

    // Writes.
    @State private var writeError: APIError?

    private var detail: GoalDetailView? { workspace.goalDetails[goalId] }
    private var loadState: LoadState { workspace.state(.goal(goalId)) }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AdlerLayout.sectionGap) {
                banners
                content
            }
            .padding(.horizontal, AdlerLayout.screenMargin)
            .padding(.vertical, AdlerLayout.screenMargin)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(Color.canvas)
        .overlay(alignment: .top) {
            if loadState.isLoading && detail != nil { RefreshHairline() }
        }
        .refreshable { await load() }
        .navigationTitle(detail?.goal.title ?? "Goal")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { if let detail { overflowMenu(detail) } }
        .task {
            workspace.markVisible(.goal(goalId))
            await load()
            #if DEBUG
            applyScreenshotArguments()
            #endif
        }
        .onDisappear { workspace.markHidden(.goal(goalId)) }
        .onChange(of: detail?.revision) { _, _ in reapplyScopeIfNeeded() }
        .sheet(isPresented: $showsRationale) { rationaleSheet }
        .sheet(isPresented: $showsAssumptions) { assumptionsSheet }
        .sheet(isPresented: $showsEdit) { editSheet }
        .sheet(item: $reportingAction) { action in reportSheet(action) }
        .confirmationDialog(
            "Action", isPresented: .init(get: { actionMenu != nil }, set: { if !$0 { actionMenu = nil } }),
            titleVisibility: .hidden
        ) {
            actionDialog
        }
        .confirmationDialog(
            GoalCopy.deleteConfirm, isPresented: $confirmDelete, titleVisibility: .visible
        ) {
            Button(GoalCopy.delete, role: .destructive) { Task { await deleteGoal() } }
            Button("Cancel", role: .cancel) {}
        }
        .confirmationDialog(
            completeMessage, isPresented: $confirmComplete, titleVisibility: .visible
        ) {
            Button(GoalCopy.complete) { Task { await setStatus(.completed) } }
            Button("Cancel", role: .cancel) {}
        }
        .confirmationDialog(
            GoalCopy.pauseConfirm, isPresented: $confirmPause, titleVisibility: .visible
        ) {
            Button(GoalCopy.pause) { Task { await setStatus(.paused) } }
            Button("Cancel", role: .cancel) {}
        }
    }

    // MARK: - Content

    @ViewBuilder
    private var content: some View {
        if let detail {
            GoalDetailHeader(
                detail: detail,
                timeZone: workspace.timeZone,
                onStartPlan: { Task { await startPlan() } },
                onPlanFirstAction: {
                    CoachHandoff.open(
                        router,
                        prompt: CoachHandoff.planFirstAction(goal: detail.goal.title),
                        goalId: detail.goal.id,
                        conversationId: detail.conversations.first?.id)
                })

            GoalPlanSection(
                detail: detail,
                timeZone: workspace.timeZone,
                selectedVersion: planVersion ?? detail.selectedPlanVersion,
                onSelectVersion: { version in
                    planVersion = GoalDetailPresentation.planQuery(
                        version: version, plans: detail.plans)
                    Task { await load() }
                },
                onWhyThisPlan: { showsRationale = true },
                onOpenRecord: { router.openRecord(id: $0) },
                onOpenDecision: {
                    CoachHandoff.open(
                        router, prompt: "", goalId: detail.goal.id,
                        conversationId: detail.conversations.first?.id)
                })

            GoalActionCanvas(
                detail: detail,
                timeZone: workspace.timeZone,
                selectedMarkerId: $selectedMarkerId,
                selectedActionId: $selectedActionId,
                isEarlierPlan: isEarlierPlan,
                onScopeMilestone: { id in
                    milestoneFilter = id
                    Task { await load() }
                },
                onOpenMilestone: { router.push(.milestone(goalId: goalId, id: $0)) },
                onStart: { action in Task { await start(action) } },
                onReport: { action in
                    receipt = nil
                    reportError = nil
                    reportingAction = action
                },
                onSchedule: { _ in router.openCalendar(weekStart: nil) },
                onChoose: { actionMenu = $0 },
                onPlanMilestoneActions: { milestone in
                    CoachHandoff.open(
                        router,
                        prompt: CoachHandoff.milestoneActions(milestone, goal: detail.goal.title),
                        goalId: detail.goal.id,
                        conversationId: detail.conversations.first?.id)
                })

            GoalOutcomeSection(
                detail: detail,
                timeZone: workspace.timeZone,
                onAssumptions: { showsAssumptions = true },
                onWhatWouldHelp: {
                    CoachHandoff.open(
                        router,
                        prompt: CoachHandoff.projectionHelp(goal: detail.goal.title),
                        goalId: detail.goal.id,
                        conversationId: detail.conversations.first?.id)
                })

            GoalHistorySection(
                detail: detail,
                timeZone: workspace.timeZone,
                onOpenConversation: { router.openConversation(id: $0) },
                onOpenActionHistory: {
                    router.push(.actionHistory(goalId: goalId, actionId: $0))
                },
                onSelectPlanVersion: { version in
                    planVersion = GoalDetailPresentation.planQuery(
                        version: version, plans: detail.plans)
                    Task { await load() }
                },
                selectedVersion: planVersion ?? detail.selectedPlanVersion,
                onEdit: { showsEdit = true },
                onPause: { confirmPause = true },
                onResume: { Task { await setStatus(.active) } },
                onSetAside: { Task { await setStatus(.setAside) } },
                onComplete: { confirmComplete = true },
                onDelete: { confirmDelete = true })
        } else if let error = loadState.error {
            ErrorBanner(kind: .server(detail: error.serverMessage)) { Task { await load() } }
        } else {
            VStack(alignment: .leading, spacing: AdlerLayout.sectionGap) {
                SkeletonCard()
                SkeletonChart()
                SkeletonChart()
            }
            .accessibilityLabel("Loading")
        }
    }

    @ViewBuilder
    private var banners: some View {
        if let error = writeError {
            if case .staleRevision = error {
                StaleRevisionBanner(
                    changeSummary: nil,
                    onRetry: { Task { await retryWrite() } },
                    onRefresh: { writeError = nil; Task { await load() } })
            } else if error.isNotFound {
                StaleRevisionBanner(
                    changeSummary: nil, recordGone: true,
                    onRefresh: { writeError = nil; Task { await load() } })
            } else {
                ErrorBanner(
                    kind: .server(detail: error.serverMessage ?? error.errorDescription),
                    actionTitle: "Dismiss",
                    action: { writeError = nil },
                    onDismiss: { writeError = nil })
            }
        }
        if detail != nil, let error = loadState.error {
            ErrorBanner(kind: .server(detail: error.serverMessage)) { Task { await load() } }
        }
    }

    // MARK: - Toolbar

    @ToolbarContentBuilder
    private func overflowMenu(_ detail: GoalDetailView) -> some ToolbarContent {
        ToolbarItem(placement: .topBarTrailing) {
            Menu {
                Button(GoalCopy.editGoal) { showsEdit = true }
                if detail.goal.status == .paused || detail.goal.status == .setAside {
                    Button(GoalCopy.resume) { Task { await setStatus(.active) } }
                } else if detail.statusOptions.contains(.paused) {
                    Button(GoalCopy.pause) { confirmPause = true }
                }
                if detail.statusOptions.contains(.setAside) {
                    Button(GoalCopy.setAside) { Task { await setStatus(.setAside) } }
                }
                if detail.statusOptions.contains(.completed) {
                    Button(GoalCopy.complete) { confirmComplete = true }
                }
                Button(GoalCopy.delete, role: .destructive) { confirmDelete = true }
            } label: {
                Label("Goal options", systemImage: "ellipsis.circle")
            }
        }
    }

    @ViewBuilder
    private var actionDialog: some View {
        if let action = actionMenu, let detail {
            Button(GoalCopy.discussAction) {
                CoachHandoff.open(
                    router,
                    prompt: CoachHandoff.discussAction(action.title, goal: detail.goal.title),
                    goalId: detail.goal.id,
                    conversationId: detail.conversations.first?.id)
                actionMenu = nil
            }
            Button(GoalCopy.allReports) {
                router.push(.actionHistory(goalId: goalId, actionId: action.id))
                actionMenu = nil
            }
            Button("Cancel", role: .cancel) { actionMenu = nil }
        }
    }

    // MARK: - Sheets

    @ViewBuilder
    private var rationaleSheet: some View {
        if let detail {
            PlanRationaleSheet(
                rationale: detail.rationale,
                timeZone: workspace.timeZone,
                onClose: { showsRationale = false })
        }
    }

    @ViewBuilder
    private var assumptionsSheet: some View {
        if let detail {
            ProjectionAssumptionsSheet(
                projection: detail.projection,
                timeZone: workspace.timeZone,
                onClose: { showsAssumptions = false })
        }
    }

    @ViewBuilder
    private var editSheet: some View {
        if let detail {
            EditGoalSheet(
                detail: detail,
                timeZone: workspace.timeZone,
                onCancel: { showsEdit = false },
                onSave: { changes in Task { await save(changes) } })
        }
    }

    @ViewBuilder
    private func reportSheet(_ action: ActionView) -> some View {
        ReportSheet(
            actionTitle: action.title,
            plannedDate: action.date.flatMap { GoalPresentation.date($0, in: workspace.timeZone) }
                ?? Date(),
            unit: action.measure.unit,
            asksMinutes: action.durationMinutes > 0,
            receipt: receipt,
            errorMessage: reportError,
            onSave: { draft in Task { await report(action, draft: draft) } },
            onCancel: { reportingAction = nil })
            .presentationDetents([.height(420), .large])
            .presentationDragIndicator(.visible)
    }

    // MARK: - Loading

    private var isEarlierPlan: Bool {
        detail.map(GoalDetailPresentation.isEarlierPlan) ?? false
    }

    private var completeMessage: String {
        String(format: GoalCopy.completeConfirm, detail?.success ?? "")
    }

    private func load() async {
        await workspace.loadGoal(id: goalId, plan: planVersion, milestone: milestoneFilter)
        scopedRevision = workspace.goalDetails[goalId]?.revision
        syncSelection()
    }

    #if DEBUG
    /// Screenshot hooks, in the style of the shell's `-route` and the design system's
    /// `-gallery`: `simctl openurl` cannot tap a sheet open, so a capture run asks for the
    /// state it wants. DEBUG only — compiled out of Release entirely.
    ///
    ///     xcrun simctl launch <udid> com.withadler.app \
    ///       -route adler://goals/portfolio -goalSheet rationale
    ///       [-goalMilestone case-study-1] [-goalPlan 1] [-goalPush milestone|history]
    private func applyScreenshotArguments() {
        let arguments = ProcessInfo.processInfo.arguments
        func value(_ flag: String) -> String? {
            guard let index = arguments.firstIndex(of: flag), index + 1 < arguments.count
            else { return nil }
            return arguments[index + 1]
        }
        if let milestone = value("-goalMilestone") {
            selectedMarkerId = milestone
            milestoneFilter = milestone
            Task { await load() }
        }
        if let plan = value("-goalPlan").flatMap(Int.init) {
            planVersion = plan
            Task { await load() }
        }
        switch value("-goalSheet") {
        case "rationale": showsRationale = true
        case "assumptions": showsAssumptions = true
        case "edit": showsEdit = true
        case "report":
            reportingAction = detail.flatMap {
                GoalDetailPresentation.defaultAction($0.planActions, today: $0.today)
            }
        default: break
        }
        switch value("-goalPush") {
        case "milestone":
            if let id = value("-goalMilestone") ?? detail?.milestones.first?.id {
                router.push(.milestone(goalId: goalId, id: id))
            }
        case "actionHistory":
            if let id = detail?.actions.first(where: { !$0.history.isEmpty })?.id
                ?? detail?.actions.first?.id
            {
                router.push(.actionHistory(goalId: goalId, actionId: id))
            }
        default: break
        }
    }
    #endif

    /// `WorkspaceStore.refreshVisible()` reloads a goal without the query scope, so an SSE
    /// revision would silently drop the selected milestone or plan version. Re-apply it once
    /// per revision when the payload comes back scoped differently from what is selected.
    private func reapplyScopeIfNeeded() {
        guard let detail, detail.revision != scopedRevision else {
            syncSelection()
            return
        }
        scopedRevision = detail.revision
        let planMismatch = planVersion != nil && detail.selectedPlanVersion != planVersion
        let milestoneMismatch = detail.selectedMilestoneId != milestoneFilter
        guard planMismatch || milestoneMismatch else {
            syncSelection()
            return
        }
        Task { await load() }
    }

    /// Keeps the marker and action selection pointing at records that still exist.
    private func syncSelection() {
        guard let detail else { return }
        if let id = selectedActionId, detail.planActions.contains(where: { $0.id == id }) {
            // still valid
        } else {
            selectedActionId = GoalDetailPresentation.defaultAction(
                detail.planActions, today: detail.today)?.id
        }
        if selectedMarkerId == nil {
            selectedMarkerId = detail.selectedMilestoneId
        }
    }

    // MARK: - Writes

    private func startPlan() async {
        writeError = nil
        do {
            _ = try await workspace.startGoal(id: goalId)
        } catch {
            writeError = error
        }
    }

    private func start(_ action: ActionView) async {
        writeError = nil
        do {
            _ = try await workspace.startAction(id: action.id, goalId: goalId)
        } catch {
            writeError = error
        }
    }

    private func report(_ action: ActionView, draft: ReportDraft) async {
        guard let outcome = draft.outcome,
            let values = GoalDetailPresentation.reportValues(draft)
        else { return }
        reportError = nil
        let mapped = values.outcome
        let amount = values.amount
        let minutes = values.minutes
        let isCorrection = action.outcome != nil || receipt != nil
        let previous = action.outcome.map {
            GoalDetailPresentation.receiptLine(outcome: $0, action: action)
        }
        do {
            if isCorrection {
                _ = try await workspace.correctAction(
                    id: action.id, goalId: goalId, outcome: mapped, amount: amount,
                    minutes: minutes, note: draft.note.isEmpty ? nil : draft.note)
            } else {
                _ = try await workspace.reportAction(
                    id: action.id, goalId: goalId, outcome: mapped, amount: amount,
                    minutes: minutes, note: draft.note.isEmpty ? nil : draft.note)
            }
            receipt = ReportReceipt(
                savedAt: Date(),
                outcome: outcome,
                amountText: draft.amount.map {
                    "\(GoalDetailPresentation.formatted($0)) \(action.measure.unit)"
                } ?? "amount not reported",
                correctedFrom: isCorrection ? previous : nil)
            reportingAction = workspace.goalDetails[goalId]?.action(action.id) ?? action
        } catch {
            reportError = error.serverMessage ?? error.errorDescription
            if case .staleRevision = error { writeError = error }
        }
    }

    private func setStatus(_ status: GoalStatus) async {
        writeError = nil
        do {
            _ = try await workspace.setGoalStatus(id: goalId, status: status)
        } catch {
            writeError = error
        }
    }

    private func deleteGoal() async {
        writeError = nil
        do {
            _ = try await workspace.deleteGoal(id: goalId)
            router.pop()
        } catch {
            writeError = error
        }
    }

    private func save(_ changes: [Change]) async {
        writeError = nil
        guard !changes.isEmpty else {
            showsEdit = false
            return
        }
        do {
            _ = try await workspace.apply(changes: changes, goalId: goalId)
            showsEdit = false
        } catch {
            writeError = error
            showsEdit = false
        }
    }

    private func retryWrite() async {
        do {
            _ = try await workspace.retryPendingWrite()
            writeError = nil
        } catch {
            writeError = error
        }
    }
}

#Preview {
    NavigationStack { GoalDetailRootView(goalId: "portfolio") }
}
