import SwiftUI

/// The signed-in shell: four tabs, one `NavigationStack` each, and Settings as a sheet over
/// whichever tab is showing (DESIGN.md §2.1). Title, global banner slot and avatar come from
/// `.tabRoot(_:)` at the bottom of this file, so a feature root adds none of them.
struct MainTabView: View {
    @Environment(AppRouter.self) private var router
    /// Settings › Appearance. Device-local (the workspace stores only light/dark), applied here
    /// so the whole signed-in shell follows it — see Features/Settings/SettingsSupport.swift.
    @State private var appearance = AppearanceStore.shared

    var body: some View {
        @Bindable var router = router

        TabView(selection: $router.selection) {
            Tab("Today", systemImage: "sun.max", value: AppTab.today) {
                // Today is a card deck: sheets only, nothing pushes (DESIGN.md §2.2).
                NavigationStack {
                    TodayRootView().tabRoot("Today")
                }
            }

            Tab("Goals", systemImage: "target", value: AppTab.goals) {
                NavigationStack(path: $router.goalsPath) {
                    GoalsRootView()
                        .tabRoot("Goals")
                        .navigationDestination(for: GoalsRoute.self) { destination($0) }
                }
            }

            Tab("Coach", systemImage: "bubble.left.and.bubble.right", value: AppTab.coach) {
                NavigationStack(path: $router.coachPath) {
                    CoachRootView()
                        .tabRoot("Coach")
                        .navigationDestination(for: CoachRoute.self) { destination($0) }
                }
            }

            Tab("Calendar", systemImage: "calendar", value: AppTab.calendar) {
                NavigationStack(path: $router.calendarPath) {
                    CalendarRootView()
                        .tabRoot("Calendar")
                        .navigationDestination(for: CalendarRoute.self) { destination($0) }
                }
            }
        }
        .tabBarMinimizeBehavior(.onScrollDown)
        .tint(Color.accentInk)
        .preferredColorScheme(appearance.colorScheme)
        .sheet(isPresented: $router.isSettingsPresented) {
            SettingsRootView()
                .presentationDetents([.large])
                .presentationDragIndicator(.visible)
        }
    }

    // MARK: - Destinations
    //
    // Each case names the view the feature agent is expected to provide. Until it exists the
    // route resolves to `PlaceholderDetailView`, which prints the route so a wrong push is
    // visible rather than silent. See `App/README.md`.

    @ViewBuilder
    private func destination(_ route: GoalsRoute) -> some View {
        switch route {
        case .goal(let id):
            GoalDetailRootView(goalId: id)
        case .milestone(let goalId, let id):
            MilestoneDetailView(goalId: goalId, milestoneId: id)
        case .actionHistory(let goalId, let actionId):
            ActionHistoryView(goalId: goalId, actionId: actionId)
        }
    }

    @ViewBuilder
    private func destination(_ route: CoachRoute) -> some View {
        switch route {
        case .conversation(let id):
            ConversationView(conversationId: id)
        case .record(let id):
            LearningRecordView(recordId: id)
        case .source(let claimId):
            EvidenceSourceView(claimId: claimId)
        }
    }

    @ViewBuilder
    private func destination(_ route: CalendarRoute) -> some View {
        switch route {
        case .day(let date):
            DayDetailView(date: date)
        }
    }
}

// MARK: - Tab root chrome

extension View {
    /// Every tab root wears the same chrome: its title, the global banner slot, and the
    /// trailing avatar that opens Settings. Feature roots add their own toolbar items; the
    /// `ToolbarSpacer` before the avatar keeps those in a separate Liquid Glass group.
    func tabRoot(_ title: String) -> some View {
        modifier(TabRootChrome(title: title))
    }
}

private struct TabRootChrome: ViewModifier {
    let title: String
    @Environment(AppRouter.self) private var router

    func body(content: Content) -> some View {
        content
            // Below the navigation bar, above the screen's content: the banner must not cover
            // the title or the avatar, because `Sign in` and `Settings` are how you fix what
            // it is reporting. Pushed details show their own errors (Core/README.md §3); a
            // detail that wants the global slot can place `AppErrorBanner()` itself.
            .safeAreaInset(edge: .top, spacing: 0) { AppErrorBanner() }
            .navigationTitle(title)
            .toolbar {
                ToolbarSpacer(.fixed, placement: .topBarTrailing)
                ToolbarItem(placement: .topBarTrailing) {
                    Button { router.presentSettings() } label: {
                        MonogramAvatar()
                    }
                    .accessibilityLabel("Open settings")
                }
            }
    }
}

/// 28pt monogram: the first letter of the username on lime, in green (DESIGN.md §2.1).
/// No photo, no gravatar — the app has no picture of anyone and will not invent one.
struct MonogramAvatar: View {
    @Environment(SessionStore.self) private var session

    private var initial: String {
        let username = session.user?.username ?? ""
        return username.first.map { String($0).uppercased() } ?? "A"
    }

    var body: some View {
        Text(initial)
            .adlerText(.subhead)
            .foregroundStyle(Color.accentGreen)
            .frame(width: 28, height: 28)
            .background(Color.accentLime, in: .circle)
    }
}
