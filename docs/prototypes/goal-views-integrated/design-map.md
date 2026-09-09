# Adler UX grilling — working map

Started 7 September 2026. Design interview requested by the user after viewing `.context/attachments/zB2nAN/image.png`. No app changes authorized during this interview. The recommendations below are provisional. Resolve one decision at a time and record the user's answer before descending into dependent choices.

## Diagnosis from the screenshot and code

- The same action and rationale recur in approach text, planning-period explanation, the numbered action and the next-step explanation.
- A five-day test is compressed onto a goal horizon ending in January 2028. The dominant visual scale does not serve the immediate planning task.
- The user must combine action, cue, amount, dates, capacity and review information scattered among paragraphs and labels.
- Section headings and disclosure controls created a document outline, without establishing one dominant visual or a clear next interaction.
- Technical truth needs better presentation. The solution must preserve uncertainty, pending versus applied state and scientific source access.
- This is also visible beyond the screenshot: old language such as “Review the model in Check-in” and “About you” remains in other surfaces; methods, decisions, history and context have overlapping presentations.

## Established decisions to preserve

- One shared coaching system across app controls, chat, SMS/iMessage and MCP; the interface never introduces a second coach.
- Adler chooses the plan, action granularity, cycle, tracking and next useful question based on the person and goal. The user can change them.
- Controllable input, observed outcome, conditional projection and personal hypothesis remain distinct.
- Behavioural inference uses the complete owned framework and specific cited claims/personal evidence. The short explanation comes from the same saved reasoning.
- Durable learning retains the original prediction, agreement, feedback, corrections and revisions. Agreement is not exposure; missing reports are unknown.
- One canonical Coach handles conversation and reporting; check-in is an interaction type. Contextual entry points open that same conversation with relevant context.
- The main goal screen expresses the expandable Goal → Plan → Milestones → Actions hierarchy diagrammatically, with a linked timeline. The user's G13 correction explicitly rejects rendering it as a literal text/bullet tree. Selection reveals detail while preserving parent context; explicit types and linked parents also accompany references elsewhere.
- On opening a goal, show all known milestone headings and expand the actions for current milestones. Upcoming and completed milestones start collapsed and can be expanded in place.
- For longer goals, open the current work at a readable zoom while keeping a compact full-goal graph above it. Highlight the inspected interval in the overview and preserve the hierarchy when navigating through time.
- Selecting an action opens its measured input history while the goal's outcome graph remains visible. Retain the selected action's type and milestone/goal context; keep goal projections attached to the outcome they estimate.
- Each milestone leads with its own success measure. Show contributing action completion alongside when it measures something different; use one measure when the milestone is defined by that work itself.
- Active experiments appear as labelled periods on affected actions' timelines. Selecting one opens the same learning record beside the plan, retaining goal/action context and access through Coach.
- Coach offers context-specific quick replies for simple action reports alongside free text, retains the linked work context, and shows a correctable save receipt. Follow-up questions depend on what would usefully inform coaching, not a fixed reporting questionnaire.
- Suggestions preview their changes on the existing plan and timeline, with Current and Suggested values, affected-item context, included consequences and linked reasoning. Each action also needs consistent check / x / edit / calendar controls. For today's scheduled action, x records “Didn't happen”; explicit removal is handled through Edit. Placement is being resolved in G13.
- Actual app captures, phone curves/gathering and immersive graph remain landing requirements. Marketing updates follow the agreed app design.
- Neutral app body text; colour for useful visual meaning and headings. Today implementation remains lower priority, while its place in the system is included in this review.

## Earlier inventory — coverage only; grouping superseded below

These are user tasks, not a proposed count of navigation destinations. Several should share one view.

| Feature / task | Verified current surface | Question to answer for the person | Proposed organizing structure | Detail to open only when relevant |
| --- | --- | --- | --- | --- |
| Account entry | Auth; authenticated AppShell | Can I get into my workspace without losing what I entered? | Short form, preserved goal context, clear next state | Account errors and connection troubleshooting |
| Create a goal | Onboarding → Check-in; optional manual form | What am I trying to achieve, and how do I begin? | Goal in own words → consequential clarification → editable first plan | Manual definitions, advanced measurement assumptions |
| Manage multiple goals | OrganizedGoals; categories, status/tag filters, activity table | What am I pursuing and what needs attention? | Comparable goal rows, each with a consistent status and activity/progress summary | Tags, detailed measures, archived goals, full filters |
| Coordinate commitments | Program settings and execution records | Does my planned work fit the time I have across goals? | Available time and planned allocation on the same scale; goal priorities adjacent | Preferred hours, methods, program versions and diagnostic checks |
| Goal orientation | GoalWorkspace index; GoalPlan overview | Where am I, what am I working on now, and what can I do? | Persistent outcome/status; one dominant current-work visual; contextual next action | Full success wording, goal metadata and lifecycle controls |
| Current plan / cycle | GoalPlan, ExecutionTimeline | Which work belongs to this period, and when do we review it? | Zoomed planning interval with actual actions and a review marker | Why this interval, capacity assumptions, dependencies and fallbacks |
| Individual action | GoalOverview; action records | What exactly do I do, when, and what counts? | Action at its scheduled or unscheduled position, quantity and cue beside it, relevant control | Criterion, context, start difficulty, earlier reports; avoid duplicating complete action details elsewhere |
| Goal horizon and milestones | CycleTimeline; goal milestones/checkpoints | How does current work fit the larger goal? | Compact whole-goal overview with meaningful milestone markers and current-period selection | Milestone evidence, dependencies and date changes; keep uncertain later work explicit |
| Input tracking / adherence | WeeklyActions, GoalActivity, BehaviorChart | What work did I actually report, and what is missing? | Actual quantities across time, with known/missing reports distinguished; comparable adherence where useful | Source reports, measurement definitions and older measures |
| Outcome and forecast | GoalProjection and evidence disclosure | Is the goal outcome changing, and what might happen next? | Outcome-versus-time chart, actuals and conditional fan; align input history to the same time axis when comparing them | Conversion/relationship assumptions, alternative scenarios, missingness and source records. No invented chart or numeric finish for qualitative goals |
| Check-in / review | LiveCoach; review routes open Check-in | What happened, and what does Adler need to know next? | One conversation, focused prompt, compact save/proposal receipt linked to actual records | Conversation library, complete decision evidence, earlier threads |
| Accept or discuss a change | LiveCoach proposals; GoalPlan; LearningDashboard | What will change if I say yes, and why? | Specific before → after comparison beside decision controls and short reason | Original observation, cited interpretation, expected effect, alternatives and full change set |
| Understand myself | Insights and LearningDashboard | What is Adler learning about me, and how does that affect my plan? | Scannable entries emphasizing practical implication, scope, state and next review; selected entry opens its history | Sources, full reasoning, original observations and cross-goal transfer rationale |
| Inspect a test / learning history | LearningJourney; version and review disclosures | What did we try, what happened, and what changed next? | Dated test periods and decisions; selected test compares its original prediction with feedback | Reports, original/revised rationale, alternatives and correction history; no identical empty stages |
| Scientific basis | BehavioralRationale, ScienceSource, PlanExplanation | Why is this a reasonable suggestion for me? | Observation + specific scientific premise → tentative application → expected effect | Exact claim/source, grades, scope, excerpts, versions and uncertainty. Keep uncertainty that changes a decision visible in the summary |
| Inspect or correct memory | Saved context in Insights; linked reports | What does Adler think it knows, and can I correct it? | Attributed context grouped by relevance, with edit/correction at the selected record | Original report, affected hypotheses and source history |
| Calendar / booking | Calendar, WeekCalendar | Where does this action fit among my actual commitments? | Calendar time grid with goal colours; select a block to inspect or change it | Free-time alternatives, confirmation, recurrence, destination calendar and partial-booking recovery |
| Cross-channel access / integrations | Integrations, Connections, ProviderSettings | Where can I use Adler, and what can each connection read or do? | Connected/not connected state, capability and one next setup step | Credentials, tokens, permissions, delivery diagnostics. Catalogued “Planned” integrations remain visibly separate |
| Reminders and review scheduling | Connections; Program and Settings | When and where will Adler contact me? | Preview of next contact, channel, timing and pause/change control | Delivery history, technical failures, advanced scheduling preferences |
| Preferences and data control | Settings, Program, Memory links | How do I change my preferences or control my data? | Grouped settings rows with current values and explicit effects | Advanced methods/provider choices, export, destructive-action confirmation; clear workspace is not full account deletion |
| Today | Today → GoalOverview | What matters in my available time today? | Day timeline with scheduled work and separate unscheduled actions; contextual Check-in | Other goals, history and planning detail. Map now; implement later unless reprioritized |
| Recovery states | Inline errors, sync status, empty states, provider setup, draft invalidation | What happened, what is safe, and what can I do next? | Local status beside the affected action with draft preservation and one recovery control | Technical diagnostics; avoid a global report page |
| Landing / public explanation | Real app captures, hero, immersive graph, journey, method/support | What problem does Adler solve, and how does the journey work? | One continuous goal journey showing selected real app states and a clear focal point per step | Full-screen captures and scientific depth. Core app design comes first |

