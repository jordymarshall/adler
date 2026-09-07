**Proposal: make the adaptive plan Adler’s main product**

Product and engineering proposal, September 6, 2026. Inspected revision: `d17de47`. This document records the agreed design and the original investigation; its diagnosis describes the pre-change revision. The implementation and verified boundaries are recorded in [Adaptive planning](adaptive-planning.md). The reported $100k goal was not inspected in a live account; the findings below come from the application’s schemas, prompts, interaction paths, tests, and Git history.

Adler should make this promise concrete: “Know what to do next, see whether it is helping, and understand what changes when life or the evidence changes.” Every goal’s main screen should answer five questions: What is the approach? What do I do next? Where am I actually? Where does the evidence suggest I’m heading? What have we learned and changed?

Agreed scope: Adler remains a general goal coach; the $100k example illustrates a planning problem rather than specifying the user’s revenue definition, business, baseline, or deadline. Those details materially change an actual plan. Recommended limits and review frequencies below are product defaults to test, not scientific constants.

**Decisions agreed during grilling**

1. Autonomy: starting a plan authorizes Adler to maintain recurring tasks, reorder unbooked work within the agreed weekly capacity, and update forecasts. Changes to strategy, weekly workload, goal targets, or confirmed calendar bookings require a concrete proposal that the user can accept or edit. Missed sessions do not authorize silently increasing later workloads. Implementation will follow the interview on branch `reengineeredv2`, with verification, commit, and push already requested; implementation awaits confirmation of shared understanding at the end of grilling.
2. Intake: before calling a new plan ready, establish the meaning of success, relevant starting situation, realistic weekly capacity, and deadline flexibility. Use saved context first and ask only missing questions, one at a time. The threshold is enough context to choose a defensible first week. Unknown metrics can become learning tasks; unresolved assumptions stay visible and timelines remain provisional where evidence is missing.
3. Coach-owned planning judgments: we are engineering the coach, not making its case-by-case coaching decisions. Adler chooses planning cycle, task granularity, recurrence, scheduling specificity, and review cadence from the goal, user context, constraints, evidence, and feedback delays. Goals may take hours, days, weeks, years, or be ongoing. This refines decisions 1–2: agreed capacity applies over the relevant windows, and intake must support a defensible first period of work, which need not be a week. A weekly cycle is one supported choice, not a universal requirement. Further grilling should resolve product capabilities, user authority, and quality guarantees; coaching choices belong to the system.
4. Context-assisted user check-ins: check-ins depend on user input. Adler should surface relevant context already available from authorized connections to accelerate the check-in and make coaching fit the individual's life. Connection records can support suggested details or focused questions, but do not automatically establish action completion, an obstacle's cause, or a personal preference. Keep source context distinguishable from the user's confirmed report; let the user confirm, correct, or skip suggestions. Missing or stale connection context must not prevent a manual check-in.
5. Existing goals: preserve results, history, and booked work. Adler prepares an adaptive-plan upgrade from available context and presents a “Review updated plan” card explaining its structure and proposed changes. Acceptance activates the upgraded plan; if essential information is missing, Adler asks a focused question. Users should not need to recreate goals, and an upgrade must not silently replace an accepted plan.

**What the current system explains**

