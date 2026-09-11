import SwiftUI

/// `Review changes` — every change in the proposal, plus what the server says the goal's
/// execution would look like if it were approved (`POST /api/proposals/:id/preview`).
///
/// The card shows the first six changes; this shows all of them. Nothing is applied by opening
/// it, which the header says out loud.
struct FirstPlanPreviewSheet: View {
    let proposal: ProposalView

    @Environment(WorkspaceStore.self) private var workspace
    @Environment(SessionStore.self) private var session
    @Environment(\.dismiss) private var dismiss

    @State private var preview: ProposalPreview?
    @State private var failure: APIError?
    @State private var isLoading = true

    private var calendar: Calendar {
        var calendar = Calendar.current
        calendar.timeZone = session.timeZone
        return calendar
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: AdlerLayout.sectionGap) {
                    Text("Nothing is saved until you approve.")
                        .adlerText(.callout)
                        .foregroundStyle(Color.inkMuted)
                        .fixedSize(horizontal: false, vertical: true)

                    if let failure {
                        ErrorBanner(kind: .of(failure), actionTitle: "Retry") {
                            Task { await load() }
                        }
                    } else if isLoading {
                        SkeletonCard()
                    } else if let preview {
                        outcome(preview)
                    }

                    VStack(alignment: .leading, spacing: Space.m) {
                        Text("EVERY CHANGE")
                            .adlerText(.eyebrow)
                            .foregroundStyle(Color.inkMuted)
                        ForEach(FirstPlanProposal.comparisons(for: proposal)) { row in
                            ChangeComparison(row: row, goal: nil)
                        }
                    }
                }
                .padding(AdlerLayout.screenMargin)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .background(Color.canvas)
            .navigationTitle("Review changes")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Close") { dismiss() }.tint(Color.accentInk)
                }
            }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
        .task { await load() }
    }

    @ViewBuilder
    private func outcome(_ preview: ProposalPreview) -> some View {
        ForEach(preview.execution) { goal in
            VStack(alignment: .leading, spacing: Space.s) {
                Text("IF YOU APPROVE")
                    .adlerText(.eyebrow)
                    .foregroundStyle(Color.inkMuted)
                Text(
                    "\(goal.summary.planned) planned action\(goal.summary.planned == 1 ? "" : "s") between "
                        + "\(day(goal.start)) and \(day(goal.end))"
                )
                .adlerText(.callout, numeric: true)
                .foregroundStyle(Color.ink)
                .fixedSize(horizontal: false, vertical: true)

                ForEach(goal.markers) { marker in
                    HStack(alignment: .firstTextBaseline, spacing: Space.s) {
                        Text(marker.label)
                            .adlerText(.subhead)
                            .foregroundStyle(Color.ink)
                            .fixedSize(horizontal: false, vertical: true)
                        Spacer(minLength: Space.s)
                        if let date = marker.date {
                            Text(day(date))
                                .adlerText(.footnote, numeric: true)
                                .foregroundStyle(Color.inkMuted)
                        }
                    }
                }
            }
            .padding(AdlerLayout.cardPadding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .adlerCard()
        }
    }

    private func day(_ value: YMD) -> String {
        value.date(in: session.timeZone).map { AdlerDate.short($0, calendar: calendar) } ?? value.raw
    }

    private func load() async {
        isLoading = true
        failure = nil
        defer { isLoading = false }
        do {
            preview = try await workspace.previewProposal(id: proposal.id)
        } catch {
            failure = error
        }
    }
}

/// `Why this?` for the first plan: the saved recommendation prose, printed as written.
///
/// This is deliberately not the full `EvidenceDisclosure` (DESIGN.md §4.6) — the Coach agent owns
/// that component's wiring, including claim grounding and sources. Opening it here would mean
/// re-deriving those links in a second place. What is shown is verbatim and nothing is added.
struct FirstPlanRationaleSheet: View {
    let proposal: ProposalView
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: AdlerLayout.sectionGap) {
                    ForEach(Array(proposal.recommendations.enumerated()), id: \.offset) { _, item in
                        VStack(alignment: .leading, spacing: Space.m) {
                            row("OBSERVATION", item.observation)
                            row("BEHAVIOURAL SCIENCE", item.interpretation)
                            row("WHAT WE’RE TESTING", item.expectedEffect)
                        }
                        .padding(AdlerLayout.cardPadding)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .adlerCard()
                    }

                    if !proposal.researchSources.isEmpty {
                        VStack(alignment: .leading, spacing: Space.s) {
                            Text("SOURCES")
                                .adlerText(.eyebrow)
                                .foregroundStyle(Color.inkMuted)
                            ForEach(proposal.researchSources, id: \.id) { source in
                                Text(source.title)
                                    .adlerText(.subhead)
                                    .foregroundStyle(Color.ink)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                        }
                        .padding(AdlerLayout.cardPadding)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .adlerCard()
                    }
                }
                .padding(AdlerLayout.screenMargin)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .background(Color.canvas)
            .navigationTitle("Why this?")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Close") { dismiss() }.tint(Color.accentInk)
                }
            }
        }
        .presentationDetents([.height(560), .large])
        .presentationDragIndicator(.visible)
    }

    @ViewBuilder
    private func row(_ label: String, _ text: String) -> some View {
        if !text.isEmpty {
            VStack(alignment: .leading, spacing: Space.xxs) {
                Text(label)
                    .adlerText(.eyebrow)
                    .foregroundStyle(Color.inkMuted)
                Text(text)
                    .adlerText(.callout)
                    .foregroundStyle(Color.ink)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }
}