## Grilling order

1. Goal workspace's dominant task and time scale.
2. Whole-goal orientation versus current-work detail; which elements stay visible together.
3. Meaning of plan/cycle/milestone/action and which labels the user must learn.
4. Action interactions and the canonical Check-in; zero, sparse and rich-data states.
5. Input, outcome, progress, projections and uncertainty; quantitative versus qualitative goals.
6. Adaptation decisions: before/after, practical consequence, essential scientific reason and deeper evidence.
7. Insights overview, current tests, durable history and memory corrections.
8. Cross-goal comparison, prioritization and capacity.
9. Onboarding to first action, including insufficient context and unavailable provider.
10. Scheduling, integrations, reminders and preferences; remove overlapping surfaces.
11. Mobile/keyboard interaction and disclosure behavior for each agreed structure.
12. Today and landing role, preserving priority and previous approved visuals.
13. Walk the proposed design through concrete goal types and failure cases; agree observable acceptance criteria before implementation.

## G01 — superseded by hierarchy correction

Recommendation: make the current planning period the dominant visual on a goal, with a compact whole-goal trajectory always visible above it. A short planning period must remain legible even when the goal lasts years. Select an action or change to open its related detail. Preserve immediate evidence of the outcome and meaningful uncertainty.

Question: should most of the goal screen be devoted to the work in the current planning period, with the full goal timeline as a compact overview above it?

Status: the user redirected the interview to the domain hierarchy before deciding visual dominance. Do not treat the current-period-first layout as accepted.


## User decisions: one work hierarchy and one shared coach

The user rejected presenting relational concepts as independent product areas. Their latest description governs this interview:

- One All Goals overview; do not add a redundant Home/Goal Home destination. Opening a particular goal reveals that goal's work.
- Goals own plans; plans organize milestones; milestones group contributing actions. Plan/actions/milestones/progress are views of the same goal, not parallel features at the app level.
- Progress connects reported action completion and meaningful quantities to milestone and goal trajectories. Relationships may be uncertain and must be learned; some goals define success directly as the controllable input.
- All interaction belongs to the coach. “Coach” is the preferred proposed name; check-in is an interaction type.
- The coach uses goals, personal memory, behavioural science, calendar/capacity, connections and reminders as context and tools.
- Learning history is retained memory. Insights are behavioural-research inferences from memory with implications for planning.
- Experiments belong to the coach and link to the goals/actions they seek to improve. The coach's central purpose is ongoing experimentation to understand the person and improve useful action and outcomes.
- These are relationships and ownership boundaries, not a final navigation specification. Do not infer that tools cannot have contextual user controls or that all goals have a numerical outcome forecast.

### Relationships to preserve

Containment: All Goals → selected Goal → Plan → Milestones → Actions.

Derivation: reported action quantities/completion + observed outcomes + an explicit relationship → conditional milestone/goal projections.

Coaching: goals + personal memory + specific behavioural research inform a hypothesis; an experiment tests a useful adjustment to the goal's actions; reported experience updates memory; the coach derives or revises an insight and decides what to try next.

Cross-links: the same experiment is visible from Coach and its affected goal/action. Its history is the same memory record; source evidence is not copied into a competing feature. Shared research knowledge and personal memories retain different provenance even when the coach considers both.

### Current-code differences to address after design agreement

- Milestones currently have independent criteria/status and optional step links. The new hierarchy makes grouped work explicit. The meaning of milestone completion, action sharing and dependency logic remains to be grilled.
- The current forecast uses a selected input driver and outcome relationship. It does not yet implement a dependency-based forecast propagated through every milestone.
- The current methodology says observations/preferences do not require a test and experiments are not mandatory merely because work repeats. G02 resolves the apparent conflict: the coach chooses experimentation when behavioural observations reveal a useful learning opportunity.
- Experiments already have versioned records, proposals, reviews and evidence standing, but are currently presented primarily through Insights. Product hierarchy and discoverability need to reflect their ownership under Coach.

## G02 — resolved: observations motivate coach-selected experiments

Recommendation: every substantive new behavioural strategy should have an explicit hypothesis, expected observation and review condition. Routine coach interactions continue, review or refine an existing experiment; they do not automatically create a new experiment or alter the plan. A new or revised experiment follows a meaningful new learning question or changed strategy. Logging a fact, correcting a date or acknowledging a message need not invent a strategy to test.

Concrete scenario: during a current experiment moving reading from evenings to lunch, a report of “I read 12 pages today” contributes evidence to that experiment. It does not create another experiment merely because the coach replied.

Question: should a routine report update the current experiment rather than automatically start a new one?

User answer, 8 September 2026: an experiment is a decision for the agent based on its behavioural-science expertise. Ongoing experimentation is central. The coach continually learns about the person and execution difficulties, then uses behavioural science to suggest changes that improve action completion, milestone progress, plan adherence and goal achievement. It experiments after behavioural observations indicate an opportunity for learning.

Accepted rule: observations → opportunity for learning → the coach's research-grounded decision about whether/how to experiment. Neither every message nor every new strategy automatically creates a test. The earlier assistant recommendation of one required experiment per new strategy is superseded. Reports can add evidence to existing learning; timing, granularity and experiment design are coach judgments. This clarification resolves the prior apparent conflict with proportionate learning in the current method; the product must still make ongoing experiments central and legible.

Do not ask the user to specify individual coaching tactics or test schedules. Grilling should resolve the product's structure, visual relationships and meaningful user controls, while the agent is engineered to make scientifically grounded coaching decisions. Preserve the already agreed distinction between work completed and outcomes achieved.

Status: resolved. Only glossary and interview notes have changed; no app behavior or UI has been changed.

## Remaining design branches

The user's response to G03 prioritizes the visible information hierarchy. Resolve the goal's persistent visual frame before experiment drilldown, then return to experiment lifecycle and memory/insight authority, milestone completion and dependencies, input/outcome projection propagation, Coach interaction/experiment browsing, contextual tools and settings, first-use/empty/corrected states, mobile and comprehension checks. Keep the accepted principle that the system, not the product designer, chooses the individual user's action size and useful review timing.


## G03 — deferred: show experiments where they affect the work

Recommendation: on a goal's action/timeline, show a compact indication of the current experiment at the action it affects, such as “Testing lunch reading · Review Friday.” Selecting it opens that experiment's one canonical record under Coach, with the observation, behavioural-science rationale, hypothesis and evidence. A proposed change still shows its actual pending state and meaningful consequence. Avoid a second full experiment explanation on the goal page.

This is a product presentation decision. The agent remains responsible for deciding whether an experiment is useful and what it tests. Dates are examples, not a required weekly cycle. The representation of milestone work versus achieved result remains a subsequent visual-design branch; the truthfulness boundary is already agreed.

Question: should an active experiment appear directly on the action it affects, with its explanation opening in Coach when selected?

Status: superseded by G09's accepted experiment periods and contextual detail. The user originally redirected this question to the information hierarchy itself. G04–G08 establish that frame, and G09 resolves the experiment presentation within it. The original recommendation to navigate away to Coach is not accepted; the same record opens beside the plan and remains accessible through Coach.

