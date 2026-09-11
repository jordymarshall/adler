import Charts
import SwiftUI

/// Reported results against saved plan checkpoints (DESIGN.md §4.11).
///
/// Rules encoded here:
/// - the observed line **connects reports and asserts nothing between
///   them** — the caption says so;
/// - checkpoints are a separate dashed step line with hollow squares: a
///   commitment, not a forecast;
/// - a baseline reads `Starting point`, never a result;
/// - undated completions are listed below the chart, never given an invented
///   date;
/// - a projection is a scenario with assumptions — its sentence and the
///   "not a probability" note sit **above** the chart, outside every
///   disclosure;
/// - when the server cannot project, ``UnavailableReason`` replaces the
///   projection. There is never an empty forecast panel.
struct OutcomeChart: View {
    let content: OutcomeChartContent
    let goal: GoalColor
    var height: CGFloat = 150
    var onAssumptions: (() -> Void)?
    var onWhatWouldHelp: (() -> Void)?

    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    var body: some View {
        VStack(alignment: .leading, spacing: Space.s) {
            if let projection = content.renderedProjection {
                ProjectionBandHeader(projection: projection, onAssumptions: onAssumptions)
            }
            ChartLegend(
                items: content.legendItems(
                    goal: goal, hasProjection: content.renderedProjection != nil))
            chart
                .padding(.top, Space.xl)
                .frame(height: height + Space.xl)
                .clipShape(.rect(cornerRadius: Radii.chart))
                .accessibilityElement(children: .contain)
                .accessibilityLabel(content.accessibilityLabel)
                .accessibilityValue(content.renderedProjection?.ifLabel ?? "")
                .accessibilityChartDescriptor(content.descriptor())
            Text(content.caption)
                .adlerText(.caption, numeric: true)
                .foregroundStyle(Color.inkMuted)
                .fixedSize(horizontal: false, vertical: true)
            if let stale = content.staleNote {
                Text(stale)
                    .adlerText(.footnote, numeric: true)
                    .foregroundStyle(Color.warning)
            }
            if !content.undatedCompletions.isEmpty {
                VStack(alignment: .leading, spacing: Space.xxs) {
                    Text("Completed, no date recorded")
                        .adlerText(.eyebrow)
                        .foregroundStyle(Color.inkMuted)
                    ForEach(content.undatedCompletions, id: \.self) { entry in
                        Text(entry)
                            .adlerText(.footnote)
                            .foregroundStyle(Color.inkMuted)
                    }
                }
            }
            if let reason = content.renderedUnavailableReason {
                UnavailableReason(reason: reason, onWhatWouldHelp: onWhatWouldHelp)
            }
        }
    }

    private var tickDates: [Date] {
        ChartDomain.ticks(content.allDates, simplified: dynamicTypeSize.prefersSimplifiedCharts)
    }

