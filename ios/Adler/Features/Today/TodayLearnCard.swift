import SwiftUI

/// Today 03 Learn — the current learning record, its controls and the honest status sentence
/// (DESIGN.md §5.4).
///
/// Hierarchy: workflow chip → the change → the hypothesis → the two-input diagram → evidence
/// standing → timeline → controls → status sentence. The server orders the records (evidence
/// changed first, then review due, then a pending decision); the pager reaches the rest.
///
/// A pending revision **never replaces** the agreed test: it sits above it in its own block.
/// With no record at all, the card shows the latest saved memory and invites a report — it does
/// not invent an experiment, a hypothesis or a result.
struct TodayLearnCard: View {
    let today: TodayView
    let dates: TodayDates
    let palette: TodayGoalPalette
    let busy: Bool
    let onSheet: (TodaySheet) -> Void
    let onCoach: (TodayCoachPrompt) -> Void
    let onControl: (TodayLearningCard, LearningActionKind) -> Void

    @Environment(WorkspaceStore.self) private var workspace
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @State private var index = 0

    private var cards: [TodayLearningCard] { today.learning }

    private var current: TodayLearningCard? {
        guard !cards.isEmpty else { return nil }
        return cards[min(max(index, 0), cards.count - 1)]
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AdlerLayout.sectionGap) {
                CardHeading(
                    number: "03", title: TodayDeck.cardTitles[2],
                    trailing: current?.statusLabel)

                if let card = current {
                    record(card, view: LearningCardPresentation.make(card, dates: dates, palette: palette))
                } else {
                    emptyState
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(AdlerLayout.todayCardPadding)
        }
        .scrollBounceBehavior(.basedOnSize)
        .refreshable { await workspace.loadToday() }
        .adlerFanBackground(seed: 2)
        .overlay {
            RoundedRectangle(cornerRadius: Radii.largeCard)
                .strokeBorder(Color.separator, lineWidth: 1)
        }
        .clipShape(.rect(cornerRadius: Radii.largeCard))
        .onChange(of: cards.count) { _, count in
            if index >= count { index = max(0, count - 1) }
        }
    }

    // MARK: - A record