## Accepted requirement — visible type and relationships

User clarification, 8 September 2026: the item's place in the hierarchy must always be clear. “Read 20 pages” alone does not establish whether it is a goal, milestone or action. The interface should show the framework through explicit labels and structure, not require interpretation of prose.

- Render the item's actual stored role; never infer its type from wording such as “Read 20 pages.” That phrase can name different entities in different plans.
- Communicate containment through layout as well as labels: selected goal → plan → milestone groups → action rows.
- A detached reference in Coach, Calendar, search or another surface needs its type and enough linked parent context to locate it. Repeating the entire hierarchy beside every row inside an already labelled group would add noise; contextual grouping can carry the shared parent labels.
- Distinguish containment from related evidence: progress describes the work and results; an experiment tests a change affecting the work. Neither becomes an invented extra child level between goal and action.
- G04 accepts an expandable hierarchy and linked timeline as the main goal screen. Exact default expansion, time scales and mobile interactions remain to be resolved.

## G04 — resolved: goal workspace frame

Recommendation: use an expandable plan outline with a timeline/progress area aligned to its milestone and action rows. Keep the selected goal and plan context visible while the user selects work. Show item detail in that workspace while preserving the parent context, instead of presenting an isolated title and a long new page. On narrow screens, preserve a compact labelled parent path above the selected detail; do not squeeze a desktop tree and inspector side by side.

Example hierarchy only: GOAL Read 30 books → PLAN → MILESTONE Finish the first book → ACTION Read 20 pages. These are illustrative entity roles, not an imposed reading plan or fixed coaching cadence. Labels, indentation and group boundaries carry different jobs. A standalone item shows its type and linked parents; meaningful state and time occupy consistent positions in the shared rows.

Question: should we make this expandable hierarchy and linked timeline the main goal screen?

User answer, 8 September 2026: yes.

Accepted: the main goal screen uses the expandable hierarchy and linked timeline. Containment is visible through nested groups and explicit type labels, time is represented beside the related work, selection preserves parent context, and references in other surfaces keep their type and linked parents. This accepts the workspace frame, not the deferred G03 behavior of navigating to Coach for experiment detail.

Status: resolved. Default expansion, time scales, chart encoding, recurrence and exact mobile interaction remain open. This is an interview decision, not authorization to begin implementation. No UI or runtime changes made.

## G05 — resolved: default expansion

Recommendation: show the known milestone headings in the plan outline and expand the actions for currently active milestones. Upcoming and completed milestones remain compact, labelled rows that can be expanded in place. This makes the current work easy to find while retaining its position within the plan and access to what comes next and what happened before.

There may be several active milestones. Adler chooses the work and planning window according to the goal and person; this display rule does not impose a fixed week, a serial-only plan or a fully specified future. Show only the future structure actually supported by the plan. Selecting an item from Coach or Calendar should reveal that item and its parent path even if its group would normally start collapsed.

Question: should this be the default when opening a goal—all milestone headings visible, with only current work expanded?

User answer, 8 September 2026: yup.

Accepted: all known milestone headings remain visible in the outline; current milestones open expanded with their actions, and upcoming/completed milestones open collapsed. Several milestones can be current. The coach determines the active work and planning period. Selecting a reference still reveals the referenced item with its parents.

Status: resolved. No UI or runtime changes made. This decision concerns initial disclosure; timeline zoom and measurement encoding remain open.

## G06 — resolved: linked time scales

Problem: placing a few days of action detail on the same visible scale as a multi-year goal makes the actionable detail illegible. Zooming to only the current work without a visible goal horizon loses the larger trajectory.

Recommendation: for a longer goal, retain a compact full-goal view in the goal header and show the current planning period enlarged beside the work hierarchy. The full-goal view highlights the interval currently being inspected. Selecting a period or milestone updates the detailed timeline while preserving the hierarchy and selection context. The coach selects the useful planning period; the interface does not impose a fixed calendar week.

- The full-goal graph uses observed outcome and conditional projection with uncertainty through the relevant horizon when supported. Target dates remain distinct from forecasts. If no numerical projection is defensible, retain meaningful goal/milestone timing and a concise reason rather than fabricating a trajectory.
- The detailed timeline makes the current actions legible. Milestones outside the selected interval keep their labelled state and known dates; a blank part of the timeline must not suggest the work has disappeared or been completed.
- These are linked views in the same goal workspace, with explicitly labelled scales. The selected interval links the two; equal screen positions on different scales must not imply equal dates.
- When the goal horizon and useful action interval are already the same, avoid a redundant second scale. Precise metric/line encoding and input-to-outcome explanations remain the next branch.

Question: for longer goals, should the screen open focused on current work, with that compact full-goal graph always visible above it?

User answer, 8 September 2026: yup.

Accepted: longer goals open focused on current work with a compact full-goal graph kept visible above. The overview highlights the inspected period; navigating to another period changes the detail without losing the hierarchy. Adler chooses the useful initial planning period, and the user can explore or zoom out. Goal-level observed progress, milestone timing and supported projections with their uncertainty remain visible in the overview.

Status: resolved. This resolves the time-scale question deferred in G01 after establishing the accepted hierarchy and expansion behavior. No UI or runtime changes made.

## G07 — resolved: measurement detail on selection

Recommendation: keep the goal's outcome graph anchored while selecting an action opens that action's input history in its contextual detail area. The action's explicit type and milestone/goal parents remain visible. Use the current inspected period for the input detail by default, with a labelled axis and unit. Do not open a separate progress page or show every action's full measurement chart simultaneously.

Examples, not coaching prescriptions:

- Goal: read 30 books. The goal graph shows reported books finished toward 30. Selecting an action measured in pages shows reported pages per configured opportunity/period, with its planned quantity distinguishable from actual work.
- Goal: earn $100k revenue. The goal graph shows reported revenue toward the target. Selecting a focus-work action measured in focused hours shows those reported hours. The interface does not imply that hours automatically produce dollars.

Existing methodological boundaries remain requirements, not questions to ask again: goal attainment and action adherence are different; the goal chart retains the target at 100% with the actual outcome unit/count clearly identified; supported projections and their scenario range extend over the goal horizon; planned time is not reported effort, missing reports are unknown, and a completed action without a measured quantity cannot supply that quantity. Current projection ranges are conditional heuristic scenarios, not calibrated confidence intervals or causal probabilities. The linked time scales remain explicitly labelled.

The presentation decision is which measurement to reveal on selection. Adler remains responsible for choosing a useful initial measurement and input–outcome relationship, with an editing path. Milestone-level completion, aggregation across different actions and outcome dependencies still need their own design decision; this proposal does not average unlike units or declare milestones complete from child checkboxes.

Question: should selecting an action open its input graph while the goal's outcome graph remains in view?

User answer, 8 September 2026: makes sense.

Accepted: selecting an action reveals its input graph while the goal outcome graph remains in view. Only the selected action's full measurement graph opens, with its hierarchy context retained. Outcome projections and their uncertainty remain attached to the goal outcome; the display does not equate performing actions with obtaining a result.

Status: resolved. No UI or runtime changes made.

## G08 — resolved: milestone progress emphasis

Question to resolve: in the milestone row, should the milestone's own success measure be primary, with completion of its contributing actions shown as separate supporting information when those measures differ?

Recommendation: lead each milestone row with evidence against its own criterion. Keep action adherence adjacent as labelled supporting evidence, rather than automatically using the percentage of child actions done as the milestone's progress. The coach defines a useful criterion for the goal and person; this display rule does not require every milestone to be an external outcome or a numerical target.

Illustrative row: MILESTONE First paying customer | Result: 0 customers (reported) | Work this period: 4/4 planned actions completed (reported). This makes the gap visible without treating completed work as a customer, or automatically diagnosing the plan as ineffective before a useful outcome observation/review. These are example reports, not business advice or a required quota.

If the milestone is defined by the work itself and its contributing reports establish that criterion, use the same evidence and avoid redundant counters or an unnecessary second user confirmation. Qualitative criteria can show an attributed state and source; missing outcome evidence stays unknown. The existing method already distinguishes input from outcome. This question concerns visual emphasis and the meaning of the milestone's main displayed progress, not whether that scientific distinction should be preserved.

