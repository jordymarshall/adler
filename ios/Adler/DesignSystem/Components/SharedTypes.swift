import SwiftUI

/// A goal as every component needs to refer to one: a title to print and a
/// colour to plot with. Feature code builds this from the API's `DisplayGoal`;
/// the design system never knows about API models.
nonisolated struct DisplayGoal: Identifiable, Hashable, Sendable {
    let id: String
    let title: String
    let color: GoalColor

    init(id: String, title: String, color: GoalColor) {
        self.id = id
        self.title = title
        self.color = color
    }

    /// Convenience for the server-supplied `hsl(H S% L%)` string.
    init(id: String, title: String, hsl: String) {
        self.init(id: id, title: title, color: GoalColor.parse(hsl))
    }
}

/// One dated occurrence of planned work, as the day-state components read it.
nonisolated struct DayMark: Identifiable, Hashable, Sendable {
    let id: String
    let date: Date
    let state: DayState

    init(date: Date, state: DayState) {
        self.id = String(Int(date.timeIntervalSince1970))
        self.date = date
        self.state = state
    }
}

/// Date rendering. One formatter for the whole app (COPY.md conventions):
/// `d MMM`, or `d MMM yyyy` when the year differs from today's.
nonisolated enum AdlerDate {
    static func short(_ date: Date, today: Date = .now, calendar: Calendar = .current) -> String {
        let sameYear = calendar.component(.year, from: date) == calendar.component(.year, from: today)
        let format: Date.FormatString = sameYear
            ? "\(day: .defaultDigits) \(month: .abbreviated)"
            : "\(day: .defaultDigits) \(month: .abbreviated) \(year: .defaultDigits)"
        return date.formatted(
            .verbatim(format, locale: .init(identifier: "en_GB"), timeZone: calendar.timeZone, calendar: calendar)
        )
    }

    /// `Tue 13 Oct` — the Today header.
    static func weekdayShort(_ date: Date, today: Date = .now, calendar: Calendar = .current) -> String {
        let weekday = date.formatted(
            .verbatim("\(weekday: .abbreviated)", locale: .init(identifier: "en_GB"), timeZone: calendar.timeZone, calendar: calendar)
        )
        return "\(weekday) \(short(date, today: today, calendar: calendar))"
    }

    /// `12 October` — spelled out for VoiceOver, where an abbreviation
    /// reads poorly.
    static func spoken(_ date: Date, calendar: Calendar = .current) -> String {
        date.formatted(
            .verbatim(
                "\(day: .defaultDigits) \(month: .wide)",
                locale: .init(identifier: "en_GB"),
                timeZone: calendar.timeZone,
                calendar: calendar
            )
        )
    }

    /// `8:31` — receipts and timings.
    static func time(_ date: Date, calendar: Calendar = .current) -> String {
        date.formatted(
            .verbatim(
                "\(hour: .defaultDigits(clock: .twelveHour, hourCycle: .oneBased)):\(minute: .twoDigits)",
                locale: .init(identifier: "en_GB"),
                timeZone: calendar.timeZone,
                calendar: calendar
            )
        )
    }

    /// Whole days from `from` to `to`, ignoring time of day.
    static func days(from: Date, to: Date, calendar: Calendar = .current) -> Int {
        let start = calendar.startOfDay(for: from)
        let end = calendar.startOfDay(for: to)
        return calendar.dateComponents([.day], from: start, to: end).day ?? 0
    }
}

/// A leading 3pt rule in the goal's colour, used on cards and rows so the
/// goal is identifiable without reading the label.
struct GoalRule: View {
    let color: GoalColor
    var width: CGFloat = AdlerLayout.goalRuleWidth

    var body: some View {
        RoundedRectangle(cornerRadius: width / 2)
            .fill(color.color)
            .frame(width: width)
            .accessibilityHidden(true)
    }
}
