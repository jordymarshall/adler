# Adaptive planning

Implemented on `reengineeredv2`, rebased onto `08c565e`. The [current coaching contract](controllable-action-planning.md) supersedes the outcome forecasting portions of the original proposal.

The coach chooses the goal horizon, concrete work window, decomposition, recurrence, feedback delay, and assessment timing. These are independent decisions. A short deliverable can have a single task; an ongoing practice can have repeating behavior without a manufactured finish date or milestone.

## Saved contract

- `Plan.adaptive` holds an approach, a dated window and its total capacity, tasks/behaviors, optional task prerequisites and milestone links, an assessment question/date/triggers, and a learning experiment when the plan tests repeating behavior. Historical forecast settings remain readable. Stable step and metric IDs preserve comparable evidence across revisions.
- Actions are occurrences of that work. They retain their plan version, completion criterion, reported outcome, optional amount/time/note, and correction history. Dates are intentions until booked. Completing behavior never verifies a goal outcome.
- Deterministic maintenance materializes the concrete window, reuses stable occurrences, and retires replaced future unbooked work. Recorded, started, and booked work remains intact. Paused goals do not generate work. Dependencies control the next action and calendar choices.
- Validation checks references, cycles, recurrence, window capacity and commitments across goals, including retained bookings. Reducing capacity and recording observations remain possible; adding work to an overloaded week fails with repair guidance. The existing weekly account budget is a shared capacity constraint, not a mandatory planning cadence.
- `planCheck` lets the coach simulate candidate commands and inspect feasibility and actual generated action dates/counts without writing. Adaptive plan revisions use existing proposals. Previewing a proposal is also read-only.

## Feedback and autonomy

Workspace saves and command writes refresh the same derived records. User-reported actions, outcomes, blockers, milestones, context and capacity can trigger assessment according to the saved plan. Chosen dates and window ends can also trigger it. A persistent worker runs without phone setup, supersedes stale proposals, suppresses duplicate evidence reviews, retries failures and reports its state in the app. Its model call runs outside the write lock; persistence checks for a stale workspace before saving. Check-ins remain available during that call.

Routine occurrence maintenance and reordering unbooked work within the accepted window/capacity can run automatically. Strategy, workload, goal targets and bookings remain reviewable changes. The worker cannot approve proposals or invent user reports. A review may keep the approach and wait for new evidence, without another arbitrary recurring review.

Check-ins show only relevant confirmed memories and fresh checked calendar overlap, labeled by source. Calendar availability does not provide event attendance, event titles or completed work. Suggestions can be used and corrected in a note; an outcome still requires submission. Historical starting observations retain their original date through `baselineDate`.

## Learning from inputs and outcomes

`adaptive.experiment` saves a hypothesis, linked controllable steps, an outcome signal, a starting comparison with known/unknown status and source IDs, a decision rule, and alternative explanations. The assessment retains feedback delay and review timing. Reviews receive generated occurrence counts as well as the proposed text, so frequency claims can be checked against actual work. Missing historical logs cannot establish zero activity.

`goalExecution` groups saved actions by week; `cycleEvidence` assembles reported execution and dated outcome observations without calculating a causal effect or an achievement forecast. Check-in reports and outcome signals are distinct. The coach must account for missing reports, delayed feedback and other explanations before suggesting a change. Earlier plans and sourced insights preserve the learning history. New plans omit outcome-rate forecasts; automatic maintenance no longer generates them.

## Main screen

The goal screen shows success, target flexibility, saved cycles and milestones on a date-scaled timeline, weekly action commitments, the next action, and learning/adaptations. Action reports distinguish Done, Partly, Didn't happen, awaiting check-in, and upcoming. Detailed methods and historical evidence remain expandable. The shared conversation is Check-in; Insights holds implications and saved context; coaching preferences live in Settings. Old Coach links redirect with their context intact.

Legacy goals remain usable and get an in-place, reviewable upgrade. Accepting it preserves the goal identity, results and booked work. It does not invent historical recurrence.

## Verification

Run `npm run build`, `npm run test:server`, and `npm test`. New deterministic tests exercise recurrence and dependencies, preserved bookings, reduced capacity, ongoing goals, historical baselines, execution evidence and delayed feedback, read-only previews, user-report boundaries, stale background assessments and connection context. Browser scenarios exercise the complete screen, weekly action evidence, legacy upgrade acceptance, context correction, mobile layout and accessibility alongside existing journeys.

The opt-in live scenario harness uses synthetic isolated accounts and the existing configured Gemini adapter:

```sh
ADLER_LIVE_EVAL=true npx tsx tests/live-adaptive-eval.ts
```

Optional positional scenario IDs select a subset. Artifacts and test databases stay under `.context/live-adaptive`. Assess useful decomposition, proportionate window and review choices, feasibility across goals, fidelity to supplied observations, and honest uncertainty. Do not require identical wording or task choice.

Live checks establish that the integrated coach can execute this contract. They do not establish personal effectiveness, forecast calibration, or user comprehension. Those require observation with real consenting users over relevant goal horizons; no such study is claimed here.

## Historical live evaluation record

These were earlier implementation checks. The current input–outcome experiment scenario and fixes are documented in [the current contract](controllable-action-planning.md); the domain-specific choices below are not the current coaching policy.

The final synthetic runs on September 7, 2026 UTC used Gemini `gemini-3.8-flash` through the real coach service and literature adapters. Eleven cases completed with either a usable draft/proposal or a clarification/tradeoff response:

| Case | Observed behavior |
| --- | --- |
| Ambiguous $100k | Asked for revenue meaning and timeframe before creating work. |
| Ready proposal due today | One 15-minute task within a 20-minute capacity, assessed the same day. |
| Year-long revenue goal, baseline unknown | Kept baseline unknown and chose a bounded discovery window. |
| Proven offer, acquisition constraint | Planned list-building/outreach/response review within 90 minutes weekly, with no invented conversion forecast. |
| Essay due in a week | Two linked tasks totaling 55 minutes within the supplied 60 minutes. |
| Ongoing reading | Repeating sessions without a finish date or manufactured outcome milestone. |
| Strong execution, poor response | Chose diagnostic work and a bounded targeting/pitch test before more volume. |
| Reported meeting conflicts | Used the supplied post-breakfast windows and retained the 60-minute weekly constraint. |
| Missing reports and delayed feedback | Planned an audit of the unknown sessions and preserved the ten-day-old revenue observation date. |
| Firm, infeasible deadline | Surfaced scope/time/deadline choices instead of generating a false feasible commitment. |
| Competing goals | Proposed reallocation between the existing essay and reading, keeping the 90-minute shared budget; changes stayed pending. |

Initial runs exposed unhelpful validation feedback for a missing rationale in a multi-goal bundle, an insight citing a field name instead of its ID, and ambiguity between a weekly budget and total window capacity. Targeted feedback, instructions and dated-baseline support were corrected, and the affected cases were rerun. This is an integration and qualitative rubric check, not a reliability estimate or evidence that any specific coaching strategy will work.

## Review record

The standards and spec reviews compared the implementation with `08c565e` independently. Both passed after fixes.

**Standards:** three findings resolved: projections no longer drift because an unobserved day passed; the capacity regression uses current dates; incomplete task attempts can be retried after a reviewed revision while retaining earlier reports. No outstanding documented-standard violations or material code-smell findings.

**Spec:** five findings resolved: stale proposals are superseded so new evidence can be assessed; Today avoids fixed weekly reviews for adaptive-only accounts; completed tasks keep their identity across windows; forecast changes show before/after input snapshots; reviewed retries of partial/missed tasks remain executable. No outstanding scope or implementation findings.
