import SwiftUI

/// Today — the daily story, in three chapters (DESIGN.md §5.4).
///
/// The deck header, the pager pill and the Back/Next footer are three equivalent routes to the
/// same chapter. The chapter itself lives on `AppRouter.todayCard`, so `adler://today?card=…`
/// selects it, a rotation preserves it and it survives the view being rebuilt.
///
/// The shell supplies the navigation title, the avatar and the whole-app banner slot
/// (`App/README.md` §1), so nothing here adds them. Per-view load failures, stale revisions and
/// refused writes belong to this screen and are shown on it.
struct TodayRootView: View {
    @Environment(WorkspaceStore.self) private var workspace
    @Environment(AppRouter.self) private var router
    @Environment(\.accessibilityReduceMotion) private var systemReduceMotion

    /// The person's own motion switch, mirroring the web's `Motion on / off` control. The
    /// system Reduce Motion setting always wins; this can only turn motion further down.
    @AppStorage("adler.today.motionPaused") private var motionPaused = false

    @State private var sheet: TodaySheet?
    @State private var writeError: APIError?
    @State private var busy = false

    private var selection: Binding<Int> {
        Binding(
            get: { TodayDeck.index(of: router.todayCard) },
            set: { router.todayCard = TodayDeck.card(at: $0) }
        )
    }

    private var state: LoadState { workspace.state(.today) }

    var body: some View {
        VStack(spacing: 0) {
            TodayDeckHeader(
                date: dates?.headerDate(),
                motionPaused: $motionPaused,
                showsMotionToggle: !systemReduceMotion
            )

            if let today = workspace.today, let dates {
                deck(today, dates: dates)
            } else if state.isLoading {
                TodayLoadingView()
            } else if let error = state.error {
                TodayLoadFailure(error: error) { Task { await workspace.loadToday() } }
            } else {
                TodayLoadingView()
            }
        }
        .background(Color.canvas)
        .navigationBarTitleDisplayMode(.inline)

        .task {
            workspace.markVisible(.today)
            await workspace.loadToday()
        }
        .onDisappear { workspace.markHidden(.today) }
        .sheet(item: $sheet) { sheetContent($0) }
    }

    private var dates: TodayDates? {
        guard let today = workspace.today else { return nil }
        return TodayDates(today: today.today, timeZone: workspace.timeZone)
    }

    @ViewBuilder
    private func deck(_ today: TodayView, dates: TodayDates) -> some View {
        let palette = TodayGoalPalette(today)
        VStack(spacing: 0) {
            if state.isLoading { RefreshHairline() }
            if let writeError {
                TodayWriteBanner(
                    error: writeError,
                    onRetry: { Task { await retryPendingWrite() } },
                    onDismiss: { self.writeError = nil }
                )
                .padding(.horizontal, AdlerLayout.screenMargin)
                .padding(.bottom, Space.s)
            }
            // Each page's width comes from `CardDeck`'s own `.containerRelativeFrame(.horizontal)`
            // (it sizes `content(index)` to the scroll view's container on every layout pass).
            // An earlier version measured the width itself with a `GeometryReader` and applied it
            // as a hard `.frame(width:)`; that value could be captured from a transitional first
            // layout pass (before the tab bar/navigation chrome settled) and then never
            // re-resolved, leaving the card's fixed width permanently out of step with the
            // container and clipped on both edges. Padding alone has no such stale snapshot: it
            // is resolved against whatever width `containerRelativeFrame` proposes each time.
            CardDeck(
                titles: TodayDeck.titles,
                accessibilityLabels: TodayDeck.accessibilityLabels,
                selection: selection
            ) { index in
                card(at: index, today: today, dates: dates, palette: palette)
                    .padding(.horizontal, Space.m)
                    .padding(.bottom, Space.s)
            }
            // `Motion off` suppresses every implicit animation in the deck — the fan pose, the
            // chart entrance and the paging slide. Reduce Motion already does this through
            // `@Environment(\.adlerMotion)`, which is read-only, so the person's own switch
            // has to work on the transaction instead.
            .transaction { transaction in
                if motionPaused { transaction.animation = nil }
            }
        }
    }

