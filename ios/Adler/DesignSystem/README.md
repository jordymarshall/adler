# Adler design system (iOS)

Implements [`ios/DESIGN.md`](../../DESIGN.md) §3 (tokens) and §4 (component
library). Strings come from [`ios/COPY.md`](../../COPY.md).

Everything here takes **value types defined in this folder** — strings,
numbers, dates and small `Sendable` structs. No component knows about the API
models in `Core/Models`, so a contract change never ripples into layout.

Two rules run through the whole library, from
[`.context/ios-brief.md`](../../../.context/ios-brief.md) §4:

1. **Acceptance ≠ action happened ≠ hypothesis worked.** A review date is not
   a result. Unknown ≠ zero. Missing measurement stays "unknown".
2. **Controllable input, reported outcome and conditional projection look
   different and are labelled differently.** Projection ranges are scenarios
   with assumptions, never probabilities.

Components encode those rules; they are not left to feature code.

---

## Tokens

### `Tokens/Colors.swift`

Semantic `Color` statics mapping to the asset catalog: `canvas` (Bg),
`surface` (Paper), `surfaceSunken` (Sage), `ink`, `inkMuted` (Muted),
`inkHeading` (HeadingInk), `separator` (Line), `accentGreen`, `accentLime`
(Lime), `accentPeach` (Peach). `focusRing`, `warning` and `danger` are defined
in Swift because the scaffold shipped no colour sets for them.

`accentInk` is the accent for **text, links and thin marks**. `accentGreen`
is a fill: white on it passes, but `#4E7045` *as ink* on the dark surface is
about 2.4:1. `accentInk` stays `accentGreen` in light and lightens in dark to
reach ~7:1. Use `accentGreen` for fills (prominent buttons, the user's chat
bubble, glass tint) and `accentInk` for anything read as text or a 1–2pt
mark.

`GoalColor` parses the server's `hsl(H S% L%)` string and **applies the app's
own lightness**: 35% in light, 62% in dark. `GoalColor.parse(_:)` falls back
rather than throwing. `ChartStyle` holds the §3.6 line widths, dashes and
opacities.

**Do** reference semantic names only. **Don't** use a goal colour for text
under 15pt, and don't re-implement `src/goal-colors.ts` (its hash runs over
UTF-16 code units and a Swift port would drift).

### `Tokens/Typography.swift`

`AdlerTextStyle` (`display · title1 · title2 · title3 · headline · body ·
callout · subhead · footnote · caption · eyebrow`) and
`.adlerText(_:numeric:)`, which applies font, leading, tracking and casing.
All styles are `relativeTo:` so Dynamic Type scales them.

**Do** pass `numeric: true` for every value, count, date and unit — tabular
figures stop a row reflowing when a report lands. **Don't** use more than
three type tokens on one card, and don't use `eyebrow` for anything but
structural labels.

### `Tokens/Spacing.swift`

`Space` (`xxs 2 … huge 40`), `Radii` (chip 8, control 12, card 16, largeCard
22, chart 12, pill, cell 2), `AdlerLayout` (screen margin 20, card padding 16,
Today card padding 20, section gap 24, 44pt hit target, 92pt eyebrow column).
`DynamicTypeSize.prefersStackedControls` (≥ `.accessibility1`) and
`.prefersSimplifiedCharts` (≥ `.accessibility2`) are the two switches every
component uses to reflow.

### `Tokens/Materials.swift`

`.adlerCard(_:radius:fill:)` (level 1/2 elevation; shadow in light only),
`.adlerWell()` (`surfaceSunken` inset), `.adlerSheetSurface()`, and
`.adlerGlassCapsule()` — the only custom Liquid Glass in the app, with an
opaque fallback under Reduce Transparency.

### `Tokens/Motion.swift`

`Motion` holds the raw durations; read them through
`@Environment(\.adlerMotion)`, which returns `nil` animations when Reduce
Motion is on. `feedback` survives Reduce Motion (it is a state change, not
decoration); `disclosure`, `chartEntrance`, `artPose` and `receiptPulse` do
not.

---

## Components

### ActionCard

