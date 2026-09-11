import SwiftUI
import UIKit

// MARK: - Semantic palette

/// Semantic colour tokens (DESIGN.md §3.1). Feature code references these
/// names only — never an asset name, never a literal hex.
///
/// Body text is `ink` on `surface` and never carries state colour; only
/// headings and plotted signals carry colour. Colour is never the sole
/// signal: every coloured state in this design system also has a label,
/// a symbol or a line style.
nonisolated extension Color {
    /// Screen background. Asset `Bg`.
    static let canvas = Color("Bg")
    /// Cards, sheets, rows. Asset `Paper`.
    static let surface = Color("Paper")
    /// Chips, inset wells, quiet prompts. Asset `Sage`.
    static let surfaceSunken = Color("Sage")
    /// Body text. Asset `Ink`.
    static let ink = Color("Ink")
    /// Metadata, units, dates. Asset `Muted`.
    static let inkMuted = Color("Muted")
    /// Headings only. Asset `HeadingInk`.
    static let inkHeading = Color("HeadingInk")
    /// 1pt hairlines and card borders. Asset `Line`.
    static let separator = Color("Line")
    /// Primary buttons and the plotted plan signal. Asset `AccentGreen`.
    static let accentGreen = Color("AccentGreen")
    /// Brand art, rest-day marks, avatar. Asset `Lime`.
    static let accentLime = Color("Lime")
    /// Brand art only. Asset `Peach`.
    static let accentPeach = Color("Peach")

    /// The accent for **text, links and thin marks**.
    ///
    /// `accentGreen` is a fill colour: white on it passes, but it as ink does
    /// not — `#4E7045` on the dark `surface` is about 2.4:1, well under the
    /// 4.5:1 text minimum this design system commits to (DESIGN.md §3.1).
    /// In light it is `accentGreen` unchanged; in dark it lightens to the
    /// palette's `focusRing` tint, which reaches ~7:1.
    static let accentInk = Color(lightHex: 0x294B3A, darkHex: 0xA8C47E)

    /// Text and symbols drawn **on** an `accentGreen` fill. Scheme-independent on purpose:
    /// `surface` is `#FFFEFA` in light but `#25322A` in dark, which put the person's own chat
    /// bubble at 2.4:1 — under DESIGN.md's own 4.5:1 rule, in dark mode only. This reads
    /// 9.6:1 on light green and 5.6:1 on dark green.
    static let onAccent = Color(lightHex: 0xFFFEFA, darkHex: 0xFFFEFA)

    /// Focus/keyboard ring, 2pt at 5pt offset. Not in the asset catalog —
    /// DESIGN.md §3.1 lists it but the scaffold shipped no colour set.
    static let focusRing = Color(lightHex: 0x75914F, darkHex: 0xA8C47E)
    /// Stale or missing evidence, offline. Not in the asset catalog.
    static let warning = Color(lightHex: 0x8A5A2B, darkHex: 0xD9A86C)
    /// Destructive confirmation only. Not in the asset catalog.
    static let danger = Color(lightHex: 0x7A2E2E, darkHex: 0xE09A9A)

    /// A colour that resolves differently per appearance, for the three
    /// tokens above that have no colour set. sRGB, opaque.
    init(lightHex: UInt32, darkHex: UInt32) {
        self = Color(UIColor { traits in
            UIColor(srgbHex: traits.userInterfaceStyle == .dark ? darkHex : lightHex)
        })
    }
}

nonisolated extension UIColor {
    fileprivate convenience init(srgbHex hex: UInt32) {
        self.init(
            red: CGFloat((hex >> 16) & 0xFF) / 255,
            green: CGFloat((hex >> 8) & 0xFF) / 255,
            blue: CGFloat(hex & 0xFF) / 255,
            alpha: 1
        )
    }
}

// MARK: - Goal colour

