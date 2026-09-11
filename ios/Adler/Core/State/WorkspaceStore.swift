import Foundation
import os

/// Per-view loading state. A screen renders cached content immediately and shows a hairline
/// while `isLoading` — a refresh never blanks a screen (DESIGN.md §4.20).
nonisolated struct LoadState: Sendable, Equatable {
    var isLoading = false
    var error: APIError?
    /// Rendered from the disk cache and not yet confirmed against the server.
    var isStale = false
    var loadedAt: Date?

    var hasContent: Bool { loadedAt != nil }
}

/// Identifies one cached view. `WorkspaceStore.visible` holds the keys currently on screen, and
/// an SSE revision change refetches exactly those.
nonisolated enum ViewKey: Hashable, Sendable {
    case today
    case goals
    case coach
    case insights
    case settings
    case goal(String)
    case conversation(String)
    case learningRecord(String)
    case calendar(YMD)

    var cacheKey: String {
        switch self {
        case .today: "today"
        case .goals: "goals"
        case .coach: "coach"
        case .insights: "insights"
        case .settings: "settings"
        case .goal(let id): "goal-\(id)"
        case .conversation(let id): "conversation-\(id)"
        case .learningRecord(let id): "record-\(id)"
        case .calendar(let week): "calendar-\(week.raw)"
        }
    }
}

/// A write that can be retried with the **same** `requestId` **and the same `revision`**, so a
/// replay after a timeout never applies twice (contract §2).
///
/// The revision is part of the ticket because the server's idempotency key is
/// `digest({ changes, revision })` (`server/service.ts`): replaying the original `requestId` with
/// a *different* revision is refused with 400 *"A request ID cannot be reused for different
/// changes."*, which would turn a write that actually landed into a permanent failure. A 409 is
/// the one case that needs a fresh ticket — see `WorkspaceStore.recover(from:goalId:)`.
nonisolated struct WriteAttempt: Sendable, Equatable {
    let requestId: String
    let changes: [Change]
    let goalId: String?
    /// The revision this attempt was first sent with. Reused verbatim on every retry.
    let revision: Int
}

/// One coach turn in flight. `POST /api/coach` can run for minutes; if it times out the person
/// retries the identical `requestId` and the server replays the first answer in milliseconds.
nonisolated struct CoachAttempt: Sendable, Equatable {
    let requestId: String
    let message: String
    let goalId: String?
    let conversationId: String?
    let focusGoalId: String?
}

/// Everything the signed-in app reads and writes.
///
/// Threading: `@MainActor` throughout. Every `load*` and mutation is `async` and awaits the
/// `APIClient` actor; the properties it publishes are only ever touched on the main actor, so
/// SwiftUI observation is safe by construction.
///
/// Errors: mutations throw `APIError`. A `.staleRevision` refetches the affected views **and
/// then rethrows**, so the caller can show the StaleRevision recovery (DESIGN.md §4.19) and
/// retry with `retryPendingWrite()`.
@MainActor
@Observable
final class WorkspaceStore {
    // MARK: Cached views

    private(set) var revision = 0
    private(set) var today: TodayView?
    private(set) var goals: GoalsView?
    private(set) var goalDetails: [String: GoalDetailView] = [:]
    private(set) var coach: CoachView?
    private(set) var conversations: [String: CoachView] = [:]
    private(set) var insights: InsightsView?
    private(set) var learningRecords: [String: LearningDetailView] = [:]
    private(set) var calendars: [YMD: CalendarView] = [:]
    private(set) var settings: SettingsView?

    private(set) var states: [ViewKey: LoadState] = [:]
    private(set) var visible: Set<ViewKey> = []

    /// Set when any call returns 401. The shell shows `error.signedOut` and keeps the route.
    private(set) var sessionExpired = false

    /// The last failed write, kept so `Retry` reuses its `requestId`.
    private(set) var pendingWrite: WriteAttempt?
    /// The coach turn in flight or awaiting retry.
    private(set) var pendingCoach: CoachAttempt?
    private(set) var isSendingCoachMessage = false

