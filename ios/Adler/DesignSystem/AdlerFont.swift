import SwiftUI
import UIKit

/// The seven weights of the bundled Adler Warm family (see
/// `Resources/Fonts/*.ttf` and `Info.plist` `UIAppFonts`).
///
/// Pure data with no UI-thread affinity, so it opts out of this project's
/// MainActor-by-default isolation — that keeps it usable from anywhere,
/// including nonisolated test code.
nonisolated enum AdlerWeight: Int, CaseIterable {
    case regular = 400
    case book = 450
    case text = 500
    case medium = 550
    case demiBold = 600
    case semiBold = 650
    case bold = 700

    /// PostScript name baked into each TTF (read with CoreText from the
    /// source files — see `.context/notes/scaffold.md`).
    var postScriptName: String {
        switch self {
        case .regular: "AdlerWarm-Regular"
        case .book: "AdlerWarm-Book"
        case .text: "AdlerWarm-Text"
        case .medium: "AdlerWarm-Medium"
        case .demiBold: "AdlerWarm-DemiBold"
        case .semiBold: "AdlerWarm-SemiBold"
        case .bold: "AdlerWarm-Bold"
        }
    }
}

nonisolated enum AdlerFont {
    static func font(_ weight: AdlerWeight, size: CGFloat, relativeTo: Font.TextStyle) -> Font {
        .custom(weight.postScriptName, size: size, relativeTo: relativeTo)
    }

    /// Logs (DEBUG only) any Adler Warm weight that failed to register with
    /// the system font manager — e.g. if a PostScript name above drifted
    /// from the bundled TTFs, or `UIAppFonts` is missing an entry. Call once
    /// at launch.
    static func verifyRegistered() {
        #if DEBUG
        for weight in AdlerWeight.allCases where UIFont(name: weight.postScriptName, size: 12) == nil {
            print("AdlerFont: \(weight) did not register — expected PostScript name \"\(weight.postScriptName)\"")
        }
        #endif
    }
}