**Purpose** — the one thing to do. Today 01 Do (full) and Goal detail
(compact).

```swift
ActionCard(model: ActionCardModel, scale: .full,
           onStart:, onReport:, onSchedule:, onChoose:)
```

**Inputs** — `ActionCardModel(goal: DisplayGoal, title:, criterion:, timing:,
cue:, state:)`.

**States** — `.planned` · `.started(at:)` · `.reported(receipt:)` ·
`.scheduled(at:)` · `.draftGoal` · `.restDay` · `.retired`.

**Do** let the criterion line omit empty parts. **Don't** print a placeholder
for a missing criterion, cue or time; don't offer report controls on a Draft
goal; don't let `Started 8:31` read as a report — it is a receipt and the card
says "not yet reported".

### ReportSheet

**Purpose** — the only place an outcome is recorded.

```swift
ReportSheet(actionTitle:, plannedDate:, unit:, asksMinutes:, initialDraft:,
            receipt:, errorMessage:, onSave: (ReportDraft) -> Void, onCancel:)
```

A correction **must** seed the sheet: pass `initialDraft:`, or fill
`ReportReceipt.amount`/`.minutes`/`.note`. Empty amount fields invite a retype of a measurement
that is already saved. (The wire is safe either way — `ChangeBuilder` omits an absent amount and
an omitted key means "unchanged" server-side.)

**Inputs/outputs** — `ReportDraft(outcome: ReportOutcome?, amount: Double?,
minutes: Int?, note:, date:)`; `ReportReceipt(savedAt:, outcome:, amountText:,
correctedFrom:)` whose `summary` reads `Saved 8:56 · Done · 25 minutes`.

**States** — nothing chosen (Save disabled) · `Partly` (shows the hint) ·
saved receipt with `Correct` · error banner inside the sheet.

**Do** keep `amount == nil` as unknown all the way to the API. **Don't**
default an outcome, don't send `0` for a blank amount, and don't date a report
"now" — it defaults to the action's saved date and is editable.

### RecommendationCard

**Purpose** — the canonical decision surface. Renders a saved
`Recommendation`; the client never writes these sentences.

```swift
RecommendationCard(content: RecommendationContent,
                   onTryThis:, onNoThanks:, onDiscuss:, onEdit:,
                   onCorrect:, onWhyThis:)
```

**Inputs** — `RecommendationContent(goal:, action:, observation:,
interpretation:, methodReference:, expectedEffect:, limitation:, state:,
stateLabel:)`. `stateLabel` is the server's workflow string, verbatim.

**States** — `.pending` (all four controls) · `.agreed` · `.declined` ·
`.applied` (chip plus `Correct this`).

**Do** keep `limitation` outside the "Why this?" disclosure — it is always
visible. **Do** keep `No thanks` at the same 44pt target as `Try this`.
**Don't** show a tick instead of a text label (a tick would ambiguously mean
"done"), don't ask for a reason when declining, and don't imply that agreeing
is evidence — the agreed state says so explicitly.

### ProposalCard

**Purpose** — a concrete change awaiting a decision. One coherent suggestion
is one decision, even across several actions.

```swift
ProposalCard(content: ProposalContent,
             onApprove:, onDismiss:, onReviewChanges:, onWhyThis:, onViewPlan:)
```

**Inputs** — `ProposalContent(goal:, title:, comparisons:
[ChangeComparisonRow], affectedSummary:, consequence:, bookingConsequence:,
expiryNote:, state:)`.

**States** — `.pending` · `.approved(at:)` (becomes a dated receipt with
`View the plan`) · `.dismissed`.

**Do** render unchanged fields as `(no change)` so the scope of acceptance is
legible. **Don't** hide the consequences line, and **don't** claim a booking:
`consequence` says accepting saves the plan and books nothing unless
`bookingConsequence` is present.

### ChangeComparison

`ChangeComparison(row: ChangeComparisonRow, goal:)` — field label, current
value (struck through only when removed), `arrow.right`, suggested value with
a 2pt goal-colour rule. Two columns above 390pt, stacked below and at
accessibility sizes.

### LearningSummaryRow + LearningTimeline