    /// `GET /api/provider` reports `testedAt: null` for a server key even straight after a
    /// successful test, so the successful result is kept here for the Settings screen.
    private(set) var lastProviderTest: ProviderTestResponse?

    /// The workspace time zone. Every day boundary is read in it, not the device's.
    var timeZone: TimeZone = .current

    private let client: APIClient
    private let cache: ViewCache
    private let logger = Logger(subsystem: "com.withadler.app", category: "workspace")

    /// The single in-flight `refreshVisible()` round, and whether another was asked for while it
    /// ran. See `refreshVisible()`.
    private var refreshTask: Task<Void, Never>?
    private var refreshQueued = false
    /// Whose cache `restoreFromCache()` rendered, so a different account signing in on the same
    /// device never keeps the previous person's views on screen.
    private var restoredUserId: String?

    init(client: APIClient, cache: ViewCache = ViewCache()) {
        self.client = client
        self.cache = cache
    }

    func state(_ key: ViewKey) -> LoadState { states[key] ?? LoadState() }

    /// Screens call these in `.task` / `.onDisappear` so `refreshVisible()` knows what to refetch.
    func markVisible(_ key: ViewKey) { visible.insert(key) }
    func markHidden(_ key: ViewKey) { visible.remove(key) }

    func adopt(session: SessionView) {
        // A cold start renders the last cached views before anyone knows who is signed in. If it
        // turns out to be a different account, drop them rather than let one person's goals sit
        // on another person's launch screen until the first network load lands.
        if let restoredUserId, restoredUserId != session.user.id { discardCachedViews() }
        restoredUserId = session.user.id
        timeZone = session.timeZone
        noteRevision(session.revision)
    }

    private func discardCachedViews() {
        today = nil
        goals = nil
        goalDetails = [:]
        coach = nil
        conversations = [:]
        insights = nil
        learningRecords = [:]
        calendars = [:]
        settings = nil
        states = [:]
    }

    // MARK: - Cold start

    /// The only keys `restoreFromCache()` reads, and therefore the only ones worth writing.
    /// Per-goal, per-conversation, per-record and per-week views are the largest payloads in the
    /// contract and were never read back: pure write amplification, and workspace content left at
    /// rest for no benefit.
    private static let restorableKeys: Set<ViewKey> = [
        .today, .goals, .coach, .insights, .settings,
    ]

    /// Renders the last successful views instantly. Everything restored is marked stale until
    /// the matching network load lands.
    func restoreFromCache() async {
        restoredUserId = await cache.scope
        if today == nil, let value = await cache.load(TodayView.self, key: ViewKey.today.cacheKey) {
            today = value
            states[.today] = LoadState(isStale: true, loadedAt: .now)
        }
        if goals == nil, let value = await cache.load(GoalsView.self, key: ViewKey.goals.cacheKey) {
            goals = value
            states[.goals] = LoadState(isStale: true, loadedAt: .now)
        }
        if coach == nil, let value = await cache.load(CoachView.self, key: ViewKey.coach.cacheKey) {
            coach = value
            states[.coach] = LoadState(isStale: true, loadedAt: .now)
        }
        if insights == nil,
            let value = await cache.load(InsightsView.self, key: ViewKey.insights.cacheKey)
        {
            insights = value
            states[.insights] = LoadState(isStale: true, loadedAt: .now)
        }
        if settings == nil,
            let value = await cache.load(SettingsView.self, key: ViewKey.settings.cacheKey)
        {
            settings = value
            states[.settings] = LoadState(isStale: true, loadedAt: .now)
        }
    }

    func reset() async {
        // Stop the in-flight refresh first: a load that completes after `cache.clear()` would
        // write the signed-out account's views straight back to disk.
        refreshTask?.cancel()
        refreshTask = nil
        refreshQueued = false
        revision = 0
        discardCachedViews()
        restoredUserId = nil
        visible = []
        pendingWrite = nil
        pendingCoach = nil
        lastProviderTest = nil
        sessionExpired = false
        await cache.clear()
    }

    // MARK: - Reads

    func loadToday() async {
        await load(.today, Endpoints.today()) { $0.today = $1 }
    }

    func loadGoals(weeks: Int? = nil) async {
        await load(.goals, Endpoints.goals(weeks: weeks)) { $0.goals = $1 }
    }

