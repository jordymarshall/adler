import SwiftUI
import UIKit

/// `.navigationTitle` is drawn by UIKit, which knows nothing about `AdlerTextStyle` — without
/// this every screen title in the app would come out in San Francisco while its content is set
/// in Adler Warm. The sizes match DESIGN.md §3.2: `title1` for a large title, `headline` for an
/// inline one. `UIFontMetrics` keeps both scaling with Dynamic Type.
///
/// This lives in the shell because the shell owns the navigation bars. If the design system
/// would rather own the chrome, move it there wholesale — nothing else references it.
enum NavigationBarAppearance {
    static func install() {
        let appearance = UINavigationBarAppearance()
        appearance.configureWithDefaultBackground()
        appearance.largeTitleTextAttributes = attributes(.medium, size: 28, style: .largeTitle)
        appearance.titleTextAttributes = attributes(.demiBold, size: 17, style: .headline)

        let bar = UINavigationBar.appearance()
        bar.standardAppearance = appearance
        bar.compactAppearance = appearance
        bar.scrollEdgeAppearance = appearance
        bar.compactScrollEdgeAppearance = appearance
    }

    private static func attributes(
        _ weight: AdlerWeight, size: CGFloat, style: UIFont.TextStyle
    ) -> [NSAttributedString.Key: Any] {
        guard let font = UIFont(name: weight.postScriptName, size: size) else { return [:] }
        return [
            .font: UIFontMetrics(forTextStyle: style).scaledFont(for: font),
            .foregroundColor: UIColor(Color.inkHeading),
        ]
    }
}
