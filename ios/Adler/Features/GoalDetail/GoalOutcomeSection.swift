import SwiftUI

/// `OUTCOME` — subordinate to the work above it (structure decision).
///
/// Recorded results against saved checkpoints, plus the conditional projection **when the
/// server produced one**. When it did not, the saved reason is printed verbatim and no empty
/// forecast panel appears.
struct GoalOutcomeSection: View {
    let detail: GoalDetailView
    let timeZone: TimeZone
    var onAssumptions: () -> Void
    var onWhatWouldHelp: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: Space.m) {
            HStack(alignment: .firstTextBaseline, spacing: Space.s) {
                Text("OUTCOME")
                    .adlerText(.eyebrow)
                    .foregroundStyle(Color.inkMuted)
                    .accessibilityAddTraits(.isHeader)
                Spacer(minLength: Space.s)
                AdlerChip(label: detail.projection.status)
            }

            Text(detail.progress.label)
                .adlerText(.subhead)
                .foregroundStyle(Color.ink)

            if let note = detail.progress.evidenceNote {
                Text(note)
                    .adlerText(.footnote)
                    .foregroundStyle(Color.warning)
                    .fixedSize(horizontal: false, vertical: true)
            }

            if let content = GoalDetailPresentation.outcomeContent(detail, timeZone: timeZone),
                detail.progress.hasOutcome || !content.observed.isEmpty
            {
                OutcomeChart(
                    content: content,
                    goal: GoalColor.parse(detail.goal.color),
                    onAssumptions: content.projection == nil ? nil : onAssumptions,
                    onWhatWouldHelp: content.unavailableReason == nil ? nil : onWhatWouldHelp)
            } else {
                // No recorded outcome yet: say what is missing, and still print the server's
                // saved reason rather than dropping it with the chart.
                EmptyStateView(
                    title: EmptyStateCopy.noOutcomeMeasure.title,
                    message: EmptyStateCopy.noOutcomeMeasure.body)
                if let reason = detail.projection.unavailableReason {
                    UnavailableReason(reason: reason, onWhatWouldHelp: onWhatWouldHelp)
                }
            }

            if !detail.progress.openMilestones.isEmpty {
                Text(
                    "Still open: "
                        + detail.progress.openMilestones.map(\.title).joined(separator: ", ")
                )
                .adlerText(.footnote)
                .foregroundStyle(Color.inkMuted)
                .fixedSize(horizontal: false, vertical: true)
            }

            Text(detail.projection.inputLabel)
                .adlerText(.caption)
                .foregroundStyle(Color.inkMuted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(AdlerLayout.cardPadding)
        .adlerCard()
    }
}

/// The saved assumptions behind a conditional projection, and the evidence it was built from.
/// Everything here is printed as the server wrote it.
struct ProjectionAssumptionsSheet: View {
    let projection: ProjectionView
    let timeZone: TimeZone
    var onClose: () -> Void

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: AdlerLayout.sectionGap) {
                    Text("A scenario range, not a probability or a promised date.")
                        .adlerText(.callout)
                        .foregroundStyle(Color.ink)
                        .fixedSize(horizontal: false, vertical: true)

                    if let scenario = projection.projection {
                        VStack(alignment: .leading, spacing: Space.m) {
                            ForEach(scenario.assumptions) { assumption in
                                VStack(alignment: .leading, spacing: Space.xxs) {
                                    Text(assumption.label)
                                        .adlerText(.eyebrow)
                                        .foregroundStyle(Color.inkMuted)
                                    Text(assumption.text)
                                        .adlerText(.body)
                                        .foregroundStyle(Color.ink)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                            }
                        }
                    }

                    if let evidence = projection.evidence {
                        VStack(alignment: .leading, spacing: Space.s) {
                            Text("COMPARABLE EVIDENCE")
                                .adlerText(.eyebrow)
                                .foregroundStyle(Color.inkMuted)
                            Text(evidence.paceSource)
                                .adlerText(.subhead)
                                .foregroundStyle(Color.ink)
                            Text(
                                "\(GoalDetailPresentation.formatted(evidence.pace.low))–\(GoalDetailPresentation.formatted(evidence.pace.high)) \(evidence.unit) per day · expected \(GoalDetailPresentation.formatted(evidence.pace.expected))"
                            )
                            .adlerText(.footnote, numeric: true)
                            .foregroundStyle(Color.inkMuted)
                            Text("\(evidence.measured) of \(evidence.due) expected records measured")
                                .adlerText(.footnote, numeric: true)
                                .foregroundStyle(Color.inkMuted)
                            ForEach(Array(evidence.excludedPeriods.enumerated()), id: \.offset) {
                                _, period in
                                Text(
                                    "\(period.start.raw) – \(period.end.raw) · \(period.reason)"
                                )
                                .adlerText(.footnote, numeric: true)
                                .foregroundStyle(Color.inkMuted)
                                .fixedSize(horizontal: false, vertical: true)
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .adlerWell()
                    }

                    if let reason = projection.unavailableReason {
                        UnavailableReason(reason: reason)
                    }
                }
                .padding(AdlerLayout.screenMargin)
            }
            .background(Color.canvas)
            .navigationTitle(GoalCopy.assumptions)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) { Button("Close", action: onClose) }
            }
        }
    }
}