    func loadGoal(
        id: String, plan: Int? = nil, step: String? = nil, milestone: String? = nil
    ) async {
        await load(
            .goal(id), Endpoints.goal(id: id, plan: plan, step: step, milestone: milestone)
        ) { $0.goalDetails[id] = $1 }
    }

    func loadCoach() async {
        await load(.coach, Endpoints.coach()) { $0.coach = $1 }
    }

    func loadConversation(id: String) async {
        await load(.conversation(id), Endpoints.coach(conversationId: id)) {
            $0.conversations[id] = $1
        }
    }

    func loadInsights(goalId: String? = nil) async {
        await load(.insights, Endpoints.insights(goalId: goalId)) { $0.insights = $1 }
    }

    func loadLearningRecord(id: String) async {
        await load(.learningRecord(id), Endpoints.insightRecord(recordId: id)) {
            $0.learningRecords[id] = $1
        }
    }

    /// `weekOf` is any date inside the week; the server snaps to Monday and the result is keyed
    /// by the returned `weekStart`.
    func loadCalendar(weekOf date: YMD? = nil) async {
        let requested = date ?? YMD.today(in: timeZone)
        await load(.calendar(requested), Endpoints.calendar(start: requested)) { store, view in
            store.calendars[view.weekStart] = view
            if view.weekStart != requested { store.calendars[requested] = view }
        }
    }

    func loadSettings() async {
        await load(.settings, Endpoints.settings()) { store, view in
            store.settings = view
            store.timeZone = view.preferences.resolvedTimeZone
        }
    }

    /// Refetches only the views currently on screen. Triggered by an SSE revision change, by
    /// returning to the foreground, and by connectivity coming back.
    ///
    /// Sequential on purpose: at most a handful of keys are ever visible, and serialising them
    /// keeps a burst of SSE revisions from firing parallel requests at the same workspace.
    /// Concurrent callers are **coalesced**, not run side by side: a second call while a refresh
    /// is in flight queues exactly one more round and waits for it, so two revisions arriving in
    /// the same window can never issue two parallel GETs for one `ViewKey` — whose responses
    /// could otherwise be assigned out of order, leaving the older one on screen.
    func refreshVisible() async {
        if let inFlight = refreshTask {
            refreshQueued = true
            await inFlight.value
            // The in-flight round picks the queue up itself; wait for that follow-up too.
            if let followUp = refreshTask { await followUp.value }
            return
        }
        let task = Task { @MainActor [weak self] in
            guard let self else { return }
            await self.runRefreshRounds()
        }
        refreshTask = task
        await task.value
    }

    private func runRefreshRounds() async {
        defer { refreshTask = nil }
        repeat {
            refreshQueued = false
            for key in visible { await reload(key) }
        } while refreshQueued
    }

    private func reload(_ key: ViewKey) async {
        switch key {
        case .today: await loadToday()
        case .goals: await loadGoals()
        case .coach: await loadCoach()
        case .insights: await loadInsights()
        case .settings: await loadSettings()
        case .goal(let id): await loadGoal(id: id)
        case .conversation(let id): await loadConversation(id: id)
        case .learningRecord(let id): await loadLearningRecord(id: id)
        case .calendar(let week): await loadCalendar(weekOf: week)
        }
    }

    /// Hook for `ScenePhase` / SSE. Only acts when the revision actually moved **forwards**:
    /// an out-of-order or replayed frame, or a dev server restarted on a fresh database, must
    /// not walk `revision` backwards — the next write would then send a stale revision and earn
    /// an avoidable 409.
    func handleRevisionEvent(_ incoming: Int) async {
        guard incoming > revision else { return }
        revision = incoming
        await refreshVisible()
    }

    /// Called by the shell when the SSE stream is refused with a 401.
    func noteSessionExpired() { sessionExpired = true }

