import SwiftUI

/// The pushed conversation (`adler://coach/<conversationId>`, `CoachRoute.conversation`).
struct ConversationView: View {
    let conversationId: String

    @Environment(WorkspaceStore.self) private var workspace

    var body: some View {
        ConversationSurface(conversationId: conversationId)
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
    }

    private var title: String {
        workspace.coach?.conversations.first { $0.id == conversationId }?.title
            ?? workspace.conversations[conversationId]?.conversations
            .first { $0.id == conversationId }?.title
            ?? CoachCopy.title
    }
}

// MARK: - The surface

/// Thread → composer (DESIGN.md §5.7). `CoachRootView` puts the conversation picker above it;
/// the pushed `ConversationView` shows it alone under the conversation's title.
///
/// `conversationId == nil` is the coach *list* route: no messages, the welcome block, and the
/// pending proposals that are not attached to any conversation — so nothing awaiting a decision
/// is unreachable.
struct ConversationSurface: View {
    let conversationId: String?

    @Environment(WorkspaceStore.self) private var workspace
    @Environment(AppRouter.self) private var router
    @Environment(ConnectivityMonitor.self) private var connectivity

    @State private var draft = ""
    @State private var sendStartedAt: Date?
    @State private var elapsed: TimeInterval = 0
    @State private var failure: CoachSendFailure?
    @State private var stopped = false
    @State private var showsFailureDetail = false
    @State private var evidence: EvidenceSheetContent?
    @State private var preview: ProposalPreviewRequest?
    @State private var isDeciding = false
    @State private var sendTask: Task<Void, Never>?

    private var view: CoachView? {
        conversationId.flatMap { workspace.conversations[$0] } ?? workspace.coach
    }

    private var loadState: LoadState {
        workspace.state(conversationId.map { ViewKey.conversation($0) } ?? .coach)
    }

    private var items: [CoachThreadItem] {
        guard let view else { return [] }
        return CoachThread.items(
            messages: conversationId == nil ? [] : view.messages,
            proposals: conversationId == nil
                ? view.proposals.filter { $0.conversationId == nil } : view.proposals,
            goals: view.goals,
            insights: workspace.insights,
            timeZone: workspace.timeZone)
    }

    var body: some View {
        VStack(spacing: 0) {
            banners
            thread
            composer
        }
        .background(Color.canvas)
        .task(id: conversationId) { await load() }
        .onDisappear {
            workspace.markHidden(.coach)
            if let conversationId { workspace.markHidden(.conversation(conversationId)) }
            saveDraft()
        }
        .sheet(item: $evidence) { content in
            EvidenceDisclosureSheet(content: content)
        }
        .sheet(item: $preview) { request in
            previewSheet(request)
        }
    }

    private func previewSheet(_ request: ProposalPreviewRequest) -> ProposalPreviewSheet {
        let proposal = request.proposal
        var approve: (() async -> Void)?
        var dismiss: (() async -> Void)?
        if request.canDecide {
            approve = { await decide(proposal, approve: true) }
            dismiss = { await decide(proposal, approve: false) }
        }
        return ProposalPreviewSheet(proposal: proposal, onApprove: approve, onDismiss: dismiss)
    }

    // MARK: Banners

