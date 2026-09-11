import Foundation

// Week paging, hour-grid geometry and entry layout for the Calendar week (DESIGN.md §5.9).
//
// Everything here is pure value code with no view and no store, so `AdlerTests/CalendarWeekTests`
// can exercise the arithmetic directly. Day boundaries are always read in the **workspace** time
// zone supplied by the payload, never the device's.

// MARK: - Week arithmetic

nonisolated enum CalendarWeek {
    /// Monday of the week containing `day`. The server snaps `?start=` the same way, so this is
    /// only used for paging and for rendering before the first response lands.
    static func monday(of day: YMD, in timeZone: TimeZone) -> YMD {
        guard let date = day.date(in: timeZone) else { return day }
        var calendar = YMD.calendar
        calendar.timeZone = timeZone
        // `weekday` is 1 = Sunday … 7 = Saturday; Monday is the start of an Adler week.
        let weekday = calendar.component(.weekday, from: date)
        let back = (weekday + 5) % 7
        guard let moved = calendar.date(byAdding: .day, value: -back, to: date) else { return day }
        return YMD(moved, in: timeZone)
    }

    static func advancing(_ weekStart: YMD, by weeks: Int, in timeZone: TimeZone) -> YMD {
        weekStart.adding(days: 7 * weeks, in: timeZone) ?? weekStart
    }

    /// `13–19 Oct` · `28 Sep – 4 Oct` · `29 Dec 2025 – 4 Jan 2026`. Years appear only when they
    /// differ from today's (COPY.md date conventions).
    static func rangeLabel(from start: YMD, to end: YMD, in timeZone: TimeZone, today: YMD)
        -> String
    {
        var calendar = YMD.calendar
        calendar.timeZone = timeZone
        guard let first = start.noon(in: timeZone), let last = end.noon(in: timeZone),
            let now = today.noon(in: timeZone)
        else { return "\(start.raw) – \(end.raw)" }

        if calendar.isDate(first, equalTo: last, toGranularity: .month) {
            let day = calendar.component(.day, from: first)
            return "\(day)–\(AdlerDate.short(last, today: now, calendar: calendar))"
        }
        // A week that crosses New Year carries the year on both ends. The app's rule prints a
        // year only when it differs from today's, which would otherwise read `29 Dec 2025 – 4 Jan`.
        if !calendar.isDate(first, equalTo: last, toGranularity: .year) {
            return "\(withYear(first, calendar)) – \(withYear(last, calendar))"
        }
        return "\(AdlerDate.short(first, today: now, calendar: calendar)) – "
            + AdlerDate.short(last, today: now, calendar: calendar)
    }

    private static func withYear(_ date: Date, _ calendar: Calendar) -> String {
        date.formatted(
            .verbatim(
                "\(day: .defaultDigits) \(month: .abbreviated) \(year: .defaultDigits)",
                locale: .init(identifier: "en_GB"), timeZone: calendar.timeZone,
                calendar: calendar))
    }

    /// `Mon` — the week strip and the column headers.
    static func weekdayInitials(_ day: YMD, in timeZone: TimeZone) -> String {
        var calendar = YMD.calendar
        calendar.timeZone = timeZone
        guard let date = day.noon(in: timeZone) else { return "" }
        return date.formatted(
            .verbatim(
                "\(weekday: .abbreviated)", locale: .init(identifier: "en_GB"),
                timeZone: timeZone, calendar: calendar))
    }
}

// MARK: - Time of day

/// Minutes from midnight, the unit the hour grid works in.
nonisolated enum DayMinutes {
    static func of(_ date: Date, in timeZone: TimeZone) -> Int {
        var calendar = YMD.calendar
        calendar.timeZone = timeZone
        let parts = calendar.dateComponents([.hour, .minute], from: date)
        return (parts.hour ?? 0) * 60 + (parts.minute ?? 0)
    }

    /// `HH:MM` as the program saves it. Returns `nil` for anything that is not a saved time.
    static func parse(_ text: String) -> Int? {
        let parts = text.split(separator: ":", omittingEmptySubsequences: false)
        guard parts.count == 2, parts[0].count == 2, parts[1].count == 2,
            let hour = Int(parts[0]), let minute = Int(parts[1]),
            (0...23).contains(hour), (0...59).contains(minute)
        else { return nil }
        return hour * 60 + minute
    }

    static func text(_ minutes: Int) -> String {
        String(format: "%02d:%02d", (minutes / 60) % 24, minutes % 60)
    }

    /// An instant on `day` at `minutes` past midnight in the workspace zone.
    static func instant(day: YMD, minutes: Int, in timeZone: TimeZone) -> Date? {
        guard let midnight = day.date(in: timeZone) else { return nil }
        return midnight.addingTimeInterval(TimeInterval(minutes * 60))
    }
}

// MARK: - The hour grid

