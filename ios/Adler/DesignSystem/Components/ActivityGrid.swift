import SwiftUI

/// Compact dated cells, GitHub-style (DESIGN.md §4.9). It shows **reported
/// work, not outcomes**, and it appears on the All Goals row and nowhere
/// else.
///
/// A day with no scheduled action is drawn at `canvas` (absent) — distinct
/// from `upcoming` (`surfaceSunken`) and from `unknown` (dotted). Nothing
/// here is ever drawn as zero.
struct ActivityGrid: View {
    let layout: ActivityGridLayout
    let goal: GoalColor
    var cellSize: CGFloat = 9
    var spacing: CGFloat = 2
    /// The caption under the grid naming the period. Always shown: a chart
    /// is never the only place a number appears.
    var showsCaption: Bool = true

    var body: some View {
        VStack(alignment: .leading, spacing: Space.xs) {
            HStack(alignment: .top, spacing: spacing) {
                ForEach(layout.weeks) { week in
                    VStack(spacing: spacing) {
                        ForEach(week.days) { day in
                            DayStateCell(state: day.state, goal: goal, size: cellSize)
                        }
                    }
                    .accessibilityElement(children: .ignore)
                    .accessibilityLabel(week.accessibilityLabel)
                }
            }
            if showsCaption {
                Text(layout.caption)
                    .adlerText(.caption, numeric: true)
                    .foregroundStyle(Color.inkMuted)
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Reported work by day")
    }
}

// MARK: - Layout

/// Pure layout maths for ``ActivityGrid``: 7 rows (Mon–Sun) × up to N
/// columns, right-aligned to the week containing `today`.
nonisolated struct ActivityGridLayout: Equatable, Sendable {
    nonisolated struct Day: Identifiable, Equatable, Sendable {
        let id: String
        let date: Date
        let state: DayState
    }

    nonisolated struct Week: Identifiable, Equatable, Sendable {
        let id: String
        /// Always 7 entries, Monday first.
        let days: [Day]

        /// Every state is counted **separately**. Folding `unknown`, `upcoming` and `absent`
        /// into one "no report" number announced future days and days with nothing scheduled
        /// as neglect, and dropped `rest` and `short` entirely — so a week of five below-plan
        /// reports and two planned days off was read out as "0 done, 0 partly, 0 didn't
        /// happen". Rest is not a miss and a day the plan never asked for is not a gap.
        var accessibilityLabel: String {
            guard let first = days.first else { return "Empty week" }
            let counts = days.reduce(into: [DayState: Int]()) { $0[$1.state, default: 0] += 1 }
            var parts: [String] = []
            func add(_ state: DayState, _ phrase: String) {
                let count = counts[state] ?? 0
                if count > 0 { parts.append("\(count) \(phrase)") }
            }
            add(.done, "done")
            add(.partly, "partly")
            add(.short, "reported below plan")
            add(.missed, "didn’t happen")
            add(.rest, "planned day off")
            add(.unknown, "awaiting check-in")
            add(.upcoming, "upcoming")
            add(.absent, "nothing scheduled")
            let body = parts.isEmpty ? "no days" : parts.joined(separator: ", ")
            return "Week of \(AdlerDate.spoken(first.date)): \(body)"
        }
    }

    let weeks: [Week]
    let start: Date
    let end: Date
    /// The server's `activitySummary.label`, printed verbatim when present.
    private let serverCaption: String?

    /// - Parameters:
    ///   - marks: reported/planned days. Any date from `dataStart` on without a mark is
    ///     `absent`; earlier columns are dropped rather than asserted as "nothing was
    ///     scheduled", which would invent history for dates before the goal existed.
    ///   - today: the right-hand anchor; its week is the last column.
    ///   - weekCount: number of columns, capped at 14 by the design.
    ///   - caption: `activitySummary.label` from the server. Pass it: the client should not be
    ///     recomputing a completion figure the server already saved.
    ///   - dataStart: the first date the goal has data for. Defaults to the earliest mark.
    init(
        marks: [DayMark],
        today: Date,
        weekCount: Int = 14,
        calendar: Calendar = .iso8601Monday,
        caption: String? = nil,
        dataStart: Date? = nil
    ) {
        self.serverCaption = caption
        let cappedWeeks = max(1, min(weekCount, 14))
        let startOfToday = calendar.startOfDay(for: today)
        let weekdayIndex = calendar.mondayIndex(of: startOfToday)
        let lastMonday = calendar.date(byAdding: .day, value: -weekdayIndex, to: startOfToday) ?? startOfToday
        let firstMonday = calendar.date(byAdding: .day, value: -7 * (cappedWeeks - 1), to: lastMonday) ?? lastMonday

        var states: [Date: DayState] = [:]
        for mark in marks {
            states[calendar.startOfDay(for: mark.date)] = mark.state
        }

        // Never draw a column entirely before the goal had data: eleven columns asserting
        // "nothing was scheduled" for dates before the goal existed is invented history.
        let earliest = dataStart ?? marks.map(\.date).min()
        let firstVisibleMonday: Date = {
            guard let earliest else { return firstMonday }
            let day = calendar.startOfDay(for: earliest)
            let monday = calendar.date(
                byAdding: .day, value: -calendar.mondayIndex(of: day), to: day) ?? firstMonday
            return max(monday, firstMonday)
        }()

        var weeks: [Week] = []
        for week in 0..<cappedWeeks {
            guard let monday = calendar.date(byAdding: .day, value: 7 * week, to: firstMonday) else { continue }
            if monday < firstVisibleMonday { continue }
            var days: [Day] = []
            for offset in 0..<7 {
                guard let date = calendar.date(byAdding: .day, value: offset, to: monday) else { continue }
                days.append(
                    Day(
                        id: String(Int(date.timeIntervalSince1970)),
                        date: date,
                        state: states[date] ?? .absent
                    )
                )
            }
            weeks.append(Week(id: String(Int(monday.timeIntervalSince1970)), days: days))
        }

        self.weeks = weeks
        self.start = weeks.first?.days.first?.date ?? firstMonday
        self.end = calendar.date(byAdding: .day, value: 6, to: lastMonday) ?? lastMonday
    }

    var allDays: [Day] { weeks.flatMap(\.days) }
    var doneCount: Int { allDays.count { $0.state == .done } }
    var reportedCount: Int { allDays.count { $0.state.isReported } }

    /// The server's `activitySummary.label` when the caller supplied one — the client does not
    /// recompute a figure the server already saved, and its counts can otherwise disagree with
    /// the server's own summary. The date range is appended because a caption must name its
    /// period. Without a server label, COPY.md `activity.caption` / `activity.none`.
    var caption: String {
        let period = "\(AdlerDate.short(start)) – \(AdlerDate.short(end))"
        if let serverCaption, !serverCaption.isEmpty { return "\(serverCaption) · \(period)" }
        guard reportedCount > 0 else { return "No check-ins yet" }
        return "\(doneCount) completed · \(reportedCount) reported · \(period)"
    }
}

extension Calendar {
    /// A calendar whose weeks start on Monday, matching the grid's rows.
    nonisolated static var iso8601Monday: Calendar {
        var calendar = Calendar(identifier: .iso8601)
        calendar.firstWeekday = 2
        calendar.timeZone = .current
        return calendar
    }

    /// 0 for Monday … 6 for Sunday.
    nonisolated func mondayIndex(of date: Date) -> Int {
        (component(.weekday, from: date) + 5) % 7
    }
}

// MARK: - Previews

// Sample data for previews and the design-system gallery only. Kept out of
// Release: a file-scope `let` is not stripped the way a `#Preview` body is, and
// invented research must never be reachable from shipped code.
#if DEBUG
/// Fictional design data — eight weeks of reported work, so a grid of any
/// width has something to draw.
nonisolated func previewActivityMarks(today: Date = .now, calendar: Calendar = .iso8601Monday) -> [DayMark] {
    let week: [DayState?] = [.done, .done, .partly, .missed, .done, nil, .rest]
    let variations: [[DayState?]] = [
        week,
        [.done, .unknown, .done, .done, .partly, .rest, nil],
        [.missed, .done, .done, .unknown, .done, .rest, nil],
        [.done, .done, .partly, .done, .missed, nil, .rest],
        [.done, .partly, .done, .missed, .done, .rest, nil],
        [.unknown, .done, .done, .done, .partly, nil, .rest],
        [.done, .done, .missed, .done, .done, .rest, nil],
        [.done, .done, .upcoming, .upcoming, .upcoming, nil, nil]
    ]
    let pattern = variations.flatMap { $0 }
    let startOffset = -(pattern.count - 4)
    return pattern.enumerated().compactMap { offset, state in
        guard let state,
              let date = calendar.date(byAdding: .day, value: offset + startOffset, to: calendar.startOfDay(for: today))
        else { return nil }
        return DayMark(date: date, state: state)
    }
}

/// Fictional design data.
#Preview("Activity grid") {
    VStack(alignment: .leading, spacing: Space.xxl) {
        ActivityGrid(
            layout: ActivityGridLayout(marks: previewActivityMarks(), today: .now, weekCount: 4),
            goal: GoalColor(hue: 142, saturation: 45)
        )
        ActivityGrid(
            layout: ActivityGridLayout(marks: previewActivityMarks(), today: .now, weekCount: 14),
            goal: GoalColor(hue: 28, saturation: 52)
        )
        ActivityGrid(
            layout: ActivityGridLayout(marks: [], today: .now, weekCount: 8),
            goal: GoalColor(hue: 210, saturation: 40)
        )
    }
    .padding(AdlerLayout.screenMargin)
    .frame(maxWidth: .infinity, alignment: .leading)
    .background(Color.canvas)
}
#endif