    @ViewBuilder
    private var banners: some View {
        VStack(spacing: Space.s) {
            if let model = view?.model, !model.configured {
                ErrorBanner(
                    kind: .noProvider, actionTitle: CoachCopy.errorNoProviderAction,
                    action: { router.presentSettings(page: .provider) })
            }
            if let error = loadState.error, view == nil {
                ErrorBanner(
                    kind: .server(detail: error.serverMessage), actionTitle: CoachCopy.retry,
                    action: { Task { await load() } })
            }
            if stopped {
                VStack(alignment: .leading, spacing: Space.xs) {
                    ErrorBanner(
                        kind: .timeout, actionTitle: CoachCopy.retry,
                        action: { Task { await retry() } }, onDismiss: { stopped = false })
                    Text(CoachCopy.stoppedWaiting)
                        .adlerText(.footnote)
                        .foregroundStyle(Color.inkMuted)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            if let failure { failureBanner(failure) }
        }
        .padding(.horizontal, hasBanner ? AdlerLayout.screenMargin : 0)
        .padding(.bottom, hasBanner ? Space.s : 0)
    }

    private var hasBanner: Bool {
        failure != nil || stopped || view?.model.configured == false
            || (loadState.error != nil && view == nil)
    }

    @ViewBuilder
    private func failureBanner(_ failure: CoachSendFailure) -> some View {
        VStack(alignment: .leading, spacing: Space.xs) {
            ErrorBanner(
                kind: .server(detail: failure.isLong ? nil : failure.message),
                actionTitle: failure.canRetrySameRequest ? CoachCopy.retry : nil,
                action: failure.canRetrySameRequest ? { Task { await retry() } } : nil,
                onDismiss: { self.failure = nil })
            if case .rateLimited = failure {
                Text(CoachCopy.rateLimitWait)
                    .adlerText(.footnote)
                    .foregroundStyle(Color.inkMuted)
            }
            if failure.isLong {
                DisclosureGroup(isExpanded: $showsFailureDetail) {
                    Text(failure.message)
                        .adlerText(.footnote)
                        .foregroundStyle(Color.inkMuted)
                        .textSelection(.enabled)
                } label: {
                    Text(CoachCopy.whatHappened)
                        .adlerText(.subhead)
                        .foregroundStyle(Color.accentInk)
                }
            }
        }
    }

    // MARK: Thread

    private var thread: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(alignment: .leading, spacing: Space.l) {
                    if items.isEmpty && !loadState.isLoading {
                        welcome
                    }
                    ForEach(items) { item in
                        row(item).id(item.id)
                    }
                    if loadState.isLoading && view == nil {
                        SkeletonCard()
                    }
                    if workspace.isSendingCoachMessage { inProgress }
                    Color.clear.frame(height: 1).id(Self.bottomAnchor)
                }
                .padding(AdlerLayout.screenMargin)
            }
            .accessibilityLabel(CoachCopy.threadLabel)
            .accessibilityAddTraits(.updatesFrequently)
            .onChange(of: items.count) { _, _ in scroll(proxy) }
            .onChange(of: workspace.isSendingCoachMessage) { _, _ in scroll(proxy) }
            .onAppear { scroll(proxy, animated: false) }
        }
    }

    private static let bottomAnchor = "coach-thread-bottom"

    private func scroll(_ proxy: ScrollViewProxy, animated: Bool = true) {
        guard !items.isEmpty || workspace.isSendingCoachMessage else { return }
        if animated {
            withAnimation(.easeOut(duration: 0.2)) { proxy.scrollTo(Self.bottomAnchor, anchor: .bottom) }
        } else {
            proxy.scrollTo(Self.bottomAnchor, anchor: .bottom)
        }
    }

    @ViewBuilder
    private var welcome: some View {
        let goalTitle = view?.conversations.first { $0.id == conversationId }?.goalTitle
        EmptyStateView(
            title: CoachCopy.welcomeGoals,
            message: goalTitle.map { CoachCopy.welcomeGoal($0) } ?? CoachCopy.welcomeBody)
    }

    @ViewBuilder
    private func row(_ item: CoachThreadItem) -> some View {
        switch item {
        case .message(let message):
            ConversationBubble(message: bubble(message))
        case .recommendation(let recommendation):
            VStack(alignment: .leading, spacing: Space.s) {
                recommendationCard(recommendation)
                if let proposal = recommendation.proposal {
                    // The concrete change the recommendation would make. Its decision controls
                    // stay on the card above: one decision, one set of controls.
                    ProposalCard(
                        content: proposal.content(state: .pending, in: workspace.timeZone),
                        onReviewChanges: {
                            preview = ProposalPreviewRequest(proposal: proposal, canDecide: false)
                        })
                }
            }
        case .proposal(let item):
            ProposalCard(
                content: item.proposal.content(state: .pending, in: workspace.timeZone),
                onApprove: { Task { await decide(item.proposal, approve: true) } },
                onDismiss: { Task { await decide(item.proposal, approve: false) } },
                onReviewChanges: {
                    preview = ProposalPreviewRequest(proposal: item.proposal, canDecide: true)
                },
                onWhyThis: evidenceContent(for: item.proposal).map { content in
                    { evidence = content }
                })
        }
    }

    private func bubble(_ item: CoachMessageItem) -> ConversationMessage {
        let message = item.message
        // The route is resolved here, on the main actor, and only the (Sendable) route and
        // router travel into the link's closure.
        let router = router
        var links = message.links.map { link in
            let route = AppRoute.goal(id: link.goalId, recordId: nil)
            return MessageLink(
                id: "\(message.id)-\(link.goalId)-\(link.tab.rawValue)",
                title: message.linkTitle(link),
                action: { Task { @MainActor in router.go(route) } })
        }
        links += message.references.map { reference in
            let route = referenceRoute(reference.recordId)
            return MessageLink(
                id: "\(message.id)-ref-\(reference.recordId)",
                title: reference.text,
                action: { Task { @MainActor in router.go(route) } })
        }
        var bubble = message.bubble(links: links)
        if !item.showsTimestamp { bubble.timestamp = nil }
        return bubble
    }

    /// A reference can name a learning record or a saved memory; both live behind Insights.
    private func referenceRoute(_ recordId: String) -> AppRoute {
        if workspace.insights?.memories.contains(where: { $0.id == recordId }) == true {
            return .insights(recordId: nil, decisionId: nil, memoryId: recordId)
        }
        return .insights(recordId: recordId, decisionId: nil, memoryId: nil)
    }

    @ViewBuilder
    private func recommendationCard(_ item: CoachRecommendationItem) -> some View {
        let decision = item.decision
        RecommendationCard(
            content: item.recommendation.content(
                goal: item.goal, state: decision.state, stateLabel: decision.stateLabel,
                methods: item.methods),
            onTryThis: decision.binding.allowsAgree ? { Task { await agree(item) } } : nil,
            onNoThanks: decision.binding.allowsDecline ? { Task { await decline(item) } } : nil,
            onDiscuss: { prefill(decision.discussPrompt) },
            onEdit: { prefill(CoachCopy.editPrefill(item.recommendation.action)) },
            onCorrect: { prefill(CoachCopy.editPrefill(item.recommendation.action)) },
            onWhyThis: { evidence = evidenceContent(for: item) })
    }

    @ViewBuilder
    private var inProgress: some View {
        VStack(alignment: .leading, spacing: Space.xs) {
            ConversationBubble(
                message: ConversationMessage(id: "in-progress", role: .coach, inProgress: true))
            HStack(spacing: Space.s) {
                Text(CoachProgress.stage(elapsed: elapsed).label)
                    .adlerText(.footnote)
                Text(CoachProgress.elapsedLabel(elapsed))
                    .adlerText(.footnote, numeric: true)
            }
            .foregroundStyle(Color.inkMuted)
            .accessibilityElement(children: .combine)
        }
        .task(id: sendStartedAt) { await tick() }
    }

    private func tick() async {
        guard let start = sendStartedAt else { return }
        while !Task.isCancelled && workspace.isSendingCoachMessage {
            elapsed = Date().timeIntervalSince(start)
            try? await Task.sleep(for: .seconds(1))
        }
    }

    // MARK: Composer

    private var composer: some View {
        Composer(
            text: $draft,
            quickPrompts: (view?.quickPrompts ?? []).map(\.prompt),
            isResponding: workspace.isSendingCoachMessage,
            onSend: { sendTask = Task { await send() } },
            // The turn keeps running on the server — this stops *waiting* for it. The
            // `requestId` is kept, so `Retry` replays the saved answer instead of paying for a
            // second one (`Core/README.md` "Coach turns").
            onStop: { sendTask?.cancel() })
        .disabled(canSend == false && !workspace.isSendingCoachMessage)
        .onChange(of: draft) { _, _ in saveDraft() }
    }

    private var canSend: Bool {
        connectivity.isOnline && view?.model.configured != false
    }

    private func prefill(_ text: String) {
        draft = text
        saveDraft()
    }

    // MARK: Loading

    private func load() async {
        restoreDraft()
        workspace.markVisible(.coach)
        await workspace.loadCoach()
        if let conversationId {
            workspace.markVisible(.conversation(conversationId))
            await workspace.loadConversation(id: conversationId)
        }
        // The recommendation controls are wired from the saved learning state, which lives in
        // the insights payload. Without it a card cannot know whether agreeing is still open.
        if workspace.insights == nil { await workspace.loadInsights() }
    }

    // MARK: Writes

    private func send() async {
        let text = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        failure = nil
        stopped = false
        sendStartedAt = Date()
        elapsed = 0
        do {
            let reply = try await workspace.sendCoachMessage(
                text: text,
                goalId: view?.conversations.first { $0.id == conversationId }?.goalId,
                conversationId: conversationId)
            draft = ""
            saveDraft()
            await workspace.loadInsights()
            if conversationId == nil { router.openConversation(id: reply.conversationId) }
        } catch {
            if case .transport(_, .cancelled) = error {
                stopped = true
                await workspace.loadCoach()
                if let conversationId { await workspace.loadConversation(id: conversationId) }
            } else {
                failure = CoachSendFailure(error)
                draft = text
            }
        }
        sendStartedAt = nil
    }

    private func retry() async {
        failure = nil
        stopped = false
        sendStartedAt = Date()
        elapsed = 0
        do {
            if try await workspace.retryCoachMessage() != nil {
                draft = ""
                saveDraft()
                await workspace.loadInsights()
            }
        } catch {
            failure = CoachSendFailure(error)
        }
        sendStartedAt = nil
    }

    private func agree(_ item: CoachRecommendationItem) async {
        switch item.decision.binding {
        case .proposal(let id, let goalId):
            await run { try await workspace.approveProposal(id: id, goalId: goalId) }
        case .learning(let recordId, let version, _, _):
            await run {
                try await workspace.learningAction(
                    recordId: recordId, action: .agree, version: version)
            }
        case .unbound:
            break
        }
    }

    private func decline(_ item: CoachRecommendationItem) async {
        switch item.decision.binding {
        case .proposal(let id, let goalId):
            await run { try await workspace.dismissProposal(id: id, goalId: goalId) }
        case .learning(let recordId, _, let version, _):
            await run {
                try await workspace.learningAction(
                    recordId: recordId, action: .decline, version: version)
            }
        case .unbound:
            break
        }
    }

    private func decide(_ proposal: ProposalView, approve: Bool) async {
        await run {
            if approve {
                try await workspace.approveProposal(id: proposal.id, goalId: proposal.goalId)
            } else {
                try await workspace.dismissProposal(id: proposal.id, goalId: proposal.goalId)
            }
        }
        preview = nil
    }

    private func run(_ body: () async throws -> Void) async {
        isDeciding = true
        defer { isDeciding = false }
        do {
            try await body()
            await reloadAfterDecision()
        } catch let error as APIError {
            failure = CoachSendFailure(error)
        } catch {
            failure = .server(message: error.localizedDescription)
        }
    }

    private func reloadAfterDecision() async {
        await workspace.loadCoach()
        if let conversationId { await workspace.loadConversation(id: conversationId) }
        await workspace.loadInsights()
    }

    // MARK: Evidence

    private func evidenceContent(for item: CoachRecommendationItem) -> EvidenceSheetContent {
        let recommendation = item.recommendation
        return EvidenceSheetContent(
            id: item.id,
            record: EvidenceBuilder.record(
                reasoning: recommendation.reasoning,
                grounding: recommendation.grounding,
                sources: recommendation.sources,
                diagram: ReasoningDiagramContent(
                    reports: recommendation.observation,
                    research: recommendation.methodReference(methods: item.methods)
                        ?? recommendation.reasoning.methodId,
                    explanation: recommendation.reasoning.mechanism,
                    action: recommendation.action,
                    laterFeedback: laterFeedback(for: recommendation.action),
                    goalColor: item.goal.color),
                timeZone: workspace.timeZone))
    }

    private func evidenceContent(for proposal: ProposalView) -> EvidenceSheetContent? {
        guard let recommendation = proposal.recommendations.first else { return nil }
        return EvidenceSheetContent(
            id: proposal.id,
            record: EvidenceBuilder.record(
                reasoning: recommendation.reasoning,
                grounding: recommendation.grounding,
                sources: recommendation.sources,
                diagram: nil,
                timeZone: workspace.timeZone))
    }

    /// Dated feedback for the diagram, read off the saved learning record. Nothing is derived:
    /// with no record and no reports the diagram says so itself.
    private func laterFeedback(for action: String) -> String? {
        guard
            let row = CoachDecision.learningRow(
                decisionId: nil, action: action, insights: workspace.insights)
        else { return nil }
        let dates = row.attempts.compactMap {
            CoachDates.short($0.date, in: workspace.timeZone)
        }
        let review = CoachDates.short(
            row.nextReviewAfter ?? row.reviewAfter, in: workspace.timeZone)
        let parts = dates + (review.map { ["Review \($0)"] } ?? [])
        return parts.isEmpty ? nil : parts.joined(separator: " · ")
    }

    // MARK: Drafts

    private var draftKey: String { "adler.coach.draft.\(conversationId ?? "general")" }

    private func restoreDraft() {
        draft = UserDefaults.standard.string(forKey: draftKey) ?? ""
    }

    private func saveDraft() {
        if draft.isEmpty {
            UserDefaults.standard.removeObject(forKey: draftKey)
        } else {
            UserDefaults.standard.set(draft, forKey: draftKey)
        }
    }
}

// MARK: - Sheet payloads

nonisolated struct EvidenceSheetContent: Identifiable, Equatable, Sendable {
    let id: String
    let record: EvidenceRecord
}

nonisolated struct ProposalPreviewRequest: Identifiable, Equatable, Sendable {
    let proposal: ProposalView
    /// `false` when the decision controls live on the recommendation card above the proposal.
    let canDecide: Bool

    var id: String { proposal.id }
}

/// Presents the design system's disclosure as the `.height(560)` / `.large` sheet DESIGN.md
/// §2.3 specifies.
struct EvidenceDisclosureSheet: View {
    let content: EvidenceSheetContent
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        EvidenceDisclosure(record: content.record, onClose: { dismiss() })
            .presentationDetents([.height(560), .large])
            .presentationDragIndicator(.visible)
    }
}