    private func load<Value: WorkspaceView>(
        _ key: ViewKey,
        _ endpoint: Endpoint<Value>,
        assign: @MainActor (WorkspaceStore, Value) -> Void
    ) async {
        var state = self.state(key)
        state.isLoading = true
        states[key] = state
        do {
            let value = try await client.send(endpoint)
            assign(self, value)
            noteRevision(value.revision)
            states[key] = LoadState(isLoading: false, error: nil, isStale: false, loadedAt: .now)
            if Self.restorableKeys.contains(key) { await cache.save(value, key: key.cacheKey) }
        } catch {
            if case .unauthenticated = error { sessionExpired = true }
            state.isLoading = false
            state.error = error
            states[key] = state
            logger.debug("load \(key.cacheKey, privacy: .public) failed: \(error.localizedDescription, privacy: .public)")
        }
    }

    private func noteRevision(_ value: Int) {
        if value > revision { revision = value }
    }

    /// Every request this store makes goes through here, so a 401 is never invisible.
    ///
    /// `AppErrorBanner` shows `error.signedOut` from `sessionExpired` alone. Without this funnel,
    /// a cookie invalidated server-side (a restart with a new key, or a sign-out on the web)
    /// failed a phone pairing or a provider save with a bare *"Sign in to your workspace."*
    /// sentence inside a settings sheet, while the shell kept pretending to be signed in.
    private func send<Response>(_ endpoint: Endpoint<Response>) async throws(APIError) -> Response {
        do {
            return try await client.send(endpoint)
        } catch {
            if case .unauthenticated = error { sessionExpired = true }
            throw error
        }
    }

    func clearError(_ key: ViewKey) {
        var state = self.state(key)
        state.error = nil
        states[key] = state
    }

    // MARK: - Writes

    /// The one deterministic write path. Sends the last known `revision` and a fresh `requestId`.
    @discardableResult
    func apply(changes: [Change], goalId: String? = nil) async throws(APIError) -> WriteResult {
        try await perform(
            WriteAttempt(
                requestId: UUID().uuidString, changes: changes, goalId: goalId,
                revision: revision))
    }

    /// Re-sends the last failed write **with its original `requestId` and its original
    /// `revision`**, so an edit that actually landed before the timeout is replayed rather than
    /// duplicated — and is not refused as "a request ID reused for different changes".
    @discardableResult
    func retryPendingWrite() async throws(APIError) -> WriteResult? {
        guard let attempt = pendingWrite, !isRateLimited else { return nil }
        return try await perform(attempt)
    }

    func discardPendingWrite() { pendingWrite = nil }

    private func perform(_ attempt: WriteAttempt) async throws(APIError) -> WriteResult {
        do {
            let result = try await client.send(
                Endpoints.changes(
                    ChangesRequest(
                        changes: attempt.changes, revision: attempt.revision,
                        requestId: attempt.requestId, goalId: attempt.goalId)))
            await absorb(result)
            pendingWrite = nil
            return result
        } catch {
            note(rateLimit: error)
            await recover(from: error, goalId: attempt.goalId)
            switch error {
            case .staleRevision:
                // A 409 is refused *before* the idempotency row is written, so the requestId
                // was never recorded: the replay needs a new id and the server's current
                // revision. Reusing the old pair sends a hash the server can never match.
                pendingWrite = WriteAttempt(
                    requestId: UUID().uuidString, changes: attempt.changes,
                    goalId: attempt.goalId, revision: revision)
            case _ where error.isRetryableWithSameRequestID:
                pendingWrite = attempt
            default:
                // A validation refusal, a capacity refusal or a rate limit cannot be fixed by
                // resending the identical request. Offering `Retry` for one is a dead end.
                pendingWrite = nil
            }
            throw error
        }
    }

    /// `POST /api/coach` is limited to 20 a minute and the limit is consumed *before* the
    /// idempotency check, so a handful of Retry taps locks the person out of their own coach.
    /// The UI can read this to disable Retry and say when it will work again.
    private(set) var rateLimitedUntil: Date?

    var isRateLimited: Bool {
        guard let rateLimitedUntil else { return false }
        return Date.now < rateLimitedUntil
    }

    private func note(rateLimit error: APIError) {
        if error.isRateLimited { rateLimitedUntil = Date.now.addingTimeInterval(60) }
    }