    @ViewBuilder
    private func card(at index: Int, today: TodayView, dates: TodayDates, palette: TodayGoalPalette)
        -> some View
    {
        switch TodayDeck.card(at: index) {
        case .doNext:
            TodayDoCard(
                today: today, dates: dates, palette: palette, busy: busy,
                onSheet: { sheet = $0 },
                onStart: { action in Task { await start(action) } }
            )
        case .progress:
            TodayProgressCard(
                today: today, dates: dates,
                onSheet: { sheet = $0 },
                onCoach: route(to:)
            )
        case .learn:
            TodayLearnCard(
                today: today, dates: dates, palette: palette, busy: busy,
                onSheet: { sheet = $0 },
                onCoach: route(to:),
                onControl: { card, action in Task { await learning(card, action) } }
            )
        }
    }

    // MARK: - Sheets

    @ViewBuilder
    private func sheetContent(_ sheet: TodaySheet) -> some View {
        switch sheet {
        case .report(let action, let correcting):
            TodayReportSheet(
                action: action,
                isCorrection: correcting,
                dates: dates ?? TodayDates(today: YMD("1970-01-01"), timeZone: workspace.timeZone),
                onDismiss: { self.sheet = nil }
            )
            .presentationDetents([.height(420), .large])
            .presentationDragIndicator(.visible)

        case .chooseAction:
            ChooseActionSheet(
                goals: workspace.today?.goals ?? [],
                onOpenGoal: { id in
                    self.sheet = nil
                    router.openGoal(id: id)
                },
                onNewGoal: {
                    self.sheet = nil
                    route(to: TodayCoachPrompt(prompt: CoachHandoff.newGoal))
                },
                onClose: { self.sheet = nil }
            )
            .presentationDetents([.medium, .large])
            .presentationDragIndicator(.visible)

        case .addResult(let row):
            AddResultSheet(
                row: row,
                today: workspace.today?.today ?? YMD.today(in: workspace.timeZone),
                timeZone: workspace.timeZone,
                onClose: { self.sheet = nil }
            )
            .presentationDetents([.height(340), .large])
            .presentationDragIndicator(.visible)

        case .learningDetail(let recordId):
            LearningEvidenceSheet(recordId: recordId, onClose: { self.sheet = nil })
                .presentationDetents([.height(560), .large])
                .presentationDragIndicator(.visible)
        }
    }

    // MARK: - Routes and writes

    private func route(to prompt: TodayCoachPrompt) {
        CoachHandoff.open(router, prompt)
    }

    private func start(_ action: ActionView) async {
        busy = true
        defer { busy = false }
        do {
            try await workspace.startAction(id: action.id, goalId: action.goalId)
            writeError = nil
        } catch {
            writeError = error
        }
    }

    private func learning(_ card: TodayLearningCard, _ action: LearningActionKind) async {
        busy = true
        defer { busy = false }
        do {
            try await workspace.learningAction(card: card, action: action)
            writeError = nil
        } catch {
            writeError = error
        }
    }

    private func retryPendingWrite() async {
        do {
            _ = try await workspace.retryPendingWrite()
            writeError = nil
        } catch {
            writeError = error
        }
    }
}

// MARK: - Sheets

nonisolated enum TodaySheet: Identifiable, Equatable {
    case report(action: ActionView, correcting: Bool)
    case chooseAction
    case addResult(row: GoalProgressRow)
    case learningDetail(recordId: String)

    var id: String {
        switch self {
        case .report(let action, let correcting): "report-\(action.id)-\(correcting)"
        case .chooseAction: "choose"
        case .addResult(let row): "result-\(row.goal.id)"
        case .learningDetail(let id): "learning-\(id)"
        }
    }
}

