# Adler for iOS — end-to-end flows

Numbered steps with the API call each step makes. Contract from `.context/ios-brief.md` §5 plus the existing endpoints. Companion: [`DESIGN.md`](DESIGN.md), [`COPY.md`](COPY.md).

## Conventions

- Base URL from Settings › Server (default `http://localhost:8080`). Cookie session `adler_session`; `URLSession` handles it. No `Origin` header is sent.
- **Every mutating call** carries `requestId` (a fresh `UUID` per user intent, reused unchanged on retry) and the last known `revision`. A `409` means stale revision → §11.
- `GET /api/events` (SSE) emits `{revision}`. On a new revision the store refetches only the views currently on screen.
- `Change` = `{ entity, operation, id, parentId, reason?, values }` where `values` is a **JSON string** of only the fields being set (see `server/commands.ts` `commandCatalog`).
- Steps marked **(client-only)** touch no network.

---

## 1. First run → first plan (journey parts 1–2)

| # | Step | Call |
| --- | --- | --- |
| 1 | Launch. Probe the session. | `GET /api/app/session` |
| 2 | `401` → show Welcome. `200` → skip to Today. | — |
| 3 | Tap `Start with a goal`. | **(client-only)** push Goal input |
| 4 | Type the goal; every keystroke persists the draft. | **(client-only)** `@AppStorage("adler.firstGoal")` |
| 5 | Tap `Continue` → push Auth (draft retained and shown). | — |
| 6 | `Create account`. | `POST /api/auth/register` `{ username, password }` |
| 7 | Load the session and coach status. | `GET /api/app/session` → `{ user, revision, status.coach.configured, serverKeysAllowed, preferences }` |
| 8 | If `status.coach.configured == false` → Settings › AI provider first (§9); otherwise continue. | — |
| 9 | Open Coach and send the draft as the first message. | `POST /api/coach` `{ message: "Help me develop this goal and a plan around how I work: <draft>", goalId: null, conversationId: null, requestId }` |
| 10 | Clear the stored draft after a 2xx. | **(client-only)** |
| 11 | Render the reply, plus any `proposals` and `recommendations` it returned. | `GET /api/app/coach/:conversationId` |
| 12 | Person taps `Review changes` on the plan proposal. | `POST /api/proposals/:id/preview` → Current → Suggested for every affected record |
| 13 | Person taps `Approve`. | `POST /api/proposals/:id/approve` `{ requestId }` |
| 14 | Refetch the goal and Today. | `GET /api/app/goals/:id`, `GET /api/app/today` |
| 15 | Navigate to Goal detail; the plan, milestones and first action are visible. | — |

Truthfulness checks: a Draft goal with no action is a valid end state (step 13 may create no actions). The app never fabricates a milestone, action or measure to fill the screen; it shows `empty.draftNoPlan` and the `Plan first action` route.

## 2. Daily use — see today's action, start it, report it (journey parts 2, 6)

| # | Step | Call |
| --- | --- | --- |
| 1 | Open the Today tab (or `adler://today`). | `GET /api/app/today` → `{ today, revision, next, actions, lineup, progress, learning, quietDay }` |
| 2 | Render card 01 Do from `next` and `lineup`. If `quietDay` → `empty.restDay`, stop. | — |
| 3 | Tap `Start`. | `POST /api/app/actions/:id/start` `{ requestId, revision }` → `{ revision, today }` |
| 4 | Card shows `Started 8:31 · not yet reported`. | — |
| 5 | Tap `Report` → ReportSheet. Date defaults to the action's saved date. | **(client-only)** |
| 6 | Choose `Done` / `Partly` / `Didn’t happen`; optionally enter amount, minutes, note. | **(client-only)** |
| 7 | Tap `Save report`. | `POST /api/app/changes` `{ requestId, revision, changes: [{ entity:"action", operation:"update", id:"<actionId>", parentId:"<goalId>", values:"{\"outcome\":\"Done\",\"amount\":25,\"actualMinutes\":25,\"note\":\"…\"}" }] }` → `{ revision, today }` |
| 8 | Show the inline receipt with `Correct`. | — |
| 9 | `Correct` → reopen pre-filled, save again with a **new** `requestId`; the server appends to `action.history`. | same call as step 7 |

