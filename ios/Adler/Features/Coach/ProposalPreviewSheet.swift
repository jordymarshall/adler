import SwiftUI

/// `Review changes` (DESIGN.md §2.3, §4.4). Current → Suggested for every saved command, then
/// the affected work the server computes with `POST /api/proposals/:id/preview` — the plan the
/// person would actually have, not a client-side guess.
struct ProposalPreviewSheet: View {
    let proposal: ProposalView
    /// `nil` when the decision controls live on the recommendation card in the thread.
    var onApprove: (() async -> Void)?
    var onDismiss: (() async -> Void)?

    @Environment(WorkspaceStore.self) private var workspace
    @Environment(\.dismiss) private var dismissSheet

    @State private var preview: ProposalPreview?
    @State private var error: APIError?
    @State private var isLoading = true
    @State private var isDeciding = false

    private var rows: [ChangeComparisonRow] {
        ProposalChangeMapping.rows(for: proposal, in: workspace.timeZone)
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: AdlerLayout.sectionGap) {
                    header
                    comparison
                    affectedWork
                    reasons
                }
                .padding(AdlerLayout.screenMargin)
            }
            .background(Color.canvas)
            .navigationTitle(CoachCopy.reviewChanges)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(CoachCopy.close) { dismissSheet() }
                }
            }
            .safeAreaInset(edge: .bottom) { controls }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
        .task { await load() }
    }

    // MARK: Sections

    private var header: some View {
        VStack(alignment: .leading, spacing: Space.s) {
            Text(proposal.goalTitle)
                .adlerText(.eyebrow)
                .foregroundStyle(Color.inkMuted)
            Text(proposal.headline.isEmpty ? proposal.summary : proposal.headline)
                .adlerText(.title2)
                .foregroundStyle(Color.inkHeading)
                .fixedSize(horizontal: false, vertical: true)
            Text(
                CoachCopy.affects(
                    actions: proposal.affected.actions, planVersions: proposal.affected.planVersions)
            )
            .adlerText(.footnote, numeric: true)
            .foregroundStyle(Color.inkMuted)
            ForEach(consequences, id: \.self) { line in
                Text(line)
                    .adlerText(.callout)
                    .foregroundStyle(Color.ink)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var consequences: [String] {
        var lines = proposal.consequences.isEmpty ? [CoachCopy.consequence] : proposal.consequences
        if let booking = proposal.booking {
            lines.append(
                CoachCopy.consequenceBooking(
                    time: bookingTime(booking), calendar: booking.calendarName))
        }
        return lines
    }

    private func bookingTime(_ booking: ProposalBooking) -> String {
        let calendar = CoachDates.calendar(workspace.timeZone)
        guard let start = booking.start.date else { return booking.start.raw }
        let day = AdlerDate.short(start, calendar: calendar)
        let from = AdlerDate.time(start, calendar: calendar)
        guard let end = booking.end.date else { return "\(day) \(from)" }
        return "\(day) \(from)–\(AdlerDate.time(end, calendar: calendar))"
    }

    private var comparison: some View {
        VStack(alignment: .leading, spacing: Space.m) {
            SectionHeading(CoachCopy.compareCurrent + " → " + CoachCopy.compareSuggested)
            ForEach(rows) { row in
                ChangeComparison(row: row, goal: GoalColor.parse(nil))
            }
        }
    }

    @ViewBuilder
    private var affectedWork: some View {
        VStack(alignment: .leading, spacing: Space.m) {
            SectionHeading("Affected work")
            if isLoading {
                SkeletonRow()
            } else if let error {
                ErrorBanner(
                    kind: .server(detail: error.serverMessage), actionTitle: CoachCopy.retry,
                    action: { Task { await load() } })
            } else if let preview, !preview.execution.isEmpty {
                ForEach(preview.execution) { goal in
                    PreviewGoalRow(goal: goal, title: title(for: goal.goalId), timeZone: workspace.timeZone)
                }
            } else {
                Text(CoachCopy.compareNoChange)
                    .adlerText(.callout)
                    .foregroundStyle(Color.inkMuted)
            }
        }
    }

    private func title(for goalId: String) -> String {
        workspace.coach?.goals.first { $0.id == goalId }?.title
            ?? (goalId == proposal.goalId ? proposal.goalTitle : goalId)
    }

    @ViewBuilder
    private var reasons: some View {
        let saved = proposal.changes.compactMap(\.reason).filter { !$0.isEmpty }
        VStack(alignment: .leading, spacing: Space.s) {
            SectionHeading(CoachCopy.compareWhy)
            if saved.isEmpty {
                Text(CoachCopy.noReason)
                    .adlerText(.callout)
                    .foregroundStyle(Color.inkMuted)
            } else {
                ForEach(saved, id: \.self) { reason in
                    Text(reason)
                        .adlerText(.callout)
                        .foregroundStyle(Color.ink)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
    }

    @ViewBuilder
    private var controls: some View {
        if onApprove != nil || onDismiss != nil {
            HStack(spacing: Space.m) {
                if let onApprove {
                    AdlerPrimaryButton(title: CoachCopy.approve) {
                        Task {
                            isDeciding = true
                            await onApprove()
                            isDeciding = false
                        }
                    }
                }
                if let onDismiss {
                    AdlerQuietButton(title: CoachCopy.dismiss) {
                        Task {
                            isDeciding = true
                            await onDismiss()
                            isDeciding = false
                        }
                    }
                }
                Spacer(minLength: 0)
                if isDeciding { ProgressView().controlSize(.small) }
            }
            .padding(AdlerLayout.screenMargin)
            .background(.bar)
        }
    }

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            preview = try await workspace.previewProposal(id: proposal.id)
            error = nil
        } catch {
            self.error = error
        }
    }
}

// MARK: - Pieces

/// One goal's execution after the change would be applied, straight from the preview.
private struct PreviewGoalRow: View {
    let goal: ProposalPreviewGoal
    let title: String
    let timeZone: TimeZone

    var body: some View {
        VStack(alignment: .leading, spacing: Space.xs) {
            Text(title)
                .adlerText(.headline)
                .foregroundStyle(Color.inkHeading)
            Text(window)
                .adlerText(.footnote, numeric: true)
                .foregroundStyle(Color.inkMuted)
            Text(counts)
                .adlerText(.footnote, numeric: true)
                .foregroundStyle(Color.ink)
            ForEach(goal.markers) { marker in
                HStack(alignment: .firstTextBaseline, spacing: Space.s) {
                    Text(marker.label)
                        .adlerText(.footnote)
                        .foregroundStyle(Color.ink)
                    Spacer(minLength: Space.s)
                    Text(CoachDates.short(marker.date, in: timeZone) ?? "No date")
                        .adlerText(.footnote, numeric: true)
                        .foregroundStyle(Color.inkMuted)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(AdlerLayout.cardPadding)
        .adlerWell()
        .accessibilityElement(children: .combine)
    }

    private var window: String {
        let start = CoachDates.short(goal.start, in: timeZone) ?? goal.start.raw
        let end = CoachDates.short(goal.end, in: timeZone) ?? goal.end.raw
        return "\(start) – \(end)"
    }

    /// Planned and reported are separate numbers: a planned action is not a reported one.
    private var counts: String {
        "\(goal.summary.planned) planned · \(goal.summary.reported) reported · \(goal.unscheduledIds.count) unplaced"
    }
}

struct SectionHeading: View {
    let text: String

    init(_ text: String) { self.text = text }

    var body: some View {
        Text(text)
            .adlerText(.eyebrow)
            .foregroundStyle(Color.inkMuted)
            .frame(maxWidth: .infinity, alignment: .leading)
            .accessibilityAddTraits(.isHeader)
    }
}
