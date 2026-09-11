import SwiftUI

/// What was actually saved, read back from `GET /api/app/goals/:id`.
///
/// Two shapes, and the app never confuses them: a goal with milestones and a first action, or a
/// goal with neither. The second is reported as `Goal saved · plan not started` with a route to
/// choose the first action **with the coach** — no milestone, amount or date is invented to make
/// the screen look finished (FLOWS.md §1, truthfulness checks).
struct FirstPlanSavedView: View {
    let summary: FirstPlanSummary
    /// The server's refusal, verbatim, when `Start plan` was declined.
    var startError: String?
    var isStartingPlan: Bool = false
    var onStartPlan: (() -> Void)?
    let onOpenGoal: () -> Void
    let onContinueInCoach: () -> Void
    let onFinish: () -> Void

    @Environment(SessionStore.self) private var session
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @AppStorage(OnboardingCopy.contributeSeenKey) private var contributionSeen = false
    @State private var contributionDismissed = false

    private var calendar: Calendar {
        var calendar = Calendar.current
        calendar.timeZone = session.timeZone
        return calendar
    }

    var body: some View {
        VStack(alignment: .leading, spacing: AdlerLayout.sectionGap) {
            goalCard
            if let startError {
                // `Choose a first action before starting this goal's plan.` and the other
                // start-plan guards are the server's words, printed as written.
                ErrorBanner(kind: .server(detail: startError))
            }
            if summary.isUnplannedDraft {
                unplannedControls
            } else {
                plannedControls
            }
            if !contributionSeen && !contributionDismissed {
                ContributionCard {
                    contributionSeen = true
                    contributionDismissed = true
                }
            }
        }
        .accessibilityIdentifier("First plan saved")
    }

    // MARK: - The goal