> Named `LearningSummaryRow`, not `LearningRow`, because `Core/Models` already
> defines `LearningRow` as a server view type in the same module.

**Purpose** — a learning record as a row, plus the lane that dates it.

```swift
LearningSummaryRow(content: LearningSummaryRowContent, onOpen:)
LearningTimeline(layout: LearningTimelineLayout, goal: GoalColor, height: 28)
```

**Inputs** — `LearningSummaryRowContent(goal:, change:, workflowLabel:,
standingLabel:, attemptsReported:, timeline:)`;
`LearningTimelineLayout(plannedStart:, occurrences:, review:, today:)`, where an `Occurrence` is
`(date:, reported:)`. A **planned day with no report is a hollow tick**, not a filled dot: drawing
it filled told a card whose caption reads "No attempts reported yet" that three attempts had been
reported. Marks sit on the axis; the review triangle sits above it. The legacy
`(plannedStart:attempts:planned:review:today:)` initialiser still exists — `planned:` defaults to
empty, so nothing that has not adopted it changes behaviour.

**States** — running · not started (grey lane before the start) · no review
date (`Review after useful feedback`) · accessibility sizes (the lane becomes
a dated list).

**Do** show both chips, always. **Don't** fill the review marker — a date is
not a result — and don't merge the two chip families into one badge.

### EvidenceDisclosure

**Purpose** — "Why this?": one sheet, one level deep, saved fields only.

```swift
EvidenceDisclosure(record: EvidenceRecord, onClose:)
```

**Inputs** — `EvidenceRecord(mechanism:, fit:, diagram:, prediction:,
reviewRule:, claims: [EvidenceClaim], sources: [EvidenceSource],
alternatives:, ruleExceptions:, limitation:, identifiers:, revisions:,
corrections:)`. `EvidenceRelation` is `supports · defines · motivates · limits
· contradicts`; `limits` and `contradicts` also carry a warning symbol.
`EvidenceRole` maps `theory/technique/empirical/heuristic` to the display
names COPY.md §14 specifies.

**States** — full record · sparse record (missing sections are omitted, never
filled in).

**Don't** nest accordions, don't render a grade as a badge or a number (it is
free prose), and don't invent a section that the record does not contain.

### ReasoningDiagram

**Purpose** — the relationship between inputs, explanation, action and later
feedback. Position and emphasis, not six equal boxes.

```swift
ReasoningDiagram(content: ReasoningDiagramContent, controlTitle:, onControl:)
```

**Inputs** — `ReasoningDiagramContent(reports:, research:, explanation:,
action:, laterFeedback:, goalColor:)`.

**States** — with dated feedback · nothing reported yet (`No feedback reported
yet.`) · stacked (Reduce Motion or accessibility sizes, no connectors).

**Don't** draw arrows that imply "therefore" or "caused" — connectors are 1pt
hairlines. **Don't** give the two input chips the same weight as the working
explanation.

### StatusChips

```swift
WorkflowChip(label:, isAttention:)   // server learningStatus, verbatim, filled
EvidenceChip(label:, hasChanged:)    // server learningStanding, verbatim, outlined
StatusChipPair(workflow:, standing:)
AdlerChip(label:, emphasis: .filled/.outlined/.attention, symbol:)
```

**Do** print the server's strings unchanged. **Don't** combine a workflow
label and a standing label into one sentence or one badge; `Needs another
look` and `Evidence has changed` get the warning triangle.

### GoalSummaryRow

> Named `GoalSummaryRow` for the same reason as above: `Core/Models` defines
> `GoalRow`.

```swift
GoalSummaryRow(content: GoalSummaryRowContent, onOpen:)
```

**Inputs** — `GoalSummaryRowContent(goal:, chips:, primaryChip:, deltaTone:, resultLine:, activity:,
input:, nextLine:, deltaLabel:)`.

**States** — active (grid + sparkline) · no outcome measure · Draft (no grid,
no sparkline, `Goal saved · plan not started`).

**Do** keep the same column order for every goal. **Don't** show an empty
chart for a Draft, and don't re-word the server's delta label.

### ActivityGrid

