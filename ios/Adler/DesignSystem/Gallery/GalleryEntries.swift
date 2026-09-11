#if DEBUG
import SwiftUI

// Every sample below is fictional design data, written for this gallery.
// Nothing here is a real account, a real result or a real research finding.

private let galleryPortfolio = DisplayGoal(id: "g1", title: "Portfolio", hsl: "hsl(142 45% 35%)")
private let galleryReading = DisplayGoal(id: "g2", title: "Reading", hsl: "hsl(28 52% 35%)")
private let galleryJobs = DisplayGoal(id: "g3", title: "Job search", hsl: "hsl(210 40% 35%)")

struct GalleryHeading: View {
    let text: String
    var body: some View {
        Text(text)
            .adlerText(.eyebrow)
            .foregroundStyle(Color.inkMuted)
    }
}

struct GalleryTokens: View {
    private let swatches: [(String, Color)] = [
        ("canvas", .canvas), ("surface", .surface), ("surfaceSunken", .surfaceSunken),
        ("ink", .ink), ("inkMuted", .inkMuted), ("inkHeading", .inkHeading),
        ("separator", .separator), ("accentGreen", .accentGreen), ("accentInk", .accentInk),
        ("accentLime", .accentLime),
        ("accentPeach", .accentPeach), ("focusRing", .focusRing), ("warning", .warning), ("danger", .danger)
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: Space.m) {
            GalleryHeading(text: "Semantic palette")
            ForEach(swatches, id: \.0) { name, color in
                HStack(spacing: Space.m) {
                    RoundedRectangle(cornerRadius: Radii.chip)
                        .fill(color)
                        .frame(width: 44, height: 28)
                        .overlay { RoundedRectangle(cornerRadius: Radii.chip).strokeBorder(Color.separator, lineWidth: 1) }
                    Text(name).adlerText(.subhead).foregroundStyle(Color.ink)
                }
            }
            GalleryHeading(text: "Goal colours · 35% light / 62% dark")
            HStack(spacing: Space.m) {
                ForEach(["hsl(142 45% 35%)", "hsl(28 52% 35%)", "hsl(210 40% 35%)", "hsl(348 44% 35%)"], id: \.self) { hsl in
                    RoundedRectangle(cornerRadius: Radii.chip)
                        .fill(GoalColor.parse(hsl).color)
                        .frame(width: 56, height: 28)
                }
            }
        }
    }
}

struct GalleryTypography: View {
    private let styles: [(AdlerTextStyle, String)] = [
        (.display, "Following through"), (.title1, "Leave your phone in the kitchen"),
        (.title2, "Write for 25 minutes"), (.title3, "What we’re learning"),
        (.headline, "Publish a portfolio"), (.body, "Adler turns your goal into work you can do today."),
        (.callout, "Accepting this saves the plan."), (.subhead, "25 minutes of drafting · 8:30"),
        (.footnote, "Saved 8:56 · Done · 25 minutes"), (.caption, "Recorded results"),
        (.eyebrow, "Observation")
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: Space.m) {
            ForEach(Array(styles.enumerated()), id: \.offset) { _, entry in
                VStack(alignment: .leading, spacing: 2) {
                    Text(String(describing: entry.0)).adlerText(.caption).foregroundStyle(Color.inkMuted)
                    Text(entry.1).adlerText(entry.0).foregroundStyle(Color.inkHeading)
                }
            }
            GalleryHeading(text: "Tabular numerals")
            Text("1 of 3 · 25 minutes · 13 Oct").adlerText(.body, numeric: true).foregroundStyle(Color.ink)
        }
    }
}

private func galleryAction(_ state: ActionCardState) -> ActionCardModel {
    ActionCardModel(
        goal: galleryPortfolio,
        title: "Write for 25 minutes",
        criterion: "25 minutes of drafting",
        timing: "8:30",
        cue: "Phone in the kitchen",
        state: state
    )
}

