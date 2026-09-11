import SwiftUI

/// The three Today cards: horizontal paging, a Liquid Glass pager pill and
/// Back/Next buttons. Swiping, the pill and the buttons are three equivalent
/// routes to the same state (DESIGN.md §5.4).
///
/// Inactive cards are hidden from VoiceOver and take no hits, so the deck
/// reads as one card at a time. Paging keeps working under Reduce Motion —
/// only the decoration stops.
struct CardDeck<Content: View>: View {
    /// Short titles, one per card: `Do`, `Progress`, `Learn`.
    let titles: [String]
    /// Full VoiceOver labels, one per card, e.g.
    /// `1 of 3: What you need to do today`.
    let accessibilityLabels: [String]
    @Binding var selection: Int
    @ViewBuilder let content: (Int) -> Content

    @State private var scrolledID: Int?

    var body: some View {
        VStack(spacing: Space.m) {
            PageIndicator(titles: titles, selection: $selection)

            ScrollView(.horizontal) {
                LazyHStack(spacing: 0) {
                    ForEach(titles.indices, id: \.self) { index in
                        content(index)
                            .containerRelativeFrame(.horizontal)
                            .id(index)
                            .accessibilityElement(children: .contain)
                            .accessibilityLabel(label(index))
                            .accessibilityHidden(index != selection)
                            .allowsHitTesting(index == selection)
                    }
                }
                .scrollTargetLayout()
            }
            .scrollTargetBehavior(.paging)
            .scrollIndicators(.hidden)
            .scrollPosition(id: $scrolledID)
            .onChange(of: scrolledID) { _, new in
                if let new, new != selection { selection = new }
            }
            .onChange(of: selection) { _, new in
                if scrolledID != new { scrolledID = new }
            }
            .onAppear { scrolledID = selection }

            DeckFooter(count: titles.count, selection: $selection)
        }
    }

    private func label(_ index: Int) -> String {
        guard accessibilityLabels.indices.contains(index) else {
            return "\(index + 1) of \(titles.count): \(titles[index])"
        }
        return accessibilityLabels[index]
    }
}

/// The pager pill — the one piece of custom Liquid Glass in the app.
/// Each segment is a button, so the pill is not decoration.
struct PageIndicator: View {
    let titles: [String]
    @Binding var selection: Int
    @Environment(\.adlerMotion) private var motion

    var body: some View {
        HStack(spacing: Space.xs) {
            ForEach(titles.indices, id: \.self) { index in
                Button {
                    withAnimation(motion.feedback) { selection = index }
                } label: {
                    Text("\(numberLabel(index)) \(titles[index])")
                        .adlerText(.caption, numeric: true)
                        .foregroundStyle(index == selection ? Color.inkHeading : Color.inkMuted)
                        .padding(.horizontal, Space.s)
                        .padding(.vertical, Space.xs + 2)
                        .background {
                            if index == selection {
                                Capsule().fill(Color.surface.opacity(0.9))
                            }
                        }
                }
                .buttonStyle(.plain)
                .accessibilityLabel("\(titles[index]), \(index + 1) of \(titles.count)")
                .accessibilityAddTraits(index == selection ? [.isSelected] : [])
            }
        }
        .padding(Space.xs)
        .adlerGlassCapsule()
        .accessibilityElement(children: .contain)
    }

    private func numberLabel(_ index: Int) -> String {
        String(format: "%02d", index + 1)
    }
}

private struct DeckFooter: View {
    let count: Int
    @Binding var selection: Int
    @Environment(\.adlerMotion) private var motion

    var body: some View {
        HStack {
            Button {
                withAnimation(motion.feedback) { selection = max(0, selection - 1) }
            } label: {
                Label("Back", systemImage: "chevron.left")
                    .labelStyle(.titleAndIcon)
            }
            .disabled(selection == 0)
            .accessibilityLabel("Previous card")

            Spacer()

            Text("\(String(format: "%02d", selection + 1)) / \(String(format: "%02d", count))")
                .adlerText(.caption, numeric: true)
                .foregroundStyle(Color.inkMuted)
                .accessibilityLabel("Card \(selection + 1) of \(count)")

            Spacer()

            Button {
                withAnimation(motion.feedback) { selection = min(count - 1, selection + 1) }
            } label: {
                Label("Next", systemImage: "chevron.right")
                    .labelStyle(TrailingIconLabelStyle())
            }
            .disabled(selection == count - 1)
            .accessibilityLabel("Next card")
        }
        .adlerText(.subhead)
        .buttonStyle(.plain)
        .foregroundStyle(Color.accentInk)
        .frame(minHeight: AdlerLayout.minimumHitTarget)
        .padding(.horizontal, AdlerLayout.screenMargin)
    }
}

private struct TrailingIconLabelStyle: LabelStyle {
    func makeBody(configuration: Configuration) -> some View {
        HStack(spacing: Space.xs) {
            configuration.title
            configuration.icon
        }
    }
}

/// Fictional design data.
#Preview("Card deck") {
    @Previewable @State var selection = 0
    return VStack {
        CardDeck(
            titles: ["Do", "Progress", "Learn"],
            accessibilityLabels: [
                "1 of 3: What you need to do today",
                "2 of 3: Your progress",
                "3 of 3: What we’re learning"
            ],
            selection: $selection
        ) { index in
            VStack(alignment: .leading, spacing: Space.m) {
                Text(["What you need to do today", "Your progress", "What we’re learning"][index])
                    .adlerText(.title2)
                    .foregroundStyle(Color.inkHeading)
                Text("Card content \(index + 1)")
                    .adlerText(.callout)
                    .foregroundStyle(Color.inkMuted)
                Spacer()
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(AdlerLayout.todayCardPadding)
            .adlerCard(.card, radius: Radii.largeCard)
            .padding(.horizontal, Space.m)
        }
    }
    .frame(maxHeight: .infinity)
    .background(Color.canvas)
}