```swift
ActivityGrid(layout: ActivityGridLayout, goal:, cellSize: 9, spacing: 2,
             showsCaption: true)
ActivityGridLayout(marks: [DayMark], today:, weekCount: 14, calendar:,
                   caption:, dataStart:)
```

7 rows (Mon–Sun) × up to 14 columns, right-aligned to today. `DayState` is
`done · partly · missed · unknown · upcoming · rest · short · absent`, each
with a mark that reads without colour (half fill, slash, dotted border, lime
centre dot).

**Do** use it on All Goals and nowhere else. **Don't** draw an unreported day
as missed, and don't conflate `absent` (nothing scheduled), `upcoming` and
`unknown`.

### InputChart + ReportStrip

```swift
InputChart(series: InputSeries, goal:, scale: .full/.compact, today:)
ReportStrip(series:, goal:, onSelect:)
```

**Inputs** — `InputSeries(points: [InputPoint], unit:, measure:, isOneTime:)`;
`InputPoint(date:, amount: Double?, planned:, state:, retired:)`.

**States** — bars with per-occurrence plan rules · missing reports (no bar, a
`No report` axis note) · one-time work (dated point marks) · retired
occurrences (dimmed, labelled) · compact sparkline.

**Don't** plot a missing report as zero, and don't drop the caption — a chart
is never the only place a number appears.

### OutcomeChart, ProjectionBandHeader, UnavailableReason

```swift
OutcomeChart(content: OutcomeChartContent, goal:, height: 150,
             onAssumptions:, onWhatWouldHelp:)
```

**Inputs** — `OutcomeChartContent(observed:, checkpoints:, target:, unit:,
measure:, today:, staleNote:, projection:, unavailableReason:,
undatedCompletions:, startsFromBaseline:, goalColorForLegend:)`;
`ProjectionContent(line:, band:, ifLabel:, notProbability:, rangeLabel:)`.

