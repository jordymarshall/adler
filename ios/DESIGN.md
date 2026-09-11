# Adler for iOS — product and design specification

Written 2026-09-11 by the product/design agent. Implementation-ready. Companion files: [`COPY.md`](COPY.md) (every UI string) and [`FLOWS.md`](FLOWS.md) (end-to-end flows with the API call per step).

Binding inputs: `docs/product-principles.md`, `docs/method/adler-method.md`, `docs/method/coaching-engineering.md` §§5–8, `docs/product-core-and-experience-plan.md`, `docs/product-structure-status.md`, `docs/evaluation/today-daily-story.md`, `docs/research/mobile-screen-design.md`, `CONTEXT.md`, `.context/ios-brief.md`. Domain words come from `CONTEXT.md` and are used literally in the UI: Goal, Plan, Milestone, Action, Report, Observation, Hypothesis, Experiment, Insight, Proposal, Recommendation, Conditional projection.

This document specifies presentation only. The app is a presentation adapter: it renders saved server records and never generates an explanation, a rationale, a projection or a state label on the client.

---

## 1. Product promise and the eight-part journey

**Promise.** You name a goal you actually care about; Adler turns it into work you can do today, learns from what you report, and changes the plan with a reason you can inspect.

The landing page (`src/landing-sequence.ts`) promises eight parts. The app must deliver each of them for real, in this order, on these screens.

| # | Landing beat (literal title) | What the person does | App screen | Primary control | Backend call |
| --- | --- | --- | --- | --- | --- |
| 1 | Turn your goal into a first plan. | Types a rough goal, answers only the questions that change the next decision, accepts the emerging plan | Welcome → Goal-first onboarding → Auth → **Coach conversation** (draft handed off) → Goal detail | `Start` → `Try this` on the first plan proposal | `POST /api/coach`, `POST /api/proposals/:id/approve` |
| 2 | See what to do today. | Sees the next useful action with its amount, timing and cue | **Today › 01 Do** | `Start` / `Report` | `GET /api/app/today`, `POST /api/app/actions/:id/start` |
| 3 | Say what got in the way. | Reports a barrier in ordinary language; Adler checks feasibility before proposing | **Coach conversation** (opened from the action or the tab) | Composer, quick prompt `Something got in the way` | `POST /api/coach` |
| 4 | See what's changed. | Reads recorded result vs saved plan checkpoints, and a conditional projection where supported | **Today › 02 Progress** and **Goal detail › Outcome** | `Review the plan` / `Add a result` | `GET /api/app/today`, `GET /api/app/goals/:id` |
| 5 | Try a change with a reason. | Reads the recommendation card, opens `Why this?`, agrees | **Coach conversation** — RecommendationCard | `Try this` · `No thanks` · `Discuss` · `Edit` | `POST /api/proposals/:id/preview` then `.../approve` or `.../dismiss` |
| 6 | See what happened. | Reports the two trial sessions, then the review | **Today › 01 Do** (ReportSheet) → **Today › 03 Learn** | `Done` + amount + note; `Review with Adler` | `POST /api/app/changes` (action update), `POST /api/coach` |
| 7 | Put what you learned into your plan. | Accepts the next plan; the original trial stays saved | **Coach conversation** — ProposalCard, then **Coach › Insights** | `Approve` | `POST /api/proposals/:id/approve`, `GET /api/app/insights` |
| 8 | Keep going by text. | Continues the same goal from Messages | **Settings › Connections** (pairing), then outside the app | `Pair a phone` | `GET /api/connections`, pairing routes |

Continuity rule the whole app must satisfy: any record reached in one place is reachable from the others (a recommendation links to its live experiment; an experiment links to its reports and its current action; a reviewed finding links to the plan change it informed). No screen restates a record in its own words.

---

## 2. Information architecture

### 2.1 Shell

`TabView` with four `Tab`s, iOS 26 Liquid Glass tab bar, `.tabBarMinimizeBehavior(.onScrollDown)`.

| Tab | Label | SF Symbol | Root |
| --- | --- | --- | --- |
| 1 | Today | `sun.max` | Today deck (3 cards) |
| 2 | Goals | `target` | All Goals |
| 3 | Coach | `bubble.left.and.bubble.right` | Coach (segmented Conversation \| Insights) |
| 4 | Calendar | `calendar` | Week |

Settings is **not** a tab. Every tab root has a trailing toolbar item: a 28pt circular monogram avatar (initial on `accent.lime`, `accent.green` text) that presents Settings as a full-height sheet. A `ToolbarSpacer(.fixed)` separates it from tab-specific actions so Liquid Glass groups them correctly.

Unauthenticated state replaces the whole `TabView` with the onboarding `NavigationStack` (Welcome → Goal input → Auth). No tab bar before sign-in.

### 2.2 Navigation stacks

Each tab owns one `NavigationStack(path:)` driven by a typed enum in `AppRouter`; pushes are cheap and reversible, decisions are sheets.

```
Today       → (no pushes; card deck) ─ sheets only
Goals       → GoalDetail(id) → MilestoneDetail(id) → ActionHistory(actionId)
Coach       → ConversationList? (inline picker) → Conversation(id) → RecordDetail(learningId)
              Insights → RecordDetail(learningId) → EvidenceSource(claimId)
Calendar    → DayDetail(date)
Settings    → Provider | CheckIns | Connections | Program | Server | About
```

### 2.3 Sheets (decisions and edits; never navigation)

| Sheet | Detents | Presented from |
| --- | --- | --- |
| ReportSheet | `.height(420)`, `.large` | Today Do, Goal detail action, Calendar block |
| SchedulePlacement (week preview) | `.large` | Action `Schedule`, Calendar unplaced row |
| EditGoal | `.medium`, `.large` | Goal detail overflow |
| PlanRationale ("Why this plan?") | `.large` | Goal detail `Why this plan?` |
| EvidenceDisclosure ("Why this?") | `.height(560)`, `.large` | RecommendationCard, LearningRow, ProposalCard |
| ProposalPreview (Current → Suggested) | `.large` | ProposalCard `Review changes` |
| ChooseAction | `.medium` | Today Do `Choose something else` |
| AddResult | `.height(320)` | Progress card, Goal detail |
| Settings (and its pages) | `.large` | Avatar |
| Confirm delete / Complete goal | `.confirmationDialog` | Goal detail overflow |

All sheets: `.presentationDragIndicator(.visible)`, `.presentationBackground(.regularMaterial)` over the card stack, `Cancel` left / primary right in a `.navigationBar` inside the sheet.

### 2.4 Deep links

Registered scheme `adler`. `AppRouter.handle(url:)` selects the tab, then sets the path.

The **canonical spelling is the contract's** (`docs/ios-api-contract.md` §7) — it is what the server writes into `SourceView.deepLink`, so it is the spelling saved in records and shared out of the app. The earlier spellings in the second column still resolve; `AppRoute` parses both and emits the canonical one.

| URL (canonical) | Also accepted | Effect | Unauthenticated |
| --- | --- | --- | --- |
| `adler://today` | — | Today, card 01 Do | store, resume after sign-in |
| `adler://today?card=do\|progress\|learn` | — | Today, that card, no animation on cold start | same |
| `adler://goals` | — | Goals tab, All Goals | same |
| `adler://goals/<goalId>` | `adler://goal/<goalId>` | Goals tab → GoalDetail(goalId) | same |
| `adler://coach` | — | Coach tab, Conversation segment | same |
| `adler://coach/<conversationId>` | — | Coach tab → Conversation segment → that conversation | same |
| `adler://insights` | `adler://coach/insights` | Coach tab → Insights | same |
| `adler://insights/<learningId>` | `adler://coach/insights?record=<learningId>` | Coach tab → Insights → RecordDetail | same |
| `adler://calendar?start=YYYY-MM-DD` | — | Calendar tab, that week | same |
| `adler://settings[/<page>]` | — | Settings sheet over the current tab | same |

Unknown IDs resolve to the parent list with an `ErrorBanner` (`COPY.md` → `error.deepLinkMissing`), never a blank screen. Deep links are also the notification tap targets when local check-in reminders are enabled.

### 2.5 Live state

One `WorkspaceStore` (`@Observable`, `@MainActor`) holds `revision` plus the decoded view models. `GET /api/events` (SSE) emits `{revision}`; on a change the store refetches only the views currently on screen. Every mutating call sends the last known `revision` and a `requestId`; a `409` triggers the StaleRevision recovery described in §4.19.

---

## 3. Design tokens

### 3.1 Colour

Semantic names are the only thing feature code may reference. Values come from `src/styles.css` (`:root` and `[data-theme="dark"]`), so web and iOS stay identical.