    private var chart: some View {
        Chart {
            if let projection = content.renderedProjection {
                ForEach(projection.band) { point in
                    AreaMark(
                        x: .value("Date", point.date),
                        yStart: .value("Lower", point.lower),
                        yEnd: .value("Upper", point.upper),
                        series: .value("Series", "Scenario range")
                    )
                    .foregroundStyle(ChartStyle.projectionBand(goal))
                }
                ForEach(projection.band) { point in
                    LineMark(
                        x: .value("Date", point.date),
                        y: .value(content.unit, point.lower),
                        series: .value("Series", "Scenario lower")
                    )
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: ChartStyle.projectionBoundaryDash))
                    .foregroundStyle(ChartStyle.projectionBoundary(goal))
                    LineMark(
                        x: .value("Date", point.date),
                        y: .value(content.unit, point.upper),
                        series: .value("Series", "Scenario upper")
                    )
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: ChartStyle.projectionBoundaryDash))
                    .foregroundStyle(ChartStyle.projectionBoundary(goal))
                }
                ForEach(projection.line) { point in
                    LineMark(
                        x: .value("Date", point.date),
                        y: .value(content.unit, point.value),
                        series: .value("Series", "Conditional projection")
                    )
                    .lineStyle(StrokeStyle(lineWidth: 1.5, dash: ChartStyle.projectionDash))
                    .foregroundStyle(ChartStyle.projectionLine(goal))
                }
            }

            ForEach(content.checkpoints) { point in
                LineMark(
                    x: .value("Date", point.date),
                    y: .value(content.unit, point.value),
                    series: .value("Series", "Plan checkpoints")
                )
                .interpolationMethod(.stepEnd)
                .lineStyle(StrokeStyle(lineWidth: ChartStyle.checkpointLineWidth, dash: ChartStyle.checkpointDash))
                .foregroundStyle(ChartStyle.checkpoint)
                PointMark(
                    x: .value("Date", point.date),
                    y: .value(content.unit, point.value)
                )
                .symbol { HollowSquare() }
            }

            ForEach(content.observed) { point in
                LineMark(
                    x: .value("Date", point.date),
                    y: .value(content.unit, point.value),
                    series: .value("Series", "Recorded results")
                )
                .interpolationMethod(.linear)
                .lineStyle(StrokeStyle(lineWidth: ChartStyle.observedLineWidth))
                .foregroundStyle(goal.color)
                PointMark(
                    x: .value("Date", point.date),
                    y: .value(content.unit, point.value)
                )
                .foregroundStyle(goal.color)
                .symbolSize(ChartStyle.observedPointSize)
            }

            if content.isStale, let last = content.observed.last {
                PointMark(
                    x: .value("Date", last.date),
                    y: .value(content.unit, last.value)
                )
                .symbol { HollowRing(color: goal.color) }
            }

            if let target = content.target {
                RuleMark(y: .value("Target", target))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: ChartStyle.targetDash))
                    .foregroundStyle(ChartStyle.target)
                    // At the right end of the rule: the Today rule's label lives at the top of
                    // the chart, and when today is near the left edge the two used to land on
                    // the same pixels ("Target · 3 milestones" under "Today").
                    .annotation(position: .top, alignment: .trailing, spacing: 2, overflowResolution: .init(x: .fit(to: .chart), y: .fit(to: .chart))) {
                        Text("Target · \(content.formatted(target)) \(content.unit)")
                            .adlerText(.caption, numeric: true)
                            .foregroundStyle(Color.accentInk)
                    }
            }

            RuleMark(x: .value("Today", content.today))
                .lineStyle(StrokeStyle(lineWidth: 1, dash: ChartStyle.todayDash))
                .foregroundStyle(ChartStyle.today)
                // Text extends away from the nearer edge, so it is never clipped and never
                // pushed into the target label.
                .annotation(
                    position: .top,
                    alignment: content.todayIsNearLeadingEdge ? .leading : .trailing,
                    spacing: 2,
                    overflowResolution: .init(x: .fit(to: .chart), y: .fit(to: .chart))
                ) {
                    Text("Today")
                        .adlerText(.caption)
                        .foregroundStyle(Color.inkMuted)
                }
        }
        .chartYScale(domain: content.yDomain)
        .chartXScale(domain: ChartDomain.x(dates: content.allDates, today: content.today))
        .chartYAxis {
            AxisMarks(position: .leading) { value in
                AxisGridLine().foregroundStyle(Color.separator)
                AxisValueLabel {
                    if let number = value.as(Double.self) {
                        Text(content.formatted(number))
                            .adlerText(.caption, numeric: true)
                            .foregroundStyle(Color.inkMuted)
                    }
                }
            }
        }
        .chartXAxis {
            AxisMarks(values: tickDates) { value in
                AxisValueLabel {
                    if let date = value.as(Date.self) {
                        Text(AdlerDate.short(date, today: content.today))
                            .adlerText(.caption, numeric: true)
                            .foregroundStyle(Color.inkMuted)
                    }
                }
            }
        }
    }
}

private struct HollowSquare: View {
    var body: some View {
        Rectangle()
            .strokeBorder(Color.inkMuted, lineWidth: 1)
            .background(Rectangle().fill(Color.canvas))
            .frame(width: 7, height: 7)
    }
}

private struct HollowRing: View {
    let color: Color
    var body: some View {
        Circle()
            .strokeBorder(color, lineWidth: 1.5)
            .background(Circle().fill(Color.canvas))
            .frame(width: 11, height: 11)
    }
}

// MARK: - Projection

/// The conditional projection's honest framing. Always rendered **above**
/// the chart and never inside a disclosure.
struct ProjectionBandHeader: View {
    let projection: ProjectionContent
    var onAssumptions: (() -> Void)?

