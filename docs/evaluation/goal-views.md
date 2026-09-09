# Production goal views

8 September 2026 · Implements the screenshot-selected All Goals / goal compositions in the existing app. This is a delivery record, not evidence of coaching effectiveness or a hosted deployment.

## Delivered scope

- All Goals uses aligned goal/result, compact activity, controllable-input line graph and milestone/outlook columns. The restored weekly time bar uses the same scheduled-commitment calculation as capacity validation, counts a booking once, identifies proposed draft work and distinguishes the user's time budget from measured calendar availability.
- Goal detail has saved plan/review chronology beside one selected-action canvas. The dated action cells, inline flame/streak lane, milestone context and conditional goal-date implication sit beneath the same input graph. A supported outcome graph retains its forward scenario fan and error bars, with full evidence available on request.
- “Live experiment” is the agreed current-test label. Suggestions, future starts, pauses, review readiness, evidence corrections and completed reviews retain their distinct states. Acceptance alone does not report exposure or a result.
- Action selection, direct reports/corrections, manual plan edits, calendar scheduling, proposal acceptance and experiment controls use existing shared state and validation. The older first-action start/scheduling flow and deep links to evidence remain usable. The real app's branding, typography and navigation are retained.
- Phone layouts preserve the goal/action hierarchy, keep readable graph axes and scroll the dated strip internally. The GitHub-style activity grid remains exclusive to All Goals.

## Integrity checks and limits

Unknown input is not zero; an explicit miss is zero. A Done report without a measured quantity does not manufacture that quantity. Saved measurements cannot silently relabel earlier reports. Historical retired work is inspectable without becoming a missing current commitment.

Plan revisions take effect on their saved date. A later recurrence cannot rewrite earlier days off, and an expired earlier plan cannot silently resume after the current window ends. The same effective-plan rule is used by the input graph, streak and shared projection's missing-data classification.

The streak is a display heuristic: an on-plan day meets the saved actions/targets; planned rest can extend an established count; unknown closed days interrupt it; an unknown today preserves yesterday's count without marking today on plan. It is not a habit-strength measure, causal claim or automatic difficulty rule. More general period-based and pause/resume policy remains open.

Applied experiments are associated with the plan produced by their accepted proposal, using saved before-state, goal/action scope and the saved rationale. A proposal decision's pre-acceptance plan version is not the resulting plan. Declined intermediate revisions are not inferred to be accepted merely because a later revision became active. Older standalone records with insufficient adoption provenance remain inspectable in Insights without inventing a plan association.

Cue-only manual edits clear obsolete scientific rationale from the new version and preserve it in history. The server compares scientific records structurally, allowing ordinary reports whose unchanged JSON fields arrive in a different order while still rejecting unreviewed changed interpretations.

Milestones currently store criteria and optional dates, not a general numerical input/outcome relationship. The bottom section therefore distinguishes the actual milestone target from the **goal** outlook. It does not derive milestone forecasts by parsing numbers from prose. Existing single-driver projection and sparse-association limitations remain; the scenario range is not a calibrated success probability.

The methodology connection is attributable reports and useful feedback (P1/P3/P4), and within-person learning without labeling the person (P14/P25). P34 does not establish a universal streak policy. This slice adds no new behavioural interpretation, model pathway, literature claim or separate coaching system. The [second-pass guidance](../product-coaching-second-pass.md) remains the target for the broader coaching and forecasting work.

## Verification

- Full server suite: **119 passed**.
- Full browser suite: **72 passed**. After the final responsive/effective-window fixes, all 119 server tests, the nine affected goal/projection browser cases and four focused goal-control/layout cases were rerun successfully.
- Production build and TypeScript: passed. Vite retains its bundle-size advisory; no code-splitting claim is made.
- Desktop and phone captures inspected at 1440px and 390px. Focused browser checks cover horizontal overflow, accessible dialogs, keyboard report selection, readable phone graph dimensions and axe accessibility results.
- Real persisted report correction, unchanged outcome data, selected secondary-action editing, original rationale history, exact-action calendar context, saved learning controls, proposal acceptance binding and declined-version exclusion are covered. Tests use fictional isolated accounts and deterministic coaching fixtures; they are not live-provider or external-calendar verification.
- Independent Standards and Spec reviews found persistence, calendar selection, historical schedule/report and experiment-association issues. All were addressed; the bounded follow-up reviews found no remaining consequential issue in those fixes.

Local verification logs and captures are under `.context/goal-views-*` and `.context/preview-*`. The local real-app preview runs on port 5173 with separate fictional storage at `.context/goal-views-preview`; it does not replace another account's data.

## Hosting and remaining work

Vercel metadata was checked: `adler7/adler` has no environment variables or deployments. Publishing the working app at withadler.com requires the persistent Node backend described in [deployment](../deployment.md). No hosted health, authentication or persistence result is claimed.

The broader contextual Coach placement, grouped proposal editing, question-first Insights, general milestone dependency forecasts and Today redesign are not delivered by this slice. See [structure decisions and remaining work](../product-structure-status.md).
