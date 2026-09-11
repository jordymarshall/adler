# App — the shell

Everything that is true of the whole app lives here: the scene, the stores, the tab bar, the
navigation stacks, the Settings sheet and the one global banner slot. Feature code owns screens;
the shell owns *where a screen appears and how you get there*.

Specification: [`ios/DESIGN.md`](../../DESIGN.md) §2. Store API: [`Core/README.md`](../Core/README.md).

```
App/
  AdlerApp.swift               @main. Creates the stores once, wires ScenePhase and deep links.
  RootView.swift               .loading / .signedOut / .signedIn, plus LaunchView.
  MainTabView.swift            Four tabs, four NavigationStacks, the avatar toolbar, Settings.
  AppRouter.swift              Tab selection, typed paths, sheets, deep links.
  AppErrorBanner.swift         The global banner slot.
  PlaceholderDetailView.swift  What a screen looks like before its feature agent lands.
  NavigationBarAppearance.swift  Adler Warm in UIKit-drawn navigation titles.
```

---

## 1. How the shell composes features

`AdlerApp` builds one `APIClient` (private), one `ViewCache`, and then `SessionStore`,
`WorkspaceStore`, `SSEClient`, `ConnectivityMonitor` and `AppRouter`, and puts the five
observable ones in the environment:

```swift
@Environment(SessionStore.self) private var session
@Environment(WorkspaceStore.self) private var workspace
@Environment(AppRouter.self) private var router
@Environment(SSEClient.self) private var sse
@Environment(ConnectivityMonitor.self) private var connectivity
```

There is no `APIClient` in the environment on purpose: feature code reads views off the two
stores and calls their mutation methods (`Core/README.md` §1). The onboarding draft is
`session.draft` (a `PendingDraft`), not a separate environment value.

`RootView` switches on `SessionStore.state`. `.signedOut` shows `OnboardingFlowView` inside its
own `NavigationStack` — there is no tab bar before sign-in. `.signedIn` shows `MainTabView`.

`MainTabView` gives each tab a `NavigationStack` bound to a typed path on `AppRouter` and
applies `.tabRoot(_:)`, which adds the navigation title, the global banner slot and the trailing
monogram avatar. **A feature root does not add its own title, avatar or banner.** It may add its
own toolbar items; a `ToolbarSpacer(.fixed)` already separates them from the avatar.

### Lifecycle the shell already handles

- `session.bootstrap()` and `workspace.restoreFromCache()` on launch.
- `ScenePhase`: `.active` starts `ConnectivityMonitor` and `SSEClient` and refreshes the session
  and every visible view; `.background` stops both. `.inactive` is deliberately ignored (app
  switcher, Control Centre).
- SSE revisions go to `WorkspaceStore.handleRevisionEvent(_:)`; reconnects call
  `refreshVisible()`. A screen only has to call `workspace.markVisible(_:)` / `markHidden(_:)`.
- Sign-out resets the workspace, the router and the stream.

---

## 2. Placeholder types feature agents must keep

Each file below is a stand-in. **Keep the type name and the initialiser signature**; replace the
body. `MainTabView` and `AppRouter` reference these names directly.

| File | Type | Init |
| --- | --- | --- |
| `Features/Onboarding/OnboardingFlowView.swift` | `OnboardingFlowView` | `()` |
| `Features/Today/TodayRootView.swift` | `TodayRootView` | `()` |
| `Features/Goals/GoalsRootView.swift` | `GoalsRootView` | `()` |
| `Features/GoalDetail/GoalDetailRootView.swift` | `GoalDetailRootView` | `(goalId: String)` |
| `Features/Coach/CoachRootView.swift` | `CoachRootView` | `()` |
| `Features/Calendar/CalendarRootView.swift` | `CalendarRootView` | `()` |
| `Features/Settings/SettingsRootView.swift` | `SettingsRootView` | `()` |

`SettingsRootView` is presented as a `.large` sheet, so it owns its own `NavigationStack` and its
own `Close` control. Everything else is already inside the shell's stack.

The pushed destinations are still placeholders. When you build one, replace the corresponding
branch of `MainTabView.destination(_:)` with the view named here:

| Route | Expected view | Owner |
| --- | --- | --- |
| `GoalsRoute.goal(id:)` | `GoalDetailRootView(goalId:)` — already wired | GoalDetail |
| `GoalsRoute.milestone(goalId:id:)` | `MilestoneDetailView(goalId:milestoneId:)` | GoalDetail |
| `GoalsRoute.actionHistory(goalId:actionId:)` | `ActionHistoryView(goalId:actionId:)` | GoalDetail |
| `CoachRoute.conversation(id:)` | `ConversationView(conversationId:)` | Coach |
| `CoachRoute.record(id:)` | `LearningRecordView(recordId:)` | Coach |
| `CoachRoute.source(claimId:)` | `EvidenceSourceView(claimId:)` | Coach |
| `CalendarRoute.day(date:)` | `DayDetailView(date:)` | Calendar |