| Finding | Evidence | Product consequence |
| --- | --- | --- |
| A plan version stores one action, timing/cue, completion criterion, optional duration, and an optional research basis. | [Plan and Action](../shared/workspace.ts) | There is no structured weekly set of commitments or repeatable behavior definition. Multiple action records can exist, but they are not a durable behavioral plan. |
| Milestones form a flat list. Actions reference their goal and plan version, with no milestone or behavior link. | [Workspace types](../shared/workspace.ts), [validation](../shared/validation.ts) | The system cannot directly show which weekly work advances which milestone. Submilestones do not currently exist. |
| A plan can have one optional action measure per action/day/week. Check-ins can record an amount and note. | [Planning basis](../shared/planning.ts), [check-in](../src/ActionCheckIn.tsx) | Personal behavior tracking exists, but generation is optional, multiple behaviors are not independently modeled, and a period label does not generate recurring work. |
| Plan explanation, progress, behavior totals, and milestones sit inside closed disclosures beneath the next action. | [Goal workspace](../src/GoalWorkspace.tsx) | The user sees a step without the surrounding approach, timeline, and feedback. |
| Status compares the latest outcome with the last agreed checkpoint. The chart draws recorded results and planned checkpoints. | [Status](../src/progress.ts), [chart](../src/ProgressChart.tsx) | Neither produces a behavior-informed forecast, expected achievement date, or deadline probability. Moving a checkpoint changes the comparison; it does not estimate the future. |
| A form check-in saves records. When available actions are exhausted, the UI offers “Plan the next step,” which opens coaching. | [Check-in](../src/ActionCheckIn.tsx), [next step](../src/GoalOverview.tsx), [save path](../server/service.ts) | Completing work does not itself maintain a rolling weekly plan or initiate a strategy assessment. |
| Research retrieval, citation validation, a separate model evidence review, personal context, insights, and proposals already exist. | [Research](../server/research.ts), [coach](../server/service.ts), [context](../src/coach-context.ts) | Useful foundations exist, but the output contract permits a thin plan. Stronger prompts alone cannot create missing durable behavior and forecast structures. |
| Scheduled phone check-ins and weekly reviews require enabled automation and a usable phone link. They send prompts; the review reminder itself does not replan. | [Jobs](../server/channels.ts) | Routine plan maintenance should not depend on messaging setup or another user-initiated chat. |

Commit `9035f59` removed Coach from the shared desktop/mobile navigation and removed the coaching section navigation for Chat, Review & plan your week, Insights, and Program. `/app/coach` still exists behind “Ask Adler”; the related routes remain. This was an explicit navigation simplification, not deletion of the coaching engine. Restore Coach as a primary destination and retain contextual Ask Adler.

The application supplies instructions, saved context, and retrieved research to general models. It does not train their weights on this user or on proprietary attainment data. The [runtime explanation](agent-system.md) explicitly distinguishes memory and plan revisions from model training. The evidence review checks claims, applicability, and saved-record consistency; it is not an evaluation that a user received a feasible, connected daily/weekly plan.

**The product model**

Use only the structure that makes the chosen approach executable and understandable. The elements below are available to the coach, not mandatory levels every goal must contain. Additional task decomposition should expose useful prerequisites or manageable work, not add ceremony to a small goal.

| Element | Question it answers | Example, assuming a service business pursuing cumulative collected revenue |
| --- | --- | --- |
| Outcome | What counts as success? | Collect $100k in a specified currency and period. |
| Approach | How might the outcome happen? | Test an offer with a specific customer group, then repeat the acquisition path that produces paid work. |
| Milestone | What meaningful result or learning unlocks the next stage? | First paid pilot delivered and payment collected. |
| Commitment for the current planning window | What work fits the time actually available now? | Prepare an offer and run a bounded outreach experiment over a chosen week. |
| Behavior | What useful action repeats, under what cue, and how much? | Three 30-minute outreach sessions this week, after a chosen existing routine. |
| Action | What is the next executable instance? | Send five individually relevant messages; finished when sent and recorded. |
| Observation | What happened, and what did it produce? | Messages sent, responses, qualified conversations, paid work, time used, or a reported blocker. |
| Adaptation | What changes because of that evidence? | Test different targeting after adequate exposure and response time, or change the cue when meetings displaced sessions. |

Behaviors and one-time tasks are different. “Write the offer” should finish. Outreach may recur while that approach is active. A behavior may support several stages, so it should have a stable identity rather than being duplicated for each milestone. Support explicit action/behavior links and prerequisite relationships. The coach chooses the decomposition required by the work, with no requirement to manufacture milestones or habits for a goal that needs only one or two actions.

A goal can also be an ongoing practice with no natural finish date. Its main forecast concerns maintaining the desired frequency over a period. Learning, cumulative outcomes, recurring revenue, and deliverable projects require different measurement and forecast meanings. Do not force all goals into cumulative milestone counts.

