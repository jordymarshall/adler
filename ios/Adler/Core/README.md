# Core — networking, models, state

Core is the app's only connection to the Adler server. Feature code never builds a URL, never
parses JSON and never derives a label: it reads typed views off two stores and calls their
mutation methods.

Authority, in order: [`docs/ios-api-contract.md`](../../../docs/ios-api-contract.md) →
[`shared/app-views.ts`](../../../shared/app-views.ts) → the payloads in
[`docs/ios-api-examples/`](../../../docs/ios-api-examples). If this code and the contract ever
disagree, the contract wins and the models are wrong.

```
Core/
  Models/       Codable mirrors of shared/app-views.ts + the pre-existing endpoints
  Networking/   APIClient (actor), Endpoints, SSEClient, ConnectivityMonitor, ServerConfiguration
  State/        SessionStore, WorkspaceStore, ChangeBuilder, AppRoute, PendingDraft, ViewCache
```

---

## 1. Using the stores

Both stores are `@MainActor @Observable`. Create them once in the app shell and put them in the
environment; everything below happens on the main actor.

```swift
let client = APIClient()                       // base URL from UserDefaults, default localhost:8080
let session = SessionStore(client: client)
let workspace = WorkspaceStore(client: client)
```

### Reading a view

A screen declares what it is showing, loads it, and renders whatever is cached — a refresh never
blanks the screen.

```swift
struct TodayScreen: View {
    @Environment(WorkspaceStore.self) private var workspace

    var body: some View {
        let state = workspace.state(.today)
        Group {
            if let today = workspace.today {
                TodayDeck(today: today)                 // render cached content immediately
            } else if state.isLoading {
                LoadingSkeletons.card
            } else if let error = state.error {
                ErrorBanner(error: error) { Task { await workspace.loadToday() } }
            }
        }
        .overlay(alignment: .top) { if state.isLoading && state.hasContent { RefreshHairline() } }
        .task {
            workspace.markVisible(.today)               // so SSE refetches this view
            await workspace.loadToday()
        }
        .onDisappear { workspace.markHidden(.today) }
    }
}
```

`LoadState` is `{ isLoading, error, isStale, loadedAt }`. `isStale` means the content came off
the disk cache and has not been confirmed against the server yet.

Available caches: `today`, `goals`, `goalDetails[id]`, `coach`, `conversations[id]`, `insights`,
`learningRecords[id]`, `calendars[weekStart]`, `settings`, plus `revision`.

### Writing

Every mutation is `async throws(APIError)` and returns the refreshed views the server sent back,
which the store has already absorbed.

```swift
do {
    try await workspace.reportAction(
        id: action.id, goalId: action.goalId, outcome: .done, minutes: 25, note: note)
} catch let error as APIError {
    banner = error                  // show error.errorDescription / error.serverMessage verbatim
}
```

The mutation API:

| Method | Route |
| --- | --- |
| `apply(changes:goalId:)` | `POST /api/app/changes` — the general path |
| `reportAction` / `correctAction` | an `action` update |
| `startAction(id:goalId:)` | `POST /api/app/actions/:id/start` |
| `startGoal(id:)` | `POST /api/app/goals/:id/start` |
| `setMilestoneDone`, `addResult`, `setGoalStatus`, `deleteGoal` | `changes` |
| `updatePreferences`, `updateProgram`, `saveMemory`, `deleteMemory` | `changes` |
| `createLocalWorkBlock` / `updateWorkBlock` / `deleteWorkBlock` | `changes` |
| `learningAction(row:action:)` | `POST /api/learning` |
| `approveProposal` / `dismissProposal` / `previewProposal` | `POST /api/proposals/:id/…` |
| `sendCoachMessage(text:goalId:conversationId:focusGoalId:)` | `POST /api/coach` |
| `saveProvider`, `testProvider`, `providerStatus` | `/api/provider…` |
| `connections`, `pairPhone`, `unlinkPhone`, `createToken`, `revokeToken` | `/api/connections…`, `/api/tokens…` |
| `externalCalendars`, `checkAvailability`, `book`, `connectAppleCalendar`, `disconnectCalendar` | calendar routes |

### Coach turns

```swift
let reply = try await workspace.sendCoachMessage(text: draft, conversationId: conversation?.id)
```

The store creates the `requestId`, holds it in `pendingCoach`, and clears it on success. If the
call times out, call `retryCoachMessage()` — it resends the **same** `requestId` and the server
replays its first answer in milliseconds instead of running the model again. Never retry in a
loop: `POST /api/coach` is rate limited to 20 per minute and the limit is consumed *before* the
idempotency check.

### Live updates and scene phase

```swift
.onChange(of: scenePhase) { _, phase in
    switch phase {
    case .active:
        sse.start { revision in Task { await workspace.handleRevisionEvent(revision) } }
        Task { await workspace.refreshVisible() }
    default:
        sse.stop()
    }
}
```

