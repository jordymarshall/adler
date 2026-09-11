import SwiftUI

// The hour grid (DESIGN.md §5.9). One column per day, 72pt per hour, working hours shaded.
//
// On compact width the caller passes a single day; on regular width it passes all seven. The
// geometry is identical either way — only the number of columns changes — so there is one
// layout to get right and one to test.

struct CalendarWeekGrid: View {
    let days: [CalendarDay]
    let window: HourWindow
    let entries: [CalendarEntry]
    let workingHours: WorkingHours
    let timeZone: TimeZone
    let palette: GoalPalette
    var selectedEntryID: String?
    var onSelectEntry: (CalendarEntry) -> Void = { _ in }
    var onSelectDay: (YMD) -> Void = { _ in }

    private static let gutterWidth: CGFloat = 34

    var body: some View {
        HStack(alignment: .top, spacing: 0) {
            hourGutter
            ForEach(days) { day in
                dayColumn(day)
                    .frame(maxWidth: .infinity)
                    .overlay(alignment: .leading) {
                        Rectangle()
                            .fill(Color.separator)
                            .frame(width: 1)
                    }
            }
        }
        .accessibilityHidden(true)  // the agenda list below is the accessible reading of this
    }

    // MARK: Gutter

    private var hourGutter: some View {
        ZStack(alignment: .topLeading) {
            Color.clear.frame(width: Self.gutterWidth, height: window.height)
            ForEach(window.hours, id: \.self) { hour in
                Text("\(hour % 24)")
                    .adlerText(.caption, numeric: true)
                    .foregroundStyle(Color.inkMuted)
                    .frame(width: Self.gutterWidth - Space.xs, alignment: .trailing)
                    .alignmentGuide(.top) { $0[.top] }
                    .offset(y: window.offset(minute: hour * 60) - 6)
            }
        }
        .frame(width: Self.gutterWidth, height: window.height, alignment: .topLeading)
    }

    // MARK: Column

    private func dayColumn(_ day: CalendarDay) -> some View {
        let dayEntries = entries.filter { $0.day(in: timeZone) == day.date }
        return ZStack(alignment: .topLeading) {
            background(day)
            GeometryReader { proxy in
                ForEach(EntryLayout.place(dayEntries)) { placed in
                    if let span = span(of: placed.entry, on: day.date) {
                        let laneWidth = max(24, (proxy.size.width - 2) / CGFloat(placed.laneCount))
                        CalendarEntryBlock(
                            entry: placed.entry,
                            goalColor: palette.color(placed.entry.goalId),
                            isSelected: selectedEntryID == placed.entry.id,
                            height: span.height
                        ) {
                            onSelectEntry(placed.entry)
                        }
                        .frame(width: laneWidth - 2, height: span.height, alignment: .topLeading)
                        .offset(x: 1 + laneWidth * CGFloat(placed.lane), y: span.top)
                    }
                }
            }
        }
        .frame(height: window.height)
        .contentShape(.rect)
        .onTapGesture { onSelectDay(day.date) }
    }

    private func background(_ day: CalendarDay) -> some View {
        ZStack(alignment: .topLeading) {
            Rectangle().fill(Color.surface)
            if day.working, let shading = workingSpan {
                Rectangle()
                    .fill(Color.surfaceSunken)
                    .frame(height: shading.height)
                    .offset(y: shading.top)
            }
            ForEach(window.hours, id: \.self) { hour in
                Rectangle()
                    .fill(Color.separator.opacity(hour % 24 == 0 ? 1 : 0.7))
                    .frame(height: 1)
                    .offset(y: window.offset(minute: hour * 60))
            }
        }
        .frame(height: window.height)
    }

    private var workingSpan: (top: CGFloat, height: CGFloat)? {
        guard let start = DayMinutes.parse(workingHours.start),
            let end = DayMinutes.parse(workingHours.end),
            let span = window.span(fromMinute: start, toMinute: end)
        else { return nil }
        return (CGFloat(span.top), CGFloat(span.height))
    }

    private func span(of entry: CalendarEntry, on day: YMD) -> (top: CGFloat, height: CGFloat)? {
        // An entry can start the day before or end the day after; clamp it to this column.
        let startsToday = YMD(entry.start, in: timeZone) == day
        let endsToday = YMD(entry.end, in: timeZone) == day
        let from = startsToday ? DayMinutes.of(entry.start, in: timeZone) : 0
        let to = endsToday ? DayMinutes.of(entry.end, in: timeZone) : 24 * 60
        guard let span = window.span(fromMinute: from, toMinute: to) else { return nil }
        return (CGFloat(span.top), CGFloat(span.height))
    }
}

// MARK: - One entry

/// Suggested, saved, booked and external time each have their own fill, border and badge, so the
/// four are distinguishable without reading a label (DESIGN.md §5.9).
struct CalendarEntryBlock: View {
    let entry: CalendarEntry
    let goalColor: GoalColor?
    var isSelected: Bool = false
    var height: CGFloat = 44
    var action: () -> Void = {}