    @ViewBuilder
    private var goalCard: some View {
        VStack(alignment: .leading, spacing: Space.m) {
            HStack(alignment: .top, spacing: Space.s) {
                GoalRule(color: GoalColor.parse(summary.goalColor)).frame(height: 18)
                Text(OnboardingCopy.planSavedTitle)
                    .adlerText(.eyebrow)
                    .foregroundStyle(Color.inkMuted)
                Spacer(minLength: Space.s)
                // The server's goal status, verbatim: `Draft` is not upgraded to `Active`
                // because a plan exists.
                AdlerChip(label: summary.statusLabel)
            }

            Text(summary.goalTitle)
                .adlerText(.title2)
                .foregroundStyle(Color.inkHeading)
                .fixedSize(horizontal: false, vertical: true)
                .accessibilityAddTraits(.isHeader)

            if let outcome = summary.outcomeLine {
                Text(outcome)
                    .adlerText(.callout, numeric: true)
                    .foregroundStyle(Color.ink)
                    .fixedSize(horizontal: false, vertical: true)
            }
            if let target = summary.targetDate, let date = target.date(in: session.timeZone) {
                Text("Target date · \(AdlerDate.short(date, calendar: calendar))")
                    .adlerText(.footnote, numeric: true)
                    .foregroundStyle(Color.inkMuted)
            }

            if summary.isUnplannedDraft {
                VStack(alignment: .leading, spacing: Space.xs) {
                    AdlerChip(label: OnboardingCopy.planNoPlanChip, emphasis: .attention)
                    Text(OnboardingCopy.planNoPlanBody)
                        .adlerText(.callout)
                        .foregroundStyle(Color.ink)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .padding(.top, Space.xs)
            } else {
                if !summary.milestones.isEmpty { milestones }
                if let action = summary.firstAction { firstAction(action) }
            }
        }
        .padding(AdlerLayout.cardPadding)
        .frame(maxWidth: .infinity, alignment: .leading)
        .adlerCard()
    }

    @ViewBuilder
    private var milestones: some View {
        VStack(alignment: .leading, spacing: Space.s) {
            Text(OnboardingCopy.planMilestones)
                .adlerText(.eyebrow)
                .foregroundStyle(Color.inkMuted)
            ForEach(summary.milestones) { milestone in
                VStack(alignment: .leading, spacing: Space.xxs) {
                    HStack(alignment: .firstTextBaseline, spacing: Space.s) {
                        Text(milestone.title)
                            .adlerText(.subhead)
                            .foregroundStyle(Color.ink)
                            .fixedSize(horizontal: false, vertical: true)
                        Spacer(minLength: Space.s)
                        if let due = milestone.due, let date = due.date(in: session.timeZone) {
                            Text(AdlerDate.short(date, calendar: calendar))
                                .adlerText(.footnote, numeric: true)
                                .foregroundStyle(Color.inkMuted)
                        }
                    }
                    if !milestone.criterion.isEmpty {
                        Text(milestone.criterion)
                            .adlerText(.footnote)
                            .foregroundStyle(Color.inkMuted)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .padding(.top, Space.xs)
    }

    @ViewBuilder
    private func firstAction(_ action: FirstPlanSummary.ActionLine) -> some View {
        VStack(alignment: .leading, spacing: Space.xs) {
            Text(OnboardingCopy.planFirstAction)
                .adlerText(.eyebrow)
                .foregroundStyle(Color.inkMuted)
            Text(action.title)
                .adlerText(.title3)
                .foregroundStyle(Color.inkHeading)
                .fixedSize(horizontal: false, vertical: true)
            // Each part is printed only when the record carries it.
            let parts = [
                action.criterion.isEmpty ? nil : action.criterion,
                action.timing.isEmpty ? nil : action.timing,
                action.date.flatMap { $0.date(in: session.timeZone) }
                    .map { AdlerDate.short($0, calendar: calendar) },
            ].compactMap { $0 }
            if !parts.isEmpty {
                Text(parts.joined(separator: " · "))
                    .adlerText(.subhead, numeric: true)
                    .foregroundStyle(Color.inkMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(.top, Space.xs)
    }

    // MARK: - Controls

    @ViewBuilder
    private var plannedControls: some View {
        let layout = dynamicTypeSize.prefersStackedControls
            ? AnyLayout(VStackLayout(alignment: .leading, spacing: Space.s))
            : AnyLayout(HStackLayout(spacing: Space.m))
        VStack(alignment: .leading, spacing: Space.s) {
            // A saved plan that has not been started shows nothing on Today, and the coach's own
            // reply says to start it. Offering it here is the difference between landing on a
            // working Today and landing on an empty one.
            if canStartPlan, let onStartPlan {
                Text(OnboardingCopy.planNotStartedBody)
                    .adlerText(.footnote)
                    .foregroundStyle(Color.inkMuted)
                    .fixedSize(horizontal: false, vertical: true)
                layout {
                    AdlerPrimaryButton(
                        title: isStartingPlan
                            ? OnboardingCopy.planStartingPlan : OnboardingCopy.planStartPlan,
                        action: onStartPlan
                    )
                    .disabled(isStartingPlan)
                    .accessibilityIdentifier("Start plan")
                    AdlerQuietButton(title: OnboardingCopy.planGoToToday, action: onFinish)
                        .accessibilityIdentifier("Go to Today")
                }
            } else {
                layout {
                    AdlerPrimaryButton(title: OnboardingCopy.planGoToToday, action: onFinish)
                        .accessibilityIdentifier("Go to Today")
                    AdlerQuietButton(title: OnboardingCopy.planOpenGoal, action: onOpenGoal)
                }
            }
        }
    }

    /// Only a Draft can be started, and only when there is work to start.
    private var canStartPlan: Bool {
        summary.statusLabel == GoalStatus.draft.rawValue && !summary.isUnplannedDraft
    }

    @ViewBuilder
    private var unplannedControls: some View {
        let layout = dynamicTypeSize.prefersStackedControls
            ? AnyLayout(VStackLayout(alignment: .leading, spacing: Space.s))
            : AnyLayout(HStackLayout(spacing: Space.m))
        layout {
            AdlerPrimaryButton(
                title: OnboardingCopy.planChooseFirstAction, action: onContinueInCoach
            )
            .accessibilityIdentifier("Choose the first action")
            AdlerQuietButton(title: OnboardingCopy.planGoToToday, action: onFinish)
        }
    }
}

/// "What you contribute, what Adler manages" — the one explanatory card of the whole flow
/// (`docs/product-principles.md`: *the person should understand what they contribute and what
/// Adler manages*). Dismissible, shown once, and it makes a claim about the app's limits rather
/// than a promise about results.
///
/// It lives here because onboarding is the first landing. `OnboardingCopy.contributeSeenKey` is
/// the flag, so Today can take the card over without showing it twice.
struct ContributionCard: View {
    var onDismiss: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: Space.s) {
            Text(OnboardingCopy.contributeTitle)
                .adlerText(.title3)
                .foregroundStyle(Color.inkHeading)
                .fixedSize(horizontal: false, vertical: true)
            Text(OnboardingCopy.contributeYou)
                .adlerText(.callout)
                .foregroundStyle(Color.ink)
                .fixedSize(horizontal: false, vertical: true)
            Text(OnboardingCopy.contributeAdler)
                .adlerText(.callout)
                .foregroundStyle(Color.ink)
                .fixedSize(horizontal: false, vertical: true)
            Text(OnboardingCopy.contributeLimit)
                .adlerText(.footnote)
                .foregroundStyle(Color.inkMuted)
                .fixedSize(horizontal: false, vertical: true)
            AdlerQuietButton(title: OnboardingCopy.contributeDismiss, action: onDismiss)
        }
        .padding(AdlerLayout.cardPadding)
        .frame(maxWidth: .infinity, alignment: .leading)
        .adlerWell(radius: Radii.card, padding: AdlerLayout.cardPadding)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("Contribution card")
    }
}

/// Fictional design data — a goal that was saved with a plan.
#Preview("Saved with a plan") {
    ScrollView {
        FirstPlanSavedView(
            summary: FirstPlanSummary(
                goalId: "g-1", goalTitle: "Publish 3 portfolio case studies",
                goalColor: "hsl(140 35% 35%)", statusLabel: "Draft",
                outcomeLine: "Case studies published · target 3", targetDate: "2026-12-15",
                milestones: [
                    .init(id: "m1", title: "First case study drafted", criterion: "Draft complete",
                          due: "2026-10-20", statusLabel: "Milestone still open")
                ],
                firstAction: .init(
                    id: "a1", title: "Write for 25 minutes", criterion: "One section",
                    timing: "8:30", date: "2026-09-15", durationMinutes: 25)),
            onOpenGoal: {}, onContinueInCoach: {}, onFinish: {})
        .padding(AdlerLayout.screenMargin)
    }
    .background(Color.canvas)
    .environment(SessionStore(client: APIClient()))
}

/// Fictional design data — a Draft the coach saved without any work.
#Preview("Saved without a plan") {
    ScrollView {
        FirstPlanSavedView(
            summary: FirstPlanSummary(
                goalId: "g-2", goalTitle: "Run a 10k without walking",
                goalColor: "hsl(20 60% 35%)", statusLabel: "Draft", outcomeLine: nil,
                targetDate: nil, milestones: [], firstAction: nil),
            onOpenGoal: {}, onContinueInCoach: {}, onFinish: {})
        .padding(AdlerLayout.screenMargin)
    }
    .background(Color.canvas)
    .environment(SessionStore(client: APIClient()))
}