| Semantic | Light | Dark | Use |
| --- | --- | --- | --- |
| `canvas` | `#FAF9F6` | `#1D2822` | screen background |
| `surface` | `#FFFEFA` | `#25322A` | cards, sheets, rows |
| `surfaceSunken` | `#EDF0E5` | `#303E2C` | chips, inset wells, quiet prompts |
| `ink` | `#202020` | `#EDEDED` | body text |
| `inkMuted` | `#505050` | `#C0C0C0` | metadata, units, dates |
| `inkHeading` | `#263D32` | `#E0E8D6` | headings only |
| `separator` | `#E6E7DF` | `#394638` | 1pt hairlines, card borders |
| `accentGreen` | `#294B3A` | `#4E7045` | primary buttons, plotted plan signal |
| `accentLime` | `#D6E9A7` | `#B9D183` | brand art, rest-day marks, avatar |
| `accentPeach` | `#F6D7C3` | `#C99C7F` | brand art only |
| `focusRing` | `#75914F` | `#A8C47E` | focus/keyboard ring, 2pt, 5pt offset |
| `warning` | `#8A5A2B` | `#D9A86C` | stale/missing evidence, offline |
| `danger` | `#7A2E2E` | `#E09A9A` | destructive confirm only |

Rules. Body text is `ink` on `surface` and never carries state colour; only headings and plotted signals carry colour. Colour is never the sole signal — every coloured state also has a label, symbol or line style. Contrast: text ≥ 4.5:1, marks and control borders ≥ 3:1, in both schemes.

**Goal colours.** Do **not** re-implement `src/goal-colors.ts` in Swift (its `charCodeAt` hash over UTF-16 code units would diverge). Every goal reference from the API carries `GoalRef.color` as an `hsl(H S% L%)` string. Parse H and S, use `L = 35%` in light and `L = 62%` in dark. Used for the GoalRow leading rule, the observed-outcome line, input bars, calendar block fills and the Today Progress goal dot. Never for text under 15pt.

### 3.2 Typography

Bundle `design/adler-warm/ttf/*.ttf`. PostScript names (verified from the TTF `name` table): `AdlerWarm-Regular` (400), `AdlerWarm-Book` (450), `AdlerWarm-Text` (500), `AdlerWarm-Medium` (550), `AdlerWarm-DemiBold` (600), `AdlerWarm-SemiBold` (650), `AdlerWarm-Bold` (700). Body weight 500, heading weight 550 — matching `--body-weight` / `--heading-weight`.

All styles are `Font.custom(_:size:relativeTo:)` so Dynamic Type scales them. Values are the default (Large) size.

| Token | Face | Size | `relativeTo` | Line spacing | Use |
| --- | --- | --- | --- | --- | --- |
| `display` | Medium 550 | 34 | `.largeTitle` | 1.12 | Welcome headline, Today card numeral header |
| `title1` | Medium 550 | 28 | `.title` | 1.15 | Screen titles, recommendation headline |
| `title2` | Medium 550 | 22 | `.title2` | 1.2 | Card titles, goal title on detail |
| `title3` | Medium 550 | 19 | `.title3` | 1.25 | Section headings, action title |
| `headline` | DemiBold 600 | 17 | `.headline` | 1.3 | Row titles, sheet titles |
| `body` | Text 500 | 17 | `.body` | 1.45 | Paragraphs, chat bubbles |
| `callout` | Text 500 | 16 | `.callout` | 1.4 | Card body, secondary paragraphs |
| `subhead` | Text 500 | 15 | `.subheadline` | 1.4 | Row subtitles, criterion |
| `footnote` | Text 500 | 13 | `.footnote` | 1.35 | Metadata, receipts, limitations |
| `caption` | Medium 550 | 12 | `.caption` | 1.3 | Chart axis labels, chips |
| `eyebrow` | SemiBold 650 | 11, tracking +0.7pt, uppercase | `.caption2` | 1.2 | `OBSERVATION`, `GOAL · PLAN · MILESTONE · ACTION` labels |
| `numeric` | Medium 550 + `.monospacedDigit()` | inherits | inherits | — | all values, counts, dates, units |

Rules. At most three type tokens per card. Headings use `inkHeading`. `eyebrow` is only for structural labels and the three recommendation rows. Tabular numerals wherever a number changes in place, so a report does not reflow a row. Text never truncates a saved quantity or unit — it truncates the title (`.lineLimit(2)`, `.truncationMode(.tail)`).

Dynamic Type: every screen usable at `AX5`. Chips, segmented rows and the four recommendation controls switch to vertical stacks above `.accessibility1` via `ViewThatFits`. Charts keep their height, drop to 3 axis ticks above `.accessibility2`, and expose the full series via `.accessibilityChartDescriptor`.

### 3.3 Spacing, radii, layout

Spacing scale (pt): `xxs 2 · xs 4 · s 8 · m 12 · l 16 · xl 20 · xxl 24 · xxxl 32 · huge 40`.
Screen horizontal margin 20. Card internal padding 16 (20 on Today cards). Vertical rhythm between sections 24. Minimum hit target 44×44.

Radii: chip 8, control/button 12, card 16, Today card and large sheet 22, pill/avatar 999. Charts clip to 12.

Grid: single column. Two-column only for (a) the Current → Suggested comparison at ≥ 390pt and below `.accessibility1`, (b) the weekly budget bar legend. Everything else stacks.

### 3.4 Elevation and materials

| Level | Treatment |
| --- | --- |
| 0 canvas | `canvas` fill |
| 1 card | `surface` fill, 1pt `separator` border, radius 16, shadow `color: #283C32 @ 4%, radius 12, y 4` (light only; dark uses border alone) |
| 2 raised card | level 1 + shadow radius 20, y 8 — only the RecommendationCard and ProposalCard |
| 3 sheet | system `.regularMaterial` background + `surface` content, radius 22 |
| Glass | tab bar, nav bar and floating pager controls use the system Liquid Glass materials unmodified. Custom glass only on the Today deck pager pill: `.glassEffect(.regular.tint(accentGreen.opacity(0.12)), in: .capsule)` inside one `GlassEffectContainer`. |

Never place content behind art. Brand fans are drawn at ≤ 18% opacity, clipped to the card, and always below a `surface`-tinted scrim where text sits.

### 3.5 Motion

| Token | Duration | Curve | Reduce Motion alternative |
| --- | --- | --- | --- |
| `feedback` | 180ms | `.easeOut` | same (it is a state change, not decoration) |
| `disclosure` | 220ms | `.easeInOut` | instant |
| `cardPage` | system paging | system | paging still works; no parallax, no art motion |
| `chartEntrance` | 420ms | `.easeOut` | none — marks render final immediately |
| `artPose` | 600ms | `.easeInOut` | none — fans hold their pose |
| `receiptPulse` | 240ms once | `.easeOut` | none — the receipt text appears directly |

No looping animation anywhere. No motion is required to read anything (HIG Motion; `docs/research/mobile-screen-design.md` UX6/UX7). `@Environment(\.accessibilityReduceMotion)` gates every non-`feedback` token.

### 3.6 Chart palette and encodings (Swift Charts)

One rule governs every chart: **controllable input, reported outcome and conditional projection look different and are labelled differently.**

| Signal | Mark | Encoding |
| --- | --- | --- |
| Reported outcome (observed) | `LineMark` + `PointMark` | goal colour, 2pt solid, 6pt filled circles, `.interpolationMethod(.linear)`; line connects reports and asserts nothing between them |
| Saved plan checkpoints | `LineMark` `.interpolationMethod(.stepEnd)` + `PointMark` | `inkMuted`, 1.5pt, dash `[4,3]`, 6pt hollow squares |
| Target | `RuleMark(y:)` | `accentGreen`, 1pt, dash `[2,4]`, annotation `Target · <value> <unit>` |
| Conditional projection | `LineMark` | goal colour @ 55%, 1.5pt, dash `[5,4]`, starts at the last reported point |
| Projection range | `AreaMark(yStart:yEnd:)` + two 1pt dotted boundary `LineMark`s | goal colour @ 12% fill; boundaries at 45% so the range is legible without the fill |
| Today | `RuleMark(x:)` | `inkMuted`, 1pt, dash `[1,3]`, annotation `Today` |
| Controllable input | `BarMark` | goal colour @ 75%, corner radius 3, width `.ratio(0.6)` |
| Planned input amount | `RuleMark(y:)` per bar (`.foregroundStyle` `inkMuted`, 1pt) | the plan's amount for that occurrence |
| Missing / unknown | no mark; a `caption` axis annotation `No report` under the date | never zero |
| Stale | last point gets a `.symbol(.circle).symbolSize(60)` hollow ring + footnote `Last report <date>` | |