/// The visible vertical window of a day column, in minutes from midnight.
nonisolated struct HourWindow: Equatable, Sendable {
    /// Rounded down to the hour.
    let startMinute: Int
    /// Rounded up to the hour.
    let endMinute: Int

    static let pointsPerHour: Double = 72

    var hours: [Int] { stride(from: startMinute / 60, through: endMinute / 60, by: 1).map { $0 } }
    var minutes: Int { max(60, endMinute - startMinute) }
    var height: Double { Double(minutes) / 60 * Self.pointsPerHour }

    /// Points from the top of the grid for an absolute minute, clamped to the window.
    func offset(minute: Int) -> Double {
        Double(min(max(minute, startMinute), endMinute) - startMinute) / 60 * Self.pointsPerHour
    }

    /// `nil` when the interval falls entirely outside the window.
    func span(fromMinute: Int, toMinute: Int) -> (top: Double, height: Double)? {
        guard toMinute > startMinute, fromMinute < endMinute else { return nil }
        let top = offset(minute: fromMinute)
        // 18 points is the smallest block that can still show a label at the body scale.
        return (top, max(18, offset(minute: toMinute) - top))
    }

    /// The window the week needs: the saved working hours, widened to cover every entry, and
    /// never narrower than four hours.
    static func covering(workingHours: WorkingHours, entries: [CalendarEntry], in timeZone: TimeZone)
        -> HourWindow
    {
        var start = DayMinutes.parse(workingHours.start) ?? 9 * 60
        var end = DayMinutes.parse(workingHours.end) ?? 17 * 60
        for entry in entries {
            start = min(start, DayMinutes.of(entry.start, in: timeZone))
            // An entry ending exactly on the hour must not add an empty hour below it.
            end = max(end, DayMinutes.of(entry.end, in: timeZone))
        }
        start = max(0, (start / 60) * 60)
        end = min(24 * 60, Int((Double(end) / 60).rounded(.up)) * 60)
        if end - start < 4 * 60 { end = min(24 * 60, start + 4 * 60) }
        if end - start < 4 * 60 { start = max(0, end - 4 * 60) }
        return HourWindow(startMinute: start, endMinute: end)
    }
}

// MARK: - Entries

/// One thing drawn in the week. Suggested, saved, booked and external time are separate kinds
/// and are never conflated (`.context/ios-brief.md` §4).
nonisolated struct CalendarEntry: Identifiable, Hashable, Sendable {
    nonisolated enum Kind: Hashable, Sendable {
        /// An event that exists on a connected calendar.
        case booking(provider: CalendarProvider)
        /// A saved Adler-only work block. Real, but not on any external calendar.
        case adlerBlock
        /// An editable suggestion. Not a booking, not evidence of work.
        case tentative
        /// The proposed time inside SchedulePlacement.
        case placement
        /// External busy time read from a connected calendar.
        case busy(provider: String?)
        /// The weekly review block.
        case checkIn
    }

    let id: String
    let kind: Kind
    let title: String
    let goalId: String?
    let goalTitle: String?
    let start: Date
    let end: Date
    /// The server's work-block status, printed verbatim: `Scheduled` · `Done` · `Partly` ·
    /// `Didn’t happen`. `nil` for everything that has no reported state.
    let statusLabel: String?
    /// Present when the entry is backed by an action that can be started or reported.
    let actionId: String?
    /// Present on a booking that also created a check-in event.
    let hasCheckInEvent: Bool

    init(
        id: String,
        kind: Kind,
        title: String,
        goalId: String? = nil,
        goalTitle: String? = nil,
        start: Date,
        end: Date,
        statusLabel: String? = nil,
        actionId: String? = nil,
        hasCheckInEvent: Bool = false
    ) {
        self.id = id
        self.kind = kind
        self.title = title
        self.goalId = goalId
        self.goalTitle = goalTitle
        self.start = start
        self.end = end
        self.statusLabel = statusLabel
        self.actionId = actionId
        self.hasCheckInEvent = hasCheckInEvent
    }

    func day(in timeZone: TimeZone) -> YMD { YMD(start, in: timeZone) }

    /// `9:00 – 9:25`
    func timeRange(in timeZone: TimeZone) -> String {
        var calendar = YMD.calendar
        calendar.timeZone = timeZone
        return "\(AdlerDate.time(start, calendar: calendar)) – \(AdlerDate.time(end, calendar: calendar))"
    }

    /// Drawing order: external time sits behind saved work, suggestions in front of neither.
    var layer: Int {
        switch kind {
        case .busy: 0
        case .checkIn: 1
        case .tentative: 2
        case .adlerBlock, .booking: 3
        case .placement: 4
        }
    }
}

// MARK: - Lane packing

