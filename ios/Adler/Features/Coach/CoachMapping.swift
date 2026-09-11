import Foundation

// Core view models → design-system value types.
//
// The design system takes value types defined in its own folder and knows nothing about
// `Core/Models` (`DesignSystem/README.md`). This file is the one seam between them for the
// Coach tab. Every string it moves across is moved **verbatim**: nothing here re-words a
// server sentence, derives a label, or fills in a missing field.

// MARK: - Goals

nonisolated extension GoalRef {
    var display: DisplayGoal { DisplayGoal(id: id, title: title, hsl: color) }
}

// MARK: - Dates

nonisolated enum CoachDates {
    static func day(_ value: YMD?, in timeZone: TimeZone) -> Date? {
        value?.noon(in: timeZone)
    }

    /// `13 Oct`, through the app's single formatter.
    static func short(_ value: YMD?, in timeZone: TimeZone, today: Date = .now) -> String? {
        day(value, in: timeZone).map { AdlerDate.short($0, today: today, calendar: calendar(timeZone)) }
    }

    static func short(_ value: Timestamp?, in timeZone: TimeZone, today: Date = .now) -> String? {
        value?.date.map { AdlerDate.short($0, today: today, calendar: calendar(timeZone)) }
    }

    static func calendar(_ timeZone: TimeZone) -> Calendar {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = timeZone
        return calendar
    }
}

// MARK: - Messages

nonisolated extension MessageView {
    /// A bubble. Channel provenance is carried through so a reply that arrived by text is never
    /// presented as if it happened in the app.
    func bubble(links: [MessageLink] = []) -> ConversationMessage {
        ConversationMessage(
            id: id,
            role: role == .coach ? .coach : .user,
            text: text,
            timestamp: at?.date,
            channel: channel == .web ? nil : channel.rawValue,
            links: links)
    }

    /// `Open <goal> · Plan` / `· Progress` — the row titles under a bubble.
    func linkTitle(_ link: MessageGoalLink) -> String {
        let tab = switch link.tab {
        case .plan: CoachCopy.openPlan
        case .progress: CoachCopy.viewProgress
        case .unknown: CoachCopy.openPlan
        }
        return "\(tab) · \(link.goalTitle)"
    }
}

// MARK: - Recommendations

nonisolated extension RecommendationView {
    /// The method/principle chip under BEHAVIOURAL SCIENCE (`P2 · Choose when and where`).
    /// Only saved identifiers and saved method names are printed; nothing is looked up or
    /// invented. `methods` comes from the message's `decisionMethods` when there is one.
    func methodReference(methods: [DecisionMethod] = []) -> String? {
        let name = methods.first { $0.id == reasoning.methodId }?.name
        let parts = reasoning.principleIds + [name ?? reasoning.methodId]
        let joined = parts.filter { !$0.isEmpty }.joined(separator: " · ")
        return joined.isEmpty ? nil : joined
    }

    func content(
        goal: DisplayGoal,
        state: RecommendationState,
        stateLabel: String,
        methods: [DecisionMethod] = []
    ) -> RecommendationContent {
        RecommendationContent(
            goal: goal,
            action: action,
            observation: observation,
            interpretation: interpretation,
            methodReference: methodReference(methods: methods),
            expectedEffect: expectedEffect,
            limitation: reasoning.limitation,
            state: state,
            stateLabel: stateLabel)
    }
}

// MARK: - Evidence ("Why this?")

