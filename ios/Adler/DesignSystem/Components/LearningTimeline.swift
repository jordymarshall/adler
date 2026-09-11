import SwiftUI

/// A single horizontal lane: planned start → dated occurrences → review (DESIGN.md §4.5).
///
/// Marks, all sitting **on** the axis so nothing floats beside it:
/// - `○` hollow circle — the planned start.
/// - `|` hollow tick — a planned occurrence with **no report**. It is an opportunity, not a
///   result: drawing it filled told a card whose caption reads *"No attempts reported yet"*
///   that three attempts had been reported.
/// - `●` filled dot — a reported attempt.
/// - `▽` open triangle **above** the axis — the next review. Never filled, because a date is
///   not a result.
///
/// Above `.accessibility1` the lane is replaced by the same information as a dated list.
struct LearningTimeline: View {
    let layout: LearningTimelineLayout
    let goal: GoalColor
    var height: CGFloat = 34

    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    var body: some View {
        Group {
            if dynamicTypeSize.prefersStackedControls {
                datedList
            } else {
                lane
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(layout.accessibilitySummary)
    }

    private var lane: some View {
        GeometryReader { proxy in
            let inset: CGFloat = 12
            let width = max(proxy.size.width - inset * 2, 1)
            let axisY = height * 0.45
            ZStack(alignment: .topLeading) {
                Capsule()
                    .fill(Color.surfaceSunken)
                    .frame(width: width, height: 2)
                    .position(x: inset + width / 2, y: axisY)
                Capsule()
                    .fill(goal.color.opacity(0.35))
                    .frame(width: max(1, width * layout.runningFraction), height: 2)
                    .position(
                        x: inset + width * layout.startFraction
                            + width * layout.runningFraction / 2,
                        y: axisY)
                ForEach(layout.marks) { mark in
                    TimelineSymbol(kind: mark.kind, goal: goal)
                        // The review sits above the axis; everything else is on it.
                        .position(
                            x: inset + width * mark.position,
                            y: mark.kind == .review ? axisY - 7 : axisY)
                    if mark.showsLabel {
                        Text(mark.shortLabel)
                            .adlerText(.caption, numeric: true)
                            .foregroundStyle(Color.inkMuted)
                            .lineLimit(1)
                            .fixedSize()
                            // Alternating sides keeps a label off its neighbour's marker.
                            .position(
                                x: inset + width * mark.position,
                                y: mark.labelAbove ? axisY - 13 : axisY + 13)
                    }
                }
            }
        }
        .frame(height: height)
    }

    private var datedList: some View {
        VStack(alignment: .leading, spacing: Space.xxs) {
            ForEach(layout.marks) { mark in
                Text("\(mark.kind.label) \(AdlerDate.short(mark.date))")
                    .adlerText(.footnote, numeric: true)
                    .foregroundStyle(Color.inkMuted)
            }
            Text("A review date is not a result.")
                .adlerText(.footnote)
                .foregroundStyle(Color.inkMuted)
        }
    }
}

private struct TimelineSymbol: View {
    let kind: LearningTimelineLayout.MarkKind
    let goal: GoalColor

    var body: some View {
        switch kind {
        case .attempt:
            Circle().fill(goal.color).frame(width: 9, height: 9)
        case .planned:
            // A hollow tick, not a dot: an opportunity the plan offered, with nothing reported.
            Capsule()
                .strokeBorder(Color.inkMuted, lineWidth: 1)
                .frame(width: 3, height: 10)
        case .start:
            Circle().strokeBorder(Color.inkMuted, lineWidth: 1).frame(width: 9, height: 9)
        case .review:
            DownTriangle()
                .stroke(Color.inkMuted, lineWidth: 1)
                .frame(width: 10, height: 9)
        }
    }
}

private struct DownTriangle: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        path.move(to: CGPoint(x: rect.minX, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.midX, y: rect.maxY))
        path.closeSubpath()
        return path
    }
}

// MARK: - Layout

