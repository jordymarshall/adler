import Foundation

// `GET /api/app/calendar?start=YYYY-MM-DD` → docs/ios-api-examples/calendar.json
// The server snaps any date inside the wanted week to its Monday.

nonisolated struct CalendarDay: Codable, Sendable, Equatable, Hashable, Identifiable {
    let date: YMD
    let isToday: Bool
    /// A working day under the saved program.
    let working: Bool

    var id: String { date.raw }
}

/// An editable suggestion for this week. Never a booking, never evidence work happened.
nonisolated struct CalendarTentativeBlock: Codable, Sendable, Equatable, Hashable, Identifiable {
    let id: String
    let goalId: String
    let goalTitle: String
    let title: String
    let start: Timestamp
    let end: Timestamp
}

nonisolated struct BusyInterval: Codable, Sendable, Equatable, Hashable {
    let start: Timestamp
    let end: Timestamp
    /// Absent for intervals that did not come from a connected calendar.
    let provider: String?
}

/// `coverage == .unknown` unless a connected calendar was checked recently and covers the week.
/// Say so rather than implying the week is free.
nonisolated struct CalendarAvailability: Codable, Sendable, Equatable, Hashable {
    let coverage: AvailabilityCoverage
    let checkedAt: Timestamp?
    let provider: String?
    let start: Timestamp?
    let end: Timestamp?
}

nonisolated struct UnplacedWork: Codable, Sendable, Equatable, Hashable, Identifiable {
    let actionId: String
    let goalId: String
    let goalTitle: String
    let title: String
    let reason: String

    var id: String { actionId }
}

nonisolated struct OverBudgetWeek: Codable, Sendable, Equatable, Hashable, Identifiable {
    let week: YMD
    let minutes: Int

    var id: String { week.raw }
}

nonisolated struct ReviewBlock: Codable, Sendable, Equatable, Hashable {
    let start: Timestamp
    let end: Timestamp
}

nonisolated struct WorkingHours: Codable, Sendable, Equatable, Hashable {
    /// `HH:MM`.
    let start: String
    let end: String
    /// `0` is Sunday.
    let days: [Int]
    let sessionMinutes: Int
}

nonisolated struct CalendarView: Codable, Sendable, Equatable, WorkspaceView {
    let revision: Int
    let today: YMD
    let weekStart: YMD
    let weekEnd: YMD
    let days: [CalendarDay]
    let tentative: [CalendarTentativeBlock]
    /// Work blocks and bookings overlapping the week.
    let blocks: [CalendarBlockView]
    let busy: [BusyInterval]
    let availability: CalendarAvailability
    let unplaced: [UnplacedWork]
    let overBudget: [OverBudgetWeek]
    let review: ReviewBlock?
    let workingHours: WorkingHours
    /// IANA identifier for this workspace.
    let timeZone: String
    /// How the tentative placement was derived. Show it; do not paraphrase.
    let basis: String
    let calendars: CalendarStatus?

    var resolvedTimeZone: TimeZone { TimeZone(identifier: timeZone) ?? .current }
}
