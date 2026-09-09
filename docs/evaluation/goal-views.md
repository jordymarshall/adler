# Production goal views

8 September 2026 · Implements the screenshot-selected All Goals / goal compositions in the existing app. This is a delivery record, not evidence of coaching effectiveness or a hosted deployment. The [9 September follow-up](plan-inputs-and-edits.md) replaces manual plan editing with the shared harness and adds tentative week-calendar placement; the verification counts below describe this earlier slice.

## Delivered scope

- All Goals uses aligned goal/result, compact activity, controllable-input line graph and milestone/outlook columns. The restored weekly time bar uses the same scheduled-commitment calculation as capacity validation, counts a booking once, identifies proposed draft work and distinguishes the user's time budget from measured calendar availability.
- Goal detail has saved learning history beside one action canvas with explicit Plan → Milestones → Actions ordering. Visible milestone navigation selects its contributing work, including earlier plans. Repeating work keeps the input graph, dated action cells, inline flame/streak lane and supported goal-date implication. One-time work has actual dated marks on the same canvas. A supported outcome graph retains its forward scenario fan and error bars, with full evidence available on request; unavailable estimates use a concise explanation.
- “Live experiment” is the agreed current-test label. Suggestions, future starts, pauses, review readiness, evidence corrections and completed reviews retain their distinct states. Acceptance alone does not report exposure or a result.
- Action selection, direct reports/corrections, manual plan edits, calendar scheduling, proposal acceptance and experiment controls use existing shared state and validation. Legacy saved work uses the same selected-action controls and timeline; interrupted bookings reopen on their actual occurrence. The real app's branding, typography and navigation are retained.
- Phone layouts preserve the goal/action hierarchy, keep readable graph axes and scroll the dated strip internally. The GitHub-style activity grid remains exclusive to All Goals.

## Integrity checks and limits

Unknown input is not zero; an explicit miss is zero. A Done report without a measured quantity does not manufacture that quantity. Saved measurements cannot silently relabel earlier reports. Historical retired work is inspectable without becoming a missing current commitment.

Milestone attribution comes from the plan version that created an occurrence, not the ongoing action's latest milestone. Legacy actions without a stable step ID stay with their exact plan version. Historical links initialize selection from the requested saved plan, so editing cannot silently target a different current action.

The shared coach can save the requested factual goal as an unplanned Draft before a full strategy or capacity is established. It preserves the outcome/horizon and creates no placeholder action, automatic experiment or default learning score. A draft without work cannot start. This narrow path retains semantic review; substantive behavioural advice still requires its researched rationale. Context now includes twelve recent messages plus at most sixty earlier personal reports within a 24,000-character history budget. Generation and review receive identical reports and omission guidance. It never pins an old opening while omitting a later correction; current saved goals govern when earlier intake has left the budget.

Plan revisions take effect on their saved date. A later recurrence cannot rewrite earlier days off, and an expired earlier plan cannot silently resume after the current window ends. The same effective-plan rule is used by the input graph, streak and shared projection's missing-data classification.

The streak is a display heuristic: an on-plan day meets the saved actions/targets; planned rest can extend an established count; unknown closed days interrupt it; an unknown today preserves yesterday's count without marking today on plan. It is not a habit-strength measure, causal claim or automatic difficulty rule. More general period-based and pause/resume policy remains open.

Applied experiments are associated with the plan produced by their accepted proposal, using saved before-state, goal/action scope and the saved rationale. A proposal decision's pre-acceptance plan version is not the resulting plan. Declined intermediate revisions are not inferred to be accepted merely because a later revision became active. Older standalone records with insufficient adoption provenance remain inspectable in Insights without inventing a plan association.

Cue-only manual edits in this slice cleared obsolete scientific rationale from the new version and preserved it in history. The subsequent contextual editor uses shared scientific review to reconcile the new rationale, while keeping earlier versions. The server compares scientific records structurally, allowing ordinary reports whose unchanged JSON fields arrive in a different order while still rejecting unreviewed changed interpretations.

Milestones currently store criteria and optional dates, not a general numerical input/outcome relationship. The bottom section therefore distinguishes the actual milestone target from the **goal** outlook. It does not derive milestone forecasts by parsing numbers from prose. Existing single-driver projection and sparse-association limitations remain; the scenario range is not a calibrated success probability.

The methodology connection is attributable reports and useful feedback (P1/P3/P4), within-person learning without labeling the person (P14/P25), and user-owned goals with scoped domain transfer (P10/P29). P34 does not establish a universal streak policy. This slice adds no new literature claim or separate coaching system. The [second-pass guidance](../product-coaching-second-pass.md) remains the target for the broader coaching and forecasting work.

## Verification

- Full server suite: **125 passed**, including goal-only drafts, long intake, older corrections, bounded history, saved milestone attribution and legacy action identity.
- Full browser suite: **76 passed**. Coverage includes fresh/unplanned drafts, dated one-time work, historical milestone links, partial-booking recovery, unchanged supported projections, action reports/corrections, desktop/mobile layout and accessibility.
- Production build and TypeScript: passed. Vite retains its bundle-size advisory; no code-splitting claim is made.
- Desktop and phone captures inspected at 1440px and 390px. Focused browser checks cover horizontal overflow, accessible dialogs, keyboard report selection, readable phone graph dimensions and axe accessibility results.
- Real persisted report correction, unchanged outcome data, selected secondary-action editing, original rationale history, exact-action calendar context, saved learning controls, proposal acceptance binding and declined-version exclusion are covered. Automated suites use fictional isolated accounts and deterministic coaching fixtures; external calendars are mocked.
- A separate three-turn live Gemini check saved one $100k revenue goal with its one-year deadline on the first turn and kept the same goal through clarification and “Make the goal.” It invented no action while work was undecided. This is a narrow intake check, not evidence of general coaching quality or efficacy; repeated clarification burden and complete first-plan quality still need broader live evaluation.
- A read-only replay of the reported pre-creation conversation now retains the original goal and one-year horizon at the shared service's model boundary.
- Independent Standards and Spec reviews found persistence, calendar selection, historical schedule/report and experiment-association issues. All were addressed; the bounded follow-up reviews found no remaining consequential issue in those fixes.

Local verification logs and captures are under `.context/goal-structure-*` and `.context/preview-*`. The real-app preview runs on port 5173 using `.context/goal-views-preview`. The specific incorrectly saved campaign goal in that local workspace was restored to its original revenue outcome and horizon through shared command/state validation, with a backup and preserved work/learning history. No broad account migration was performed.

## Hosting and remaining work

Vercel metadata was checked: `adler7/adler` has no environment variables or deployments. Publishing the working app at withadler.com requires the persistent Node backend described in [deployment](../deployment.md). No hosted health, authentication or persistence result is claimed.

The broader contextual Coach placement, grouped proposal editing, question-first Insights, general milestone dependency forecasts and Today redesign are not delivered by this slice. See [structure decisions and remaining work](../product-structure-status.md).
