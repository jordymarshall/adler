# Integrated A/C prototype

8 September 2026. Disposable illustration of the accepted design; the revised rendering is ready for visual evaluation. This does not implement the production coaching or forecasting changes.

Question: can a person locate a goal's current milestone and work, report experience, understand the conditional implication and inspect the evolving plan without changing destinations?

Run from the workspace:

```sh
python3 -m http.server 8766 --bind 127.0.0.1 --directory docs/prototypes/goal-views-integrated
```

- Overview: http://localhost:8766/all-goals-prototype.html?variant=A
- Goal: http://localhost:8766/goal-workspace-v2.html?variant=C&goal=reading
- Other fixtures: `goal=revenue` and `goal=day`.

The earlier variants remain switchable for comparison. A and C remain the selected directions. No new app route or top-level product concept is introduced. The server was already running and remains available.

## What changed

- All Goals has three aligned regions: goal and reported result, existing input graph, current milestone and its meaningful outlook. Capacity starts as one expandable summary. Category/priority stay quiet; repeated test/timing text is removed from the row.
- Goal C opens with the goal, an in-page index and current milestone. The existing timeline shows every action; the selected occurrence has its report/edit/calendar controls and, where appropriate, its original input graph. The existing long-range outcome graph and scenario fan remain readable below, with a direct index link.
- The reading milestone compares 15 September at planned pace with 20 September at recent pace; both A and C use UTC date formatting. These are two conditional futures from today's remaining pages, not a stored five-day forecast revision. Mobile includes 1–8 September so the reported shortfall is visible on the graph.
- The evolving-plan rail retains the original arrangement, saved agreement/rationale, actual reported use and future review. It now also shows saved manual edits and an explicit choice to keep the arrangement. Selecting a manual edit displays that exact revision. A report correction marks the prior keep decision for another look while retaining it.
- Selecting the earlier arrangement shows 1–6 September and its actual dated report/old target; today's plan and calendar edits are not presented under that historical heading. Report corrections remain available. Returning to the current plan is explicit.
- Choosing the next-book action identifies its contribution to book 8. A selected old reading occurrence retains its own milestone even after a new book result is reported.
- The same Coach entry retains goal/action/date/report context. Reviewing the arrangement can save the person's choice to keep it, while the explanation remains tentative. This is a deterministic example of an explicit user choice, not an AI-generated result or a formal experiment.
- Revenue has no invented January-to-September zero-outcome line or finish date. A one-day goal has timed actions and result confirmation, without empty trend graphs or a recurring flame.

## Walkthrough

1. Open reading from All Goals. The goal, current milestone, dated work and conditional milestone comparison are visible together.
2. Select **In the evening** in the history. Inspect or correct the 4 September report; return to the current plan.
3. Select the saved 6 September change to inspect the personal observations, specific COM-B/implementation-intention sources, original prediction and limits.
4. Report today's amount, and separately indicate whether the new timing was used.
5. Open **Review with Coach**. Choose to keep the arrangement, or open the same contextual conversation to discuss a change. Keeping it does not prove its mechanism or record a book completion.
6. Correct or clear a supporting report. The quantity, scenario and evidence state respond, and the earlier decision stays inspectable. Close and reopen the goal to see the shared local state.

## Verified

Chrome inspections at 1440px and 390px covered reading, revenue and one-day work. Both actions were visible in each fixture. No page overflow, invalid SVG coordinates or JavaScript errors were observed. The one-day case rendered no trend/projection graphs. The collapsed capacity summary measured 52px on desktop and 94.5px on mobile; the ample-capacity case stayed collapsed.

Interaction checks covered: shared overview/goal state and reopening; current versus earlier report context; secondary-action selection and units; used-support reporting; explicit keep decision without changed book outcome; correction-triggered reconsideration; unknown reports and the uncertain flame; exact saved plan-edit inspection and preserved earlier targets; local calendar booking; and capacity expansion/availability changes. These are browser/fixture checks, not a user comprehension study or evidence of coaching efficacy.

Screenshots: `integrated-next-A-{1440|390}.png`, `integrated-next-C-{reading|revenue|day}-{1440|390}.png`, and `integrated-next-open-C-{1440|390}.png`.

## Limits and next implementation

All changes and messages live in browser memory. Refresh resets the examples. There is no model invocation, production persistence, external message or real calendar write. The rationale is the previously documented fictional decision; it is not generated from arbitrary demo messages. A user-selected keep decision is preserved as a preference/practical decision, not promoted to an experimental finding.

The graph still uses explicit illustrative reading assumptions. Production cadence selection, evidence-appropriate forecast eligibility, model/reviewer evaluation and the source-summary correction from the research review remain implementation work. The overview's capacity-allocation example is still separate from C's per-occurrence work quantities; it is not a production scheduling integration. Do not infer a unified capacity model from this illustration.

The next production slices follow `docs/product-coaching-second-pass.md`: shared-state meaning and decision evaluation, evidence-appropriate outlook, the selected interface, then comprehension and outcome evaluation. Formal causal experimentation and calibrated probabilities require their own validated implementation. The exact streak reset/recovery policy remains an open product decision; this iteration preserves the existing illustrative counter.

Verdict: A/C direction and the second-pass requirements were accepted. This implementation illustrates them and passed the checks above; visual feedback on this revised iteration is pending. Preserve this source and verdict on the prototype archive branch.

Follow-up: the user responded positively and suggested a GitHub-like streak calendar beside the graph. `ACTIVITY-GRID.md` records the resulting C refinement, source connection, checks and further proposals. The earlier thin streak row is replaced by the calendar in C; the flame and original graphs remain. The calendar rendering itself is ready for feedback.