struct GalleryActionCards: View {
    var body: some View {
        VStack(alignment: .leading, spacing: Space.l) {
            GalleryHeading(text: "Planned")
            ActionCard(model: galleryAction(.planned), onStart: {}, onReport: {}, onSchedule: {}, onChoose: {})
            GalleryHeading(text: "Started")
            ActionCard(model: galleryAction(.started(at: .now)), onStart: {}, onReport: {}, onSchedule: {})
            GalleryHeading(text: "Reported")
            ActionCard(model: galleryAction(.reported(receipt: "Saved 8:56 · Done · 25 minutes")), onReport: {})
            GalleryHeading(text: "Scheduled")
            ActionCard(model: galleryAction(.scheduled(at: .now)), onStart: {}, onReport: {}, onSchedule: {})
            GalleryHeading(text: "Draft goal · rest day · retired")
            ActionCard(model: ActionCardModel(goal: galleryPortfolio, title: "Publish a portfolio", state: .draftGoal), onChoose: {})
            ActionCard(model: ActionCardModel(goal: galleryReading, title: "No work planned today", state: .restDay))
            ActionCard(model: galleryAction(.retired))
            GalleryHeading(text: "Compact (goal detail)")
            ActionCard(model: galleryAction(.planned), scale: .compact, onStart: {}, onReport: {}, onSchedule: {})
        }
    }
}

struct GalleryReportSheet: View {
    @State private var showsEmpty = false
    @State private var showsSaved = false

    var body: some View {
        VStack(alignment: .leading, spacing: Space.l) {
            GalleryHeading(text: "The sheet opens automatically so it can be screenshotted")
            AdlerSecondaryButton(title: "Open an empty report") { showsEmpty = true }
            AdlerSecondaryButton(title: "Open a saved report with a correction") { showsSaved = true }
            Text("No outcome is preselected and Save stays disabled until one is chosen. A blank amount stays unknown — it is never recorded as zero.")
                .adlerText(.callout)
                .foregroundStyle(Color.inkMuted)
        }
        .onAppear { showsEmpty = true }
        .sheet(isPresented: $showsEmpty) {
            ReportSheet(
                actionTitle: "Write for 25 minutes · Tue 13 Oct",
                plannedDate: .now,
                unit: "minutes",
                asksMinutes: false,
                onSave: { _ in showsEmpty = false },
                onCancel: { showsEmpty = false }
            )
        }
        .sheet(isPresented: $showsSaved) {
            ReportSheet(
                actionTitle: "Read 20 pages · Mon 12 Oct",
                plannedDate: .now,
                unit: "pages",
                asksMinutes: true,
                receipt: ReportReceipt(savedAt: .now, outcome: .done, amountText: nil, correctedFrom: "Partly · 1 page"),
                onSave: { _ in showsSaved = false },
                onCancel: { showsSaved = false }
            )
        }
    }
}

private func galleryRecommendation(_ state: RecommendationState, _ label: String) -> RecommendationContent {
    RecommendationContent(
        goal: galleryPortfolio,
        action: "Leave your phone in the kitchen before writing.",
        observation: "You had 25 minutes to write on 1 and 10 October and reported spending them on your phone.",
        interpretation: "Situation modification changes what is available at the moment of the decision, rather than relying on resisting it.",
        methodReference: "P7 · Situation modification",
        expectedEffect: "Whether you report fewer interrupted sessions over the next two writing days.",
        limitation: "Two reports support trying this again, not a conclusion about what works for you.",
        state: state,
        stateLabel: label
    )
}

struct GalleryRecommendations: View {
    var body: some View {
        VStack(alignment: .leading, spacing: Space.l) {
            GalleryHeading(text: "Pending — the only state with decision controls")
            RecommendationCard(
                content: galleryRecommendation(.pending, "Suggested"),
                onTryThis: {}, onNoThanks: {}, onDiscuss: {}, onEdit: {}, onWhyThis: {}
            )
            GalleryHeading(text: "Agreed")
            RecommendationCard(content: galleryRecommendation(.agreed, "Live experiment"), onCorrect: {}, onWhyThis: {})
            GalleryHeading(text: "Declined")
            RecommendationCard(content: galleryRecommendation(.declined, "Declined"), onWhyThis: {})
            GalleryHeading(text: "Applied")
            RecommendationCard(content: galleryRecommendation(.applied, "Reviewed"), onWhyThis: {})
        }
    }
}

