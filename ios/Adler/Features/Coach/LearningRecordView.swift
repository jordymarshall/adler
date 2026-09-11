import SwiftUI

/// One learning record (`CoachRoute.record`, `adler://insights/<recordId>`).
///
/// The order is the one DESIGN.md §5.8 fixes and never varies: observation → behavioural
/// interpretation → hypothesis/change → dated reports → review → updated understanding, then the
/// saved rationale, then versions, events and corrections. Only stages the record actually has
/// are drawn; an observation with no test shows no empty hypothesis scaffolding.
struct LearningRecordView: View {
    let recordId: String

    @Environment(WorkspaceStore.self) private var workspace
    @Environment(AppRouter.self) private var router

    @State private var evidence: EvidenceSheetContent?
    @State private var pendingControl: LearningActionKind?
    @State private var isWorking = false
    @State private var error: String?

    private var detail: LearningDetailView? { workspace.learningRecords[recordId] }
    private var state: LoadState { workspace.state(.learningRecord(recordId)) }
    private var row: LearningRow? { detail?.row }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AdlerLayout.sectionGap) {
                if let error {
                    ErrorBanner(kind: .server(detail: error), onDismiss: { self.error = nil })
                }
                if let detail, let row {
                    header(row)
                    diagram(detail, row: row)
                    controls(row)
                    stages(detail, row: row)
                    reportsSection(row)
                    reviewsSection(detail)
                    rationale(detail)
                    versionsSection(detail)
                    invalidationsSection(detail)
                    eventsSection(detail)
                    sourcesSection(row)
                } else if state.isLoading {
                    SkeletonCard()
                    SkeletonChart()
                } else if state.error?.isNotFound == true {
                    EmptyStateView(
                        title: CoachCopy.errorRecordGone, actionTitle: CoachCopy.refresh,
                        action: { Task { await load() } })
                } else if let loadError = state.error {
                    ErrorBanner(
                        kind: .server(detail: loadError.serverMessage),
                        actionTitle: CoachCopy.retry, action: { Task { await load() } })
                }
            }
            .padding(AdlerLayout.screenMargin)
        }
        .background(Color.canvas)
        .navigationTitle(CoachCopy.recordChange)
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .onDisappear { workspace.markHidden(.learningRecord(recordId)) }
        .sheet(item: $evidence) { EvidenceDisclosureSheet(content: $0) }
        .confirmationDialog(
            confirmationTitle,
            isPresented: Binding(
                get: { pendingControl != nil }, set: { if !$0 { pendingControl = nil } }),
            titleVisibility: .visible
        ) {
            if let control = pendingControl {
                Button(controlTitle(control), role: control == .decline ? .destructive : nil) {
                    Task { await perform(control) }
                }
            }
            Button(CoachCopy.cancel, role: .cancel) { pendingControl = nil }
        } message: {
            if let note = confirmationNote { Text(note) }
        }
    }

    // MARK: Header

    private func header(_ row: LearningRow) -> some View {
        VStack(alignment: .leading, spacing: Space.s) {
            HStack(alignment: .top, spacing: Space.s) {
                Text(row.goals.map(\.title).joined(separator: " · "))
                    .adlerText(.eyebrow)
                    .foregroundStyle(Color.inkMuted)
                Spacer(minLength: Space.s)
                StatusChipPair(workflow: row.statusLabel, standing: row.standingLabel)
            }
            Text(row.change)
                .adlerText(.title2)
                .foregroundStyle(Color.inkHeading)
                .fixedSize(horizontal: false, vertical: true)
            Text(
                "\(row.reports == 0 ? CoachCopy.noAttempts : CoachCopy.attempts(row.reports)) · \(row.timingLabel)"
            )
            .adlerText(.footnote, numeric: true)
            .foregroundStyle(Color.inkMuted)
            if let content = row.summaryRow(in: workspace.timeZone) {
                LearningTimeline(layout: content.timeline, goal: content.goal.color)
                    .accessibilityLabel(content.timeline.accessibilitySummary)
            }
            if row.standing == .reconsider {
                Text(CoachCopy.reconsider)
                    .adlerText(.footnote)
                    .foregroundStyle(Color.warning)
                    .fixedSize(horizontal: false, vertical: true)
            }
            if row.nextReviewAfter != nil || row.reviewAfter != nil {
                Text(CoachCopy.notAResult)
                    .adlerText(.footnote)
                    .foregroundStyle(Color.inkMuted)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: Reasoning diagram

    @ViewBuilder
    private func diagram(_ detail: LearningDetailView, row: LearningRow) -> some View {
        if let version = detail.versions.last {
            ReasoningDiagram(
                content: ReasoningDiagramContent(
                    reports: reportsInput(row),
                    research: research(version),
                    explanation: version.reasoning.mechanism,
                    action: row.change,
                    laterFeedback: laterFeedback(row),
                    goalColor: row.goals.first?.display.color),
                controlTitle: CoachCopy.discuss,
                onControl: { discuss(row) })
        }
    }

    private func reportsInput(_ row: LearningRow) -> String {
        let dates = row.attempts.compactMap { CoachDates.short($0.date, in: workspace.timeZone) }
        return dates.isEmpty ? CoachCopy.noAttempts : dates.joined(separator: " · ")
    }

    private func research(_ version: LearningVersionView) -> String {
        let principles = version.reasoning.principleIds.joined(separator: " · ")
        let method = version.reasoning.methodId
        return [principles, method].filter { !$0.isEmpty }.joined(separator: " · ")
    }

    private func laterFeedback(_ row: LearningRow) -> String? {
        let review = CoachDates.short(
            row.nextReviewAfter ?? row.reviewAfter, in: workspace.timeZone)
        guard let latest = row.latestReview else {
            return review.map { "Review \($0)" }
        }
        let at = CoachDates.short(latest.at, in: workspace.timeZone) ?? latest.at.raw
        return "\(at) · \(latest.standingLabel)" + (review.map { " · Review \($0)" } ?? "")
    }

    // MARK: Controls

    @ViewBuilder
    private func controls(_ row: LearningRow) -> some View {
        let available = visibleControls(row)
        if !available.isEmpty || isWorking {
            VStack(alignment: .leading, spacing: Space.s) {
                ViewThatFits(in: .horizontal) {
                    HStack(spacing: Space.m) { buttons(available) }
                    VStack(alignment: .leading, spacing: Space.xs) { buttons(available) }
                }
                if isWorking { ProgressView().controlSize(.small) }
                Text(CoachCopy.recordAgreementNote)
                    .adlerText(.footnote)
                    .foregroundStyle(Color.inkMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    @ViewBuilder
    private func buttons(_ available: [LearningActionKind]) -> some View {
        ForEach(available, id: \.self) { control in
            if control == .agree {
                AdlerPrimaryButton(title: controlTitle(control)) { pendingControl = control }
            } else {
                AdlerQuietButton(title: controlTitle(control)) { pendingControl = control }
            }
        }
        AdlerQuietButton(title: CoachCopy.discussWithAdler) { discuss(row) }
    }

    /// The server's `controls` decide what is possible; DESIGN.md §5.8 adds one rule on top —
    /// `Resume` never appears while the standing is `Evidence has changed`, because that record
    /// needs a review, not a restart.
    private func visibleControls(_ row: LearningRow) -> [LearningActionKind] {
        row.controls.available.filter { !($0 == .resume && row.standing == .reconsider) }
    }

    private func controlTitle(_ control: LearningActionKind) -> String {
        switch control {
        case .agree: CoachCopy.tryThis
        case .decline: CoachCopy.noThanks
        case .pause: CoachCopy.pause
        case .resume: CoachCopy.resume
        case .close: CoachCopy.finish
        }
    }

    private var confirmationTitle: String {
        pendingControl.map(controlTitle) ?? ""
    }

    /// The saved sentence that belongs to the control, from COPY.md. Nothing is invented to fill
    /// a gap: a control with no copy confirms with its own name only.
    private var confirmationNote: String? {
        switch pendingControl {
        case .agree: CoachCopy.recordAgreementNote
        case .pause: CoachCopy.paused
        case .close: CoachCopy.notAResult
        default: nil
        }
    }

    // MARK: Stages

    @ViewBuilder
    private func stages(_ detail: LearningDetailView, row: LearningRow) -> some View {
        VStack(alignment: .leading, spacing: Space.l) {
            LabelledLine(label: CoachCopy.recordObservation, text: row.observation)
            if let version = detail.versions.last {
                LabelledLine(
                    label: CoachCopy.recordInterpretation, text: version.reasoning.fit)
            }
            LabelledLine(label: CoachCopy.recordChange, text: row.hypothesis)
            LabelledLine(label: CoachCopy.recordExpectedEffect, text: row.prediction)
            LabelledLine(label: CoachCopy.recordWhatToNotice, text: row.behaviorSignal)
            if let mechanism = row.mechanismSignal {
                LabelledLine(label: CoachCopy.recordInterpretation, text: mechanism)
            }
            if let outcome = row.outcomeSignal {
                LabelledLine(label: CoachCopy.recordUnderstanding, text: outcome)
            }
            LabelledLine(label: CoachCopy.recordComparison, text: row.comparison)
            if !row.alternatives.isEmpty {
                LabelledLine(
                    label: CoachCopy.recordOtherExplanations,
                    text: row.alternatives.joined(separator: "\n"))
            }
            if let pending = detail.pending {
                pendingRevision(pending)
            }
        }
    }

    private func pendingRevision(_ pending: LearningVersionView) -> some View {
        VStack(alignment: .leading, spacing: Space.xs) {
            AdlerChip(label: CoachCopy.revision, emphasis: .attention)
            Text(pending.test.change)
                .adlerText(.headline)
                .foregroundStyle(Color.inkHeading)
                .fixedSize(horizontal: false, vertical: true)
            Text(CoachCopy.revisionNote)
                .adlerText(.footnote)
                .foregroundStyle(Color.inkMuted)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(AdlerLayout.cardPadding)
        .adlerWell()
    }

    // MARK: Reports, reviews, rationale

    @ViewBuilder
    private func reportsSection(_ row: LearningRow) -> some View {
        VStack(alignment: .leading, spacing: Space.s) {
            SectionHeading(CoachCopy.recordReports)
            if row.attempts.isEmpty {
                Text(CoachCopy.noAttempts)
                    .adlerText(.callout)
                    .foregroundStyle(Color.inkMuted)
            } else {
                ForEach(Array(row.attempts.enumerated()), id: \.offset) { _, attempt in
                    HStack(spacing: Space.m) {
                        Text(CoachDates.short(attempt.date, in: workspace.timeZone) ?? attempt.date.raw)
                            .adlerText(.footnote, numeric: true)
                            .foregroundStyle(Color.inkMuted)
                        // An occurrence with no saved outcome stays unreported — never "missed".
                        Text(attempt.outcome?.rawValue ?? "No report")
                            .adlerText(.footnote)
                            .foregroundStyle(attempt.outcome == nil ? Color.inkMuted : Color.ink)
                        Spacer(minLength: 0)
                    }
                    .accessibilityElement(children: .combine)
                }
            }
        }
    }

    @ViewBuilder
    private func reviewsSection(_ detail: LearningDetailView) -> some View {
        if !detail.reviews.isEmpty {
            VStack(alignment: .leading, spacing: Space.m) {
                SectionHeading(CoachCopy.recordReview)
                ForEach(detail.reviews) { review in
                    ReviewCard(review: review, timeZone: workspace.timeZone)
                }
            }
        }
    }

    @ViewBuilder
    private func rationale(_ detail: LearningDetailView) -> some View {
        if let version = detail.versions.last {
            AdlerSecondaryButton(title: CoachCopy.whyThisTest) {
                evidence = EvidenceSheetContent(
                    id: "\(recordId)-\(version.version)",
                    record: EvidenceBuilder.record(
                        reasoning: version.reasoning,
                        grounding: version.grounding,
                        sources: version.researchSources,
                        diagram: nil,
                        revisions: detail.versions.map { entry in
                            EvidenceVersionEntry(
                                id: "v\(entry.version)",
                                date: entry.at.date ?? Date(),
                                summary: "Version \(entry.version) · \(entry.test.change)")
                        },
                        corrections: detail.invalidations.map { invalidation in
                            EvidenceVersionEntry(
                                id: "\(invalidation.sourceId)-\(invalidation.version)",
                                date: invalidation.at.date ?? Date(),
                                summary: invalidation.reason)
                        },
                        timeZone: workspace.timeZone))
            }
        }
    }

    @ViewBuilder
    private func versionsSection(_ detail: LearningDetailView) -> some View {
        VStack(alignment: .leading, spacing: Space.m) {
            SectionHeading("Versions")
            ForEach(detail.versions) { version in
                VersionRow(
                    version: version, timeZone: workspace.timeZone,
                    label: label(for: version, in: detail),
                    onClaim: { router.push(.source(claimId: $0)) })
            }
            if let pending = detail.pending {
                VersionRow(
                    version: pending, timeZone: workspace.timeZone, label: CoachCopy.revision,
                    onClaim: { router.push(.source(claimId: $0)) })
            }
        }
    }

    /// A version is `Active` only when the record says so; a proposed revision is never drawn as
    /// if it were in the plan.
    private func label(for version: LearningVersionView, in detail: LearningDetailView) -> String {
        if version.version == detail.row.activeVersion { return "Active" }
        if version.version == detail.row.pendingVersion { return CoachCopy.revision }
        return "Earlier"
    }

    @ViewBuilder
    private func invalidationsSection(_ detail: LearningDetailView) -> some View {
        if !detail.invalidations.isEmpty {
            VStack(alignment: .leading, spacing: Space.s) {
                SectionHeading(CoachCopy.evidenceChanged)
                ForEach(detail.invalidations, id: \.sourceId) { invalidation in
                    VStack(alignment: .leading, spacing: Space.xxs) {
                        Text(invalidation.reason)
                            .adlerText(.callout)
                            .foregroundStyle(Color.ink)
                            .fixedSize(horizontal: false, vertical: true)
                        Text(
                            "\(CoachDates.short(invalidation.at, in: workspace.timeZone) ?? invalidation.at.raw) · version \(invalidation.version)"
                        )
                        .adlerText(.footnote, numeric: true)
                        .foregroundStyle(Color.inkMuted)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(AdlerLayout.cardPadding)
                    .adlerWell()
                }
            }
        }
    }

    @ViewBuilder
    private func eventsSection(_ detail: LearningDetailView) -> some View {
        if !detail.events.isEmpty {
            VStack(alignment: .leading, spacing: Space.s) {
                SectionHeading(CoachCopy.history)
                ForEach(detail.events, id: \.at) { event in
                    HStack(alignment: .firstTextBaseline, spacing: Space.m) {
                        Text(CoachDates.short(event.at, in: workspace.timeZone) ?? event.at.raw)
                            .adlerText(.footnote, numeric: true)
                            .foregroundStyle(Color.inkMuted)
                        Text(event.reason)
                            .adlerText(.footnote)
                            .foregroundStyle(Color.ink)
                            .fixedSize(horizontal: false, vertical: true)
                        Spacer(minLength: 0)
                    }
                    .accessibilityElement(children: .combine)
                }
            }
        }
    }

    @ViewBuilder
    private func sourcesSection(_ row: LearningRow) -> some View {
        if !row.sources.isEmpty {
            VStack(alignment: .leading, spacing: Space.s) {
                SectionHeading(CoachCopy.evidenceSources)
                ForEach(row.sources) { source in
                    Button {
                        if let link = source.deepLink, let url = URL(string: link) {
                            _ = router.handle(url: url)
                        }
                    } label: {
                        VStack(alignment: .leading, spacing: Space.xxs) {
                            Text(source.label)
                                .adlerText(.footnote)
                                .foregroundStyle(source.deepLink == nil ? Color.inkMuted : Color.accentInk)
                            Text(source.text)
                                .adlerText(.callout)
                                .foregroundStyle(Color.ink)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .buttonStyle(.plain)
                    .disabled(source.deepLink == nil)
                }
            }
        }
    }

    // MARK: Actions

    private func load() async {
        workspace.markVisible(.learningRecord(recordId))
        await workspace.loadLearningRecord(id: recordId)
        if workspace.insights == nil { await workspace.loadInsights() }
    }

    private func discuss(_ row: LearningRow?) {
        guard let row else { return }
        UserDefaults.standard.set(row.prompt, forKey: "adler.coach.draft.general")
        router.coachSegment = .conversation
        router.popToRoot(.coach)
    }

    private func perform(_ control: LearningActionKind) async {
        guard let row else { return }
        pendingControl = nil
        isWorking = true
        defer { isWorking = false }
        do {
            try await workspace.learningAction(row: row, action: control)
            error = nil
        } catch {
            self.error = error.serverMessage ?? error.errorDescription
        }
    }
}

// MARK: - Pieces

private struct ReviewCard: View {
    let review: LearningReviewView
    let timeZone: TimeZone

    var body: some View {
        VStack(alignment: .leading, spacing: Space.s) {
            HStack(alignment: .top, spacing: Space.s) {
                Text(CoachDates.short(review.at, in: timeZone) ?? review.at.raw)
                    .adlerText(.footnote, numeric: true)
                    .foregroundStyle(Color.inkMuted)
                Spacer(minLength: Space.s)
                AdlerChip(label: review.standingLabel)
            }
            Text(review.summary)
                .adlerText(.callout)
                .foregroundStyle(Color.ink)
                .fixedSize(horizontal: false, vertical: true)
            LabelledLine(label: CoachCopy.recordWasUsed, text: review.exposureLabel)
            if let mechanism = review.mechanism {
                LabelledLine(label: CoachCopy.recordInterpretation, text: mechanism)
            }
            if let behavior = review.behavior {
                LabelledLine(label: CoachCopy.recordWhatToNotice, text: behavior)
            }
            if let outcome = review.outcome {
                LabelledLine(label: CoachCopy.recordUnderstanding, text: outcome)
            }
            if !review.confounds.isEmpty {
                LabelledLine(
                    label: CoachCopy.recordOtherExplanations,
                    text: review.confounds.joined(separator: "\n"))
            }
            if let implication = review.implication {
                LabelledLine(label: CoachCopy.recordForPlan, text: implication)
            }
            if let question = review.nextQuestion {
                LabelledLine(label: CoachCopy.recordNextQuestion, text: question)
            }
            HStack(spacing: Space.m) {
                Text("Decision: \(review.decision.rawValue)")
                    .adlerText(.footnote)
                if let next = CoachDates.short(review.nextReviewAfter, in: timeZone) {
                    Text("Next review \(next)").adlerText(.footnote, numeric: true)
                }
            }
            .foregroundStyle(Color.inkMuted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(AdlerLayout.cardPadding)
        .adlerCard()
    }
}

private struct VersionRow: View {
    let version: LearningVersionView
    let timeZone: TimeZone
    let label: String
    var onClaim: (String) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: Space.s) {
            HStack(spacing: Space.s) {
                AdlerChip(label: label, emphasis: label == "Active" ? .filled : .outlined)
                Text("Version \(version.version)")
                    .adlerText(.footnote, numeric: true)
                    .foregroundStyle(Color.inkMuted)
                Spacer(minLength: Space.s)
                Text(CoachDates.short(version.at, in: timeZone) ?? version.at.raw)
                    .adlerText(.footnote, numeric: true)
                    .foregroundStyle(Color.inkMuted)
            }
            Text(version.test.change)
                .adlerText(.callout)
                .foregroundStyle(Color.ink)
                .fixedSize(horizontal: false, vertical: true)
            Text(version.test.reviewRule)
                .adlerText(.footnote)
                .foregroundStyle(Color.inkMuted)
                .fixedSize(horizontal: false, vertical: true)
            ForEach(version.grounding, id: \.claimId) { binding in
                Button { onClaim(binding.claimId) } label: {
                    HStack(spacing: Space.xs) {
                        RelationChip(
                            relation: EvidenceRelation(rawValue: binding.relation.rawValue) ?? .supports)
                        Text(binding.claim?.label ?? binding.claimId)
                            .adlerText(.footnote)
                            .foregroundStyle(Color.accentInk)
                            .multilineTextAlignment(.leading)
                        Image(systemName: "chevron.right").font(.caption2)
                            .foregroundStyle(Color.inkMuted)
                        Spacer(minLength: 0)
                    }
                    .frame(minHeight: AdlerLayout.minimumHitTarget, alignment: .leading)
                    .contentShape(.rect)
                }
                .buttonStyle(.plain)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(AdlerLayout.cardPadding)
        .adlerWell()
    }
}
