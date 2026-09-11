import SwiftUI

/// "Why this?" — one sheet, one level deep, no nested accordions
/// (DESIGN.md §4.6). Renders only saved fields; a missing field is omitted
/// rather than filled in.
struct EvidenceDisclosure: View {
    let record: EvidenceRecord
    var onClose: () -> Void = {}

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: AdlerLayout.sectionGap) {
                    Section1WorkingExplanation(record: record)
                    if let diagram = record.diagram {
                        ReasoningDiagram(content: diagram)
                    }
                    predictionSection
                    if !record.claims.isEmpty { claimsSection }
                    if !record.sources.isEmpty { sourcesSection }
                    if !record.alternatives.isEmpty || !record.ruleExceptions.isEmpty { alternativesSection }
                    // An empty WHAT REMAINS UNCERTAIN well reads as "nothing is
                    // uncertain" — the opposite of the truth, and the most
                    // load-bearing honesty affordance on this sheet. Both
                    // sections are guarded on having content, exactly as the
                    // claims/sources/alternatives sections above are.
                    if record.hasLimitations { limitationSection }
                    if record.hasVersionHistory { versionsSection }
                }
                .padding(AdlerLayout.screenMargin)
            }
            .background(Color.canvas)
            .navigationTitle("Why this?")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Close", action: onClose)
                }
            }
        }
    }

    private var predictionSection: some View {
        VStack(alignment: .leading, spacing: Space.m) {
            if let prediction = record.prediction {
                EvidenceSection(title: "What we predicted") {
                    Text(prediction).adlerText(.body).foregroundStyle(Color.ink)
                }
            }
            if let reviewRule = record.reviewRule {
                EvidenceSection(title: "How we’ll review it") {
                    Text(reviewRule).adlerText(.body).foregroundStyle(Color.ink)
                }
            }
        }
    }

    private var claimsSection: some View {
        EvidenceSection(title: "Claims") {
            VStack(alignment: .leading, spacing: Space.l) {
                ForEach(record.claims) { claim in
                    ClaimRow(claim: claim)
                }
            }
        }
    }

    private var sourcesSection: some View {
        EvidenceSection(title: "Sources") {
            VStack(alignment: .leading, spacing: Space.l) {
                ForEach(record.sources) { source in
                    SourceRow(source: source)
                }
            }
        }
    }

    private var alternativesSection: some View {
        EvidenceSection(title: "Alternatives") {
            VStack(alignment: .leading, spacing: Space.m) {
                ForEach(record.alternatives) { alternative in
                    VStack(alignment: .leading, spacing: Space.xxs) {
                        Text(alternative.option)
                            .adlerText(.callout)
                            .foregroundStyle(Color.ink)
                        Text(alternative.tradeoff)
                            .adlerText(.footnote)
                            .foregroundStyle(Color.inkMuted)
                    }
                    .fixedSize(horizontal: false, vertical: true)
                }
                ForEach(record.ruleExceptions, id: \.self) { exception in
                    Text(exception)
                        .adlerText(.footnote)
                        .foregroundStyle(Color.inkMuted)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
    }

    private var limitationSection: some View {
        EvidenceSection(title: "What remains uncertain") {
            VStack(alignment: .leading, spacing: Space.s) {
                if let limitation = record.limitation {
                    Text(limitation).adlerText(.body).foregroundStyle(Color.ink)
                }
                ForEach(record.claims.flatMap(\.limitations), id: \.self) { limitation in
                    Text(limitation).adlerText(.footnote).foregroundStyle(Color.inkMuted)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .fixedSize(horizontal: false, vertical: true)
            .adlerWell()
        }
    }

    private var versionsSection: some View {
        EvidenceSection(title: "Versions and history") {
            VStack(alignment: .leading, spacing: Space.s) {
                ForEach(record.identifiers, id: \.self) { line in
                    Text(line)
                        .adlerText(.footnote, numeric: true)
                        .foregroundStyle(Color.inkMuted)
                }
                ForEach(record.revisions) { revision in
                    Text("\(AdlerDate.short(revision.date)) · \(revision.summary)")
                        .adlerText(.footnote, numeric: true)
                        .foregroundStyle(Color.inkMuted)
                        .fixedSize(horizontal: false, vertical: true)
                }
                ForEach(record.corrections) { correction in
                    Text("Corrected \(AdlerDate.short(correction.date)) · \(correction.summary)")
                        .adlerText(.footnote, numeric: true)
                        .foregroundStyle(Color.warning)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
    }
}

private struct Section1WorkingExplanation: View {
    let record: EvidenceRecord

    /// The diagram carries the mechanism, so this section can be empty even
    /// when a mechanism is saved. An empty heading states nothing.
    private var hasContent: Bool {
        record.fit != nil
            || (record.mechanism != nil && record.mechanism != record.diagram?.explanation)
    }

    @ViewBuilder
    var body: some View {
        if hasContent { section }
    }

    private var section: some View {
        EvidenceSection(title: "Working explanation") {
            VStack(alignment: .leading, spacing: Space.s) {
                // The diagram below carries the mechanism as its emphasised
                // block, so printing the same saved sentence twice in one
                // sheet is avoided.
                if let mechanism = record.mechanism, mechanism != record.diagram?.explanation {
                    Text(mechanism).adlerText(.body).foregroundStyle(Color.ink)
                }
                if let fit = record.fit {
                    Text(fit).adlerText(.body).foregroundStyle(Color.ink)
                }
            }
            .fixedSize(horizontal: false, vertical: true)
        }
    }
}

private struct EvidenceSection<Content: View>: View {
    let title: String
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: Space.s) {
            Text(title)
                .adlerText(.eyebrow)
                .foregroundStyle(Color.inkMuted)
            content
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .contain)
    }
}

private struct ClaimRow: View {
    let claim: EvidenceClaim

    var body: some View {
        VStack(alignment: .leading, spacing: Space.xs) {
            HStack(spacing: Space.s) {
                RelationChip(relation: claim.relation)
                Text(claim.label)
                    .adlerText(.subhead)
                    .foregroundStyle(Color.ink)
            }
            Text(claim.statement)
                .adlerText(.callout)
                .foregroundStyle(Color.ink)
                .fixedSize(horizontal: false, vertical: true)
            if let application = claim.application {
                Text(application)
                    .adlerText(.footnote)
                    .foregroundStyle(Color.inkMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Text(claim.metadataLine)
                .adlerText(.footnote, numeric: true)
                .foregroundStyle(Color.inkMuted)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .combine)
    }
}

/// The five relation tags, each a distinct outline chip. `limits` and
/// `contradicts` also carry a warning symbol, so the direction of the
/// evidence is never only a word colour.
struct RelationChip: View {
    let relation: EvidenceRelation

    var body: some View {
        AdlerChip(
            label: relation.rawValue,
            emphasis: relation.isCautionary ? .attention : .outlined,
            symbol: relation.symbol
        )
        .accessibilityLabel("Relation: \(relation.rawValue)")
    }
}

private struct SourceRow: View {
    let source: EvidenceSource

    var body: some View {
        VStack(alignment: .leading, spacing: Space.xxs) {
            Text(source.title)
                .adlerText(.subhead)
                .foregroundStyle(Color.ink)
                .fixedSize(horizontal: false, vertical: true)
            Text(source.metadataLine)
                .adlerText(.footnote, numeric: true)
                .foregroundStyle(Color.inkMuted)
                .fixedSize(horizontal: false, vertical: true)
            if let url = source.url {
                Link(destination: url) {
                    HStack(spacing: Space.xs) {
                        Text("Read source").adlerText(.footnote)
                        Image(systemName: "arrow.up.right.square").font(.caption2)
                    }
                    .foregroundStyle(Color.accentInk)
                    .frame(minHeight: AdlerLayout.minimumHitTarget, alignment: .leading)
                }
                .accessibilityHint(url.host() ?? "Opens the source")
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

// MARK: - Value types

nonisolated struct EvidenceRecord: Equatable, Sendable {
    /// `reasoning.mechanism` — verbatim.
    var mechanism: String?
    /// `reasoning.fit` — verbatim.
    var fit: String?
    var diagram: ReasoningDiagramContent?
    /// `reasoning.prediction` — verbatim.
    var prediction: String?
    /// `reasoning.reviewRule` — verbatim.
    var reviewRule: String?
    var claims: [EvidenceClaim] = []
    var sources: [EvidenceSource] = []
    var alternatives: [EvidenceAlternative] = []
    var ruleExceptions: [String] = []
    /// `reasoning.limitation` — verbatim.
    var limitation: String?
    /// `principleIds`, `methodId`, `goalRoute`, `frameworkVersion` and the
    /// `scientificReview` line, already formatted by the caller.
    var identifiers: [String] = []
    var revisions: [EvidenceVersionEntry] = []
    var corrections: [EvidenceVersionEntry] = []

    /// True when the sheet has something to print under **What remains uncertain**.
    var hasLimitations: Bool {
        limitation?.isEmpty == false || claims.contains { !$0.limitations.isEmpty }
    }

    /// True when the sheet has something to print under **Versions and history**.
    var hasVersionHistory: Bool {
        !identifiers.isEmpty || !revisions.isEmpty || !corrections.isEmpty
    }
}

nonisolated enum EvidenceRelation: String, CaseIterable, Sendable {
    case supports
    case defines
    case motivates
    case limits
    case contradicts

    var isCautionary: Bool { self == .limits || self == .contradicts }
    var symbol: String? { isCautionary ? "exclamationmark.triangle" : nil }
}

nonisolated enum EvidenceRole: String, CaseIterable, Sendable {
    case theory
    case technique
    case empirical
    case heuristic

    /// The display names COPY.md §14 specifies for the four saved roles.
    var displayName: String {
        switch self {
        case .theory: "Framework idea"
        case .technique: "Technique definition"
        case .empirical: "Research finding"
        case .heuristic: "Practical rule"
        }
    }
}

nonisolated struct EvidenceClaim: Identifiable, Equatable, Sendable {
    let id: String
    let relation: EvidenceRelation
    let label: String
    let statement: String
    /// Free-form prose from the record — never a badge or a number.
    var grade: String?
    var version: String?
    var role: EvidenceRole?
    var application: String?
    var limitations: [String] = []

    var metadataLine: String {
        var parts: [String] = []
        if let grade { parts.append("Grade \(grade)") }
        if let version { parts.append(version) }
        if let role { parts.append(role.displayName) }
        return parts.joined(separator: " · ")
    }
}

nonisolated struct EvidenceSource: Identifiable, Equatable, Sendable {
    let id: String
    let title: String
    var authors: String?
    var year: Int?
    var kind: String?
    /// `abstract` · `method summary` · `full text excerpt` — what was
    /// actually read, so the depth of the citation is legible.
    var access: String?
    var retrievedAt: Date?
    var url: URL?

    var metadataLine: String {
        var parts: [String] = []
        if let authors { parts.append(authors) }
        if let year { parts.append(String(year)) }
        if let kind { parts.append(kind) }
        if let access { parts.append(access) }
        if let retrievedAt { parts.append("Retrieved \(AdlerDate.short(retrievedAt))") }
        return parts.joined(separator: " · ")
    }
}

nonisolated struct EvidenceAlternative: Identifiable, Equatable, Sendable {
    let id: String
    let option: String
    let tradeoff: String
}

nonisolated struct EvidenceVersionEntry: Identifiable, Equatable, Sendable {
    let id: String
    let date: Date
    let summary: String
}

// MARK: - Previews

// Sample data for previews and the design-system gallery only. Kept out of
// Release: a file-scope `let` is not stripped the way a `#Preview` body is, and
// invented research must never be reachable from shipped code.
#if DEBUG
/// Fictional design data.
let evidencePreviewRecord = EvidenceRecord(
    mechanism: "Changing the setup may reduce the pull to check the phone during a writing session.",
    fit: "You reported two sessions where the time existed and the phone took it, which is the situation this technique addresses.",
    diagram: ReasoningDiagramContent(
        reports: "1 Oct · 10 Oct",
        research: "P7 · Situation modification",
        explanation: "Changing the setup may reduce the pull to check the phone during a writing session.",
        action: "Leave the phone in the kitchen",
        laterFeedback: "13 Oct · 15 Oct · review 25 Oct",
        goalColor: GoalColor(hue: 142, saturation: 45)
    ),
    prediction: "Fewer interrupted sessions reported over the next two writing days.",
    reviewRule: "Review on 25 October, or earlier if you report two sessions.",
    claims: [
        EvidenceClaim(
            id: "c1",
            relation: .supports,
            label: "Situation modification",
            statement: "Altering the environment before a task reduces the frequency of competing responses.",
            grade: "moderate — small samples, mostly student participants",
            version: "v3",
            role: .technique,
            application: "Applied here by moving the phone out of the room before the session.",
            limitations: ["Studied over single sessions, not sustained routines."]
        ),
        EvidenceClaim(
            id: "c2",
            relation: .limits,
            label: "Self-report exposure",
            statement: "Whether the change was actually used is self-reported and not independently verified.",
            grade: "low",
            version: "v1",
            role: .heuristic,
            application: nil,
            limitations: ["Two reports cannot separate the change from the day it fell on."]
        )
    ],
    sources: [
        EvidenceSource(
            id: "s1",
            title: "Situational strategies for self-control",
            authors: "Duckworth, Gendler & Gross",
            year: 2016,
            kind: "review",
            access: "abstract",
            retrievedAt: .now,
            url: URL(string: "https://example.org/situational-strategies")
        )
    ],
    alternatives: [
        EvidenceAlternative(id: "a1", option: "Use a website blocker instead", tradeoff: "Does not address the phone being within reach.")
    ],
    ruleExceptions: ["If the phone is needed for the work itself, this does not apply."],
    limitation: "Two reports support trying this again, not a conclusion about what works for you.",
    identifiers: ["P7 · method: situation-modification", "Framework v0.5", "Checked 12 Oct · Google gemini-3.8-flash"],
    revisions: [EvidenceVersionEntry(id: "r1", date: .now, summary: "First saved explanation")],
    corrections: [EvidenceVersionEntry(id: "x1", date: .now, summary: "Grade lowered after re-reading the abstract")]
)

/// Fictional design data.
#Preview("Evidence disclosure") {
    EvidenceDisclosure(record: evidencePreviewRecord)
}

/// Fictional design data.
#Preview("Evidence disclosure — sparse record") {
    EvidenceDisclosure(
        record: EvidenceRecord(
            mechanism: "This plan records your chosen work.",
            limitation: "No behavioural interpretation is saved for this version."
        )
    )
}
#endif