The coach must independently choose the outcome horizon, the window of work to make concrete now, action size, expected feedback delay, and next review time or event. These need not have the same duration. A one-day goal may need two actions and an end-of-task check; a year-long goal may need provisional phases, a short current experiment, daily behaviors, and slower outcome reviews. These illustrate possible choices rather than duration-to-template rules. The saved plan must expose the chosen dates/triggers and a concise rationale so the UI, scheduler, and review worker can execute them.

Task decomposition stops when the next work is feasible for the user, has a clear start and completion criterion, and does not hide a prerequisite or unresolved decision. Split further when uncertainty, task difficulty, or observed execution warrants it. Avoid a universal session length, fixed number of tasks, or proportional rule such as always planning a fixed fraction of the goal's duration.

**How Adler should choose useful work**

First establish the meaning of success, current evidence, deadline flexibility, and feasible capacity. Ask the smallest question that changes the decision. “$100k revenue” requires clarification of the period and revenue definition. Missing conversion history can remain unknown while Adler creates a discovery plan. Missing availability should produce an explicitly provisional workload, not an assumed daily habit.

The planner should then follow this decision sequence:

1. Identify the current limiting step. Is there an unknown strategy, a missing prerequisite, too little opportunity to act, insufficient skill, or an approach that is not yielding results?
2. Propose a few candidate actions. Prefer actions that advance a necessary result or reduce an uncertainty that changes the next decision. Explain the chosen action’s connection to the milestone.
3. Check prerequisites and control. A task should be executable now. “Get three customers” is an intended result, not a controllable daily task. “Contact five suitable prospects” is controllable; whether it is useful remains a hypothesis to test.
4. Fit commitments to the person’s agreed capacity over the relevant time windows across all active goals, including preparation, review, and delivery work. Leave some slack. A nominally free calendar does not prove willingness or capacity.
5. Choose how far ahead concrete work remains useful given uncertainty, dependencies, duration, available capacity, and expected feedback. Save that window in detail and keep later work provisional. Reassess the window as evidence changes. A known short goal may be fully specified; a long uncertain goal should not require months of brittle tasks.
6. Give each repeating behavior a cue/window, frequency, observable amount or criterion, estimated duration, smaller fallback where useful, and a review/stop condition. Event-based work can have a trigger instead of a daily quota.
7. Define when feedback should become informative and what would justify keeping, changing, or stopping the approach. If the next step is research or discovery, its completion criterion is the evidence or decision obtained.

For the revenue example, the starting stage matters. Someone with no offer may need customer discovery and an offer test. Someone with a proven offer and insufficient leads may need acquisition work. Someone with demand but no delivery capacity may need delivery changes. The title alone cannot justify assigning the same sales habits to all three.

Plan generation should fail its completeness check if it produces only milestones and explanatory prose. A usable draft must contain connected executable work, a specific next action, observable feedback, feasible or explicitly provisional capacity, and a meaningful next assessment date or event. Repeating work needs a recurrence/stop rule; one-time work does not require a habit. The plan must represent the selected planning window and distinguish planned duration from feedback delay. It may honestly say the long-term forecast is unavailable.

**One main goal screen**

The goal’s default screen is the plan. Today opens the relevant current work using the same saved plan; Calendar displays its schedule; Coach discusses and changes those same records. They must not maintain separate versions of the plan.

```text
YOUR GOAL                                             Ask Adler
$100k collected · [defined period] · Target [chosen date]

ACTUAL                 EXPECTED FINISH               STATUS
[recorded amount]      [range, or insufficient data] [specific reason]
Last updated [date]     Change since review [delta]   Deadline outlook

[Outcome over time: actuals, agreed plan, forecast range, target date]
[Milestone markers; select one to see the work and evidence behind it]

THE APPROACH
[One sentence: current stage, strategy, and why it fits the evidence]

CURRENT WINDOW · [dates]          NEXT ACTION
[Commitment and budget]           [Next action and completion criterion]
[Behaviors: planned / recorded]   [Time or cue] [Start / check in]
[One-time tasks and blockers]     [Smaller option / adjust]

WHAT WE LEARNED → WHAT CHANGES
[Observation] → [interpretation to test] → [specific proposed change]
[Evidence] [Expected effect / unknown] [Accept / edit / keep plan]
Next review [date] · We will check [test criterion]

Why this approach? · Earlier plans · Full observations
```