    /// A 409 means somebody else moved the workspace. Take the server's revision, refetch what
    /// the change touched, then let the caller decide — we never silently re-apply.
    private func recover(from error: APIError, goalId: String?) async {
        switch error {
        case .unauthenticated:
            sessionExpired = true
        case .staleRevision(let current):
            if current > 0 { noteRevision(current) }
            var affected = visible
            affected.insert(.today)
            if let goalId { affected.insert(.goal(goalId)) }
            for key in affected { await reload(key) }
        default:
            break
        }
    }

    /// A write response carries the refreshed Today (and the goal when one was named).
    ///
    /// The cache write is **awaited, not fired into an unstructured `Task`**. An untracked task
    /// can be scheduled after `reset()`/`logout()` has already run `ViewCache.clear()`, and
    /// `save` recreates the directory it just deleted — re-seeding the disk with the signed-out
    /// account's goals for whoever cold-starts the app next. Awaiting puts the write and the
    /// clear on the same actor queue, in order.
    private func absorb(_ result: WriteResult) async {
        noteRevision(result.revision)
        today = result.today
        states[.today] = LoadState(loadedAt: .now)
        if let goal = result.goal {
            goalDetails[goal.goal.id] = goal
            states[.goal(goal.goal.id)] = LoadState(loadedAt: .now)
        }
        await cache.save(result.today, key: ViewKey.today.cacheKey)

        // Everything the response did not carry is now older than the workspace. Leaving it
        // `isStale == false` with a fresh `loadedAt` is the store actively asserting that a
        // pre-report activity grid is current.
        let refreshed: Set<ViewKey> = [.today, result.goal.map { .goal($0.goal.id) }]
            .compactMap { $0 }
            .reduce(into: []) { $0.insert($1) }
        for key in states.keys where !refreshed.contains(key) {
            states[key]?.isStale = true
        }
    }

    // MARK: Reporting work

    /// `outcome` is written exactly as `Done` / `Partly` / `Didn’t happen`. An unknown `amount`
    /// is omitted, never sent as `0` — see `ChangeBuilder`.
    @discardableResult
    func reportAction(
        id: String,
        goalId: String,
        outcome: Outcome,
        amount: Double? = nil,
        minutes: Double? = nil,
        note: String? = nil,
        reason: String? = nil
    ) async throws(APIError) -> WriteResult {
        guard !outcome.isUnknown else { throw Self.unknownValueRefusal }
        return try await apply(
            changes: [
                ChangeBuilder.reportAction(
                    id: id, goalId: goalId, outcome: outcome, amount: amount, minutes: minutes,
                    note: note, reason: reason)
            ], goalId: goalId)
    }

    /// A correction is a new report with a **new** `requestId`; the server appends to
    /// `action.history` so the earlier report stays visible.
    @discardableResult
    func correctAction(
        id: String,
        goalId: String,
        outcome: Outcome,
        amount: Double? = nil,
        minutes: Double? = nil,
        note: String? = nil,
        reason: String = "Corrected in the app."
    ) async throws(APIError) -> WriteResult {
        try await reportAction(
            id: id, goalId: goalId, outcome: outcome, amount: amount, minutes: minutes,
            note: note, reason: reason)
    }

    /// `beginAction`: marks the action started now and dates it today. Not revision-guarded and
    /// not idempotent — the server refuses a second start with `This action already started.`
    @discardableResult
    func startAction(id: String, goalId: String? = nil) async throws(APIError) -> WriteResult {
        do {
            let result = try await client.send(Endpoints.startAction(id: id, goalId: goalId))
            await absorb(result)
            return result
        } catch {
            await recover(from: error, goalId: goalId)
            throw error
        }
    }

    /// Activates a draft plan. Refuses with the server's own wording, which the UI shows
    /// verbatim — for example `Choose a first action before starting this goal’s plan.` for an
    /// unplanned Draft, or the review guard when the plan relies on corrected evidence.
    @discardableResult
    func startGoal(id: String) async throws(APIError) -> WriteResult {
        do {
            let result = try await client.send(Endpoints.startGoal(id: id))
            await absorb(result)
            return result
        } catch {
            await recover(from: error, goalId: id)
            throw error
        }
    }

