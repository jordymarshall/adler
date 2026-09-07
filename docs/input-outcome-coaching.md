# Learning how controllable inputs relate to goals

The foundational contract is [the current Adler Method](method/adler-method.md), based on the recovered synthesis and supporting research. This updates the projection and learning-loop contract in `controllable-action-planning.md`. The change applies to the coach across goals; reading and revenue are examples used to verify it. Existing plans are eligible for reassessment under `input-outcome-learning-v2`. Reassessment preserves chosen work and proposes changes for review.

## Coach responsibility

Work backward from the user's goal to a useful controllable input, then help the user execute it. Choose the input quantity, modest starting budget, concrete planning window, measurement method, feedback delay, and review question from the person's constraints and the outcome's uncertainty. A long goal does not require a year of detailed tasks. The existing learning experiment records a starting comparison, alternative explanations and a decision rule. Keep execution evidence separate from outcome evidence.

For cumulative numerical goals, the plan can save one explicit input–outcome model. It references a repeating step, a comparable-history start date, measured quantity or actual hours, outcome unit, feedback delay and a projection horizon of up to ten years. It also records why these choices make sense and their assumptions. Actual hours come from reported minutes, never booked duration. Focused time needs a separate quantity measure if it differs from elapsed time. Other outcome types remain qualitative until an appropriate model exists.

- **Direct conversion:** record an adjustable range of input per outcome, such as pages per book. Five pages daily toward thirty 300-page books implies 1,800 days from the starting point. Book-length uncertainty widens the attainment fan. Input arithmetic never fabricates a completed-book report.
- **Learned relationship:** choose an initial input budget without inventing an outcome return. Pair cumulative outcome changes with measured input over the corresponding intervals, aligned by the chosen feedback delay. Until there are paired observations, the return and finish date remain unknown. Later, total outcome change divided by total matched input supplies an observed return for a conditional scenario. This is an association, not a causal model or a promise that focused hours generate revenue.

## Projection contract and limits

`shared/goal-projection.ts` computes the same evidence for the goal view, goals table and coach context. It does not mutate plans or outcome reports. The y-axis is percentage of the goal, with the target at 100%; the x-axis extends to the goal horizon. Actual outcomes, projected outcomes and the attainment range have different marks. Action adherence remains a separate measure.

Recent input pace uses complete seven-day measurement blocks within the last eight weeks. Unknown measurements exclude a block; Done without a quantity is not a quantity, and explicit misses are zero. Dates with no scheduled records assume no unlogged input, disclosed in the UI. Fewer than two complete blocks use the saved budget and a half-to-one-and-a-half pace sensitivity range. These are transparent display heuristics, not rules for when the coach may learn or review a goal.

A direct model combines input pace with the saved conversion range. A learned model uses zero to twice observed return for fewer than three matched intervals, then the observed return range. Neither fan is a statistical confidence interval, calibrated probability, or guarantee. The boundaries do not cover every possible future. Matched intervals can differ in duration, circumstances and competing influences. Missing measurements and outcome resets are excluded. Comparable step measurement IDs preserve useful history across plan versions; changed units do not silently mix.

Projections start at the last confirmed outcome. The date of that report stays visible. Learned scenarios continue the observed input pipeline, with feedback delay used to align historical input and outcome; they do not restart that delay after every report. Paused goals have no active projection. A zero pace or return, or a finish beyond the saved horizon, produces no invented finish date. Target and milestone dates remain user commitments; projections never reschedule them or book future cycles.

## Persisted learning loop

Each insight may save an observation-linked hypothesis, an experiment, a result with actual report IDs, a resulting working insight, a next hypothesis, a predecessor insight ID, and retrieved research source IDs. Pending results and conclusions stay null. Every new recommendation includes the behavioural rationale required by the current Adler Method: synthesis principles, goal route, reported barrier, enabled framework, mechanism, fit, prediction, review rule and limits. Service validation rejects invented research, unsupported result references and missing predecessors, and retains cited research metadata alongside the decision. A separate evidence review checks whether the framework actually supports the inference. Historical loops remain intact.

The interface distinguishes three roles: user-reported evidence, Adler's research-informed reasoning, and the change to try. Six numbered stages form a straight deduction path: observation, hypothesis, test, result, inference and next question. Downward arrows show the logical order; evidence and literature occupy a separate source column. There is no circular layout or decorative card diagram. Observation and result nodes open their source records; hypotheses open their literature basis. Applying a plan is never shown as an experiment result.

## App and landing representation

The goals table groups goals by category, shows reported activity in a twelve-week heatmap, separates outcome attainment from adherence, and lists conditional finish ranges or the missing model. Calendar defaults to a complete month, colour-codes goals, marks Adler commitments, and opens complete event details; connected calendars supply busy time. Week view remains available. Landing chapters 01–04 capture these actual app routes and actual click states with fictional data. Headline/subheadline suggestions are review options only; current landing copy is unchanged.

Verification covers direct arithmetic, learned return, unknown measurements, feedback alignment, historical revisions, input-model validation, evidence repair and persistence, desktop/mobile navigation, source links, accessibility, and refreshed app captures.
