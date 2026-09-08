# Next iteration of All Goals A and Goal C

Status: accepted by the user on 8 September 2026, followed by a request for a further product and behavioural-science review before implementation. This records the next design iteration; it does not change the prototypes or production app. The borderless flame beside the title is already implemented in the prototypes. Additional recommendations are recorded separately in `docs/product-coaching-second-pass.md` and remain proposed.

## Direction

Keep the selected All Goals A rows and individual-goal C with its evolving plan. Make current work, reported progress and its practical implication readable together. Preserve the existing input graphs, goal projection and scenario range. Every detail needs a place within Goal → Plan → Milestone → Action, or within the coach's evidence and learning about that work.

The overview answers which goal to open and why. The goal answers what the current plan is, what to do, what the evidence means for its outlook, and what Adler is learning. Detailed execution remains inside a goal. Coach remains the shared conversation.

## 1. Make All Goals an overview of meaningful consequences

Keep a consistent row for each goal, with three aligned regions:

| Region | Visible by default | Interaction |
| --- | --- | --- |
| Goal | Goal title and inline flame, reported result toward the target; quieter category/priority | Open the same goal workspace |
| Work over time | Existing compact input graph, its unit, period and planned/reported comparison | Open the goal focused on this action and reporting period |
| Next milestone and outlook | Current milestone and a useful conditional date, due time or unresolved question | Focus the corresponding milestone or outlook in the same workspace |

For the reading example, the consequence can be “Book 7 · around 20 Sep at your recent pace.” Keep its conditional nature visible. For revenue, show the observed result and that there is not yet enough evidence for a finish estimate; do not translate work hours into dollars. For a one-day goal, show its due time and whether the actual result is confirmed.

Reduce shared capacity to one line above the rows, such as “This week: 7h 50m planned / 6h available · 1h 50m over.” Selecting it expands the existing allocation breakdown in place. Retain the current ordering or user priority; deficits alone should not reorder the user's life.

Remove repeated timing/test copy and redundant links to an identical destination. Keep one consistent row-opening action, with explicit context links only where they select a different part of that same goal. Do not add per-action execution controls to this overview. Make planning and reporting periods explicit when they differ.

## 2. Put the current plan at the center of Goal C

The initial reading order becomes:

1. Goal title, inline flame, reported outcome and target.
2. Current milestone and its outlook, positioned with the timeline it describes.
3. Current action lanes and the selected action's existing evidence graph and controls.
4. The evolving plan's meaningful changes, with the current learning state easy to select.

Use spatial relationships to communicate the hierarchy: the goal contains the plan; milestone bands group contributing action lanes on the date axis; the selected action expands its existing evidence view. Identify each level clearly without repeating a textual hierarchy at every point. A recurring action may span milestones. A short goal does not need an invented intermediate milestone.

Keep all current actions discoverable. For example, revenue must expose both focused work and reviewing customer feedback. Show compact lanes for the other actions while expanding only the selected action's detailed graph. Selection updates the units, dated evidence and control context together.

Keep C's chronological learning journey, with the current revision emphasized. Earlier detail should not push today's work below a full history on mobile. Show meaningful later milestones where known; do not manufacture detailed distant actions or dates to fill the timeline.

## 3. Connect the existing graphs to the milestone and goal implications

Preserve the planned and reported input lines, visible quantity differences, existing goal projection, broad scenario band and target marker. Make the existing outcome plot large enough to read its dates and range.

Place each implication beside its plotted evidence. Selecting a milestone or change focuses its contributing action and relevant dates in the same workspace. Keep the detailed action period and long goal horizon clearly labelled; they can have different time scales. Do not put pages per day and books completed on an unexplained shared axis.

For the reading fixture, compare the same remaining 100 pages under two explicitly conditional futures:

- At the upcoming plan's pace: 100 pages/week → 15 Sep.
- At the reported pace: 60 pages/week → 20 Sep, with the existing 17–25 Sep pace-scenario range.

The five-day difference compares scenarios from the same current state. It is not a saved five-day forecast revision or proof that a missed session caused a delay. Only display a historical “estimate moved” event when the prior estimate, assumptions, evidence version and new estimate were actually saved. Label the range as a scenario range; it is not a calibrated probability interval.