    @discardableResult
    func setMilestoneDone(goalId: String, milestoneId: String, done: Bool) async throws(APIError)
        -> WriteResult
    {
        try await apply(
            changes: [
                ChangeBuilder.setMilestoneDone(
                    goalId: goalId, milestoneId: milestoneId, done: done)
            ], goalId: goalId)
    }

    /// Recording an outcome. Completing actions never does this.
    @discardableResult
    func addResult(goalId: String, value: Double, date: YMD, source: String) async throws(APIError)
        -> WriteResult
    {
        try await apply(
            changes: [
                ChangeBuilder.addResult(
                    goalId: goalId, value: value, date: date, source: source)
            ], goalId: goalId)
    }

    @discardableResult
    func setGoalStatus(id: String, status: GoalStatus, reason: String? = nil) async throws(APIError)
        -> WriteResult
    {
        guard !status.isUnknown else { throw Self.unknownValueRefusal }
        return try await apply(
            changes: [ChangeBuilder.setGoalStatus(id: id, status: status, reason: reason)],
            goalId: id)
    }

    /// `.unknown` is the decode fallback for a value this build does not know. Sending it back
    /// is a 400 the person cannot act on; this is a sentence they can.
    private static let unknownValueRefusal = APIError.invalidRequest(
        message: "This version of Adler does not recognise that option. Update the app.")

    @discardableResult
    func deleteGoal(id: String, reason: String? = nil) async throws(APIError) -> WriteResult {
        try await apply(changes: [ChangeBuilder.deleteGoal(id: id, reason: reason)])
    }

    // MARK: Settings writes

    @discardableResult
    func updatePreferences(
        theme: Theme? = nil, timeZone zone: String? = nil, automation: AutomationView? = nil
    ) async throws(APIError) -> WriteResult {
        let result = try await apply(
            changes: [
                ChangeBuilder.updatePreferences(
                    theme: theme, timeZone: zone, automation: automation)
            ])
        if let zone, let resolved = TimeZone(identifier: zone) { timeZone = resolved }
        await loadSettings()
        return result
    }

    @discardableResult
    func updateProgram(
        reason: String,
        focusGoalId: String? = nil,
        weeklyMinutes: Int? = nil,
        workStart: String? = nil,
        workEnd: String? = nil,
        workDays: [Int]? = nil,
        sessionMinutes: Int? = nil,
        reviewDay: Weekday? = nil,
        enabledMethods: [String]? = nil,
        approach: String? = nil
    ) async throws(APIError) -> WriteResult {
        let result = try await apply(
            changes: [
                ChangeBuilder.updateProgram(
                    reason: reason, focusGoalId: focusGoalId, weeklyMinutes: weeklyMinutes,
                    workStart: workStart, workEnd: workEnd, workDays: workDays,
                    sessionMinutes: sessionMinutes, reviewDay: reviewDay,
                    enabledMethods: enabledMethods, approach: approach)
            ])
        await loadSettings()
        return result
    }

    @discardableResult
    func saveMemory(id: String? = nil, text: String) async throws(APIError) -> WriteResult {
        let result = try await apply(changes: [ChangeBuilder.saveMemory(id: id, text: text)])
        await loadInsights()
        return result
    }

    @discardableResult
    func deleteMemory(id: String) async throws(APIError) -> WriteResult {
        let result = try await apply(changes: [ChangeBuilder.deleteMemory(id: id)])
        await loadInsights()
        return result
    }

    // MARK: Local work blocks

    @discardableResult
    func createLocalWorkBlock(
        goalId: String, actionTitle: String, start: Timestamp, end: Timestamp,
        blockId: String? = nil
    ) async throws(APIError) -> WriteResult {
        let result = try await apply(
            changes: [
                ChangeBuilder.createLocalWorkBlock(
                    goalId: goalId, actionTitle: actionTitle, start: start, end: end, id: blockId)
            ], goalId: goalId)
        await loadCalendar(weekOf: start.day(in: timeZone))
        return result
    }

