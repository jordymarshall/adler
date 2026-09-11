import SafariServices
import SwiftUI

/// One claim behind a recommendation (`CoachRoute.source`). Statement, role, grade, what was
/// actually read, limitations and the link out — the deepest level DESIGN.md §4.6 describes.
///
/// It renders only the saved claim record. A claim whose version is no longer in the catalog
/// says so rather than showing a nearby version.
struct EvidenceSourceView: View {
    let claimId: String

    @Environment(WorkspaceStore.self) private var workspace
    @State private var safariLink: SafariLink?

    private var claim: ResearchClaim? { CoachClaimLookup.claim(id: claimId, in: workspace) }
    private var binding: ClaimBindingView? { CoachClaimLookup.binding(id: claimId, in: workspace) }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AdlerLayout.sectionGap) {
                if let claim {
                    heading(claim)
                    if let binding {
                        LabelledLine(label: "Applied here", text: binding.application)
                    }
                    LabelledLine(label: "Statement", text: claim.statement)
                    LabelledLine(label: "Scope", text: claim.scope)
                    LabelledLine(label: CoachCopy.evidenceGrade, text: claim.grade)
                    if !claim.locator.isEmpty {
                        LabelledLine(label: "What was read", text: claim.locator)
                    }
                    if !claim.limitations.isEmpty {
                        LabelledLine(
                            label: CoachCopy.evidenceLimitation,
                            text: claim.limitations.joined(separator: "\n"))
                    }
                    sourceSection(claim.source)
                    reviewSection(claim)
                } else {
                    EmptyStateView(
                        title: CoachCopy.errorRecordGone, message: CoachCopy.evidenceClaimMissing)
                }
            }
            .padding(AdlerLayout.screenMargin)
        }
        .background(Color.canvas)
        .navigationTitle(claim?.label ?? claimId)
        .navigationBarTitleDisplayMode(.inline)
        .sheet(item: $safariLink) { link in
            SafariView(url: link.url).ignoresSafeArea()
        }
    }

    private func heading(_ claim: ResearchClaim) -> some View {
        VStack(alignment: .leading, spacing: Space.s) {
            HStack(spacing: Space.s) {
                if let binding {
                    RelationChip(
                        relation: EvidenceRelation(rawValue: binding.relation.rawValue) ?? .supports)
                }
                AdlerChip(
                    label: EvidenceRole(rawValue: claim.role.rawValue)?.displayName
                        ?? claim.role.rawValue)
                Spacer(minLength: 0)
            }
            Text(claim.label ?? claim.id)
                .adlerText(.title2)
                .foregroundStyle(Color.inkHeading)
                .fixedSize(horizontal: false, vertical: true)
            Text("\(claim.construct) · \(claim.version)")
                .adlerText(.footnote, numeric: true)
                .foregroundStyle(Color.inkMuted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func sourceSection(_ source: ResearchSource) -> some View {
        VStack(alignment: .leading, spacing: Space.s) {
            SectionHeading(CoachCopy.evidenceSources)
            Text(source.title)
                .adlerText(.callout)
                .foregroundStyle(Color.ink)
                .fixedSize(horizontal: false, vertical: true)
            Text(metadata(source))
                .adlerText(.footnote, numeric: true)
                .foregroundStyle(Color.inkMuted)
                .fixedSize(horizontal: false, vertical: true)
            Text(source.summary)
                .adlerText(.callout)
                .foregroundStyle(Color.ink)
                .fixedSize(horizontal: false, vertical: true)
            if let url = URL(string: source.url) {
                AdlerQuietButton(
                    title: CoachCopy.evidenceReadSource, systemImage: "arrow.up.right",
                    symbolTrailing: true
                ) { safariLink = SafariLink(url: url) }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func metadata(_ source: ResearchSource) -> String {
        var parts = [source.authors, source.year, source.kind]
        if !source.access.isUnknown { parts.append(source.access.rawValue) }
        if let retrieved = CoachDates.short(source.retrievedAt, in: workspace.timeZone) {
            parts.append("Retrieved \(retrieved)")
        }
        if let doi = source.doi { parts.append(doi) }
        return parts.filter { !$0.isEmpty }.joined(separator: " · ")
    }

    private func reviewSection(_ claim: ResearchClaim) -> some View {
        VStack(alignment: .leading, spacing: Space.xxs) {
            SectionHeading(CoachCopy.evidenceVersions)
            Text("\(claim.review.status.rawValue) · \(claim.review.at.raw)")
                .adlerText(.footnote, numeric: true)
                .foregroundStyle(Color.inkMuted)
            Text(claim.review.by)
                .adlerText(.footnote)
                .foregroundStyle(Color.inkMuted)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

// MARK: - Finding a claim

/// Claims arrive attached to whatever was loaded — a proposal, a recommendation in a message, or
/// a learning record's version. This looks in all three rather than refetching, because a claim
/// has no endpoint of its own.
nonisolated enum CoachClaimLookup {
    @MainActor
    static func bindings(in workspace: WorkspaceStore) -> [ClaimBindingView] {
        var all: [ClaimBindingView] = []
        for view in [workspace.coach].compactMap({ $0 }) + workspace.conversations.values {
            all += view.proposals.flatMap { $0.recommendations.flatMap(\.grounding) }
            all += view.messages.flatMap { $0.recommendations.flatMap(\.grounding) }
        }
        for record in workspace.learningRecords.values {
            all += record.versions.flatMap(\.grounding)
            if let pending = record.pending { all += pending.grounding }
        }
        return all
    }

    @MainActor
    static func binding(id: String, in workspace: WorkspaceStore) -> ClaimBindingView? {
        bindings(in: workspace).first { $0.claimId == id }
    }

    @MainActor
    static func claim(id: String, in workspace: WorkspaceStore) -> ResearchClaim? {
        if let claim = bindings(in: workspace).first(where: { $0.claimId == id })?.claim {
            return claim
        }
        for view in [workspace.coach].compactMap({ $0 }) + workspace.conversations.values {
            if let claim = view.proposals.flatMap(\.researchClaims).first(where: { $0.id == id }) {
                return claim
            }
        }
        return nil
    }
}

// MARK: - Safari

/// `SFSafariViewController`, as DESIGN.md §4.6 specifies for a source link — the citation opens
/// in place, with its URL visible.
private struct SafariView: UIViewControllerRepresentable {
    let url: URL

    func makeUIViewController(context: Context) -> SFSafariViewController {
        SFSafariViewController(url: url)
    }

    func updateUIViewController(_ controller: SFSafariViewController, context: Context) {}
}

nonisolated struct SafariLink: Identifiable, Equatable, Sendable {
    let url: URL
    var id: String { url.absoluteString }
}
