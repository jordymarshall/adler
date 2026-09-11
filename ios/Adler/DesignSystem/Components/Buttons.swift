import SwiftUI

/// The prominent control on a card: system Liquid Glass, tinted
/// `accentGreen`, minimum 44pt target.
struct AdlerPrimaryButton: View {
    let title: String
    var systemImage: String?
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: Space.xs) {
                if let systemImage { Image(systemName: systemImage) }
                Text(title).adlerText(.subhead).lineLimit(1).fixedSize()
            }
            .frame(minHeight: AdlerLayout.minimumHitTarget - Space.l)
            .padding(.horizontal, Space.m)
        }
        .buttonStyle(.glassProminent)
        .tint(Color.accentGreen)
    }
}

/// A secondary control: bordered, `ink` label.
struct AdlerSecondaryButton: View {
    let title: String
    var systemImage: String?
    var isEnabled: Bool = true
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: Space.xs) {
                if let systemImage { Image(systemName: systemImage) }
                Text(title).adlerText(.subhead).lineLimit(1).fixedSize()
            }
            .frame(minHeight: AdlerLayout.minimumHitTarget - Space.l)
            .padding(.horizontal, Space.m)
        }
        .buttonStyle(.bordered)
        .tint(Color.accentInk)
        .disabled(!isEnabled)
    }
}

/// A quiet control: plain `subhead` in `inkMuted`, same 44pt target as the
/// prominent one. Used for `No thanks` / `Discuss` / `Edit` / `Dismiss`, so
/// declining is never harder to hit than agreeing.
struct AdlerQuietButton: View {
    let title: String
    var systemImage: String?
    /// A disclosure chevron reads as trailing; a leading icon reads as a
    /// category mark. Both keep the same 44pt target.
    var symbolTrailing: Bool = false
    var role: ButtonRole?
    let action: () -> Void

    var body: some View {
        Button(role: role, action: action) {
            HStack(spacing: Space.xs) {
                if let systemImage, !symbolTrailing { Image(systemName: systemImage) }
                Text(title).adlerText(.subhead).lineLimit(1).fixedSize()
                if let systemImage, symbolTrailing {
                    Image(systemName: systemImage).font(.caption2)
                }
            }
            .foregroundStyle(role == .destructive ? Color.danger : Color.inkMuted)
            .frame(minHeight: AdlerLayout.minimumHitTarget)
            .contentShape(.rect)
        }
        .buttonStyle(.plain)
    }
}

/// Fictional design data.
#Preview("Buttons") {
    VStack(alignment: .leading, spacing: Space.l) {
        AdlerPrimaryButton(title: "Try this") {}
        AdlerSecondaryButton(title: "Report") {}
        AdlerSecondaryButton(title: "Report", isEnabled: false) {}
        AdlerQuietButton(title: "No thanks") {}
        AdlerQuietButton(title: "Delete goal", role: .destructive) {}
    }
    .padding(AdlerLayout.screenMargin)
    .frame(maxWidth: .infinity, alignment: .leading)
    .background(Color.canvas)
}
