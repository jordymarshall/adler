import Foundation
import Observation

// MARK: - Typed navigation paths

/// Goals tab stack (DESIGN.md §2.2).
nonisolated enum GoalsRoute: Hashable, Sendable {
    case goal(id: String)
    case milestone(goalId: String, id: String)
    case actionHistory(goalId: String, actionId: String)
}

/// Coach tab stack. `.record` is a learning record; `.source` is one evidence claim behind it.
nonisolated enum CoachRoute: Hashable, Sendable {
    case conversation(id: String)
    case record(id: String)
    case source(claimId: String)
}

/// Calendar tab stack.
nonisolated enum CalendarRoute: Hashable, Sendable {
    case day(date: YMD)
}

/// The Coach root is segmented, not stacked (DESIGN.md §2.2).
nonisolated enum CoachSegment: String, Hashable, Sendable, CaseIterable {
    case conversation
    case insights
}

// MARK: - Router

/// The one place that decides which tab is showing, what is pushed on it, and whether Settings
/// is up. Feature screens never mutate a `NavigationPath` themselves; they call the methods
/// below so a deep link, a tap and a notification all take the same road.
///
/// Selection state that a root screen *binds* to — the Today card, the Coach segment, the
/// Calendar week — lives here too, because a deep link sets it.
@MainActor
@Observable
final class AppRouter {
    // MARK: Selection

    var selection: AppTab = .today

    /// Today is a card deck, not a stack (DESIGN.md §2.2): the deck binds to this.
    var todayCard: TodayCard = .doNext
    /// Coach root segment.
    var coachSegment: CoachSegment = .conversation
    /// Monday of the week the Calendar root shows. `nil` = the current week.
    var calendarWeekStart: YMD?

    // MARK: Stacks

    var goalsPath: [GoalsRoute] = []
    var coachPath: [CoachRoute] = []
    var calendarPath: [CalendarRoute] = []

    // MARK: Sheets

    var isSettingsPresented = false
    /// The Settings page a deep link asked for; Settings reads it once it is on screen.
    var settingsPage: SettingsPage?

    // MARK: Banner

    /// `error.deepLinkMissing`. Set by `handle(url:)` for an unparseable `adler://` URL and by a
    /// feature screen whose deep-linked record turned out to be gone (DESIGN.md §2.4).
    var deepLinkMissing = false

    /// The last route this router acted on, kept so a screen can read the *secondary*
    /// identifiers a route carries that the shell has no use for — `message`, `decision`,
    /// `memory`, and the `record` on a goal link. Cleared on sign-out.
    private(set) var lastRoute: AppRoute?

    init() {
        #if DEBUG
        // Screenshot hook for the global banner slot, which otherwise only appears when the
        // network or the session is actually broken.
        deepLinkMissing = ProcessInfo.processInfo.arguments.contains("-deepLinkBanner")
        #endif
    }

    // MARK: - Tabs and stacks

    func selectTab(_ tab: AppTab) {
        selection = tab
    }

    func push(_ route: GoalsRoute) {
        selection = .goals
        goalsPath.append(route)
    }

    func push(_ route: CoachRoute) {
        selection = .coach
        coachPath.append(route)
    }

    func push(_ route: CalendarRoute) {
        selection = .calendar
        calendarPath.append(route)
    }

    /// Pops one level off the tab that is showing.
    func pop() {
        switch selection {
        case .today: break
        case .goals: if !goalsPath.isEmpty { goalsPath.removeLast() }
        case .coach: if !coachPath.isEmpty { coachPath.removeLast() }
        case .calendar: if !calendarPath.isEmpty { calendarPath.removeLast() }
        }
    }

    func popToRoot(_ tab: AppTab? = nil) {
        switch tab ?? selection {
        case .today: break
        case .goals: goalsPath.removeAll()
        case .coach: coachPath.removeAll()
        case .calendar: calendarPath.removeAll()
        }
    }

    // MARK: - Sheets

    func presentSettings(page: SettingsPage? = nil) {
        settingsPage = page
        isSettingsPresented = true
    }

    func dismissSettings() {
        isSettingsPresented = false
        settingsPage = nil
    }

    // MARK: - Named destinations

    func openToday(card: TodayCard = .doNext) {
        selection = .today
        todayCard = card
    }

    func openGoal(id: String) {
        selection = .goals
        goalsPath = [.goal(id: id)]
    }

    func openConversation(id: String) {
        selection = .coach
        coachSegment = .conversation
        coachPath = [.conversation(id: id)]
    }

    /// A learning record, reached through the Insights segment.
    func openRecord(id: String) {
        selection = .coach
        coachSegment = .insights
        coachPath = [.record(id: id)]
    }

    func openCalendar(weekStart: YMD? = nil) {
        selection = .calendar
        calendarWeekStart = weekStart
        calendarPath.removeAll()
    }

    // MARK: - Deep links

    /// Returns `true` when the URL was an `adler://` destination this router acted on.
    /// A non-`adler` URL is not ours and is ignored; an `adler://` URL that parses to nothing
    /// raises `error.deepLinkMissing` rather than dropping the person on a blank screen.
    @discardableResult
    func handle(url: URL) -> Bool {
        guard url.scheme?.lowercased() == AppRoute.scheme else { return false }
        guard let route = AppRoute(url: url) else {
            deepLinkMissing = true
            return false
        }
        go(route)
        return true
    }

    func go(_ route: AppRoute) {
        deepLinkMissing = false
        lastRoute = route

        switch route {
        case .today(let card):
            openToday(card: card)
        case .goals:
            selection = .goals
            goalsPath.removeAll()
        case .goal(let id, _):
            openGoal(id: id)
        case .coach:
            selection = .coach
            coachSegment = .conversation
            coachPath.removeAll()
        case .conversation(let id, _):
            openConversation(id: id)
        case .insights(let recordId, _, _):
            selection = .coach
            coachSegment = .insights
            coachPath = recordId.map { [.record(id: $0)] } ?? []
        case .calendar(let start, _):
            openCalendar(weekStart: start)
        case .settings(let page):
            // Settings is a sheet over whichever tab is showing, so the tab is left alone.
            presentSettings(page: page)
        }
    }

    /// Back to a signed-out shell: nothing pushed, nothing presented, no stale identifiers.
    func reset() {
        selection = .today
        todayCard = .doNext
        coachSegment = .conversation
        calendarWeekStart = nil
        goalsPath.removeAll()
        coachPath.removeAll()
        calendarPath.removeAll()
        dismissSettings()
        deepLinkMissing = false
        lastRoute = nil
    }
}
