import Foundation

// The thread, assembled from the payload. Pure functions over decoded views — no network, no
// SwiftUI — so the rules they encode are unit-testable.

// MARK: - What a decision's controls actually call

/// Where `Try this` / `No thanks` go for one recommendation.
///
/// Order of resolution (FLOWS.md §3 step 8: *"`Try this` → approve — or, for a learning-only
/// agreement, `POST /api/learning`"*):
///
/// 1. a **pending proposal** carrying the same `decisionId` — approve/dismiss it, because the
///    proposal is the concrete change that acceptance writes;
/// 2. otherwise the **learning record** the decision produced — agree/decline it, and only the
///    controls the server left open in `row.controls`;
/// 3. otherwise nothing to decide: the card renders read-only and states what is saved.
///
/// A suggested test can become `agreed` from an ordinary conversational reply
/// (`.context/notes/agent-system.md` §6), so the state always comes from the payload and never
/// from which button was last tapped.
nonisolated enum CoachDecisionBinding: Equatable, Sendable {
    case proposal(id: String, goalId: String)
    case learning(recordId: String, agreeVersion: Int, declineVersion: Int, controls: LearningControls)
    /// Named `unbound`, not `none`, so it never reads as `Optional.none` at a call site.
    case unbound

    var allowsAgree: Bool {
        switch self {
        case .proposal: true
        case .learning(_, _, _, let controls): controls.agree
        case .unbound: false
        }
    }

    var allowsDecline: Bool {
        switch self {
        case .proposal: true
        case .learning(_, _, _, let controls): controls.decline
        case .unbound: false
        }
    }
}

/// The decision as the card must render it: where the controls go, which state chip is true,
/// and the contextual prompt `Discuss` puts in the composer.
nonisolated struct CoachDecision: Equatable, Sendable {
    let binding: CoachDecisionBinding
    let state: RecommendationState
    /// The server's own label, verbatim: a learning workflow string, a proposal state, or the
    /// saved-decision line. The client composes none of these sentences.
    let stateLabel: String
    /// `LearningRow.prompt` when the decision produced a record — the server writes it — else
    /// `rec.discussPrefill`.
    let discussPrompt: String

    static func resolve(
        decisionId: String?,
        action: String,
        messageSaved: Bool,
        proposals: [ProposalView],
        insights: InsightsView?
    ) -> CoachDecision {
        if let decisionId,
            let proposal = proposals.first(where: {
                $0.decisionId == decisionId && $0.status == .pending && !$0.expired
            })
        {
            return CoachDecision(
                binding: .proposal(id: proposal.id, goalId: proposal.goalId),
                state: .pending,
                stateLabel: "Proposed change",
                discussPrompt: CoachCopy.discussPrefill(action))
        }

        if let row = learningRow(decisionId: decisionId, action: action, insights: insights) {
            let decidable = row.controls.agree || row.controls.decline
            return CoachDecision(
                binding: .learning(
                    recordId: row.recordId,
                    agreeVersion: row.version(for: .agree),
                    declineVersion: row.version(for: .decline),
                    controls: row.controls),
                state: decidable ? .pending : settled(row.state),
                stateLabel: row.statusLabel,
                discussPrompt: row.prompt)
        }

        return CoachDecision(
            binding: .unbound,
            state: .applied,
            // `MessageView.saved` is `decision.status === "Accepted"` server-side.
            stateLabel: messageSaved ? "Saved to your workspace" : "Suggested",
            discussPrompt: CoachCopy.discussPrefill(action))
    }

    private static func settled(_ state: LearningState) -> RecommendationState {
        switch state {
        case .agreed: .agreed
        case .declined: .declined
        default: .applied
        }
    }

    /// A decision links to its learning record through the observation rows the same payload
    /// carries (`ObservationRow.decisionId` → `learning.recordId`). When the record already
    /// carries the decision its observation row is omitted (contract §4), so the test's saved
    /// `change` — which is the recommended action, written once by the coach — is the fallback.
    static func learningRow(decisionId: String?, action: String, insights: InsightsView?)
        -> LearningRow?
    {
        guard let insights else { return nil }
        let rows = insights.tryingNow + insights.learned + insights.history
        if let decisionId,
            let recordId = insights.observations
                .first(where: { $0.decisionId == decisionId })?.learning?.recordId,
            let row = rows.first(where: { $0.recordId == recordId })
        {
            return row
        }
        return rows.first { $0.change == action }
    }
}

// MARK: - Thread items

nonisolated struct CoachMessageItem: Identifiable, Equatable, Sendable {
    let id: String
    let message: MessageView
    /// True for the first message of a minute-group, which is the only one that prints a time.
    let showsTimestamp: Bool
}

nonisolated struct CoachRecommendationItem: Identifiable, Equatable, Sendable {
    let id: String
    let messageId: String
    let recommendation: RecommendationView
    let goal: DisplayGoal
    let methods: [DecisionMethod]
    let decision: CoachDecision
    /// The pending proposal this recommendation would apply, shown beneath it as the concrete
    /// change. Its decision controls stay on the card above — one decision, one set of controls.
    let proposal: ProposalView?
}

nonisolated struct CoachProposalItem: Identifiable, Equatable, Sendable {
    let id: String
    let proposal: ProposalView
    let goal: DisplayGoal?
}

nonisolated enum CoachThreadItem: Identifiable, Equatable, Sendable {
    case message(CoachMessageItem)
    case recommendation(CoachRecommendationItem)
    case proposal(CoachProposalItem)

    var id: String {
        switch self {
        case .message(let item): "m-\(item.id)"
        case .recommendation(let item): "r-\(item.id)"
        case .proposal(let item): "p-\(item.id)"
        }
    }
}