/// A goal's plotted colour, parsed from the server-supplied
/// `DisplayGoal.color` CSS string (`hsl(142 45% 35%)`).
///
/// `src/goal-colors.ts` is deliberately **not** re-implemented here: its
/// hash runs over UTF-16 code units and a Swift port would drift. The app
/// parses hue and saturation from the string and applies its own lightness
/// so contrast holds in both appearances (DESIGN.md §3.1): **35% in light,
/// 62% in dark**. Any lightness in the incoming string is ignored.
///
/// Never used for text under 15pt.
nonisolated struct GoalColor: Hashable, Sendable {
    /// Degrees, normalised to `0..<360`.
    let hue: Double
    /// Percent, clamped to `0...100`.
    let saturation: Double

    static let lightLightness: Double = 35
    static let darkLightness: Double = 62

    /// Used when the server sends no colour, or an unparseable one.
    static let fallback = GoalColor(hue: 158, saturation: 28)

    init(hue: Double, saturation: Double) {
        var h = hue.truncatingRemainder(dividingBy: 360)
        if h < 0 { h += 360 }
        self.hue = h
        self.saturation = min(max(saturation, 0), 100)
    }

    /// Parses `hsl(H S% L%)` / `hsl(H, S%, L%)` / `hsl(Hdeg S% L%)`.
    /// Returns `nil` when fewer than two numbers are present, so callers can
    /// fall back instead of inventing a colour.
    init?(hsl string: String) {
        let numbers = Self.numbers(in: string)
        guard numbers.count >= 2 else { return nil }
        self.init(hue: numbers[0], saturation: numbers[1])
    }

    /// Convenience: parse, or use ``fallback``.
    static func parse(_ string: String?) -> GoalColor {
        guard let string, let parsed = GoalColor(hsl: string) else { return fallback }
        return parsed
    }

    /// The lightness this app applies, overriding whatever the string said.
    static func lightness(for scheme: ColorScheme) -> Double {
        scheme == .dark ? darkLightness : lightLightness
    }

    func resolved(_ scheme: ColorScheme) -> Color {
        let (r, g, b) = Self.rgb(hue: hue, saturation: saturation, lightness: Self.lightness(for: scheme))
        return Color(.sRGB, red: r, green: g, blue: b, opacity: 1)
    }

    /// Appearance-reactive colour, safe to store in a value type.
    var color: Color {
        Color(UIColor { [hue, saturation] traits in
            let lightness = traits.userInterfaceStyle == .dark
                ? GoalColor.darkLightness
                : GoalColor.lightLightness
            let (r, g, b) = GoalColor.rgb(hue: hue, saturation: saturation, lightness: lightness)
            return UIColor(red: r, green: g, blue: b, alpha: 1)
        })
    }

    /// CSS `hsl()` → sRGB, each channel `0...1`.
    static func rgb(hue: Double, saturation: Double, lightness: Double) -> (Double, Double, Double) {
        var h = hue.truncatingRemainder(dividingBy: 360)
        if h < 0 { h += 360 }
        h /= 360
        let s = min(max(saturation, 0), 100) / 100
        let l = min(max(lightness, 0), 100) / 100
        guard s > 0 else { return (l, l, l) }
        let q = l < 0.5 ? l * (1 + s) : l + s - l * s
        let p = 2 * l - q
        func channel(_ offset: Double) -> Double {
            var t = offset
            if t < 0 { t += 1 }
            if t > 1 { t -= 1 }
            if t < 1.0 / 6 { return p + (q - p) * 6 * t }
            if t < 1.0 / 2 { return q }
            if t < 2.0 / 3 { return p + (q - p) * (2.0 / 3 - t) * 6 }
            return p
        }
        return (channel(h + 1.0 / 3), channel(h), channel(h - 1.0 / 3))
    }

    private static func numbers(in string: String) -> [Double] {
        var out: [Double] = []
        var current = ""
        for character in string {
            if character.isNumber || character == "." || (character == "-" && current.isEmpty) {
                current.append(character)
            } else {
                if let value = Double(current) { out.append(value) }
                current = ""
            }
        }
        if let value = Double(current) { out.append(value) }
        return out
    }
}

// MARK: - Chart encodings

/// Plot styling from DESIGN.md §3.6. One rule governs every chart:
/// controllable input, reported outcome and conditional projection look
/// different and are labelled differently.
nonisolated enum ChartStyle {
    /// Reported outcome: 2pt solid goal colour, 6pt filled circles.
    static let observedLineWidth: CGFloat = 2
    static let observedPointSize: CGFloat = 60

    /// Saved plan checkpoints: 1.5pt `inkMuted`, dash [4,3], hollow squares.
    static let checkpointLineWidth: CGFloat = 1.5
    static let checkpointDash: [CGFloat] = [4, 3]

    /// Target rule: 1pt `accentGreen`, dash [2,4].
    static let targetDash: [CGFloat] = [2, 4]
    /// Today rule: 1pt `inkMuted`, dash [1,3].
    static let todayDash: [CGFloat] = [1, 3]
    /// Conditional projection: 1.5pt, dash [5,4], goal colour at 55%.
    static let projectionDash: [CGFloat] = [5, 4]
    static let projectionLineOpacity: Double = 0.55
    /// Projection range: 12% fill, 45% dotted boundaries.
    static let projectionBandOpacity: Double = 0.12
    static let projectionBoundaryOpacity: Double = 0.45
    static let projectionBoundaryDash: [CGFloat] = [1, 3]
    /// Controllable input bars: goal colour at 75%.
    static let inputBarOpacity: Double = 0.75
    static let inputBarCornerRadius: CGFloat = 3

    static func observed(_ goal: GoalColor) -> Color { goal.color }
    static func input(_ goal: GoalColor) -> Color { goal.color.opacity(inputBarOpacity) }
    static func projectionLine(_ goal: GoalColor) -> Color { goal.color.opacity(projectionLineOpacity) }
    static func projectionBand(_ goal: GoalColor) -> Color { goal.color.opacity(projectionBandOpacity) }
    static func projectionBoundary(_ goal: GoalColor) -> Color { goal.color.opacity(projectionBoundaryOpacity) }
    static let checkpoint = Color.inkMuted
    /// Text-weight accent: a 1pt rule and its label both have to clear the
    /// contrast minimum in dark.
    static let target = Color.accentInk
    static let today = Color.inkMuted
}