Current code has a milestone criterion and independent completion state, with optional action-to-milestone links. It does not yet supply the new hierarchy's derived status or dependency-based forecast propagation. Milestone dependencies and actions supporting multiple stages remain subsequent branches.

Question: should each milestone lead with its own success measure, with action completion shown as supporting information when it differs?

User answer, 8 September 2026: agreed.

Accepted: the milestone's own success measure leads its status; contributing action completion remains separate supporting information when different. Adler defines the appropriate criterion, which can be work itself or a result. Avoid a duplicate measure when the work is the milestone's criterion. Updated the Milestone glossary definition to capture this resolved meaning.

Status: resolved. Only documentation changed; no UI or runtime changes made.

## G09 — resolved: experiment periods on the work timeline

Recommendation: show an active experiment as a labelled period on the timeline of the actions it affects, with its applicable start/change point and next review point. Selecting it opens the existing experiment record beside the plan while preserving the selected goal, milestone and action context. Coach remains the place to browse and discuss experiments across goals; both surfaces reference the same record.

The timeline makes the earlier plan, the change under test and later reviews locatable in time. The experiment is a related learning record, not an extra containment level between milestone and action. Show the selected or relevant experiment clearly without expanding every historical explanation across the timeline.

Selected detail leads with the concrete before → after change, followed by concise linked observations, the specific cited behavioural-science interpretation and the hypothesis about its effect. Actual feedback and the review decision appear when available, preserving the original prediction and earlier versions. Deeper claim/source reasoning remains inspectable from that same record. Do not present research as a decorative citation after an unsupported inference.

Existing learning boundaries remain: not every edit creates an experiment; behavioural observations motivate the coach's decision to test. A suggestion has a proposed state and cannot appear as an applied change. A planned/agreed test interval is not evidence of exposure, and a review date is not proof of success. Show event-based review conditions as such without inventing a date. Chronological before/after display does not establish that the change caused any difference. Corrections and changed measurement definitions preserve their history and comparability limits.

Question: should active experiments appear this way on the affected actions' timeline, with their details opening beside the plan?

User answer, 8 September 2026: yes.

Accepted: show active experiments as labelled periods on the affected actions' timelines, with start/change and review markers. Selecting one opens its detail beside the plan: the concrete change, linked observations, specific cited behavioural-science interpretation, hypothesis, and reported results/review decisions when available. Retain the goal and action context; Coach accesses the same record across goals.

Status: resolved. This resolves G03 using the accepted persistent hierarchy. Milestone dependencies and action sharing remain open; this question does not settle them. No UI or runtime changes made.

## G10 — resolved: quick replies for action reports in Coach

Recommendation: let Coach offer a few explicit, context-specific quick replies for a simple action report, while keeping free text available in the same conversation. Starting from an action carries its identity, parent goal/milestone, relevant occurrence/date and linked experiment context. The coach retains all-goal context; selecting an action does not create an isolated agent or a separate check-in workflow.

Illustrative report UI for ACTION Read 20 pages on the selected date: “Read 20 pages” / “Different amount” / “Didn't read,” plus the normal message composer. The first and third are explicit reports of quantity; “Different amount” opens an editable answer without submitting a guessed amount. These are examples, not a fixed intake script or universal set of buttons. Relevant choices depend on the saved action/measurement and the useful question the coach is asking.

Submitting an explicit report saves the attributable evidence through the shared service and updates the linked work and visualizations. Show a concise linked save receipt only after persistence succeeds, with a correction path. Ask for consequential missing information when needed; do not force a reflection interview after every report. A quick report can inform existing learning without automatically creating an experiment, diagnosing a barrier or changing the plan.

Preserve the distinction between a report and a proposed future action, between a reported quantity and an unspecified “done,” and between planned duration and actual effort. Context selection alone does not submit a report. No auto-sending a prefilled outcome or silently recording the planned quantity. Connected context can accelerate the report but cannot certify that work occurred.

Current goal, action and learning links already pass goal/context prompts to the Check-in route. The decision here is a lower-effort interaction inside the canonical Coach, not whether to add another reporting destination. Exact panel/mobile placement and the design of saved/proposed feedback remain subsequent branches.

Question: should Coach support these quick replies for simple reports, with free text always available?

User answer, 8 September 2026: yup.

Accepted: offer quick replies inside Coach for simple reports, with the ordinary message field always available. The coach chooses relevant replies from the action and situation; selecting an action preserves its linked goal/milestone context. Saving produces a concise, correctable receipt and updates the timeline. Follow-up questions serve useful understanding or planning rather than a fixed questionnaire.

Status: resolved. No UI or runtime changes made.

## G11 — resolved: change preview in the existing plan

Recommendation: a coaching suggestion that needs a decision can preview its concrete edits on the affected plan rows and timeline while keeping the current plan identifiable. Show explicit Current → Suggested values only for changed fields, with the affected goal/milestone/action labels. Selecting the suggestion reveals that part of the existing hierarchy, rather than making the person reconstruct the change from a new prose description.

Illustrative edit: ACTION Read 20 pages | Time: evening → after lunch. The timeline previews the proposed placement. Show other included consequences, such as changed frequency, time commitment, a supported milestone estimate or calendar movement, only when they actually belong to the proposal. The example does not prescribe lunch as a generally effective intervention.

The decision controls remain attached to the same proposal: Try this, No thanks, Discuss or Edit. The concise observation, cited behavioural-science interpretation and hypothesis stay available with that proposal; the preview supplements their explanation rather than substituting for the saved reasoning. Detailed underlying sources remain inspectable.

This is a representation of pending changes, not a new approval rule. Explicitly requested or previously authorized actions do not need repetitive confirmations. A pending preview cannot alter the active plan, overwrite historical reports, book a calendar event or indicate experiment exposure. Only supported outcome scenarios can appear in a projection preview, with their assumptions and uncertainty; changing a proposed schedule alone does not establish a better result or finish date. Applied, pending and failed effects retain their actual states.

Current proposals already expose Try this / No thanks / Discuss / Edit, with a What changes & why disclosure in LiveCoach. The new presentation decision is to make the effects inspectable in the existing goal hierarchy and timeline. Exact grouped-acceptance semantics, calendar failure recovery and mobile placement remain later branches.

Question: should a suggestion preview its changes directly on the existing plan and timeline before it is applied?

User answer, 8 September 2026: “yes, and an action always like "check/x/edit" and like "add to calendar"”.

Accepted: preview suggested edits on the affected existing plan/timeline, keeping Current and Suggested distinguishable, included consequences reviewable, and the observation/cited interpretation/hypothesis linked. The user additionally requires consistent check / x / edit / add-to-calendar controls on actions. This adds direct contextual controls to the agreed Coach quick replies; it does not create a separate coaching system or require every interaction to navigate into a chat.

Status: resolved. Exact meanings of check and x depend on whether the item is suggested, planned or a dated reportable action; G12 resolves that ambiguity before implementation. No UI or runtime changes made.

## G12 — resolved: x reports a missed action; placement remains open

Accepted requirement from the user: an action consistently exposes check / x / edit / add-to-calendar controls. Keep these in a stable position and retain the action's type and goal/milestone context. Icon-only controls would leave their effect ambiguous; use short visible labels with the icons.

Proposed meaning by state:

- Suggested action: check accepts the suggestion, x declines it, Edit changes the proposal. Neither acceptance nor calendar booking reports that the work happened.
- Today's scheduled action: check reports completion/progress, x reports that the action did not happen, Edit changes the planned action. Removing the action belongs to an explicit edit/remove operation, preserving prior reports and their history.
- Calendar: Add to calendar when unbooked; show the saved booking with a View / Reschedule path after booking, so the same action is not booked twice unintentionally. Exact acceptance/scheduling coupling for suggestions is still open.

The question specifically tests the meaning of x for a reportable action. The user's answer accepts “Didn't happen” for today's scheduled action and asks where/when the controls are seen. This resolves that ambiguity; do not treat it as a completed placement or recurring-action interaction design.

