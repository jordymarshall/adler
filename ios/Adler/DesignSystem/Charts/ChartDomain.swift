import Accessibility
import SwiftUI

/// Pure domain maths shared by the charts, kept out of the views so it can
/// be tested.
nonisolated enum ChartDomain {
    /// Y domain covering every supplied value plus headroom.
    ///
    /// Anchored at zero whenever all values are non-negative, so a bar is
    /// never drawn floating above an invented baseline. An empty series
    /// returns `0...1` — an empty chart, not a fabricated one.
    static func y(_ values: [Double]) -> ClosedRange<Double> {
        guard let minimum = values.min(), let maximum = values.max() else { return 0...1 }
        let span = max(maximum - Swift.min(minimum, 0), 0.000_000_001)
        let pad = Swift.max(span * 0.08, 0.5)
        let lower = minimum >= 0 ? 0 : minimum - pad
        return lower...(maximum + pad)
    }

    /// X domain spanning the supplied dates, always extended to include
    /// `today` so the today rule cannot fall off-canvas, with half a day of
    /// padding on each side.
    static func x(dates: [Date], today: Date? = nil) -> ClosedRange<Date> {
        let pad: TimeInterval = 43_200
        guard var lower = dates.min(), var upper = dates.max() else {
            let anchor = today ?? Date()
            return (anchor - pad)...(anchor + pad)
        }
        if let today {
            lower = Swift.min(lower, today)
            upper = Swift.max(upper, today)
        }
        return (lower - pad)...(upper + pad)
    }

    /// Axis dates to label.
    ///
    /// Charts drop to three ticks at accessibility sizes (DESIGN.md §3.2).
    /// Otherwise labels are spaced by at least a fifth of the plotted span so
    /// they cannot collide, and a date in `keeping` (one with no report) is
    /// preferred over the series' first and last, because its `No report`
    /// note is the only place that fact appears on the chart.
    static func ticks(
        _ dates: [Date],
        simplified: Bool,
        keeping required: [Date] = [],
        maximum: Int = 6
    ) -> [Date] {
        let sorted = dates.sorted()
        guard sorted.count > 3 else { return sorted }
        if simplified {
            return [sorted[0], sorted[sorted.count / 2], sorted[sorted.count - 1]]
        }

        let span = sorted[sorted.count - 1].timeIntervalSince(sorted[0])
        guard span > 0 else { return [sorted[0]] }
        let minimumGap = span / Double(Swift.max(2, maximum - 1))

        var kept = required.filter { sorted.contains($0) }.sorted()
        func add(_ candidate: Date) {
            guard kept.count < maximum else { return }
            guard kept.allSatisfy({ abs($0.timeIntervalSince(candidate)) >= minimumGap }) else { return }
            kept.append(candidate)
            kept.sort()
        }

        add(sorted[0])
        add(sorted[sorted.count - 1])
        for date in sorted { add(date) }
        return kept
    }

    /// `Drafting time in minutes`, but `Case studies published` when the
    /// measure already names its unit — never `Case studies published in
    /// case studies`.
    static func measureAndUnit(_ measure: String, _ unit: String) -> String {
        measure.localizedCaseInsensitiveContains(unit) ? measure : "\(measure) in \(unit)"
    }
}

/// A VoiceOver chart descriptor built from plain series, so every chart in
/// the app exposes every point rather than a single summary sentence.
nonisolated struct AdlerChartDescriptor: AXChartDescriptorRepresentable {
    nonisolated struct Point: Equatable, Sendable {
        let x: Double
        let y: Double
        let label: String
    }

    nonisolated struct Series: Equatable, Sendable {
        let name: String
        let isContinuous: Bool
        let points: [Point]
    }

    let title: String
    let summary: String?
    let xLabel: String
    let yLabel: String
    /// Formats an x value (a `timeIntervalSince1970`) for speech.
    let xDescription: @Sendable (Double) -> String
    /// Formats a y value with its unit for speech.
    let yDescription: @Sendable (Double) -> String
    let series: [Series]

    func makeChartDescriptor() -> AXChartDescriptor {
        let xValues = series.flatMap { $0.points.map(\.x) }
        let yValues = series.flatMap { $0.points.map(\.y) }
        let xAxis = AXNumericDataAxisDescriptor(
            title: xLabel,
            range: (xValues.min() ?? 0)...(xValues.max() ?? 1),
            gridlinePositions: [],
            valueDescriptionProvider: xDescription
        )
        let yAxis = AXNumericDataAxisDescriptor(
            title: yLabel,
            range: (yValues.min() ?? 0)...(yValues.max() ?? 1),
            gridlinePositions: [],
            valueDescriptionProvider: yDescription
        )
        let descriptors = series.map { entry in
            AXDataSeriesDescriptor(
                name: entry.name,
                isContinuous: entry.isContinuous,
                dataPoints: entry.points.map { AXDataPoint(x: $0.x, y: $0.y, additionalValues: [], label: $0.label) }
            )
        }
        return AXChartDescriptor(
            title: title,
            summary: summary,
            xAxis: xAxis,
            yAxis: yAxis,
            additionalAxes: [],
            series: descriptors
        )
    }
}