private var galleryProposal: ProposalContent {
    ProposalContent(
        goal: galleryPortfolio,
        title: "New writing plan",
        comparisons: [
            ChangeComparisonRow(id: "1", field: "Action", current: "Write 25 min at 8:30", suggested: "Leave the phone in the kitchen, then write 25 min at 8:30"),
            ChangeComparisonRow(id: "2", field: "Review", current: nil, suggested: "Review on 25 Oct"),
            ChangeComparisonRow(id: "3", field: "Milestone", current: "Case study 2 by 20 Oct", suggested: nil),
            ChangeComparisonRow(id: "4", field: "Action", current: "Read 20 pages on Sunday", suggested: nil, removed: true)
        ],
        affectedSummary: "Affects 2 actions · 1 plan version",
        expiryNote: "Expires 20 Oct. If your workspace has changed, Adler will need to make an updated proposal."
    )
}

struct GalleryProposals: View {
    var body: some View {
        VStack(alignment: .leading, spacing: Space.l) {
            GalleryHeading(text: "Pending")
            ProposalCard(content: galleryProposal, onApprove: {}, onDismiss: {}, onReviewChanges: {}, onWhyThis: {})
            GalleryHeading(text: "With a booking consequence")
            ProposalCard(
                content: {
                    var content = galleryProposal
                    content.bookingConsequence = "Accepting this also books 8:30–8:55 on Tuesday in Work calendar."
                    return content
                }(),
                onApprove: {}, onDismiss: {}, onReviewChanges: {}, onWhyThis: {}
            )
            GalleryHeading(text: "Approved · dismissed")
            ProposalCard(
                content: {
                    var content = galleryProposal
                    content.state = .approved(at: .now)
                    return content
                }(),
                onViewPlan: {}
            )
            ProposalCard(content: {
                var content = galleryProposal
                content.state = .dismissed
                return content
            }())
        }
    }
}

private func galleryLearningRow(_ workflow: String, _ standing: String, attempts: Int, review: Date?) -> LearningSummaryRowContent {
    let today = Date()
    let day: TimeInterval = 86_400
    return LearningSummaryRowContent(
        goal: galleryPortfolio,
        change: "Leave the phone in the kitchen",
        workflowLabel: workflow,
        standingLabel: standing,
        attemptsReported: attempts,
        timeline: LearningTimelineLayout(
            plannedStart: today.addingTimeInterval(-8 * day),
            attempts: (0..<attempts).map { today.addingTimeInterval(Double(-7 + $0 * 2) * day) },
            review: review,
            today: today
        )
    )
}

struct GalleryLearning: View {
    var body: some View {
        VStack(alignment: .leading, spacing: Space.l) {
            GalleryHeading(text: "Running, with two reported attempts")
            LearningSummaryRow(content: galleryLearningRow("Live experiment", "Consistent so far", attempts: 2, review: Date().addingTimeInterval(12 * 86_400)), onOpen: {})
            GalleryHeading(text: "Suggested — nothing has started")
            LearningSummaryRow(content: galleryLearningRow("Suggested", "Waiting to learn", attempts: 0, review: nil), onOpen: {})
            GalleryHeading(text: "Evidence changed")
            LearningSummaryRow(content: galleryLearningRow("Needs another look", "Evidence has changed", attempts: 3, review: Date().addingTimeInterval(2 * 86_400)), onOpen: {})
            GalleryHeading(text: "Timeline alone")
            LearningTimeline(
                layout: galleryLearningRow("Live experiment", "Consistent so far", attempts: 2, review: Date().addingTimeInterval(12 * 86_400)).timeline,
                goal: galleryPortfolio.color
            )
        }
    }
}