    @ViewBuilder
    private func record(_ card: TodayLearningCard, view: LearningCardPresentation) -> some View {
        VStack(alignment: .leading, spacing: AdlerLayout.sectionGap) {
            if view.hasPendingRevision { revisionNote }

            VStack(alignment: .leading, spacing: Space.s) {
                if !view.goalEyebrow.isEmpty {
                    HStack(spacing: Space.s) {
                        GoalRule(color: view.goalColor).frame(height: 14)
                        Text(view.goalEyebrow)
                            .adlerText(.eyebrow)
                            .foregroundStyle(Color.inkMuted)
                    }
                }
                Text(view.change)
                    .adlerText(.title2)
                    .foregroundStyle(Color.inkHeading)
                    .fixedSize(horizontal: false, vertical: true)
                VStack(alignment: .leading, spacing: Space.xxs) {
                    Text("Working hypothesis")
                        .adlerText(.eyebrow)
                        .foregroundStyle(Color.inkMuted)
                    Text(view.hypothesis)
                        .adlerText(.callout)
                        .foregroundStyle(Color.ink)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }

            ReasoningLite(view: view)

            StatusChipPair(workflow: view.statusLabel, standing: view.standingLabel)

            LearningTimeline(layout: view.timeline, goal: view.goalColor)
                .accessibilityElement(children: .ignore)
                .accessibilityLabel(
                    "\(view.timeline.accessibilitySummary) A review date is not a result.")

            if view.showsReconsiderNote { reconsiderNote }

            controls(card, view: view)

            footer(view)
        }
    }

    private var revisionNote: some View {
        VStack(alignment: .leading, spacing: Space.xs) {
            Text("A revised suggestion")
                .adlerText(.eyebrow)
                .foregroundStyle(Color.inkMuted)
            Text("Your agreed test below remains current until you accept this suggestion.")
                .adlerText(.footnote)
                .foregroundStyle(Color.ink)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .adlerWell()
    }

    private var reconsiderNote: some View {
        HStack(alignment: .top, spacing: Space.s) {
            Image(systemName: "exclamationmark.triangle")
                .foregroundStyle(Color.warning)
                .accessibilityHidden(true)
            Text("The evidence changed. Review this explanation before using it.")
                .adlerText(.subhead)
                .foregroundStyle(Color.ink)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(Space.m)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.surfaceSunken, in: .rect(cornerRadius: Radii.control))
        .overlay {
            RoundedRectangle(cornerRadius: Radii.control)
                .strokeBorder(Color.warning, lineWidth: 1)
        }
    }

    @ViewBuilder
    private func controls(_ card: TodayLearningCard, view: LearningCardPresentation) -> some View {
        let layout =
            dynamicTypeSize.prefersStackedControls
            ? AnyLayout(VStackLayout(alignment: .leading, spacing: Space.s))
            : AnyLayout(HStackLayout(spacing: Space.s))

        VStack(alignment: .leading, spacing: Space.s) {
            layout {
                AdlerPrimaryButton(title: view.detailTitle) {
                    onSheet(.learningDetail(recordId: view.id))
                }
                AdlerSecondaryButton(title: view.discussTitle) {
                    onCoach(
                        TodayCoachPrompt(
                            prompt: view.prompt, goalId: view.goalId, recordId: view.id,
                            version: card.version))
                }
            }
            // Exactly the controls the server offers, in their valid state. `Resume` is not
            // offered while the standing is `Evidence has changed` — the server withholds it.
            if !view.controls.available.isEmpty {
                FlowLayout(spacing: Space.s) {
                    ForEach(view.controls.available, id: \.self) { kind in
                        AdlerQuietButton(title: LearningCardPresentation.controlTitle(kind)) {
                            onControl(card, kind)
                        }
                    }
                }
            }
        }
        .disabled(busy)
    }

    private func footer(_ view: LearningCardPresentation) -> some View {
        VStack(alignment: .leading, spacing: Space.m) {
            Text(view.footnote)
                .adlerText(.footnote, numeric: true)
                .foregroundStyle(Color.inkMuted)
                .fixedSize(horizontal: false, vertical: true)
            if cards.count > 1 { pager }
        }
    }

    private var pager: some View {
        HStack(spacing: Space.m) {
            Button {
                index = max(0, index - 1)
            } label: {
                Image(systemName: "chevron.left")
            }
            .disabled(index == 0)
            .accessibilityLabel("Previous learning question")

            Text("\(index + 1) / \(cards.count)")
                .adlerText(.caption, numeric: true)
                .foregroundStyle(Color.inkMuted)

            Button {
                index = min(cards.count - 1, index + 1)
            } label: {
                Image(systemName: "chevron.right")
            }
            .disabled(index == cards.count - 1)
            .accessibilityLabel("Next learning question")
        }
        .buttonStyle(.plain)
        .foregroundStyle(Color.accentInk)
        .frame(maxWidth: .infinity, alignment: .trailing)
        .frame(minHeight: AdlerLayout.minimumHitTarget)
        .accessibilityValue("\(index + 1) of \(cards.count)")
    }

    // MARK: - Empty

    private var emptyState: some View {
        VStack(alignment: .leading, spacing: Space.l) {
            Text(today.latestMemory == nil ? "NO EXPERIMENT RUNNING" : "STARTING WITH WHAT YOU’VE SHARED")
                .adlerText(.eyebrow)
                .foregroundStyle(Color.inkMuted)
            EmptyStateView(
                title: EmptyStateCopy.noLearning.title,
                message: EmptyStateCopy.noLearning.body,
                actionTitle: "Share how it went",
                action: {
                    onCoach(
                        TodayCoachPrompt(
                            prompt: "Here’s what helped or got in the way of my actions: "))
                }
            )
            VStack(alignment: .leading, spacing: Space.xs) {
                Text(today.latestMemory == nil ? "A PLACE TO START" : "YOU TOLD ADLER")
                    .adlerText(.eyebrow)
                    .foregroundStyle(Color.inkMuted)
                Text(
                    today.latestMemory?.text
                        ?? "What helped you get started? What got in the way?"
                )
                .adlerText(.callout)
                .foregroundStyle(Color.ink)
                .fixedSize(horizontal: false, vertical: true)
                if let memory = today.latestMemory, let saved = dates.short(memory.date) {
                    Text("Saved \(saved)")
                        .adlerText(.footnote, numeric: true)
                        .foregroundStyle(Color.inkMuted)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .adlerWell()
        }
    }
}

// MARK: - The two-input diagram

/// `WHAT YOU REPORTED` → `WHAT WE’RE WATCHING` / `LATEST FEEDBACK`: the two blocks Today's
/// payload actually carries. The full ``ReasoningDiagram`` (reports + research → working
/// explanation → action → later feedback) needs the saved reasoning, which only
/// `GET /api/app/insights/:id` returns — it is drawn in the evidence sheet.
///
/// The connector is a 1pt hairline and an arrow glyph, never a claim that one caused the other.
private struct ReasoningLite: View {
    let view: LearningCardPresentation

    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    var body: some View {
        let stacked = dynamicTypeSize.prefersStackedControls
        let layout =
            stacked
            ? AnyLayout(VStackLayout(alignment: .leading, spacing: Space.s))
            : AnyLayout(HStackLayout(alignment: .top, spacing: Space.s))

        layout {
            block(title: "WHAT YOU REPORTED", text: view.observation)
            Image(systemName: stacked ? "arrow.down" : "arrow.right")
                .font(.footnote)
                .foregroundStyle(Color.inkMuted)
                .padding(.top, stacked ? 0 : Space.xl)
                .accessibilityHidden(true)
            block(title: view.watchingLabel, text: view.watching)
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("What you reported, then \(view.watchingLabel.lowercased()).")
    }

    private func block(title: String, text: String) -> some View {
        VStack(alignment: .leading, spacing: Space.xs) {
            Text(title)
                .adlerText(.eyebrow)
                .foregroundStyle(Color.inkMuted)
            Text(text)
                .adlerText(.subhead)
                .foregroundStyle(Color.ink)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .adlerWell()
    }
}
