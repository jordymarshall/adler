import Charts
import SwiftUI

/// Controllable input: what the person can actually do (minutes, pages), by
/// date (DESIGN.md §4.10).
///
/// Rules encoded here:
/// - a date with no report gets **no bar** and a `No report` axis note — it
///   is never drawn as zero;
/// - the plan's amount for each occurrence is a separate `inkMuted` rule,
///   so plan and report are never the same mark;
/// - the caption always states the measure and the period, because a chart
///   is never the only place a number appears;
/// - retired occurrences are dimmed and labelled, never mistaken for a
///   missing report.
struct InputChart: View {
    enum Scale {
        /// Goal detail.
        case full
        /// The All Goals sparkline.
        case compact
    }

    let series: InputSeries
    let goal: GoalColor
    var scale: Scale = .full
    var today: Date = .now

    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    private var height: CGFloat {
        scale == .full ? AdlerLayout.chartHeight : AdlerLayout.compactChartHeight
    }

    var body: some View {
        VStack(alignment: .leading, spacing: Space.xs) {
            chart
                .padding(.top, Space.m)
                .frame(height: height + Space.m)
                .clipShape(.rect(cornerRadius: Radii.chart))
                .accessibilityElement(children: .contain)
                .accessibilityLabel(series.accessibilityLabel)
                .accessibilityChartDescriptor(series.descriptor(goal: goal))
            if scale == .full {
                Text(series.caption)
                    .adlerText(.caption, numeric: true)
                    .foregroundStyle(Color.inkMuted)
            } else if let summary = series.compactSummary {
                Text(summary)
                    .adlerText(.caption, numeric: true)
                    .foregroundStyle(Color.inkMuted)
            }
        }
    }

    private var tickDates: [Date] {
        ChartDomain.ticks(
            series.points.map(\.date),
            simplified: dynamicTypeSize.prefersSimplifiedCharts,
            keeping: series.points.filter { $0.amount == nil }.map(\.date)
        )
    }

    @ViewBuilder
    private var chart: some View {
        if scale == .full {
            baseChart
                .chartYAxis {
                    AxisMarks(position: .leading) { value in
                        AxisGridLine().foregroundStyle(Color.separator)
                        AxisValueLabel {
                            if let number = value.as(Double.self) {
                                Text(series.formatted(number))
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
                                VStack(spacing: 0) {
                                    Text(AdlerDate.short(date, today: today))
                                        .adlerText(.caption, numeric: true)
                                        .foregroundStyle(Color.inkMuted)
                                    if series.hasNoReport(on: date) {
                                        Text("No report")
                                            .adlerText(.caption)
                                            .foregroundStyle(Color.inkMuted)
                                    }
                                }
                            }
                        }
                    }
                }
        } else {
            baseChart
                .chartYAxis(.hidden)
                .chartXAxis(.hidden)
        }
    }

    private var baseChart: some View {
        Chart {
            ForEach(series.points) { point in
                if let amount = point.amount {
                    if series.isOneTime {
                        PointMark(
                            x: .value("Date", point.date),
                            y: .value(series.unit, amount)
                        )
                        .foregroundStyle(goal.color.opacity(point.retired ? 0.45 : 1))
                        .symbolSize(ChartStyle.observedPointSize)
                    } else {
                        BarMark(
                            x: .value("Date", point.date, unit: .day),
                            y: .value(series.unit, amount),
                            width: .ratio(0.6)
                        )
                        .foregroundStyle(goal.color.opacity(point.retired ? 0.34 : ChartStyle.inputBarOpacity))
                        .cornerRadius(ChartStyle.inputBarCornerRadius)
                    }
                }
                if let planned = point.planned {
                    RuleMark(
                        xStart: .value("Date", point.date.addingTimeInterval(-21_600)),
                        xEnd: .value("Date", point.date.addingTimeInterval(21_600)),
                        y: .value("Planned", planned)
                    )
                    .lineStyle(StrokeStyle(lineWidth: 1))
                    .foregroundStyle(Color.inkMuted)
                }
            }
        }
        .chartYScale(domain: series.yDomain)
        .chartXScale(domain: ChartDomain.x(dates: series.points.map(\.date), today: nil))
    }
}

/// A horizontally scrolling strip of dated report chips, sitting directly
/// beneath the chart in Goal detail. Tapping one opens the report for that
/// occurrence.
struct ReportStrip: View {
    let series: InputSeries
    let goal: GoalColor
    var onSelect: ((InputPoint) -> Void)?