    @discardableResult
    func updateWorkBlock(id: String, goalId: String, start: Timestamp, end: Timestamp)
        async throws(APIError) -> WriteResult
    {
        let result = try await apply(
            changes: [
                ChangeBuilder.updateWorkBlock(id: id, goalId: goalId, start: start, end: end)
            ], goalId: goalId)
        await loadCalendar(weekOf: start.day(in: timeZone))
        return result
    }

    @discardableResult
    func deleteWorkBlock(id: String, goalId: String, weekOf: YMD? = nil) async throws(APIError)
        -> WriteResult
    {
        let result = try await apply(
            changes: [ChangeBuilder.deleteWorkBlock(id: id, goalId: goalId)], goalId: goalId)
        await loadCalendar(weekOf: weekOf)
        return result
    }

    // MARK: - Learning

    /// `POST /api/learning`. Sends `actionVersion` for agree/decline and `version` for
    /// pause/resume/close; the server rejects the other one.
    func learningAction(recordId: String, action: LearningActionKind, version: Int)
        async throws(APIError)
    {
        do {
            let response = try await client.send(
                Endpoints.learning(
                    LearningActionRequest(
                        id: recordId, version: version, action: action,
                        requestId: UUID().uuidString)))
            noteRevision(response.revision)
        } catch {
            await recover(from: error, goalId: nil)
            throw error
        }
        await loadInsights()
        await loadLearningRecord(id: recordId)
        await loadToday()
    }

    /// Convenience that picks the right version number off a row.
    func learningAction(row: LearningRow, action: LearningActionKind) async throws(APIError) {
        try await learningAction(
            recordId: row.recordId, action: action, version: row.version(for: action))
    }

    func learningAction(card: TodayLearningCard, action: LearningActionKind) async throws(APIError)
    {
        try await learningAction(
            recordId: card.recordId, action: action, version: card.version(for: action))
    }

    // MARK: - Proposals

    /// Approving runs the shared command catalog server-side, so the views are refetched after.
    func approveProposal(id: String, goalId: String? = nil) async throws(APIError) {
        do {
            let response = try await client.send(Endpoints.approveProposal(id: id))
            noteRevision(response.revision)
        } catch {
            await recover(from: error, goalId: goalId)
            throw error
        }
        await refreshAfterProposal(goalId: goalId)
    }

    /// No reason is asked for and no follow-up question is raised.
    func dismissProposal(id: String, goalId: String? = nil) async throws(APIError) {
        do {
            _ = try await client.send(Endpoints.dismissProposal(id: id))
        } catch {
            await recover(from: error, goalId: goalId)
            throw error
        }
        await refreshAfterProposal(goalId: goalId)
    }

    /// Current → Suggested for every affected record, without applying anything.
    func previewProposal(id: String) async throws(APIError) -> ProposalPreview {
        do {
            return try await client.send(Endpoints.previewProposal(id: id))
        } catch {
            await recover(from: error, goalId: nil)
            throw error
        }
    }

    private func refreshAfterProposal(goalId: String?) async {
        var affected = visible
        affected.insert(.today)
        affected.insert(.insights)
        if let goalId { affected.insert(.goal(goalId)) }
        for key in affected { await reload(key) }
    }

    // MARK: - Coach

    /// One coaching turn. The `requestId` is created here and kept in `pendingCoach`, so a
    /// timeout can be retried with `retryCoachMessage()` and the server replays its first answer
    /// instead of running the model again.
    ///
    /// Do not call this in a retry loop: `POST /api/coach` is rate limited to 20 per minute and
    /// the limit is consumed *before* the idempotency check.
    @discardableResult
    func sendCoachMessage(
        text: String,
        goalId: String? = nil,
        conversationId: String? = nil,
        focusGoalId: String? = nil
    ) async throws(APIError) -> CoachReply {
        try await performCoach(
            CoachAttempt(
                requestId: UUID().uuidString, message: text, goalId: goalId,
                conversationId: conversationId, focusGoalId: focusGoalId))
    }

    @discardableResult
    func retryCoachMessage() async throws(APIError) -> CoachReply? {
        guard let attempt = pendingCoach, !isRateLimited else { return nil }
        return try await performCoach(attempt)
    }

    func discardPendingCoachMessage() { pendingCoach = nil }