nonisolated enum CoachThread {
    /// Builds the thread in payload order: each message, then its recommendations, then any
    /// pending proposal that belongs to the same decision. Proposals whose decision is not in
    /// the thread go last, so nothing awaiting a decision is hidden.
    static func items(
        messages: [MessageView],
        proposals: [ProposalView],
        goals: [GoalRef],
        insights: InsightsView?,
        timeZone: TimeZone
    ) -> [CoachThreadItem] {
        var placed: Set<String> = []
        var items: [CoachThreadItem] = []
        var lastGroup: String?

        for message in messages {
            let group = groupKey(message, in: timeZone)
            items.append(
                .message(
                    CoachMessageItem(
                        id: message.id, message: message, showsTimestamp: group != lastGroup)))
            lastGroup = group

            for (index, recommendation) in message.recommendations.enumerated() {
                let decision = CoachDecision.resolve(
                    decisionId: message.decisionId,
                    action: recommendation.action,
                    messageSaved: message.saved,
                    proposals: proposals,
                    insights: insights)
                var attached: ProposalView?
                if case .proposal(let id, _) = decision.binding,
                    let proposal = proposals.first(where: { $0.id == id })
                {
                    attached = proposal
                    placed.insert(id)
                }
                items.append(
                    .recommendation(
                        CoachRecommendationItem(
                            id: "\(message.id)-\(index)",
                            messageId: message.id,
                            recommendation: recommendation,
                            goal: goal(
                                for: recommendation.goalIds.first ?? message.goalId,
                                title: message.goalTitle, in: goals),
                            methods: message.decisionMethods,
                            decision: decision,
                            proposal: attached)))
            }
        }

        for proposal in proposals where !placed.contains(proposal.id) {
            items.append(
                .proposal(
                    CoachProposalItem(
                        id: proposal.id, proposal: proposal,
                        goal: proposal.displayGoal(from: goals))))
        }
        return items
    }

    /// The timestamp is printed once per minute-group of same-author messages (DESIGN.md §4.15).
    static func groupKey(_ message: MessageView, in timeZone: TimeZone) -> String {
        let minute = message.at?.date.map { date -> String in
            var calendar = Calendar(identifier: .gregorian)
            calendar.timeZone = timeZone
            let parts = calendar.dateComponents(
                [.year, .month, .day, .hour, .minute], from: date)
            return
                "\(parts.year ?? 0)-\(parts.month ?? 0)-\(parts.day ?? 0)T\(parts.hour ?? 0):\(parts.minute ?? 0)"
        }
        return "\(message.role.rawValue)|\(message.channel.rawValue)|\(minute ?? message.id)"
    }

    static func goal(for id: String, title: String, in goals: [GoalRef]) -> DisplayGoal {
        if let match = goals.first(where: { $0.id == id }) { return match.display }
        return DisplayGoal(id: id, title: title, color: GoalColor.parse(nil))
    }
}

// MARK: - Response in progress

/// What the in-progress bubble says while a turn runs.
///
/// One `POST /api/coach` makes several provider calls in sequence, each with its own 60s abort,
/// so a turn can legitimately exceed a minute (`.context/notes/agent-system.md` §3). The stages
/// report elapsed time and nothing else: there is no progress fraction to honestly show, and the
/// client never claims to know which step the server is on.
nonisolated enum CoachProgress: Equatable, Sendable {
    case thinking
    case stillWorking
    case slow

    static let stillWorkingAfter: TimeInterval = 20
    static let slowAfter: TimeInterval = 75

    static func stage(elapsed: TimeInterval) -> CoachProgress {
        if elapsed >= slowAfter { return .slow }
        if elapsed >= stillWorkingAfter { return .stillWorking }
        return .thinking
    }

    var label: String {
        switch self {
        case .thinking: CoachCopy.thinking
        case .stillWorking: CoachCopy.stillWorking
        case .slow: CoachCopy.errorTimeout
        }
    }

    /// `12s` / `1:23` — a fact, printed with tabular figures beside the label.
    static func elapsedLabel(_ elapsed: TimeInterval) -> String {
        let seconds = max(0, Int(elapsed))
        if seconds < 60 { return "\(seconds)s" }
        return String(format: "%d:%02d", seconds / 60, seconds % 60)
    }
}

// MARK: - Errors on the composer

/// How a failed send is reported. The server's own sentence is always shown as written
/// (`Core/README.md` §3); this only decides which shape holds it.
nonisolated enum CoachSendFailure: Equatable, Sendable {
    /// Timeout or offline: the turn may already have run, so the retry must reuse the requestId.
    case retryable(message: String)
    /// 429. The chat limit is consumed before the idempotency check, so retrying immediately
    /// makes it worse.
    case rateLimited(message: String)
    /// Anything else, shown verbatim. Over 240 characters it collapses behind `What happened`.
    case server(message: String)

    init(_ error: APIError) {
        let message = error.serverMessage ?? error.errorDescription ?? CoachCopy.longError
        if error.isRateLimited {
            self = .rateLimited(message: message)
        } else if error.isRetryableWithSameRequestID {
            self = .retryable(message: message)
        } else {
            self = .server(message: message)
        }
    }

    var message: String {
        switch self {
        case .retryable(let message), .rateLimited(let message), .server(let message): message
        }
    }

    /// DESIGN/FLOWS §11: a long server message collapses behind `coach.longError` + `What happened`.
    var isLong: Bool { message.count > 240 }

    var canRetrySameRequest: Bool {
        if case .retryable = self { return true }
        return false
    }
}