/// Pure date maths for ``LearningTimeline``.
///
/// The domain runs from the earliest of (planned start, first attempt) to
/// the latest of (review, last attempt, today), so a review that has not
/// arrived still has room on the lane and is never drawn as reached.
nonisolated struct LearningTimelineLayout: Equatable, Sendable {
    nonisolated enum MarkKind: String, Equatable, Sendable {
        case start
        /// A planned occurrence with no report. An opportunity, not a result.
        case planned
        case attempt
        case review

        var label: String {
            switch self {
            case .start: "Planned start"
            case .planned: "Planned, no report"
            case .attempt: "Reported attempt"
            case .review: "Next review"
            }
        }
    }

    /// One dated occurrence the plan offered, and whether anything was actually reported for it.
    /// `LearningAttempt.outcome == nil` server-side means *planned but not reported*.
    nonisolated struct Occurrence: Equatable, Sendable {
        let date: Date
        let reported: Bool

        init(date: Date, reported: Bool) {
            self.date = date
            self.reported = reported
        }
    }

    nonisolated struct Mark: Identifiable, Equatable, Sendable {
        let id: String
        let kind: MarkKind
        let date: Date
        /// `0...1` across the lane.
        let position: Double
        /// `false` when a neighbouring mark's label would collide. The mark
        /// itself is still drawn, and VoiceOver still reads every date.
        var showsLabel: Bool = true

        /// Labels alternate sides so one never lands on its neighbour's marker.
        var labelAbove: Bool = false

        var shortLabel: String {
            switch kind {
            case .start: "start"
            case .planned, .attempt: AdlerDate.short(date)
            case .review: "review"
            }
        }
    }

    let marks: [Mark]
    /// Where the "running" segment starts, `0...1`.
    let startFraction: Double
    /// How much of the lane is running, `0...1`. The grey segment before it
    /// means "not yet running".
    let runningFraction: Double
    let plannedStart: Date
    /// Dates with a saved report. This is the number the caption counts.
    let attempts: [Date]
    /// Dates the plan offered that were never reported. Drawn as hollow ticks.
    let plannedOccurrences: [Date]
    let review: Date?

    /// Preferred initialiser: pass every dated occurrence with whether it was **reported**.
    ///
    /// Passing an unreported occurrence as an attempt is what made a record whose caption says
    /// *"No attempts reported yet"* draw three filled dots.
    init(
        plannedStart: Date,
        occurrences: [Occurrence],
        review: Date?,
        today: Date = .now
    ) {
        let reported = occurrences.filter(\.reported).map(\.date).sorted()
        let planned = occurrences.filter { !$0.reported }.map(\.date).sorted()
        self.init(
            plannedStart: plannedStart, attempts: reported, planned: planned, review: review,
            today: today)
    }

    /// - Parameters:
    ///   - attempts: dates with a saved report — filled dots.
    ///   - planned: dates the plan offered with nothing reported — hollow ticks. Defaults to
    ///     empty, so existing callers are unchanged.
    init(
        plannedStart: Date,
        attempts: [Date],
        planned: [Date] = [],
        review: Date?,
        today: Date = .now
    ) {
        let sortedAttempts = attempts.sorted()
        let sortedPlanned = planned.sorted()
        let candidates =
            [plannedStart] + sortedAttempts + sortedPlanned + [review, today].compactMap { $0 }
        let domainStart = candidates.min() ?? plannedStart
        let domainEnd = candidates.max() ?? plannedStart
        let span = domainEnd.timeIntervalSince(domainStart)

        func position(_ date: Date) -> Double {
            guard span > 0 else { return 0 }
            return min(1, max(0, date.timeIntervalSince(domainStart) / span))
        }

        var marks: [Mark] = [
            Mark(id: "start", kind: .start, date: plannedStart, position: position(plannedStart))
        ]
        for (index, date) in sortedPlanned.enumerated() {
            marks.append(
                Mark(id: "planned-\(index)", kind: .planned, date: date, position: position(date)))
        }
        for (index, attempt) in sortedAttempts.enumerated() {
            marks.append(Mark(id: "attempt-\(index)", kind: .attempt, date: attempt, position: position(attempt)))
        }
        marks.sort { $0.position < $1.position }
        if let review {
            marks.append(Mark(id: "review", kind: .review, date: review, position: position(review)))
        }

        // Labels are ~44pt wide on a ~330pt lane, so two labels closer than 16% of the lane
        // would overlap even on opposite sides of the axis. Keep the ones that carry the most:
        // the review, then the first and last occurrence, then whatever else still fits.
        let mustKeep: Set<Int> = Set(
            [
                marks.firstIndex { $0.kind == .review },
                marks.firstIndex { $0.kind == .attempt || $0.kind == .planned },
                marks.lastIndex { $0.kind == .attempt || $0.kind == .planned },
            ].compactMap { $0 })
        var lastKept: Double?
        for index in marks.indices.reversed() {
            let tooClose = lastKept.map { $0 - marks[index].position < 0.16 } ?? false
            if tooClose && !mustKeep.contains(index) {
                marks[index].showsLabel = false
            } else if tooClose && mustKeep.contains(index) {
                // Keep it, but on the other side of the axis so it cannot sit on its neighbour.
                marks[index].labelAbove = true
                lastKept = marks[index].position
            } else {
                lastKept = marks[index].position
            }
        }

        self.marks = marks
        self.plannedStart = plannedStart
        self.attempts = sortedAttempts
        self.plannedOccurrences = sortedPlanned
        self.review = review
        self.startFraction = position(plannedStart)
        // Only a *reported* attempt advances the running segment. A planned date that came and
        // went with no report is not progress.
        let lastRunning = sortedAttempts.last ?? plannedStart
        self.runningFraction = max(0, position(lastRunning) - position(plannedStart))
    }

    /// The VoiceOver sentence, ending with the rule the lane encodes. Planned opportunities and
    /// reported attempts are counted **separately**: a planned day that came and went with no
    /// report is not an attempt.
    var accessibilitySummary: String {
        var parts = ["Planned start \(AdlerDate.spoken(plannedStart))."]
        if !plannedOccurrences.isEmpty {
            let noun = plannedOccurrences.count == 1 ? "planned day" : "planned days"
            parts.append("\(plannedOccurrences.count) \(noun) with no report.")
        }
        if attempts.isEmpty {
            parts.append("No attempts reported yet.")
        } else {
            let dates = attempts.map { AdlerDate.spoken($0) }.joined(separator: ", ")
            let noun = attempts.count == 1 ? "reported attempt" : "reported attempts"
            parts.append("\(attempts.count) \(noun): \(dates).")
        }
        if let review {
            parts.append("Next review \(AdlerDate.spoken(review)).")
        } else {
            parts.append("Review when there’s useful feedback.")
        }
        parts.append("A review date is not a result.")
        return parts.joined(separator: " ")
    }
}