    private func performCoach(_ attempt: CoachAttempt) async throws(APIError) -> CoachReply {
        isSendingCoachMessage = true
        pendingCoach = attempt
        defer { isSendingCoachMessage = false }
        let reply: CoachReply
        do {
            reply = try await client.send(
                Endpoints.coachMessage(
                    CoachRequest(
                        message: attempt.message, goalId: attempt.goalId,
                        conversationId: attempt.conversationId,
                        focusGoalId: attempt.focusGoalId, requestId: attempt.requestId)))
        } catch {
            if case .unauthenticated = error { sessionExpired = true }
            note(rateLimit: error)
            // Same rule as a write: only a timeout or an offline failure can be replayed.
            if !error.isRetryableWithSameRequestID { pendingCoach = nil }
            throw error
        }
        pendingCoach = nil
        noteRevision(reply.revision)
        await loadConversation(id: reply.conversationId)
        await loadCoach()
        await loadToday()
        return reply
    }

    func reactToMessage(id: String, reaction: ReactionType, remove: Bool = false)
        async throws(APIError)
    {
        let response = try await send(
            Endpoints.messageReaction(id: id, reaction: reaction, remove: remove))
        noteRevision(response.revision)
    }

    // MARK: - Provider and connections

    func providerStatus() async throws(APIError) -> ProviderStatusView {
        try await send(Endpoints.providerStatus())
    }

    @discardableResult
    func saveProvider(
        provider: String, model: String, useServer: Bool, key: String? = nil,
        removeKey: Bool = false
    ) async throws(APIError) -> ProviderStatusView {
        let status = try await send(
            Endpoints.saveProvider(
                ProviderSaveRequest(
                    provider: provider, model: model, useServer: useServer, key: key,
                    removeKey: removeKey ? true : nil)))
        await loadSettings()
        return status
    }

    /// The result is kept in memory because `GET /api/provider` reports `testedAt: null` for a
    /// server key even right after a successful test — Settings must not say "never tested".
    @discardableResult
    func testProvider() async throws(APIError) -> ProviderTestResponse {
        let result = try await send(Endpoints.testProvider())
        lastProviderTest = result
        return result
    }

    func connections() async throws(APIError) -> ConnectionsResponse {
        try await send(Endpoints.connections())
    }

    func pairPhone(address: String) async throws(APIError) -> PairResponse {
        try await send(Endpoints.pair(address: address))
    }

    func unlinkPhone() async throws(APIError) {
        _ = try await send(Endpoints.unlink())
    }

    func createToken(name: String, scope: TokenScope, days: Int) async throws(APIError)
        -> CreateTokenResponse
    {
        let response = try await send(
            Endpoints.createToken(CreateTokenRequest(name: name, scope: scope, days: days)))
        await loadSettings()
        return response
    }

    func revokeToken(id: String) async throws(APIError) {
        _ = try await send(Endpoints.revokeToken(id: id))
        await loadSettings()
    }

    // MARK: - Calendars

    func externalCalendars() async throws(APIError) -> CalendarList {
        try await send(Endpoints.calendars())
    }

    func checkAvailability(
        provider: String, calendarIds: [String], start: Timestamp, end: Timestamp
    ) async throws(APIError) -> AvailabilityResponse {
        try await send(
            Endpoints.availability(
                AvailabilityRequest(
                    provider: provider, calendarIds: calendarIds, start: start, end: end)))
    }

    /// Booking is explicit and confirmed. A partial result keeps the panel open: retry the
    /// identical request to finish the missing event.
    func book(_ request: BookingRequest) async throws(APIError) -> BookingResponse {
        let response = try await send(Endpoints.booking(request))
        await loadCalendar(weekOf: request.start.day(in: timeZone))
        await loadToday()
        return response
    }

    func connectAppleCalendar(email: String, password: String) async throws(APIError) {
        _ = try await send(
            Endpoints.connectApple(
                AppleCalendarCredentials(email: email, password: password)))
        await loadSettings()
    }

    func disconnectCalendar(provider: String) async throws(APIError) {
        _ = try await send(Endpoints.disconnectCalendar(provider: provider))
        await loadSettings()
    }
}
