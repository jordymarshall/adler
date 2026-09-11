import Foundation

/// Goal detail's half of the mapping (see `Features/Goals/GoalPresentation.swift`).
/// Every sentence here comes out of the payload; nothing is composed on the device.
nonisolated enum GoalDetailPresentation {

    // MARK: - Header

    /// `Target · 10 Nov`, the saved deadline flexibility, and the status — each only when the
    /// record actually carries it.
    static func targetLine(_ detail: GoalDetailView, timeZone: TimeZone) -> String? {
        var parts: [String] = []
        if let target = detail.target, let unit = detail.unit {
            parts.append("\(formatted(target)) \(unit)")
        }
        if let day = detail.targetDate, let date = GoalPresentation.date(day, in: timeZone) {
            parts.append(GoalCopy.targetDate(AdlerDate.short(date)))
        }
        switch detail.deadline {
        case .firm: parts.append(GoalCopy.deadlineFirm)
        case .preferred: parts.append(GoalCopy.flexible)
        case .none, .unknown: if detail.targetDate == nil { parts.append(GoalCopy.noDeadline) }
        }
        return parts.isEmpty ? nil : parts.joined(separator: " · ")
    }

    static func resultLine(_ detail: GoalDetailView, timeZone: TimeZone) -> String {
        var line = detail.resultLabel
        if let day = detail.progress.observedAt, let date = GoalPresentation.date(day, in: timeZone)
        {
            line += " · Reported \(AdlerDate.short(date))"
        }
        return line
    }

    // MARK: - Milestone rail

    /// The saved markers: milestones, dated checkpoints and the plan review
    /// (`executionSummary.markers`). Only a milestone scopes the canvas below.
    static func markers(_ detail: GoalDetailView, timeZone: TimeZone) -> [MilestoneMarker] {
        detail.execution.markers.map { marker in
            let kind: MilestoneMarker.Kind
            switch marker.kind.lowercased() {
            case "milestone": kind = .milestone
            case "review": kind = .review
            default: kind = .checkpoint
            }
            let state: MilestoneMarker.State =
                kind == .review ? .review : (marker.done ? .verified : .open)
            return MilestoneMarker(
                id: marker.id,
                kind: kind,
                title: marker.label,
                due: marker.date.flatMap { GoalPresentation.date($0, in: timeZone) },
                state: state,
                criterion: marker.detail.isEmpty ? nil : marker.detail)
        }
    }

    /// `2 verified · 3 open · 1 review` — counts of what the rail is showing.
    static func markerCounts(_ markers: [MilestoneMarker]) -> String {
        let verified = markers.count { $0.state == .verified }
        let open = markers.count { $0.state == .open }
        let reviews = markers.count { $0.kind == .review }
        var parts = ["\(verified) verified", "\(open) open"]
        if reviews > 0 { parts.append("\(reviews) due for review") }
        return parts.joined(separator: " · ")
    }

    // MARK: - Actions

    static func actionCard(_ action: ActionView, goal: GoalRef, timeZone: TimeZone)
        -> ActionCardModel
    {
        ActionCardModel(
            goal: GoalPresentation.displayGoal(goal),
            title: action.title,
            criterion: action.criterion.isEmpty ? nil : action.criterion,
            timing: action.timing.isEmpty ? nil : action.timing,
            cue: action.date.flatMap { GoalPresentation.date($0, in: timeZone) }
                .map { AdlerDate.short($0) },
            state: actionState(action, goalStatus: goal.status, timeZone: timeZone))
    }

    static func actionState(_ action: ActionView, goalStatus: GoalStatus, timeZone: TimeZone)
        -> ActionCardState
    {
        if action.retiredAt != nil { return .retired }
        if let outcome = action.outcome {
            return .reported(receipt: receiptLine(outcome: outcome, action: action))
        }
        if goalStatus == .draft { return .draftGoal }
        if let started = action.startedAt?.date { return .started(at: started) }
        if let block = action.block, let start = block.start.date { return .scheduled(at: start) }
        return .planned
    }

    /// `Done · 1 section · 25 min`. A missing amount says so; it is never shown as `0`.
    static func receiptLine(outcome: Outcome, action: ActionView) -> String {
        var parts = [outcome.rawValue]
        if let amount = action.amount {
            parts.append("\(formatted(amount)) \(action.measure.unit)")
        } else {
            parts.append("amount not reported")
        }
        if let minutes = action.actualMinutes { parts.append("\(formatted(minutes)) min") }
        return parts.joined(separator: " · ")
    }

    /// The action the canvas opens on: today's, else the next one still to report, else the
    /// most recent dated one.
    static func defaultAction(_ actions: [ActionView], today: YMD) -> ActionView? {
        let dated = actions.filter { $0.date != nil }
        if let todays = dated.first(where: { $0.date == today && $0.outcome == nil }) {
            return todays
        }
        if let next = dated
            .filter({ $0.outcome == nil && ($0.date ?? today) >= today })
            .min(by: { ($0.date?.raw ?? "") < ($1.date?.raw ?? "") })
        {
            return next
        }
        if let latest = dated.max(by: { ($0.date?.raw ?? "") < ($1.date?.raw ?? "") }) {
            return latest
        }
        return actions.first
    }

    /// What to send as `?plan=` when a version is chosen: `nil` for the current plan, so the
    /// canvas goes back to live editing rather than staying pinned to a version number.
    static func planQuery(version: Int, plans: [PlanView]) -> Int? {
        let current = plans.first { $0.current }?.version ?? plans.last?.version
        return version == current ? nil : version
    }

    /// True when the payload is scoped to a plan version that is not the current one — the
    /// canvas is then read only.
    static func isEarlierPlan(_ detail: GoalDetailView) -> Bool {
        guard let current = detail.currentPlan?.version else { return false }
        return detail.selectedPlanVersion != current
    }

    /// What a saved report carries. `Didn’t happen` records a measured zero because the work
    /// did not occur; every other blank stays unknown and is omitted from the payload
    /// (FLOWS.md §2).
    static func reportValues(_ draft: ReportDraft)
        -> (outcome: Outcome, amount: Double?, minutes: Double?)?
    {
        guard let chosen = draft.outcome else { return nil }
        let outcome: Outcome =
            switch chosen {
            case .done: .done
            case .partly: .partly
            case .missed: .didntHappen
            }
        let didNotHappen = outcome == .didntHappen
        return (
            outcome,
            draft.amount ?? (didNotHappen ? 0 : nil),
            draft.minutes.map(Double.init) ?? (didNotHappen ? 0 : nil)
        )
    }

    // MARK: - Outcome chart

    static func outcomeContent(_ detail: GoalDetailView, timeZone: TimeZone) -> OutcomeChartContent?
    {
        let projection = detail.projection
        guard let today = GoalPresentation.date(detail.today, in: timeZone) else { return nil }

        let observed = projection.observations.compactMap { result -> OutcomePoint? in
            guard result.date <= detail.today,
                let date = GoalPresentation.date(result.date, in: timeZone)
            else { return nil }
            return OutcomePoint(date: date, value: result.value)
        }
        let checkpoints = detail.checkpoints.compactMap { point -> OutcomePoint? in
            guard let date = GoalPresentation.date(point.date, in: timeZone) else { return nil }
            return OutcomePoint(date: date, value: point.value)
        }

        var content = OutcomeChartContent(
            observed: observed,
            checkpoints: checkpoints,
            target: detail.target ?? projection.target,
            unit: detail.unit ?? "",
            measure: projection.trackingLabel,
            today: today)
        content.startsFromBaseline = detail.checkpoints.first?.label == "Starting point"
        if detail.progress.needsUpdate, let day = detail.progress.observedAt,
            let date = GoalPresentation.date(day, in: timeZone)
        {
            content.staleNote = "Last report \(AdlerDate.short(date))"
        }
        content.projection = projectionContent(projection, timeZone: timeZone)
        if content.projection == nil { content.unavailableReason = projection.unavailableReason }
        return content
    }

    /// A conditional scenario, drawn only when the server produced one. `nil` means the caller
    /// prints `unavailableReason` instead — never an empty forecast panel.
    static func projectionContent(_ view: ProjectionView, timeZone: TimeZone) -> ProjectionContent?
    {
        guard let scenario = view.projection else { return nil }
        let line = scenario.points.compactMap { point -> OutcomePoint? in
            guard let date = GoalPresentation.date(point.date, in: timeZone) else { return nil }
            return OutcomePoint(date: date, value: point.expected)
        }
        let band = scenario.points.compactMap { point -> ProjectionBandPoint? in
            guard let date = GoalPresentation.date(point.date, in: timeZone) else { return nil }
            return ProjectionBandPoint(date: date, lower: point.low, upper: point.high)
        }
        var ifLabel = "If your reported pace continues"
        if let expected = scenario.expectedDate,
            let date = GoalPresentation.date(expected, in: timeZone)
        {
            ifLabel += " · \(AdlerDate.short(date))"
        }
        return ProjectionContent(
            line: line,
            band: band,
            ifLabel: ifLabel,
            rangeLabel: rangeLabel(scenario, timeZone: timeZone))
    }

    /// `Scenario range · 19 Nov – beyond this horizon`. "Beyond this horizon" is the server's
    /// own phrase for a scenario that does not reach the target inside the saved horizon.
    static func rangeLabel(_ scenario: ProjectionScenario, timeZone: TimeZone) -> String? {
        let earliest = scenario.earliestDate.flatMap { GoalPresentation.date($0, in: timeZone) }
            .map { AdlerDate.short($0) }
        let latest = scenario.latestDate.flatMap { GoalPresentation.date($0, in: timeZone) }
            .map { AdlerDate.short($0) }
        switch (earliest, latest) {
        case (let .some(from), let .some(to)): return "Scenario range · \(from) – \(to)"
        case (let .some(from), nil): return "Scenario range · \(from) – beyond this horizon"
        case (nil, let .some(to)): return "Scenario range · up to \(to)"
        case (nil, nil): return nil
        }
    }

    // MARK: - Plan rationale

    /// Builds the "Why this plan?" record out of what is saved: the behavioural reasoning, the
    /// resolved claims with their relations and grades, the sources and the planning basis.
    /// Missing parts are left out rather than filled in.
    static func evidenceRecord(_ rationale: RationaleView, timeZone: TimeZone) -> EvidenceRecord? {
        let reasoning = rationale.reasoning
        let basis = rationale.basis
        guard reasoning != nil || basis != nil || !rationale.grounding.isEmpty
                || !rationale.sources.isEmpty
        else { return nil }

        var record = EvidenceRecord()
        record.mechanism = reasoning?.mechanism ?? basis?.strategy
        record.fit = reasoning?.fit ?? basis?.interpretation
        record.prediction = reasoning?.prediction ?? basis?.outcomeRationale
        record.reviewRule = reasoning?.reviewRule ?? basis.map { reviewSentence($0) }
        record.claims = rationale.grounding.map(claim)
        record.sources = rationale.sources.map(source)
        record.alternatives = (basis?.alternatives ?? []).enumerated().map { index, alternative in
            EvidenceAlternative(
                id: "alternative-\(index)", option: alternative.option,
                tradeoff: alternative.tradeoff)
        }
        record.ruleExceptions = (reasoning?.ruleExceptions ?? []) + (basis?.assumptions ?? [])
        record.limitation = reasoning?.limitation ?? basis?.uncertainty
        record.identifiers = identifiers(rationale, timeZone: timeZone)
        return record
    }

    private static func reviewSentence(_ basis: PlanningBasis) -> String {
        "\(basis.review.question) \(basis.review.adaptation)"
    }

    private static func claim(_ binding: ClaimBindingView) -> EvidenceClaim {
        guard let claim = binding.claim else {
            return EvidenceClaim(
                id: binding.claimId,
                relation: relation(binding.relation),
                label: binding.claimId,
                statement:
                    "This earlier claim version is unavailable here. The saved explanation remains historical.",
                version: binding.version,
                application: binding.application)
        }
        return EvidenceClaim(
            id: "\(claim.id)@\(claim.version)",
            relation: relation(binding.relation),
            label: claim.label ?? claim.construct,
            statement: claim.statement,
            grade: claim.grade,
            version: claim.version,
            role: role(claim.role),
            application: binding.application,
            limitations: claim.limitations)
    }

    private static func source(_ source: ResearchSource) -> EvidenceSource {
        EvidenceSource(
            id: source.id,
            title: source.title,
            authors: source.authors.isEmpty ? nil : source.authors,
            year: Int(source.year),
            kind: source.kind.isEmpty ? nil : source.kind,
            access: source.access.rawValue,
            retrievedAt: source.retrievedAt.date,
            url: URL(string: source.url))
    }

    private static func identifiers(_ rationale: RationaleView, timeZone: TimeZone) -> [String] {
        var lines = ["Plan v\(rationale.planVersion)"]
        if let reasoning = rationale.reasoning {
            if !reasoning.principleIds.isEmpty {
                lines.append("Principles · \(reasoning.principleIds.joined(separator: ", "))")
            }
            if !reasoning.methodId.isEmpty { lines.append("Method · \(reasoning.methodId)") }
            lines.append("Goal route · \(reasoning.goalRoute.rawValue)")
            if !reasoning.barrier.explanation.isEmpty {
                lines.append(
                    "Barrier · \(reasoning.barrier.domain.rawValue) · \(reasoning.barrier.status.rawValue) · \(reasoning.barrier.explanation)"
                )
            }
        }
        if let basis = rationale.basis {
            if let measure = basis.actionMeasure {
                lines.append("Action measure · \(measure.label) (\(measure.unit)) · \(measure.rationale)")
            }
            for evidence in basis.evidence {
                lines.append("Finding · \(evidence.finding) · Limits · \(evidence.limitation)")
            }
            if let date = GoalPresentation.date(basis.review.date, in: timeZone) {
                lines.append("Check the approach · \(AdlerDate.short(date))")
            }
        }
        if let question = rationale.assessmentQuestion { lines.append("Review question · \(question)") }
        if let window = rationale.windowRationale { lines.append("Window · \(window)") }
        return lines
    }

    private static func relation(_ value: ClaimRelation) -> EvidenceRelation {
        EvidenceRelation(rawValue: value.rawValue) ?? .supports
    }

    private static func role(_ value: ClaimRole) -> EvidenceRole? {
        EvidenceRole(rawValue: value.rawValue)
    }

    // MARK: - Numbers

    static func formatted(_ value: Double) -> String {
        value.rounded() == value ? String(Int(value)) : String(format: "%.1f", value)
    }
}