    private var tint: Color { (goalColor ?? .fallback).color }

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 1) {
                Text(entry.title)
                    .adlerText(.caption)
                    .foregroundStyle(Color.ink)
                    .lineLimit(height > 40 ? 2 : 1)
                if height > 52, let badge = CalendarEntryStyle.badge(entry.kind) {
                    Text(badge)
                        .adlerText(.caption)
                        .foregroundStyle(Color.inkMuted)
                        .lineLimit(1)
                }
            }
            .padding(.horizontal, Space.xs)
            .padding(.vertical, 2)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .background(fill, in: .rect(cornerRadius: Radii.chip))
            .overlay { hatch }
            .overlay {
                RoundedRectangle(cornerRadius: Radii.chip)
                    .strokeBorder(
                        borderColor,
                        style: StrokeStyle(
                            lineWidth: borderWidth,
                            dash: CalendarEntryStyle.isDashed(entry.kind) ? [4, 3] : []))
            }
            .overlay(alignment: .leading) {
                if CalendarEntryStyle.showsGoalRule(entry.kind) {
                    Rectangle().fill(tint).frame(width: 3)
                        .clipShape(.rect(cornerRadius: 1.5))
                }
            }
            .overlay {
                if isSelected {
                    RoundedRectangle(cornerRadius: Radii.chip)
                        .strokeBorder(Color.focusRing, lineWidth: 2)
                        .padding(-2)
                }
            }
        }
        .buttonStyle(.plain)
    }

    private var fill: Color {
        switch entry.kind {
        case .booking: tint.opacity(0.22)
        case .adlerBlock: tint.opacity(0.13)
        case .tentative: tint.opacity(0.09)
        case .placement: Color.accentLime.opacity(0.4)
        case .busy: Color.surfaceSunken
        case .checkIn: Color.clear
        }
    }

    private var borderColor: Color {
        switch entry.kind {
        case .booking, .adlerBlock, .tentative: tint
        case .placement: Color.accentInk
        case .busy: Color.separator
        case .checkIn: Color.accentGreen
        }
    }

    private var borderWidth: CGFloat {
        switch entry.kind {
        case .booking: 2
        case .adlerBlock, .tentative, .placement, .checkIn: 1.5
        case .busy: 1
        }
    }

    /// External busy time is hatched so it reads as "not yours to plan in" without colour.
    @ViewBuilder private var hatch: some View {
        if case .busy = entry.kind {
            Canvas { context, size in
                var path = Path()
                var x = -size.height
                while x < size.width {
                    path.move(to: CGPoint(x: x, y: size.height))
                    path.addLine(to: CGPoint(x: x + size.height, y: 0))
                    x += 7
                }
                context.stroke(path, with: .color(Color.separator), lineWidth: 1)
            }
            .clipShape(.rect(cornerRadius: Radii.chip))
            .allowsHitTesting(false)
        }
    }
}

nonisolated enum CalendarEntryStyle {
    static func badge(_ kind: CalendarEntry.Kind) -> String? {
        switch kind {
        case .booking: nil
        case .adlerBlock: CalendarCopy.adlerPlan
        case .tentative: CalendarCopy.tentative
        case .placement: CalendarCopy.placeHere
        case .busy: CalendarCopy.otherCommitment
        case .checkIn: CalendarCopy.checkIn
        }
    }

    /// What the entry *is*, spoken and printed in the agenda.
    static func kindLabel(_ kind: CalendarEntry.Kind) -> String {
        switch kind {
        case .booking(let provider):
            switch provider {
            case .google: "Google Calendar"
            case .apple: "Apple Calendar"
            default: CalendarCopy.adlerPlan
            }
        case .adlerBlock: CalendarCopy.adlerPlan
        case .tentative: CalendarCopy.tentative
        case .placement: CalendarCopy.placeHere
        case .busy(let provider): provider.map { "\(CalendarCopy.otherCommitment) · \($0)" }
            ?? CalendarCopy.otherCommitment
        case .checkIn: CalendarCopy.checkIn
        }
    }

    static func isDashed(_ kind: CalendarEntry.Kind) -> Bool {
        switch kind {
        case .tentative, .placement: true
        default: false
        }
    }

    static func showsGoalRule(_ kind: CalendarEntry.Kind) -> Bool {
        switch kind {
        case .booking, .adlerBlock, .tentative: true
        default: false
        }
    }

    static func symbol(_ kind: CalendarEntry.Kind) -> String {
        switch kind {
        case .booking: "calendar.badge.checkmark"
        case .adlerBlock: "square.fill"
        case .tentative: "dash.square"
        case .placement: "plus.square.dashed"
        case .busy: "rectangle.slash"
        case .checkIn: "checkmark.square"
        }
    }
}

// MARK: - Legend

struct CalendarLegend: View {
    let goals: [DisplayGoal]
    var showsBusy: Bool

    var body: some View {
        FlowLayout(spacing: Space.s, lineSpacing: Space.xs) {
            ForEach(goals) { goal in
                HStack(spacing: Space.xs) {
                    Circle().fill(goal.color.color).frame(width: 8, height: 8)
                    Text(goal.title).adlerText(.caption).foregroundStyle(Color.inkMuted)
                        .lineLimit(1)
                }
            }
            if showsBusy {
                HStack(spacing: Space.xs) {
                    Image(systemName: "rectangle.slash")
                        .font(.caption2)
                        .foregroundStyle(Color.inkMuted)
                    Text(CalendarCopy.otherCommitment)
                        .adlerText(.caption).foregroundStyle(Color.inkMuted)
                }
            }
            Text(CalendarCopy.legendTentative)
                .adlerText(.caption)
                .foregroundStyle(Color.inkMuted)
        }
        .accessibilityElement(children: .combine)
    }
}
