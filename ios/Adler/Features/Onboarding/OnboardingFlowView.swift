import SwiftUI

/// The signed-out root: Welcome → goal input → account → first plan (DESIGN.md §5.1–5.3).
///
/// `RootView` supplies the `NavigationStack` (there is no tab bar before sign-in), so this view
/// is the stack's root and only registers its destinations. Keep the type name and the `()`
/// initialiser — `App/README.md` §2 has the shell wired to both.
struct OnboardingFlowView: View {
    #if DEBUG
    @Environment(SessionStore.self) private var session
    @State private var debugStep: DebugOnboardingStep?
    #endif

    var body: some View {
        WelcomeView()
            .navigationDestination(for: OnboardingStep.self) { step in
                switch step {
                case .goal:
                    GoalInputView()
                case .auth(let mode):
                    AuthView(mode: mode)
                }
            }
            #if DEBUG
            // A screenshot script cannot tap, and `simctl openurl` raises a system dialog
            // nothing can dismiss, so the screens are reachable by launch argument — the same
            // trick the shell uses for `-route` and the design system for `-gallery`:
            //
            //     xcrun simctl launch <udid> com.withadler.app -resetSession \
            //       -onboardingScreen goal -onboardingGoal "Publish 3 case studies…"
            //
            // A separate value type, so it does not collide with the real pushes above.
            .navigationDestination(item: $debugStep) { step in
                switch step {
                case .goal: GoalInputView()
                case .register: AuthView(mode: .register)
                case .login: AuthView(mode: .login)
                }
            }
            .task { applyLaunchArguments() }
            #endif
    }

    #if DEBUG
    private func applyLaunchArguments() {
        let arguments = ProcessInfo.processInfo.arguments
        if let index = arguments.firstIndex(of: "-onboardingGoal"),
            arguments.indices.contains(index + 1)
        {
            session.draft.text = arguments[index + 1]
        }
        guard let index = arguments.firstIndex(of: "-onboardingScreen"),
            arguments.indices.contains(index + 1),
            let step = DebugOnboardingStep(rawValue: arguments[index + 1])
        else { return }
        debugStep = step
    }
    #endif
}

#if DEBUG
nonisolated enum DebugOnboardingStep: String, Hashable, Sendable {
    case goal
    case register
    case login
}
#endif

/// The two pushes Welcome makes. The first-plan hand-off is pushed from `AuthView` instead,
/// because it only exists once a request has succeeded.
nonisolated enum OnboardingStep: Hashable, Sendable {
    case goal
    case auth(AuthMode)
}

nonisolated enum AuthMode: String, Hashable, Sendable, CaseIterable {
    case register
    case login

    var title: String {
        self == .register ? OnboardingCopy.authTitleRegister : OnboardingCopy.authTitleLogin
    }

    var actionTitle: String {
        self == .register ? OnboardingCopy.authTabRegister : OnboardingCopy.authTabLogin
    }
}

#Preview {
    NavigationStack { OnboardingFlowView() }
        .environment(SessionStore(client: APIClient()))
        .environment(WorkspaceStore(client: APIClient()))
        .environment(AppRouter())
}
