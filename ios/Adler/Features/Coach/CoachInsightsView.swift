import SwiftUI

/// Coach → Insights (DESIGN.md §5.8). Question-first: what needs my input, what is being tried
/// now, what has been learned, what I told Adler — and, separately, what Adler has saved about
/// me. Saved context never sits inside a section that reads like a tested finding.
struct CoachInsightsSurface: View {
    @Environment(WorkspaceStore.self) private var workspace
    @Environment(AppRouter.self) private var router

    @State private var goalFilter: String?
    @State private var showsHistory = false
    @State private var showsMemories = false
    @State private var editingMemory: MemoryView?
    @State private var deletingMemory: MemoryView?
    @State private var memoryText = ""
    @State private var isAddingMemory = false
    @State private var error: String?

    private var view: InsightsView? { workspace.insights }
    private var state: LoadState { workspace.state(.insights) }

    private var attention: [LearningRow] {
        (view?.tryingNow ?? [])
            .filter { $0.attentionReason != nil }
            .sorted { ($0.attentionReason ?? .suggested) < ($1.attentionReason ?? .suggested) }
    }

    private var running: [LearningRow] {
        (view?.tryingNow ?? []).filter { $0.attentionReason == nil }
    }

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: AdlerLayout.sectionGap) {
                filters
                if let error {
                    ErrorBanner(kind: .server(detail: error), onDismiss: { self.error = nil })
                }
                if let loadError = state.error, view == nil {
                    ErrorBanner(
                        kind: .server(detail: loadError.serverMessage),
                        actionTitle: CoachCopy.retry, action: { Task { await load() } })
                } else if view == nil && state.isLoading {
                    SkeletonCard()
                    SkeletonCard()
                } else if isEmpty {
                    EmptyStateView(
                        title: CoachCopy.emptyNoInsights,
                        message: CoachCopy.emptyNoInsightsBody,
                        actionTitle: CoachCopy.discussWithAdler,
                        action: { router.coachSegment = .conversation })
                } else {
                    if !attention.isEmpty {
                        section(CoachCopy.needsYourInput, rows: attention, showsReason: true)
                    }
                    if !running.isEmpty {
                        section(CoachCopy.tryingNow, rows: running, showsReason: false)
                    }
                    learnedSection
                    observationsSection
                    historyDisclosure
                    memoriesDisclosure
                }
            }
            .padding(AdlerLayout.screenMargin)
        }
        .background(Color.canvas)
        .overlay(alignment: .top) {
            if state.isLoading && view != nil { RefreshHairline() }
        }
        .task(id: goalFilter) { await load() }
        .onDisappear { workspace.markHidden(.insights) }
        .alert(
            isAddingMemory ? CoachCopy.addMemory : CoachCopy.edit,
            isPresented: Binding(
                get: { isAddingMemory || editingMemory != nil },
                set: { if !$0 { isAddingMemory = false; editingMemory = nil } })
        ) {
            TextField(CoachCopy.memories, text: $memoryText, axis: .vertical)
            Button(CoachCopy.cancel, role: .cancel) { isAddingMemory = false; editingMemory = nil }
            Button(CoachCopy.save) { Task { await saveMemory() } }
        }
        .confirmationDialog(
            CoachCopy.deleteMemoryConfirm,
            isPresented: Binding(
                get: { deletingMemory != nil }, set: { if !$0 { deletingMemory = nil } }),
            titleVisibility: .visible
        ) {
            Button(CoachCopy.delete, role: .destructive) { Task { await deleteMemory() } }
            Button(CoachCopy.cancel, role: .cancel) { deletingMemory = nil }
        }
    }

    private var isEmpty: Bool {
        guard let view else { return false }
        return view.tryingNow.isEmpty && view.learned.isEmpty && view.history.isEmpty
            && view.observations.isEmpty && view.memories.isEmpty
    }

    // MARK: Filter

    private var filters: some View {
        ScrollView(.horizontal) {
            HStack(spacing: Space.s) {
                filterChip(title: CoachCopy.filterAll, id: nil)
                ForEach(view?.goals ?? []) { goal in
                    filterChip(title: goal.title, id: goal.id)
                }
            }
            .padding(.vertical, Space.xxs)
        }
        .scrollIndicators(.hidden)
        .accessibilityLabel(CoachCopy.filterAll)
    }

    private func filterChip(title: String, id: String?) -> some View {
        Button {
            goalFilter = id
        } label: {
            AdlerChip(label: title, emphasis: goalFilter == id ? .filled : .outlined)
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(goalFilter == id ? [.isSelected, .isButton] : .isButton)
    }

    // MARK: Learning sections

    private func section(_ title: String, rows: [LearningRow], showsReason: Bool) -> some View {
        VStack(alignment: .leading, spacing: Space.m) {
            SectionHeading("\(title) · \(rows.count)")
            ForEach(rows) { row in
                VStack(alignment: .leading, spacing: Space.xs) {
                    LearningRowView(row: row, onOpen: { router.push(.record(id: row.recordId)) })
                    if showsReason, let reason = row.attentionReason {
                        Text(sentence(for: reason))
                            .adlerText(.footnote)
                            .foregroundStyle(Color.inkMuted)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
            }
        }
    }

    /// One saved sentence per attention case, from COPY.md §5c. None of them says a test worked.
    private func sentence(for reason: CoachAttention) -> String {
        switch reason {
        case .reconsider: CoachCopy.reconsider
        case .readyToReview: CoachCopy.notAResult
        case .pendingRevision: CoachCopy.pendingDecision
        case .suggested: CoachCopy.suggestionOnly
        }
    }

    @ViewBuilder
    private var learnedSection: some View {
        let rows = view?.learned ?? []
        if !rows.isEmpty {
            VStack(alignment: .leading, spacing: Space.m) {
                SectionHeading(CoachCopy.learned)
                ForEach(rows) { row in
                    FindingRow(row: row, onOpen: { router.push(.record(id: row.recordId)) })
                }
            }
        }
    }

    @ViewBuilder
    private var observationsSection: some View {
        let rows = view?.observations ?? []
        if !rows.isEmpty {
            VStack(alignment: .leading, spacing: Space.m) {
                SectionHeading(CoachCopy.observations)
                ForEach(rows) { row in
                    ObservationRowView(row: row, timeZone: workspace.timeZone)
                }
            }
        }
    }

    @ViewBuilder
    private var historyDisclosure: some View {
        let rows = view?.history ?? []
        if !rows.isEmpty {
            DisclosureGroup(isExpanded: $showsHistory) {
                VStack(alignment: .leading, spacing: Space.m) {
                    ForEach(rows) { row in
                        LearningRowView(
                            row: row, onOpen: { router.push(.record(id: row.recordId)) })
                    }
                }
                .padding(.top, Space.s)
            } label: {
                Text("\(CoachCopy.insightsHistory) · \(rows.count)")
                    .adlerText(.headline)
                    .foregroundStyle(Color.inkHeading)
            }
        }
    }

    private var memoriesDisclosure: some View {
        DisclosureGroup(isExpanded: $showsMemories) {
            VStack(alignment: .leading, spacing: Space.m) {
                ForEach(view?.memories ?? []) { memory in
                    MemoryRow(
                        memory: memory, timeZone: workspace.timeZone,
                        onEdit: {
                            memoryText = memory.text
                            editingMemory = memory
                        },
                        onDelete: { deletingMemory = memory })
                }
                AdlerQuietButton(title: CoachCopy.addMemory, systemImage: "plus") {
                    memoryText = ""
                    isAddingMemory = true
                }
            }
            .padding(.top, Space.s)
        } label: {
            Text("\(CoachCopy.memories) · \(view?.memories.count ?? 0)")
                .adlerText(.headline)
                .foregroundStyle(Color.inkHeading)
        }
    }

    // MARK: Loading and writes

    private func load() async {
        workspace.markVisible(.insights)
        await workspace.loadInsights(goalId: goalFilter)
    }

    private func saveMemory() async {
        let text = memoryText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        do {
            try await workspace.saveMemory(id: editingMemory?.id, text: text)
            error = nil
        } catch {
            self.error = error.serverMessage ?? error.errorDescription
        }
        isAddingMemory = false
        editingMemory = nil
    }

    private func deleteMemory() async {
        guard let deletingMemory else { return }
        do {
            try await workspace.deleteMemory(id: deletingMemory.id)
            error = nil
        } catch {
            self.error = error.serverMessage ?? error.errorDescription
        }
        self.deletingMemory = nil
    }
}

// MARK: - Rows

/// `LearningSummaryRow` when the record has a saved start, and a compact row when it does not —
/// a timeline is never drawn from an invented start date.
struct LearningRowView: View {
    let row: LearningRow
    var onOpen: (() -> Void)?

    @Environment(WorkspaceStore.self) private var workspace

    var body: some View {
        if let content = row.summaryRow(in: workspace.timeZone) {
            LearningSummaryRow(content: content, onOpen: onOpen)
        } else {
            Button { onOpen?() } label: { undated }.buttonStyle(.plain)
        }
    }

    private var undated: some View {
        VStack(alignment: .leading, spacing: Space.s) {
            HStack(alignment: .top, spacing: Space.s) {
                Text(row.goals.first?.title ?? "")
                    .adlerText(.eyebrow)
                    .foregroundStyle(Color.inkMuted)
                Spacer(minLength: Space.s)
                StatusChipPair(workflow: row.statusLabel, standing: row.standingLabel)
            }
            Text(row.change)
                .adlerText(.headline)
                .foregroundStyle(Color.inkHeading)
                .fixedSize(horizontal: false, vertical: true)
            Text(
                "\(row.reports == 0 ? CoachCopy.noAttempts : CoachCopy.attempts(row.reports)) · \(row.timingLabel)"
            )
            .adlerText(.footnote, numeric: true)
            .foregroundStyle(Color.inkMuted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(AdlerLayout.cardPadding)
        .adlerCard()
    }
}

/// A finding under `What we've learned`: scope (its goals), evidence standing, and the planning
/// consequence the review actually recorded.
private struct FindingRow: View {
    let row: LearningRow
    var onOpen: (() -> Void)?

    var body: some View {
        Button { onOpen?() } label: {
            VStack(alignment: .leading, spacing: Space.s) {
                HStack(alignment: .top, spacing: Space.s) {
                    Text(row.goals.map(\.title).joined(separator: " · "))
                        .adlerText(.eyebrow)
                        .foregroundStyle(Color.inkMuted)
                    Spacer(minLength: Space.s)
                    StatusChipPair(workflow: row.statusLabel, standing: row.standingLabel)
                }
                Text(row.latestReview?.summary ?? row.change)
                    .adlerText(.headline)
                    .foregroundStyle(Color.inkHeading)
                    .fixedSize(horizontal: false, vertical: true)
                if let implication = row.latestReview?.implication {
                    LabelledLine(label: CoachCopy.recordForPlan, text: implication)
                }
                if let question = row.latestReview?.nextQuestion {
                    LabelledLine(label: CoachCopy.recordNextQuestion, text: question)
                }
                Text(row.timingLabel)
                    .adlerText(.footnote, numeric: true)
                    .foregroundStyle(Color.inkMuted)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(AdlerLayout.cardPadding)
            .adlerCard()
        }
        .buttonStyle(.plain)
    }
}

/// An attributable observation. Two parts only — what you told Adler, and how it shapes the plan
/// — with no hypothesis/test/result scaffolding when there is no test (DESIGN.md §5.8).
private struct ObservationRowView: View {
    let row: ObservationRow
    let timeZone: TimeZone

    var body: some View {
        VStack(alignment: .leading, spacing: Space.s) {
            HStack(alignment: .top, spacing: Space.s) {
                Text(row.goalTitle)
                    .adlerText(.eyebrow)
                    .foregroundStyle(Color.inkMuted)
                Spacer(minLength: Space.s)
                AdlerChip(label: row.statusLabel)
                AdlerChip(label: row.changeStatus, emphasis: .outlined)
            }
            LabelledLine(label: CoachCopy.told, text: row.headline)
            LabelledLine(
                label: row.implicationLabel,
                text: row.implication.isEmpty ? CoachCopy.noChange : row.implication)
            if !row.sources.isEmpty {
                VStack(alignment: .leading, spacing: Space.xxs) {
                    ForEach(row.sources) { source in
                        Text("\(source.label) — \(source.text)")
                            .adlerText(.footnote)
                            .foregroundStyle(Color.inkMuted)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
            }
            Text(CoachDates.short(row.date, in: timeZone) ?? row.date.raw)
                .adlerText(.footnote, numeric: true)
                .foregroundStyle(Color.inkMuted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(AdlerLayout.cardPadding)
        .adlerWell()
        .accessibilityElement(children: .combine)
    }
}

private struct MemoryRow: View {
    let memory: MemoryView
    let timeZone: TimeZone
    var onEdit: () -> Void
    var onDelete: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: Space.xs) {
            Text(memory.text)
                .adlerText(.callout)
                .foregroundStyle(Color.ink)
                .fixedSize(horizontal: false, vertical: true)
            HStack(spacing: Space.m) {
                Text(CoachDates.short(memory.date, in: timeZone) ?? memory.date.raw)
                    .adlerText(.footnote, numeric: true)
                    .foregroundStyle(Color.inkMuted)
                if memory.corrected {
                    AdlerChip(label: "Corrected", emphasis: .attention)
                }
                Spacer(minLength: Space.s)
                AdlerQuietButton(title: CoachCopy.edit, action: onEdit)
                AdlerQuietButton(title: CoachCopy.delete, role: .destructive, action: onDelete)
            }
            ForEach(memory.corrections) { correction in
                Text(correction.reason)
                    .adlerText(.footnote)
                    .foregroundStyle(Color.inkMuted)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(AdlerLayout.cardPadding)
        .adlerWell()
    }
}

/// `Label: text` where the label is the server's own, or one of COPY.md's fixed leaders.
struct LabelledLine: View {
    let label: String
    let text: String

    var body: some View {
        VStack(alignment: .leading, spacing: Space.xxs) {
            Text(label)
                .adlerText(.eyebrow)
                .foregroundStyle(Color.inkMuted)
            Text(text)
                .adlerText(.callout)
                .foregroundStyle(Color.ink)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .combine)
    }
}
