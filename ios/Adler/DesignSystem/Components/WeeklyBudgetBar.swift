import SwiftUI

/// The All Goals header: how much of this week's saved budget the plan uses
/// (DESIGN.md §4.13).
///
/// Rules encoded here: the segments come from the same tentative-schedule
/// figures as capacity validation, unplaced work is shown as a distinct
/// hatched segment rather than hidden, and going over budget is stated in
/// words as well as shape.
struct WeeklyBudgetBar: View {
    let budget: WeeklyBudget
    var onOpenCalendar: (() -> Void)?

    var body: some View {
        VStack(alignment: .leading, spacing: Space.s) {
            Text("This week")
                .adlerText(.eyebrow)
                .foregroundStyle(Color.inkMuted)

            GeometryReader { proxy in
                let scale = proxy.size.width / CGFloat(budget.scaleMinutes)
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.surfaceSunken)
                    HStack(spacing: 0) {
                        ForEach(budget.segments) { segment in
                            Rectangle()
                                .fill(segment.goal.color.color)
                                .frame(width: max(0, CGFloat(segment.minutes) * scale))
                        }
                        if budget.unplacedMinutes > 0 {
                            HatchedFill()
                                .frame(width: max(0, CGFloat(budget.unplacedMinutes) * scale))
                        }
                        Spacer(minLength: 0)
                    }
                    .clipShape(.capsule)
                    Rectangle()
                        .fill(Color.accentInk)
                        .frame(width: 1)
                        .offset(x: CGFloat(budget.budgetMinutes) * scale)
                }
            }
            .frame(height: 14)

            Text(budget.plannedText)
                .adlerText(.footnote, numeric: true)
                .foregroundStyle(Color.ink)

            if budget.isOverBudget {
                Text(budget.overText)
                    .adlerText(.footnote, numeric: true)
                    .foregroundStyle(Color.warning)
                    .fixedSize(horizontal: false, vertical: true)
            }

            // Where the figures came from. Without it the bar and the server's own
            // capacity validation can disagree with nothing on screen saying which
            // number is authoritative.
            if let sourceNote = budget.sourceNote, !sourceNote.isEmpty {
                Text(sourceNote)
                    .adlerText(.caption, numeric: true)
                    .foregroundStyle(Color.inkMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }

            FlowLayout(spacing: Space.m, lineSpacing: Space.xs) {
                ForEach(budget.segments) { segment in
                    HStack(spacing: Space.xs) {
                        Circle().fill(segment.goal.color.color).frame(width: 8, height: 8)
                        // Minutes in the legend, not colour alone: the segments are
                        // otherwise distinguished only by goal colour.
                        Text("\(segment.goal.title) · \(WeeklyBudget.duration(segment.minutes))")
                            .adlerText(.caption, numeric: true)
                            .foregroundStyle(Color.inkMuted)
                    }
                }
                if budget.unplacedMinutes > 0 {
                    HStack(spacing: Space.xs) {
                        HatchedFill().frame(width: 10, height: 8).clipShape(.rect(cornerRadius: 2))
                        Text("Unplaced")
                            .adlerText(.caption)
                            .foregroundStyle(Color.inkMuted)
                    }
                }
            }
        }
        .padding(AdlerLayout.cardPadding)
        .adlerCard()
        .contentShape(.rect)
        .onTapGesture { onOpenCalendar?() }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(budget.accessibilityLabel)
        .accessibilityAddTraits(onOpenCalendar == nil ? [] : .isButton)
        .accessibilityAction { onOpenCalendar?() }
    }
}

private struct HatchedFill: View {
    var body: some View {
        Rectangle()
            .fill(Color.surfaceSunken)
            .overlay { Hatch().stroke(Color.inkMuted.opacity(0.6), lineWidth: 1) }
    }
}

private struct Hatch: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        var x = rect.minX - rect.height
        while x < rect.maxX {
            path.move(to: CGPoint(x: x, y: rect.maxY))
            path.addLine(to: CGPoint(x: x + rect.height, y: rect.minY))
            x += 5
        }
        return path
    }
}

// MARK: - Value types

nonisolated struct BudgetSegment: Identifiable, Equatable, Sendable {
    let id: String
    let goal: DisplayGoal
    let minutes: Int
}

