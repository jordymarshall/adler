import SwiftUI

/// The state of one dated piece of planned work (DESIGN.md §3.6, second
/// table). Label first, colour second: every state has a written label and a
/// shape that reads without colour.
///
/// `unknown` is never drawn as zero and never as `missed` — what was not
/// reported stays unknown.
nonisolated enum DayState: String, CaseIterable, Sendable, Identifiable {
    case done
    case partly
    case missed
    case unknown
    case upcoming
    /// A planned day off (`off` in the server's `goalStreak`).
    case rest
    /// Reported, but below the planned work (`short` in `goalStreak`).
    case short
    /// No action was scheduled that day. Distinct from `upcoming` and from
    /// `unknown`.
    case absent

    var id: String { rawValue }

    /// COPY.md `state.*`.
    var label: String {
        switch self {
        case .done: "Done"
        case .partly: "Partly"
        case .missed: "Didn’t happen"
        case .unknown: "Awaiting check-in"
        case .upcoming: "Upcoming"
        case .rest: "Planned day off"
        case .short: "Below the planned work"
        case .absent: "No action scheduled"
        }
    }

    /// Counted in the activity caption and the week summary.
    var isReported: Bool {
        switch self {
        case .done, .partly, .missed, .short: true
        case .unknown, .upcoming, .rest, .absent: false
        }
    }
}

/// One dated cell: the shared mark used by ``ActivityGrid``, ``StreakLane``
/// and the Goal-detail report strip.
struct DayStateCell: View {
    let state: DayState
    let goal: GoalColor
    var size: CGFloat = 9

    var body: some View {
        shape
            .frame(width: size, height: size)
            .accessibilityHidden(true)
    }

    @ViewBuilder
    private var shape: some View {
        switch state {
        case .done:
            cell.fill(goal.color)
        case .partly:
            cell.fill(goal.color.opacity(0.35))
                .overlay(alignment: .bottom) {
                    Rectangle()
                        .fill(goal.color)
                        .frame(height: size / 2)
                        .clipShape(cell)
                }
        case .short:
            cell.fill(goal.color.opacity(0.35))
                .overlay { cell.strokeBorder(goal.color, lineWidth: 1) }
        case .missed:
            cell.fill(Color.surface)
                .overlay { cell.strokeBorder(Color.separator, lineWidth: 1) }
                .overlay { DiagonalSlash().stroke(Color.inkMuted, lineWidth: 1) }
        case .unknown:
            cell.fill(Color.surface)
                .overlay {
                    cell.strokeBorder(
                        Color.separator,
                        style: StrokeStyle(lineWidth: 1, dash: [1.5, 1.5])
                    )
                }
        case .upcoming:
            cell.fill(Color.surfaceSunken)
        case .rest:
            // `accentLime` is `#D6E9A7` in both appearances, which is 1.30:1 on light paper —
            // far under the 3:1 non-text minimum, so a planned day off was indistinguishable
            // from an empty cell. Rest is not a miss; the mark has to be visible.
            cell.fill(Color.surface)
                .overlay { Circle().fill(Color.inkMuted).frame(width: 4, height: 4) }
                .overlay { cell.strokeBorder(Color.separator, lineWidth: 1) }
        case .absent:
            cell.fill(Color.canvas)
        }
    }

    private var cell: RoundedRectangle { RoundedRectangle(cornerRadius: Radii.cell) }
}

private struct DiagonalSlash: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        path.move(to: CGPoint(x: rect.minX + 1, y: rect.maxY - 1))
        path.addLine(to: CGPoint(x: rect.maxX - 1, y: rect.minY + 1))
        return path
    }
}

/// Fictional design data.
#Preview("Day states") {
    let goal = GoalColor(hue: 142, saturation: 45)
    return VStack(alignment: .leading, spacing: Space.m) {
        ForEach(DayState.allCases) { state in
            HStack(spacing: Space.m) {
                DayStateCell(state: state, goal: goal, size: 18)
                Text(state.label).adlerText(.footnote)
            }
        }
    }
    .padding(AdlerLayout.screenMargin)
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(Color.canvas)
}
