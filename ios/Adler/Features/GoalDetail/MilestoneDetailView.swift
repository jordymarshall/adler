import SwiftUI

/// A milestone: its success criterion, its due date, the work that contributes to it, and the
/// separate verification control.
///
/// Verifying is an outcome, not a by-product of finishing actions — the copy says so next to
/// the control, and the control writes `milestone.done` on its own.
struct MilestoneDetailView: View {
    let goalId: String
    let milestoneId: String

    @Environment(WorkspaceStore.self) private var workspace
    @Environment(AppRouter.self) private var router

    @State private var writeError: APIError?
    @State private var isSaving = false
    @State private var showsEdit = false

    private var detail: GoalDetailView? { workspace.goalDetails[goalId] }
    private var milestone: MilestoneView? { detail?.milestone(milestoneId) }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AdlerLayout.sectionGap) {
                if let error = writeError {
                    ErrorBanner(
                        kind: .server(detail: error.serverMessage ?? error.errorDescription),
                        actionTitle: "Dismiss", action: { writeError = nil },
                        onDismiss: { writeError = nil })
                }
                if let detail, let milestone {
                    header(detail, milestone)
                    verification(milestone)
                    contributing(detail, milestone)
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
        .navigationTitle("Milestone")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if milestone != nil {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(GoalCopy.editMilestone) { showsEdit = true }
                }
            }
        }
        .task {
            workspace.markVisible(.goal(goalId))
            if detail == nil { await workspace.loadGoal(id: goalId) }
        }
        .sheet(isPresented: $showsEdit) { editSheet }
    }

    // MARK: - Sections

    private func header(_ detail: GoalDetailView, _ milestone: MilestoneView) -> some View {
        VStack(alignment: .leading, spacing: Space.s) {
            Text("MILESTONE")
                .adlerText(.eyebrow)
                .foregroundStyle(Color.inkMuted)
                .accessibilityAddTraits(.isHeader)
            Text(milestone.title)
                .adlerText(.title2)
                .foregroundStyle(Color.inkHeading)
                .fixedSize(horizontal: false, vertical: true)
            HStack(spacing: Space.s) {
                AdlerChip(
                    label: milestone.statusLabel,
                    emphasis: milestone.done ? .filled : .outlined,
                    symbol: milestone.done ? "checkmark.seal.fill" : nil)
                Text(detail.goal.title)
                    .adlerText(.caption)
                    .foregroundStyle(Color.inkMuted)
            }
            VStack(alignment: .leading, spacing: Space.xxs) {
                Text(GoalCopy.resultToReach.uppercased())
                    .adlerText(.eyebrow)
                    .foregroundStyle(Color.inkMuted)
                Text(milestone.criterion.isEmpty ? "No criterion saved." : milestone.criterion)
                    .adlerText(.callout)
                    .foregroundStyle(Color.ink)
                    .fixedSize(horizontal: false, vertical: true)
            }
            if let due = milestone.dueDate,
                let date = GoalPresentation.date(due, in: workspace.timeZone)
            {
                Text("Due · \(AdlerDate.short(date))")
                    .adlerText(.subhead, numeric: true)
                    .foregroundStyle(Color.inkMuted)
            } else {
                Text("No due date saved.")
                    .adlerText(.subhead)
                    .foregroundStyle(Color.inkMuted)
            }
            if let completed = milestone.completedAt,
                let date = GoalPresentation.date(completed, in: workspace.timeZone)
            {
                Text("Verified · \(AdlerDate.short(date))")
                    .adlerText(.subhead, numeric: true)
                    .foregroundStyle(Color.ink)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(AdlerLayout.cardPadding)
        .adlerCard()
    }

    private func verification(_ milestone: MilestoneView) -> some View {
        VStack(alignment: .leading, spacing: Space.s) {
            Toggle(
                GoalCopy.markVerified,
                isOn: Binding(
                    get: { milestone.done },
                    set: { value in Task { await setDone(value) } })
            )
            .adlerText(.subhead)
            .disabled(isSaving)
            Text(GoalCopy.verifiedNote)
                .adlerText(.footnote)
                .foregroundStyle(Color.inkMuted)
                .fixedSize(horizontal: false, vertical: true)
            Text("Completing the actions below does not verify this milestone.")
                .adlerText(.footnote)
                .foregroundStyle(Color.inkMuted)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(AdlerLayout.cardPadding)
        .adlerCard()
    }

    private func contributing(_ detail: GoalDetailView, _ milestone: MilestoneView) -> some View {
        VStack(alignment: .leading, spacing: Space.s) {
            Text("CONTRIBUTING ACTIONS · \(milestone.actionIds.count)")
                .adlerText(.eyebrow, numeric: true)
                .foregroundStyle(Color.inkMuted)
                .accessibilityAddTraits(.isHeader)
            if milestone.actionIds.isEmpty {
                Text("No actions are linked to this milestone yet.")
                    .adlerText(.footnote)
                    .foregroundStyle(Color.inkMuted)
            }
            ForEach(milestone.actionIds, id: \.self) { id in
                if let action = detail.action(id) {
                    Button {
                        router.push(.actionHistory(goalId: goalId, actionId: action.id))
                    } label: {
                        HStack(spacing: Space.s) {
                            DayStateCell(
                                state: GoalPresentation.dayState(execution: action.execution),
                                goal: GoalColor.parse(detail.goal.color), size: 10)
                            Text(
                                action.date.flatMap {
                                    GoalPresentation.date($0, in: workspace.timeZone)
                                }
                                .map { AdlerDate.short($0) } ?? "No date"
                            )
                            .adlerText(.caption, numeric: true)
                            .foregroundStyle(Color.inkMuted)
                            .frame(width: 54, alignment: .leading)
                            Text(action.title)
                                .adlerText(.footnote)
                                .foregroundStyle(Color.ink)
                                .lineLimit(1)
                            Spacer(minLength: Space.s)
                            Text(action.executionLabel)
                                .adlerText(.caption)
                                .foregroundStyle(Color.inkMuted)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.vertical, Space.xs)
                        .contentShape(.rect)
                    }
                    .buttonStyle(.plain)
                    .accessibilityElement(children: .combine)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(AdlerLayout.cardPadding)
        .adlerCard()
    }

    @ViewBuilder
    private var editSheet: some View {
        if let milestone {
            EditMilestoneSheet(
                goalId: goalId,
                milestone: milestone,
                timeZone: workspace.timeZone,
                onCancel: { showsEdit = false },
                onSave: { change in Task { await save(change) } })
        }
    }

    // MARK: - Writes

    private func setDone(_ done: Bool) async {
        isSaving = true
        defer { isSaving = false }
        writeError = nil
        do {
            _ = try await workspace.setMilestoneDone(
                goalId: goalId, milestoneId: milestoneId, done: done)
        } catch {
            writeError = error
        }
    }

    private func save(_ change: Change) async {
        writeError = nil
        do {
            _ = try await workspace.apply(changes: [change], goalId: goalId)
            showsEdit = false
        } catch {
            writeError = error
            showsEdit = false
        }
    }
}

/// Title, criterion and due date. The verification state is not edited here — it has its own
/// control, so a rename can never read as a result.
struct EditMilestoneSheet: View {
    let goalId: String
    let milestone: MilestoneView
    let timeZone: TimeZone
    var onCancel: () -> Void
    var onSave: (Change) -> Void

    @State private var title: String
    @State private var criterion: String
    @State private var hasDueDate: Bool
    @State private var dueDate: Date

    init(
        goalId: String, milestone: MilestoneView, timeZone: TimeZone,
        onCancel: @escaping () -> Void, onSave: @escaping (Change) -> Void
    ) {
        self.goalId = goalId
        self.milestone = milestone
        self.timeZone = timeZone
        self.onCancel = onCancel
        self.onSave = onSave
        _title = State(initialValue: milestone.title)
        _criterion = State(initialValue: milestone.criterion)
        _hasDueDate = State(initialValue: milestone.dueDate != nil)
        _dueDate = State(
            initialValue: milestone.dueDate.flatMap { GoalPresentation.date($0, in: timeZone) }
                ?? Date())
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Milestone") {
                    TextField("Title", text: $title, axis: .vertical).lineLimit(1...3)
                    TextField("What counts as done", text: $criterion, axis: .vertical)
                        .lineLimit(1...4)
                }
                Section("Due date") {
                    Toggle("Has a due date", isOn: $hasDueDate)
                    if hasDueDate {
                        DatePicker("Due", selection: $dueDate, displayedComponents: .date)
                    }
                }
            }
            .navigationTitle(GoalCopy.editMilestone)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel", action: onCancel) }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { onSave(change) }
                        .disabled(!hasChanges)
                }
            }
        }
    }

    private var day: YMD? { hasDueDate ? YMD(dueDate, in: timeZone) : nil }

    private var hasChanges: Bool {
        title != milestone.title || criterion != milestone.criterion || day != milestone.dueDate
    }

    private var change: Change {
        ChangeBuilder.updateMilestone(
            goalId: goalId,
            milestoneId: milestone.id,
            title: title == milestone.title ? nil : title,
            criterion: criterion == milestone.criterion ? nil : criterion,
            dueDate: day == milestone.dueDate ? nil : .some(day),
            reason: "Edited in the app.")
    }
}
