import XCTest

@testable import Adler

/// The Coach tab's rules, exercised against the real example payloads in
/// `docs/ios-api-examples/`. Everything under test is a pure function over decoded views, so a
/// contract change shows up here rather than on screen.
nonisolated final class CoachTests: XCTestCase {
    private let zone = TimeZone(identifier: "Europe/London") ?? .gmt

    private func coach(_ name: String) throws -> CoachView {
        try Fixtures.load(CoachView.self, name).response
    }

    private func insights() throws -> InsightsView {
        try Fixtures.load(InsightsView.self, "insights").response
    }

    // MARK: - Control mapping from the payload

    func testPendingProposalOwnsTheDecision() throws {
        let view = try coach("coach-conversation")
        let message = try XCTUnwrap(view.messages.first { !$0.recommendations.isEmpty })
        let recommendation = try XCTUnwrap(message.recommendations.first)

        let decision = CoachDecision.resolve(
            decisionId: message.decisionId,
            action: recommendation.action,
            messageSaved: message.saved,
            proposals: view.proposals,
            insights: try insights())

        guard case .proposal(let id, let goalId) = decision.binding else {
            return XCTFail("expected the pending proposal to own the decision, got \(decision.binding)")
        }
        XCTAssertEqual(goalId, "portfolio")
        XCTAssertEqual(view.proposals.first { $0.id == id }?.decisionId, message.decisionId)
        XCTAssertEqual(decision.state, .pending)
        XCTAssertEqual(decision.stateLabel, "Proposed change")
        XCTAssertTrue(decision.binding.allowsAgree)
        XCTAssertTrue(decision.binding.allowsDecline)
    }

    /// With no proposal left to approve, the controls come from the learning record — and the
    /// seeded record has already been agreed, so neither `Try this` nor `No thanks` is offered.
    func testAgreedLearningRecordOffersNoDecisionControls() throws {
        let view = try coach("coach-conversation")
        let message = try XCTUnwrap(view.messages.first { !$0.recommendations.isEmpty })
        let recommendation = try XCTUnwrap(message.recommendations.first)

        let decision = CoachDecision.resolve(
            decisionId: message.decisionId,
            action: recommendation.action,
            messageSaved: message.saved,
            proposals: [],
            insights: try insights())

        guard case .learning(let recordId, _, _, let controls) = decision.binding else {
            return XCTFail("expected a learning binding, got \(decision.binding)")
        }
        XCTAssertEqual(recordId, "learning-breakfast-cue")
        XCTAssertFalse(controls.agree)
        XCTAssertFalse(controls.decline)
        XCTAssertFalse(decision.binding.allowsAgree)
        XCTAssertFalse(decision.binding.allowsDecline)
        XCTAssertEqual(decision.state, .agreed)
        let matchedRow = try insights().tryingNow[0]
        // The server's own workflow label, verbatim — never re-worded. Read off the fixture
        // rather than a literal: the label is server-computed and regenerating the fixture can
        // legitimately change it (e.g. a correction no longer applies), which must not fail the
        // assertion that the client prints it unchanged.
        XCTAssertEqual(decision.stateLabel, matchedRow.statusLabel)
        // `Discuss` uses the prompt the server wrote for that record.
        XCTAssertEqual(decision.discussPrompt, matchedRow.prompt)
    }

    func testSuggestedRecordKeepsBothDecisionControls() throws {
        let row = Self.row(state: .suggested, controls: .init(agree: true, decline: true, pause: false, resume: false, close: false))
        let view = Self.insights(rows: [row])

        let decision = CoachDecision.resolve(
            decisionId: nil, action: row.change, messageSaved: false, proposals: [],
            insights: view)

        XCTAssertEqual(decision.state, .pending)
        XCTAssertTrue(decision.binding.allowsAgree)
        XCTAssertTrue(decision.binding.allowsDecline)
        XCTAssertEqual(decision.stateLabel, "Suggested")
    }

    /// `POST /api/learning` takes `actionVersion` for agree/decline and `version` for the rest;
    /// the binding carries the numbers the row says, not whichever is handy.
    func testAgreeAndDeclineCarryTheActionVersion() throws {
        let row = Self.row(
            state: .suggested,
            controls: .init(agree: true, decline: true, pause: false, resume: false, close: false),
            version: 3, actionVersion: 2)
        let decision = CoachDecision.resolve(
            decisionId: nil, action: row.change, messageSaved: false, proposals: [],
            insights: Self.insights(rows: [row]))

        guard case .learning(_, let agree, let decline, _) = decision.binding else {
            return XCTFail("expected a learning binding")
        }
        XCTAssertEqual(agree, 2)
        XCTAssertEqual(decline, 2)
        XCTAssertEqual(row.version(for: .pause), 3)
        XCTAssertEqual(row.version(for: .close), 3)
    }

    func testUnboundDecisionRendersReadOnlyAndSaysWhatIsSaved() throws {
        let saved = CoachDecision.resolve(
            decisionId: "decision-x", action: "Something", messageSaved: true, proposals: [],
            insights: nil)
        XCTAssertEqual(saved.binding, .unbound)
        XCTAssertEqual(saved.stateLabel, "Saved to your workspace")
        XCTAssertFalse(saved.binding.allowsAgree)

        let unsaved = CoachDecision.resolve(
            decisionId: nil, action: "Something", messageSaved: false, proposals: [], insights: nil)
        XCTAssertEqual(unsaved.stateLabel, "Suggested")
        XCTAssertFalse(unsaved.binding.allowsDecline)
    }

    /// An expired proposal is not a decision anyone can still take.
    func testExpiredProposalDoesNotBindTheControls() throws {
        let view = try coach("coach-conversation")
        let pending = try XCTUnwrap(view.proposals.first)
        let expired = Self.expire(pending)

        let decision = CoachDecision.resolve(
            decisionId: pending.decisionId, action: "Anything", messageSaved: false,
            proposals: [expired], insights: nil)
        XCTAssertEqual(decision.binding, .unbound)
    }

    // MARK: - Message grouping

    func testTimestampIsPrintedOncePerMinuteGroup() throws {
        let view = try coach("coach-conversation")
        let items = CoachThread.items(
            messages: view.messages, proposals: [], goals: view.goals, insights: nil,
            timeZone: zone)
        let messages = items.compactMap { item -> CoachMessageItem? in
            if case .message(let message) = item { return message }
            return nil
        }
        XCTAssertEqual(messages.count, view.messages.count)
        // Three messages a minute or a week apart: every one starts its own group.
        XCTAssertEqual(messages.map(\.showsTimestamp), [true, true, true])
    }

    func testConsecutiveMessagesInOneMinuteShareTheTimestamp() throws {
        let view = try coach("coach-conversation")
        let first = try XCTUnwrap(view.messages.first)
        let twin = Self.retime(first, id: "message-1b", at: first.at)
        let items = CoachThread.items(
            messages: [first, twin], proposals: [], goals: view.goals, insights: nil,
            timeZone: zone)
        let messages = items.compactMap { item -> CoachMessageItem? in
            if case .message(let message) = item { return message }
            return nil
        }
        XCTAssertEqual(messages.map(\.showsTimestamp), [true, false])
    }

    /// A reply that arrived by text keeps its own group even inside the same minute, so the
    /// channel chip is never attributed to the bubble above it.
    func testChannelStartsANewGroup() throws {
        let view = try coach("coach-conversation")
        let first = try XCTUnwrap(view.messages.first)
        let bySMS = Self.retime(first, id: "message-1c", at: first.at, channel: .sms)
        let items = CoachThread.items(
            messages: [first, bySMS], proposals: [], goals: view.goals, insights: nil,
            timeZone: zone)
        let messages = items.compactMap { item -> CoachMessageItem? in
            if case .message(let message) = item { return message }
            return nil
        }
        XCTAssertEqual(messages.map(\.showsTimestamp), [true, true])
    }

    // MARK: - Thread assembly

    func testRecommendationSitsAfterItsMessageAndAdoptsThePendingProposal() throws {
        let view = try coach("coach-conversation")
        let items = CoachThread.items(
            messages: view.messages, proposals: view.proposals, goals: view.goals,
            insights: try insights(), timeZone: zone)

        let kinds = items.map { item -> String in
            switch item {
            case .message: "m"
            case .recommendation: "r"
            case .proposal: "p"
            }
        }
        // message · message + its recommendation · message. The proposal is consumed by the
        // recommendation, so the same decision is never offered twice.
        XCTAssertEqual(kinds, ["m", "m", "r", "m"])

        guard case .recommendation(let item) = items[2] else { return XCTFail("expected a card") }
        XCTAssertEqual(item.messageId, "message-2")
        XCTAssertEqual(item.proposal?.id, view.proposals.first?.id)
        XCTAssertEqual(item.goal.id, "portfolio")
    }

    /// A proposal whose decision is not in the thread still has to be reachable.
    func testUnattachedProposalsAreAppended() throws {
        let list = try coach("coach")
        let items = CoachThread.items(
            messages: [], proposals: list.proposals, goals: list.goals, insights: nil,
            timeZone: zone)
        XCTAssertEqual(items.count, list.proposals.count)
        XCTAssertTrue(items.allSatisfy { if case .proposal = $0 { return true } else { return false } })
    }

    // MARK: - Staged progress

    func testProgressStagesAreElapsedTimeAndNothingElse() {
        XCTAssertEqual(CoachProgress.stage(elapsed: 0), .thinking)
        XCTAssertEqual(CoachProgress.stage(elapsed: 19.9), .thinking)
        XCTAssertEqual(CoachProgress.stage(elapsed: 20), .stillWorking)
        XCTAssertEqual(CoachProgress.stage(elapsed: 74.9), .stillWorking)
        XCTAssertEqual(CoachProgress.stage(elapsed: 75), .slow)
        XCTAssertEqual(CoachProgress.stage(elapsed: 600), .slow)

        XCTAssertEqual(CoachProgress.thinking.label, "Thinking with you…")
        XCTAssertEqual(CoachProgress.slow.label, "This is taking longer than expected.")
    }

    func testElapsedLabelReadsAsAClock() {
        XCTAssertEqual(CoachProgress.elapsedLabel(0), "0s")
        XCTAssertEqual(CoachProgress.elapsedLabel(9.6), "9s")
        XCTAssertEqual(CoachProgress.elapsedLabel(59), "59s")
        XCTAssertEqual(CoachProgress.elapsedLabel(60), "1:00")
        XCTAssertEqual(CoachProgress.elapsedLabel(83), "1:23")
    }

    func testSendFailureClassification() {
        let rateLimited = CoachSendFailure(.server(message: "Too many requests. Please try again later.", status: 429))
        XCTAssertEqual(rateLimited, .rateLimited(message: "Too many requests. Please try again later."))
        XCTAssertFalse(rateLimited.canRetrySameRequest)

        let timedOut = CoachSendFailure(.transport(message: "timed out", kind: .timeout))
        XCTAssertTrue(timedOut.canRetrySameRequest)

        let server = CoachSendFailure(.server(message: String(repeating: "x", count: 300), status: 400))
        XCTAssertTrue(server.isLong)
        XCTAssertFalse(server.canRetrySameRequest)
        // The server's own sentence, never paraphrased.
        XCTAssertEqual(server.message.count, 300)
    }

    // MARK: - Current → Suggested

    func testUpdateComparesAgainstTheBeforeRecord() throws {
        let view = try coach("coach")
        let proposal = try XCTUnwrap(view.proposals.first { $0.changes.contains { $0.entity == .milestone } })
        let rows = ProposalChangeMapping.rows(for: proposal, in: zone)

        let due = try XCTUnwrap(rows.first { $0.field.contains("Milestone date") })
        XCTAssertEqual(due.field, "Milestone · Milestone date")
        // `before` has no `dueDate`, so the current value is "not set", never a blank.
        XCTAssertEqual(due.current, "Not set")
        XCTAssertNotNil(due.suggested)
        XCTAssertFalse(due.suggested?.contains("2026-09-24") ?? true, "dates render through the app formatter")
        XCTAssertFalse(due.removed)
    }

    func testCreateShowsNotAddedYet() throws {
        let view = try coach("coach")
        let proposal = try XCTUnwrap(view.proposals.first { $0.changes.contains { $0.entity == .memory } })
        let rows = ProposalChangeMapping.rows(for: proposal, in: zone)
        let text = try XCTUnwrap(rows.first)
        XCTAssertEqual(text.field, "Saved information · Personal context")
        XCTAssertEqual(text.current, "Not added yet")
        XCTAssertEqual(text.suggested, "Keep Thursday evening free for the editor hand-off.")
    }

    func testUnchangedFieldIsShownNotHidden() throws {
        let change = Change(
            entity: .action, operation: .update, id: "a1", parentId: "portfolio",
            values: "{\"title\":\"Write\",\"date\":\"2026-09-24\"}")
        let before = JSONValue.object(["title": .string("Write"), "date": .string("2026-09-01")])
        let rows = ProposalChangeMapping.rows(for: change, before: before, index: 0, in: zone)
        let title = try XCTUnwrap(rows.first { $0.field.hasSuffix("title") })
        XCTAssertEqual(title.current, "(no change)")
        XCTAssertEqual(rows.count, 2, "an unchanged field still appears, so the scope is legible")
    }

    func testDeletionIsMarkedRemoved() {
        let change = Change(
            entity: .memory, operation: .delete, id: "memory-1", parentId: nil, values: "{}")
        let before = JSONValue.object(["text": .string("Keep Thursday evening free.")])
        let rows = ProposalChangeMapping.rows(for: change, before: before, index: 0, in: zone)
        XCTAssertEqual(rows.count, 1)
        XCTAssertTrue(rows[0].removed)
        XCTAssertEqual(rows[0].current, "Keep Thursday evening free.")
        XCTAssertEqual(rows[0].suggested, "Removed from your workspace")
    }

    func testNullIsNotKnownAndNeverZero() {
        XCTAssertEqual(ProposalChangeMapping.format(.null, field: "amount", in: zone), "Not known yet")
        XCTAssertEqual(ProposalChangeMapping.format(.number(25), field: "amount", in: zone), "25")
        XCTAssertEqual(ProposalChangeMapping.format(.bool(true), field: "done", in: zone), "Yes")
    }

    func testRecordAndFieldLabelsMatchTheWeb() {
        XCTAssertEqual(ProposalChangeMapping.recordLabel(.checkpoint), "Progress check")
        XCTAssertEqual(ProposalChangeMapping.recordLabel(.memory), "Saved information")
        XCTAssertEqual(ProposalChangeMapping.recordLabel(.workBlock), "Calendar")
        XCTAssertEqual(ProposalChangeMapping.label("dueDate"), "Milestone date")
        XCTAssertEqual(ProposalChangeMapping.label("somethingNew"), "something New")
    }

    // MARK: - Insights

    /// Synthetic rows, not the live fixture: which record currently needs a `reconsider` or a
    /// `readyToReview` case depends on server-computed, date-relative state that a fixture
    /// regeneration can legitimately shift (a correction no longer applying moves a record out
    /// of `reconsider`). Building the three cases directly keeps this test about the sort rule.
    func testAttentionCasesSortBeforeRunningOnes() throws {
        let running = Self.row(
            state: .agreed,
            controls: .init(agree: false, decline: false, pause: true, resume: false, close: true),
            recordId: "learning-running")
        let readyToReview = Self.row(
            state: .agreed,
            controls: .init(agree: false, decline: false, pause: true, resume: false, close: true),
            recordId: "learning-ready", statusLabel: "Ready to review")
        let reconsider = Self.row(
            state: .agreed,
            controls: .init(agree: false, decline: false, pause: true, resume: false, close: true),
            recordId: "learning-reconsider", standing: .reconsider)
        XCTAssertNil(running.attentionReason, "a record with none of the four cases needs no attention")

        let view = Self.insights(rows: [running, readyToReview, reconsider])
        let attention = view.tryingNow.filter { $0.attentionReason != nil }
            .sorted { ($0.attentionReason ?? .suggested) < ($1.attentionReason ?? .suggested) }
        XCTAssertEqual(attention.map(\.recordId), ["learning-reconsider", "learning-ready"])
        XCTAssertEqual(reconsider.attentionReason, .reconsider)
        XCTAssertEqual(readyToReview.attentionReason, .readyToReview)
    }

    func testTimelineUsesSavedDatesOnly() throws {
        let view = try insights()
        let row = view.tryingNow[0]
        let content = try XCTUnwrap(row.summaryRow(in: zone))
        XCTAssertEqual(content.attemptsReported, row.reports)
        XCTAssertEqual(content.timeline.attempts.count, row.attempts.count)
        XCTAssertNotNil(content.timeline.review)
        XCTAssertEqual(content.workflowLabel, row.statusLabel)
        XCTAssertEqual(content.standingLabel, row.standingLabel)
    }

    func testRowWithoutASavedStartHasNoTimeline() throws {
        let row = Self.row(
            state: .suggested,
            controls: .init(agree: true, decline: true, pause: false, resume: false, close: false),
            start: nil, attempts: [])
        XCTAssertNil(row.summaryRow(in: zone), "a lane is never drawn from an invented start date")
    }

    // MARK: - Evidence

    func testEvidenceRecordIsBuiltOnlyFromSavedFields() throws {
        let detail = try Fixtures.load(LearningDetailView.self, "insight-record").response
        let version = try XCTUnwrap(detail.versions.last)
        let record = EvidenceBuilder.record(
            reasoning: version.reasoning, grounding: version.grounding,
            sources: version.researchSources, diagram: nil, timeZone: zone)

        XCTAssertEqual(record.mechanism, version.reasoning.mechanism)
        XCTAssertEqual(record.limitation, version.reasoning.limitation)
        XCTAssertEqual(record.claims.count, version.grounding.count)
        XCTAssertEqual(record.sources.count, version.researchSources.count)
        XCTAssertEqual(record.claims.first?.relation, .motivates)
        XCTAssertEqual(record.claims.first?.role, .technique)
        // The grade is free prose and is carried as prose, never scored.
        XCTAssertEqual(record.claims.first?.grade, version.grounding.first?.claim?.grade)
        XCTAssertTrue(record.identifiers.contains { $0.hasPrefix("Principles ") })
        XCTAssertTrue(record.alternatives.isEmpty, "no alternative is invented when none is saved")
    }

    func testMissingClaimVersionSaysSoInsteadOfSubstituting() {
        let binding = ClaimBindingView(
            claimId: "claim:x", version: "2026-01-01.1", relation: .supports,
            application: "Applied here.", claim: nil)
        let claim = EvidenceBuilder.claim(binding, timeZone: zone)
        XCTAssertEqual(claim.label, "claim:x")
        XCTAssertEqual(claim.statement, CoachCopy.evidenceClaimMissing)
        XCTAssertNil(claim.grade)
    }

    func testMethodReferenceUsesTheSavedMethodName() throws {
        let view = try coach("coach-conversation")
        let message = try XCTUnwrap(view.messages.first { !$0.recommendations.isEmpty })
        let recommendation = try XCTUnwrap(message.recommendations.first)
        XCTAssertEqual(
            recommendation.methodReference(methods: message.decisionMethods),
            "P2 · Choose when and where")
        // Without the method record the saved identifier is printed as saved.
        XCTAssertEqual(recommendation.methodReference(), "P2 · implementation")
    }

    // MARK: - Fixtures for the synthetic cases

    private static func insights(rows: [LearningRow]) -> InsightsView {
        InsightsView(
            revision: 1, today: "2026-09-11", tryingNow: rows, learned: [], history: [],
            observations: [], memories: [], goals: [])
    }

    private static func row(
        state: LearningState,
        controls: LearningControls,
        version: Int = 1,
        actionVersion: Int = 1,
        start: YMD? = "2026-09-01",
        attempts: [LearningAttempt] = [],
        recordId: String = "learning-test",
        standing: LearningStanding = .untested,
        statusLabel: String = "Suggested"
    ) -> LearningRow {
        LearningRow(
            recordId: recordId, version: version, activeVersion: version,
            pendingVersion: nil, state: state, standing: standing, statusLabel: statusLabel,
            standingLabel: "Waiting to learn", timingLabel: "Planned start Sep 1",
            goals: [GoalRef(id: "portfolio", title: "Portfolio", status: .active, color: "hsl(184 28% 35%)")],
            change: "Leave the phone in the kitchen.",
            observation: "You said the phone takes the session.",
            hypothesis: "Removing the phone may make starting easier.",
            behaviorSignal: "Whether the session starts.", mechanismSignal: nil,
            outcomeSignal: nil, prediction: "More sessions start.",
            reviewRule: "Review after four planned occurrences.",
            comparison: "Compared with the previous fortnight.", design: .prospective,
            alternatives: [], transfer: nil, start: start, reviewAfter: "2026-09-15",
            nextReviewAfter: nil, reports: attempts.count, latestReview: nil, controls: controls,
            actionVersion: actionVersion, attempts: attempts, sources: [],
            prompt: "Let's discuss this test.")
    }

    private static func expire(_ proposal: ProposalView) -> ProposalView {
        ProposalView(
            id: proposal.id, summary: proposal.summary, headline: proposal.headline,
            consequences: proposal.consequences, booking: proposal.booking,
            affected: proposal.affected, goalId: proposal.goalId, goalTitle: proposal.goalTitle,
            conversationId: proposal.conversationId, decisionId: proposal.decisionId,
            status: proposal.status, channel: proposal.channel, expires: proposal.expires,
            expired: true, createdAt: proposal.createdAt, changes: proposal.changes,
            before: proposal.before, recommendations: proposal.recommendations,
            researchClaims: proposal.researchClaims, researchSources: proposal.researchSources)
    }

    private static func retime(
        _ message: MessageView, id: String, at: Timestamp?, channel: MessageChannel? = nil
    ) -> MessageView {
        MessageView(
            id: id, conversationId: message.conversationId, goalId: message.goalId,
            goalTitle: message.goalTitle, role: message.role, origin: message.origin,
            channel: channel ?? message.channel, text: message.text, at: at,
            decisionId: nil, links: [], references: [], reactions: [],
            authorLabel: message.authorLabel, saved: false, recommendations: [],
            decisionSummary: nil, decisionChecks: [], decisionMethods: [])
    }
}
