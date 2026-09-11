import SwiftUI

// Copy and small shared helpers for the Calendar feature.
//
// Strings are `COPY.md` §11 verbatim. Server-supplied text — the `basis` sentence, an unplaced
// action's `reason`, a work block's `status`, a booking error — is printed as it arrives and is
// never re-worded here.

nonisolated enum CalendarCopy {
    static let title = "Calendar"
    static let today = "Today"
    static let addTime = "Add time"
    static let placeHere = "Place here"
    static let tentative = "Tentative"
    static let adlerPlan = "Adler plan"
    static let otherCommitment = "Other commitment"
    static let checkIn = "Check-in"
    static let legendTentative = "Dashed · Tentative"
    static let tentativeNote = "Tentative blocks are only in Adler."
    static let placementHint =
        "Dashed blocks make room for your planned actions. Select one to adjust or confirm its time."
    static let adjustWithCoach = "Adjust with Adler"
    static let checkAvailability = "Check availability"
    static let refreshAvailability = "Refresh availability"
    static let saveTime = "Save time"
    static let confirmBooking = "Confirm booking"
    static let confirming = "Confirming…"
    static let withCheckIn = "Includes a 5-minute check-in event"
    static let localOnly = "Saves in Adler only."
    static let notChecked = "External calendars haven’t been checked."
    static let recheck = "Availability is checked again when you book."
    static let notConnected = "Connect or refresh your calendars to see external busy time."
    static let connected =
        "Connected calendars checked for this view. External events show busy time."
    static let unknownAvailability = "Availability is unknown."
    static let overBudget =
        "That week is over your available time budget. Choose another week or adjust your available hours."
    static let conflict = "That time conflicts with a commitment. Choose another time."
    static let past = "Choose a valid future time in your timezone."
    static let pendingTitle = "Finish confirming your time"
    static let retryBooking = "Retry confirmation"
    static let retryNote = "Retry checks the existing booking to avoid duplicates."
    static let closeBooking = "I checked my calendar · close this booking"
    static let manage = "Manage calendars"

    static func unplaced(_ count: Int) -> String {
        count == 1
            ? "1 action needs room or a prerequisite"
            : "\(count) actions need room or a prerequisite"
    }

    static func bookInto(_ calendar: String) -> String { "Books into \(calendar)" }

    // COPY.md §13.
    static let calendarNotConnected = "No calendar connected."
    static let calendarNotConnectedBody =
        "Adler can still plan tentative blocks. External busy time stays unknown until you connect a calendar."
    static let noUnplaced = "All planned work has a place this week."
    static let loading = "Loading"

    // Strings this screen needs that COPY.md §11 does not define. Listed in
    // `.context/notes/calendar-settings.md` so they can be folded into COPY.md.
    static let unplacedTitle = "Unplaced work"
    static let noCalendarWritable =
        "No connected calendar can be written to. Connect one in Settings › Connections to book external events."
    static let agenda = "Day"
    static let notBooked = "Not booked"
    static let bookedIn = "Booked in %@"
    static let removeBlock = "Remove this block"
}

// MARK: - Goal colours

/// The calendar payload carries `goalId` and `goalTitle` but **no goal colour**, so the week
/// borrows the colours the Goals and Settings views already publish. A goal that is in neither
/// cached view draws in the neutral accent rather than an invented hue.
struct GoalPalette {
    private let colors: [String: GoalColor]

    init(workspace: WorkspaceStore) {
        var map: [String: GoalColor] = [:]
        for row in workspace.goals?.rows ?? [] {
            map[row.goal.id] = GoalColor.parse(row.goal.color)
        }
        for goal in workspace.settings?.goals ?? [] where map[goal.id] == nil {
            map[goal.id] = GoalColor.parse(goal.color)
        }
        colors = map
    }

    func color(_ goalId: String?) -> GoalColor? { goalId.flatMap { colors[$0] } }

    func goal(id: String?, title: String?) -> DisplayGoal? {
        guard let id, let title else { return nil }
        return DisplayGoal(id: id, title: title, color: color(id) ?? .fallback)
    }
}

// MARK: - Section chrome

/// A titled block on the week screen: `eyebrow` label, then content. Matches the section rhythm
/// the rest of the app uses without introducing another card style.
struct CalendarSection<Content: View>: View {
    let title: String
    @ViewBuilder var content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: Space.s) {
            Text(title)
                .adlerText(.eyebrow)
                .foregroundStyle(Color.inkMuted)
            content
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

/// A quiet sentence under a section — availability status, the tentative note, the basis.
struct CalendarNote: View {
    let text: String
    var symbol: String?

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: Space.xs) {
            if let symbol {
                Image(systemName: symbol)
                    .font(.caption2)
                    .foregroundStyle(Color.inkMuted)
            }
            Text(text)
                .adlerText(.footnote)
                .foregroundStyle(Color.inkMuted)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
