import SwiftUI

/// Motion tokens from DESIGN.md §3.5. No looping animation anywhere, and no
/// motion is ever required to read something.
///
/// Read them through `@Environment(\.adlerMotion)` rather than using these
/// raw values, so Reduce Motion is honoured automatically.
nonisolated enum Motion {
    /// 180ms ease-out. A state change, not decoration — it survives Reduce
    /// Motion.
    static let feedback = Animation.easeOut(duration: 0.18)
    /// 220ms ease-in-out. Instant under Reduce Motion.
    static let disclosure = Animation.easeInOut(duration: 0.22)
    /// 420ms ease-out for chart marks. Suppressed under Reduce Motion —
    /// marks render final immediately.
    static let chartEntrance = Animation.easeOut(duration: 0.42)
    /// 600ms ease-in-out for background art. Suppressed under Reduce Motion.
    static let artPose = Animation.easeInOut(duration: 0.6)
    /// 240ms once, after a report saves. Suppressed under Reduce Motion —
    /// the receipt text appears directly.
    static let receiptPulse = Animation.easeOut(duration: 0.24)
}

/// Motion tokens already gated on the person's Reduce Motion setting.
/// A `nil` animation means "apply the change instantly".
nonisolated struct AdlerMotion: Equatable, Sendable {
    let reduceMotion: Bool

    var feedback: Animation? { Motion.feedback }
    var disclosure: Animation? { reduceMotion ? nil : Motion.disclosure }
    var chartEntrance: Animation? { reduceMotion ? nil : Motion.chartEntrance }
    var artPose: Animation? { reduceMotion ? nil : Motion.artPose }
    var receiptPulse: Animation? { reduceMotion ? nil : Motion.receiptPulse }

    /// Background art holds its pose under Reduce Motion.
    var animatesArt: Bool { !reduceMotion }
    /// Skeletons are a static fill under Reduce Motion, never a shimmer.
    var animatesSkeletons: Bool { !reduceMotion }
}

extension EnvironmentValues {
    /// `@Environment(\.adlerMotion) private var motion` →
    /// `withAnimation(motion.disclosure) { … }`.
    var adlerMotion: AdlerMotion { AdlerMotion(reduceMotion: accessibilityReduceMotion) }
}
