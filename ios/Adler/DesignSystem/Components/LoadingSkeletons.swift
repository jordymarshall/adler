import SwiftUI

/// Shape-matched placeholders (DESIGN.md §4.20). `surfaceSunken` fill, radius
/// matching the real element, **no shimmer under Reduce Motion**.
///
/// A skeleton is never a claim about content: it carries no text and is
/// hidden from VoiceOver behind a single `Loading` label. Never a full-screen
/// spinner on a tab root; cached content renders immediately with
/// ``RefreshHairline`` instead.
struct SkeletonShape: View {
    var width: CGFloat?
    var height: CGFloat
    var radius: CGFloat = Radii.chip
    @Environment(\.adlerMotion) private var motion
    @State private var shimmering = false

    var body: some View {
        RoundedRectangle(cornerRadius: radius)
            .fill(Color.surfaceSunken)
            .opacity(shimmering ? 0.55 : 1)
            .frame(width: width, height: height)
            .onAppear {
                guard motion.animatesSkeletons else { return }
                withAnimation(.easeInOut(duration: 0.9).repeatForever(autoreverses: true)) {
                    shimmering = true
                }
            }
    }
}

/// 56pt row skeleton.
struct SkeletonRow: View {
    var body: some View {
        HStack(spacing: Space.m) {
            SkeletonShape(width: 3, height: 40, radius: 2)
            VStack(alignment: .leading, spacing: Space.s) {
                SkeletonShape(width: 180, height: 14)
                SkeletonShape(width: 120, height: 11)
            }
            Spacer(minLength: 0)
        }
        .frame(height: 56)
        .accessibilityElement()
        .accessibilityLabel("Loading")
    }
}

/// 140pt card skeleton.
struct SkeletonCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: Space.m) {
            SkeletonShape(width: 90, height: 11)
            SkeletonShape(width: 220, height: 20)
            SkeletonShape(height: 14)
            HStack(spacing: Space.s) {
                SkeletonShape(width: 88, height: 32, radius: Radii.control)
                SkeletonShape(width: 88, height: 32, radius: Radii.control)
            }
        }
        .frame(height: 140, alignment: .top)
        .padding(AdlerLayout.cardPadding)
        .adlerCard()
        .accessibilityElement()
        .accessibilityLabel("Loading")
    }
}

/// 180pt chart skeleton — the axis lines are drawn so the layout does not
/// jump when real marks arrive.
struct SkeletonChart: View {
    var body: some View {
        ZStack(alignment: .bottomLeading) {
            VStack(spacing: 0) {
                ForEach(0..<4, id: \.self) { _ in
                    Rectangle().fill(Color.separator).frame(height: 1)
                    Spacer(minLength: 0)
                }
                Rectangle().fill(Color.separator).frame(height: 1)
            }
            HStack(alignment: .bottom, spacing: Space.s) {
                ForEach([0.4, 0.7, 0.5, 0.85, 0.6], id: \.self) { scale in
                    SkeletonShape(width: 18, height: 140 * scale, radius: Radii.cell)
                }
            }
            .padding(.leading, Space.xl)
            .padding(.bottom, 1)
        }
        .frame(height: AdlerLayout.chartHeight)
        .clipShape(.rect(cornerRadius: Radii.chart))
        .accessibilityElement()
        .accessibilityLabel("Loading chart")
    }
}

/// The 2pt hairline shown above cached content while it refetches — a
/// refresh never blanks a screen.
struct RefreshHairline: View {
    var body: some View {
        Rectangle()
            .fill(Color.accentInk.opacity(0.6))
            .frame(height: 2)
            .accessibilityLabel("Refreshing")
    }
}

/// Fictional design data.
#Preview("Loading skeletons") {
    ScrollView {
        VStack(alignment: .leading, spacing: Space.l) {
            RefreshHairline()
            SkeletonRow()
            SkeletonRow()
            SkeletonCard()
            SkeletonChart()
        }
        .padding(AdlerLayout.screenMargin)
    }
    .background(Color.canvas)
}