**States** — observed only · with checkpoints and target · stale (hollow ring
+ `Last report …`) · with a scenario band · projection unavailable (the
server's reason, verbatim, plus one route out).

**Do** keep `ifLabel` and `notProbability` above the chart, outside any
disclosure. **Don't** render an empty forecast panel — use
`unavailableReason`. **Don't** describe the band as a probability, and don't
give an undated completion a date.

### StreakLane

```swift
StreakLane(daysOnPlan:, actionsCompleted:, days: [DayMark], goal:,
           showsCaption: true)
```

`StreakSummary.label(daysOnPlan:actionsCompleted:)` produces
`7 days on plan · 4 actions completed`.

**Do** keep the two numbers separate and show the caption explaining that
planned rest continues the count without adding completed work. **Don't**
frame the streak as a target or let it dominate a screen.

### WeeklyBudgetBar

```swift
WeeklyBudgetBar(budget: WeeklyBudget, onOpenCalendar:)
```

`WeeklyBudget(segments: [BudgetSegment], unplacedMinutes:, budgetMinutes:,
serverTotalMinutes:, serverOverMinutes:, serverScaleMinutes:, sourceNote:)`. Pass the server's
figures: recomputing them lets the bar disagree with the capacity validation the server refuses
plans on.
The bar scales to the larger of planned+unplaced and the budget, so an
over-budget week visibly crosses the rule.

**Do** show unplaced work as its own hatched segment. **Don't** hide an
over-budget week behind a clipped bar — the warning sentence states it too.

### MilestoneRail

```swift
MilestoneRail(markers: [MilestoneMarker], goal:, selection: Binding<ID?>)
```

`MilestoneMarker(id:, kind: .milestone/.checkpoint/.review, title:, due:,
state: .verified/.open/.review, criterion:)`.

**Do** use `checkmark.seal` for a **verified** milestone. **Don't** let
completing an action mark a milestone done — verification is its own control
in MilestoneDetail.

### ConversationBubble + Composer

```swift
ConversationBubble(message: ConversationMessage)
Composer(text: Binding<String>, quickPrompts:, attachedContext:,
         isResponding:, onSend:, onStop:, onRemoveContext:)
```

`ConversationMessage(id:, role: .user/.coach, text:, timestamp:, channel:,
links: [MessageLink], inProgress:)`.

**States** — user · coach · channel-tagged (`sms`, `imessage`, `mcp`, `job`) ·
in progress (`ThinkingIndicator`, with a spoken label) · with link rows.

**Do** render recommendation and proposal cards as full-width cards *between*
bubbles. **Don't** put cards inside bubbles, and **don't** let a quick prompt
send on the person's behalf — it inserts text they can edit.

### EmptyStateView

```swift
EmptyStateView(title:, message:, actionTitle:, action:)
```

`EmptyStateCopy` holds the COPY.md `empty.*` strings.

**Do** explain what evidence is missing. **Don't** show an illustration that
implies data, and don't scaffold stages (hypothesis, test, result) that do not
exist yet.

### ErrorBanner + StaleRevisionBanner

```swift
ErrorBanner(kind: .offline/.server(detail:)/.signedOut/.noProvider/.timeout,
            actionTitle:, action:, onDismiss:)
StaleRevisionBanner(changeSummary:, recordGone:, onRetry:, onRefresh:)
```

**Do** print the server's `error` string verbatim as the detail line, and name
what changed on a 409. **Don't** use a modal alert for a recoverable error,
and **don't** retry with a fresh `requestId` — the same one must be reused so
a duplicate never applies twice.

### LoadingSkeletons

`SkeletonRow` (56pt) · `SkeletonCard` (140pt) · `SkeletonChart` (180pt, axis
lines drawn) · `RefreshHairline` (2pt, over cached content).

**Do** match the shape of the real element. **Don't** shimmer under Reduce
Motion, and don't blank a screen that already has cached content.

### ProgressRing

```swift
ProgressRing(done:, total:, size: 72)
```

**Do** show `reported done today / scheduled today`. **Don't** show a
percentage across goals, and with nothing scheduled show `—`, not `0`.

### CardDeck + PageIndicator

```swift
CardDeck(titles:, accessibilityLabels:, selection: Binding<Int>) { index in … }
PageIndicator(titles:, selection:)
```

Swiping, the pill and Back/Next are three equivalent routes. Inactive cards
are `accessibilityHidden` and take no hits. VoiceOver reads
`Do, 1 of 3` on the pill and `Card 1 of 3` in the footer.

### GeometricFans

```swift
GeometricFans(seed:, maximumOpacity: 0.18)
someView.adlerFanBackground(seed:, cornerRadius:)
```

**Do** keep the scrim between art and text. **Don't** animate the fans under
Reduce Motion (they hold their pose), and never loop.

---

## Previews and the gallery

Every component has `#Preview`s covering its states, all built from **fictional
design data** (labelled in comments). `Gallery/DesignSystemGallery.swift` is a
DEBUG-only catalogue of the same material, reachable with:

```
ios/scripts/run.sh --url adler://gallery
ios/scripts/run.sh --url "adler://gallery?item=outcome-chart"
```

`simctl openurl` shows a system "Open in Adler?" confirmation that a script
cannot tap, so the screenshot route is a launch argument instead:

```
xcrun simctl launch --terminate-running-process <udid> com.withadler.app \
  -gallery outcome-chart            # one entry
xcrun simctl launch ... -gallery recommendation-card -galleryAX   # at AX3
```

The gallery's toolbar toggles Dynamic Type between the system size and AX3.
Appearance is switched from outside: `xcrun simctl ui <udid> appearance dark`.

### Accessibility behaviour every component shares

- Above `.accessibility1` (`DynamicTypeSize.prefersStackedControls`): card
  headers, control rows, chip pairs and the Current → Suggested comparison
  stack vertically, and the learning lane becomes a dated list.
- Above `.accessibility2` (`prefersSimplifiedCharts`): charts drop to three
  axis ticks.
- Goal rules use `@ScaledMetric`, so the coloured rule grows with the label
  beside it.
- Every chart has an `.accessibilityChartDescriptor` exposing every point,
  and the projection band's `.accessibilityValue` is the assumptions
  sentence — VoiceOver never announces a projection without the word "if".
