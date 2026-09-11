import Foundation
import XCTest

@testable import Adler

/// Decodes every payload in `docs/ios-api-examples/` and asserts values that must survive the
/// trip. A fixture that decodes but silently drops a field would pass a "does it decode?" test,
/// so each one checks real content.
nonisolated final class CoreModelsTests: XCTestCase {

    // MARK: - Every fixture decodes

    func testEveryFixtureIsCoveredByATest() throws {
        // Guards against a new example landing with no Swift model behind it.
        XCTAssertEqual(Set(Fixtures.all).count, 16)
        for name in Fixtures.all {
            XCTAssertFalse(try Fixtures.data(name).isEmpty, "\(name).json is empty")
        }
    }

    func testSessionFixture() throws {
        let fixture = try Fixtures.load(SessionView.self, "session")
        let session = fixture.response
        XCTAssertEqual(fixture.status, 200)
        XCTAssertGreaterThan(session.revision, 0)
        XCTAssertEqual(session.today.dateComponents?.year, 2026)
        XCTAssertEqual(session.user.username, "casey-example")
        XCTAssertEqual(session.preferences.timeZone, "America/Toronto")
        XCTAssertEqual(session.preferences.theme, .light)
        XCTAssertEqual(session.preferences.automation.checkInMode, .afterSession)
        XCTAssertEqual(session.preferences.automation.checkInTime, "19:00")
        XCTAssertTrue(session.status.coach.configured)
        XCTAssertEqual(session.status.coach.provider, "gemini")
        XCTAssertTrue(session.status.serverKeysAllowed)
        XCTAssertFalse(session.status.calendars.google.connected)
        // The demo fixture is regenerated, so counts move. Assert the relations that must hold.
        XCTAssertGreaterThan(session.counts.goals, 0)
        XCTAssertGreaterThan(session.counts.activeGoals, 0)
        XCTAssertLessThanOrEqual(session.counts.activeGoals, session.counts.goals)
        XCTAssertLessThanOrEqual(session.counts.drafts, session.counts.goals)
        XCTAssertTrue(session.hasGoals)
        XCTAssertFalse(session.reviewDue)
        XCTAssertEqual(session.timeZone.identifier, "America/Toronto")
    }

    func testTodayFixture() throws {
        let today = try Fixtures.load(TodayView.self, "today").response
        XCTAssertFalse(today.quietDay)
        XCTAssertFalse(today.lineup.isEmpty)
        XCTAssertEqual(today.plannedCount, today.lineup.count)

        let next = try XCTUnwrap(today.next)
        XCTAssertEqual(next.phase, .ready)
        XCTAssertEqual(next.phaseLabel, "YOUR NEXT STEP")
        XCTAssertEqual(next.headline, "Write 400 words of the guide")
        XCTAssertEqual(next.goal.id, "guide")
        XCTAssertEqual(next.durationMinutes, 20)
        XCTAssertTrue(next.canStartAction)
        XCTAssertFalse(next.canStartGoal)
        XCTAssertEqual(
            next.criterionLabel, "Finished when 400 words are saved in the guide document.")

        let action = try XCTUnwrap(next.action)
        XCTAssertEqual(action.goalId, "guide")
        XCTAssertEqual(action.measure.metric, .amount)
        // amount is unknown until the person reports; it must never arrive as 0.
        XCTAssertNil(action.amount)

        let step = try XCTUnwrap(next.step)
        XCTAssertEqual(step.type, .behavior)
        XCTAssertFalse(step.dates.isEmpty)

        let progress = try XCTUnwrap(today.progress.first)
        XCTAssertEqual(progress.goal.id, "portfolio")
        XCTAssertEqual(progress.label, "At checkpoint")
        XCTAssertEqual(progress.tone, .positive)
        XCTAssertEqual(progress.actionLabel, "Review plan")
        XCTAssertEqual(progress.unit, "milestones")
        XCTAssertEqual(progress.target, 3)

        // Records and their standings are regenerated with the demo fixture, so assert the
        // rules rather than the sample: workflow state and evidence standing are separate
        // fields with separate labels, and neither may fall back to `.unknown`.
        XCTAssertFalse(today.learning.isEmpty)
        for card in today.learning {
            XCTAssertFalse(card.recordId.isEmpty)
            XCTAssertNotEqual(card.state, .unknown, card.recordId)
            XCTAssertNotEqual(card.standing, .unknown, card.recordId)
            XCTAssertFalse(card.statusLabel.isEmpty)
            XCTAssertFalse(card.standingLabel.isEmpty)
            XCTAssertNotEqual(
                card.statusLabel, card.standingLabel,
                "workflow state and evidence standing must never share a label")
            // agree/decline use actionVersion, the rest use version.
            XCTAssertEqual(card.version(for: .agree), card.actionVersion)
            XCTAssertEqual(card.version(for: .close), card.version)
            XCTAssertEqual(card.controls.pause, card.controls.available.contains(.pause))
            XCTAssertEqual(card.controls.resume, card.controls.available.contains(.resume))
        }
        let agreed = try XCTUnwrap(today.learning.first { $0.state == .agreed })
        XCTAssertFalse(agreed.attempts.isEmpty)
        // An attempt with no saved outcome stays unknown; it is never read as "didn't happen".
        for attempt in agreed.attempts where attempt.outcome == nil {
            XCTAssertNotEqual(attempt.outcome, .didntHappen)
        }
    }

    func testGoalsFixture() throws {
        let goals = try Fixtures.load(GoalsView.self, "goals").response
        // Every row belongs to exactly one group, whatever the fixture's goal count is.
        XCTAssertFalse(goals.rows.isEmpty)
        XCTAssertEqual(
            goals.rows.count, goals.groups.reduce(0) { $0 + $1.goalIds.count })
        XCTAssertEqual(
            Set(goals.rows.map(\.goal.id)), Set(goals.groups.flatMap(\.goalIds)))
        // Example dates move with the generation run, so assert relations, not literals.
        XCTAssertEqual(
            goals.budget.weekStart.adding(days: 6, in: .gmt), goals.budget.weekEnd)
        XCTAssertGreaterThan(goals.budget.budgetMinutes, 0)
        XCTAssertFalse(goals.groups.isEmpty)
        XCTAssertEqual(goals.groups.first?.status, .active)

        let portfolio = try XCTUnwrap(goals.row("portfolio"))
        XCTAssertEqual(portfolio.goal.title, "Publish three case studies")
        XCTAssertEqual(portfolio.kind, .project)
        XCTAssertTrue(portfolio.goal.color.hasPrefix("hsl("))
        XCTAssertFalse(portfolio.activity.isEmpty)
        // Complete week columns: a multiple of seven days.
        XCTAssertEqual(portfolio.activity.count % 7, 0)
        XCTAssertTrue(portfolio.activity.allSatisfy { (0...4).contains($0.level) })
        XCTAssertFalse(portfolio.activitySummary.label.isEmpty)
    }

    func testGoalDetailFixture() throws {
        let goal = try Fixtures.load(GoalDetailView.self, "goal-detail").response
        XCTAssertEqual(goal.goal.id, "portfolio")
        XCTAssertEqual(goal.kind, .project)
        XCTAssertEqual(goal.target, 3)
        XCTAssertEqual(goal.unit, "milestones verified")
        XCTAssertEqual(goal.resultLabel, "0 of 3 case studies published")
        XCTAssertEqual(goal.statusOptions, [.paused, .completed, .setAside])
        XCTAssertEqual(goal.selectedPlanVersion, 1)
        XCTAssertEqual(goal.selectedStepId, "draft-section")
        XCTAssertNil(goal.selectedMilestoneId)
        XCTAssertEqual(goal.checkpoints.count, 2)
        XCTAssertEqual(goal.checkpoints.last?.label, "Target result")
        XCTAssertEqual(goal.milestones.first?.statusLabel, "In progress")
        XCTAssertEqual(goal.milestones.first?.actionIds.count, 4)
        XCTAssertEqual(goal.streak.count, 4)
        XCTAssertEqual(goal.streak.completedCount, 2)
        XCTAssertEqual(goal.experiment?.recordId, "learning-breakfast-cue")
        XCTAssertEqual(goal.pendingProposalIds.count, 2)
        XCTAssertNotNil(goal.nextReviewAt?.date)

        let plan = try XCTUnwrap(goal.currentPlan)
        XCTAssertTrue(plan.current)
        XCTAssertEqual(plan.window?.capacityStatus, .confirmed)
        XCTAssertEqual(plan.assessment?.triggers.contains(.checkIn), true)
        let step = try XCTUnwrap(plan.steps.first)
        XCTAssertEqual(step.id, "draft-section")
        XCTAssertEqual(step.recurrence?.weekdays, [2, 4])
        XCTAssertEqual(step.measure?.unit, "sections")

        XCTAssertEqual(goal.execution.summary.planned, 4)
        XCTAssertEqual(goal.execution.summary.done, 3)
        XCTAssertEqual(goal.execution.summary.completion, 75)
        XCTAssertEqual(goal.execution.cycles.first?.version, 1)
        // A milestone with no due date yields a marker with no `date` key at all.
        XCTAssertTrue(goal.execution.markers.contains { $0.date == nil })

        XCTAssertEqual(goal.journey.count, 4)
        XCTAssertEqual(
            goal.journey.map(\.kind), [.learningVersion, .plan, .decision, .learningReview])
        XCTAssertEqual(goal.journey.map(\.at), goal.journey.map(\.at).sorted())

        XCTAssertEqual(goal.rationale.planVersion, 1)
        XCTAssertEqual(goal.rationale.decisionId, "decision-portfolio-cue")
        XCTAssertNotNil(goal.rationale.reasoning)
        XCTAssertEqual(goal.rationale.grounding.count, 1)
        XCTAssertEqual(goal.rationale.recommendations.count, 1)
        XCTAssertNil(goal.rationale.note, "a saved rationale must not carry the empty-state note")
        XCTAssertNotNil(goal.rationale.assessmentQuestion)
    }

    func testGoalDetailProjectionFixture() throws {
        let goal = try Fixtures.load(GoalDetailView.self, "goal-detail-projection").response
        XCTAssertEqual(goal.goal.id, "guide")
        let projection = goal.projection
        XCTAssertEqual(projection.status, "Input-based projection")
        XCTAssertEqual(projection.current, 2330)
        XCTAssertEqual(projection.target, 20000)
        XCTAssertNil(projection.unavailableReason)
        XCTAssertEqual(projection.trackingLabel, "Words written")

        let scenario = try XCTUnwrap(projection.projection)
        XCTAssertEqual(scenario.origin, goal.today)
        XCTAssertLessThan(scenario.origin, try XCTUnwrap(scenario.expectedDate))
        XCTAssertLessThan(try XCTUnwrap(scenario.earliestDate), try XCTUnwrap(scenario.expectedDate))
        // No latest date is a real answer: the scenario is open-ended on that side.
        XCTAssertNil(scenario.latestDate)
        XCTAssertFalse(scenario.points.isEmpty)
        XCTAssertEqual(scenario.assumptions.count, 7)
        XCTAssertTrue(
            scenario.assumptions.contains { $0.label == "What the range means" },
            "the conditional-range caveat must survive decoding")

        let evidence = try XCTUnwrap(projection.evidence)
        XCTAssertEqual(evidence.unit, "words")
        XCTAssertEqual(evidence.paceSource, "Provisional input pace")
        XCTAssertEqual(evidence.measured, 5)
        XCTAssertFalse(evidence.daily.isEmpty)
    }

    func testCoachFixtures() throws {
        let list = try Fixtures.load(CoachView.self, "coach").response
        XCTAssertNil(list.selectedConversationId)
        XCTAssertTrue(list.messages.isEmpty)
        XCTAssertFalse(list.conversations.isEmpty)
        XCTAssertTrue(list.model.configured)
        XCTAssertLessThanOrEqual(list.quickPrompts.count, 6)

        // Proposal ids are regenerated randomly, so select by content, not by id.
        XCTAssertEqual(list.proposals.count, 2)
        XCTAssertTrue(list.proposals.allSatisfy { $0.status == .pending && !$0.expired })
        XCTAssertTrue(list.proposals.allSatisfy { $0.goalId == "portfolio" })
        XCTAssertTrue(list.proposals.allSatisfy { !$0.id.isEmpty })

        let proposal = try XCTUnwrap(
            list.proposals.first { $0.changes.contains { $0.entity == .milestone } })
        XCTAssertEqual(proposal.affected.milestones, 1)
        XCTAssertEqual(proposal.affected.actions, 0)
        XCTAssertNil(proposal.booking, "a milestone change is not an external booking")
        XCTAssertEqual(proposal.changes.count, 1)
        XCTAssertEqual(proposal.changes[0].operation, .update)
        // `values` is a JSON string, decoded lazily for the Current → Suggested comparison.
        let dueDate = try XCTUnwrap(
            proposal.changes[0].decodedValues?["dueDate"]?.stringValue)
        XCTAssertNotNil(YMD(dueDate).dateComponents)
        XCTAssertNotNil(proposal.before)
        XCTAssertEqual(proposal.recommendations.count, 1)
        XCTAssertEqual(proposal.researchClaims.count, 1)
        XCTAssertEqual(proposal.researchSources.count, 1)
        XCTAssertGreaterThan(proposal.expires, 0)
        XCTAssertNotNil(proposal.createdAt?.date)

        let recommendation = try XCTUnwrap(proposal.recommendations.first)
        XCTAssertFalse(recommendation.reasoning.limitation.isEmpty)
        XCTAssertFalse(recommendation.reasoning.principleIds.isEmpty)
        XCTAssertNotEqual(recommendation.reasoning.goalRoute, .unknown)
        XCTAssertNotEqual(recommendation.reasoning.barrier.domain, .unknown)

        let conversation = try Fixtures.load(CoachView.self, "coach-conversation").response
        XCTAssertEqual(conversation.selectedConversationId, "chat-portfolio")
        XCTAssertFalse(conversation.messages.isEmpty)
        let first = try XCTUnwrap(conversation.messages.first)
        XCTAssertEqual(first.id, "message-1")
        XCTAssertEqual(first.role, .user)
        XCTAssertEqual(first.origin, .user)
        XCTAssertEqual(first.channel, .web)
        XCTAssertEqual(first.authorLabel, "You")
        XCTAssertNotNil(first.at?.date)
        XCTAssertTrue(conversation.messages.contains { $0.role == .coach })
    }

    func testInsightsFixture() throws {
        let insights = try Fixtures.load(InsightsView.self, "insights").response
        XCTAssertFalse(insights.tryingNow.isEmpty)
        XCTAssertFalse(insights.memories.isEmpty)

        for row in insights.tryingNow {
            XCTAssertFalse(row.recordId.isEmpty)
            XCTAssertNotEqual(row.state, .unknown, row.recordId)
            XCTAssertNotEqual(row.standing, .unknown, row.recordId)
            XCTAssertNotEqual(row.design, .unknown, row.recordId)
            XCTAssertFalse(row.statusLabel.isEmpty)
            XCTAssertFalse(row.standingLabel.isEmpty)
            XCTAssertNotEqual(row.statusLabel, row.standingLabel)
            XCTAssertTrue(row.timingLabel.hasPrefix("Review "), row.timingLabel)
            XCTAssertFalse(row.attempts.isEmpty, row.recordId)
            for source in row.sources {
                XCTAssertFalse(source.kind.isEmpty)
                if let link = source.deepLink {
                    XCTAssertNotNil(AppRoute(string: link), link)
                }
            }
        }
        // `learning-breakfast-cue` is fixed by the demo fixture and carries a saved review.
        let cue = try XCTUnwrap(insights.tryingNow.first { $0.recordId == "learning-breakfast-cue" })
        let review = try XCTUnwrap(cue.latestReview)
        XCTAssertNotEqual(review.decision, .unknown)
        XCTAssertNotEqual(review.standing, .unknown)
        XCTAssertNotEqual(review.exposure, .unknown)
        XCTAssertFalse(review.exposureLabel.isEmpty)

        // Added by the backend after the first contract draft; must decode.
        XCTAssertEqual(insights.observations.count, 2)
        XCTAssertTrue(
            insights.observations.allSatisfy { $0.decisionId == "decision-editor-friday" })
        let reported = try XCTUnwrap(insights.observations.first { $0.status == .reported })
        XCTAssertEqual(reported.kindLabel, "Your observation")
        XCTAssertEqual(reported.goalIds, ["portfolio"])
        XCTAssertEqual(reported.sources.count, 1)
        let hypothesis = try XCTUnwrap(insights.observations.first { $0.status == .toTest })
        XCTAssertEqual(hypothesis.kindLabel, "Hypothesis")
        XCTAssertFalse(hypothesis.implicationLabel.isEmpty)
        XCTAssertFalse(hypothesis.changeStatus.isEmpty)

        let memory = try XCTUnwrap(insights.memories.first { $0.id == "memory-morning" })
        XCTAssertFalse(memory.corrected)
        XCTAssertTrue(memory.corrections.isEmpty)
        XCTAssertNotNil(memory.date.dateComponents)
    }

    func testLearningDetailFixture() throws {
        let detail = try Fixtures.load(LearningDetailView.self, "insight-record").response
        XCTAssertEqual(detail.row.recordId, "learning-breakfast-cue")
        XCTAssertFalse(detail.versions.isEmpty)
        XCTAssertFalse(detail.reviews.isEmpty)
        XCTAssertFalse(detail.events.isEmpty)
        XCTAssertNil(detail.pending)

        let version = try XCTUnwrap(detail.versions.first)
        XCTAssertEqual(version.version, 1)
        XCTAssertEqual(version.decisionId, "decision-portfolio-cue")
        XCTAssertEqual(version.test.design, .prospective)
        XCTAssertEqual(version.test.inputStepIds, ["draft-section"])
        XCTAssertEqual(version.sources.first?.kind, "context")
        XCTAssertEqual(version.grounding.count, 1)
        XCTAssertEqual(version.researchSources.count, 1)
        XCTAssertNotEqual(version.grounding.first?.relation, .unknown)
        XCTAssertNotNil(version.grounding.first?.claim)

        XCTAssertEqual(detail.events.first?.state, .agreed)
        // The fixture may or may not carry an invalidation; whatever it carries must decode.
        for invalidation in detail.invalidations {
            XCTAssertFalse(invalidation.sourceId.isEmpty)
        }
        XCTAssertFalse(try XCTUnwrap(detail.reviews.first).standingLabel.isEmpty)
    }

    func testCalendarFixture() throws {
        let week = try Fixtures.load(CalendarView.self, "calendar").response
        XCTAssertEqual(week.weekStart.adding(days: 6, in: .gmt), week.weekEnd)
        XCTAssertEqual(week.days.count, 7)
        XCTAssertEqual(week.days.first?.date, week.weekStart)
        XCTAssertEqual(week.days.last?.date, week.weekEnd)
        XCTAssertEqual(week.days.filter(\.isToday).count, 1)
        XCTAssertEqual(week.tentative.count, 2)
        XCTAssertEqual(week.tentative.first?.goalId, "guide")
        // Honest availability: nothing was checked, so the week is not claimed to be free.
        XCTAssertEqual(week.availability.coverage, .unknown)
        XCTAssertNil(week.availability.checkedAt)
        XCTAssertTrue(week.busy.isEmpty)
        XCTAssertNil(week.review)
        XCTAssertEqual(week.workingHours.days, [1, 2, 3, 4, 5])
        XCTAssertEqual(week.timeZone, "America/Toronto")
        XCTAssertFalse(week.basis.isEmpty)
        XCTAssertEqual(week.calendars?.google.connected, false)
    }

    func testSettingsFixture() throws {
        let settings = try Fixtures.load(SettingsView.self, "settings").response
        XCTAssertEqual(settings.user.username, "casey-example")
        XCTAssertEqual(settings.methods.count, 7)
        XCTAssertEqual(settings.methods.first?.id, "goal-definition")
        XCTAssertTrue(settings.methods.first?.enabled ?? false)
        XCTAssertFalse(settings.methods.first?.limit.isEmpty ?? true)
        XCTAssertEqual(settings.provider.selected.provider, "gemini")
        XCTAssertTrue(settings.provider.selected.useServer)
        XCTAssertEqual(settings.provider.providers.count, 3)
        XCTAssertNil(settings.provider.providers.first?.testedAt)
        XCTAssertFalse(settings.connections.configured)
        XCTAssertNil(settings.connections.link)
        XCTAssertTrue(settings.tokens.isEmpty)
        XCTAssertEqual(settings.program.version, 2)
        XCTAssertEqual(settings.program.weeklyMinutes, 360)
        XCTAssertEqual(settings.program.workDays, [1, 2, 3, 4, 5])
        XCTAssertEqual(settings.program.reviewDay, "Sunday")
        XCTAssertFalse(settings.programs.isEmpty)
        // Same fictional account as the session example, so the goal counts must agree.
        let session = try Fixtures.load(SessionView.self, "session").response
        XCTAssertEqual(settings.goals.count, session.counts.goals)
    }

    func testWriteFixtures() throws {
        let changes = try Fixtures.load(WriteResult.self, "changes").response
        XCTAssertGreaterThan(changes.revision, 0)
        // The refreshed Today in a write response carries the same revision as the envelope.
        XCTAssertEqual(changes.today.revision, changes.revision)
        XCTAssertNotNil(changes.goal)
        XCTAssertEqual(changes.goal?.goal.id, changes.goal?.progress.goal.id)
        XCTAssertEqual(changes.goal?.revision, changes.revision)

        let start = try Fixtures.load(WriteResult.self, "goal-start").response
        XCTAssertGreaterThan(start.revision, 0)
        // Starting a plan always returns the goal detail, now Active.
        let goal = try XCTUnwrap(start.goal)
        XCTAssertEqual(goal.goal.status, .active)
        XCTAssertFalse(goal.plans.isEmpty)
    }

    func testErrorFixtures() throws {
        // 409 carries the server's current revision so the client can retry.
        let response = try Fixtures.raw("changes-conflict")
        let expected = try XCTUnwrap(response["revision"] as? Int)
        let body = try JSONSerialization.data(withJSONObject: response)
        XCTAssertEqual(APIClient.failure(status: 409, body: body), .staleRevision(current: expected))
        XCTAssertTrue(
            (response["error"] as? String)?.contains("changed in another channel") ?? false)

        let notFound = try JSONSerialization.data(
            withJSONObject: try Fixtures.raw("not-found"))
        XCTAssertEqual(
            APIClient.failure(status: 404, body: notFound),
            .server(message: "This goal isn’t here.", status: 404))
        XCTAssertTrue(APIClient.failure(status: 404, body: notFound).isNotFound)

        let blocked = try JSONSerialization.data(
            withJSONObject: try Fixtures.raw("goal-start-blocked"))
        let failure = APIClient.failure(status: 400, body: blocked)
        // The server's wording is what the UI shows — never a paraphrase.
        XCTAssertEqual(
            failure.serverMessage, "Choose a first action before starting this goal’s plan.")
    }

    // MARK: - Forward compatibility

    func testUnknownEnumValuesDecodeToUnknown() throws {
        nonisolated struct Box: Decodable {
            let status: GoalStatus
            let phase: StepPhase
            let outcome: Outcome
            let standing: LearningStanding
            let relation: ClaimRelation
            let entity: ChangeEntity
        }
        let json = """
            {"status":"Hibernating","phase":"teleporting","outcome":"Sort of",
             "standing":"vibes","relation":"rhymes-with","entity":"spaceship"}
            """
        let box = try JSONDecoder().decode(Box.self, from: Data(json.utf8))
        XCTAssertEqual(box.status, .unknown)
        XCTAssertEqual(box.phase, .unknown)
        XCTAssertEqual(box.outcome, .unknown)
        XCTAssertEqual(box.standing, .unknown)
        XCTAssertEqual(box.relation, .unknown)
        XCTAssertEqual(box.entity, .unknown)
        XCTAssertTrue(box.status.isUnknown)
    }

    func testKnownEnumValuesStillDecode() throws {
        XCTAssertEqual(try decodeEnum(GoalStatus.self, "Set aside"), .setAside)
        XCTAssertEqual(try decodeEnum(Outcome.self, "Didn’t happen"), .didntHappen)
        XCTAssertEqual(try decodeEnum(ExecutionStatus.self, "unknown"), .unknown)
        XCTAssertEqual(try decodeEnum(ActivityState.self, "rest"), .rest)
        XCTAssertEqual(try decodeEnum(ReviewExposure.self, "not-used"), .notUsed)
        XCTAssertEqual(try decodeEnum(AssessmentTrigger.self, "window-end"), .windowEnd)
        XCTAssertEqual(try decodeEnum(GoalRoute.self, "habit-shaped"), .habitShaped)
        XCTAssertEqual(try decodeEnum(JourneyEntryKind.self, "learning-review"), .learningReview)
        XCTAssertEqual(try decodeEnum(CheckInMode.self, "end-of-day"), .endOfDay)
        XCTAssertEqual(try decodeEnum(SourceAccess.self, "full text excerpt"), .fullTextExcerpt)
        // Round-trips back to the same wire string.
        XCTAssertEqual(
            String(data: try JSONEncoder().encode([Outcome.didntHappen]), encoding: .utf8),
            "[\"Didn’t happen\"]")
    }

    private func decodeEnum<T: Decodable>(_ type: T.Type, _ raw: String) throws -> T {
        let json = try JSONSerialization.data(withJSONObject: [raw])
        return try JSONDecoder().decode([T].self, from: json)[0]
    }

    // MARK: - Date helpers

    func testYMDHelpers() throws {
        let toronto = try XCTUnwrap(TimeZone(identifier: "America/Toronto"))
        let day = YMD("2026-09-11")
        XCTAssertEqual(day.dateComponents?.year, 2026)
        XCTAssertEqual(day.dateComponents?.month, 9)
        XCTAssertEqual(day.dateComponents?.day, 11)
        XCTAssertNil(YMD("not-a-day").dateComponents)
        XCTAssertNil(YMD("").dateComponents)

        let start = try XCTUnwrap(day.date(in: toronto))
        XCTAssertEqual(YMD(start, in: toronto), day)
        XCTAssertEqual(day.adding(days: 3, in: toronto), YMD("2026-09-14"))
        XCTAssertEqual(day.adding(days: -11, in: toronto), YMD("2026-08-31"))
        XCTAssertEqual(day.days(until: YMD("2026-09-18"), in: toronto), 7)
        XCTAssertLessThan(YMD("2026-08-31"), YMD("2026-09-01"))

        // Zone matters: the same instant is a different day in Tokyo.
        let utc = try XCTUnwrap(TimeZone(identifier: "UTC"))
        let instant = Timestamp("2026-09-11T02:30:00.000Z")
        XCTAssertEqual(instant.day(in: utc), YMD("2026-09-11"))
        XCTAssertEqual(instant.day(in: toronto), YMD("2026-09-10"))
    }

    func testTimestampParsesBothISOForms() throws {
        XCTAssertNotNil(Timestamp("2026-09-11T05:53:54.561Z").date)
        XCTAssertNotNil(Timestamp("2026-09-13T21:00:00.000-04:00").date)
        XCTAssertNotNil(Timestamp("2026-09-13T21:00:00-04:00").date)
        XCTAssertNil(Timestamp("last Tuesday").date)
        XCTAssertEqual(
            Timestamp("2026-09-13T21:00:00.000-04:00").date,
            Timestamp("2026-09-14T01:00:00.000Z").date)
        XCTAssertLessThan(
            Timestamp("2026-08-31T13:00:00.000Z"), Timestamp("2026-09-08T13:00:00.000Z"))
    }

    // MARK: - Opaque JSON

    func testJSONValueRoundTrip() throws {
        let raw = #"{"outcome":"Done","amount":25,"nested":{"a":[1,true,null]}}"#
        let value = try XCTUnwrap(JSONValue.decoding(jsonString: raw))
        XCTAssertEqual(value["outcome"]?.stringValue, "Done")
        XCTAssertEqual(value["amount"]?.intValue, 25)
        XCTAssertEqual(value["nested"]?["a"]?.arrayValue?.count, 3)
        XCTAssertEqual(value["nested"]?["a"]?.arrayValue?[2], .null)
        // Keys are sorted and whole numbers stay integral.
        XCTAssertEqual(
            value.serialized, #"{"amount":25,"nested":{"a":[1,true,null]},"outcome":"Done"}"#)
    }

    func testJSONValueEscapesOnlyWhatItMust() {
        XCTAssertEqual(JSONValue.of("Didn’t happen").serialized, "\"Didn’t happen\"")
        XCTAssertEqual(JSONValue.of("say \"hi\"").serialized, #""say \"hi\"""#)
        XCTAssertEqual(JSONValue.of("a\nb").serialized, #""a\nb""#)
        XCTAssertEqual(JSONValue.of(20.5).serialized, "20.5")
        XCTAssertEqual(JSONValue.of(20.0).serialized, "20")
    }
}