    var body: some View {
        ScrollView(.horizontal) {
            HStack(spacing: Space.s) {
                ForEach(series.points) { point in
                    Button {
                        onSelect?(point)
                    } label: {
                        HStack(spacing: Space.xs) {
                            DayStateCell(state: point.state, goal: goal, size: 10)
                            VStack(alignment: .leading, spacing: 0) {
                                Text(AdlerDate.short(point.date))
                                    .adlerText(.caption, numeric: true)
                                    .foregroundStyle(Color.ink)
                                Text(point.retired ? "Retired" : point.state.label)
                                    .adlerText(.caption)
                                    .foregroundStyle(Color.inkMuted)
                            }
                        }
                        .padding(.horizontal, Space.s)
                        .frame(height: 28)
                        .background(Color.surfaceSunken, in: .rect(cornerRadius: Radii.chip))
                        .opacity(point.retired ? 0.45 : 1)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("\(AdlerDate.spoken(point.date)). \(point.retired ? "Retired" : point.state.label)")
                }
            }
            .padding(.vertical, Space.xxs)
        }
        .scrollIndicators(.hidden)
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Dated reports")
    }
}

// MARK: - Value types

nonisolated struct InputPoint: Identifiable, Equatable, Sendable {
    let id: String
    let date: Date
    /// `nil` means **no report** — unknown, not zero.
    var amount: Double?
    /// The plan's amount for this occurrence, drawn as a separate rule.
    var planned: Double?
    var state: DayState
    /// A retired occurrence: dimmed and labelled, never a missing report.
    var retired: Bool = false

    init(date: Date, amount: Double?, planned: Double? = nil, state: DayState, retired: Bool = false) {
        self.id = String(Int(date.timeIntervalSince1970))
        self.date = date
        self.amount = amount
        self.planned = planned
        self.state = state
        self.retired = retired
    }
}

nonisolated struct InputSeries: Equatable, Sendable {
    let points: [InputPoint]
    /// The saved unit, e.g. `minutes`, `pages`.
    let unit: String
    /// What is being measured, e.g. `Drafting time`.
    let measure: String
    /// One-time work plots dated marks on a single lane instead of bars.
    var isOneTime: Bool = false

    var yDomain: ClosedRange<Double> {
        ChartDomain.y(points.compactMap(\.amount) + points.compactMap(\.planned))
    }

    func hasNoReport(on date: Date, calendar: Calendar = .current) -> Bool {
        points.contains {
            calendar.isDate($0.date, inSameDayAs: date) && $0.amount == nil
        }
    }

    func formatted(_ value: Double) -> String {
        value.rounded() == value
            ? String(Int(value))
            : String(format: "%.1f", value)
    }

    /// Always visible: what is plotted, in which unit, over which period.
    var caption: String {
        guard let first = points.first?.date, let last = points.last?.date else {
            return "\(ChartDomain.measureAndUnit(measure, unit)) · no reports yet"
        }
        return "\(ChartDomain.measureAndUnit(measure, unit)) · \(AdlerDate.short(first)) – \(AdlerDate.short(last))"
    }

    /// The short label beside the All Goals sparkline.
    var compactSummary: String? {
        let reported = points.compactMap(\.amount)
        guard !reported.isEmpty else { return "No amounts recorded yet" }
        let average = reported.reduce(0, +) / Double(reported.count)
        return "\(formatted(average.rounded())) \(unit) average"
    }

    var accessibilityLabel: String {
        let reported = points.filter { $0.amount != nil }.count
        let missing = points.count - reported
        return "\(measure), in \(unit). \(reported) reported, \(missing) with no report."
    }

    func descriptor(goal: GoalColor) -> AdlerChartDescriptor {
        AdlerChartDescriptor(
            title: measure,
            summary: accessibilityLabel,
            xLabel: "Date",
            yLabel: unit,
            xDescription: { AdlerDate.spoken(Date(timeIntervalSince1970: $0)) },
            yDescription: { [unit] value in "\(value.formatted(.number.precision(.fractionLength(0...1)))) \(unit)" },
            series: [
                AdlerChartDescriptor.Series(
                    name: "Reported",
                    isContinuous: false,
                    points: points.compactMap { point in
                        guard let amount = point.amount else { return nil }
                        return AdlerChartDescriptor.Point(
                            x: point.date.timeIntervalSince1970,
                            y: amount,
                            label: point.state.label
                        )
                    }
                ),
                AdlerChartDescriptor.Series(
                    name: "Planned",
                    isContinuous: false,
                    points: points.compactMap { point in
                        guard let planned = point.planned else { return nil }
                        return AdlerChartDescriptor.Point(
                            x: point.date.timeIntervalSince1970,
                            y: planned,
                            label: "planned"
                        )
                    }
                )
            ]
        )
    }
}

// MARK: - Previews

// Sample data for previews and the design-system gallery only. Kept out of
// Release: a file-scope `let` is not stripped the way a `#Preview` body is, and
// invented research must never be reachable from shipped code.
#if DEBUG
/// Fictional design data.
nonisolated func previewInputSeries(today: Date = .now) -> InputSeries {
    let day: TimeInterval = 86_400
    let amounts: [Double?] = [25, 30, nil, 18, 25, 40, nil, 25]
    let states: [DayState] = [.done, .done, .unknown, .partly, .done, .done, .missed, .done]
    let points = amounts.enumerated().map { index, amount in
        InputPoint(
            date: today.addingTimeInterval(Double(index - 7) * day),
            amount: amount,
            planned: 25,
            state: states[index],
            retired: index == 5
        )
    }
    return InputSeries(points: points, unit: "minutes", measure: "Drafting time")
}

/// Fictional design data.
#Preview("Input chart") {
    ScrollView {
        VStack(alignment: .leading, spacing: AdlerLayout.sectionGap) {
            InputChart(series: previewInputSeries(), goal: GoalColor(hue: 142, saturation: 45))
            ReportStrip(series: previewInputSeries(), goal: GoalColor(hue: 142, saturation: 45), onSelect: { _ in })
            Text("Compact (All Goals sparkline)")
                .adlerText(.eyebrow)
                .foregroundStyle(Color.inkMuted)
            InputChart(series: previewInputSeries(), goal: GoalColor(hue: 142, saturation: 45), scale: .compact)
        }
        .padding(AdlerLayout.screenMargin)
    }
    .background(Color.canvas)
}

/// Fictional design data.
#Preview("Input chart — one-time work") {
    let day: TimeInterval = 86_400
    let points = [0, 3, 7].map { offset in
        InputPoint(
            date: Date().addingTimeInterval(Double(offset - 9) * day),
            amount: 1,
            planned: nil,
            state: .done
        )
    }
    return InputChart(
        series: InputSeries(points: points, unit: "applications", measure: "Applications sent", isOneTime: true),
        goal: GoalColor(hue: 210, saturation: 40)
    )
    .padding(AdlerLayout.screenMargin)
    .background(Color.canvas)
}
#endif