nonisolated enum EvidenceBuilder {
    /// Builds the disclosure from a saved rationale. Missing sections stay missing — the sheet
    /// renders only what the record contains.
    static func record(
        reasoning: BehavioralReasoning,
        grounding: [ClaimBindingView],
        sources: [ResearchSource],
        diagram: ReasoningDiagramContent?,
        review: ScientificReviewLine? = nil,
        revisions: [EvidenceVersionEntry] = [],
        corrections: [EvidenceVersionEntry] = [],
        timeZone: TimeZone
    ) -> EvidenceRecord {
        EvidenceRecord(
            mechanism: reasoning.mechanism,
            fit: reasoning.fit,
            diagram: diagram,
            prediction: reasoning.prediction,
            reviewRule: reasoning.reviewRule,
            claims: grounding.map { claim($0, timeZone: timeZone) },
            sources: sources.map { source($0, timeZone: timeZone) },
            alternatives: [],
            ruleExceptions: reasoning.ruleExceptions,
            limitation: reasoning.limitation,
            identifiers: identifiers(reasoning: reasoning, review: review),
            revisions: revisions,
            corrections: corrections)
    }

    static func claim(_ binding: ClaimBindingView, timeZone: TimeZone) -> EvidenceClaim {
        EvidenceClaim(
            id: "\(binding.claimId)@\(binding.version)",
            relation: EvidenceRelation(rawValue: binding.relation.rawValue) ?? .supports,
            label: binding.claim?.label ?? binding.claimId,
            statement: binding.claim?.statement ?? CoachCopy.evidenceClaimMissing,
            grade: binding.claim?.grade,
            version: binding.version,
            role: binding.claim.flatMap { EvidenceRole(rawValue: $0.role.rawValue) },
            application: binding.application,
            limitations: binding.claim?.limitations ?? [])
    }

    static func source(_ source: ResearchSource, timeZone: TimeZone) -> EvidenceSource {
        EvidenceSource(
            id: source.id,
            title: source.title,
            authors: source.authors.isEmpty ? nil : source.authors,
            year: Int(source.year),
            kind: source.kind.isEmpty ? nil : source.kind,
            access: source.access.isUnknown ? nil : source.access.rawValue,
            retrievedAt: source.retrievedAt.date,
            url: URL(string: source.url))
    }

    /// The `Versions and history` identifier rows. Saved identifiers, printed as saved.
    static func identifiers(reasoning: BehavioralReasoning, review: ScientificReviewLine?) -> [String] {
        var rows: [String] = []
        if !reasoning.principleIds.isEmpty {
            rows.append("Principles \(reasoning.principleIds.joined(separator: ", "))")
        }
        if !reasoning.methodId.isEmpty { rows.append("Method \(reasoning.methodId)") }
        if !reasoning.goalRoute.isUnknown { rows.append("Goal route \(reasoning.goalRoute.rawValue)") }
        if !reasoning.barrier.domain.isUnknown {
            rows.append(
                "Barrier \(reasoning.barrier.domain.rawValue) · \(reasoning.barrier.status.rawValue)")
        }
        if let review { rows.append(review.line) }
        return rows
    }
}

/// `Checked <at> · <provider> <model>` — the review provenance row, when the payload carries one.
nonisolated struct ScientificReviewLine: Equatable, Sendable {
    let line: String

    init?(at: Timestamp?, provider: String?, model: String?, timeZone: TimeZone) {
        guard let at, let provider, let model, !provider.isEmpty else { return nil }
        let date = CoachDates.short(at, in: timeZone) ?? at.raw
        line = CoachCopy.evidenceChecked(at: date, provider: provider, model: model)
    }
}

// MARK: - Learning rows

nonisolated extension LearningRow {
    func summaryRow(in timeZone: TimeZone, today: Date = .now) -> LearningSummaryRowContent? {
        let plannedStart = CoachDates.day(start, in: timeZone)
            ?? attempts.compactMap { CoachDates.day($0.date, in: timeZone) }.min()
        guard let plannedStart else { return nil }
        return LearningSummaryRowContent(
            goal: goals.first?.display
                ?? DisplayGoal(id: recordId, title: "", color: GoalColor.parse(nil)),
            change: change,
            workflowLabel: statusLabel,
            standingLabel: standingLabel,
            attemptsReported: reports,
            timeline: LearningTimelineLayout(
                plannedStart: plannedStart,
                attempts: attempts.compactMap { CoachDates.day($0.date, in: timeZone) },
                review: CoachDates.day(nextReviewAfter ?? reviewAfter, in: timeZone),
                today: today))
    }

    /// The four "needs your input" cases, in the order Insights sorts them.
    var attentionReason: CoachAttention? {
        if pendingVersion != nil { return .pendingRevision }
        if standing == .reconsider { return .reconsider }
        if state == .suggested { return .suggested }
        if controls.close, reviewIsDue { return .readyToReview }
        return nil
    }

    /// The server writes `Ready to review` into `statusLabel`; the client does not derive it.
    private var reviewIsDue: Bool { statusLabel == "Ready to review" }
}