struct GalleryChips: View {
    var body: some View {
        VStack(alignment: .leading, spacing: Space.l) {
            GalleryHeading(text: "Workflow state (filled)")
            FlowLayout {
                ForEach(["Suggested", "Starting soon", "Live experiment", "Ready to review", "Reviewed", "Paused", "Finished", "Declined", "Needs another look"], id: \.self) {
                    WorkflowChip(label: $0)
                }
            }
            GalleryHeading(text: "Evidence standing (outlined)")
            FlowLayout {
                ForEach(["Waiting to learn", "More context needed", "Consistent so far", "Mixed observations", "Not supported in this context", "Evidence has changed"], id: \.self) {
                    EvidenceChip(label: $0)
                }
            }
            GalleryHeading(text: "Both — one line, never merged")
            StatusChipPair(workflow: "Live experiment", standing: "Consistent so far")
            StatusChipPair(workflow: "Needs another look", standing: "Evidence has changed")
            GalleryHeading(text: "Single purpose")
            FlowLayout {
                AdlerChip(label: "Focus", emphasis: .filled)
                AdlerChip(label: "Draft")
                AdlerChip(label: "Active")
                AdlerChip(label: "Paused")
                AdlerChip(label: "Completed")
                AdlerChip(label: "Set aside")
                AdlerChip(label: "Stale", emphasis: .attention)
                AdlerChip(label: "No measure", emphasis: .attention)
                AdlerChip(label: "Proposed change")
                AdlerChip(label: "Approved 13 Oct", emphasis: .filled, symbol: "checkmark")
                AdlerChip(label: "Retired")
            }
            GalleryHeading(text: "Claim relations")
            FlowLayout {
                ForEach(EvidenceRelation.allCases, id: \.self) { RelationChip(relation: $0) }
            }
        }
    }
}

struct GalleryEvidence: View {
    @State private var showsFull = false
    @State private var showsSparse = false

    var body: some View {
        VStack(alignment: .leading, spacing: Space.l) {
            GalleryHeading(text: "The sheet opens automatically so it can be screenshotted")
            AdlerSecondaryButton(title: "Open the full record") { showsFull = true }
            AdlerSecondaryButton(title: "Open a sparse record") { showsSparse = true }
            Text("Only saved fields render. A record with no claims or sources shows neither section rather than an empty one.")
                .adlerText(.callout)
                .foregroundStyle(Color.inkMuted)
        }
        .onAppear { showsFull = true }
        .sheet(isPresented: $showsFull) {
            EvidenceDisclosure(record: evidencePreviewRecord) { showsFull = false }
        }
        .sheet(isPresented: $showsSparse) {
            EvidenceDisclosure(
                record: EvidenceRecord(
                    mechanism: "This plan records your chosen work.",
                    limitation: "No behavioural interpretation is saved for this version."
                )
            ) { showsSparse = false }
        }
    }
}

struct GalleryReasoning: View {
    var body: some View {
        VStack(alignment: .leading, spacing: AdlerLayout.sectionGap) {
            GalleryHeading(text: "With dated feedback and the action's own control")
            ReasoningDiagram(
                content: ReasoningDiagramContent(
                    reports: "1 Oct · 10 Oct",
                    research: "P7 · Situation modification",
                    explanation: "Changing the setup may reduce the pull to check the phone during a writing session.",
                    action: "Leave the phone in the kitchen",
                    laterFeedback: "13 Oct · 15 Oct · review 25 Oct",
                    goalColor: galleryPortfolio.color
                ),
                controlTitle: "Try this",
                onControl: {}
            )
            GalleryHeading(text: "Nothing reported yet")
            ReasoningDiagram(
                content: ReasoningDiagramContent(
                    reports: "3 Oct",
                    research: "P2 · Implementation intentions",
                    explanation: "Naming when and where the work happens may reduce the decision cost at the moment it starts.",
                    action: "Write at 8:30 at the kitchen table",
                    laterFeedback: nil,
                    goalColor: galleryReading.color
                )
            )
        }
    }
}

