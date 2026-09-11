import SwiftUI

/// What a not-yet-built screen looks like: its name and the route that reached it, so a wrong
/// push is visible instead of silent. Every use of this disappears as the feature agents land
/// their screens.
struct AdlerPlaceholder: View {
    let name: String
    let route: String

    var body: some View {
        ZStack {
            Color.canvas.ignoresSafeArea()
            VStack(spacing: Space.s) {
                Text(name)
                    .adlerText(.title1)
                    .foregroundStyle(Color.inkHeading)
                Text(route)
                    .adlerText(.footnote, numeric: true)
                    .foregroundStyle(Color.inkMuted)
                    .multilineTextAlignment(.center)
            }
            .padding(AdlerLayout.screenMargin)
        }
    }
}

/// The destination for a pushed route whose feature view does not exist yet.
/// `MainTabView.destination(_:)` names the view each route expects.
struct PlaceholderDetailView: View {
    let name: String
    let route: String

    var body: some View {
        AdlerPlaceholder(name: name, route: route)
            .navigationTitle(name)
            .navigationBarTitleDisplayMode(.inline)
    }
}

#Preview {
    NavigationStack {
        PlaceholderDetailView(name: "Milestone", route: "goal g1 · milestone m2")
    }
}