Preserve earlier reporting boundaries: a generic completion mark cannot silently invent a measured quantity or actual duration. Retain an easy partial/actual-amount reporting path and a correctable save receipt. The affected occurrence/date must be clear; reporting one instance does not complete a repeating action forever. Removing or skipping future work is a planning change, not evidence of a future miss. Exact recurring-action scope, future-state controls and calendar failure handling remain subsequent branches.

These contextual controls use the same shared records and coaching context as Coach. Where judgment is involved, the shared coach performs it. G10's quick replies remain useful inside the conversation; they are not an exclusive entry point for every routine action.

Question: for today's scheduled action, should x record “Didn't happen,” with removal handled under Edit?

User answer, 8 September 2026: “yes but when would we see these?”

Accepted: for today's scheduled action, x records “Didn't happen”; removing work is a distinct edit operation that preserves history. The user now needs the actual placement and interaction journey explained, not another isolated list of labels.

Status: resolved for the reporting/removal distinction. G13 proposes where the controls appear. No UI or runtime changes made.

## G13 — resolved with visual correction: controls belong to diagrammatic actions

Answer to the user's where/when question: the goal's plan is the primary place. Under an expanded milestone, each visible action row has its compact control strip in a consistent position. A report control identifies the date/occurrence it will update. The accepted full-goal graph and linked action timeline remain part of this workspace; this proposal adds contextual controls within that frame.

Lifecycle and other entry points:

1. When Coach proposes a new action or change, the structured suggestion shows its linked goal/milestone context and Suggested state, with Accept / Decline / Edit and the relevant calendar entry point. Its effect is previewable in the goal plan under G11. Ordinary inline mentions link to the action; they do not each expand into another full control panel.
2. Once the action is in the plan, the goal's action row is the primary place for dated reporting and action controls. For a due/reportable occurrence, use Done / Didn't happen / Edit / Add to calendar or the existing booking. Future plans are not reported as missed merely by removing or rescheduling them.
3. Selecting an Adler calendar event opens the same linked action and relevant controls. Keep the calendar grid readable rather than placing the whole toolbar inside every event.

For repeating work, reporting refers to a specific dated instance. A label such as “Today” or the selected date is visible beside the controls. The existing data already distinguishes an adaptive plan step with recurrence from dated Action records linked through stepId/occurrence; the person should not need to understand those storage terms. Default instance selection and whether repeated instances share one outline row remain to be decided; do not silently make Done complete the whole recurring behavior.

Recommendation: keep the compact strip visible on the goal's displayed action rows, without requiring a separate details page or hover. Coach and Calendar provide contextual access to the same work. Exact small-screen arrangement remains a later layout check.

Question: should inline controls on the goal's action rows be the default?

User answer, 8 September 2026: “yes but ina diagramatic way. like think about a timeline /gantt chart for example, and how it's visual. or bubbles, or squares, or something anything. just not literal text and bullet point hierarchy on screen/UI”.

Accepted: contextual controls stay attached to the action, but the action and its parent relationships must be represented visually. The preceding text-tree sketches were a misleading presentation of the intended UI and must not become a literal nested text outline. The same correction applies to earlier references to “outline,” “headings” and “rows”: their accepted purpose is visible hierarchy and disclosure, not a mandated text-tree layout.

The user's examples are invitations to use meaningful diagrammatic structure, not a requirement for a particular shape or permission to add arbitrary bubbles/cards. Spatial grouping should communicate containment; position on an axis should have a defined meaning; shape and explicit labels should distinguish actions, milestones, reports and experiments.

Status: resolved for placement and visual direction. G14 compares concrete diagrammatic treatments. No app UI or runtime changes made.

## G14 — visual design study: timeline, milestone map, calendar

Question: does the Timeline version express the goal hierarchy in the visual way the user means?

Recommendation: Timeline (A). A compact goal-outcome line graph retains the conditional projection and illustrative range. A larger date axis organizes the current work. A milestone span and enclosing bracket group the work, dated squares represent action occurrences, a separate line measures input quantity, and a labelled experiment span links the change and review period. The persistent control strip identifies the selected date and action. A source-backed experiment detail opens beside that canvas.

The shape meanings are deliberate: Gantt-like spans represent time intervals; they are not bar charts of completion. A square locates an individual planned/reported occurrence; the line graph represents the measured input. The full-goal chart represents observed outcome and conditional scenarios. Labels remain necessary, but the layout carries the relationships.

Concrete comparison artifacts:

- Interactive file: `goal-visual-prototype.html`, in this directory.
- A: Timeline, recommended · `http://localhost:8766/goal-visual-prototype.html?variant=A`.
- B: Milestone map · `?variant=B`. Connections show the example sequence; spatial distance is explicitly not elapsed time. This makes grouping strong but makes schedule comparison less direct.
- C: Action calendar · `?variant=C`. Dates contain the action occurrences, with a milestone bracket and experiment labels. This emphasizes individual dates but repeats more information.
- Screenshots: `goal-visual-A.png`, `goal-visual-B.png`, `goal-visual-C.png`, `goal-visual-experiment.png`; a narrow-screen capture is also retained for later layout review.

Prototype scope: this is an isolated, disposable design artifact in the gitignored interview directory. The user requested pre-implementation grilling, so the prototype skill's usual embedding in an app route and promotion into real code are deferred. It uses fictional data, keeps changes in browser memory, does not call the app or connected calendars, and does not require an account. No variant is chosen yet. Preserve the source/verdict as part of the eventual implementation handoff rather than treating this throwaway code as the production change.

One command to run: `python3 -m http.server 8766 --bind 127.0.0.1 --directory .context/ux-grilling`.

Checks performed: viewed all three desktop sketches; exercised date selection, explicit quantity reporting and undo, the demo calendar control, experiment detail and variant switching. Browser console had no page errors. The narrow screen keeps horizontal overflow inside the chart, but still needs a deliberate mobile composition once a desktop representation is chosen; it is not a completed mobile design. The goal projection is an illustrative fixture, not a fitted forecast, and it does not turn action reports into completed-book reports. Milestone page counts update from the explicit sample reports.

Method connection: the sketch preserves P1 monitoring and P4 factual, action-relevant feedback, with the current method's proportionality and evidence limits. The illustrative test detail uses the existing P2 implementation-intention definition/claim and its source version. The claim does not prove the personal cue is effective; the sketch retains the hypothesis and insufficient-evidence state.

Status: proposed visual language, awaiting the user's response to an actual diagram. Detailed recurrence scope, dependencies, generalization to non-quantitative goals, forecast propagation, cross-goal learning, small-screen design and the other interview branches remain open.

## G15 — timeline critique requested; A is the preferred starting direction

User answer, 8 September 2026: “I think the timeline looks good, but based on this conversation please criticize it and think through what could be some improvements/better ways to do this”.

Accepted direction: use Timeline A as the starting point for further design. This is not final acceptance of the interaction model or approval to implement unresolved choices.

Review saved in `timeline-critique.md`. It evaluates the actual desktop/mobile sketch against the accepted coaching method and G02–G14, with current first-party Progressive Disclosure, Linear Timeline and Statsig Results references. The central issues are daily interaction density; an unclear input–outcome connection; a learning period without a readily visible change/review journey; continuity of ongoing actions across milestones; ambiguous report/planned/unknown and date-range marks; and generalization to phones and more demanding goal structures.

Concrete browser evidence: on a 1440 × 900 viewport, the Done button begins at y=953; at 390 × 844, today's selected action begins at x=566, outside the initial visible chart. The prototype still responds at its local URL and has no page JavaScript errors. These findings concern the design study, not a claim that the production app has the same implementation.

Recommendation for the next consequential decision: retain one ongoing action and its learning history across milestones, associating dated work with the stage it contributes to instead of recreating the behavior each time. This refines the earlier strict tree; it is not yet agreed. Optional milestone visibility, sharing/counting semantics and dependencies remain separate unresolved choices.

Status: critique delivered for discussion; ongoing-action continuity awaits the user's answer. No prototype, app, runtime, glossary, commit or deployment changes made for this review.

## G16 — accepted: ongoing action continuity; new variants for review

User answer, 8 September 2026: “Yes please make some new variants based on your critiques”.