struct GalleryGoalRows: View {
    var body: some View {
        VStack(alignment: .leading, spacing: Space.l) {
            GoalSummaryRow(
                content: GoalSummaryRowContent(
                    goal: DisplayGoal(id: "g1", title: "Publish a portfolio", hsl: "hsl(142 45% 35%)"),
                    chips: ["Focus", "Active"],
                    resultLine: "1 of 3 case studies published · target 3 by 1 Nov",
                    activity: ActivityGridLayout(marks: previewActivityMarks(), today: .now, weekCount: 8),
                    input: previewInputSeries(),
                    nextLine: "Next: case study 2 by 1 Nov",
                    deltaLabel: "Update needed"
                ),
                onOpen: {}
            )
            GoalSummaryRow(
                content: GoalSummaryRowContent(
                    goal: galleryReading,
                    chips: ["Active"],
                    resultLine: "No outcome measure saved",
                    activity: ActivityGridLayout(marks: previewActivityMarks(), today: .now, weekCount: 8),
                    nextLine: "Next checkpoint · not set",
                    deltaLabel: "No outcome measure"
                ),
                onOpen: {}
            )
            GoalSummaryRow(
                content: GoalSummaryRowContent(
                    goal: galleryJobs,
                    chips: ["Draft"],
                    resultLine: "Goal saved · plan not started"
                ),
                onOpen: {}
            )
        }
    }
}

struct GalleryActivity: View {
    var body: some View {
        VStack(alignment: .leading, spacing: Space.l) {
            GalleryHeading(text: "4 weeks")
            ActivityGrid(layout: ActivityGridLayout(marks: previewActivityMarks(), today: .now, weekCount: 4), goal: galleryPortfolio.color)
            GalleryHeading(text: "14 weeks")
            ActivityGrid(layout: ActivityGridLayout(marks: previewActivityMarks(), today: .now, weekCount: 14), goal: galleryReading.color)
            GalleryHeading(text: "No check-ins yet")
            ActivityGrid(layout: ActivityGridLayout(marks: [], today: .now, weekCount: 8), goal: galleryJobs.color)
            GalleryHeading(text: "Cell states")
            VStack(alignment: .leading, spacing: Space.s) {
                ForEach(DayState.allCases) { state in
                    HStack(spacing: Space.m) {
                        DayStateCell(state: state, goal: galleryPortfolio.color, size: 14)
                        Text(state.label).adlerText(.footnote).foregroundStyle(Color.ink)
                    }
                }
            }
        }
    }
}

struct GalleryStreak: View {
    private var days: [DayMark] {
        let states: [DayState] = [.done, .done, .rest, .done, .short, .done, .unknown, .upcoming]
        return states.enumerated().map { offset, state in
            DayMark(date: Date(timeIntervalSinceNow: Double(offset - 6) * 86_400), state: state)
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: Space.l) {
            GalleryHeading(text: "Seven days, four completions, one planned rest day")
            StreakLane(daysOnPlan: 7, actionsCompleted: 4, days: days, goal: galleryPortfolio.color)
            GalleryHeading(text: "First day")
            StreakLane(daysOnPlan: 1, actionsCompleted: 1, days: Array(days.prefix(3)), goal: galleryReading.color)
        }
    }
}

struct GalleryBudget: View {
    var body: some View {
        VStack(alignment: .leading, spacing: Space.l) {
            GalleryHeading(text: "Within budget, with unplaced work")
            WeeklyBudgetBar(
                budget: WeeklyBudget(
                    segments: [
                        BudgetSegment(id: "1", goal: galleryPortfolio, minutes: 150),
                        BudgetSegment(id: "2", goal: galleryReading, minutes: 100)
                    ],
                    unplacedMinutes: 30,
                    budgetMinutes: 300
                ),
                onOpenCalendar: {}
            )
            GalleryHeading(text: "Over budget")
            WeeklyBudgetBar(
                budget: WeeklyBudget(
                    segments: [
                        BudgetSegment(id: "1", goal: galleryPortfolio, minutes: 240),
                        BudgetSegment(id: "2", goal: galleryReading, minutes: 120),
                        BudgetSegment(id: "3", goal: galleryJobs, minutes: 90)
                    ],
                    budgetMinutes: 300
                ),
                onOpenCalendar: {}
            )
        }
    }
}

struct GalleryMilestones: View {
    @State private var selection: MilestoneMarker.ID? = "m2"