`SSEClient` reads `GET /api/events`, parses `data: {"revision":N}` and reconnects with capped
backoff (1, 2, 4, 8, 16, then 30 s). A **401 stops the stream**: reconnecting into a gone cookie
every 30 s behind a signed-in-looking shell helps nobody. Set `sse.onUnauthenticated` and map it
to `workspace.noteSessionExpired()`.

`ConnectivityMonitor` (NWPathMonitor) drives the offline banner and fires `onReconnect` when the
network comes back. `NWPathMonitor.cancel()` is terminal, so the monitor is **recreated on every
`start()`** — assign `onReconnect` before calling `start()`, because the first path update
arrives immediately.

### Deep links

```swift
.onOpenURL { url in
    guard let route = AppRoute(url: url) else { return }        // unknown → parent list + banner
    if session.state.isSignedIn { router.go(route) } else { draft.pendingRoute = route }
}
```

`AppRoute` accepts both spellings in circulation: the app's own (`adler://goal/<id>`,
`adler://coach/insights?record=<id>`) and the server's (`adler://goals/<id>`,
`adler://insights/<id>`). `route.tab` says which tab to select — `nil` for Settings, which is a
sheet over whatever tab is showing.

---

## 2. Threading rules

- `APIClient` and `ViewCache` are **actors**. Everything else in Core is `@MainActor`.
- Every type in `Core/Models` is `nonisolated`. The target builds with
  `SWIFT_DEFAULT_ACTOR_ISOLATION = MainActor`, so without it each model's `Codable` conformance
  is main-actor isolated and the (nonisolated) decoder cannot use it. **A plain `extension` on a
  `nonisolated` type does not inherit it** — write `nonisolated extension`, or mark the members.
- Test classes are `nonisolated final class …: XCTestCase` (XCTest's lifecycle members are
  nonisolated); re-isolate individual methods with `@MainActor` when they touch a store.
- Never touch a store from a background task. `WorkspaceStore.refreshVisible()` is deliberately
  sequential **and coalesced**: a call made while a refresh is in flight queues exactly one more
  round and waits for it, so two SSE revisions in the same window can never issue two parallel
  GETs for one `ViewKey` (whose responses could be assigned out of order).
- `handleRevisionEvent(_:)` only acts when the revision moves **forwards**. An out-of-order or
  replayed frame, or a dev server restarted on a fresh database, must not walk `revision`
  backwards — the next write would then earn an avoidable 409.
- A write's cache save is `await`ed inline, not fired into an unstructured `Task`. An untracked
  task can be scheduled after `logout()` has already run `ViewCache.clear()`, and `save`
  recreates the directory it just deleted. The cache is also **scoped by user id**, so one
  account can never read another's cached views on a shared device.

---

## 3. Error handling contract

Everything throws exactly one type, `APIError`:

| Case | Cause | What the UI does |
| --- | --- | --- |
| `.unauthenticated` | 401 | `error.signedOut` + `Sign in`; keep the route and any draft. `WorkspaceStore.sessionExpired` is set by **every** store method — reads, writes, provider, connections, calendars and the SSE stream all funnel through one `send`. |
| `.staleRevision(current:)` | 409 | StaleRevision recovery (DESIGN.md §4.19). The store has already refetched the affected views; show the diff and offer `Retry`. |
| `.server(message:status:)` | any other 4xx/5xx with `{error}` | Show `message` **verbatim** — it is written for the person reading it. `isNotFound` → `error.recordGone`; `isRateLimited` → back off. |
| `.transport(message:kind:)` | no response | `.offline` → offline banner; `.timeout` → `Retry` (see below). |
| `.decoding(message:)` | a 2xx body the models cannot read | A bug in this layer or a contract change. File it; do not paper over it. |
| `.invalidRequest(message:)` | bad server URL | Route to Settings › Server. |

**Never paraphrase a server message.** The server's refusals are product copy —
`Choose a first action before starting this goal’s plan.`, `Only a draft plan can be started.`,
the corrected-evidence review guard. Render `error.serverMessage` as written.

### Retrying safely

`APIError.isRetryableWithSameRequestID` is true for timeouts and offline failures: the write may
already have landed. The store keeps the attempt:

```swift
catch let error as APIError {
    if error.isRetryableWithSameRequestID || error == .staleRevision(current: workspace.revision) {
        showRetry = true            // → try await workspace.retryPendingWrite()
    }
}
```

`retryPendingWrite()` resends with the original `requestId` **and the original `revision`** — both
are pinned in the `WriteAttempt` ticket. The server's idempotency key is
`digest({changes, revision})`, so the pair has to arrive unchanged: replaying the same id with a
*moved* revision is refused with 400 `A request ID cannot be reused for different changes.`, which
would turn a write that actually landed into a permanent, un-retryable failure.

A **409 is the exception**. The server throws before it writes the idempotency row, so that
`requestId` was never recorded; `perform` replaces the ticket with a fresh
`WriteAttempt(requestId: <new>, changes:, goalId:, revision: <current>)`. New id, new revision.

