import XCTest
import UIKit
@testable import Adler

// XCTestCase's overridable init/lifecycle methods are nonisolated; opt this
// type out of the project's MainActor-by-default isolation so overrides
// match (Swift 6 strict concurrency would otherwise error on the mismatch).
nonisolated final class SmokeTests: XCTestCase {
    /// All seven Adler Warm PostScript names must resolve via UIFont, i.e.
    /// the TTFs are present in `Resources/Fonts` and listed in `UIAppFonts`.
    func testAllAdlerWarmWeightsResolve() {
        for weight in AdlerWeight.allCases {
            let font = UIFont(name: weight.postScriptName, size: 12)
            XCTAssertNotNil(
                font,
                "Expected \"\(weight.postScriptName)\" to resolve via UIFont — check Resources/Fonts and Info.plist UIAppFonts"
            )
        }
    }
}
