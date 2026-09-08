# A clear goal and learning journey

Research and implementation brief · 7 September 2026 · For Adler product and engineering

## The decision

Adler should do the setup work and give the person one understandable record of their goal: **where I am → what I’m trying → what happened → what we change next**. The interface should expose that sequence through chronology, relationships and focused detail. More cards do not create more structure.

Statsig offers a strong example of preserving a question, collecting relevant evidence and making an explicit decision. Linear offers a strong example of keeping purpose, current work and history within one navigable context. These are design references, not evidence that copying their interfaces will improve behavioural outcomes.

The immediate priority is the core product: complete goal setup, a useful default measure, a legible timeline, and a learning record that retains its starting point and revisions. A Today redesign is deferred. The landing page must demonstrate these actual app screens, while preserving the three-phone overview and immersive graph already requested.

## What Statsig actually does

### 1. It defines the question before results arrive

Statsig creation records a hypothesis and at least one primary metric. Secondary metrics capture other consequences; advanced configuration is separate. An optional duration can be expressed in days or exposures. This creates an identifiable question to return to when interpreting results. It is still an expert setup flow, not evidence that consumers should fill in experiment forms. [Statsig: Create an Experiment](https://docs.statsig.com/experiments/create-new)

**For Adler:** the coach should propose the controllable action, the relevant goal outcome, the useful review point and why these fit. The person reviews a practical recommendation and can edit it. They should not encounter an empty analytics configuration task after setting a goal.

### 2. Configuration, exposure and outcome are different facts

Statsig distinguishes configuring an experiment, serving its variant, and logging behavioural events. Its diagnostic checks ask whether events and exposures are arriving in a usable form. A healthy data pipeline is different from a successful intervention. [Statsig: Implement an Experiment](https://docs.statsig.com/experiments/implementation/implement), [Monitor an Experiment](https://docs.statsig.com/experiments/monitor)

**For Adler:** agreed, scheduled, attempted, reported and reviewed must remain distinct. A calendar block is planned work; a user’s check-in establishes what happened. Missing reports are unknown. A completed task does not establish a completed goal or show that the coaching change helped.

### 3. Results retain the original question

Statsig’s Results page places the hypothesis before cumulative exposures and the metric scorecard. It defaults to cumulative results; other views and statistical detail are available on demand. Early hourly results are for checking instrumentation, not calling a winner. [Statsig: Read Experiment Results](https://docs.statsig.com/experiments/interpreting-results/read-results)

**For Adler:** show the starting arrangement and expected change beside the reported experience. Lead with the practical meaning; allow inspection of reports, comparison limitations, behavioural interpretation and exact sources. Do not declare a personal rule after two apparently successful attempts.

### 4. Evidence and the practical decision remain separate

Statsig’s configurable decision framework maps primary and guardrail outcomes to rollout, discussion or no rollout. The recommendation sits beside the decision control. This is a decision aid; it does not remove judgment. Some configurations can also require organizational review. [Statsig: Decision Framework](https://docs.statsig.com/experiments/templates/decision-framework)

**For Adler:** a result can be mixed while the person still prefers to keep the arrangement. “Keep this,” “Adjust,” “Discuss,” and “Pause” are practical decisions. Their evidence standing and user preference should remain separately recorded. Do not copy enterprise approval machinery.

### 5. Ending a test does not erase its evidence

Statsig keeps results accessible after a decision. Its documented rollout flow freezes a result snapshot; the holdback flow links decision history to an earlier result snapshot. These specific rollout/holdback features are marked Early Access. Archiving preserves results and does not imply that unarchiving restarts collection. [Statsig: Make a Decision](https://docs.statsig.com/experiments/ending/make-decision), [Ending an Experiment](https://docs.statsig.com/experiments/ending/ending-experiment)

**For Adler:** retain each proposed change, original prediction, agreement, review and revision. A new hypothesis must not overwrite the previous prediction. The current version should be obvious, with earlier changes available along the same dated journey.

## What we must not copy

Statsig’s experiments randomize comparable units into control and treatment. Its confidence intervals describe estimated differences between those groups. A person’s “before” week is not a randomized concurrent control group. Repeated sessions may be dependent, and contextual changes can explain apparent improvement. [Statsig: Experiments Overview](https://docs.statsig.com/experiments/overview)

Adler’s current ordinary check-ins support **prospective, observational personal tests**, not automated causal A/B experiments. We must not borrow statistical significance labels, power thresholds, red/green winner claims or population randomization assumptions. Introducing actual randomized personal trials would require a separate design for carryover, comparability, burden, consent and suitable outcomes; it is outside this change.

The goal forecast has a separate purpose: conditional arithmetic linking measured inputs to an outcome. Reading pages may support a transparent pages-to-books scenario. Focus hours cannot be converted into revenue without a justified relationship and suitable observations. A forecast range is not the confidence interval of a coaching effect. These boundaries follow Adler’s [individual-learning methodology](individual-learning-methodology.md) and [input–outcome contract](../input-outcome-coaching.md).

## What Linear adds

| Pattern supported by Linear | Adler application |
| --- | --- |
| A canonical project overview contains purpose, properties, resources and milestones. Contextual detail is also accessible from the work list. [Project overview](https://linear.app/docs/project-overview) | One goal home with a visible section index. The outcome and current action orient the person before details. |
| Milestones represent meaningful stages, can have optional dates and can narrow the work shown. [Project milestones](https://linear.app/docs/project-milestones) | Explain milestones as verifiable results. Show the actions that contribute to one when selected. A milestone is not a compulsory intermediate level for every goal. |
| The high-level timeline displays projects and milestones, while detailed issues live elsewhere. [Timeline](https://linear.app/docs/timeline) | Separate the whole-goal horizon from the current actionable period. Use aligned timeline lanes, not hundreds of future actions inside the outcome chart. |
| Latest project updates appear in the overview; the update history includes changes to project properties and milestones. [Initiative and Project updates](https://linear.app/docs/initiative-and-project-updates) | Keep “what changed and why” beside the current plan, with earlier changes one level deeper. |

Linear’s project graph extrapolates remaining issue points using weekly velocity and an approximately ±40% buffer. This is not a calibrated success probability, and the formula does not transfer to life goals. Copy the distinction between observed work, conditional forecast and target—not the numerical rule. [Project graph](https://linear.app/docs/project-graph)

## The Adler experience to implement

### Goal home: a stable index, then the work

1. **Overview:** chosen outcome, reported starting point, current status and current action. One canonical Check-in entry.
2. **Plan & timeline:** current planning period, its actions and next review; milestones on the goal horizon. Future work stays conditional where it depends on feedback.
3. **Progress:** the chosen input and actual outcome, with observed history and a conditional projection when defensible. Explain what is being tracked and provide Edit. Missing projection data must not masquerade as missing tracking.
4. **Learning journey:** starting arrangement → proposed/accepted test → feedback → next decision. Dates, version and workflow status establish the order.
5. **Details:** measurement definitions, source records, plan history and full scientific reasoning remain reachable without dominating the overview.

A manual draft still has an action and a success criterion. Display that as its starting plan, with an event-based review after the first report if no dates were chosen. Do not silently invent dates, recurrence, capacity or a researched explanation. The shared coach must supply a deliberate cycle and measurement choice when it creates or recommends a plan. Existing incomplete goals need a clear recovery path through that same coach.

### Learning: show what changed across time

The compact learning view should have a dated sequence with distinct roles: **Starting point → Test 1 → Feedback → Test 2 (current)**. Selecting a stage opens its saved comparison, prediction, reports and decision. The current practical change remains prominent; its supporting evidence is subordinate but traceable.

Use the existing versioned learning records rather than adding a second experiment system. Keep personal observations and the behavioural-science interpretation distinct. The interpretation must bind to specific claims and versions from the research registry, preserve P-principle IDs and transfer limitations, and continue through the shared semantic review. This serves Define, Observe, Design and Learn in the [Adler Method](../method/adler-method.md), especially P3–P6, P14–P18 and P24. It does not replace the synthesis with a generic scientific-method diagram.

### Landing: demonstrate, do not invent another product

Use actual app captures as the main demonstration for each relevant journey step. Crop/focus and animate those captures to guide attention; provide pause, reduced motion and enlargement. Short captions explain what changes, rather than covering the screenshot with competing boxes. Preserve the approved headline, top mobile screens, immersive graph, visual brand and truthful integration availability.

## Evidence limits and verification

Research used current official documentation and representative embedded product screenshots. The research lanes inspected six Statsig and five Linear UI artifacts; no authenticated console was operated. Public artifacts establish documented structures, not usability or behavioural efficacy. Publication/update dates were generally absent; all links were accessed on 7 September 2026.

Linear documentation disagrees about configurable project statuses and whether a target date is needed for prediction. Those setup claims are excluded from the recommendation. Older Statsig screenshots include legacy metrics; use the current creation requirements, not old screenshots, for configuration claims.

Implementation must be checked with new-goal flows, legacy goals, quantitative and milestone outcomes, missing reports, pending versus active hypotheses, revised tests and mobile/keyboard navigation. Browser checks can establish function and readability; consumer comprehension still needs user evaluation. Research stopped after the consequential patterns had first-party support, their transfer limits were explicit and further generic searching was unlikely to change the design decision.