/// Side-by-side placement for entries that overlap in the same day column.
nonisolated enum EntryLayout {
    nonisolated struct Placed: Identifiable, Hashable, Sendable {
        let entry: CalendarEntry
        let lane: Int
        let laneCount: Int

        var id: String { entry.id }
    }

    /// Greedy interval partitioning: entries are swept in start order and put in the first lane
    /// that is free, and every entry in one overlapping cluster reports the same `laneCount` so
    /// the column divides evenly.
    static func place(_ entries: [CalendarEntry]) -> [Placed] {
        let sorted = entries.sorted {
            $0.start == $1.start ? $0.id < $1.id : $0.start < $1.start
        }
        var placed: [Placed] = []
        var cluster: [(entry: CalendarEntry, lane: Int)] = []
        var laneEnds: [Date] = []
        var clusterEnd: Date?

        func flush() {
            let count = max(1, laneEnds.count)
            placed += cluster.map { Placed(entry: $0.entry, lane: $0.lane, laneCount: count) }
            cluster = []
            laneEnds = []
            clusterEnd = nil
        }

        for entry in sorted {
            if let end = clusterEnd, entry.start >= end { flush() }
            let lane = laneEnds.firstIndex { $0 <= entry.start } ?? laneEnds.count
            if lane == laneEnds.count { laneEnds.append(entry.end) } else { laneEnds[lane] = entry.end }
            cluster.append((entry, lane))
            clusterEnd = max(clusterEnd ?? entry.end, entry.end)
        }
        flush()
        return placed
    }
}

// MARK: - Building entries from the payload

nonisolated extension CalendarView {
    /// Every drawable entry in the week, in drawing order. `busy` intervals that a booking
    /// already explains are still drawn: the app does not decide that two records are the same
    /// event.
    var entries: [CalendarEntry] {
        var result: [CalendarEntry] = []

        for block in blocks {
            guard let start = block.start.date, let end = block.end.date else { continue }
            result.append(
                CalendarEntry(
                    id: "block-\(block.id)",
                    kind: block.provider == .local
                        ? .adlerBlock : .booking(provider: block.provider),
                    title: block.action,
                    goalId: block.goalId,
                    goalTitle: block.goalTitle,
                    start: start,
                    end: end,
                    statusLabel: block.status.rawValue,
                    actionId: block.id,
                    hasCheckInEvent: block.checkInId != nil))
        }

        let bookedIds = Set(blocks.map(\.id))
        for suggestion in tentative where !bookedIds.contains(suggestion.id) {
            guard let start = suggestion.start.date, let end = suggestion.end.date else { continue }
            result.append(
                CalendarEntry(
                    id: "tentative-\(suggestion.id)",
                    kind: .tentative,
                    title: suggestion.title,
                    goalId: suggestion.goalId,
                    goalTitle: suggestion.goalTitle,
                    start: start,
                    end: end,
                    actionId: suggestion.id))
        }

        for (index, interval) in busy.enumerated() {
            guard let start = interval.start.date, let end = interval.end.date else { continue }
            result.append(
                CalendarEntry(
                    id: "busy-\(index)",
                    kind: .busy(provider: interval.provider),
                    title: CalendarCopy.otherCommitment,
                    start: start,
                    end: end))
        }

        if let review, let start = review.start.date, let end = review.end.date {
            result.append(
                CalendarEntry(
                    id: "review",
                    kind: .checkIn,
                    title: CalendarCopy.checkIn,
                    start: start,
                    end: end))
        }

        return result.sorted { $0.layer == $1.layer ? $0.start < $1.start : $0.layer < $1.layer }
    }

    func entries(on day: YMD) -> [CalendarEntry] {
        let zone = resolvedTimeZone
        return entries.filter { $0.day(in: zone) == day }.sorted { $0.start < $1.start }
    }

    var isAnyCalendarConnected: Bool {
        guard let calendars else { return false }
        return calendars.google.connected || calendars.apple.connected
    }

    /// True when this week is listed as over the saved weekly time budget.
    var isOverBudget: Bool { overBudget.contains { $0.week == weekStart } }
}

// MARK: - Availability

/// What the app may honestly say about external busy time (COPY.md §11). Missing availability is
/// unknown, never free.
nonisolated struct AvailabilityStatus: Equatable, Sendable {
    let headline: String
    let detail: String?
    let isUnknown: Bool

    /// Availability older than this is reported as needing another check before booking.
    static let freshness: TimeInterval = 5 * 60

    static func read(_ view: CalendarView, now: Date = .now) -> AvailabilityStatus {
        guard view.isAnyCalendarConnected else {
            return AvailabilityStatus(
                headline: CalendarCopy.unknownAvailability,
                detail: CalendarCopy.notConnected,
                isUnknown: true)
        }
        guard view.availability.coverage == .checked else {
            return AvailabilityStatus(
                headline: CalendarCopy.unknownAvailability,
                detail: CalendarCopy.notChecked,
                isUnknown: true)
        }
        let checkedAt = view.availability.checkedAt?.date
        let isFresh = checkedAt.map { now.timeIntervalSince($0) <= freshness } ?? false
        return AvailabilityStatus(
            headline: CalendarCopy.connected,
            detail: isFresh ? nil : CalendarCopy.recheck,
            isUnknown: false)
    }
}