Accepted: an ongoing action continues across milestones with the same identity and learning history. Dated work contributes to the relevant milestone. The Plan and Action glossary definitions in CONTEXT.md now capture this refinement. Arbitrary cross-goal sharing, contribution allocation, dependencies and whether every small goal needs a visible milestone remain unresolved.

The user authorizes another prototype pass based on the critique. Three new structures are available at goal-workspace-v2.html, with ?variant=A|B|C:

- A, Connected timeline: whole-goal outlook, selected action/input evidence, dated plan lanes.
- B, Today in focus: the actionable selection and coaching adjustment sit beside the broader goal/plan.
- C, The evolving plan: a selectable learning history, aligned input evidence and dated attempts, with access to the whole-goal outlook.

All use shared in-memory fictional records. Reading, revenue and one-day examples are available through the Example selector and goal URL parameter. The reading fixture demonstrates report-driven scenario changes and advancing the milestone while preserving the action/history. Revenue retains an unknown input–outcome relationship. The one-day example adds no experiment. Learning discloses the person's reports, specific COM-B/implementation claims, tentative application, original prediction, usage evidence and review timing.

Details, links, limitations and verification are in VISUAL-PROTOTYPE-V2.md. Chrome checks cover all nine variant/example combinations at laptop and phone sizes, plus report/undo, outcome separation, milestone continuity, edits and local bookings. The old prototype remains available.

Status: new variants ready for comparison; no winner selected. Application implementation, commit/deployment and promotion of prototype code remain outside this design pass.

## G17 — resolved: C is the selected visual direction

User answer, 8 September 2026: “C is best!”

Accepted: C — The evolving plan is the chosen composition. Its chronological journey, focused input evidence and contextual action controls form the basis for the next design work. This supersedes the assistant's recommendation of A. The prototype defaults to C when no variant is supplied, and A/B remain available as comparison sources.

The decision and its limits are captured in C-DESIGN-VERDICT.md. Selection does not weaken earlier hierarchy, ongoing-action, outcome/projection or shared-coaching requirements. It also does not finalize the one-action fixture as the complete goal workspace.

Status: visual direction resolved. Preserve the prototype source and verdict separately from the application; continue the remaining design branches before production implementation.

## G18 — resolved: C's learning journey follows the whole goal

C's current example centers on one ongoing action. For goals with several actions or changes affecting more than one action, the chronological journey could follow either the whole goal or only the selected action.

Recommendation: retain the whole goal's meaningful plan changes and reviews in the journey. Selecting an event highlights the affected actions and opens the corresponding input evidence and saved reasoning. Keep ordinary quantity reports on the input timeline; do not turn every report into a new journey stage or experiment. The rest of the goal's current work should remain locatable in the same workspace.

Question: when a goal has several actions, should C's history follow the whole goal or the selected action?

User answer, 8 September 2026: “yes”.

Accepted: the chronological journey covers the whole goal's meaningful plan changes and reviews. Selecting a change highlights the affected actions and focuses their evidence and saved reasoning. Ordinary action reports remain points on the input graph rather than separate journey stages. A change involving several actions stays one linked decision, not copied histories.

Status: scope resolved. The multi-action composition must preserve the rest of the goal's current work and the existing distinction between current, proposed and historical state. This is an accepted design decision, not an implemented event-selection or filtering model.

## G19 — resolved: Insights organized by what Adler is learning

With the goal workspace's journey scope established, the next related branch is the cross-goal Insights view. Earlier accepted requirements already establish that it shows live learning, reviewed findings, research-grounded implications and links to affected plans. This question concerns its primary grouping, not whether those capabilities belong in Adler.

Current-code facts: Insights.tsx already supports an All goals / individual-goal filter. LearningDashboard.tsx groups learning records into current and past, and summarizes each record by its test change, evidence standing and review timing. The current UI is not yet a deliberate grouping of related personal learning questions across goals. Canonical records retain goal links and independent evidence states.

Recommendation: organize Insights primarily around the useful learning question or scoped finding, with goals as linked context and a filter. For example, a fictional entry “Finding a reliable time to start” could connect related observations and tests. Selecting it shows which goals each observation/test actually concerns and how the learning affects their plans. Retain the goal's own chronological journey as its local view.

Grouping related records is not evidence that the same explanation applies across goals. Preserve individual predictions, source records, conflicting results, research rationale, current versus reviewed states and explicit transfer limits. Do not create universal personality labels or merge independent tests merely because their wording is similar. The coach chooses whether a relationship is meaningful; this proposal specifies the consumer-facing organization.

Question: should Insights across goals be organized primarily by what Adler is learning about the person or by individual goal?

User answer, 8 September 2026: “yes”.

Accepted: Insights is organized primarily around learning questions and scoped findings about the person. Goals remain linked context and a filter. Related observations, tests and planning implications can be inspected together while retaining their independent records, evidence standing, research rationale and transfer limits. The goal workspace retains its local chronological journey.

Status: organization resolved. No application or prototype behavior changed for this decision.

## G20 — proposed: making competing commitments visible across goals

The next branch is the All Goals overview. Its goal rows and comparable activity visuals are already required; the unresolved issue is where the person sees whether their combined plan fits their available time. This is a product presentation decision, not a fixed coaching rule about which goal to prioritize.

Current-code facts: goals already support Focus, Maintain and Later priorities. The coaching engineering contract requires shared capacity and goal context when designing changes. These facts do not establish that the current overview presents a clear comparison of available time and planned commitments.

Recommendation: give All Goals a compact shared time-budget visual above the goal rows. On one common scale, show planned time by goal against the person's available time for the current planning period. Use existing calendar and user context, clearly identifying estimates and unknown capacity rather than requiring a setup worksheet. Calendar commitments and Adler bookings must not be counted twice. This compares time, not incompatible outcomes such as books and revenue.

When the plan does not fit, selecting the mismatch opens the shared coach's proposed adjustment with the affected goals visible. Reuse the accepted Current / Suggested preview and existing authorization; do not introduce automatic reprioritization or another mandatory approval step. The coach determines the useful adjustment using the person's goals, constraints and methodology. Routine action detail remains within its goal, and the calendar keeps its scheduling role.

Question: should All Goals show this shared time-budget visual by default, or should capacity appear only when Adler flags a conflict?

User response, 8 September 2026: “not sure what you are talking about, please make more mockups so we can evaluate”.

Status: unresolved. The abstract recommendation did not establish useful understanding. Do not treat it as acceptance of an always-visible capacity visual. The user requests visual alternatives before deciding; G21 supplies those alternatives.

## G21 — All Goals mockups for evaluating shared time and overview structure

Three interactive, disposable variants are available at `all-goals-prototype.html?variant=A|B|C`, served by the existing local prototype server. This is the All Goals study; C in this study does not replace the previously selected C goal workspace.

- A — Goals first: a compact shared-time comparison above goal rows. Each row separates recent measured work, the current milestone and the reported outcome/conditional outlook.
- B — The shared week: goals share a dated planning grid, with estimated time per day and planned/available daily totals. Detailed actions remain inside each goal. The grid is a time allocation view, not a bar chart of behavioural progress.
- C — Progress first: a goal selector beside a larger outcome graph. Shared time appears contextually when overcommitted or unknown. Reading keeps its forward scenario range; revenue has no manufactured work-to-revenue conversion or finish date.

All variants use the same three fictional goals and local overview state. Example availability can be changed between limited, ample and unknown; variant switching preserves edits. A concrete sample adjustment has a before/after comparison, preserved reports/outcomes, inspectable personal context and a scoped COM-B theory premise. Editing the source availability prevents the old suggestion from being reused automatically. No new experiment or successful result is inferred from accepting a plan change.

Opening a goal displays the existing chosen C workspace in a closable preview. It is labelled as the original C example and retains that separate prototype's fixture state; it is not connected to production or a shared live coaching service. No existing goal-workspace source was changed. This study compares overview structure and discoverability, not the still-unresolved multi-action extension to C.

Details, limits, run command and verification are in `ALL-GOALS-PROTOTYPE.md`. Screenshots include all three variants at desktop and phone widths, plus the suggested adjustment and research disclosure. Keep the source and eventual verdict with the implementation handoff once the user evaluates it.