nonisolated enum CoachAttention: Int, Comparable, Sendable, CaseIterable {
    case reconsider = 0
    case readyToReview = 1
    case pendingRevision = 2
    case suggested = 3

    static func < (lhs: CoachAttention, rhs: CoachAttention) -> Bool {
        lhs.rawValue < rhs.rawValue
    }
}

// MARK: - Proposals

nonisolated extension ProposalView {
    func content(state: ProposalState, in timeZone: TimeZone, today: Date = .now) -> ProposalContent {
        ProposalContent(
            goal: goalId.isEmpty
                ? nil
                : DisplayGoal(id: goalId, title: goalTitle, color: GoalColor.parse(nil)),
            title: headline.isEmpty ? summary : headline,
            comparisons: ProposalChangeMapping.rows(for: self, in: timeZone, today: today),
            affectedSummary: CoachCopy.affects(
                actions: affected.actions, planVersions: affected.planVersions),
            consequence: consequences.isEmpty
                ? CoachCopy.consequence
                : consequences.joined(separator: " "),
            bookingConsequence: booking.map { booking in
                CoachCopy.consequenceBooking(
                    time: bookingTime(booking, in: timeZone), calendar: booking.calendarName)
            },
            expiryNote: expired
                ? CoachCopy.expires(
                    AdlerDate.short(expiresAt, today: today, calendar: CoachDates.calendar(timeZone)))
                : nil,
            state: state)
    }

    private func bookingTime(_ booking: ProposalBooking, in timeZone: TimeZone) -> String {
        let calendar = CoachDates.calendar(timeZone)
        guard let start = booking.start.date else { return booking.start.raw }
        let day = AdlerDate.short(start, calendar: calendar)
        let from = AdlerDate.time(start, calendar: calendar)
        guard let end = booking.end.date else { return "\(day) \(from)" }
        return "\(day) \(from)–\(AdlerDate.time(end, calendar: calendar))"
    }

    /// The proposal's goal as a `DisplayGoal`, coloured from the coach view's goal list when
    /// that goal is in it.
    func displayGoal(from goals: [GoalRef]) -> DisplayGoal? {
        if let match = goals.first(where: { $0.id == goalId }) { return match.display }
        guard !goalId.isEmpty else { return nil }
        return DisplayGoal(id: goalId, title: goalTitle, color: GoalColor.parse(nil))
    }
}

// MARK: - Current → Suggested

