import SwiftUI

/// Today 01 Do — the next useful action, today's lineup and the routes out (DESIGN.md §5.4).
///
/// Hierarchy: the single next action → the ring → the full lineup → routes out. The ring counts
/// **reported done today out of today's actions**; it is never a percentage across goals and
/// never the only place the count appears.
struct TodayDoCard: View {
    let today: TodayView
    let dates: TodayDates
    let palette: TodayGoalPalette
    let busy: Bool
    let onSheet: (TodaySheet) -> Void
    let onStart: (ActionView) -> Void

    @Environment(AppRouter.self) private var router
    @Environment(WorkspaceStore.self) private var workspace
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    @State private var showsAllActions = false
    @State private var actionMenu = false

    private var next: NextStepPresentation? {
        today.next.map { NextStepPresentation.make(next: $0, dates: dates) }
    }

    private var rows: [LineupRow] {
        today.lineup.map { LineupRow.make($0, palette: palette) }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AdlerLayout.sectionGap) {
                CardHeading(number: "01", title: TodayDeck.cardTitles[0])
                stage
                lineup
                footer
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(AdlerLayout.todayCardPadding)
        }
        .scrollBounceBehavior(.basedOnSize)
        .refreshable { await workspace.loadToday() }
        .adlerFanBackground(seed: 0)
        .overlay {
            RoundedRectangle(cornerRadius: Radii.largeCard)
                .strokeBorder(Color.separator, lineWidth: 1)
        }
        .clipShape(.rect(cornerRadius: Radii.largeCard))
    }

    // MARK: - The one thing to do

    @ViewBuilder
    private var stage: some View {
        let ring = ProgressRing(done: today.doneCount, total: today.plannedCount)
        if let next, !today.quietDay {
            let layout =
                dynamicTypeSize.prefersStackedControls
                ? AnyLayout(VStackLayout(alignment: .leading, spacing: Space.l))
                : AnyLayout(HStackLayout(alignment: .top, spacing: Space.l))
            layout {
                VStack(alignment: .leading, spacing: Space.s) {
                    if !next.phaseLabel.isEmpty {
                        Text(next.phaseLabel)
                            .adlerText(.eyebrow)
                            .foregroundStyle(Color.inkMuted)
                    }
                    if let note = next.dateNote {
                        Text(note)
                            .adlerText(.footnote, numeric: true)
                            .foregroundStyle(Color.warning)
                    }
                    actionCard(next)
                    extraControls(next)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                ring.frame(width: 96)
            }
        } else {
            VStack(alignment: .leading, spacing: Space.l) {
                EmptyStateView(
                    title: EmptyStateCopy.restDay.title,
                    message: EmptyStateCopy.restDay.body,
                    actionTitle: "Choose a goal",
                    action: { onSheet(.chooseAction) }
                )
                ring
            }
        }
    }

    @ViewBuilder
    private func actionCard(_ next: NextStepPresentation) -> some View {
        if next.isReadOnly {
            // The server permits none of Start / Report on this action — it is scheduled
            // ahead, waiting on earlier work, or its goal is not active. ``ActionCard`` infers
            // its controls from `ActionCardState`, which has no case for that, so the same
            // anatomy is drawn read-only here rather than offering a control the server
            // has refused.
            ReadOnlyActionCard(
                model: next.card,
                note: next.dateNote,
                scheduleTitle: next.showsSchedule ? "Schedule" : nil,
                onSchedule: { schedule(next) },
                onChoose: { actionMenu = true }
            )
            .confirmationDialog("", isPresented: $actionMenu) { menu(next) }
        } else {
            ActionCard(
                model: next.card,
                scale: .full,
                onStart: next.showsStart ? { if let action = next.action { onStart(action) } } : nil,
                onReport: next.showsReport ? { report(next) } : nil,
                onSchedule: next.showsSchedule ? { schedule(next) } : nil,
                onChoose: { actionMenu = true }
            )
            .disabled(busy)
            .confirmationDialog("", isPresented: $actionMenu) { menu(next) }
        }
    }

    @ViewBuilder
    private func menu(_ next: NextStepPresentation) -> some View {
        Button("Choose something else") { onSheet(.chooseAction) }
        if let action = next.action {
            Button("Discuss this action") {
                CoachHandoff.open(
                    router,
                    prompt: CoachHandoff.discussAction(action.title, goal: next.goal.title),
                    goalId: next.goal.id)
            }
        }
        Button("Open goal") { router.openGoal(id: next.goal.id) }
        Button("Cancel", role: .cancel) {}
    }

    /// Controls ``ActionCard`` has no state for: activating a Draft plan, and choosing the
    /// first work for a Draft that has none.
    @ViewBuilder
    private func extraControls(_ next: NextStepPresentation) -> some View {
        if next.showsPlanFirstAction {
            AdlerSecondaryButton(title: "Plan first action") {
                CoachHandoff.open(
                    router,
                    prompt: CoachHandoff.planFirstAction(goal: next.goal.title),
                    goalId: next.goal.id)
            }
        } else if next.showsStartGoal {
            AdlerSecondaryButton(title: "Start this plan") {
                Task { try? await workspace.startGoal(id: next.goal.id) }
            }
            .disabled(busy)
        }
    }

    private func report(_ next: NextStepPresentation) {
        guard let action = next.action else { return }
        onSheet(.report(action: action, correcting: action.outcome != nil))
    }

    private func schedule(_ next: NextStepPresentation) {
        router.openCalendar(weekStart: next.action?.date ?? today.today)
    }

    // MARK: - Lineup

    @ViewBuilder
    private var lineup: some View {
        if rows.isEmpty {
            HStack(alignment: .top, spacing: Space.s) {
                Image(systemName: "clock")
                    .foregroundStyle(Color.inkMuted)
                    .accessibilityHidden(true)
                Text(EmptyStateCopy.noActionsToday.title)
                    .adlerText(.callout)
                    .foregroundStyle(Color.inkMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .adlerWell()
        } else {
            VStack(alignment: .leading, spacing: Space.s) {
                HStack {
                    Text("TODAY’S LINEUP")
                        .adlerText(.eyebrow)
                    Spacer(minLength: Space.s)
                    Text("\(rows.count) \(rows.count == 1 ? "action" : "actions")")
                        .adlerText(.caption, numeric: true)
                }
                .foregroundStyle(Color.inkMuted)

                ForEach(visibleRows) { row in
                    LineupRowView(row: row) { select(row) }
                    if row.id != visibleRows.last?.id {
                        Divider().overlay(Color.separator)
                    }
                }

                if rows.count > 3 {
                    Button(showsAllActions ? "Show less" : "Show all \(rows.count) actions") {
                        showsAllActions.toggle()
                    }
                    .buttonStyle(.plain)
                    .adlerText(.subhead)
                    .foregroundStyle(Color.accentInk)
                    .frame(minHeight: AdlerLayout.minimumHitTarget)
                }
            }
        }
    }

    private var visibleRows: [LineupRow] {
        showsAllActions ? rows : Array(rows.prefix(3))
    }

    /// Today's lineup is today's work, so a row is where the person says what happened. A row
    /// whose prerequisite is not met is inert (it is handled by `LineupRow.isEnabled`), and a
    /// reported row reopens its report to correct it.
    private func select(_ row: LineupRow) {
        guard let item = today.lineup.first(where: { $0.action.id == row.id }) else { return }
        onSheet(.report(action: item.action, correcting: row.opensReport))
    }

    // MARK: - Footer

    private var footer: some View {
        VStack(alignment: .leading, spacing: Space.m) {
            Divider().overlay(Color.separator)
            HStack(alignment: .firstTextBaseline) {
                Button {
                    if let goalId = next?.goal.id {
                        router.openGoal(id: goalId)
                    } else {
                        router.selectTab(.goals)
                    }
                } label: {
                    VStack(alignment: .leading, spacing: Space.xxs) {
                        if let title = next?.goal.title {
                            Text(title)
                                .adlerText(.eyebrow)
                                .foregroundStyle(Color.inkMuted)
                                .lineLimit(1)
                        }
                        HStack(spacing: Space.xs) {
                            Text("Plan & progress")
                            Image(systemName: "chevron.right").font(.caption2)
                        }
                        .adlerText(.subhead)
                        .foregroundStyle(Color.accentInk)
                    }
                }
                .buttonStyle(.plain)
                .accessibilityLabel(
                    next.map { "Plan & progress for \($0.goal.title)" } ?? "Plan & progress")

                Spacer(minLength: Space.s)

                Button("Choose something else") { onSheet(.chooseAction) }
                    .buttonStyle(.plain)
                    .adlerText(.subhead)
                    .foregroundStyle(Color.accentInk)
            }
            .frame(minHeight: AdlerLayout.minimumHitTarget)
        }
    }
}

// MARK: - Lineup row

/// One combined accessibility element per row (DESIGN.md §5.4). A row whose prerequisite is not
/// met is inert and says so — it is not a failure and it is not something to do.
private struct LineupRowView: View {
    let row: LineupRow
    let onSelect: () -> Void

    @ScaledMetric(relativeTo: .caption2) private var ruleHeight: CGFloat = 30

    var body: some View {
        Button(action: onSelect) {
            HStack(alignment: .center, spacing: Space.m) {
                GoalRule(color: row.goalColor).frame(height: ruleHeight)
                Image(systemName: row.symbol)
                    .font(.system(size: 15))
                    .foregroundStyle(row.state == .done ? Color.accentInk : Color.inkMuted)
                VStack(alignment: .leading, spacing: Space.xxs) {
                    Text(row.title)
                        .adlerText(.subhead)
                        .foregroundStyle(Color.ink)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
                    Text(row.goalTitle)
                        .adlerText(.caption)
                        .foregroundStyle(Color.inkMuted)
                        .lineLimit(1)
                }
                Spacer(minLength: Space.s)
                Text(row.stateLabel)
                    .adlerText(.caption, numeric: true)
                    .foregroundStyle(Color.inkMuted)
                    .multilineTextAlignment(.trailing)
            }
            .frame(minHeight: AdlerLayout.minimumHitTarget)
            .contentShape(.rect)
        }
        .buttonStyle(.plain)
        .disabled(!row.isEnabled)
        .opacity(row.isEnabled ? 1 : 0.55)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(row.accessibilityLabel)
        .accessibilityAddTraits(row.isEnabled ? .isButton : [])
        .accessibilityAddTraits(row.selected ? .isSelected : [])
    }
}

// MARK: - Read-only action card

/// The §4.1 anatomy without controls, for the states the design system's ``ActionCard`` cannot
/// express: work scheduled ahead, work waiting on an earlier step, and a goal that is not
/// active. **Design-system follow-up**: an `ActionCardState.waiting(note:)` would remove this.
private struct ReadOnlyActionCard: View {
    let model: ActionCardModel
    let note: String?
    let scheduleTitle: String?
    let onSchedule: () -> Void
    let onChoose: () -> Void

    var body: some View {
        HStack(alignment: .top, spacing: Space.m) {
            GoalRule(color: model.goal.color)
            VStack(alignment: .leading, spacing: Space.s) {
                HStack(alignment: .firstTextBaseline) {
                    Text(model.goal.title)
                        .adlerText(.eyebrow)
                        .foregroundStyle(Color.inkMuted)
                        .lineLimit(1)
                    Spacer(minLength: Space.s)
                    Button(action: onChoose) {
                        Image(systemName: "ellipsis.circle")
                            .foregroundStyle(Color.inkMuted)
                            .frame(
                                width: AdlerLayout.minimumHitTarget,
                                height: AdlerLayout.minimumHitTarget, alignment: .trailing)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Choose something else")
                }
                Text(model.title)
                    .adlerText(.title2)
                    .foregroundStyle(Color.inkHeading)
                    .lineLimit(2)
                if let criterion = model.criterionLine {
                    Text(criterion)
                        .adlerText(.subhead, numeric: true)
                        .foregroundStyle(Color.inkMuted)
                        .fixedSize(horizontal: false, vertical: true)
                }
                if let scheduleTitle {
                    AdlerQuietButton(title: scheduleTitle, systemImage: "calendar", action: onSchedule)
                }
                if let note {
                    Text(note)
                        .adlerText(.footnote, numeric: true)
                        .foregroundStyle(Color.inkMuted)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .fixedSize(horizontal: false, vertical: true)
        .padding(AdlerLayout.todayCardPadding)
        .adlerCard()
        .accessibilityElement(children: .contain)
        .accessibilityLabel(model.accessibilityLabel)
    }
}

// MARK: - Shared card heading

/// `01 What you need to do today` — the numeral header every Today card carries.
struct CardHeading: View {
    let number: String
    let title: String
    var trailing: String?

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: Space.s) {
            Text(number)
                .adlerText(.title2, numeric: true)
                .foregroundStyle(Color.accentInk)
            Text(title)
                .adlerText(.title3)
                .foregroundStyle(Color.inkHeading)
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: Space.s)
            if let trailing {
                Text(trailing)
                    .adlerText(.caption, numeric: true)
                    .foregroundStyle(Color.inkMuted)
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityAddTraits(.isHeader)
    }
}
