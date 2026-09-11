import SwiftUI

/// The type scale from DESIGN.md §3.2. Every style is a
/// `Font.custom(_:size:relativeTo:)` over the bundled Adler Warm family, so
/// Dynamic Type scales all of them. Sizes below are the default (Large) size.
///
/// Rules this encodes: at most three type tokens per card; headings use
/// `inkHeading`; `eyebrow` is reserved for structural labels
/// (`OBSERVATION`, `GOAL · PLAN · MILESTONE · ACTION`); numbers use tabular
/// figures so a report never reflows a row.
nonisolated enum AdlerTextStyle: CaseIterable {
    /// Welcome headline, Today card numeral header.
    case display
    /// Screen titles, recommendation headline.
    case title1
    /// Card titles, goal title on detail.
    case title2
    /// Section headings, action title.
    case title3
    /// Row titles, sheet titles.
    case headline
    /// Paragraphs, chat bubbles.
    case body
    /// Card body, secondary paragraphs.
    case callout
    /// Row subtitles, criterion.
    case subhead
    /// Metadata, receipts, limitations.
    case footnote
    /// Chart axis labels, chips.
    case caption
    /// Structural labels only. Uppercased, tracked +0.7pt.
    case eyebrow

    var weight: AdlerWeight {
        switch self {
        case .display, .title1, .title2, .title3, .caption: .medium
        case .headline: .demiBold
        case .body, .callout, .subhead, .footnote: .text
        case .eyebrow: .semiBold
        }
    }

    var size: CGFloat {
        switch self {
        case .display: 34
        case .title1: 28
        case .title2: 22
        case .title3: 19
        case .headline: 17
        case .body: 17
        case .callout: 16
        case .subhead: 15
        case .footnote: 13
        case .caption: 12
        case .eyebrow: 11
        }
    }

    var textStyle: Font.TextStyle {
        switch self {
        case .display: .largeTitle
        case .title1: .title
        case .title2: .title2
        case .title3: .title3
        case .headline: .headline
        case .body: .body
        case .callout: .callout
        case .subhead: .subheadline
        case .footnote: .footnote
        case .caption: .caption
        case .eyebrow: .caption2
        }
    }

    /// Target line height as a multiple of the size.
    var lineHeight: CGFloat {
        switch self {
        case .display: 1.12
        case .title1: 1.15
        case .title2: 1.2
        case .title3: 1.25
        case .headline: 1.3
        case .body: 1.45
        case .callout: 1.4
        case .subhead: 1.4
        case .footnote: 1.35
        case .caption: 1.3
        case .eyebrow: 1.2
        }
    }

    var tracking: CGFloat { self == .eyebrow ? 0.7 : 0 }

    var isUppercased: Bool { self == .eyebrow }

    /// Extra leading to add on top of the font's natural line gap (~1.2×).
    var extraLineSpacing: CGFloat { max(0, size * (lineHeight - 1.2)) }

    var font: Font { AdlerFont.font(weight, size: size, relativeTo: textStyle) }
}

extension Font {
    /// The raw font for a style, when the full ``SwiftUICore/View/adlerText(_:numeric:)``
    /// treatment (leading, tracking, casing) is not wanted.
    static func adler(_ style: AdlerTextStyle) -> Font { style.font }
}

extension View {
    /// Applies a type token: font, leading, tracking and casing.
    /// - Parameter numeric: tabular figures — use for every value, count,
    ///   date and unit, so a number changing in place does not reflow.
    func adlerText(_ style: AdlerTextStyle, numeric: Bool = false) -> some View {
        modifier(AdlerTextStyleModifier(style: style, numeric: numeric))
    }
}

private struct AdlerTextStyleModifier: ViewModifier {
    let style: AdlerTextStyle
    let numeric: Bool
    @ScaledMetric private var lineSpacing: CGFloat

    init(style: AdlerTextStyle, numeric: Bool) {
        self.style = style
        self.numeric = numeric
        _lineSpacing = ScaledMetric(wrappedValue: style.extraLineSpacing, relativeTo: style.textStyle)
    }

    func body(content: Content) -> some View {
        content
            .font(numeric ? style.font.monospacedDigit() : style.font)
            .tracking(style.tracking)
            .lineSpacing(lineSpacing)
            .textCase(style.isUppercased ? .uppercase : nil)
    }
}
