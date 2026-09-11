import SwiftUI

/// The hand-off: the goal the person typed becomes the first message of a real coaching turn,
/// and whatever comes back is shown as it is (FLOWS.md §1, steps 9–15).
///
/// The three honest outcomes of a first turn (`.context/notes/agent-system.md` §3) each have a
/// state here and none of them is dressed up:
///
/// * a planned Draft with milestones and actions → the proposal, then the saved goal;
/// * an unplanned Draft with one clarifying question → the question and a composer to answer it;
/// * a readable failure → the server's sentence, verbatim, with a retry that reuses the same
///   `requestId`.
///
/// The screen is pushed while the app's own `SessionStore` still says `.signedOut`
/// (`OnboardingAuth`), so the shell does not swap the tab bar in underneath it. It finishes by
/// calling `SessionStore.bootstrap()`, which is the moment the app becomes signed in.
struct FirstPlanView: View {
    let start: FirstPlanStart

    @Environment(SessionStore.self) private var session
    @Environment(WorkspaceStore.self) private var workspace
    @Environment(AppRouter.self) private var router
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    @State private var phase: Phase
    @State private var transcript: [ConversationMessage] = []
    @State private var conversationId: String?
    @State private var proposal: ProposalView?
    @State private var goalId: String?
    @State private var answer = ""
    @State private var elapsed: TimeInterval = 0
    @State private var ticker: Task<Void, Never>?
    @State private var isApproving = false
    @State private var actionError: APIError?
    @State private var showsRationale = false
    @State private var showsPreview = false
    @State private var isStartingPlan = false
    @State private var startError: String?

    init(start: FirstPlanStart) {
        self.start = start
        // Decided up front so the staged wait never flashes for an account that cannot coach.
        _phase = State(initialValue: start.coachConfigured ? .sending : .providerGate)
    }