The approach, present status, current planned work, and latest material adaptation stay visible by default. Use natural headings such as “Today,” “This week,” or the actual date range to match the selected window. Supporting studies and full history can remain expandable. On mobile this is one scrollable screen, with the goal/status summary followed by the next action, timeline, current work, and adaptation. “One screen” means one coherent place, not an unreadable dashboard squeezed into one viewport.

Make each actual value show its observation date and source. Keep the progress chart in outcome units; do not combine revenue and task completion on one axis. Show a separate small behavior summary with planned opportunities, known outcomes, and unknown updates. Avoid a single opaque “goal health” score.

Selecting a forecast change should explain the data or assumption that changed it. Selecting an adaptation should highlight the future work it changes. A proposed alternative can preview a scenario on the chart, clearly distinguished from the current forecast. No effect should be presented as measured before it has been observed.

**What personalization means in use**

A fast check-in captures completion or partial completion, the relevant amount if known, and an optional blocker/context. Actual time is useful when workload estimation needs it; it should not become a mandatory diary. Collect intermediate and outcome feedback at its natural cadence instead of demanding a revenue update after every work session. Record unplanned work and corrections as well as scheduled work.

Use available connection context to make that interaction specific and lightweight. For example, if checked calendar data shows overlapping meetings, Adler can surface that context and ask whether it affected the planned work. A calendar event alone does not establish attendance, completed work, or why a session was missed. Only offer context at the detail level the connection actually provides, with its source and freshness; the existing availability adapter must not be presented as providing event titles or activity records it does not expose. Suggested check-in details remain suggestions until the user submits or explicitly confirms them, including through chat. Context selection should be relevant to the current work rather than a feed of unrelated personal activity.

| Observation | Appropriate response |
| --- | --- |
| Two planned sessions were displaced by meetings. | Ask whether timing or capacity is the issue; propose protected windows, a smaller commitment, or an explicit date tradeoff. Do not infer a personality trait. |
| The person carried out the planned outreach, but responses remain weak after the expected response window. | Inspect targeting, offer, channel, or execution quality. Propose one informative change rather than automatically increasing volume. |
| Actions happened but outcome feedback has not had time to arrive. | Show the lag and continue the test or gather leading feedback. Do not label the strategy unsuccessful yet. |
| Check-ins are missing. | Mark unknown and reduce certainty as appropriate. Do not convert missing reports to zero activity. |
| The same work takes more time than budgeted. | Re-estimate workload from actual durations and reduce or reprioritize upcoming commitments. |
| Useful results arrive with less effort. | Reconsider the needed workload; increased targets should be a choice. |

Personal learning needs traceability: “You reported meetings displaced two sessions” is an observation. “An earlier cue may help” is a hypothesis. “Try the earlier cue for the next scheduled opportunities and review on Friday” is an experiment. Its later result can support retaining or reversing that change. Save lasting personal context through the existing confirmed-memory policy; a tentative finding should remain correctable and scoped to its evidence.