/// Fictional design data.
#Preview("Learning timeline") {
    let today = Date()
    let day: TimeInterval = 86_400
    return VStack(alignment: .leading, spacing: Space.xxl) {
        LearningTimeline(
            layout: LearningTimelineLayout(
                plannedStart: today.addingTimeInterval(-8 * day),
                attempts: [today.addingTimeInterval(-7 * day), today.addingTimeInterval(-5 * day)],
                review: today.addingTimeInterval(6 * day),
                today: today
            ),
            goal: GoalColor(hue: 142, saturation: 45)
        )
        LearningTimeline(
            layout: LearningTimelineLayout(
                plannedStart: today.addingTimeInterval(2 * day),
                attempts: [],
                review: nil,
                today: today
            ),
            goal: GoalColor(hue: 28, saturation: 52)
        )
        // Three planned days, nothing reported: hollow ticks, never filled dots.
        LearningTimeline(
            layout: LearningTimelineLayout(
                plannedStart: today.addingTimeInterval(-9 * day),
                occurrences: [
                    .init(date: today.addingTimeInterval(-9 * day), reported: false),
                    .init(date: today.addingTimeInterval(-7 * day), reported: false),
                    .init(date: today.addingTimeInterval(-4 * day), reported: false)
                ],
                review: today.addingTimeInterval(5 * day),
                today: today
            ),
            goal: GoalColor(hue: 210, saturation: 40)
        )
    }
    .padding(AdlerLayout.screenMargin)
    .background(Color.canvas)
}