    var body: some View {
        let day: TimeInterval = 86_400
        VStack(alignment: .leading, spacing: Space.l) {
            GalleryHeading(text: "Selecting a milestone scopes the action canvas below it")
            MilestoneRail(
                markers: [
                    MilestoneMarker(id: "m1", kind: .milestone, title: "Case study 1 published", due: Date().addingTimeInterval(-10 * day), state: .verified, criterion: "Live on the site"),
                    MilestoneMarker(id: "m2", kind: .milestone, title: "Case study 2 drafted", due: Date().addingTimeInterval(7 * day), state: .open, criterion: "1,200 words reviewed"),
                    MilestoneMarker(id: "m3", kind: .checkpoint, title: "2 case studies", due: Date().addingTimeInterval(14 * day), state: .open),
                    MilestoneMarker(id: "m4", kind: .review, title: "Plan review", due: Date().addingTimeInterval(21 * day), state: .review),
                    MilestoneMarker(id: "m5", kind: .milestone, title: "Case study 3 published", due: nil, state: .open)
                ],
                goal: galleryPortfolio.color,
                selection: $selection
            )
        }
    }
}

struct GalleryInputChart: View {
    var body: some View {
        VStack(alignment: .leading, spacing: Space.l) {
            GalleryHeading(text: "Reported amounts, the plan's amount per occurrence, and days with no report")
            InputChart(series: previewInputSeries(), goal: galleryPortfolio.color)
            GalleryHeading(text: "Dated report strip")
            ReportStrip(series: previewInputSeries(), goal: galleryPortfolio.color, onSelect: { _ in })
            GalleryHeading(text: "Sparkline (All Goals)")
            InputChart(series: previewInputSeries(), goal: galleryPortfolio.color, scale: .compact)
            GalleryHeading(text: "One-time work")
            InputChart(
                series: InputSeries(
                    points: [0, 3, 7].map {
                        InputPoint(date: Date().addingTimeInterval(Double($0 - 9) * 86_400), amount: 1, state: .done)
                    },
                    unit: "applications",
                    measure: "Applications sent",
                    isOneTime: true
                ),
                goal: galleryJobs.color
            )
        }
    }
}

struct GalleryOutcomeChart: View {
    let unavailable: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: Space.l) {
            if unavailable {
                GalleryHeading(text: "No projection — the server's reason, verbatim")
                OutcomeChart(
                    content: {
                        var content = previewOutcomeContent(
                            withProjection: false,
                            unavailable: "No finish estimate yet: two results cannot establish a pace, and the last report is older than the current checkpoint."
                        )
                        content.staleNote = "Last report 8 Oct"
                        content.undatedCompletions = ["Case study 1"]
                        return content
                    }(),
                    goal: galleryPortfolio.color,
                    onWhatWouldHelp: {}
                )
            } else {
                GalleryHeading(text: "Observed results, plan checkpoints, target, today, scenario band")
                OutcomeChart(
                    content: previewOutcomeContent(withProjection: true),
                    goal: galleryPortfolio.color,
                    onAssumptions: {}
                )
            }
        }
    }
}

struct GalleryProgressRing: View {
    var body: some View {
        HStack(spacing: Space.xxl) {
            ProgressRing(done: 1, total: 3)
            ProgressRing(done: 3, total: 3)
            ProgressRing(done: 0, total: 0)
        }
    }
}

struct GalleryCardDeck: View {
    @State private var selection = 0

