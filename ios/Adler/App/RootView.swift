import SwiftUI

/// Three states, one switch: we do not know yet, nobody is signed in, someone is.
///
/// `SessionStore.bootstrap()` runs in `AdlerApp`; this view only renders what it decided.
struct RootView: View {
    @Environment(SessionStore.self) private var session

    #if DEBUG
    /// Hidden design-system gallery, opened by `adler://gallery`.
    @State private var gallery = GalleryPresentation.shared
    #endif

    var body: some View {
        content
            #if DEBUG
            .fullScreenCover(isPresented: $gallery.isPresented) {
                DesignSystemGallery(initialItem: gallery.item, startsLarge: gallery.largeText)
            }
            #endif
    }

    @ViewBuilder
    private var content: some View {
        switch session.state {
        case .loading:
            LaunchView()
        case .signedOut:
            // No tab bar before sign-in (DESIGN.md §2.1).
            NavigationStack { OnboardingFlowView() }
        case .signedIn:
            MainTabView()
        }
    }
}

/// The branded hold while `GET /api/app/session` answers — normally a few hundred
/// milliseconds. The wordmark, not a spinner: a spinner would promise work that is not
/// happening, and this screen is usually gone before it could turn once.
struct LaunchView: View {
    var body: some View {
        ZStack {
            Color.canvas.ignoresSafeArea()
            Text("Adler")
                .adlerText(.display)
                .foregroundStyle(Color.inkHeading)
        }
        .accessibilityElement()
        .accessibilityLabel("Adler")
    }
}

#Preview {
    LaunchView()
}