// MARK: - Header

/// `✳ Your daily story · Tue 13 Oct`, plus the motion switch. The chapter buttons live in the
/// deck's own pager pill (`PageIndicator`), so there is exactly one set of them.
private struct TodayDeckHeader: View {
    let date: String?
    @Binding var motionPaused: Bool
    let showsMotionToggle: Bool

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: Space.s) {
            Image(systemName: "asterisk")
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(Color.accentInk)
                .accessibilityHidden(true)
            Text("Your daily story")
                .adlerText(.title3)
                .foregroundStyle(Color.inkHeading)
            if let date {
                Text(date)
                    .adlerText(.footnote, numeric: true)
                    .foregroundStyle(Color.inkMuted)
            }
            Spacer(minLength: Space.s)
            if showsMotionToggle {
                Button {
                    motionPaused.toggle()
                } label: {
                    HStack(spacing: Space.xs) {
                        Image(systemName: motionPaused ? "play.fill" : "pause.fill")
                            .font(.system(size: 10, weight: .semibold))
                        Text(motionPaused ? "Motion off" : "Motion on")
                            .adlerText(.caption)
                    }
                    .foregroundStyle(Color.inkMuted)
                    .padding(.horizontal, Space.s)
                    .padding(.vertical, Space.xs)
                    .background(Color.surfaceSunken, in: .capsule)
                }
                .buttonStyle(.plain)
                .accessibilityLabel(motionPaused ? "Play animations" : "Pause animations")
                .accessibilityAddTraits(motionPaused ? [.isSelected] : [])
            }
        }
        .padding(.horizontal, AdlerLayout.screenMargin)
        .padding(.top, Space.xs)
        .padding(.bottom, Space.m)
        .accessibilityElement(children: .contain)
    }
}

// MARK: - Loading and failure

/// Shape-matched skeletons: the header is already drawn, so only the card body is a placeholder
/// (DESIGN.md §4.20). Never a full-screen spinner on a tab root.
private struct TodayLoadingView: View {
    var body: some View {
        VStack(alignment: .leading, spacing: AdlerLayout.sectionGap) {
            SkeletonCard()
            VStack(spacing: Space.m) {
                SkeletonRow()
                SkeletonRow()
                SkeletonRow()
            }
            Spacer(minLength: 0)
        }
        .padding(AdlerLayout.screenMargin)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
    }
}

private struct TodayLoadFailure: View {
    let error: APIError
    let onRetry: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: Space.l) {
            ErrorBanner(kind: error.bannerKind, action: onRetry)
            Spacer(minLength: 0)
        }
        .padding(AdlerLayout.screenMargin)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
    }
}

/// A refused or conflicted write. A `409` keeps the person's input and re-sends the **same**
/// `requestId`, so a duplicate can never apply twice (DESIGN.md §4.19).
private struct TodayWriteBanner: View {
    let error: APIError
    let onRetry: () -> Void
    let onDismiss: () -> Void

    var body: some View {
        if case .staleRevision = error {
            StaleRevisionBanner(
                changeSummary: nil, recordGone: false, onRetry: onRetry, onRefresh: onRetry)
        } else if error.isNotFound {
            StaleRevisionBanner(changeSummary: nil, recordGone: true, onRefresh: onRetry)
        } else {
            ErrorBanner(kind: error.bannerKind, action: onRetry, onDismiss: onDismiss)
        }
    }
}

extension APIError {
    /// The banner variant for this failure (DESIGN.md §4.18). The server's own message is
    /// carried through as the detail line and printed verbatim.
    var bannerKind: ErrorBanner.Kind {
        switch self {
        case .unauthenticated: .signedOut
        case .transport(_, let kind): kind == .offline ? .offline : .timeout
        case .server(let message, _): .server(detail: message)
        case .staleRevision: .server(detail: nil)
        case .decoding(let message): .server(detail: message)
        case .invalidRequest(let message): .server(detail: message)
        }
    }
}