Status: ready for visual comparison; no All Goals variant selected. Production implementation and deployment remain outside this design pass.

## G22 — A selected; plan status and streaks under review

User answer, 8 September 2026: “I like A.” A — Goals first is now the All Goals direction, complementing C — The evolving plan for individual goals. `A-OVERVIEW-VERDICT.md` captures that selection. G21's awaiting-selection status is superseded.

The user proposes making on-plan/behind/ahead more visible in the overview and within a goal, with possible streaks and a higher tier for extra progress. They ask whether the coach should adapt difficulty from a target streak rate. Their proposed streak counts days that comply with the plan, including a Wednesday with no planned work, rather than requiring an action every day.

Record these as ideas to evaluate, not accepted implementation semantics. In particular, the scientific validity of a universal target completion rate, an automatic difficulty ratchet, the treatment of missing reports and the definition of extra progress need explicit scrutiny. Review notes and a focused, fictional status illustration follow in `PLAN-STATUS-REVIEW.md` and `plan-status-prototype.html`.

Review completed: distinguish plan execution, continuity and goal outlook; the coach must use actual opportunity counts/quantities and relevant experience rather than optimizing a calendar-day streak rate. Full adherence can be appropriate, while a stretch requires a goal- and person-specific reason. The evidence on streak display is mixed; the 85% learning result is not an adherence target. The user's planned-rest-day idea is illustrated as continuity without a fabricated completed action. A miss, an unknown report and a planned day off remain visually distinct.

The small status prototype is read-only, with On plan / Above plan / Behind plan / Missing report fixtures and an inspectable Wednesday off. It does not modify the selected A/C sources or establish a general streak or difficulty policy. A's source/verdict was archived separately on `prototype/all-goals-a`, commit `7e2913644295`, with the pointer in `PROTOTYPE-ARCHIVE.md`; the working branch and index were not changed.

Recommendation for the next consequential choice: emphasize the recent on-plan record, with the current consecutive run secondary, so a missed day does not hide the prior work. Question: should the main consistency display show the current unbroken streak or the recent record, such as 18 of the last 21 days on plan? The 21-day example is not a fixed coaching cadence.

Status: A selection resolved. Status, streak prominence, reset/recovery semantics, extra-progress display and adaptation rules remain proposed for review. No production change or deployment.

## G23 — resolved: status layers into the chosen views and charts

User correction, 8 September 2026: “why we aren't using the projected actions chart view … why make a new page? … layer it on the same view instead of create net new pages and complexity.”

Accepted: keep All Goals A and individual-goal C. Put status beside the goal's existing input history and within its existing goal header; retain the selected timeline, chronological learning journey, action controls, outcome forecast and scenario range. The estimate and status entry points open the same C view. Do not introduce a competing cumulative graph, status destination or additional navigation concept. This supersedes the standalone visual in G22.

The disposable prototypes now illustrate that correction. C marks planned days off in the existing action lane. Shared local reports keep A's row and embedded C's status, outcome and estimate coherent across edits and reopening; these are not production records. The former status URL redirects to C.

Plan-adherence status and goal-outcome forecast remain different readings of the same plan and evidence, visibly labelled rather than collapsed into one unexplained score. The demonstration uses the closed scheduled opportunities in these examples. It does not settle the open question of streak prominence, reset/recovery, weekly contracts, pauses or difficulty adaptation. A missed commitment and an unknown report retain different meanings; rest creates no fake work or revenue.

Status: placement and continuity resolved by explicit user correction. Mechanics remain open. No production change or deployment.

## G24 — status must show its comparison on the visual

User correction: “it needs to be a bit more insightful on the visual not just random text. what is ‘behind plan’ and how do we see it?”

Requirement: a status label must be grounded in an immediately visible comparison, its quantities and dates. The current prototype replaces the added text-only goal-header status with layers on the chosen charts. In the reading example, 100 pages were planned across five closed sessions and 60 reported; the existing per-day plot shades the difference and marks −12, −20 and −8 on the affected reports. A uses the same treatment in its existing row chart. Clicking or keyboard-activating a report in C selects that date and its existing controls.

The current streak is now aligned to the action dates in the existing timeline, including hollow marks for planned days off within an intact run. The existing outcome projection keeps its broad scenario range and now marks the target and estimated finish with a bracket on the time axis. It compares those dates; it does not claim the observed shortfall caused the forecast shift or invent a revenue conversion.

Arithmetic scope: compare the selected action's units against the relevant targets through the closed cutoff. Do not add pages to minutes, treat an unreported opportunity as zero, shade days off as missed work, or let extra quantity erase a missed daily commitment. With missing reports, the known-quantity comparison explicitly uses reported days; missingness stays visible. Future actions are “Not due yet,” never a zero-of-zero success.

Framework connection: P1 (monitoring) and P4 (information about the task rather than an evaluative label), with `docs/research/deep/feedback-and-progress.md` §1, motivate inspectable task feedback. The synthesis grades the research base A, but this particular visual is a design judgment with untested transfer; its quantity comparisons are arithmetic, not behavioural inference. No new scientific claim, coaching recommendation, experiment result or difficulty policy is inferred by the UI.

Verified in Chrome: selection by mouse and keyboard, edited and cleared reports, undo, mixed extra/shortfall quantities, rest-day continuity, shared A/C state and reopening; goal forecast range preserved; revenue has no fabricated finish; one-day work is not a recurring streak or prematurely met target. All three goal examples inspected at 1440 and 390 pixels without page overflow or JavaScript errors. Screenshots: `visual-gap-A-*`, `visual-gap-C-*`, `visual-gap-open-C-*`.

Status: requirement recorded; this integrated visual is the next illustration for user evaluation. No new page, production source, deployment or universal streak policy.

## G25 — flame count and progress tied to a useful implication

User accepts the visual gap direction and asks for a flame/count streak. They also require that information show its purpose: how work affects a milestone/goal trajectory, or what other useful implication follows.

The selected A and C examples now share a custom flame/count emblem. It has a restrained warm gradient and subtle motion, respects reduced motion, and reads the same run calculation as before. Planned rest days retain their existing treatment. Missing evidence displays a muted flame with “?” instead of inventing a count; one-day work has no recurring streak. This is a presentation change, not a new difficulty/reward policy.

The former generic input→milestone footer now compares a supported near-term implication. For the current reading example, the same remaining 100 pages imply 15 September at 100 pages/week (the upcoming plan) or 20 September at 60 pages/week (the reported-day mean), approximately five calendar days later. The 17–25 September range retains the earlier ±30% pace scenario. These are two conditional futures from the same current state, not a saved old forecast and a new forecast, a causal effect of a miss, or a promised completion date. The existing long-term outcome projection and scenario band remain in place.

“Review with Coach” opens the same existing coach interface, where a real implementation would use reports, user context and the methodology to decide whether to hold, adjust support, revisit the timeline or seek useful evidence. A number alone does not identify a behavioural mechanism. The revenue example keeps the unknown work→revenue relationship explicit and routes to reviewing work alongside results. The one-day example leads to confirmation of its actual result. This prototype does not run the coaching harness or manufacture a new recommendation/test.

The governing product principles now record the accepted purpose requirement: progress should make an implication and useful decision clear; a streak or completion score is not the objective to maximize. Method connection remains P1/P4 informative task feedback and the Define/Observe/Understand/Design/Learn separation. No efficacy claim is made for this visual.

Chrome checks at 1440 and 390 pixels: shared flame counts, report edits, unchanged book outcome, changed scenario dates, undo, rest-day continuity, missing-report state, reduced motion, canonical coach entry, revenue without a fabricated forecast, no one-day streak, preserved projection band, and no horizontal overflow or JavaScript errors. Captures: `flame-impact-A-{1440|390}.png` and `flame-impact-C-{1440|390}.png`.

Status: requested illustration updated; the explicit purpose principle is saved. Production implementation and remaining streak-policy decisions are still outside this prototype pass.

## G26 — inline flame and review of both selected views

User asks to remove the streak outline/container, place flame and count inline with the title, and critique both All Goals and the goal view for intuitive user value.