    var body: some View {
        CardDeck(
            titles: ["Do", "Progress", "Learn"],
            accessibilityLabels: [
                "1 of 3: What you need to do today",
                "2 of 3: Your progress",
                "3 of 3: What we’re learning"
            ],
            selection: $selection
        ) { index in
            VStack(alignment: .leading, spacing: Space.m) {
                Text(["What you need to do today", "Your progress", "What we’re learning"][index])
                    .adlerText(.title2)
                    .foregroundStyle(Color.inkHeading)
                Text("Card content \(index + 1)").adlerText(.callout).foregroundStyle(Color.inkMuted)
                Spacer(minLength: 0)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(AdlerLayout.todayCardPadding)
            .adlerFanBackground(seed: index)
            .overlay { RoundedRectangle(cornerRadius: Radii.largeCard).strokeBorder(Color.separator, lineWidth: 1) }
            .padding(.horizontal, Space.s)
        }
        .frame(height: 340)
    }
}

struct GalleryConversation: View {
    var body: some View {
        VStack(spacing: Space.m) {
            ConversationBubble(message: ConversationMessage(id: "1", role: .user, text: "I had time to write but spent it scrolling on my phone.", timestamp: .now))
            ConversationBubble(message: ConversationMessage(id: "2", role: .coach, text: "That is useful. The time existed, so the plan does not need more time — it needs the phone out of reach. Shall we test that for two sessions?", timestamp: .now, links: [MessageLink(id: "l1", title: "Open Portfolio · Progress", action: {})]))
            ConversationBubble(message: ConversationMessage(id: "3", role: .user, text: "Wrote for 25 minutes today.", channel: "sms"))
            ConversationBubble(message: ConversationMessage(id: "4", role: .coach, inProgress: true))
        }
    }
}

struct GalleryComposer: View {
    @State private var text = ""
    @State private var responding = false

    var body: some View {
        VStack(alignment: .leading, spacing: Space.l) {
            GalleryHeading(text: "Quick prompts insert text; they never send")
            Composer(
                text: $text,
                quickPrompts: ["Something got in the way", "What should I do today?", "Review what happened this week", "I want to start a goal"],
                attachedContext: "Leave the phone in the kitchen",
                isResponding: responding,
                onSend: { responding = true },
                onStop: { responding = false },
                onRemoveContext: {}
            )
            .adlerCard(.flat, radius: Radii.card)
        }
    }
}

struct GalleryEmpty: View {
    var body: some View {
        VStack(spacing: Space.l) {
            EmptyStateView(title: EmptyStateCopy.noGoals.title, message: EmptyStateCopy.noGoals.body, actionTitle: "Start with a goal", action: {})
            EmptyStateView(title: EmptyStateCopy.noLearning.title, message: EmptyStateCopy.noLearning.body, actionTitle: "Share how it went", action: {})
            EmptyStateView(title: EmptyStateCopy.noOutcomeMeasure.title, message: EmptyStateCopy.noOutcomeMeasure.body)
            EmptyStateView(title: EmptyStateCopy.restDay.title, message: EmptyStateCopy.restDay.body, actionTitle: "Choose a goal", action: {})
            EmptyStateView(title: EmptyStateCopy.calendarNotConnected.title, message: EmptyStateCopy.calendarNotConnected.body)
        }
    }
}

struct GalleryBanners: View {
    var body: some View {
        VStack(spacing: Space.l) {
            ErrorBanner(kind: .offline, action: {})
            ErrorBanner(kind: .server(detail: "Proposal 4f2 is no longer pending."), action: {}, onDismiss: {})
            ErrorBanner(kind: .signedOut, action: {})
            ErrorBanner(kind: .noProvider, action: {})
            StaleRevisionBanner(changeSummary: "the 8:30 session moved to 9:00", onRetry: {})
            StaleRevisionBanner(changeSummary: nil, recordGone: true, onRefresh: {})
        }
    }
}

struct GallerySkeletons: View {
    var body: some View {
        VStack(alignment: .leading, spacing: Space.l) {
            RefreshHairline()
            SkeletonRow()
            SkeletonRow()
            SkeletonCard()
            SkeletonChart()
        }
    }
}

struct GalleryFans: View {
    var body: some View {
        VStack(spacing: Space.l) {
            ForEach(0..<3, id: \.self) { seed in
                VStack(alignment: .leading, spacing: Space.s) {
                    Text("PORTFOLIO").adlerText(.eyebrow).foregroundStyle(Color.inkMuted)
                    Text("Write for 25 minutes").adlerText(.title2).foregroundStyle(Color.inkHeading)
                    Text("Art never sits under text without a scrim.").adlerText(.callout).foregroundStyle(Color.inkMuted)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(AdlerLayout.todayCardPadding)
                .adlerFanBackground(seed: seed)
                .overlay { RoundedRectangle(cornerRadius: Radii.largeCard).strokeBorder(Color.separator, lineWidth: 1) }
            }
        }
    }
}
#endif
