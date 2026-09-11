import SwiftUI

/// Elevation levels from DESIGN.md §3.4.
nonisolated enum Elevation {
    /// Level 1 — cards, rows, sheets' inner content.
    case card
    /// Level 2 — RecommendationCard and ProposalCard only.
    case raised
    /// Level 0 — no shadow, border only (used inside already-raised surfaces).
    case flat

    var shadowRadius: CGFloat {
        switch self {
        case .flat: 0
        case .card: 12
        case .raised: 20
        }
    }

    var shadowOffset: CGFloat {
        switch self {
        case .flat: 0
        case .card: 4
        case .raised: 8
        }
    }
}

extension View {
    /// Card background: `surface` fill, 1pt `separator` border, and — in
    /// light appearance only — the brand shadow. Dark uses the border alone,
    /// as specified.
    func adlerCard(
        _ elevation: Elevation = .card,
        radius: CGFloat = Radii.card,
        fill: Color = .surface
    ) -> some View {
        modifier(AdlerCardModifier(elevation: elevation, radius: radius, fill: fill))
    }

    /// Inset well: `surfaceSunken` fill, no border, no shadow. Used for
    /// quiet prompts, limitation blocks and unavailable-reason blocks.
    func adlerWell(radius: CGFloat = Radii.control, padding: CGFloat = Space.m) -> some View {
        self
            .padding(padding)
            .background(Color.surfaceSunken, in: .rect(cornerRadius: radius))
    }

    /// Level 3 sheet backing: system material plus a `surface` content
    /// plate, radius 22.
    func adlerSheetSurface() -> some View {
        self
            .background(Color.surface)
            .background(.regularMaterial)
    }

    /// The one piece of custom Liquid Glass in the app (DESIGN.md §3.4):
    /// the Today deck pager pill. Everything else uses system glass
    /// unmodified.
    ///
    /// Falls back to an opaque `surfaceSunken` capsule when the person has
    /// turned on Reduce Transparency, so the label keeps its contrast.
    func adlerGlassCapsule() -> some View {
        modifier(AdlerGlassCapsuleModifier())
    }
}

private struct AdlerCardModifier: ViewModifier {
    let elevation: Elevation
    let radius: CGFloat
    let fill: Color
    @Environment(\.colorScheme) private var colorScheme

    func body(content: Content) -> some View {
        content
            .background(fill, in: .rect(cornerRadius: radius))
            .overlay {
                RoundedRectangle(cornerRadius: radius)
                    .strokeBorder(Color.separator, lineWidth: 1)
            }
            .shadow(
                color: shadowColor,
                radius: elevation.shadowRadius,
                y: elevation.shadowOffset
            )
    }

    private var shadowColor: Color {
        guard colorScheme != .dark, elevation != .flat else { return .clear }
        return Color(.sRGB, red: 0x28 / 255, green: 0x3C / 255, blue: 0x32 / 255, opacity: 0.04)
    }
}

private struct AdlerGlassCapsuleModifier: ViewModifier {
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency

    func body(content: Content) -> some View {
        if reduceTransparency {
            content
                .background(Color.surfaceSunken, in: .capsule)
                .overlay { Capsule().strokeBorder(Color.separator, lineWidth: 1) }
        } else {
            content
                .glassEffect(.regular.tint(Color.accentGreen.opacity(0.12)), in: .capsule)
        }
    }
}
