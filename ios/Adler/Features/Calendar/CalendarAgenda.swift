import SwiftUI

// The per-day agenda. DESIGN.md §5.9: "a per-day agenda list below the grid is what VoiceOver and
// Dynamic Type users read; each entry reads title, time and kind."
//
// It is also the whole screen above `.accessibility2`, where a 72pt hour grid stops being legible.

struct AgendaRow: View {
    let entry: CalendarEntry
    let goalColor: GoalColor?
    let timeZone: TimeZone
    var action: (() -> Void)?

    var body: some View {
        let content = HStack(alignment: .top, spacing: Space.m) {
            if CalendarEntryStyle.showsGoalRule(entry.kind) {
                GoalRule(color: goalColor ?? .fallback)
                    .frame(height: nil)
            } else {
                Image(systemName: CalendarEntryStyle.symbol(entry.kind))
                    .font(.footnote)
                    .foregroundStyle(Color.inkMuted)
                    .frame(width: AdlerLayout.goalRuleWidth)
            }
            VStack(alignment: .leading, spacing: Space.xxs) {
                Text(entry.timeRange(in: timeZone))
                    .adlerText(.caption, numeric: true)
                    .foregroundStyle(Color.inkMuted)
                Text(entry.title)
                    .adlerText(.headline)
                    .foregroundStyle(Color.ink)
                    .fixedSize(horizontal: false, vertical: true)
                if let goalTitle = entry.goalTitle {
                    Text(goalTitle)
                        .adlerText(.footnote)
                        .foregroundStyle(Color.inkMuted)
                        .lineLimit(1)
                }
                chips
            }
            Spacer(minLength: 0)
            if action != nil {
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundStyle(Color.inkMuted)
            }
        }
        .padding(AdlerLayout.cardPadding)
        .frame(maxWidth: .infinity, alignment: .leading)
        .adlerCard()
        .accessibilityElement(children: .combine)
        .accessibilityLabel(spokenLabel)

        if let action {
            Button(action: action) { content }
                .buttonStyle(.plain)
                .accessibilityAddTraits(.isButton)
        } else {
            content
        }
    }

    private var chips: some View {
        FlowLayout(spacing: Space.xs, lineSpacing: Space.xs) {
            AdlerChip(label: CalendarEntryStyle.kindLabel(entry.kind), emphasis: .outlined)
            if let statusLabel = entry.statusLabel {
                AdlerChip(label: statusLabel, emphasis: .filled)
            }
            if isUnbooked {
                AdlerChip(label: CalendarCopy.notBooked, emphasis: .outlined)
            }
            if entry.hasCheckInEvent {
                AdlerChip(label: CalendarCopy.checkIn, emphasis: .outlined)
            }
        }
    }

    /// A suggestion and a local block are both real records, and neither is on any external
    /// calendar. The row says so rather than letting a filled shape imply a booking.
    private var isUnbooked: Bool {
        switch entry.kind {
        case .tentative, .adlerBlock: true
        default: false
        }
    }

    private var spokenLabel: String {
        var parts = [entry.title, CalendarEntryStyle.kindLabel(entry.kind), entry.timeRange(in: timeZone)]
        if let goalTitle = entry.goalTitle { parts.insert(goalTitle, at: 1) }
        if isUnbooked { parts.append(CalendarCopy.notBooked) }
        if let statusLabel = entry.statusLabel { parts.append(statusLabel) }
        return parts.joined(separator: ". ")
    }
}

/// One day's entries, in time order, with an honest empty line.
struct AgendaList: View {
    let day: YMD
    let entries: [CalendarEntry]
    let timeZone: TimeZone
    let palette: GoalPalette
    var onSelect: ((CalendarEntry) -> Void)?

    var body: some View {
        VStack(alignment: .leading, spacing: Space.s) {
            if entries.isEmpty {
                CalendarNote(text: EmptyStateCopy.noActionsToday.title)
            } else {
                ForEach(entries) { entry in
                    AgendaRow(
                        entry: entry,
                        goalColor: palette.color(entry.goalId),
                        timeZone: timeZone,
                        action: onSelect.map { select in { select(entry) } })
                }
            }
        }
    }
}