Rules: an omitted amount is omitted from `values` — never sent as `0`. `Didn’t happen` sends `amount: 0` and `actualMinutes: 0` only because the action did not occur; the UI labels it `Didn’t happen`, not "0 minutes done".

## 3. Report a barrier → recommendation → agree (journey parts 3, 5)

| # | Step | Call |
| --- | --- | --- |
| 1 | From the action card menu: `Discuss this action` (or Coach tab + quick prompt `Something got in the way`). | **(client-only)** open Coach with `goalId` and `actionId` attached |
| 2 | Send the report in ordinary language. | `POST /api/coach` `{ message, goalId, conversationId, requestId }` |
| 3 | Show `Thinking with you…`; the composer stays editable. | — |
| 4 | The reply may be a feasibility question (e.g. whether the phone is needed). Answer it. | `POST /api/coach` (same shape, new `requestId`) |
| 5 | The reply carries a `decision` with `recommendations[]`. Render the RecommendationCard from `recommendation.action`, `.observation`, `.interpretation`, `.expectedEffect`. Show `reasoning.limitation` outside the disclosure. | — |
| 6 | `Why this?` → EvidenceDisclosure from `reasoning` + `researchClaims` + `researchSources` in the same payload. | **(client-only)** — nothing is generated |
| 7 | If `changeIndexes` is non-empty, show the affected work. | `POST /api/proposals/:id/preview` |
| 8 | `Try this`. | `POST /api/proposals/:id/approve` `{ requestId }` — or, for a learning-only agreement, `POST /api/learning` `{ id, version, action:"agree", requestId }` |
| 9 | `No thanks` → dismiss, no reason asked, no follow-up question. | `POST /api/proposals/:id/dismiss` `{ requestId }` or `POST /api/learning` `{ …, action:"decline" }` |
| 10 | `Discuss` → same conversation with the record attached. | `POST /api/coach` `{ message, goalId, conversationId, recordId, requestId }` |
| 11 | `Edit` → composer pre-filled with `rec.editPrefill`; the card stays `Suggested` until the coach returns a revised proposal. | `POST /api/coach` when sent |
| 12 | After a decision, refetch coach, today and insights. | `GET /api/app/coach/:id`, `GET /api/app/today`, `GET /api/app/insights` |

Rule: acceptance changes only the workflow state. The card then shows the saved state and a `Correct this` control — never a success signal.

## 4. Report trial sessions → review → accept the next plan (journey parts 6–7)

| # | Step | Call |
| --- | --- | --- |
| 1 | Day 1 of the trial: report the action as in §2. | `POST /api/app/changes` |
| 2 | Day 2: report again. | `POST /api/app/changes` |
| 3 | Today › 03 Learn now shows the record with `2 attempts reported` and the review date. | `GET /api/app/today` → `learning[]` |
| 4 | When the server marks it `Ready to review`, the card sorts first and shows `Review with Adler`. | — |
| 5 | Tap `Review with Adler`. | `POST /api/coach` `{ message, goalId, conversationId, recordId, version, requestId }` |
| 6 | The coach returns a review and may propose the next plan. | — |
| 7 | `Review changes` shows Current → Suggested, including which trial records are preserved. | `POST /api/proposals/:id/preview` |
| 8 | `Approve`. | `POST /api/proposals/:id/approve` `{ requestId }` |
| 9 | Refetch; Insights shows the finding under `What we've learned`, with its evidence standing and planning consequence. The original trial stays in history. | `GET /api/app/insights`, `GET /api/app/goals/:id` |

Rule: the review result is a saved record. The app never derives "it worked" from the review date, the acceptance, or the two reports.

## 5. Check progress and add a result (journey part 4)