/// Builds the `Current → Suggested` rows from the saved commands and the `before[]` records the
/// proposal carries, using the same record labels, field labels and value formatting as the web
/// (`src/ProposalChanges.tsx`, `shared/app-views.ts` `changeEntityLabels`) so the two surfaces
/// describe one change the same way.
nonisolated enum ProposalChangeMapping {
    static let recordLabels: [ChangeEntity: String] = [
        .goal: "Goal", .plan: "Plan", .milestone: "Milestone", .checkpoint: "Progress check",
        .action: "Action", .result: "Recorded result", .memory: "Saved information",
        .program: "Weekly plan", .review: "Review", .preferences: "Preferences",
        .workBlock: "Calendar", .conversation: "Chat",
    ]

    static let fieldLabels: [String: String] = [
        "targetDate": "Goal deadline", "dueDate": "Milestone date", "success": "A successful result",
        "why": "Why it matters", "criterion": "Finished when", "action": "Next action",
        "timing": "When to do it", "text": "Personal context", "approach": "Approach to try",
        "sprintResult": "Sprint result", "sprintStart": "Sprint starts", "sprintEnd": "Sprint ends",
        "weeklyMinutes": "Minutes per week", "sessionMinutes": "Minutes per session",
        "workStart": "Available from", "workEnd": "Available until", "workDays": "Available days",
        "reviewDay": "Weekly review day", "enabledMethods": "Coaching methods",
        "focusGoalId": "Focus goal", "calendarId": "Destination calendar",
        "conflictIds": "Calendars checked for conflicts", "checkIn": "Include a check-in",
        "start": "Starts", "end": "Ends", "baseline": "Starting score",
        "assessmentTarget": "Target score", "done": "Verified complete", "source": "Evidence",
        "value": "Result", "complete": "Finish this review",
    ]

    /// Fields that are plan machinery rather than something a person decides about; the web
    /// hides them too.
    private static let hiddenFields: Set<String> = ["reason", "basis", "adaptive"]

    static func label(_ key: String) -> String {
        if let known = fieldLabels[key] { return known }
        var out = ""
        for character in key {
            if character.isUppercase, !out.isEmpty { out.append(" ") }
            out.append(character)
        }
        return out
    }

    static func recordLabel(_ entity: ChangeEntity) -> String {
        recordLabels[entity] ?? entity.rawValue
    }

    static func rows(for proposal: ProposalView, in timeZone: TimeZone, today: Date = .now)
        -> [ChangeComparisonRow]
    {
        proposal.changes.enumerated().flatMap { index, change in
            rows(
                for: change,
                before: proposal.before?.indices.contains(index) == true
                    ? proposal.before?[index] : nil,
                index: index,
                in: timeZone,
                today: today)
        }
    }

    static func rows(
        for change: Change,
        before: JSONValue?,
        index: Int,
        in timeZone: TimeZone,
        today: Date = .now
    ) -> [ChangeComparisonRow] {
        let values = JSONValue.decoding(jsonString: change.values)?.objectValue ?? [:]
        let prior = before?.objectValue
        let prefix = recordLabel(change.entity)

        if change.operation == .delete {
            let name = prior?["title"]?.stringValue ?? prior?["text"]?.stringValue
                ?? prior?["action"]?.stringValue ?? change.id ?? prefix
            return [
                ChangeComparisonRow(
                    id: "\(index)-removed", field: prefix, current: name,
                    suggested: CoachCopy.compareRemoved, removed: true)
            ]
        }

        let keys = values.keys.filter { !hiddenFields.contains($0) }.sorted()
        let rows: [ChangeComparisonRow] = keys.compactMap { key in
            let suggested = format(values[key] ?? .null, field: key, in: timeZone, today: today)
            let currentValue = prior?[key]
            // An update that sets a field to what it already holds is still shown, as
            // `(no change)`, so the scope of acceptance stays legible (DESIGN.md §4.4).
            let unchanged = change.operation == .update && currentValue == values[key]
            let current: String? =
                if unchanged {
                    CoachCopy.compareNoChange
                } else if prior == nil {
                    CoachCopy.compareNotAdded
                } else if currentValue == nil || currentValue?.isNull == true {
                    CoachCopy.compareNotSet
                } else {
                    format(currentValue ?? .null, field: key, in: timeZone, today: today)
                }
            return ChangeComparisonRow(
                id: "\(index)-\(key)",
                field: "\(prefix) · \(label(key))",
                current: current,
                suggested: suggested)
        }
        if rows.isEmpty {
            return [
                ChangeComparisonRow(
                    id: "\(index)-record", field: prefix,
                    current: prior == nil ? CoachCopy.compareNotAdded : CoachCopy.compareNoChange,
                    suggested: change.reason ?? CoachCopy.compareSuggested)
            ]
        }
        return rows
    }

    /// Mirrors `src/ProposalChanges.tsx` `<Value>`: dates read as dates, booleans as Yes/No,
    /// `null` as `Not known yet` — never as a blank or a zero.
    static func format(_ value: JSONValue, field: String?, in timeZone: TimeZone, today: Date = .now)
        -> String
    {
        switch value {
        case .null:
            return "Not known yet"
        case .bool(let flag):
            return flag ? "Yes" : "No"
        case .number(let number):
            return number == number.rounded() && abs(number) < 1e15
                ? String(Int64(number)) : String(number)
        case .string(let text):
            let dayFields: Set<String> = ["targetDate", "dueDate", "date", "sprintStart", "sprintEnd"]
            if let field, dayFields.contains(field), isDay(text) {
                return CoachDates.short(YMD(text), in: timeZone, today: today) ?? text
            }
            if field == "start" || field == "end", let instant = Timestamp(text).date {
                let calendar = CoachDates.calendar(timeZone)
                return
                    "\(AdlerDate.short(instant, today: today, calendar: calendar)) \(AdlerDate.time(instant, calendar: calendar))"
            }
            return text
        case .array(let values):
            return values.map { format($0, field: nil, in: timeZone, today: today) }
                .joined(separator: " · ")
        case .object(let fields):
            return fields.keys.sorted()
                .map { "\(label($0)): \(format(fields[$0] ?? .null, field: $0, in: timeZone, today: today))" }
                .joined(separator: " · ")
        }
    }

    private static func isDay(_ text: String) -> Bool {
        YMD(text).dateComponents != nil
    }
}
