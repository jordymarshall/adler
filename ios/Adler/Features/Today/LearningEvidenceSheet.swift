import SwiftUI

/// `Review suggestion` / `Explore the experiment` from Today 03 Learn: the full saved record in
/// the design system's ``EvidenceDisclosure`` (DESIGN.md §4.6).
///
/// The sheet renders **only saved fields** — the sentences come from
/// `GET /api/app/insights/:recordId`, never from the client. A section the record does not
/// contain is omitted rather than filled in.
struct LearningEvidenceSheet: View {
    let recordId: String
    let onClose: () -> Void

    @Environment(WorkspaceStore.self) private var workspace

    private var state: LoadState { workspace.state(.learningRecord(recordId)) }
    private var detail: LearningDetailView? { workspace.learningRecords[recordId] }

    var body: some View {
        Group {
            if let detail {
                EvidenceDisclosure(
                    record: EvidenceRecordMapper.make(
                        detail, timeZone: workspace.timeZone),
                    onClose: onClose
                )
            } else if let error = state.error {
                sheetShell {
                    ErrorBanner(
                        kind: error.isNotFound ? .server(detail: "This record is no longer here.")
                            : error.bannerKind,
                        action: { Task { await workspace.loadLearningRecord(id: recordId) } })
                }
            } else {
                sheetShell {
                    VStack(alignment: .leading, spacing: Space.l) {
                        SkeletonRow()
                        SkeletonCard()
                    }
                }
            }
        }
        .task { await workspace.loadLearningRecord(id: recordId) }
    }

    private func sheetShell<Content: View>(@ViewBuilder content: () -> Content) -> some View {
        NavigationStack {
            ScrollView {
                content().padding(AdlerLayout.screenMargin)
            }
            .background(Color.canvas)
            .navigationTitle("Why this?")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) { Button("Close", action: onClose) }
            }
        }
    }
}

// MARK: - Mapping

/// `LearningDetailView` (Core model) → `EvidenceRecord` (design-system value type).
///
/// Every field is copied, never composed: mechanism, fit, prediction, review rule, claims with
/// their grades and limitations, research sources with what was actually read, and the dated
/// revision/correction history. Nothing is inferred and nothing is summarised.
nonisolated enum EvidenceRecordMapper {
    static func make(_ detail: LearningDetailView, timeZone: TimeZone) -> EvidenceRecord {
        let row = detail.row
        // The version the record is currently acting on; the pending revision, when there is
        // one, is a separate decision and is not merged into the agreed test.
        let version =
            detail.versions.first { $0.version == row.version } ?? detail.versions.last
        let reasoning = version?.reasoning
        let dates = TodayDates(today: detail.today, timeZone: timeZone)

        var record = EvidenceRecord()
        record.mechanism = reasoning?.mechanism
        record.fit = reasoning?.fit
        record.prediction = reasoning?.prediction ?? row.prediction
        record.reviewRule = reasoning?.reviewRule ?? row.reviewRule
        record.limitation = reasoning?.limitation
        record.diagram = diagram(row: row, reasoning: reasoning, dates: dates)
        record.claims = claims(version?.grounding ?? [])
        record.sources = sources(version?.researchSources ?? [])
        record.ruleExceptions = (reasoning?.ruleExceptions ?? []) + row.alternatives
        record.identifiers = identifiers(row: row, version: version, reasoning: reasoning)
        record.revisions = revisions(detail, dates: dates)
        record.corrections = corrections(detail, dates: dates)
        return record
    }

    private static func diagram(
        row: LearningRow, reasoning: BehavioralReasoning?, dates: TodayDates
    ) -> ReasoningDiagramContent? {
        guard let explanation = reasoning?.mechanism else { return nil }
        let reported = row.attempts.filter { $0.outcome != nil }.compactMap { dates.short($0.date) }
        let principles = reasoning?.principleIds ?? []
        let research =
            ([reasoning?.methodId].compactMap { $0 } + principles)
            .filter { !$0.isEmpty }
            .joined(separator: " · ")
        var feedback = reported
        if let review = row.nextReviewAfter ?? row.reviewAfter, let text = dates.short(review) {
            feedback.append("review \(text)")
        }
        return ReasoningDiagramContent(
            reports: reported.isEmpty ? "No reports yet" : reported.joined(separator: " · "),
            research: research.isEmpty ? "No saved method reference" : research,
            explanation: explanation,
            action: row.change,
            laterFeedback: feedback.isEmpty ? nil : feedback.joined(separator: " · ")
        )
    }

    private static func claims(_ bindings: [ClaimBindingView]) -> [EvidenceClaim] {
        bindings.map { binding in
            let claim = binding.claim
            return EvidenceClaim(
                id: "\(binding.claimId)@\(binding.version)",
                relation: EvidenceRelation(rawValue: binding.relation.rawValue) ?? .supports,
                label: claim?.label ?? binding.claimId,
                // A claim version that is no longer in the catalog is said so, not guessed at.
                statement: claim?.statement
                    ?? "This earlier claim version is unavailable here. The saved explanation remains historical.",
                grade: claim?.grade,
                version: binding.version,
                role: claim.flatMap { EvidenceRole(rawValue: $0.role.rawValue) },
                application: binding.application,
                limitations: claim?.limitations ?? []
            )
        }
    }

    private static func sources(_ sources: [ResearchSource]) -> [EvidenceSource] {
        sources.map { source in
            EvidenceSource(
                id: source.id,
                title: source.title,
                authors: source.authors.isEmpty ? nil : source.authors,
                year: Int(source.year),
                kind: source.kind.isEmpty ? nil : source.kind,
                access: source.access.rawValue,
                retrievedAt: source.retrievedAt.date,
                url: URL(string: source.url)
            )
        }
    }

    private static func identifiers(
        row: LearningRow, version: LearningVersionView?, reasoning: BehavioralReasoning?
    ) -> [String] {
        var lines: [String] = []
        if let version { lines.append("Test version \(version.version)") }
        if let methodId = reasoning?.methodId, !methodId.isEmpty {
            lines.append("Method \(methodId)")
        }
        let principles = reasoning?.principleIds.filter { !$0.isEmpty } ?? []
        if !principles.isEmpty {
            lines.append("Principles \(principles.joined(separator: ", "))")
        }
        if let route = reasoning?.goalRoute.rawValue, !route.isEmpty {
            lines.append("Goal route \(route)")
        }
        lines.append("Design \(row.design.rawValue)")
        lines.append("Comparison \(row.comparison)")
        return lines
    }

    private static func revisions(_ detail: LearningDetailView, dates: TodayDates)
        -> [EvidenceVersionEntry]
    {
        detail.versions.compactMap { version in
            guard let date = version.at.date else { return nil }
            return EvidenceVersionEntry(
                id: "version-\(version.version)", date: date,
                summary: "Version \(version.version) · \(version.test.change)")
        }
    }

    /// An invalidated source is a correction to the record's evidence — dated, with the saved
    /// reason, and never silently dropped.
    private static func corrections(_ detail: LearningDetailView, dates: TodayDates)
        -> [EvidenceVersionEntry]
    {
        detail.invalidations.compactMap { entry in
            guard let date = entry.at.date else { return nil }
            return EvidenceVersionEntry(
                id: "invalidation-\(entry.sourceId)-\(entry.version)", date: date,
                summary: entry.reason)
        }
    }
}