| # | Step | Call |
| --- | --- | --- |
| 1 | Today › 02 Progress, or Goal detail › Outcome. | `GET /api/app/today` / `GET /api/app/goals/:id` |
| 2 | Render OutcomeChart from `results` + `checkpoints`; render the server's delta `label` verbatim. | — |
| 3 | If a projection is supplied, render the band plus its assumptions sentence; otherwise render `projectionUnavailableReason`. | — |
| 4 | Label is `Add a result` / `Update needed` → tap the button → AddResult sheet. | **(client-only)** |
| 5 | Enter value, date and source; save. | `POST /api/app/changes` `{ requestId, revision, changes:[{ entity:"result", operation:"create", id:null, parentId:"<goalId>", values:"{\"value\":2,\"date\":\"2026-10-20\",\"source\":\"Reported in the app\"}" }] }` |
| 6 | For a milestone-count goal, verify the milestone instead. | `POST /api/app/changes` with `{ entity:"milestone", operation:"update", id, parentId:goalId, values:"{\"done\":true}" }` |
| 7 | Refetch the goal and Today. | `GET /api/app/goals/:id`, `GET /api/app/today` |
| 8 | Otherwise `Review plan` routes to Coach with the server-supplied prompt. | `POST /api/coach` |

Rule: completing actions never writes a result. Steps 5 and 6 are the only ways an outcome is recorded.

## 6. Schedule and book an action

| # | Step | Call |
| --- | --- | --- |
| 1 | `Schedule` on an action → SchedulePlacement, opening the week with this action's tentative block visible. | `GET /api/app/calendar?start=YYYY-MM-DD` → `{ tentative, bookings, busy, unplaced, availability }` |
| 2 | Tap a slot → `Place here` preview; other tentative blocks rearrange. | **(client-only)** from the returned tentative schedule |
| 3 | Local-only save. | `POST /api/app/changes` `{ changes:[{ entity:"workBlock", operation:"create", id:null, parentId:"<goalId>", values:"{\"action\":\"<actionId>\",\"start\":\"…\",\"end\":\"…\"}" }], requestId, revision }` |
| 4 | External booking: check availability first. | `POST /api/availability` `{ provider, calendarIds, start, end }` |
| 5 | Show `Confirm booking` naming the destination calendar and whether a check-in event is included. | — |
| 6 | Confirm. | `POST /api/bookings` `{ goalId, actionId, start, end, provider, calendarId, conflictIds, checkIn, requestId }` |
| 7 | On partial failure, keep the pending-booking panel and retry with the **same** `requestId`. | same call |
| 8 | Refetch the week. | `GET /api/app/calendar?start=…` |

Rules: no calendar connected → no busy layer and the `calendar.unknownAvailability` sentence; a tentative block never writes an external event and never marks work performed.

## 7. Learning controls from Insights

| # | Step | Call |
| --- | --- | --- |
| 1 | Coach › Insights. | `GET /api/app/insights` → `{ tryingNow, learned, history, memories }` |
| 2 | Open a record. | `GET /api/app/insights` detail or the record in the same payload |
| 3 | `Try this` / `No thanks` / `Pause` / `Resume` / `Finish trying this`. | `POST /api/learning` `{ id, version, action: "agree"\|"decline"\|"pause"\|"resume"\|"close", requestId }` |
| 4 | `version` is the pending version for `agree`/`decline` when one exists, otherwise the current version. | — |
| 5 | `Discuss in Check-in`. | `POST /api/coach` with `recordId` and `version` |
| 6 | Refetch insights and today. | `GET /api/app/insights`, `GET /api/app/today` |

Rule: controls appear only in their valid state. `Resume` is hidden while the standing is `Evidence has changed`; that record shows `learn.reconsider` and routes to review instead.

## 8. Goal lifecycle

