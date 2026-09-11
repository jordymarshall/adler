import SwiftUI

/// Today 01 Do: **reported done today / actions scheduled today**.
///
/// Never a percentage across goals, and never the only place the count
/// appears — the lineup underneath lists the same actions.
/// With nothing scheduled it reads `—`, not `0`.
struct ProgressRing: View {
    let done: Int
    let total: Int
    var size: CGFloat = 72

    private var fraction: Double {
        guard total > 0 else { return 0 }
        return min(1, Double(done) / Double(total))
    }

    var body: some View {
        VStack(spacing: Space.xs) {
            ZStack {
                Circle()
                    .stroke(Color.surfaceSunken, lineWidth: 8)
                Circle()
                    .trim(from: 0, to: fraction)
                    .stroke(Color.accentInk, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                Text(total > 0 ? "\(done)/\(total)" : "—")
                    .adlerText(.headline, numeric: true)
                    .foregroundStyle(Color.inkHeading)
            }
            .frame(width: size, height: size)

            Text(total > 0 ? "reported done today" : "nothing scheduled")
                .adlerText(.caption)
                .foregroundStyle(Color.inkMuted)
                .multilineTextAlignment(.center)
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(
            total > 0
                ? "\(done) of \(total) actions reported done today"
                : "Nothing scheduled today"
        )
    }
}

/// Fictional design data.
#Preview("Progress ring") {
    HStack(spacing: Space.xxl) {
        ProgressRing(done: 1, total: 3)
        ProgressRing(done: 3, total: 3)
        ProgressRing(done: 0, total: 0)
    }
    .padding(AdlerLayout.screenMargin)
    .background(Color.canvas)
}