Keep the route cases as they are; if you need another destination, add a case to the enum in
`AppRouter.swift` and a branch in `MainTabView`, and say so in your report.

### The DEBUG sign-in button

`OnboardingFlowView` carries an `#if DEBUG` "Developer sign-in" control that signs in as a
fictional local account. It exists because the real onboarding does not yet, and `ShellUITests`
depends on it (`app.buttons["Developer sign-in"]`). Keep it behind `#if DEBUG` or tell the
orchestrator you removed it, so the UI tests can be updated in the same change.

---

## 3. Pushing a route

Never mutate a `NavigationPath` from a screen. Call the router:

```swift
@Environment(AppRouter.self) private var router

router.push(.goal(id: goal.id))                    // selects Goals, then pushes
router.push(.milestone(goalId: goal.id, id: m.id))
router.pop()                                       // pops the tab that is showing
router.popToRoot()                                 // or popToRoot(.coach)
```

`push` picks the owning tab from the route type, so the three enums never mix up a stack.

Named destinations, for when you have an id rather than a stack position — each one *replaces*
the tab's stack, which is what a link or a notification should do:

| Call | Lands on |
| --- | --- |
| `selectTab(_:)` | that tab, stack untouched |
| `openToday(card:)` | Today, that card of the deck |
| `openGoal(id:)` | Goals → Goal detail |
| `openConversation(id:)` | Coach → Conversation segment → that conversation |
| `openRecord(id:)` | Coach → Insights segment → that learning record |
| `openCalendar(weekStart:)` | Calendar, that week |
| `presentSettings(page:)` | Settings sheet over the current tab |
| `go(_ route: AppRoute)` | whatever the route says |
| `handle(url:)` | parses, then `go` |

Root screens bind to the selection state the router holds: `router.todayCard`,
`router.coachSegment`, `router.calendarWeekStart`, `router.settingsPage`. Read
`router.lastRoute` when you need the secondary identifiers a link carried — `message`,
`decision`, `memory`, or the `record` on a goal link — which the shell does not act on itself.

---

## 4. Presenting a sheet

Sheets are decisions and edits, never navigation (DESIGN.md §2.3). The shell owns exactly one:
Settings. **Every other sheet belongs to the screen that raises it**, with `@State` local to that
screen and the detents from DESIGN.md §2.3:

```swift
.sheet(isPresented: $isReporting) {
    ReportSheet(...)
        .presentationDetents([.height(420), .large])
        .presentationDragIndicator(.visible)
}
```

Do not add a sheet flag to `AppRouter` unless a **deep link** has to open it.

---

## 5. Adding a deep link

1. Add the case to `AppRoute` in `Core/State/AppRoute.swift` (parse **and** build), with a test
   in `AdlerTests/CoreRouteTests.swift`. The contract's spelling is canonical — see DESIGN.md
   §2.4; keep any older spelling parsing too.
2. Map it in `AppRouter.go(_:)`. If it needs a new stack position, add the case to
   `GoalsRoute` / `CoachRoute` / `CalendarRoute` and a branch in `MainTabView.destination(_:)`.
3. Add a test to `AdlerTests/AppRouterTests.swift` asserting the tab, the path and any selection
   state.
4. Nothing else: `AdlerApp.open(_:)` already routes a live link and defers one that arrives while
   signed out (it is stored in `session.draft.pendingRoute` and replayed on sign-in).

If the id in a link turns out not to exist, set `router.deepLinkMissing = true` and show the
parent list. Never leave a blank screen.

---

## 6. The global banner slot

`AppErrorBanner` is applied by `.tabRoot(_:)`, so it sits below the navigation bar and above
every tab root's content. It reports only whole-app conditions, worst first:

1. `WorkspaceStore.sessionExpired` → `error.signedOut` + `Sign in`
2. `ConnectivityMonitor.isOnline == false` → `error.offline` + `Retry`
3. `AppRouter.deepLinkMissing` → `error.deepLinkMissing` + `Dismiss`
4. the event stream down for 5s → *Live updates are disconnected. Adler will reconnect
   automatically.* (the sentence the web app shows, `src/store.tsx`)

**A failed load, a stale revision or a refused write is not a shell condition.** Show those on
the screen that owns them with the design system's `ErrorBanner` / `StaleRevisionBanner`, per
`Core/README.md` §3 — otherwise the same problem is reported twice. A pushed detail that wants
the global slot can place `AppErrorBanner()` itself.

---

## 7. DEBUG launch arguments

`simctl openurl` cannot drive the app from a script — it raises a system confirmation dialog
nothing can tap — so the shell reads two arguments instead (the design system's `-gallery` works
the same way):

```sh
xcrun simctl launch <udid> com.withadler.app -resetSession -route adler://goals/g-1
xcrun simctl launch <udid> com.withadler.app -deepLinkBanner    # shows the banner slot
```

`-route` goes through the deferred-link path on purpose, so a screenshot run exercises the same
replay-after-sign-in code an incoming link would.