A ticket is kept **only when replay can help**. A 400 (validation, capacity, the shared-coach
guard) or a 429 clears `pendingWrite` instead, because resending an identical request cannot
succeed. A 429 also sets `rateLimitedUntil` (60 s); `retryPendingWrite()` / `retryCoachMessage()`
return `nil` while `isRateLimited`, so a burst of Retry taps cannot lock someone out of their own
coach.

`POST /api/app/actions/:id/start` and `/goals/:id/start` carry no `requestId` or `revision` — they
are single-record edits guarded by their own preconditions (`This action already started.`).

---

## 4. Truthfulness rules this layer enforces

- **`amount: nil` means unknown, never zero.** `ChangeBuilder` omits an absent amount from
  `values`; it only sends `0` when the caller passes an explicit measured zero.
- **An omitted key means "unchanged".** `server/commands.ts` applies `patch.amount ?? existing.amount`
  and `Object.assign(existing, patch)`, so a correction carrying only `outcome` and `note` leaves a
  measured amount exactly as it was. Verified live: reporting `420 words / 25 min`, then correcting
  only the note, leaves `amount: 420, actualMinutes: 25` in `GET /api/app/today`. `ReportSheet`
  still pre-fills the saved values so the person can see what they are keeping.
- **`.unknown` is a decode fallback, not a value.** `reportAction` and `setGoalStatus` refuse it
  with `invalidRequest` rather than sending the literal string `"unknown"`, which is a 400.
- **Outcome strings are exact:** `Done`, `Partly`, `Didn’t happen` (U+2019). Always go through
  `Outcome.rawValue`.
- Labels, deltas, standings, status text and projection assumptions are **server-computed**.
  There is no place in Core that derives one, and there must not be.
- `projection == nil` means print `unavailableReason`; never an empty forecast panel.
- `availability.coverage == .unknown` means the week's free time is unknown, not free.
- Learning workflow `state` and evidence `standing` are separate fields with separate labels.

---

## 5. Adding an endpoint

1. Model the response in `Core/Models/`, mirroring the TypeScript type exactly: `nonisolated
   struct`, `Codable, Sendable, Equatable`, `Identifiable` where there is a natural id. TS `?` or
   `| null` → Swift optional; a non-optional TS field stays non-optional. `CodingKeys` only where
   the wire name differs (see `ConnectionLink.opted_out`).
2. Add a factory to `Endpoints`, returning `Endpoint<YourResponse>`. Set `timeout:` only when 30 s
   is wrong.
3. If it is a read that belongs to a screen, add a `ViewKey` case, a `load…()` on
   `WorkspaceStore` and a branch in `reload(_:)` so `refreshVisible()` covers it.
4. If it is a write, express the payload through `ChangeBuilder` rather than a raw dictionary.
   Remember that `id` and `parentId` are **required and nullable** in `changeSchema`: the keys must
   be present as `null`, which `Change.encode(to:)` handles.
5. Add a test. Decoding tests belong in `CoreModelsTests`, payload shape in
   `CoreChangeBuilderTests`, error mapping in `CoreAPIClientTests`.

---

## 6. Fixtures

`AdlerTests/Fixtures/*.json` are verbatim copies of `docs/ios-api-examples/*.json`, which the
backend regenerates from a fictional account (`casey-example`):

```sh
npx tsx scripts/app-api-examples.ts     # from the repo root — regenerates the examples
ios/scripts/sync-fixtures.sh            # copy them into the test bundle
ios/scripts/test.sh                     # decode every one of them
```

The example dates are relative to the generation run and proposal ids are random, so assert on
*relations* (`weekStart + 6 == weekEnd`) and *content* (`changes.contains { $0.entity == .milestone }`),
never on literal dates or ids.

---

## 7. Live check

`CoreLiveTests` runs one real round trip against a dev server. It is skipped unless `ADLER_LIVE=1`,
and `xcodebuild` only forwards environment variables prefixed with `TEST_RUNNER_`:

```sh
npm run dev -- --port 8080     # from the repo root, in another shell
cd ios && TEST_RUNNER_ADLER_LIVE=1 xcodebuild -project Adler.xcodeproj -scheme Adler \
  -destination 'platform=iOS Simulator,id=9D3C9873-0CF0-4D2F-ABA6-0E821CA3E044' \
  -derivedDataPath .build -only-testing:AdlerTests/CoreLiveTests test
```

Add `TEST_RUNNER_ADLER_LIVE_COACH=1` to also spend one provider call on a real coaching turn.
It registers throwaway accounts named `ios-core-<timestamp>` — fictional, never real user data.

**The auth rate limit is no longer a constraint in local dev.** `server/api.ts` allows 1000
`/api/auth/register|login` attempts per 15 minutes whenever `developmentHost` is true (no
`PUBLIC_URL` and `NODE_ENV !== "production"`), against 15 in production. Repeated live and UI runs
against `npm run dev` will not exhaust it.

A Debug build also accepts `-signIn <username> <password>` as a launch argument, so a smoke or
screenshot run can sign into an existing fictional account without driving the keyboard:

```sh
xcrun simctl launch <udid> com.withadler.app \
  -adler.serverBaseURL http://localhost:8080 -signIn casey-example fictional-example-password
```
