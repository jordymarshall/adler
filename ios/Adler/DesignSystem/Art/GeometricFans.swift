import SwiftUI

/// Wrapped-inspired abstract brand art: lime, peach and green geometric
/// fans, used sparingly as a background on Today cards and Welcome.
///
/// Rules from the brief and DESIGN.md §3.4: never place content behind art.
/// Fans are drawn at ≤ 18% opacity, clipped to their container, and always
/// sit below a `surface`-tinted scrim where text sits. They hold their pose
/// under Reduce Motion (one settling pose otherwise, never a loop).
struct GeometricFans: View {
    /// Changes which corners the fans grow from, so two adjacent cards do
    /// not look identical. Any integer.
    var seed: Int = 0
    var maximumOpacity: Double = 0.18

    @Environment(\.adlerMotion) private var motion
    @State private var posed = false

    private var poses: [FanPose] {
        let corners: [UnitPoint] = [.topTrailing, .bottomLeading, .topLeading, .bottomTrailing]
        let colors: [Color] = [.accentLime, .accentPeach, .accentGreen]
        var result: [FanPose] = []
        for index in 0..<3 {
            let step: Int = seed + index
            let angle = Double((seed * 37 + index * 53) % 360)
            let sweep: Double = 46 + Double(index) * 12
            let radius: Double = 0.85 - Double(index) * 0.16
            let opacity: Double = maximumOpacity * (1 - Double(index) * 0.22)
            result.append(
                FanPose(
                    origin: corners[step % corners.count],
                    color: colors[step % colors.count],
                    startAngle: angle,
                    sweep: sweep,
                    radius: radius,
                    opacity: opacity
                )
            )
        }
        return result
    }

    var body: some View {
        GeometryReader { proxy in
            ZStack {
                ForEach(Array(poses.enumerated()), id: \.offset) { index, pose in
                    Fan(pose: pose, blades: 5)
                        .fill(pose.color)
                        .opacity(pose.opacity)
                        .rotationEffect(.degrees(posed ? 0 : -5), anchor: pose.origin)
                }
            }
            .frame(width: proxy.size.width, height: proxy.size.height)
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
        .onAppear {
            guard motion.animatesArt else {
                posed = true
                return
            }
            withAnimation(motion.artPose) { posed = true }
        }
    }
}

nonisolated struct FanPose: Equatable, Sendable {
    let origin: UnitPoint
    let color: Color
    /// Degrees.
    let startAngle: Double
    /// Degrees covered by the whole fan.
    let sweep: Double
    /// Fraction of the container's larger dimension.
    let radius: Double
    let opacity: Double
}

/// A set of thin sectors radiating from one corner.
private struct Fan: Shape {
    let pose: FanPose
    let blades: Int

    func path(in rect: CGRect) -> Path {
        let center = CGPoint(
            x: rect.minX + rect.width * pose.origin.x,
            y: rect.minY + rect.height * pose.origin.y
        )
        let radius = max(rect.width, rect.height) * pose.radius
        let bladeSweep = pose.sweep / Double(blades * 2 - 1)

        var path = Path()
        for blade in 0..<blades {
            let start = pose.startAngle + Double(blade) * bladeSweep * 2
            path.move(to: center)
            path.addArc(
                center: center,
                radius: radius,
                startAngle: .degrees(start),
                endAngle: .degrees(start + bladeSweep),
                clockwise: false
            )
            path.closeSubpath()
        }
        return path
    }
}

extension View {
    /// Puts the fans behind this view with the required scrim, clipped to the
    /// card's radius. Text always sits on the scrim, never on bare art.
    func adlerFanBackground(seed: Int = 0, cornerRadius: CGFloat = Radii.largeCard) -> some View {
        background {
            ZStack {
                Color.surface
                GeometricFans(seed: seed)
                LinearGradient(
                    colors: [Color.surface.opacity(0.92), Color.surface.opacity(0.35)],
                    startPoint: .top,
                    endPoint: .bottom
                )
            }
            .clipShape(.rect(cornerRadius: cornerRadius))
        }
    }
}

/// Fictional design data.
#Preview("Geometric fans") {
    VStack(spacing: Space.l) {
        ForEach(0..<3, id: \.self) { seed in
            VStack(alignment: .leading, spacing: Space.s) {
                Text("PORTFOLIO").adlerText(.eyebrow).foregroundStyle(Color.inkMuted)
                Text("Write for 25 minutes")
                    .adlerText(.title2)
                    .foregroundStyle(Color.inkHeading)
                Text("Art never sits under text without a scrim.")
                    .adlerText(.callout)
                    .foregroundStyle(Color.inkMuted)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(AdlerLayout.todayCardPadding)
            .adlerFanBackground(seed: seed)
            .overlay {
                RoundedRectangle(cornerRadius: Radii.largeCard)
                    .strokeBorder(Color.separator, lineWidth: 1)
            }
        }
    }
    .padding(AdlerLayout.screenMargin)
    .frame(maxHeight: .infinity)
    .background(Color.canvas)
}