The requested styling/placement is complete in A and C. Flame and count sit beside the goal title without a border, background, padding or pill. The duplicate count beneath the graph is removed; the dated streak lane remains. Unknown/one-day states and the underlying counter are unchanged. Browser inspection at 1440 and 390 pixels confirmed placement and styling; a report correction updated both titles' counts, with one flame in the opened goal.

The substantive review is `GOAL-VIEWS-CRITIQUE.md`. Its priorities are: make the entire current plan and historical/current context reliable; connect reported work, the supported implication and next decision within the existing view; compress A's capacity/metadata; give mobile the same coherent reading order. Preserve the selected A rows, C journey, original input/projection graphs, uncertainty and single Coach. Recommendations remain proposals, not silent implementation.

Concrete findings include hidden secondary actions in C, a historical stage heading retaining today's live controls, the milestone implication below the first viewport, a large capacity panel even when ample, repeated copy, inconsistent period visibility, and the need to distinguish hypothetical pace comparisons from saved forecast changes. The review includes the simpler one-day case and the unknown revenue relationship, not just the reading example.

Current screenshots use `title-flame-*`; additional evidence is in `audit-C-historical-1440.png` and `audit-A-ample-1440.png`. The review draws on the owned method/research, the prior Statsig/Linear brief and retrieved primary NN/G guidance. It reports observed interface facts and design judgments, not measured usability or coaching efficacy. No production change, deployment or new page.

## G27 — proposed: concrete next iteration of the selected views

User asks what changes to make based on the critique. `GOAL-VIEWS-NEXT-ITERATION.md` records the proposal: compact All Goals capacity and metadata; give each row a meaningful milestone/outlook; orient Goal C around its current milestone and visible action lanes; connect the existing input and outcome graphs to their implications; put contextual controls and Coach entry beside the evidence; and retain the evolving plan with inspectable, version-correct learning history.

The implementation order starts with hidden actions and historical/current state correctness, then Goal C composition, All Goals compression, and shared mobile/scenario verification. Conditional pace scenarios must not appear as saved forecast changes, and unknown outcome relationships must remain unknown. The existing A/C choices, original charts and projection range, inline flame, goal hierarchy and one Coach remain the basis.

Status: proposal saved for review, not user-approved implementation. No prototype or production source changed in this step; no new page or deployment.

## G28 — six changes accepted; further product and science review

User accepts all six changes in G27, then asks for a further product-vision and behavioural-science pass working together. The accepted A/C iteration remains the baseline; implementation is not the requested action in this turn.

The second-pass design is `docs/product-coaching-second-pass.md`, supported by a separate source-based review in `docs/research/coaching-product-evidence-review.md`. It centers two distinct learning questions: what helps the person do meaningful work in their circumstances, and whether that work moves the intended outcome. Proposed refinements address decision-relevant experimentation, review cadence, informative successes and maintenance, evidence-appropriate forecast prominence, reporting burden, cross-goal capacity and evaluation of actual coaching benefit.

Concrete inspected runtime limitations include date-derived “Trying now” without established use, fixed complete-week pace heuristics, a single driver action and an early learned date from one usable positive input–outcome interval. Existing source grounding, current-policy overrides, learning records, semantic review and projection safeguards are acknowledged rather than proposed as a new system. The source review also records a narrower correction to a streak-research summary; no blanket streak policy is inferred.

Status: original six changes accepted. Additional recommendations are proposals for review. Documentation only; no new prototype variant, production code, deployment or branch change.

## G29 — second pass accepted; integrated A/C prototype

User accepts the complete second pass and asks what comes next. The next step is a concrete interactive illustration in the already selected A/C surfaces. `docs/product-coaching-second-pass.md` is now marked accepted and linked from the governing product principles. The evidence memo retains its methodological limits; user acceptance does not strengthen a research finding.

`INTEGRATED-PROTOTYPE.md` records the updated composition, walkthrough, checks and limits. The prototype compacts capacity/overview rows, puts the current milestone above visible action lanes, retains the input and full outcome graphs, exposes the earlier plan with correctly scoped controls, and connects explicit reported use and a practical keep decision to the evolving-plan history. Report corrections preserve that decision while flagging its evidence for review. Both views use the same milestone dates; the mobile graph includes the actual shortfall period. One-day work has no empty charts; revenue has no fabricated outcome history or finish.

The source remains a disposable, in-memory example. It does not invoke the shared coach or implement the new production forecasting/evaluation requirements; the capacity-allocation fixture remains separate from action quantity edits. The exact revised rendering is ready for visual feedback, while the A/C direction and underlying requirements are already agreed.

Verified at 1440px and 390px across reading, revenue and one-day work, including current/history selection, secondary actions, reports, missingness, review choice/correction, saved edits, booking and overview reopening. No JavaScript errors, invalid SVG coordinates or page overflow were observed. These checks do not establish user comprehension or coaching effectiveness. No production merge or deployment.

## G30 — daily activity record beside the existing graph

**Superseded by G31: user rejected the Goal C calendar placement and added complexity.**

User responds positively to the integrated prototype, suggests a GitHub-like streak grid on the graph's left, and asks what else could improve. The refinement is mounted in Goal C's existing input section, reachable from All Goals A. It replaces C's thin duplicate streak lane, keeps the title flame and original graphs, and links dated cells to the existing report/plan selection. The month contains actual fictional reports and separate planned/rest/unknown states; it does not manufacture longer history or a new completion score. Mobile collapses the calendar initially.

`ACTIVITY-GRID.md` records the question, semantics, source connection and checks at four widths, including corrections, keyboard navigation, shared overview reopening, multi-action days and one-day exclusion. The original illustrative streak policy is preserved, not scientifically validated. This exact rendering awaits feedback. The suggested next improvements are linked period controls, directly inspectable plan-change markers and an in-place preview of plan-edit consequences where supportable. No production merge or deployment.

## G31 — activity grid belongs only in All Goals

The user explicitly rejects G30's goal-detail calendar as cluttered and clarifies that the reference is the compact grid already shown in the landing-page All Goals table (`.context/attachments/AZewlk/image.png`). Restore the prior goal-detail source and apply the reference only to All Goals A: one small activity grid plus one completion/report summary per goal, left of the existing graph. No month controls, legend, day inspector, or extra panel.

`OVERVIEW-ACTIVITY.md` records the corrected implementation and checks. The grid matches the actual landing-capture component and uses the existing local reports. Keep the scope precise; G30's proposed expansions are not accepted follow-up work. The current iteration is a local prototype, not a production release.

## G32 — corrected overview accepted; return to the original structure grilling

User: “looks good okay what eelse do we need to do back to the original grilling and decisions we made earlier in the chat around structure,etc”. G31's corrected overview rendering is accepted. The user asks to resume the broader structure work, not to add another goal-view variant or deploy the prototype.

`docs/product-structure-status.md` reconciles resolved decisions, prototype illustrations, existing production capabilities and remaining work. The older implementation checklist now identifies its pre-grilling scope. The governing principles explicitly preserve the All Goals-only activity treatment. No production source was changed in this audit.

Next proposed question concerns Coach's placement from a goal: conversation beside the plan on desktop, full workspace from navigation, and an explicit return to selected work on mobile. Shared conversation/context is already required; exact presentation remains a decision for the user. Then continue Insights/experiment interactions and a complete first-goal/report/proposal/review journey, resolving milestone and edit/recovery rules as needed. Do not ask the user to choose individual coaching tactics or numerical research thresholds.

## G33 — contextual Coach placement accepted

The user's “ok” follows the question about Coach's contextual placement, then authorizes committing/pushing the reference work to main and asks to continue the grilling. Record the placement as agreed: Coach opens beside the selected goal plan on desktop, with the action/timeline retained; Coach from navigation opens its full workspace; mobile keeps a clear return to the same selected work. These share the same conversation, memory and authoritative records.

The next unresolved presentation question is whether Conversation and Insights are two views inside Coach. Recommendation: yes, with active experiments and scoped findings visible in the accepted question-first Insights organization. This does not revisit the agreed ownership or introduce a separate experiment-administration destination. No answer to this next question has been recorded yet.
