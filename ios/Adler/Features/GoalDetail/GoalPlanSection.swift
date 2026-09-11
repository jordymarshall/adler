import SwiftUI

/// `PLAN` — which saved version is showing, the reason behind it, and the goal's learning
/// journey: plan versions, tests, reviews and coach decisions in date order.
struct GoalPlanSection: View {
    let detail: GoalDetailView
    let timeZone: TimeZone
    let selectedVersion: Int
    var onSelectVersion: (Int) -> Void
    var onWhyThisPlan: () -> Void
    var onOpenRecord: (String) -> Void
    var onOpenDecision: () -> Void

    private var plan: PlanView? { detail.plans.first { $0.version == selectedVersion } }
    private var isEarlier: Bool { plan?.current == false }

    var body: some View {
        VStack(alignment: .leading, spacing: Space.m) {
            header

            if let plan {
                VStack(alignment: .leading, spacing: Space.xs) {
                    if let approach = plan.approach, !approach.isEmpty {
                        Text(approach)
                            .adlerText(.callout)
                            .foregroundStyle(Color.ink)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    if !plan.action.isEmpty {
                        Text("\(plan.action) · \(plan.criterion)")
                            .adlerText(.subhead)
                            .foregroundStyle(Color.inkMuted)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    if let window = plan.window {
                        Text(windowLine(window))
                            .adlerText(.footnote, numeric: true)
                            .foregroundStyle(Color.inkMuted)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    if let reason = plan.projectionUnavailableReason, plan.projection == nil {
                        Text(reason)
                            .adlerText(.footnote)
                            .foregroundStyle(Color.inkMuted)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
            }

            if let experiment = detail.experiment {
                Button {
                    onOpenRecord(experiment.recordId)
                } label: {
                    HStack(spacing: Space.s) {
                        WorkflowChip(label: experiment.statusLabel)
                        Text(experiment.current ? "The test bound to this plan" : "An earlier test")
                            .adlerText(.footnote)
                            .foregroundStyle(Color.inkMuted)
                        Spacer(minLength: 0)
                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .foregroundStyle(Color.inkMuted)
                    }
                }
                .buttonStyle(.plain)
                .frame(minHeight: AdlerLayout.minimumHitTarget)
            }

            journey
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(AdlerLayout.cardPadding)
        .adlerCard()
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: Space.xs) {
            HStack(alignment: .firstTextBaseline, spacing: Space.s) {
                Text(GoalCopy.planVersion(selectedVersion))
                    .adlerText(.eyebrow, numeric: true)
                    .foregroundStyle(Color.inkMuted)
                    .accessibilityAddTraits(.isHeader)
                if detail.plans.count > 1 {
                    Menu {
                        ForEach(detail.plans.reversed()) { plan in
                            Button {
                                onSelectVersion(plan.version)
                            } label: {
                                Label(
                                    versionLabel(plan),
                                    systemImage: plan.version == selectedVersion
                                        ? "checkmark" : "clock.arrow.circlepath")
                            }
                        }
                    } label: {
                        Label("Plan versions", systemImage: "clock.arrow.circlepath")
                            .labelStyle(.iconOnly)
                            .foregroundStyle(Color.accentInk)
                    }
                    .accessibilityLabel("Choose a plan version")
                }
                Spacer(minLength: Space.s)
                Button(GoalCopy.whyThisPlan, action: onWhyThisPlan)
                    .adlerText(.subhead)
                    .foregroundStyle(Color.accentInk)
                    .buttonStyle(.plain)
                    .frame(minHeight: AdlerLayout.minimumHitTarget)
            }
            if isEarlier {
                Text("\(GoalCopy.earlierPlan) · read only")
                    .adlerText(.caption)
                    .foregroundStyle(Color.warning)
            }
        }
    }

    // MARK: - Learning journey

    private var journey: some View {
        VStack(alignment: .leading, spacing: Space.s) {
            Text(GoalCopy.learningHistory.uppercased())
                .adlerText(.eyebrow)
                .foregroundStyle(Color.inkMuted)
                .accessibilityAddTraits(.isHeader)

            if detail.journey.isEmpty {
                Text(GoalCopy.learningEmpty)
                    .adlerText(.footnote)
                    .foregroundStyle(Color.inkMuted)
            } else {
                ForEach(detail.journey.reversed()) { entry in
                    journeyRow(entry)
                }
            }

            if let next = detail.nextReviewAt, let day = next.day(in: timeZone),
                let date = GoalPresentation.date(day, in: timeZone)
            {
                Text("Next review · \(AdlerDate.short(date))")
                    .adlerText(.footnote, numeric: true)
                    .foregroundStyle(Color.inkMuted)
            }
        }
    }

    @ViewBuilder
    private func journeyRow(_ entry: JourneyEntry) -> some View {
        let opens = entry.recordId != nil || entry.decisionId != nil
        Button {
            if let recordId = entry.recordId {
                onOpenRecord(recordId)
            } else if entry.decisionId != nil {
                onOpenDecision()
            }
        } label: {
            HStack(alignment: .top, spacing: Space.s) {
                Image(systemName: symbol(entry.kind))
                    .font(.caption)
                    .foregroundStyle(Color.inkMuted)
                    .frame(width: 16)
                    .accessibilityHidden(true)
                VStack(alignment: .leading, spacing: Space.xxs) {
                    Text(dateLabel(entry))
                        .adlerText(.caption, numeric: true)
                        .foregroundStyle(Color.inkMuted)
                    Text(entry.title)
                        .adlerText(.subhead)
                        .foregroundStyle(Color.ink)
                        .fixedSize(horizontal: false, vertical: true)
                    if let detail = entry.detail, !detail.isEmpty {
                        Text(detail)
                            .adlerText(.footnote)
                            .foregroundStyle(Color.inkMuted)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
                Spacer(minLength: 0)
                if opens {
                    Image(systemName: "chevron.right")
                        .font(.caption)
                        .foregroundStyle(Color.inkMuted)
                        .accessibilityHidden(true)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .contentShape(.rect)
        }
        .buttonStyle(.plain)
        .disabled(!opens)
        .accessibilityElement(children: .combine)
    }

    private func dateLabel(_ entry: JourneyEntry) -> String {
        let date = GoalPresentation.date(entry.at, in: timeZone).map { AdlerDate.short($0) }
        return [date, entry.label].compactMap { $0 }.joined(separator: " · ")
    }

    private func symbol(_ kind: JourneyEntryKind) -> String {
        switch kind {
        case .plan: "doc.text"
        case .learningVersion: "flask"
        case .learningReview: "checkmark.bubble"
        case .decision, .unknown: "bubble.left"
        }
    }

    private func versionLabel(_ plan: PlanView) -> String {
        let date = GoalPresentation.date(plan.date, in: timeZone).map { AdlerDate.short($0) } ?? ""
        return "v\(plan.version) · \(date)\(plan.current ? " · current" : "")"
    }

    private func windowLine(_ window: PlanWindowView) -> String {
        let start = GoalPresentation.date(window.start, in: timeZone).map { AdlerDate.short($0) }
        let end = GoalPresentation.date(window.end, in: timeZone).map { AdlerDate.short($0) }
        var line = window.label
        if let start, let end { line += " · \(start) – \(end)" }
        if !window.rationale.isEmpty { line += " · \(window.rationale)" }
        return line
    }
}
