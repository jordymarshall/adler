import SwiftUI

/// A horizontal, scroll-snapping rail of a goal's markers (DESIGN.md §4.14).
///
/// Selecting a milestone **scopes the action canvas below it**. Completing a
/// milestone is a separate verification control inside its detail — never a
/// by-product of completing an action, which is why a marker's state mark is
/// `checkmark.seal` (verified) and not a plain tick.
struct MilestoneRail: View {
    let markers: [MilestoneMarker]
    let goal: GoalColor
    @Binding var selection: MilestoneMarker.ID?

    var body: some View {
        ScrollView(.horizontal) {
            HStack(spacing: Space.m) {
                ForEach(markers) { marker in
                    Button {
                        selection = marker.id
                    } label: {
                        MilestoneCard(marker: marker, goal: goal, isSelected: marker.id == selection)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(marker.accessibilityLabel)
                    .accessibilityAddTraits(marker.id == selection ? [.isButton, .isSelected] : .isButton)
                }
            }
            .scrollTargetLayout()
            .padding(.vertical, Space.xxs)
        }
        .scrollTargetBehavior(.viewAligned)
        .scrollIndicators(.hidden)
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Milestones, checkpoints and reviews")
    }
}

private struct MilestoneCard: View {
    let marker: MilestoneMarker
    let goal: GoalColor
    let isSelected: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: Space.xxs) {
            HStack(spacing: Space.xs) {
                Text(marker.kind.label)
                    .adlerText(.eyebrow)
                    .foregroundStyle(Color.inkMuted)
                Spacer(minLength: 0)
                stateMark
            }
            Text(marker.title)
                .adlerText(.caption)
                .foregroundStyle(Color.inkHeading)
                .lineLimit(2)
                .multilineTextAlignment(.leading)
            Spacer(minLength: 0)
            Text(marker.due.map { AdlerDate.short($0) } ?? "No date saved")
                .adlerText(.caption, numeric: true)
                .foregroundStyle(Color.inkMuted)
        }
        .padding(Space.s)
        .frame(width: 120, height: 72, alignment: .leading)
        .background(Color.surface, in: .rect(cornerRadius: Radii.control))
        .overlay {
            RoundedRectangle(cornerRadius: Radii.control)
                .strokeBorder(isSelected ? goal.color : Color.separator, lineWidth: isSelected ? 2 : 1)
        }
    }

    @ViewBuilder
    private var stateMark: some View {
        switch marker.state {
        case .verified:
            Image(systemName: "checkmark.seal.fill")
                .font(.caption2)
                .foregroundStyle(goal.color)
        case .open:
            Circle()
                .strokeBorder(Color.inkMuted, lineWidth: 1)
                .frame(width: 9, height: 9)
        case .review:
            Image(systemName: "calendar")
                .font(.caption2)
                .foregroundStyle(Color.inkMuted)
        }
    }
}

nonisolated struct MilestoneMarker: Identifiable, Equatable, Sendable {
    nonisolated enum Kind: String, Equatable, Sendable {
        case milestone
        case checkpoint
        case review

        var label: String {
            switch self {
            case .milestone: "MILESTONE"
            case .checkpoint: "CHECKPOINT"
            case .review: "REVIEW"
            }
        }
    }

    nonisolated enum State: String, Equatable, Sendable {
        /// Verified separately from the actions contributing to it.
        case verified
        case open
        case review

        var label: String {
            switch self {
            case .verified: "Verified"
            case .open: "Open"
            case .review: "Review"
            }
        }
    }

    let id: String
    let kind: Kind
    let title: String
    var due: Date?
    var state: State
    /// The milestone's own success criterion, always available on its detail.
    var criterion: String?

    var accessibilityLabel: String {
        var parts = [kind.label.capitalized, title, state.label]
        if let due { parts.append("due \(AdlerDate.spoken(due))") }
        if let criterion { parts.append(criterion) }
        return parts.joined(separator: ". ")
    }
}

/// Fictional design data.
#Preview("Milestone rail") {
    @Previewable @State var selection: MilestoneMarker.ID? = "m2"
    let day: TimeInterval = 86_400
    return MilestoneRail(
        markers: [
            MilestoneMarker(id: "m1", kind: .milestone, title: "Case study 1 published", due: Date().addingTimeInterval(-10 * day), state: .verified, criterion: "Live on the site"),
            MilestoneMarker(id: "m2", kind: .milestone, title: "Case study 2 drafted", due: Date().addingTimeInterval(7 * day), state: .open, criterion: "1,200 words reviewed"),
            MilestoneMarker(id: "m3", kind: .checkpoint, title: "2 case studies", due: Date().addingTimeInterval(14 * day), state: .open),
            MilestoneMarker(id: "m4", kind: .review, title: "Plan review", due: Date().addingTimeInterval(21 * day), state: .review),
            MilestoneMarker(id: "m5", kind: .milestone, title: "Case study 3 published", due: nil, state: .open)
        ],
        goal: GoalColor(hue: 142, saturation: 45),
        selection: $selection
    )
    .padding(AdlerLayout.screenMargin)
    .frame(maxHeight: .infinity, alignment: .top)
    .background(Color.canvas)
}
