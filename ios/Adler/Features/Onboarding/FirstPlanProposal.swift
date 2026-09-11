import Foundation

/// Turns the server's `ProposalView` into the design system's `ProposalContent`.
///
/// The Coach agent will own the general version of this (Core's notes §7 leave the choice of
/// decoding `changes`/`before` versus calling `POST /api/proposals/:id/preview` to them). This
/// one is deliberately small: the first plan a person ever sees is nearly all **creates**, so the
/// honest left-hand column is `Not added yet`, not `(no change)`.
///
/// Nothing is summarised in the app's own words: every value printed comes out of the saved
/// change, and the consequences come from `proposal.consequences`.
nonisolated enum FirstPlanProposal {
    /// COPY.md §14 "Change record labels".
    static func label(for entity: ChangeEntity) -> String {
        switch entity {
        case .goal: "Goal"
        case .plan: "Plan"
        case .milestone: "Milestone"
        case .checkpoint: "Progress check"
        case .action: "Action"
        case .result: "Recorded result"
        case .memory: "Saved information"
        case .program: "Weekly plan"
        case .review: "Review"
        case .preferences: "Preferences"
        case .workBlock: "Calendar"
        case .conversation: "Chat"
        case .unknown: "Change"
        }
    }

    /// At most this many `Current → Suggested` rows on the card; the rest are in `Review changes`.
    static let visibleComparisonLimit = 6

    /// The readable one-liner for a change's `values` (or its `before` snapshot).
    ///
    /// Keys are tried in the order a person would read them, and the detail suffix only appears
    /// when the record actually carries it — a missing time or date prints nothing rather than a
    /// placeholder.
    static func line(from value: JSONValue?) -> String? {
        guard let value, let fields = value.objectValue, !fields.isEmpty else { return nil }
        let headKeys = ["title", "label", "name", "text", "summary", "success", "change", "insight"]
        var head = headKeys.compactMap { fields[$0]?.stringValue }.first { !$0.isEmpty }
        if head == nil, let outcome = fields["outcome"]?.stringValue { head = outcome }
        if head == nil, let status = fields["status"]?.stringValue { head = status }

        var details: [String] = []
        for key in ["criterion", "timing"] {
            if let text = fields[key]?.stringValue, !text.isEmpty { details.append(text) }
        }
        for key in ["date", "dueDate", "targetDate", "start"] {
            if let text = fields[key]?.stringValue, !text.isEmpty { details.append(text) }
        }
        if let amount = fields["amount"]?.doubleValue {
            let unit = fields["unit"]?.stringValue
            details.append(unit.map { "\(number(amount)) \($0)" } ?? number(amount))
        } else if let target = fields["target"]?.doubleValue {
            let unit = fields["unit"]?.stringValue
            details.append(unit.map { "\(number(target)) \($0)" } ?? number(target))
        }
        if let minutes = fields["durationMinutes"]?.intValue {
            details.append("\(minutes) min")
        }

        if head == nil && details.isEmpty { return nil }
        let detail = details.prefix(2).joined(separator: " · ")
        switch (head, detail.isEmpty) {
        case (let head?, true): return head
        case (let head?, false): return "\(head) · \(detail)"
        case (nil, false): return detail
        default: return nil
        }
    }

    private static func number(_ value: Double) -> String {
        value == value.rounded() ? String(Int(value)) : String(value)
    }

    static func comparisons(for proposal: ProposalView) -> [ChangeComparisonRow] {
        proposal.changes.enumerated().map { index, change in
            let before = proposal.before.flatMap { $0.indices.contains(index) ? $0[index] : nil }
            let beforeLine = line(from: before)
            let afterLine = line(from: change.decodedValues)
            switch change.operation {
            case .create:
                return ChangeComparisonRow(
                    id: "\(index)", field: label(for: change.entity),
                    // COPY.md `compare.notAdded` — the record does not exist yet, which is not
                    // the same as "unchanged".
                    current: "Not added yet",
                    suggested: afterLine ?? change.reason ?? proposal.summary)
            case .delete:
                return ChangeComparisonRow(
                    id: "\(index)", field: label(for: change.entity),
                    current: beforeLine ?? "Not set",
                    suggested: "Removed from your workspace", removed: true)
            case .update, .unknown:
                return ChangeComparisonRow(
                    id: "\(index)", field: label(for: change.entity),
                    current: beforeLine ?? "Not set",
                    // `nil` renders `(no change)`, which is the truth when the change set
                    // carries no readable value for this record.
                    suggested: afterLine)
            }
        }
    }

    static func affectedSummary(for proposal: ProposalView, shown: Int) -> String {
        let plans = proposal.affected.planVersions
        var text = "Affects \(proposal.affected.actions) action\(proposal.affected.actions == 1 ? "" : "s")"
        if proposal.affected.milestones > 0 {
            text += " · \(proposal.affected.milestones) milestone\(proposal.affected.milestones == 1 ? "" : "s")"
        }
        text += " · \(plans) plan version\(plans == 1 ? "" : "s")"
        if shown < proposal.changes.count {
            text += " · showing \(shown) of \(proposal.changes.count) changes"
        }
        return text
    }

    static func content(
        for proposal: ProposalView, goalColor: String?, today: Date = .now,
        timeZone: TimeZone = .current
    ) -> ProposalContent {
        let allRows = comparisons(for: proposal)
        let rows = Array(allRows.prefix(visibleComparisonLimit))
        let goal = proposal.goalTitle.isEmpty
            ? nil
            : DisplayGoal(id: proposal.goalId, title: proposal.goalTitle, hsl: goalColor ?? "")
        // The server's consequences, verbatim, when it saved any; otherwise the sentence
        // DESIGN.md §4.4 requires to be visible on every proposal.
        let consequence = proposal.consequences.isEmpty
            ? "Accepting this saves the plan. It does not book anything."
            : proposal.consequences.joined(separator: "\n")
        var calendar = Calendar.current
        calendar.timeZone = timeZone
        var booking: String?
        if let saved = proposal.booking {
            // COPY.md `proposal.consequenceBooking`. The time comes from the saved booking, so a
            // proposal that books nothing can never grow this sentence.
            let when = saved.start.date.map {
                "\(AdlerDate.short($0, today: today, calendar: calendar)) at \(AdlerDate.time($0, calendar: calendar))"
            }
            booking = when.map { "Accepting this also books \($0) in \(saved.calendarName)." }
                ?? "Accepting this also books time in \(saved.calendarName)."
        }
        let expiry = "Expires \(AdlerDate.short(proposal.expiresAt, today: today, calendar: calendar)). "
            + "If your workspace has changed, Adler will need to make an updated proposal."

        return ProposalContent(
            goal: goal,
            title: proposal.headline.isEmpty ? proposal.summary : proposal.headline,
            comparisons: rows,
            affectedSummary: affectedSummary(for: proposal, shown: rows.count),
            consequence: consequence,
            bookingConsequence: booking,
            expiryNote: proposal.expired ? nil : expiry,
            state: proposal.status == .applied ? .approved(at: today) : .pending)
    }
}
