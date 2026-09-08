# Plan activity beside the graph

8 September 2026. Disposable refinement of the selected Goal C, reachable from All Goals A. No production changes or deployment.

Question: does a compact calendar make the streak's underlying record legible while the existing graphs explain work and the conditional goal implication?

Preview: http://localhost:8766/goal-workspace-v2.html?variant=C&goal=reading&focus=input

Run: `python3 -m http.server 8766 --bind 127.0.0.1 --directory .context/ux-grilling`

## Composition and interaction

- A GitHub-like daily activity calendar sits to the left of the selected action's quantity graph. It summarizes all contributing actions for the goal, not just the selected action. The flame stays inline with the goal title. The thin duplicate streak lane is removed from C; earlier variants retain it.
- One cell represents one calendar day. Filled check means every reported action met its own dated target; partial means some work was reported but not every target was met. An explicit zero, missing report, day off, upcoming work and dates beyond the saved plan remain distinct. Different units are not added together or averaged into a score.
- Above-target amounts retain the same completed colour. The actual quantity stays inspectable. This design does not encourage an automatic effort ratchet or treat intensity as the objective.
- Select a work day to focus its occurrence, quantity point and dated arrangement. Arrow keys move through cells; Enter selects. Rest and unscheduled days explain their meaning in the existing inspector. Corrections use the existing report controls and local state.
- Mobile starts with the calendar collapsed above the graph. The graph itself and the existing full conditional outcome range remain visible. The calendar shows the month and the quantity chart its selected time window; they share a selected day, not an identical horizontal scale.
- Only the dated fictional evidence is rendered. The empty-looking future is planned work, not fabricated activity history. This fixture starts on 1 September; 29–30 September are beyond its saved plan. One-day work gets no recurring activity grid or flame.

## Method and source connection

This is a reporting/navigation design, not a behavioural interpretation or new streak algorithm. It applies the current method's distinction between observed work, unknown reports, planned opportunities and outcomes. It retains the accepted user direction on the flame and planned rest, while the existing illustrative streak reset rules remain unvalidated product choices.

The owned synthesis's P3/P4/P25 inform task-level, attributable feedback; they do not establish that this calendar improves adherence. P34 is contested, and the older no-streak mechanic is superseded by the user's current instructions. Preserve the narrower source correction and transfer limits in `docs/research/coaching-product-evidence-review.md`. Do not infer optimal adherence, causation or difficulty changes from the display.

GitHub's [contribution reference](https://docs.github.com/en/account-and-profile/reference/profile-contributions-reference) defines the qualifying events behind its daily graph. Adler similarly needs an explicit day/occurrence definition; GitHub contribution volume is not Adler goal progress. Symbols and text accompany colours in line with [WCAG's use-of-colour guidance](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html).

## Verification and verdict

Browser inspection at 1440, 1180, 768 and 390 pixels found no page overflow, invalid SVG coordinates or JavaScript errors. Verified historical selection and correct edit scope, planned rest, missing-report correction, extra-work quantity without extra colour, dates beyond the plan, keyboard navigation without variant switching, and retained state after closing/reopening from All Goals. Revenue combines its two actions without mixing units and still has no estimated finish date. The one-day fixture has no grid, flame or trend graph.

Captures: `activity-C-{1440|390}.png`, `activity-C-full-{1440|390}.png`, `activity-C-mobile-collapsed.png`, `activity-in-overview.png`.

The prior integrated direction received positive feedback; this specific calendar rendering is ready for evaluation. This is temporary browser data, not production persistence, a comprehension study or proof of coaching benefit.

## Further improvements proposed

1. Link the period controls across the activity calendar, dated action plan and input graph while retaining the goal outcome's useful longer horizon. Make the selected day apparent in every relevant view.
2. Make a plan-change marker on the existing graph open the saved observation, specific behavioural rationale and prediction, with the relevant before/after periods highlighted. Improvement after a marker must not imply attribution to the change.
3. Preview proposed plan edits in place: the workload and schedule affected, and a conditional date effect only where a defensible relationship exists. Unknown outcome response remains unknown; reducing burden need not promise an earlier finish.

These are proposals, not additional features implemented in this iteration. Production shared-state, forecast eligibility and coaching integration still follow the accepted second-pass plan.