Show reported book completion separately from page-based estimates. Revenue needs attributable outcome observations and an established, appropriately qualified relationship before it can support a projection. Remove the prototype's implied January-to-September zero-revenue history unless real records support it.

## 4. Put the useful action at the point of understanding

Keep check / x / edit / calendar beside the selected action occurrence. Make “Edit report” and “Edit plan” distinct. Amount-based work needs an obvious quantity and an inexpensive correction path. Reporting the goal's outcome remains separately identifiable.

After the outlook, expose the relevant next interaction. If the coach has a saved, supported suggestion, show that specific suggestion and its actual proposed/current state. If the evidence is incomplete, identify the useful missing report or question. Continuing the current plan can also be the appropriate decision.

Opening Coach carries the selected goal, action, report, milestone or test while retaining the coach's broader context. A generic empty composer should not require the user to reconstruct the issue. The UI does not infer a behavioural mechanism or create an experiment from a shortfall alone.

## 5. Make the evolving plan explain changes and learning

Keep a chronology of the whole goal's meaningful revisions. Each event names the affected work and actual change, rather than a generic “The change” heading. Selecting it focuses the relevant plan version, dates and evidence. Ordinary action reports remain on the input timeline.

The current test shows what is being tried, what experience has actually been reported and when it will be reviewed. “Why this change?” reveals the saved observation → specific behavioural interpretation and citations → expected effect → evidence so far. The short explanation must use the same saved rationale as the coaching decision. A date passing does not manufacture a result, and acceptance does not demonstrate that the change was used.

Fix historical selection before further visual polish: an earlier revision must not retain today's live action under an old heading. Clearly identify the displayed version and any report being corrected. Provide a direct return to the current plan; selecting history must not silently change today's plan.

## 6. Make the same structure work with less evidence and on a phone

Use the same hierarchy on mobile, with readable labels, larger useful plots and secondary detail disclosed on selection. Avoid solving density by shrinking text or putting full history before current work. Body text remains neutral; colour carries consistent meanings in plots and states.

Missing reports remain unknown. Planned rest is visibly different from missed work and creates no fabricated action or outcome. The flame is secondary to meaningful progress; this iteration does not settle its reset/recovery rules or introduce an adherence target or automatic difficulty increase.

A one-day goal shows timed actions and the actual completion evidence in the same workspace, without empty recurring-trend or experiment scaffolding. A revenue goal can show useful work and outcome evidence while the input-to-outcome relationship remains unknown.

## Build order and acceptance checks

- [ ] First repair the state/context problems: expose other actions, bind historical selection to its revision, and distinguish scenario comparisons from recorded forecast changes. Verify that changing the selected action updates units and controls, and that earlier revisions cannot masquerade as today's plan.
- [ ] Recompose Goal C around current milestone, action lanes, existing charts and an actionable implication. Verify that users can locate current work and explain the milestone outlook without traversing the learning history.
- [ ] Compress All Goals A's capacity and metadata; give each row its meaningful next milestone/outlook. Verify that opening any context preserves the chosen goal, action and period.
- [ ] Connect the current learning state and saved rationale to the affected work. Verify that a user can distinguish a proposed change, a change in use, a pending review and an actual finding.
- [ ] Inspect both surfaces at desktop and phone widths with reading, revenue, one-day work, missing reports and historical revisions. Correct a report and verify that quantities, streak display and conditional dates update coherently while independently reported outcomes retain their meaning.
- [ ] Run a short comprehension check: ask a reader to point to the goal, current milestone, next action and another action; explain the target versus conditional estimate; show what an edit will affect; and find why Adler suggested a change. Layout inspection alone is not evidence that the design is understandable.

## Basis and limits

This proposal addresses the observed problems in `GOAL-VIEWS-CRITIQUE.md` and preserves G23–G26 in `design-map.md`. It follows the accepted product principles, current method and target coaching-engineering design, including the separation of observation, interpretation, design and learning.

P1/P4 in the behavioural synthesis and `docs/research/deep/feedback-and-progress.md` motivate inspectable monitoring and task feedback. Their broader evidence does not validate this particular interface. Progressive disclosure, consistent context and visible state draw on the primary UX sources already recorded in the critique and the repository's Statsig/Linear research. These remain design hypotheses until evaluated with users.