Action/day states (ActivityGrid, StreakLane, report strip) — label first, colour second:

| State (`executionLabels`) | Fill | Symbol | Label |
| --- | --- | --- | --- |
| `done` | goal colour, solid | — | `Done` |
| `partial` | goal colour @ 35%, solid bottom half | — | `Partly` |
| `missed` | `surface`, 1pt `separator` border, 1pt diagonal `inkMuted` slash | — | `Didn’t happen` |
| `unknown` | `surface`, 1pt dotted `separator` border | — | `Awaiting check-in` |
| `upcoming` | `surfaceSunken`, no border | — | `Upcoming` |
| rest day (`off` in `goalStreak`) | `surface` + 4pt `accentLime` centre dot | — | `Planned day off` |
| below plan (`short`) | goal colour @ 35% + 1pt solid border | — | `Below the planned work` |

Legend rules: every chart has a caption stating what it plots and its units (ONS chart-text guidance), visible without interaction (HIG Charts UX8). A chart is never the only place a number appears.

Accessibility: each chart gets `.accessibilityElement(children: .contain)`, an `.accessibilityLabel` naming the measure and unit, an `.accessibilityChartDescriptor` exposing every series and point, and — for the projection band — an `.accessibilityValue` reading the assumptions sentence. VoiceOver never announces a projection without the word "if".

---

## 4. Component library

Anatomy is given top-to-bottom. `→` names the call a control makes. String keys (e.g. `report.done`) resolve in `COPY.md`.

### 4.1 ActionCard

The one thing to do. Used on Today 01 Do (full width, `title2` scale) and in Goal detail (compact, `headline` scale).

```
┌───────────────────────────────────────────┐
│ ▍ PORTFOLIO                    ⌄ Choose    │  3pt goal rule + eyebrow + menu
│ Write for 25 minutes                       │  title2 / headline
│ 25 minutes of drafting · 8:30 · Phone in…  │  subhead, inkMuted — criterion · timing · cue
│ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│ │  Start   │ │  Report  │ │ Schedule │     │  .glassProminent / .bordered / .borderless
│ └──────────┘ └──────────┘ └──────────┘     │
│ Started 8:31 · not yet reported            │  footnote receipt line (only when true)
└───────────────────────────────────────────┘
```

Anatomy: goal rule (3pt, goal colour, full height, leading) · eyebrow goal title · action title · criterion line (`criterion · timing · cue`, empty parts omitted — never a placeholder) · controls · receipt.

States. `planned` · `started` (Start becomes the non-interactive `Started 8:31`; Report becomes prominent) · `reported` (trailing `checkmark.circle.fill`; controls collapse to `Correct this report`) · `scheduled` (Schedule shows the booked time, `calendar.badge.checkmark`) · `draft goal` (no report controls; `Proposed` chip + `Choose the work` → Coach) · `rest day` (`empty.restDay`) · `retired` (read-only).

Controls → `Start` = `POST /api/app/actions/:id/start`; `Report` = ReportSheet; `Schedule` = SchedulePlacement; `Choose` menu (`ellipsis.circle`) = ChooseAction, `Discuss this action` → Coach, `Open goal` → `adler://goal/<id>`.

Accessibility: one combined element labelled `"<goal>. <action title>. <criterion>. <timing>."` with custom actions for Start / Report / Schedule.

### 4.2 ReportSheet

The only place an outcome is recorded. Never auto-saves; never infers an amount.

```
Report                                   [Cancel]  [Save]
──────────────────────────────────────────────────────
Write for 25 minutes · Tue 13 Oct                     headline + footnote
( Done ) ( Partly ) ( Didn’t happen )                 segmented, 3 options, none preselected
How much?      [ 25 ] minutes                         numeric field + saved unit; optional
Note           [ multiline, 3 lines                 ] optional
                                                      footnote: report.unknownHint
──────────────────────────────────────────────────────
✓ Saved 8:56 · Done · 25 minutes        [ Correct ]   receipt (after save)
```