    enum Phase: Equatable {
        /// `status.coach.configured == false` — nothing is sent, the draft is kept.
        case providerGate
        case sending
        /// A reply is on screen: a proposal to decide on, or a question to answer.
        case reply
        case saved(FirstPlanSummary)
        case failed(APIError)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AdlerLayout.sectionGap) {
                switch phase {
                case .providerGate:
                    providerGate
                case .sending:
                    transcriptView
                    progress
                case .reply:
                    transcriptView
                    replyControls
                case .saved(let summary):
                    // The coach's own sentences stay on screen next to what was saved: the
                    // summary is the record, the reply is what Adler said about it.
                    transcriptView
                    FirstPlanSavedView(
                        summary: summary,
                        startError: startError,
                        isStartingPlan: isStartingPlan,
                        onStartPlan: { Task { await startPlan(summary.goalId) } },
                        onOpenGoal: { openGoal(summary.goalId) },
                        onContinueInCoach: continueInCoach,
                        onFinish: finish)
                case .failed(let error):
                    transcriptView
                    failure(error)
                }
            }
            .padding(.horizontal, AdlerLayout.screenMargin)
            .padding(.vertical, AdlerLayout.screenMargin)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(Color.canvas)
        .scrollDismissesKeyboard(.interactively)
        .navigationBarTitleDisplayMode(.inline)
        // Going "back" would return to a password field for an account that already exists.
        .navigationBarBackButtonHidden(true)
        .toolbar {
            if phase != .providerGate, !isSaved {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { continueInCoach() } label: {
                        Text(OnboardingCopy.planCancel).adlerText(.subhead)
                    }
                    .tint(Color.accentInk)
                }
            }
        }
        .sheet(isPresented: $showsRationale) {
            if let proposal { FirstPlanRationaleSheet(proposal: proposal) }
        }
        .sheet(isPresented: $showsPreview) {
            if let proposal { FirstPlanPreviewSheet(proposal: proposal) }
        }
        .task { await startIfNeeded() }
        .onDisappear { stopTicker() }
    }

    private var isSaved: Bool {
        if case .saved = phase { return true }
        return false
    }

    // MARK: - Sections

    @ViewBuilder
    private var transcriptView: some View {
        if !transcript.isEmpty {
            VStack(alignment: .leading, spacing: Space.m) {
                ForEach(transcript) { message in
                    ConversationBubble(message: message)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .accessibilityElement(children: .contain)
            .accessibilityLabel("Conversation with Adler")
        }
    }

    @ViewBuilder
    private var progress: some View {
        let index = OnboardingProgress.index(atElapsed: elapsed)
        VStack(alignment: .leading, spacing: Space.m) {
            Text(OnboardingCopy.planTitle)
                .adlerText(.eyebrow)
                .foregroundStyle(Color.inkMuted)

            // The stages are the phases of the turn in the order the server runs them. There is
            // no percentage: the server reports nothing until the turn is finished.
            VStack(alignment: .leading, spacing: Space.s) {
                ForEach(Array(OnboardingProgress.stages.enumerated()), id: \.element.id) { offset, item in
                    HStack(spacing: Space.s) {
                        Group {
                            if offset < index {
                                Image(systemName: "checkmark")
                                    .foregroundStyle(Color.accentInk)
                            } else if offset == index {
                                ProgressView().controlSize(.small)
                            } else {
                                Circle()
                                    .strokeBorder(Color.separator, lineWidth: 1)
                                    .frame(width: 10, height: 10)
                            }
                        }
                        .frame(width: 18, alignment: .leading)
                        Text(item.label)
                            .adlerText(offset == index ? .headline : .subhead)
                            .foregroundStyle(offset <= index ? Color.ink : Color.inkMuted)
                    }
                }
            }

            Text(OnboardingProgress.notice(atElapsed: elapsed))
                .adlerText(.footnote)
                .foregroundStyle(elapsed >= OnboardingProgress.patienceNoticeAt ? Color.warning : Color.inkMuted)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(AdlerLayout.cardPadding)
        .frame(maxWidth: .infinity, alignment: .leading)
        .adlerCard()
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(OnboardingProgress.accessibilityLabel(atElapsed: elapsed))
        .accessibilityIdentifier("First plan progress")
    }

    @ViewBuilder
    private var replyControls: some View {
        if let actionError {
            ErrorBanner(kind: .of(actionError), actionTitle: nil, action: nil) {
                self.actionError = nil
            }
        }
        if let proposal {
            VStack(alignment: .leading, spacing: Space.s) {
                ProposalCard(
                    content: FirstPlanProposal.content(
                        for: proposal, goalColor: goalColor(for: proposal.goalId),
                        timeZone: session.timeZone),
                    onApprove: { Task { await approve(proposal) } },
                    onDismiss: { Task { await dismiss(proposal) } },
                    onReviewChanges: { showsPreview = true },
                    onWhyThis: hasSavedReason(proposal) ? { showsRationale = true } : nil)
                .opacity(isApproving ? 0.6 : 1)
                .disabled(isApproving)
                if !hasSavedReason(proposal) {
                    // COPY.md `proposal.noReason` — the absence of a rationale is stated, not
                    // filled in with one the app made up.
                    Text("No reason was saved with this proposal.")
                        .adlerText(.footnote)
                        .foregroundStyle(Color.inkMuted)
                }
                if isApproving { ProgressView().controlSize(.small) }
            }
        } else {
            // No proposal and no goal yet: the reply is a question, so the person answers it
            // here and the loop continues.
            answerComposer
        }
    }

    @ViewBuilder
    private var answerComposer: some View {
        VStack(alignment: .leading, spacing: Space.s) {
            Text(OnboardingCopy.planYouLabel)
                .adlerText(.eyebrow)
                .foregroundStyle(Color.inkMuted)
            TextField(OnboardingCopy.planAnswerPlaceholder, text: $answer, axis: .vertical)
                .lineLimit(1...6)
                .adlerText(.body)
                .adlerWell()
                .accessibilityLabel(OnboardingCopy.planAnswerPlaceholder)
                .accessibilityIdentifier("Answer field")
            HStack(spacing: Space.m) {
                AdlerPrimaryButton(title: OnboardingCopy.planAnswerSend) {
                    Task { await send(answer) }
                }
                .disabled(answer.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                AdlerQuietButton(title: OnboardingCopy.planCancel) { continueInCoach() }
            }
        }
    }

    @ViewBuilder
    private var providerGate: some View {
        VStack(alignment: .leading, spacing: Space.l) {
            ErrorBanner(kind: .noProvider, actionTitle: nil, action: nil, onDismiss: nil)
            Text(OnboardingCopy.providerGateBody)
                .adlerText(.callout)
                .foregroundStyle(Color.ink)
                .fixedSize(horizontal: false, vertical: true)
            if session.draft.hasText {
                Text(OnboardingCopy.draftKept(session.draft.text))
                    .adlerText(.footnote)
                    .foregroundStyle(Color.inkMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            let layout = dynamicTypeSize.prefersStackedControls
                ? AnyLayout(VStackLayout(alignment: .leading, spacing: Space.s))
                : AnyLayout(HStackLayout(spacing: Space.m))
            layout {
                AdlerPrimaryButton(title: OnboardingCopy.providerGateAction) {
                    Task {
                        router.presentSettings(page: .provider)
                        await session.bootstrap()
                    }
                }
                AdlerQuietButton(title: OnboardingCopy.providerGateSkip) {
                    Task {
                        router.openToday(card: .doNext)
                        await session.bootstrap()
                    }
                }
            }
        }
        .padding(AdlerLayout.cardPadding)
        .frame(maxWidth: .infinity, alignment: .leading)
        .adlerCard()
        .accessibilityIdentifier("Provider gate")
    }

    @ViewBuilder
    private func failure(_ error: APIError) -> some View {
        let message = OnboardingErrorText.verbatim(error)
        VStack(alignment: .leading, spacing: Space.m) {
            if OnboardingErrorText.isLong(message) {
                ErrorBanner(kind: .server(detail: OnboardingCopy.planFailedLong))
                DisclosureGroup(OnboardingCopy.planFailedDisclosure) {
                    Text(message)
                        .adlerText(.footnote)
                        .foregroundStyle(Color.ink)
                        .fixedSize(horizontal: false, vertical: true)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.top, Space.s)
                }
                .adlerText(.subhead)
                .tint(Color.inkMuted)
            } else {
                ErrorBanner(kind: .of(error))
            }

            let layout = dynamicTypeSize.prefersStackedControls
                ? AnyLayout(VStackLayout(alignment: .leading, spacing: Space.s))
                : AnyLayout(HStackLayout(spacing: Space.m))
            layout {
                AdlerPrimaryButton(title: OnboardingCopy.planRetry) {
                    Task { await retry() }
                }
                .accessibilityIdentifier("Retry first plan")
                AdlerQuietButton(title: OnboardingCopy.planContinueInCoach) { continueInCoach() }
            }
        }
        .padding(AdlerLayout.cardPadding)
        .frame(maxWidth: .infinity, alignment: .leading)
        .adlerCard()
        .accessibilityIdentifier("First plan failure")
    }

    // MARK: - Behaviour

    private func startIfNeeded() async {
        guard transcript.isEmpty else { return }
        guard start.coachConfigured else {
            phase = .providerGate
            return
        }
        await send(start.message, isOpening: true)
    }

    private func send(_ text: String, isOpening: Bool = false) async {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        // The bubble shows the person's own words; the wrapper FLOWS.md §1 step 9 adds is what
        // goes on the wire, not what is read back to them.
        let spoken = isOpening && session.draft.hasText ? session.draft.text : trimmed
        append(role: .user, text: spoken)
        if !isOpening { answer = "" }
        phase = .sending
        actionError = nil
        startTicker()
        defer { stopTicker() }
        do {
            let reply = try await workspace.sendCoachMessage(
                text: trimmed, goalId: "general", conversationId: conversationId)
            // Cleared only after a 2xx, never before (DESIGN.md §5.2).
            session.draft.clear()
            conversationId = reply.conversationId
            append(role: .coach, text: reply.reply)
            await absorbOutcome(reply)
        } catch {
            phase = .failed(error)
        }
    }

    private func retry() async {
        phase = .sending
        startTicker()
        defer { stopTicker() }
        do {
            // The same `requestId` — the server replays its first answer when it has one, and a
            // duplicate message is never created (`.context/notes/agent-system.md` §2).
            guard let reply = try await workspace.retryCoachMessage() else {
                phase = .reply
                return
            }
            session.draft.clear()
            conversationId = reply.conversationId
            append(role: .coach, text: reply.reply)
            await absorbOutcome(reply)
        } catch {
            phase = .failed(error)
        }
    }

    /// Reads what the turn actually produced. Three outcomes, in the order they are decidable.
    private func absorbOutcome(_ reply: CoachReply) async {
        let conversation = workspace.conversations[reply.conversationId]
        proposal = conversation?.proposals.first { $0.status == .pending && !$0.expired }
            ?? workspace.coach?.proposals.first { $0.status == .pending && !$0.expired }
        goalId = proposal?.goalId ?? conversation?.goals.first?.id ?? workspace.coach?.goals.first?.id

        if proposal == nil, let goalId {
            // The coach saved the goal itself; show what it contains, including nothing.
            await workspace.loadGoal(id: goalId)
            if let detail = workspace.goalDetails[goalId] {
                phase = .saved(FirstPlanSummary.make(from: detail))
                return
            }
        }
        phase = .reply
    }

    private func approve(_ proposal: ProposalView) async {
        isApproving = true
        defer { isApproving = false }
        actionError = nil
        do {
            try await workspace.approveProposal(id: proposal.id, goalId: proposal.goalId)
            await workspace.loadGoal(id: proposal.goalId)
            guard let detail = workspace.goalDetails[proposal.goalId] else {
                // The change is already saved; only this read-back failed. Show why (`loadGoal`
                // captures its own error rather than throwing), so a timeout reads as a timeout
                // and not a fabricated decoding failure. `Approve` is still on screen and
                // re-tapping it is safe — the server replays the already-applied proposal and
                // this read-back gets another attempt.
                actionError =
                    workspace.state(.goal(proposal.goalId)).error
                    ?? .decoding(message: "The saved goal could not be read back.")
                return
            }
            self.proposal = nil
            goalId = proposal.goalId
            phase = .saved(FirstPlanSummary.make(from: detail))
        } catch {
            actionError = error
        }
    }

    private func dismiss(_ proposal: ProposalView) async {
        isApproving = true
        defer { isApproving = false }
        actionError = nil
        do {
            try await workspace.dismissProposal(id: proposal.id, goalId: proposal.goalId)
            self.proposal = nil
            phase = .reply
        } catch {
            actionError = error
        }
    }

    /// `POST /api/app/goals/:id/start`. The coach saves the first plan as a Draft and its own
    /// reply says to start it; until it is started the actions are not scheduled and Today is
    /// empty. A refusal — `Choose a first action before starting this goal's plan.`,
    /// `Only a draft plan can be started.` — is shown exactly as the server wrote it.
    private func startPlan(_ id: String) async {
        isStartingPlan = true
        defer { isStartingPlan = false }
        startError = nil
        do {
            _ = try await workspace.startGoal(id: id)
            await workspace.loadGoal(id: id)
            if let detail = workspace.goalDetails[id] {
                phase = .saved(FirstPlanSummary.make(from: detail))
            }
        } catch {
            startError = OnboardingErrorText.verbatim(error)
        }
    }

    private func append(role: ConversationMessage.Role, text: String) {
        transcript.append(
            ConversationMessage(
                id: "\(role.rawValue)-\(transcript.count)", role: role, text: text,
                timestamp: Date()))
    }

    private func goalColor(for id: String) -> String? {
        workspace.coach?.goals.first { $0.id == id }?.color
    }

    private func hasSavedReason(_ proposal: ProposalView) -> Bool {
        !proposal.recommendations.isEmpty || !proposal.researchClaims.isEmpty
    }

    // MARK: - Leaving

    private func openGoal(_ id: String) {
        router.openGoal(id: id)
        Task { await session.bootstrap() }
    }

    private func continueInCoach() {
        if let conversationId {
            router.openConversation(id: conversationId)
        } else {
            router.selectTab(.coach)
        }
        Task { await session.bootstrap() }
    }

    private func finish() {
        router.openToday(card: .doNext)
        Task { await session.bootstrap() }
    }

    // MARK: - Ticker

    private func startTicker() {
        ticker?.cancel()
        elapsed = 0
        ticker = Task {
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(1))
                guard !Task.isCancelled else { break }
                elapsed += 1
            }
        }
    }

    private func stopTicker() {
        ticker?.cancel()
        ticker = nil
    }
}

#Preview("Provider gate") {
    NavigationStack {
        FirstPlanView(
            start: FirstPlanStart(message: "Help me…", coachConfigured: false))
    }
    .environment(SessionStore(client: APIClient()))
    .environment(WorkspaceStore(client: APIClient()))
    .environment(AppRouter())
}