    var body: some View {
        VStack(alignment: .leading, spacing: Space.xxs) {
            Text(projection.ifLabel)
                .adlerText(.subhead)
                .foregroundStyle(Color.ink)
                .fixedSize(horizontal: false, vertical: true)
            if let range = projection.rangeLabel {
                Text(range)
                    .adlerText(.footnote, numeric: true)
                    .foregroundStyle(Color.inkMuted)
            }
            Text(projection.notProbability)
                .adlerText(.footnote)
                .foregroundStyle(Color.inkMuted)
                .fixedSize(horizontal: false, vertical: true)
            if let onAssumptions {
                Button("Assumptions", action: onAssumptions)
                    .adlerText(.footnote)
                    .foregroundStyle(Color.accentInk)
                    .buttonStyle(.plain)
                    .frame(minHeight: AdlerLayout.minimumHitTarget, alignment: .leading)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .adlerWell()
        // `.contain`, not `.combine`: combining swallows the Assumptions button into one static
        // element, and the assumption list is the thing that makes the range a scenario rather
        // than a prediction.
        .accessibilityElement(children: .contain)
    }
}

/// Replaces the projection when the server cannot produce one. Never an
/// empty panel: it prints the server's saved reason verbatim and offers one
/// route forward.
struct UnavailableReason: View {
    /// `projectionUnavailableReason`, verbatim.
    let reason: String
    var onWhatWouldHelp: (() -> Void)?

    var body: some View {
        VStack(alignment: .leading, spacing: Space.s) {
            Text(reason)
                .adlerText(.callout)
                .foregroundStyle(Color.ink)
                .fixedSize(horizontal: false, vertical: true)
            if let onWhatWouldHelp {
                Button("What would make this possible?", action: onWhatWouldHelp)
                    .adlerText(.subhead)
                    .foregroundStyle(Color.accentInk)
                    .buttonStyle(.plain)
                    .frame(minHeight: AdlerLayout.minimumHitTarget, alignment: .leading)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .adlerWell()
        .accessibilityElement(children: .contain)
    }
}

/// A text legend — never colour alone. Each item carries its own line style.
struct ChartLegend: View {
    nonisolated struct Item: Identifiable, Equatable, Sendable {
        enum Style: Equatable, Sendable {
            case solid(GoalColor)
            case dashed
            case band(GoalColor)
        }

        let id: String
        let label: String
        let style: Style
    }

    let items: [Item]

    var body: some View {
        FlowLayout(spacing: Space.m, lineSpacing: Space.xs) {
            ForEach(items) { item in
                HStack(spacing: Space.xs) {
                    swatch(item.style)
                    Text(item.label)
                        .adlerText(.caption)
                        .foregroundStyle(Color.inkMuted)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .combine)
    }

    @ViewBuilder
    private func swatch(_ style: Item.Style) -> some View {
        switch style {
        case .solid(let goal):
            Capsule().fill(goal.color).frame(width: 16, height: 2)
        case .dashed:
            DashedSwatch().stroke(Color.inkMuted, style: StrokeStyle(lineWidth: 1.5, dash: [4, 3]))
                .frame(width: 16, height: 2)
        case .band(let goal):
            RoundedRectangle(cornerRadius: 2)
                .fill(goal.color.opacity(ChartStyle.projectionBandOpacity + 0.1))
                .overlay {
                    RoundedRectangle(cornerRadius: 2)
                        .strokeBorder(goal.color.opacity(ChartStyle.projectionBoundaryOpacity), lineWidth: 1)
                }
                .frame(width: 16, height: 9)
        }
    }
}

private struct DashedSwatch: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        path.move(to: CGPoint(x: rect.minX, y: rect.midY))
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.midY))
        return path
    }
}

// MARK: - Value types

nonisolated struct OutcomePoint: Identifiable, Equatable, Sendable {
    let id: String
    let date: Date
    let value: Double

    init(date: Date, value: Double) {
        self.id = "\(Int(date.timeIntervalSince1970))-\(value)"
        self.date = date
        self.value = value
    }
}

nonisolated struct ProjectionBandPoint: Identifiable, Equatable, Sendable {
    let id: String
    let date: Date
    let lower: Double
    let upper: Double

    init(date: Date, lower: Double, upper: Double) {
        self.id = String(Int(date.timeIntervalSince1970))
        self.date = date
        self.lower = lower
        self.upper = upper
    }
}

nonisolated struct ProjectionContent: Equatable, Sendable {
    /// Starts at the last reported point.
    let line: [OutcomePoint]
    let band: [ProjectionBandPoint]
    /// The server's assumption sentence, verbatim, e.g.
    /// `If your reported pace continues`.
    let ifLabel: String
    /// `A scenario range, not a probability or a promised date.`
    var notProbability: String = "A scenario range, not a probability or a promised date."
    /// `Scenario range · 2 – 4 case studies`.
    var rangeLabel: String?
}

nonisolated struct OutcomeChartContent: Equatable, Sendable {
    /// Reported results. Future-dated reports are excluded by the caller.
    var observed: [OutcomePoint] = []
    /// Saved plan checkpoints.
    var checkpoints: [OutcomePoint] = []
    var target: Double?
    /// `goal.measure.unit`, or `milestones` for a milestone-count goal.
    let unit: String
    /// What is plotted, e.g. `Case studies published`.
    let measure: String
    var today: Date = .now
    /// `Last report 8 Oct` — set when the newest report predates the due
    /// checkpoint.
    var staleNote: String?
    var projection: ProjectionContent?
    /// The server's `projectionUnavailableReason`, verbatim. Mutually
    /// exclusive with `projection`.
    var unavailableReason: String?
    /// Completions with no recorded date. Listed, never plotted.
    var undatedCompletions: [String] = []
    /// Set when the first observed point is a saved baseline rather than a
    /// result.
    var startsFromBaseline: Bool = false

    var isStale: Bool { staleNote != nil }

    /// True when the Today rule falls in the left third of the x domain, where a trailing
    /// annotation would run off the chart and collide with the target label.
    var todayIsNearLeadingEdge: Bool {
        let domain = ChartDomain.x(dates: allDates, today: today)
        let span = domain.upperBound.timeIntervalSince(domain.lowerBound)
        guard span > 0 else { return true }
        return today.timeIntervalSince(domain.lowerBound) / span < 0.33
    }

    /// The projection only when there is something to draw and something to say about it.
    ///
    /// Contract §4: *never render an empty forecast panel*. A `ProjectionContent` with an empty
    /// `line` or a blank `ifLabel` would print a blank assumption sentence over a chart with no
    /// projection marks, under a legend claiming one. `unavailableReason` wins when both are
    /// set — they are documented as mutually exclusive, and the saved reason is the truth.
    var renderedProjection: ProjectionContent? {
        guard unavailableReason == nil, let projection else { return nil }
        guard !projection.line.isEmpty else { return nil }
        guard !projection.ifLabel.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        else { return nil }
        return projection
    }

    /// The reason, whenever no projection is rendered — including a projection too empty to
    /// draw, which would otherwise leave the panel showing nothing at all.
    var renderedUnavailableReason: String? {
        guard renderedProjection == nil else { return nil }
        guard let unavailableReason,
            !unavailableReason.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        else { return nil }
        return unavailableReason
    }

    var allDates: [Date] {
        observed.map(\.date)
            + checkpoints.map(\.date)
            + (projection?.line.map(\.date) ?? [])
            + (projection?.band.map(\.date) ?? [])
    }

    var yDomain: ClosedRange<Double> {
        var values = observed.map(\.value) + checkpoints.map(\.value)
        if let target { values.append(target) }
        if let projection {
            values += projection.line.map(\.value)
            values += projection.band.map(\.lower)
            values += projection.band.map(\.upper)
        }
        return ChartDomain.y(values)
    }

    func formatted(_ value: Double) -> String {
        value.rounded() == value ? String(Int(value)) : String(format: "%.1f", value)
    }

    func legendItems(goal: GoalColor, hasProjection: Bool) -> [ChartLegend.Item] {
        var items: [ChartLegend.Item] = []
        items.append(.init(id: "observed", label: "Recorded results", style: .solid(goal)))
        if !checkpoints.isEmpty {
            items.append(.init(id: "plan", label: "Plan checkpoints", style: .dashed))
        }
        if hasProjection {
            items.append(.init(id: "projection", label: "Conditional projection", style: .band(goal)))
        }
        return items
    }

    /// Always visible: what is plotted, what the line means, and its units.
    var caption: String {
        var parts = [ChartDomain.measureAndUnit(measure, unit)]
        if startsFromBaseline { parts.append("first point is the saved starting point") }
        parts.append("lines join saved reports; changes between reports are unknown")
        return parts.joined(separator: " · ")
    }

    var accessibilityLabel: String {
        var parts = ["\(measure), in \(unit).", "\(observed.count) recorded results."]
        if !checkpoints.isEmpty { parts.append("\(checkpoints.count) plan checkpoints.") }
        if let target { parts.append("Target \(formatted(target)) \(unit).") }
        if let staleNote { parts.append(staleNote + ".") }
        // The dotted band boundaries compute to under the 3:1 non-text minimum, so a range a
        // sighted user can see has to be stated here as well.
        if let range = renderedProjection?.rangeLabel { parts.append(range + ".") }
        if let reason = renderedUnavailableReason { parts.append(reason) }
        return parts.joined(separator: " ")
    }

    func descriptor() -> AdlerChartDescriptor {
        var series: [AdlerChartDescriptor.Series] = [
            .init(
                name: "Recorded results",
                isContinuous: true,
                points: observed.map {
                    .init(x: $0.date.timeIntervalSince1970, y: $0.value, label: "recorded")
                }
            )
        ]
        if !checkpoints.isEmpty {
            series.append(
                .init(
                    name: "Plan checkpoints",
                    isContinuous: false,
                    points: checkpoints.map {
                        .init(x: $0.date.timeIntervalSince1970, y: $0.value, label: "checkpoint")
                    }
                )
            )
        }
        if let projection = renderedProjection {
            series.append(
                .init(
                    name: "Conditional projection, if the stated assumptions hold",
                    isContinuous: true,
                    points: projection.line.map {
                        .init(x: $0.date.timeIntervalSince1970, y: $0.value, label: "if")
                    }
                )
            )
            // The band's extent was perceivable but unobtainable: a VoiceOver user could tell a
            // range existed and had no way to read it. Both boundaries are their own series.
            if !projection.band.isEmpty {
                series.append(
                    .init(
                        name: "Scenario range, lower boundary",
                        isContinuous: true,
                        points: projection.band.map {
                            .init(x: $0.date.timeIntervalSince1970, y: $0.lower, label: "lower")
                        }
                    )
                )
                series.append(
                    .init(
                        name: "Scenario range, upper boundary",
                        isContinuous: true,
                        points: projection.band.map {
                            .init(x: $0.date.timeIntervalSince1970, y: $0.upper, label: "upper")
                        }
                    )
                )
            }
        }
        return AdlerChartDescriptor(
            title: measure,
            summary: [
                accessibilityLabel, renderedProjection?.ifLabel,
                renderedProjection?.notProbability,
            ]
                .compactMap { $0 }
                .joined(separator: " "),
            xLabel: "Date",
            yLabel: unit,
            xDescription: { AdlerDate.spoken(Date(timeIntervalSince1970: $0)) },
            yDescription: { [unit] value in "\(value.formatted(.number.precision(.fractionLength(0...1)))) \(unit)" },
            series: series
        )
    }
}

// MARK: - Previews

// Sample data for previews and the design-system gallery only. Kept out of
// Release: a file-scope `let` is not stripped the way a `#Preview` body is, and
// invented research must never be reachable from shipped code.
#if DEBUG
/// Fictional design data.
nonisolated func previewOutcomeContent(
    withProjection: Bool,
    unavailable: String? = nil
) -> OutcomeChartContent {
    let day: TimeInterval = 86_400
    let today = Date()
    var content = OutcomeChartContent(
        observed: [
            OutcomePoint(date: today.addingTimeInterval(-28 * day), value: 0),
            OutcomePoint(date: today.addingTimeInterval(-14 * day), value: 1),
            OutcomePoint(date: today.addingTimeInterval(-5 * day), value: 1)
        ],
        checkpoints: [
            OutcomePoint(date: today.addingTimeInterval(-21 * day), value: 1),
            OutcomePoint(date: today.addingTimeInterval(7 * day), value: 2),
            OutcomePoint(date: today.addingTimeInterval(21 * day), value: 3)
        ],
        target: 3,
        unit: "case studies",
        measure: "Case studies published",
        today: today,
        startsFromBaseline: true
    )
    if withProjection {
        content.projection = ProjectionContent(
            line: [
                OutcomePoint(date: today.addingTimeInterval(-5 * day), value: 1),
                OutcomePoint(date: today.addingTimeInterval(21 * day), value: 2.6)
            ],
            band: [
                ProjectionBandPoint(date: today.addingTimeInterval(-5 * day), lower: 1, upper: 1),
                ProjectionBandPoint(date: today.addingTimeInterval(21 * day), lower: 2, upper: 3.4)
            ],
            ifLabel: "If your reported pace continues",
            rangeLabel: "Scenario range · 2 – 3.4 case studies by 1 Nov"
        )
    }
    content.unavailableReason = unavailable
    return content
}

/// Fictional design data.
#Preview("Outcome chart — with projection band") {
    ScrollView {
        OutcomeChart(
            content: previewOutcomeContent(withProjection: true),
            goal: GoalColor(hue: 142, saturation: 45),
            onAssumptions: {}
        )
        .padding(AdlerLayout.screenMargin)
    }
    .background(Color.canvas)
}

/// Fictional design data.
#Preview("Outcome chart — projection unavailable") {
    ScrollView {
        OutcomeChart(
            content: {
                var content = previewOutcomeContent(
                    withProjection: false,
                    unavailable: "No finish estimate yet: two results cannot establish a pace, and the last report is older than the current checkpoint."
                )
                content.staleNote = "Last report 8 Oct"
                content.undatedCompletions = ["Case study 1"]
                return content
            }(),
            goal: GoalColor(hue: 142, saturation: 45),
            onWhatWouldHelp: {}
        )
        .padding(AdlerLayout.screenMargin)
    }
    .background(Color.canvas)
}
#endif