| # | Step | Call |
| --- | --- | --- |
| 1 | `Start plan` (Draft with a chosen action). | `POST /api/app/changes` `{ changes:[{ entity:"goal", operation:"update", id, parentId:null, values:"{\"status\":\"Active\"}" }], requestId, revision }` |
| 2 | `Pause goal` / `Resume goal` / `Set goal aside`. | same, `values:"{\"status\":\"Paused\"|\"Active\"|\"Set aside\"}"` |
| 3 | `Complete goal` → confirmation naming the success criterion, then the update. | same, `values:"{\"status\":\"Completed\"}"` |
| 4 | `Delete goal` → confirmation naming what is removed. | `POST /api/app/changes` `{ changes:[{ entity:"goal", operation:"delete", id, parentId:null, values:"{}" }], … }` |
| 5 | `Edit goal` fields. | same entity, `operation:"update"`, only the changed fields in `values` |
| 6 | Plan, milestone and action edits that need reconciliation go through the coach instead. | `POST /api/coach` |

## 9. Provider setup

| # | Step | Call |
| --- | --- | --- |
| 1 | Settings › AI provider. | `GET /api/provider` |
| 2 | Choose provider, model, and either `Use this server's configured API account` or a key. | **(client-only)** |
| 3 | `Save provider`. | `POST /api/provider` `{ provider, model, useServer, key? }` |
| 4 | `Save & test connection`. | `POST /api/provider` then `POST /api/provider/test` `{}` then `GET /api/provider` |
| 5 | `Remove key`. | `POST /api/provider` `{ provider, model, useServer:false, removeKey:true }` |
| 6 | Re-check coach availability. | `GET /api/app/session` (or `GET /api/status`) |

## 10. Phone pairing (journey part 8)

| # | Step | Call |
| --- | --- | --- |
| 1 | Settings › Connections. | `GET /api/connections` (polled while the screen is open) |
| 2 | If `configured == false`, show `connections.notConfigured` and disable pairing. | — |
| 3 | Enter the number → `Get pairing code`. | `POST /api/connections/pair` `{ address }` → `{ to, send }` |
| 4 | Show the code, the destination and the 10-minute window. | — |
| 5 | Poll until `link` appears; show `Linked: …` and the opt-out state. | `GET /api/connections` |
| 6 | `Unlink phone`. | `POST /api/connections/unlink` `{}` |

## 11. Recovery flows

**Stale revision (409).** 1. Keep the user's input. 2. Show `error.staleRevision`. 3. Refetch the affected view. 4. Render `error.staleDiff` naming what changed. 5. On `Retry`, resend with the **same** `requestId` and the new `revision`. 6. If the target record is gone, show `error.recordGone` and dismiss the sheet.

**Offline.** 1. Render the last cached view with a top hairline and `error.offline`. 2. Disable mutating controls; keep drafts in `@AppStorage`. 3. On reachability, refetch the visible views. No write queue (DESIGN.md §8 item 7).

**Session expired (401).** 1. Show `error.signedOut` with `Sign in`. 2. Preserve the current route and any draft. 3. After `POST /api/auth/login`, restore the route.

**Coach unconfigured.** 1. `GET /api/app/session` reports `status.coach.configured == false`. 2. Coach shows a persistent banner with `error.noProvider` + `Set up`. 3. The composer is disabled; typed text is preserved. 4. Everything else in the app keeps working (reports, progress, calendar are deterministic).

**Coach error.** 1. Show the server's `error` string verbatim. 2. If it exceeds 240 characters, show `coach.longError` with a `What happened` disclosure containing the raw message. 3. The draft is retained and resendable.

## 12. Live refresh and deep links

1. On foreground, open `GET /api/events` (SSE) and fetch the current view.
2. On `{revision}` newer than the store's, refetch **only** the views on screen; charts re-render without an entrance animation.
3. On background, close the SSE connection; on return, resync from step 1.
4. `adler://goal/<id>` → select Goals, push `GoalDetail(id)`, then `GET /api/app/goals/:id`.
5. `adler://coach/<conversationId>` → select Coach › Conversation, then `GET /api/app/coach/:conversationId`.
6. `adler://today?card=learn` → select Today, set the card without animation, then `GET /api/app/today`.
7. If the ID 404s, fall back to the parent list with `error.deepLinkMissing`.
8. If unauthenticated, store the URL, complete onboarding/auth, then resume at step 4.
