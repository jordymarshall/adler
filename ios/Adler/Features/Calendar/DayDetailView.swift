import SwiftUI

// `CalendarRoute.day(date:)` — one day, its entries, and the controls each entry actually has
// (DESIGN.md §5.9). A tentative block offers the same controls as a booking, but never claims a
// booking or performed work: the chips say what is saved and what is not.

struct DayDetailView: View {
    let date: YMD

    @Environment(WorkspaceStore.self) private var workspace
    @Environment(AppRouter.self) private var router

    @State private var reporting: ReportTarget?
    @State private var placing: PlacementTarget?
    @State private var placementStart: Date?
    @State private var errorMessage: String?
    @State private var receipts: [String: String] = [:]
    @State private var removing: CalendarEntry?

    private var weekStart: YMD {
        CalendarWeek.monday(of: date, in: workspace.timeZone)
    }

    private var week: CalendarView? {
        workspace.calendars[date] ?? workspace.calendars[weekStart]
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AdlerLayout.sectionGap) {
                if let errorMessage {
                    ErrorBanner(kind: .server(detail: errorMessage)) { self.errorMessage = nil }
                }
                if let week {
                    content(week)
                } else if workspace.state(.calendar(weekStart)).isLoading {
                    SkeletonCard()
                } else if let error = workspace.state(.calendar(weekStart)).error {
                    ErrorBanner(kind: .server(detail: error.serverMessage)) {
                        Task { await workspace.loadCalendar(weekOf: date) }
                    }
                }
            }
            .padding(AdlerLayout.screenMargin)
        }
        .background(Color.canvas)
        .navigationTitle(title)
        .navigationBarTitleDisplayMode(.inline)
        .task {
            workspace.markVisible(.calendar(weekStart))
            await workspace.loadCalendar(weekOf: date)
        }
        .onDisappear { workspace.markHidden(.calendar(weekStart)) }
        .sheet(item: $reporting) { target in
            ReportSheet(
                actionTitle: target.title,
                plannedDate: target.date,
                asksMinutes: true,
                errorMessage: errorMessage,
                onSave: { draft in Task { await save(draft, for: target) } },
                onCancel: { reporting = nil })
                .presentationDetents([.height(420), .large])
                .presentationDragIndicator(.visible)
        }
        .sheet(item: $placing) { target in
            if let week {
                SchedulePlacementSheet(
                    target: target, week: week, palette: GoalPalette(workspace: workspace),
                    start: placementStart)
                    .presentationDetents([.large])
                    .presentationDragIndicator(.visible)
            }
        }
        .confirmationDialog(
            CalendarCopy.removeBlock, isPresented: removingBinding, titleVisibility: .visible
        ) {
            Button("Delete", role: .destructive) {
                if let removing { Task { await remove(removing) } }
            }
            Button("Cancel", role: .cancel) { removing = nil }
        } message: {
            Text(CalendarCopy.localOnly)
        }
    }

    private var title: String {
        guard let date = date.noon(in: workspace.timeZone) else { return self.date.raw }
        var calendar = YMD.calendar
        calendar.timeZone = workspace.timeZone
        return AdlerDate.weekdayShort(date, today: .now, calendar: calendar)
    }

    private var removingBinding: Binding<Bool> {
        Binding(get: { removing != nil }, set: { if !$0 { removing = nil } })
    }

    @ViewBuilder private func content(_ week: CalendarView) -> some View {
        let palette = GoalPalette(workspace: workspace)
        let entries = week.entries(on: date)
        if entries.isEmpty {
            EmptyStateView(title: EmptyStateCopy.noActionsToday.title)
        } else {
            VStack(alignment: .leading, spacing: Space.l) {
                ForEach(entries) { entry in
                    VStack(alignment: .leading, spacing: Space.s) {
                        AgendaRow(
                            entry: entry,
                            goalColor: palette.color(entry.goalId),
                            timeZone: week.resolvedTimeZone)
                        if let receipt = receipts[entry.id] {
                            CalendarNote(text: receipt, symbol: "checkmark.circle")
                        }
                        controls(entry, week: week)
                    }
                }
            }
        }
        CalendarNote(text: week.basis)
    }

    @ViewBuilder private func controls(_ entry: CalendarEntry, week: CalendarView) -> some View {
        if let actionId = entry.actionId, let goalId = entry.goalId {
            VStack(alignment: .leading, spacing: Space.s) {
                if case .tentative = entry.kind {
                    CalendarNote(text: CalendarCopy.tentativeNote)
                }
                FlowLayout(spacing: Space.s, lineSpacing: Space.s) {
                    AdlerSecondaryButton(title: "Start") {
                        Task { await start(actionId: actionId, goalId: goalId, entry: entry) }
                    }
                    AdlerSecondaryButton(title: "Report") {
                        reporting = ReportTarget(
                            id: entry.id, actionId: actionId, goalId: goalId,
                            title: entry.title, date: entry.start)
                    }
                    AdlerQuietButton(title: "Move") {
                        placementStart = entry.start
                        placing = PlacementTarget(
                            actionId: actionId, goalId: goalId,
                            goalTitle: entry.goalTitle ?? "", title: entry.title,
                            durationMinutes: max(
                                5, Int(entry.end.timeIntervalSince(entry.start) / 60)))
                    }
                    AdlerQuietButton(title: "Open goal") { router.openGoal(id: goalId) }
                    if case .adlerBlock = entry.kind {
                        AdlerQuietButton(title: CalendarCopy.removeBlock, role: .destructive) {
                            removing = entry
                        }
                    }
                }
            }
        }
    }

    // MARK: Calls

    private func start(actionId: String, goalId: String, entry: CalendarEntry) async {
        errorMessage = nil
        do {
            _ = try await workspace.startAction(id: actionId, goalId: goalId)
            receipts[entry.id] = "Started \(AdlerDate.time(.now)) · not yet reported"
        } catch {
            errorMessage = error.serverMessage ?? error.errorDescription
        }
    }

    private func save(_ draft: ReportDraft, for target: ReportTarget) async {
        errorMessage = nil
        guard let outcome = draft.outcome.flatMap({ Outcome(rawValue: $0.rawValue) }) else { return }
        do {
            try await workspace.reportAction(
                id: target.actionId, goalId: target.goalId, outcome: outcome,
                minutes: draft.minutes.map(Double.init),
                note: draft.note.isEmpty ? nil : draft.note,
                reason: "Reported from the calendar.")
            receipts[target.id] =
                "Saved \(AdlerDate.time(.now)) · \(outcome.rawValue)"
            reporting = nil
            await workspace.loadCalendar(weekOf: date)
        } catch {
            errorMessage = error.serverMessage ?? error.errorDescription
        }
    }

    private func remove(_ entry: CalendarEntry) async {
        removing = nil
        errorMessage = nil
        guard let actionId = entry.actionId, let goalId = entry.goalId else { return }
        do {
            try await workspace.deleteWorkBlock(id: actionId, goalId: goalId, weekOf: date)
            receipts[entry.id] = nil
        } catch {
            errorMessage = error.serverMessage ?? error.errorDescription
        }
    }
}

/// Which entry the ReportSheet is open for.
nonisolated struct ReportTarget: Identifiable, Equatable, Sendable {
    let id: String
    let actionId: String
    let goalId: String
    let title: String
    let date: Date
}