Behavioral science should change these interactions. Research on progress monitoring supports tracking and feedback as part of goal pursuit; it does not establish an individual’s revenue trajectory. [Harkin et al., 2016](https://pubmed.ncbi.nlm.nih.gov/26479070/). COM-B provides a framework for examining capability, opportunity, and motivation before choosing an intervention; it is not a diagnosis or proof that a particular adaptation will work. [Michie et al., 2011](https://link.springer.com/article/10.1186/1748-5908-6-42). The proposed application of these findings is our product judgment, to be evaluated in use.

**Flexible timelines with honest forecasts**

Store the user’s target date separately from the model’s expected achievement date. Also store whether the deadline is firm, preferred, or absent. An observation can update the forecast automatically; changing the goal, accepted workload commitment, or external calendar booking should follow the user’s instructions and the existing proposal rules.

Use three explicit forecast states:

| Evidence available | What the screen can responsibly show |
| --- | --- |
| Baseline or relationship between actions and outcomes is unknown. | “Building the first estimate,” the missing evidence, and when the next assessment will occur. Initial scenarios must expose assumptions. |
| Relevant observations support a provisional model. | A conditional achievement range or expected outcome at the chosen deadline, with inputs, data freshness, limitations, and a comparison to the previous forecast. |
| Probability estimates have been evaluated against held-out outcomes and remain applicable. | Chance of reaching the target by the deadline, with model scope and calibration monitoring. Sparse or changed conditions can withdraw the percentage. |

For a cumulative revenue goal, a candidate model can connect relevant outreach volume, response, qualified conversations, paid conversions, typical deal amounts, and payment delay. Start with only the stages supported by actual observations, preserve denominator/cohort definitions and uncertainty, and account for existing pipeline and delivery limits. This is a conditional model, not proof that additional messages cause proportional revenue. Monthly recurring revenue would require a different model including retention and churn; do not reuse cumulative arithmetic.

Where stable cumulative progress supports a simple rate model, use it before building a richer one. Where it does not, show unavailable or assumption-based scenarios. A point estimate with an arbitrary plus/minus range is not an uncertainty model. A completed task should influence the forecast only through the inputs it actually informs. Avoid counting reduced session frequency and reduced outreach volume twice as independent penalties.

The model must be allowed to say the target is not reached within its forecast horizon. Do not force every trajectory to cross the goal line. Do not use a straight line drawn to the chosen deadline as an estimate of success.

Recompute relevant summaries on observations, corrections, capacity changes, approved plan changes, and date rollover. Show material changes and their causes; avoid noisy daily replanning. Run broader adaptation reviews at the agreed cadence or when a meaningful blocker, milestone, or sufficient new evidence warrants one. Detect and queue those reviews automatically in the app; do not require a phone connection or another chat prompt. Recording progress should remain fast if the model is slow or unavailable.

If a deadline is firm and the forecast slips, present the real tradeoff: different scope, approach, capacity, or acceptance of the risk. If flexible, propose a revised target if useful while keeping the previous commitment in history. Forecast updates and accepted plan changes are different records.

**Engineering direction and delivery order**

Keep the existing shared coach, validated command path, proposals, source snapshots, action history, and calendar adapters. Build one planning module whose interface can prepare a reviewable plan revision and read the current plan/status for a goal. Its implementation owns the relationship among commitments, observations, and forecasts, so screens and chat do not each reconstruct those rules.

The LLM proposes a strategy, interprets context, selects candidate work and its granularity, chooses planning and review horizons, explains tradeoffs, and drafts adaptations. It needs tools to inspect saved context, retrieve relevant evidence, inspect availability, submit structured plans, obtain deterministic feasibility/forecast checks, and request future assessments. Deterministic application logic validates measures and references, maintains recurring occurrences, enforces capacity/prerequisites, aggregates records, and computes any supported numerical forecast. These checks return actionable feedback so the coach can revise a deficient plan; they do not prescribe one universal coaching cadence. The model should not invent a percentage in prose and have the UI treat it as a calculated fact.

Minimum durable additions are a versioned plan containing work relationships, a chosen planning window with dated commitments, and assessment dates/event triggers; stable behavior definitions with recurrence/stop rules where applicable; action links to those definitions and relevant milestones; typed observation semantics; and forecast snapshots referencing their input records and method. Extend existing decisions with proposed/applied status, observed cause, intended effect, and a review criterion. Preserve behavior identity across timing-only plan changes so useful history does not disappear when the plan version increments.

Both form writes and coach commands must trigger the same derived summary refresh and review eligibility checks. Reuse the current account locking, revision checks, and persistence. Recurring work needs stable occurrence IDs, retries without duplicates, correct timezones, and pause/resume behavior; an unattended review must discard or rebuild a stale proposal. Materialized future actions must respect already recorded work and confirmed bookings. These are extensions of existing flows, not a reason to introduce another agent framework or replace storage.

| Delivery slice | Change | Verification that makes it complete |
| --- | --- | --- |
| 1. Make the current truth legible. | Restore Coach; show the approach, existing behavior measure, progress, dates, and relevant changes on the goal screen. Label forecast unavailable where appropriate. | Desktop/mobile navigation reaches Coach; a person can identify the approach, current record, next action, and what is unknown without expanding history. No existing checkpoint is relabeled as a forecast. |
| 2. Make the adaptive plan real. | Extend schema and commands; save connected one-time tasks and repeating behaviors; let the coach choose a feasible planning window, decomposition, and assessment timing, with a visible provisional horizon where needed. | Day-long, week-long, year-long, and ongoing test goals yield appropriate connected work without forced weekly cycles or unnecessary habits. Completing an occurrence exposes the next available work without another chat. Retries do not duplicate actions; pause stops future generation; migration preserves legacy records. |
| 3. Close the feedback loop. | Aggregate behaviors and outcomes, trigger reviews, and save sourced adaptations with before/after changes and the next test. | Equal outcomes with different behavior evidence can produce different recommendations; weak results after adequate execution prompt strategy review; unknown and delayed feedback do not become failure. Every material adaptation can be traced to observations. |
| 4. Add supported forecasts. | Introduce a narrow validated forecast method first, input provenance, date/range changes, and optional scenario comparison. Broaden only to goal types with meaningful models. | Frozen histories reproduce forecasts; corrections rebuild them; unsupported cases remain unavailable. Deadline changes remain explicit. Probability display waits for predictive evaluation. |

Legacy plans should remain usable as recorded next actions. Adler prepares an adaptive-plan upgrade from their existing context, presented on the existing goal as a “Review updated plan” card explaining the structure and changes. Ask a focused question when essential information is missing; activate the upgrade only on acceptance. Do not require users to recreate their goals or fabricate past recurrence, baseline observations, conversions, or learned preferences. Preserve results, booked work, old measurements, and accepted dates in history.

**Quality bar**

Test the product contract through the shared planning interface and the main screen, alongside the existing command, calendar, channel, and accessibility checks. Model-output schema validity and a plausible cited rationale are necessary but insufficient.

Use a fixed scenario suite: ambiguous $100k; a precise revenue goal with no baseline; a known offer with an acquisition constraint; strong execution with poor response; low execution caused by reported timing conflicts; missing reports; delayed feedback; competing goals that exceed capacity; a firm deadline; and an ongoing practice with no finish date. Include goals lasting a day, a week, and a year, plus comparable goals with different uncertainty, capacity, and feedback delay to catch hardcoded duration-to-template behavior. Run a bounded live-model evaluation against these cases in addition to deterministic fixtures, with a rubric for useful decomposition, appropriate planning/review horizons, feasibility, connection to the outcome, and honest uncertainty. Do not require the exact same wording or task choice to pass.

Check-in verification must cover useful connection context, unavailable/stale context, correction of a suggested detail, and user submission through both forms and chat. Merely retrieving context or opening a check-in must not record an outcome or manufacture a causal explanation. A manual check-in must remain usable without a connection or model response.

Before shipping, a comprehension study should show that people can identify the approach, current planned work, their actual status, the forecast’s uncertainty, and the latest adaptation from the default screen. Track plan use over the relevant goal horizon, informative feedback, whether proposed adaptations solve reported blockers, and progress in the goal’s own units. Logging frequency or streak length alone is not success. Later probability claims require retrospective prediction tests using only information available at each prediction time, interval coverage/calibration checks, and drift monitoring.

The first release should make the behavioral plan usable and the current evidence visible. Credible forecasting then makes its consequences legible. The full product is complete when users can see the chain from planned work to observed behavior to outcomes to a justified change, without having to reconstruct that chain from chat history.