nonisolated struct WeeklyBudget: Equatable, Sendable {
    let segments: [BudgetSegment]
    /// Work with no room this week. Shown, never silently dropped.
    var unplacedMinutes: Int = 0
    /// The person's saved weekly budget.
    let budgetMinutes: Int
    /// The server's `totalMinutes`, `overMinutes` and `scaleMinutes`, taken verbatim when
    /// supplied. Recomputing them client-side lets the bar disagree with the same capacity
    /// validation the server refuses plans on. `nil` falls back to the client sum so callers
    /// that have not adopted them yet keep their current behaviour.
    var serverTotalMinutes: Int?
    var serverOverMinutes: Int?
    var serverScaleMinutes: Int?
    /// `sourceNote` / `programReason` — where the figures came from, printed verbatim.
    var sourceNote: String?

    var plannedMinutes: Int { serverTotalMinutes ?? segments.reduce(0) { $0 + $1.minutes } }
    /// Minutes past the saved budget. Includes unplaced work, which the bar already draws
    /// past the rule via `scaleMinutes`.
    var overMinutes: Int {
        serverOverMinutes ?? max(0, plannedMinutes + unplacedMinutes - budgetMinutes)
    }
    var isOverBudget: Bool { overMinutes > 0 }
    /// The bar is drawn against whichever is larger, so an over-budget week
    /// is visibly over the rule rather than clipped to it.
    var scaleMinutes: Int {
        serverScaleMinutes ?? max(plannedMinutes + unplacedMinutes, budgetMinutes, 1)
    }

    /// `4 h 10 min planned of 5 h budget`.
    var plannedText: String {
        "\(WeeklyBudget.duration(plannedMinutes)) planned of \(WeeklyBudget.duration(budgetMinutes)) budget"
    }

    /// `35 min over your saved budget. Adjust the plan or your available hours.`
    var overText: String {
        "\(WeeklyBudget.duration(overMinutes)) over your saved budget. Adjust the plan or your available hours."
    }

    /// `4 h 10 min`, `45 min`, `5 h`.
    static func duration(_ minutes: Int) -> String {
        let hours = minutes / 60
        let rest = minutes % 60
        if hours == 0 { return "\(rest) min" }
        if rest == 0 { return "\(hours) h" }
        return "\(hours) h \(rest) min"
    }

    /// The bar replaces its children's labels, so the per-goal breakdown has to be here or a
    /// VoiceOver user gets no breakdown at all.
    var accessibilityLabel: String {
        var parts = ["This week.", plannedText + "."]
        for segment in segments {
            parts.append("\(segment.goal.title), \(WeeklyBudget.duration(segment.minutes)).")
        }
        if unplacedMinutes > 0 {
            parts.append("\(WeeklyBudget.duration(unplacedMinutes)) unplaced.")
        }
        if isOverBudget { parts.append(overText) }
        if let sourceNote, !sourceNote.isEmpty { parts.append(sourceNote) }
        return parts.joined(separator: " ")
    }
}

/// Fictional design data.
#Preview("Weekly budget bar") {
    let portfolio = DisplayGoal(id: "g1", title: "Portfolio", hsl: "hsl(142 45% 35%)")
    let reading = DisplayGoal(id: "g2", title: "Reading", hsl: "hsl(28 52% 35%)")
    let jobs = DisplayGoal(id: "g3", title: "Job search", hsl: "hsl(210 40% 35%)")
    return VStack(spacing: Space.l) {
        WeeklyBudgetBar(
            budget: WeeklyBudget(
                segments: [
                    BudgetSegment(id: "1", goal: portfolio, minutes: 150),
                    BudgetSegment(id: "2", goal: reading, minutes: 100)
                ],
                unplacedMinutes: 30,
                budgetMinutes: 300
            ),
            onOpenCalendar: {}
        )
        WeeklyBudgetBar(
            budget: WeeklyBudget(
                segments: [
                    BudgetSegment(id: "1", goal: portfolio, minutes: 240),
                    BudgetSegment(id: "2", goal: reading, minutes: 120),
                    BudgetSegment(id: "3", goal: jobs, minutes: 90)
                ],
                unplacedMinutes: 0,
                budgetMinutes: 300
            ),
            onOpenCalendar: {}
        )
    }
    .padding(AdlerLayout.screenMargin)
    .background(Color.canvas)
}
