import SwiftUI

/// One 24pt lane beneath the input chart in Goal detail (DESIGN.md §4.12).
///
/// Rules encoded here: planned rest continues the count but adds no
/// completed work, so the count and the completions are **two separate
/// numbers**; the caption says so; the lane is never the largest element on
/// a screen and is never framed as a target.
struct StreakLane: View {
    let daysOnPlan: Int
    let actionsCompleted: Int
    /// Most recent last. Uses the `goalStreak` states: `on` → `done`,
    /// `off` → `rest`, `short`, `unknown`, and future days as `upcoming`.
    let days: [DayMark]
    let goal: GoalColor
    var showsCaption: Bool = true

    var body: some View {
        VStack(alignment: .leading, spacing: Space.xs) {
            HStack(spacing: Space.s) {
                Image(systemName: "flame")
                    .font(.footnote)
                    .foregroundStyle(Color.inkMuted)
                    .accessibilityHidden(true)
                Text(StreakSummary.label(daysOnPlan: daysOnPlan, actionsCompleted: actionsCompleted))
                    .adlerText(.footnote, numeric: true)
                    .foregroundStyle(Color.ink)
                Spacer(minLength: Space.s)
                HStack(spacing: Space.xs) {
                    ForEach(days) { day in
                        DayStateCell(state: day.state, goal: goal, size: 8)
                    }
                }
                .accessibilityHidden(true)
            }
            .frame(height: 24)

            if showsCaption {
                Text(StreakSummary.caption)
                    .adlerText(.caption)
                    .foregroundStyle(Color.inkMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(
            "\(StreakSummary.label(daysOnPlan: daysOnPlan, actionsCompleted: actionsCompleted)). \(StreakSummary.caption)"
        )
    }
}

/// Pure formatting for the streak line, so the two numbers stay separate.
nonisolated enum StreakSummary {
    /// `7 days on plan · 4 actions completed`.
    static func label(daysOnPlan: Int, actionsCompleted: Int) -> String {
        let days = daysOnPlan == 1 ? "1 day on plan" : "\(daysOnPlan) days on plan"
        let actions = actionsCompleted == 1 ? "1 action completed" : "\(actionsCompleted) actions completed"
        return "\(days) · \(actions)"
    }

    /// COPY.md `streak.explain`.
    static let caption = "Planned rest continues the count. It does not add completed work, minutes or outcome progress."
}

/// Fictional design data.
#Preview("Streak lane") {
    let goal = GoalColor(hue: 142, saturation: 45)
    let states: [DayState] = [.done, .done, .rest, .done, .short, .done, .unknown, .upcoming]
    let days = states.enumerated().map { offset, state in
        DayMark(date: Date(timeIntervalSinceNow: Double(offset - 6) * 86_400), state: state)
    }
    return VStack(alignment: .leading, spacing: Space.xxl) {
        StreakLane(daysOnPlan: 7, actionsCompleted: 4, days: days, goal: goal)
        StreakLane(daysOnPlan: 1, actionsCompleted: 1, days: Array(days.prefix(3)), goal: goal, showsCaption: false)
    }
    .padding(AdlerLayout.screenMargin)
    .background(Color.canvas)
}