Anatomy: title · action title + the **date being reported** (defaults to the action's saved date, editable via a `DatePicker` disclosure — a report is dated, not "now") · outcome `Picker(.segmented)` with exactly `Done` / `Partly` / `Didn’t happen` (matching `Outcome` in `shared/workspace.ts`) · amount field, only when the plan defines an input measure, labelled with its saved unit · minutes field when `durationMinutes` applies · note · save.

Rules. No default outcome; `Save` is disabled until one is chosen. `Partly` needs no amount but shows `report.partlyHint`. An empty amount stays **unknown**, never 0 — the receipt reads `Done · amount not reported`. Saving shows an inline receipt with `Correct`, which reopens the sheet pre-filled and appends to `action.history`; the previous value stays visible as `Corrected from …`.

Controls → `Save` = `POST /api/app/changes` with one `{entity:"action", operation:"update", id, parentId:goalId, values:"{outcome,amount,actualMinutes,note}"}` change. `Correct` repeats it. Failure → ErrorBanner inside the sheet, inputs retained, same `requestId` on retry.

Accessibility: picker labelled `Outcome`; amount field `.keyboardType(.decimalPad)` with the unit as `.accessibilityValue`; the receipt is a live region announcing `receipt.saved`.

### 4.3 RecommendationCard

The canonical decision surface (`docs/method/coaching-engineering.md` §8; `product-core-and-experience-plan.md`). Renders `Recommendation` from `shared/behavioral-reasoning.ts` — `action`, `observation`, `interpretation`, `expectedEffect`, `reasoning`. **The client never writes any of these sentences.**

```
┌─────────────────────────────────────────────┐  elevation 2, radius 16
│ ▍ PORTFOLIO · Suggested                      │  eyebrow + StatusChip
│ Leave your phone in the kitchen before       │  title1 — recommendation.action
│ writing.                                     │
│ ┌──────────┐  No thanks   Discuss   Edit     │  1 prominent + 3 plain
│ │ Try this │                                 │
│ └──────────┘                                 │
│ ─────────────────────────────────────────    │
│ OBSERVATION      You had 25 minutes to …     │  eyebrow + callout
│ BEHAVIOURAL      Situation modification …    │
│ SCIENCE          ↳ P7 · Situation modif.     │  method/principle chip, tappable
│ WHAT WE’RE       Whether you report fewer …  │
│ TESTING                                      │
│ ─────────────────────────────────────────    │
│ Two reports support trying this again, not…  │  footnote, ALWAYS VISIBLE (limitation)
│ Why this?  ⌄                                 │  disclosure → EvidenceDisclosure sheet
└─────────────────────────────────────────────┘
```

Rules. The four controls appear **only when a decision is pending**. An accepted card shows the workflow chip plus a single `Correct this`, no decision buttons. Text labels, never a tick (a tick would ambiguously mean "done"). `Try this` is `.glassProminent` in `accentGreen`; the other three are `.plain` `subhead` in `inkMuted` — quieter, same 44pt target. The three rows use `eyebrow` labels in a leading 92pt column, stacking above `.accessibility1`. `reasoning.limitation` renders **outside** the disclosure.

Controls → `Try this` = `POST /api/proposals/:id/approve` (preview shown inline first when `changeIndexes` is non-empty). `No thanks` = `POST /api/proposals/:id/dismiss` — no reason field, no follow-up. `Discuss` = the same conversation with the record ID attached. `Edit` = composer pre-filled with `copy.editPrefill`; the card stays `Suggested`.

### 4.4 ProposalCard

A concrete change awaiting a decision (`GET /api/app/coach` → `proposals`). One coherent suggestion is one decision even when it touches several actions.

```
┌─────────────────────────────────────────────┐
│ ▍ PORTFOLIO · Proposed change                │
│ New writing plan                             │  title2
│  Current                 Suggested           │  two columns ≥390pt, else stacked
│  Write 25 min at 8:30 →  Leave your phone…   │  ChangeComparison rows
│  (no change)          →  Review on 25 Oct    │
│ Affects 2 actions · 1 plan version           │  footnote
│ Accepting this saves the plan. It does not   │  callout — consequences, always visible
│ book anything.                               │
│ [ Review changes ]                           │  → ProposalPreview sheet
│ ┌─────────┐   Dismiss          Why this? ⌄   │
│ │ Approve │                                  │
│ └─────────┘                                  │
└─────────────────────────────────────────────┘
```

`ChangeComparison` row anatomy: field label (`caption`, `inkMuted`) · current value (`callout`, `inkMuted`, `.strikethrough` only when removed) · `arrow.right` (`inkMuted`, 11pt) · suggested value (`callout`, `ink`, goal-colour left rule 2pt). Unchanged fields render `(no change)` in `inkMuted` — they are shown, not hidden, so the scope of acceptance is legible.

Controls → `Review changes` = `POST /api/proposals/:id/preview`, rendering the full affected-work list. `Approve` = `POST /api/proposals/:id/approve`. `Dismiss` = `POST /api/proposals/:id/dismiss`. Post-approval the card becomes a receipt: `Approved <date>` chip + `View the plan` → `adler://goal/<id>`.

### 4.5 LearningRow and LearningTimeline

`LearningRow` (Insights "Trying now", Today 03 Learn, Goal detail journey):

```
▍ PORTFOLIO                      ( Live experiment )   ( Consistent so far )
Leave the phone in the kitchen                          headline
2 attempts reported · Review 25 Oct                     footnote, numeric
──●──────────●────────────○────────────▽───────         LearningTimeline, 28pt tall
 start     13 Oct      15 Oct        review
```

`LearningTimeline`: a single horizontal lane. `●` filled goal-colour = a reported attempt (dated). `○` hollow = planned start with no report. `▽` = next review (`inkMuted`, dashed leader). A grey lane segment before the start marks "not yet running". **A review marker is never filled**, because a date is not a result. Under Dynamic Type ≥ `.accessibility1` the lane is replaced by a dated list. VoiceOver reads `"Planned start 12 October. 2 reported attempts: 13 October, 15 October. Next review 25 October. A review date is not a result."`

Two chips are always both present (§4.7). Tapping the row pushes RecordDetail.

### 4.6 EvidenceDisclosure ("Why this?")

One sheet, one level deep. No nested accordions (GOV.UK accordion guidance). Renders only saved fields.

Order, each a section with an `eyebrow` heading:
1. **Working explanation** — `reasoning.mechanism` and `reasoning.fit` (`body`).
2. **ReasoningDiagram** (below) — the relationship, not six equal boxes.
3. **What we predicted** — `reasoning.prediction`; **How we'll review it** — `reasoning.reviewRule`.
4. **Claims** — one row per `reasoning.grounding[]`: relation chip (`supports` / `defines` / `motivates` / `limits` / `contradicts`, each a distinct outline chip, `contradicts` and `limits` get `exclamationmark.triangle`), `claim.label`, `claim.statement`, `Grade <claim.grade>`, `claim.version`, `claim.role` (`theory` / `technique` / `empirical` / `heuristic`), and `application`.
5. **Sources** — `ResearchSource`: `title`, `authors`, `year`, `kind`, `access` (`abstract` / `method summary` / `full text excerpt`), `Retrieved <retrievedAt>`, and a link row opening `url` in `SFSafariViewController`.
6. **Alternatives** — `basis.alternatives[]` (`option` / `tradeoff`) and `reasoning.ruleExceptions[]`.
7. **Limitation** — `reasoning.limitation` plus every `claim.limitations[]`, on `surfaceSunken`.
8. **Versions and history** — `principleIds`, `methodId`, `goalRoute`, `frameworkVersion`, `scientificReview` (`Checked <at> · <provider> <model>`), prior revisions as a dated list, and corrections as `Corrected <date>` rows stating what changed.

`ReasoningDiagram` (a `Canvas`-free SwiftUI composition, ~180pt tall):

```
 YOUR REPORTS            RESEARCH                     two small chips, side by side, caption
  Oct 1, Oct 10          P7 · Situation modification     inkMuted, surfaceSunken
        └────────┬────────┘                             1pt separator curves meeting
            ▼
 ╭─────────────────────────────────────╮                the widest, most emphasised block
 │ WORKING EXPLANATION                  │               title3 text, surface, goal-colour rule
 │ Changing the setup may reduce the …  │
 ╰─────────────────────────────────────╯
            ▼
 [ Leave the phone in the kitchen ]  ( Try this )        action + its controls, one row
            ▼
 LATER FEEDBACK   13 Oct · 15 Oct · review 25 Oct        footnote, inkMuted, dated
```

Emphasis is the message: two quiet parallel inputs, one prominent explanation, the action with its controls, then dated feedback in the quietest weight. Connectors are 1pt `separator` lines, never arrows-as-decoration. With Reduce Motion or at `AX` sizes this becomes the same four blocks stacked with their `eyebrow` labels and no connectors. VoiceOver order matches the visual order and the label reads `"Inputs, then working explanation, then the action, then later feedback."` The diagram never says or implies "therefore" or "caused".

### 4.7 StatusChips

Two independent chip families that must never merge into one badge.

**Workflow state** — the server's `learningStatus(record, today)` value, rendered verbatim (filled, `surfaceSunken`, `caption`, radius 8): `Suggested` · `Live experiment` · `Starting soon` · `Ready to review` · `Reviewed` · `Paused` · `Finished` · `Declined` · `Needs another look`.

**Evidence standing** — the server's `learningStanding[standing]` value, rendered verbatim (outlined 1pt `separator`, `caption`, `inkMuted`, radius 8, VoiceOver prefix `Evidence: `): `Waiting to learn` (untested) · `More context needed` (insufficient) · `Consistent so far` (consistent) · `Mixed observations` (mixed) · `Not supported in this context` (inconsistent) · `Evidence has changed` (reconsider).

Rules. When both exist they render on one line, workflow first, separated by 8pt, never combined into a sentence. `Evidence has changed` and `Needs another look` also show `exclamationmark.triangle` in `warning`. A workflow chip alone never implies evidence; an evidence chip alone never implies the test is running. The client maps nothing — it prints the two strings the server sends.

Additional single-purpose chips: goal status (`Draft` · `Active` · `Paused` · `Completed` · `Set aside`), priority (`Focus`), data quality (`Stale` · `No measure` · `Unknown`), and proposal state (`Proposed change` · `Approved <date>` · `Dismissed`).

### 4.8 GoalRow (All Goals)

One aligned row per goal; identical column order for every goal so the list scans.

```
▍ Publish a portfolio                          ( Focus ) ( Active )
  1 of 3 case studies published · target 3 by 1 Nov      subhead, numeric
  ▪▪▫▪▪·▫  ▪▪▪▫·▪▪  ·▫▪▪▪▪▫  ▪▪▫…               ActivityGrid, 7×N, 9pt cells
  ╭╴╴╴╴ input sparkline ╴╴╴╴╮  25 min avg       InputChart compact, 44pt tall
  Next: case study 2 by 1 Nov · Update needed   footnote + delta label
```

Anatomy: 3pt goal rule · title (`headline`) · chips · result line (recorded result vs target, in the goal's own units; `outcome.noMeasure` when there is none) · ActivityGrid · input sparkline with its own unit caption · milestone implication + delta label. Tap → GoalDetail. The ActivityGrid appears **only here** (structure decision; explicitly rejected inside goal detail).

Grouping: sections `Focus` · `Active` · `Draft` · `Paused` · `Completed`, each a `Section` header in `eyebrow`. Empty groups are omitted.

### 4.9 ActivityGrid

Compact dated cells, GitHub-style, 9pt square, 2pt gap, 7 rows (Mon–Sun) × up to 14 columns, right-aligned to today, radius 2. States use §3.6. It shows **reported work**, not outcomes. Caption under the grid: `activity.caption` with the date range. A cell with no scheduled action is drawn at `canvas` (absent), distinct from `upcoming` (`surfaceSunken`) and from `unknown` (dotted). VoiceOver: one element per week — `"Week of 6 October: 3 done, 1 partly, 1 didn’t happen, 2 no report."`

### 4.10 InputChart

`BarMark` per occurrence, dated x-axis, the plan's amount as a per-bar `RuleMark`. Y-axis labelled with the saved unit (`minutes`, `pages`). Caption states measure + period. A dated **report strip** sits directly beneath in Goal detail: one 28pt chip per occurrence, `dd MMM` + state label, horizontally scrollable, tap → ReportSheet for that occurrence. One-time work replaces bars with `PointMark` timeline marks on a single lane. Retired occurrences render at 45% opacity with a `Retired` chip and are never mistaken for missing reports.

### 4.11 OutcomeChart, ProjectionBand, UnavailableReason

`OutcomeChart` plots reported results (`goal.results`) against saved checkpoints (`goal.checkpoints`) as a step line, plus `Target` and `Today` rules. Y-axis uses `goal.measure.unit`; milestone-count goals plot verified milestone counts and say so in the caption. Baselines read `Starting point`, not a result. Future-dated reports are excluded; undated completions are listed below the chart, never given an invented date.

`ProjectionBand` renders only when the server supplies a projection. It adds the dashed conditional line and the range, and **always** shows above the chart, outside any disclosure: `projection.ifLabel` (one sentence naming the assumptions) and `projection.notProbability`. `Assumptions` opens the full list and the comparable-evidence period.

`UnavailableReason` replaces the projection (never an empty panel): a `surfaceSunken` block with the server's `projectionUnavailableReason` verbatim and one control, `What would make this possible?` → Coach. The observed line and checkpoints still render above it.

### 4.12 StreakLane

One 24pt lane beneath the InputChart in Goal detail (and only there and on Today 01 Do as a count). Left: `flame` symbol + count + `days on plan`, then a second `numeric` clause `· N actions completed`. Right: one 8pt dot per day using the `goalStreak` states (`on` / `off` / `short` / `unknown` / future). Rest days use the lime centre-dot mark so the four-completions-in-seven-days accounting is inspectable. Caption `streak.explain` states that planned rest continues the count without adding completed work. The lane is never the largest element on a screen and is never framed as a target.

### 4.13 WeeklyBudgetBar (All Goals header)

A single 14pt horizontal bar, radius 7. Segments in goal colours, ordered by scheduled minutes, drawn from the same tentative-schedule calculation as capacity validation. A 1pt `accentGreen` rule marks the saved weekly budget. Above: `budget.title`; below: `N h M min planned of X h budget` (`numeric`) and, when over budget, `budget.over` in `warning`. Unplaced work is a trailing hatched segment labelled `Unplaced`. Tap → Calendar week. Legend is a wrapping row of goal dots + titles at `caption`.

### 4.14 MilestoneRail

Horizontal, scroll-snapping rail of the goal's `markers` (Milestone · Checkpoint · Review, from `shared/goal-execution.ts`), each a 120×72pt card: kind eyebrow, title, due date, and a state mark — `checkmark.seal.fill` (verified done, goal colour), hollow circle (open), `calendar` (review). Selecting a milestone **scopes the action canvas below it**; the selected card gets a 2pt goal-colour border and the canvas header reads `Showing work for <milestone>`. A milestone's own success criterion is always visible on its card detail. Completing a milestone is a separate verification control inside MilestoneDetail — never a by-product of completing an action.

### 4.15 ConversationBubble

User: `accentGreen` fill, `#FFFEFA` text, radius 18 (4 on the trailing bottom corner), max width 78%, trailing. Coach: `surface` fill, 1pt `separator`, `ink` text, leading, max width 86%. Body `body` at 1.45 line height; markdown lists and paragraphs render readably (chat stays conversational — no cards-in-bubbles). Timestamp `caption` `inkMuted` on the first bubble of each minute-group. Channel provenance (`sms`, `imessage`, `mcp`, `job`) shows as a `caption` chip on the bubble when not `web`. Message links (`message.links`) render as inline `chevron.right` rows below the bubble: `Open <goal> · Progress`. `references` render as quiet underlined spans that open RecordDetail. Recommendation and Proposal cards are **full-width inset cards between bubbles**, not bubbles (pattern reference: Claude iOS inline system card; American Airlines suggested-reply chips).

### 4.16 Composer with quick prompts

Bottom-anchored, Liquid Glass background, safe-area aware. A wrapping row of quick-prompt chips sits directly above the field, supplied by the server (`GET /api/app/coach` → `quickPrompts`) and contextual to the open conversation; tapping one inserts the text into the field (it does **not** send), so the person can edit. Field: `TextField(axis: .vertical)`, 1–6 lines, placeholder `composer.placeholder`, trailing `arrow.up.circle.fill` send button, `accentGreen`, disabled when empty. Response-in-progress: send becomes a `stop.circle` and a 3-dot `ProgressView` bubble appears with `.accessibilityLabel(copy.thinking)`; the field stays editable. Attached context (an action, a learning record) shows as a removable chip above the field: `About: Leave the phone in the kitchen  ✕`.

### 4.17 EmptyStates

One shape: `title3` heading, `callout` body explaining **what evidence is missing**, one control. Never an illustration that implies data. Never invented scaffolding — an observation with no test shows no hypothesis/test/result stages. Keys: `empty.noGoals`, `empty.draftNoPlan`, `empty.noActionsToday`, `empty.restDay`, `empty.noOutcomeMeasure`, `empty.noProjection`, `empty.noLearning`, `empty.noConversations`, `empty.calendarNotConnected`, `empty.noUnplaced`.

### 4.18 ErrorBanner

Inline, above the content it concerns, never a modal alert for a recoverable error. `surfaceSunken` fill, 1pt `warning` border, `exclamationmark.triangle` in `warning`, `subhead` message, trailing `Retry` / `Dismiss`. Variants: network (`error.offline`), server (`error.server` + the server's `error` string verbatim), stale revision (below), auth expired (`error.signedOut` + `Sign in`), provider unconfigured (`error.noProvider` + `Set up`).

### 4.19 StaleRevision recovery

On `409` from `POST /api/app/changes` or a proposal route: keep the user's input, show `error.staleRevision`, refetch the affected view, then re-present the action with a diff line naming what changed (`Your plan changed on another device: the 8:30 session moved to 9:00.`). The person retries with one tap using the **same `requestId`**, so a duplicate never applies twice. If the underlying record disappeared, the banner becomes `error.recordGone` with a `Refresh` control and the sheet dismisses.

### 4.20 LoadingSkeletons

Shape-matched, `surfaceSunken`, radius matching the real element, no shimmer under Reduce Motion (static fill). Never a full-screen spinner on a tab root. Three sizes: row (56pt), card (140pt), chart (180pt with the axis lines drawn). A skeleton is shown for at most 8s; after that the ErrorBanner replaces it. Cached content renders immediately with a 2pt top progress hairline while refetching — a refresh never blanks a screen.

---

## 5. Screen specs

Each section gives a text wireframe, hierarchy, controls with their call, states, and accessibility notes. Strings are in `COPY.md`; flows are in `FLOWS.md`.

### 5.1 Welcome

```
      ╭─ quiet lime/peach fan, top-right, 14% opacity ─╮
  Adler                                                 wordmark, 22pt, inkHeading
  Following through is the hard part.                   display, 34pt, 2 lines max
  Adler is an AI goal coach. It turns your goal into
  work you can do today and learns what helps you.      callout, inkMuted, 2 lines
  ┌────────────────────────────────────┐
  │        Start with a goal           │   .glassProminent, full width, 52pt
  └────────────────────────────────────┘
            I already have an account                    .plain, subhead
                                        Server ⌄        footnote, inkMuted, bottom
```

Hierarchy: promise → what it is → primary action → sign-in → advanced. Exactly one screenful; no carousel, no feature tour (the journey is the product, not a tour).

Controls: `Start with a goal` → push Goal-first onboarding. `I already have an account` → push Auth in `login` mode. `Server` → a `.medium` sheet with a URL field (default `http://localhost:8080`), `Save`, and a `Test` that calls `GET /api/status`.

States: no loading (nothing is fetched). If a stored session cookie exists, the app skips Welcome entirely and opens Today. Offline → the ErrorBanner appears only when `Start` is tapped and the server is unreachable; the typed goal is never lost.

Accessibility: the fan art is `.accessibilityHidden(true)`. Headline is `.isHeader`. At AX sizes the fan is removed, not scaled. Reduce Motion: fans hold one pose.

### 5.2 Goal-first onboarding

The primary action opens the goal input **before** asking for an account.

```
  ‹ Back
  ONE PLACE TO START                                     eyebrow
  What would you like to achieve?                        title1
  Describe it in your own words. We’ll work out the
  next step together.                                    callout, inkMuted
  ┌────────────────────────────────────┐
  │ Something you keep meaning to do…  │  TextEditor, 4 lines min, 1500 max
  └────────────────────────────────────┘
  ┌────────────────────────────────────┐
  │           Continue      →          │  disabled while empty
  └────────────────────────────────────┘
```

Hierarchy: one question, one field, one control. No goal-type picker, no category chips, no target/deadline fields — the coach asks only what changes the next decision.

Controls: `Continue` → if signed out, push Auth carrying the draft; if signed in, go straight to Coach with the draft as the first message. The draft is written to `@AppStorage("adler.firstGoal")` on every keystroke and survives app termination, backgrounding and authentication. It is cleared only after `POST /api/coach` returns 2xx.

States: empty (button disabled) · typing · submitting (button shows `ProgressView`, field stays editable) · error (ErrorBanner above the button, draft retained).

Accessibility: the `TextEditor` has an `.accessibilityLabel` matching the heading. `.submitLabel(.continue)`. Keyboard avoidance via `.scrollDismissesKeyboard(.interactively)`. VoiceOver announces the character limit only when within 100 of it.

### 5.3 Sign in / Create account

```
  ‹ Back
  YOUR ADLER ACCOUNT
  Create an account to save your goal.        title1 (or: Welcome back.)
  ┌ Create account ┊ Sign in ┐               segmented, register default
  Username   [                     ]
  Password   [                     ]
  Use at least 10 characters. Keep your password
  somewhere safe; email recovery is not configured.      footnote
  ┌────────────────────────────────────┐
  │           Create account           │
  └────────────────────────────────────┘
  ▸ Your goal is saved: “Publish a portfolio…”           footnote, only with a draft
```

Controls: `Create account` → `POST /api/auth/register`; `Sign in` → `POST /api/auth/login`. On success: if a draft exists, go to Coach and send it; otherwise go to Today. The cookie is stored by `URLSession`; no token handling.

States: idle · busy (`Opening…`) · error (`role=alert` equivalent: an ErrorBanner with the server's message, fields retained) · offline. The draft-goal line is always shown when a draft exists, so the person can see nothing was lost.

Accessibility: `.textContentType(.username)` / `.password` / `.newPassword`, `.textInputAutocapitalization(.never)`. The segmented control is labelled `Account`. Errors are announced via `.accessibilityAddTraits(.isStaticText)` in a live region.

### 5.4 Today — three swipeable cards

Root: a `ScrollView(.horizontal)` with `.scrollTargetBehavior(.paging)`, `.scrollTargetLayout()`, three `.containerRelativeFrame(.horizontal)` cards, `.scrollPosition(id:)` bound to the card enum. Each card fills the safe area minus a 44pt header and a 56pt footer.

```
 ✳ Your daily story                          Tue 13 Oct        header: wordmark + date
 ┌ 01 Do ┊ 02 Progress ┊ 03 Learn ┐                             pager pill (Liquid Glass)
 │                                                   │
 │                  card content                     │
 │                                                   │
 ‹ Back                     01 / 03            Next ›            footer buttons
```

Header and footer stay visible; long content scrolls **within** the card. Swiping, the pager pill and Back/Next are three equivalent routes. Inactive cards are `.accessibilityHidden(true)` and `.allowsHitTesting(false)`. The selected card persists as `adler://today?card=…` state and is restored on relaunch; a fresh launch starts on `01 Do`. Reduce Motion: paging works, art holds, no crossfade.

#### 01 Do

```
 ▍PORTFOLIO                                        ○ 1/3
 Write for 25 minutes                              ring: reported-done count
 25 minutes of drafting · 8:30 · Phone in kitchen
 [ Start ]  [ Report ]  [ Schedule ]
 ───────────────────────────────────────────────
 TODAY’S LINEUP · 3 actions
 ▸ Write for 25 minutes      Portfolio     Up next
 ▸ Read 20 pages             Reading       Done
 ▸ Send 1 application        Job search    Awaiting check-in
 Show all 5 actions
 ───────────────────────────────────────────────
 Plan & progress ›          Choose something else ⌄
```

Hierarchy: the single next action (ActionCard, §4.1) → progress ring → full lineup → routes out. The ring (`Circle().trim`, 72pt, 8pt stroke, `accentGreen`) shows **reported done today / actions scheduled today** as text inside; never a percentage across goals, never the only way to read the count.

Controls → ActionCard controls; a lineup row opens ReportSheet (if reported) or selects that action; `Show all N actions`; `Choose something else` → ChooseAction; `Plan & progress` → `adler://goal/<id>`.

States. Nothing scheduled → `empty.restDay` + `Choose a goal`; ring shows `—` with caption `nothing scheduled`. Prerequisite not met → row reads `Waiting on earlier work`, disabled. Earlier/future work → `Earlier work · 11 Oct` / `Coming up · 15 Oct` above the title. Draft goal → `Plan first action` only. Loading → card + three row skeletons. Offline → cached `today` with a top hairline and `error.offline`.

Accessibility: card label `1 of 3: What you need to do today`; the ring is one element (`"2 of 3 actions reported done today"`); each lineup row is one combined element.

#### 02 Progress

```
 02 Your progress            3 GOALS · 13 Oct
 The whole picture.
 Where each goal stands. Next to the plan you chose.
 ── Recorded results  ╌╌ Plan checkpoints                legend, always visible
 ───────────────────────────────────────────────
 ▍Publish a portfolio                              ›
  1 / 3 case studies published · Reported 8 Oct
  ╭──────── OutcomeChart, 150pt ────────╮
  3 case studies planned by 1 Nov · Still open: Case study 2
  Next: 2 case studies · 20 Oct
  [ Update progress ]
 ───────────────────────────────────────────────
 ▍Read 24 books …
 Checkpoints are commitments, not forecasts. Lines
 join saved reports; changes between reports are unknown.
```

Every goal appears — including Draft, Paused and Completed. Row: title → recorded result / target in its own unit → OutcomeChart (§4.11) → the server's delta label verbatim (`Below checkpoint` · `At checkpoint` · `Above checkpoint` · `Update needed` · `Verify the milestone` · `Milestone still open` · `Add a result` · `First checkpoint ahead` · `No dated checkpoint` · `No outcome measure`, or the goal status) → next checkpoint → one route.

Rules encoded here: no aggregate percentage across goals; action completion never appears; a report older than the due checkpoint shows `Update needed` and no numeric gap; a decreasing target is not coloured as failure; a baseline reads `Saved starting point`; a goal with no measure reads `No outcome measure saved` and gets no invented target.

Controls → row or chart tap → `adler://goal/<id>`; the button uses the server's label (`Update progress` / `Shape the plan` / `Review plan`) and routes to Coach with the server-supplied prompt, or opens AddResult when the label is `Add a result` and a numeric measure exists.

States: no goals → the Today root shows onboarding. Loading → three chart skeletons. Stale → hollow last point + `Last report 8 Oct`.

Accessibility: every chart has an `.accessibilityChartDescriptor` and a summary naming result, unit, due checkpoint and delta label; the legend is text, not colour alone.

#### 03 Learn

```
 03 What we’re learning                    Live experiment
 ▍PORTFOLIO
 Leave the phone in the kitchen                 title2
 Working hypothesis
 Changing the setup may reduce the pull to check it…
 ┌ WHAT YOU REPORTED ──────┐   ┌ WHAT WE’RE WATCHING ────┐
 │ I had 25 minutes to …   │ → │ Did the phone stay in…  │
 └─────────────────────────┘   └─────────────────────────┘
 Consistent so far
 ── LearningTimeline ────────────────────────────
 [ Review suggestion ]  [ Share an update ]  [ Review with Adler ]
 Review 25 Oct · Your experience will inform what comes next.
                                          ‹  1 / 3  ›
```

Hierarchy: workflow chip → the change → hypothesis → two-input diagram → evidence standing → timeline → controls → the honest status sentence. Server ordering: evidence changed, then review due, then pending decision. A pending revision **never replaces** the agreed test — it sits above it in a `surfaceSunken` block headed `A revised suggestion` with its own `Try this` / `No thanks`.

Controls → `Review suggestion` / `Explore the experiment` → RecordDetail; `Share an update` / `Review with Adler` / `Discuss with Adler` → Coach with the record and version attached; `‹ ›` pages records.

States: empty → `empty.noLearning`, showing the latest saved memory (`YOU TOLD ADLER`) or `A PLACE TO START`, inviting a report without inventing an experiment, hypothesis or result. Paused → only `Resume` and `Discuss`. `Evidence has changed` → a `warning`-bordered note above the controls.

Accessibility: card label `3 of 3: What we’re learning`; the pager is a `Button` pair labelled `Previous learning question` / `Next learning question` with a `1 of 3` value.

### 5.5 Goals (All Goals)

```
 Goals                                       [ + ]   ⊙
 ╭ This week ────────────────────────────────────╮
 │ ▬▬▬▬▬▬▬▬▬▬▬▬│▬▬▬▬  ▨▨                        │  WeeklyBudgetBar
 │ 4 h 10 min planned of 5 h budget              │
 │ ● Portfolio  ● Reading  ▨ Unplaced            │
 ╰───────────────────────────────────────────────╯
 FOCUS
   GoalRow …
 ACTIVE
   GoalRow …
 DRAFT
   GoalRow (no chart; “Plan not started”)
```

Hierarchy: weekly capacity → grouped rows. Sections: `Focus` · `Active` · `Draft` · `Paused` · `Completed`; empty sections omitted. The ActivityGrid lives here and nowhere else.

Controls: `+` → Coach with the new-goal prompt (a new goal is created by the coach, not by a form; a manual path is available from Settings). Row tap → GoalDetail. Budget bar tap → Calendar.

States: no goals → `empty.noGoals` with one control `Start with a goal`. Draft rows show `Draft` chip, no activity grid, no sparkline, and the line `Goal saved · plan not started`. Over budget → the bar's overflow segment plus `budget.over` in `warning`. Loading → four row skeletons.

Accessibility: each row is one element reading title, status, result, then `Activity: 3 done, 1 partly, 2 no report this week`. The budget bar is one element with planned/budget values spoken as numbers with units.

### 5.6 Goal detail

`NavigationStack` destination. `.navigationTitle(goal.title)`, `.navigationBarTitleDisplayMode(.inline)`, trailing `ellipsis.circle` menu.

```
 ‹ Goals                                            ⋯
 GOAL                                                      eyebrow
 Publish a portfolio                                       title1
 3 case studies published · Target 1 Nov · Flexible
 1 / 3 case studies · Reported 8 Oct
 ───────────────────────────────────────────────
 PLAN · v4              Why this plan? ›                   eyebrow + control
 LearningJourney (dated rail: Starting plan · Plan
 updated · Review saved · Next review 25 Oct)
 ───────────────────────────────────────────────
 MILESTONE                                    All actions
 [ MilestoneRail ▸▸▸ ]
 Result to reach: Case study 2 published
 ───────────────────────────────────────────────
 ACTION
 [ ActionCard, compact ]
 ╭ InputChart (minutes per session) ───────────╮
 │ dated report strip ▸▸▸                      │
 ╰─────────────────────────────────────────────╯
 🔥 7 days on plan · 4 actions completed  ● ● ○ ● ◌ ● ●
 ───────────────────────────────────────────────
 OUTCOME
 [ OutcomeChart + ProjectionBand  |  UnavailableReason ]
 If your reported pace continues · 12 Nov
 Scenario range · 2 Nov – 8 Dec        Assumptions ›
 ───────────────────────────────────────────────
 History & settings ⌄
```

Hierarchy is the structure decision made literal: **Goal → Plan → Milestone → Action**, each with its eyebrow label, then the subordinate outcome projection, then history. Selecting a milestone scopes the action canvas below it and the header reads `Showing work for <milestone>`.

Repeating measured work shows the InputChart + report strip + StreakLane. One-time work shows dated timeline marks instead. An earlier plan version can be selected from the journey; the canvas then shows `EARLIER PLAN`, hides edit controls, and adds `Retired` to the legend.

Controls → ActionCard controls; `Why this plan?` → PlanRationale sheet; milestone card → scopes actions; milestone card detail → MilestoneDetail (its criterion, due date, and the separate `Mark this milestone verified` control, which is an outcome verification, never a side effect of an action); `Assumptions` → the projection assumption list; `⋯` menu → `Edit goal` · `Pause goal` / `Resume goal` · `Set goal aside` · `Complete goal` · `Delete goal`.

Sub-sheets. **Action report** = ReportSheet (§4.2). **Schedule / placement** = the week with this action's tentative block visible and `Place here`; booking needs a connected calendar and explicit confirmation. **Edit goal** = title, why, success, target date, deadline flexibility, measure (changing the measure warns that prior results are archived). **Plan rationale** = `PlanningBasis` in order: interpretation → `THE APPROACH` / `WHY THIS MEASUREMENT` → action measure → `Alternatives Adler considered` → `Research & applicability · N sources` → `What remains uncertain` + assumptions → `CHECK THE APPROACH · <date>` + review question. **Milestone detail** = criterion, due date, contributing actions, verify control. **History** = plan versions, earlier measurements, earlier checkpoint schedules, and every action with its `history[]` revisions as `Corrected …` rows.

States: Draft with no plan → `empty.draftNoPlan` replaces the canvas, and `Start plan` appears only once an action exists. Milestone with no actions → `empty.noActionsForMilestone`. No projection → UnavailableReason. Completed/paused → report controls hidden, history intact. Loading → header + two chart skeletons. Conflict on save → §4.19.

Accessibility: each eyebrow is `.isHeader`, so the VoiceOver rotor exposes Goal / Plan / Milestone / Action / Outcome; the MilestoneRail uses `.accessibilityAdjustableAction` for selection.

### 5.7 Coach — Conversation

```
 Coach                                              ⊙
 ┌ Conversation ┊ Insights ┐                           segmented, .navigationBar
 Portfolio ⌄                                           conversation picker
 ───────────────────────────────────────────────
                            I had time to write, but  ← user bubble
                            spent it scrolling.
  Do you need your phone for the work, or to be
  reachable during those 25 minutes?                   ← coach bubble
  ╭ RecommendationCard ─────────────────────────╮      inset card, not a bubble
  ╰─────────────────────────────────────────────╯
  ● ● ●   Thinking with you…
 ───────────────────────────────────────────────
 ( Something got in the way ) ( What should I do today? )   quick prompts
 [ A goal, an update, or something to work through…  ↑ ]
```

Hierarchy: segment → conversation picker (`Menu` listing per-goal conversations + `General`) → thread → composer. Cards (Recommendation, Proposal) are inset between bubbles. Message links render below the bubble.

Controls → composer `send` = `POST /api/coach`; quick prompt inserts text; RecommendationCard and ProposalCard controls per §4.3/§4.4; the conversation picker switches `conversationId` and refetches.

States: no provider configured → a persistent banner above the thread, `error.noProvider` + `Set up`, and the send button disabled. Empty thread → the welcome block (`What would you like to work through?` / goal-specific line). Sending → `Thinking with you…` with the composer still editable and a `stop.circle` cancel. Error → ErrorBanner with the server message; the draft is kept in `@AppStorage` per conversation and restored. Offline → the composer is disabled with `error.offline`; the draft is retained.

Accessibility: the thread is `.accessibilityLabel("Conversation with Adler")` with `.accessibilityAddTraits(.updatesFrequently)`; new coach messages are announced once via `AccessibilityNotification.Announcement`. Bubble elements read `"Adler: …"` / `"You: …"` including the channel when not the app.

### 5.8 Coach — Insights (and record detail)

```
 ┌ Conversation ┊ Insights ┐            All goals ⌄
 TRYING NOW · 2
   [ LearningRow with LearningTimeline ]
   [ LearningRow · Needs another look ⚠ ]
 WHAT WE’VE LEARNED
   Portfolio · A clear stopping point helped twice
   Consistent so far · Kept in the current plan
 ▸ Earlier attempts & history
 ▸ Saved context & preferences
```

Hierarchy: question-first. `Trying now` lists current experiments with state, reported attempts and next review on the timeline; attention cases (`Ready to review`, `Evidence has changed`) sort first and carry the `warning` symbol. `What we've learned` lists findings with scope, evidence standing and the planning consequence — a finished test does not hide a useful finding. History and memories are separate disclosures, so saved context never looks like a tested finding.

Record detail (pushed) renders in this order, using only saved stages: **Observation → Behavioural interpretation → Hypothesis / change → Dated reports → Review → Updated understanding**, then `Why this test? · Behavioural science & evidence` (EvidenceDisclosure), then versions and corrections. Controls: `Try this` (agree) · `No thanks` (decline) · `Pause` · `Resume` · `Finish trying this` (close) → `POST /api/learning`; `Discuss in Check-in` → Coach with the record. Each control is visible only in its valid state (§4.5 rules; `Resume` never appears while standing is `Evidence has changed`).

States: empty → `empty.noInsights` (`Start with what happened.`) with one control into Coach. Goal filter (`Menu`) scopes both sections. An observation with no test renders only two parts — `What you told Adler` and `How this shapes your plan` — with no empty hypothesis/test/result scaffolding.

Accessibility: sections are headers; each row reads change, workflow state, evidence standing, attempts and next review in that order, ending with `A review date is not a result` when a review is scheduled but unreported.

### 5.9 Calendar week

```
 ‹ 13–19 Oct ›                    Today      ⊙
 Europe/London
 ── legend: ● Portfolio ● Reading ▨ Other commitments
    ╌ Tentative   ◻ Check-in
 ┌ Mon Tue Wed Thu Fri Sat Sun ┐
 │  hour grid, 72pt/hour, entries positioned      │
 └───────────────────────────────────────────────┘
 ▸ 2 actions need room or a prerequisite
 Connect or refresh your calendars to see external busy time.
```

Entry encodings: **booking** (solid goal colour, 2pt border) · **tentative Adler block** (goal colour @ 30%, 1.5pt dashed, `Tentative` badge) · **placement preview** (lime @ 40%, dashed, `Place here`) · **external busy** (`surfaceSunken`, diagonal hatch, `Other commitment`) · **check-in** (`accentGreen` outline). Suggested, booked and reported are never conflated.

Controls: week paging, `Today`, day/time tap → placement; tentative block → its action; booking → a sheet with `Report` and `Open goal`; `Manage calendars` → Settings › Connections. Booking requires a connected calendar **and** an explicit `Confirm booking` that names the target calendar and whether a check-in event is included.

States: not connected → the honest availability sentence and no busy layer (missing availability is unknown, not "free"). Stale availability (>5 min) → `Availability is checked again when you book.` Over budget → placement refused with `calendar.overBudget`. Interrupted booking → a `Finish confirming your time` panel with `Retry confirmation` (same request identity) and `I checked my calendar · close this booking`.

Accessibility: a per-day agenda list below the grid is what VoiceOver and Dynamic Type users read; each entry reads title, time and kind.

### 5.10 Settings

Presented as a `.large` sheet with its own `NavigationStack`. Order is ordinary preferences first, advanced last.

```
 Settings                                       Done
 ⊙  jordan                                Signed in
 PREFERENCES
   Time zone                    Europe/London ›
   Appearance                   System ›
 COACHING
   Coaching program                          ›
   Check-ins                        On · 21:00 ›
   Connections                 Phone linked ›
   AI provider           Server key · gemini ›
 ADVANCED
   Server                  http://localhost:8080 ›
   About & method                             ›
   Sign out
```

- **AI provider** — provider picker (`Google Gemini` / `OpenAI GPT` / `Anthropic Claude`), `Model`, `Use this server's configured API account` (only when allowed), `API key` (hidden when using the server account), `Save provider`, `Save & test connection`, `Remove key`. The encryption/billing hint stays visible; the test result names the model and the time it succeeded.
- **Check-ins** — enable toggle, `When to check in` (`After scheduled work` / `At the end of my day`), daily time (end-of-day only), review time, quiet hours, and a delivery/job status disclosure. The hint that a linked phone is required and that daily invitations do not infer missed work is always visible.
- **Connections** — pairing code flow (code, destination, 10-minute window), linked state with opt-out, `Unlink phone`, MCP/webhook tokens (create 30-day, copy once, revoke), connected calendars.
- **Coaching program** — weekly minutes, session length, work window, days available, review day; advanced disclosure for focus goal, sprint, approach, enabled methods and the revision reason. Saving writes a new program version with that reason.
- **Server** — base URL, `Test` (`GET /api/status`), and a note that changing it signs the session out.

States: every page shows real state and never an unconfigured capability (`Phone messaging has not been connected on this server yet.`, `Optional` vs `Connected` per calendar). Saves show an inline receipt, not a toast; errors are inline and retain input.

Accessibility: grouped `Form` with real headers; each toggle carries a consequence footnote; `Sign out` and `Delete goal` use `.confirmationDialog` naming the consequence.

---

## 6. Copy principles

1. **Literal app labels.** Buttons name the operation: `Report`, `Try this`, `No thanks`, `Approve`, `Dismiss`, `Start`, `Schedule`. Never `Let's go`, `Got it`, `Awesome`.
2. **Extremely short.** Controls 1–3 words. Card headlines one line. Body sentences under 20 words where possible.
3. **Neutral body text.** No exclamation marks, no praise, no second-guessing of motivation. Ordinary text is readable and colourless; headings and plotted signals carry colour.
4. **Uncertainty stays outside disclosures.** Limitations, `A review date is not a result`, `Missing reports are unknown`, and projection assumptions are visible without opening anything.
5. **The domain words from `CONTEXT.md`**, used consistently: Goal, Plan, Milestone, Action, Report, Observation, Hypothesis, Experiment, Insight, Proposal, Conditional projection. No synonyms.
6. **Never render a state the server did not send.** All workflow states, evidence standings, delta labels, projection statuses and unavailable reasons are printed verbatim.
7. **Never invent capability.** No pricing, no trials, no integrations that are not configured, no download links. `Coming soon` only where the server reports the feature as unavailable.
8. **Dates are explicit.** `13 Oct`, `Reported 8 Oct`, `Review 25 Oct` — never `recently`, `soon`, `a while ago`.

All strings, grouped by screen, are in [`COPY.md`](COPY.md).

---

## 7. Acceptance checklist per screen

Observable pass/fail checks, run on device with a real account, derived from the H-checks in `docs/research/mobile-screen-design.md` (comprehension, first-action, state, evidence, continuity, access).

**Welcome / Onboarding / Auth.** Reaches the goal field without an account. Typed goal survives backgrounding, force-quit, account creation and a failed first request. Asked what happens next, the person says the coach will turn it into a plan (not "it saved a task"). Usable at AX5 with no truncation.

**Today · 01 Do.** Identifies the next action, its amount and its time without scrolling. Predicts correctly what `Done` / `Partly` / `Didn't happen` do, then finds and uses `Correct`. A blank amount reads `amount not reported`, never `0`. With four completions across a seven-day streak, explains `7 days on plan · 4 actions completed`. Swipe, pager pill and Back/Next each change cards; VoiceOver reaches all three; Reduce Motion keeps navigation.

**Today · 02 Progress.** Distinguishes recorded results from plan checkpoints using the legend alone. With a report older than the due checkpoint, says the comparison is not current — not that the goal is behind. A goal with no measure shows no target and the person says so. Tapping a row reaches that goal with the same numbers.

**Today · 03 Learn.** States the change being tried, the number of reported attempts and the review date. Says a review date does not mean it worked. With a pending revision, identifies which test is currently agreed. With no record, no experiment scaffolding appears.

**Goals.** Reads one goal's result, activity and milestone implication in one pass. Explains what the weekly bar counts and notices over-budget. The activity grid appears only here.

**Goal detail.** Names the Goal, Plan, Milestone and Action for the selected work. Selecting a milestone visibly scopes the actions below. Completing an action does not verify the milestone; the person finds the separate verify control. Where a projection exists, states one assumption without opening anything and says the range is not a probability; where it does not, reads the saved reason and sees no empty forecast panel. `Why this plan?` reaches a source with its grade and limits in one expansion.

**Coach — Conversation.** Predicts what `Try this`, `No thanks`, `Discuss` and `Edit` do before tapping. After `Try this`, the card shows the saved state and the affected plan is reachable. The preview lists every affected action before acceptance. `Why this?` shows a real source with its grade, and the person says the research does not prove it will work for them. Interrupting a send keeps the draft.

**Coach — Insights.** After leaving chat, finds the current test, the earlier attempt and the reason for the next change. Distinguishes a saved preference from a tested finding. A corrected record shows `Evidence has changed` and the person says it needs review before use.

**Calendar.** Distinguishes tentative, booked and external busy time by sight. Booking requires explicit confirmation naming the calendar. With no calendar connected, says availability is unknown — not free.

**Settings.** Can tell whether coaching uses the server key or their own. Check-in settings state that a linked phone is required. Sign out and destructive actions name their consequence before confirming.

**Global.** Usable at AX5 with no clipped values or unreachable controls. VoiceOver reaches every control; every chart has a spoken summary and a data descriptor. Reduce Motion removes all non-`feedback` animation with no information lost. Dark mode holds >=4.5:1 text and >=3:1 mark contrast. Killing the network mid-save keeps the input and offers one retry that does not duplicate.

---

## 8. Open questions and recommended defaults

Each has a default so implementation is not blocked.

| # | Question | Recommended default |
| --- | --- | --- |
| 1 | Local notifications? The server owns SMS check-ins. | Ship v1 without them; add `NSUserNotificationsUsageDescription` only when Check-ins gains an in-app channel. Deep links already work as notification targets. |
| 2 | Manual goal creation without the coach? | No manual form in v1. `+` always goes to Coach; a Draft goal with no plan already covers "save my goal now". |
| 3 | Conversation list: toolbar picker or pushed list? | Toolbar `Menu` picker; push a full list once there are more than eight conversations. |
| 4 | How does `Edit` revise a proposal? | Keep the composer pre-fill — revision must go through the coach so the rationale and affected hypothesis stay consistent. A structured editor is a later design. |
| 5 | Goal colour in dark mode. | Lighten the shared HSL to 62%; verify 3:1 against `#25322A` and clamp lightness upward per-hue if a hue fails (never change saturation). |
| 6 | iPad layout. | iPhone layout in a readable-width column; Goal detail splits into journey + canvas at regular width, matching the web composition. No new panels. |
| 7 | Offline writes. | No write queue in v1. Saves require connectivity; drafts and typed input are preserved locally and retried manually. A queue needs conflict semantics the server does not define. |
| 8 | All Goals sparkline window. | Last 14 days of input; the adjacent ActivityGrid already carries 12 weeks of adherence. |
| 9 | Where the reasoning diagram appears. | EvidenceDisclosure only. Today 03 Learn uses the inline two-input version; repeating the full diagram everywhere would flatten emphasis. |
| 10 | Streak visibility. | Goal detail and the Today Do ring caption only. Never a tab badge or widget headline — a streak is not the objective. |
