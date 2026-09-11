import SwiftUI

/// Spacing scale from DESIGN.md §3.3, in points.
nonisolated enum Space {
    static let xxs: CGFloat = 2
    static let xs: CGFloat = 4
    static let s: CGFloat = 8
    static let m: CGFloat = 12
    static let l: CGFloat = 16
    static let xl: CGFloat = 20
    static let xxl: CGFloat = 24
    static let xxxl: CGFloat = 32
    static let huge: CGFloat = 40
}

/// Corner radii from DESIGN.md §3.3.
nonisolated enum Radii {
    static let chip: CGFloat = 8
    static let control: CGFloat = 12
    static let card: CGFloat = 16
    /// Today cards and large sheets.
    static let largeCard: CGFloat = 22
    static let chart: CGFloat = 12
    static let pill: CGFloat = 999
    /// ActivityGrid cells.
    static let cell: CGFloat = 2
}

/// Layout constants from DESIGN.md §3.3.
nonisolated enum AdlerLayout {
    static let screenMargin: CGFloat = 20
    static let cardPadding: CGFloat = 16
    /// Today cards use the wider inset.
    static let todayCardPadding: CGFloat = 20
    /// Vertical rhythm between sections.
    static let sectionGap: CGFloat = 24
    static let minimumHitTarget: CGFloat = 44
    /// The leading rule that carries a goal's colour on cards and rows.
    static let goalRuleWidth: CGFloat = 3
    /// Leading column for the three `eyebrow`-labelled recommendation rows.
    static let eyebrowColumn: CGFloat = 92
    /// Two columns are allowed only above this width (and below
    /// `.accessibility1`): the Current → Suggested comparison.
    static let twoColumnMinimumWidth: CGFloat = 390
    static let chartHeight: CGFloat = 180
    static let compactChartHeight: CGFloat = 44
}

extension DynamicTypeSize {
    /// Chips, segmented rows and the four recommendation controls switch to
    /// vertical stacks above `.accessibility1` (DESIGN.md §3.2).
    var prefersStackedControls: Bool { self >= .accessibility1 }

    /// Charts drop to three axis ticks above `.accessibility2`, and the
    /// learning lane becomes a dated list.
    var prefersSimplifiedCharts: Bool { self >= .accessibility2 }
}
