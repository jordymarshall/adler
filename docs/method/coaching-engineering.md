# Engineering the Adler Method

Target design · 7 September 2026 · implementation has not begun

This is the deliberate implementation design for the user's [governing product direction](../product-principles.md). Read it with the [current runtime contract](adler-method.md), [domain language](../../CONTEXT.md), [experience plan](../product-core-and-experience-plan.md), [research-grounding design](../research/coaching-grounding-engineering.md) and [individual-learning methodology](../research/individual-learning-methodology.md). The product direction is accepted; proposed interface names, storage details and advanced statistical capabilities below are not assertions about delivered code.

## 1. What the best version must accomplish

The person receives a useful next step, understands its short reason, and can inspect why Adler thinks it fits. Behind that simplicity, Adler must build and maintain an explicit account of what it knows, what it suspects, which scientific ideas inform the suspicion, how it will learn, and what each new observation changes.

The system should be able to make a good practical decision with incomplete information while stating exactly what remains uncertain. It can continue a helpful adjustment without proving its mechanism, ask a question instead of recommending a technique, or leave a working plan alone. More frequent adaptation, more data collection and longer explanations are not inherently better.

The implementation has four obligations:

1. **Ground the inference:** specific research premises plus attributable personal evidence and a defensible application.
2. **Choose useful work and learning:** fit the goal, available opportunity, burden, feedback timing and user's chosen direction.
3. **Maintain truthful state:** observations, hypotheses, tests, proposals, actions and outcomes remain distinct across time and interfaces.
4. **Make it understandable:** one concise decision, accurate state, practical control and direct access to evidence.

These obligations are release criteria. A persuasive answer with a citation, or a model that passes a schema, is insufficient.

## 2. The scientific reasoning that the system must preserve

### 2.1 Separate four links

For a behavioural adjustment, distinguish:

**Support introduced → proposed mechanism → controllable behaviour → goal outcome.**

For example: placing a book beside lunch → noticing an available cue / easier starting → pages actually read → books actually finished. Each link can have different evidence, delay and uncertainty. The structure is informed by SOBC and CLIMBR's separation of engaging a mechanism from showing its relation to behaviour; this is an application of methodological guidance, not proof of the example's mechanism. [SOBC](https://pmc.ncbi.nlm.nih.gov/articles/PMC4656226/), [CLIMBR](https://pmc.ncbi.nlm.nih.gov/articles/PMC10279971/).

If the person reports more pages but never reports noticing or using the cue, Adler can record the behaviour change while leaving the mechanism unmeasured. It must not invent a mediator to complete the explanation. Ask about the mechanism only when the answer would change a useful decision; ordinary chat is not a validated psychological assay.

### 2.2 Distinguish the roles of research

The full P1–P36 synthesis remains the common framework. Extend it with precise, versioned evidence records rather than treating every paragraph as one verified fact.

| Role | Example of legitimate use | Required restraint |
| --- | --- | --- |
| Theory / framework concept | COM-B's opportunity concept informs examination of a lost work window. | It does not establish that a reminder, morning slot or the entire app is effective. |
| Technique definition | Specify an action cue precisely enough that the support can be recognized later. | Membership in a technique taxonomy is not efficacy evidence. |
| Empirical finding | Support a scoped statement about a studied technique, comparison and outcome. | Preserve population, setting, uncertainty and contrary results; an effect does not establish its mediator. |
| Personal observation | The person reported two displaced sessions and an alternative free window. | Attribute the account; do not diagnose motivation or verify completion from a calendar. |
| Personal synthesis | A feasible window may address this reported opportunity problem. | Label it tentative and retain plausible alternatives. |
| Product heuristic | Choose a workable observation window or provisional dose. | Record why it is reasonable here; do not present it as a scientifically optimal number. |

The original COM-B paper supports a framework for understanding and designing interventions, rather than an efficacy claim for any resulting adjustment. This distinction must survive into the model's evidence types and tests. [Original paper](https://doi.org/10.1186/1748-5908-6-42).

### 2.3 Curate the claims the coach relies on

An evidence record retains a stable claim ID/version, atomic statement, role, framework construct, P IDs, primary source, exact passage locator or faithful scoped excerpt, access level, source/content version, research grade, population/task/comparison/outcome, limitations, conflicts and review status.

Preserve the repository's evidence grades and their meanings. A quoted effect magnitude, theory, extrapolation and operational threshold must not share one undifferentiated grade. Where a research summary combines them, separate the claims before making them executable evidence. Do not reuse the synthesis's historical numerical defaults as universal rules.

Curated claims are the stable starting point. Use bounded primary-source retrieval when an important question of fit, conflict or freshness remains unresolved. A dynamic source is a candidate with its actual access level; an abstract cannot establish details it does not contain. Search only the mechanism or task information needed, not private user narratives. Loading a summary is not a new literature review.

Research review is an owned internal quality process. Models may assist extraction and checking, but a model's self-approval does not turn an extracted statement into scientific authority. Record review provenance, qualify disputed claims, and make withdrawn/superseded evidence ineligible for new authoritative use. Identify decisions that depend on changed evidence for reconsideration.

### 2.4 Bind each inference to its premises

Extend the existing behavioural rationale with claim-level references. Each interpretation identifies the personal observation revisions, specific concepts/findings, how they support or motivate the interpretation, relevant limits and expected observation. Each recommendation references that interpretation and the exact change it justifies.

Evidence relationships need to distinguish **supports, defines, motivates, limits and contradicts**. A theoretical concept can motivate a personal hypothesis without entailing its truth. A valid source ID alone cannot satisfy this contract.

Save the reviewed rationale once with an immutable decision revision. Hypotheses, tests, proposals, chat segments and UI citations reference it. Store an inspectable explanation of the decision, not private model chain-of-thought or an invented retrospective narrative.

## 3. One shared execution path

Deepen the existing `Service` module rather than adding parallel coaches. Its interface accepts a user's message, a typed app intent, an exact command or an attributed event. Each request includes identity, request ID, relevant record references, conversation focus and applicable authorization. These are conceptual contract requirements; exact TypeScript names follow the implementation slice.

The module owns the research instructions, model-stage policy, context assembly, shared tools, scientific review, learning transitions, commands, proposals and outcome calculations. Web, text and MCP are adapters. They vary presentation and input form while using the same capabilities for the same authenticated user.

| Step | How it works | What makes it verifiable |
| --- | --- | --- |
| 1. Establish the request | Distinguish a report, exact edit, question, recommendation request, review or external context. | Origin and authority are typed; an external event cannot be admitted as a user report by its text prefix. |
| 2. Assemble current context | Load goal definitions, capacity across goals, current plans, active hypotheses/tests, pending decisions, relevant reports and source revisions. | Save which records and evidence versions informed the decision. Active tests cannot disappear because they are outside recent-chat history. |
| 3. Define and observe | Establish chosen work, outcome meaning, constraints and what the reports support. | Unknown facts remain explicit. A question is needed only if its answer changes the next useful choice. |
| 4. Understand | Examine relevant research constructs and plausible explanations, including setup and structural constraints. | Personal premises and methodological support are linked; uncertainty and contrary evidence are retained. |
| 5. Select | Compare a useful support with reasonable alternatives, including hold, clarify or pause. | Explain fit, feasibility and why the selected option addresses the reported problem. Do not invent domain strategy. |
| 6. Design | Specify action/support, measurement meaning, cycle, test if useful, original prediction and review rule. | Preview actual occurrences, dependencies, capacity, proposal and calendar consequences with deterministic tools. |
| 7. Verify | Check identities, permissions, evidence roles and compatibility; then review source support, personal application, test utility and outgoing wording. | Failures identify the claim or command and the reason; advice-only recommendations receive the same review. |
| 8. Persist and present | Recheck relevant state revisions, save the valid decision/test/proposal and present a short result with links. | The visible reason and current state refer to what was actually evaluated and saved. |
| 9. Learn | Attach eligible new reports to the existing test and review when a useful trigger occurs. | Compare with the original prediction; revise through a new decision instead of rewriting the past. |

These are logical stages, not a requirement for nine model calls or nine agents. Deterministic checks handle facts they can establish. Exact user edits and unambiguous reports need proportionate processing; substantive inference receives the heavier research and review path. Preserve a valid authorized report if optional advice later fails.

Use bounded retrieval and repair. If a candidate remains unsupported, return a useful clarification or limited next step rather than manufacture evidence. Measure unnecessary abstention and questions alongside incorrect advice. Scientific fidelity must not make simple reporting unusable.

The internal tool catalog is shared: read current state/research, inspect evidence, preview feasible work, manage learning records, calculate supported projections and prepare/apply authorized commands. A host AI using MCP asks Adler to think; it cannot present its own raw record edit as a scientifically validated Adler recommendation.

Every write respects current revisions and stable request identity. Equivalent requests across channels must produce compatible domain outcomes and permissions; exact generated wording need not be identical. A repeated confirmation cannot duplicate a trial or booking. Contextual UI controls carry the same goal, test and decision references as conversational requests.

## 4. Choose action size, cycles and learning for the actual goal

### 4.1 Work backward without inventing expertise

Establish the user's outcome and chosen work. Identify a controllable behaviour or a needed clarification about that work. Select behavioural support for execution, learning or opportunity. Keep the uncertain connection to the ultimate result visible.

If the user wants revenue but has not chosen an approach, ask what work they intend to pursue or help define a learning objective. The coach's behavioural research does not determine acquisition channels, rocket design, professional strategy or an optimal revenue-producing quota.

Choose action size based on meaningful output, actual opportunity, necessary duration, dependencies, prior reports and available capacity across goals. A task must remain worth doing. A fallback that raises completion while reducing meaningful work is not automatically an improvement. Structural change, maintaining a practice and developing a skill can require different supports.

### 4.2 Keep the time horizons separate

The system records the goal's deadline flexibility, the window of concrete commitments, relevant opportunities to try a change, earliest informative feedback and next review. These distinctions apply the method's flexible cycles and JITAI's separation of decision points and near/far outcomes. [JITAI design principles](https://pmc.ncbi.nlm.nih.gov/articles/PMC5364076/).

Plan concrete work only as far as circumstances and capacity make it useful. Keep later possibilities provisional. Review when an informative report arrives, the selected review date occurs, the context changes or the user asks. An early feasibility review can happen while an outcome with a longer delay remains pending.

The coach must record why a cycle or review condition fits this case. It cannot treat a daily habit, one-off task, month-long campaign and year-long outcome as variations of the same weekly script.

### 4.3 Select the least burdensome adequate learning design

| Design | When to use it | Permitted learning |
| --- | --- | --- |
| Observation / clarification | The decision lacks a useful fact, or a preference directly settles it. | Better context; no intervention-effect claim. |
| Prospective change with follow-up | A reasonable change is useful now and comparison is impractical. | What was used, what followed, perceived usefulness and a practical keep/change decision. Attribution stays uncertain. |
| Planned repeated comparison | Comparable opportunities and acceptable alternatives exist. | A scoped descriptive comparison, accounting for differences and missingness. Repetition alone does not remove confounding. |
| Designed individual experiment | The particular question, assignment, repeatable measures and analysis support it. | Only the inference the implemented design can justify. Formal experimental capabilities need separate validation. |

This is not a ladder every user must climb. A reversible cue comparison differs from learning a skill that persists or installing a structural change. Carryover, feedback delay, time dependence and context drift are distinct issues. Do not force withdrawal/crossover, call unrelated goals independent baselines or randomize ordinary coaching without an understood, appropriate design. The [individual-learning research](../research/individual-learning-methodology.md) gives source-backed design conditions.

### 4.4 Apply the method at the level being changed

| Route and example | What the coach supports | Useful evidence and review | What it must not infer |
| --- | --- | --- | --- |
| Habit: reading more often | A feasible opportunity, cue or setup and a meaningful amount. | Relevant cue opportunities, reported starts/amount, effort and later books finished. | Attendance proves automaticity, or pages prove a completed book. |
| Session/skill: draft a portfolio or study | Starting, useful finish criteria, practice structure and task-relevant feedback. | Actual work/output, task difficulty, quality or delayed retention when relevant. | More minutes prove mastery, or learning can be washed out by waiting a fixed time. |
| Structural: protect a regular work window | Establish a chosen arrangement and verify it remains usable. | Installation, first relevant use and changed constraints. | A persistent arrangement needs fabricated daily completions. |
| Campaign: applications or revenue | Execute user-chosen steps within capacity and inspect delayed responses. | Actions and exposure dates; separately observed responses/results and concurrent changes. | Rejection means poor adherence, or hours caused the recorded revenue. |
| Dyadic/uncertain: a difficult conversation | Clarify the person's controllable action and chosen scope. | Their account of the interaction and what is within their control next. | Another person's response is an action target controlled by the user. |

A campaign can contain sessions or structural supports. Select the learning design for the particular change; route labels are not fixed personality categories.

## 5. Persist hypotheses, tests and evidence deliberately

Use the current versioned workspace and command infrastructure as the starting point. Typed records and explicit references are sufficient; a graph database, new vector store or full event-sourcing rewrite is not required by the design.

| Record | Essential content |
| --- | --- |
| Observation revision | Origin/confirmation, occurrence and report times, goal/action context, measurement definition and quantity, source version, correction/removal lineage. |
| Decision revision | Intent, state/evidence versions, grounded claims, alternatives and rationale, selected action, validation/review findings, framework/model policy version and resulting commands. |
| Hypothesis revision | Stable identity, original/relevant goals, scoped explanation, supporting/conflicting evidence, mechanism and prediction, limitations and current standing. |
| Test | Exact hypothesis/decision revision, proposed change and agreement/authorization state, actions and measurement versions, design, prospective comparison/prediction, opportunities/exposure definition, feedback delay, review rule, state and related reports. |
| Review | What was actually tried, interpretable results, missingness/confounds, evidence relative to the prediction, practical decision, revised hypothesis or next question. |

Fields can be explicitly unknown where information is unavailable. Required structure must not create pressure to invent a baseline, mechanism measure, comparison or formal experiment. Accepted historical records remain readable without fabricating missing dates or backdating predictions.

### 5.1 Keep workflow and scientific standing separate

Test workflow includes suggested, agreed/waiting, active, ready for review, reviewed, paused and stopped. Hypothesis standing describes evidence: untested, insufficient, consistent so far, mixed, inconsistent in the tested context or needing reconsideration. A pragmatic choice to keep using a change is a separate decision.

An active test window does not prove exposure. Distinguish the support being agreed, a relevant opportunity occurring, the support actually being used, the behaviour happening and the outcome arriving. A reported miss is an observation; an unreported opportunity remains unknown. If a change was never used, review feasibility rather than declaring its mechanism ineffective.

The visible timeline can show planned start, reported attempts and next review. The date can trigger review even with no reports; its result may be insufficient information. Evidence requirements and goal meaning determine conclusions, not the timer.

### 5.2 Preserve prospective predictions and contrary evidence

Save the prediction, comparison and review rule before evaluating new feedback. If feedback produces a new hypothesis, label it exploratory and save a new revision. Do not count the same observations as both generating and independently confirming the new explanation.

Retain missing and difficult periods, identifying exclusions and why comparison may be limited. Do not quietly delete travel weeks, refunds or zero-input revenue to improve the apparent relationship. Several changes may be necessary for a useful plan; then review the bundle and avoid attributing its result to one component.

A report, an observation and an exposure are different units. One check-in can describe several attempts; several channel reports can describe the same attempt. Preserve each report's provenance while linking accounts of the same real-world occurrence so they do not multiply exposure. Retain explicitly reported aggregate counts without inventing individual dates or details. Prefer explicit occurrence/report references and confirmation when equivalence is uncertain; do not collapse genuinely separate attempts because their text matches.

### 5.3 Make correction change current authority

A material source correction, removed observation, changed measurement, withdrawn research claim or changed context marks dependent decisions/tests for reconsideration. Preserve the old rationale as historical, with unavailable source content removed where required. Do not silently rewrite the old evidence or keep presenting the old inference as current.

Change the smallest affected portion. Editing a typo should not erase valid learning. Moving a cue can preserve the quantity measure while changing the question about timing. Listening instead of reading cannot retain a pages-based comparison. Correction should be cheap for the user and reliable across all interfaces.

Cross-goal use records why the mechanism and context may transfer, plus the original evidence. It can motivate a new application without creating a global personal rule. Stable useful routines can receive lighter observation; the system need not maintain an endless stream of experiments.

## 6. Review with a disciplined method

The Learn gate follows the same order whenever it evaluates a test:

1. Establish whether the change was used and which opportunities occurred.
2. Establish whether feedback is available, attributable and comparable.
3. Examine mechanism evidence, behaviour and ultimate outcome separately.
4. Consider task/context changes, other interventions, reporting changes and alternatives.
5. Decide keep, adjust, clarify, pause or close on the available evidence and user preference.
6. State what remains uncertain and the next useful question, if one remains worth pursuing.

Use a qualitative value-of-information check before requesting more data: which plausible answer would change the recommendation, how much that matters, whether the answer can arrive in time, and whether the effort is justified. This is an explicitly labelled engineering heuristic informed by the methodology, not a computed optimal information-gain score.

For example, two successful writing sessions can support continuing a low-burden arrangement the user liked while leaving its causal explanation tentative. If the available window disappears again, the result concerns feasibility. If the window stays open but work never starts, inspect another reported barrier. If output rises but the finish criterion changed, compare meaningful output and burden rather than announcing a higher success rate.

## 7. Keep projection inference distinct

The deterministic projection tool returns observed outcome/date, comparable input evidence, assumptions, scenario marks/range, relevant coverage and any missing information. UI and coach prose consume the same result; the language model does not invent a finish date.

Direct relationships such as pages and known book lengths support conditional arithmetic. Learned input–outcome relationships need explicit comparable periods, units, lag and assumptions. Revenue per logged hour is descriptive and can omit other causes; it is not an estimated causal return.

Repair the audited missingness, stale-origin, incompatible-measure and collapsed-range issues as part of the shared evidence work. A desired future with no defensible outcome model still has actionable planning, input monitoring and review. Preserve unknown states and distinguish goal commitments from scenarios.

A more capable forecasting model is a separate research and engineering track. Before showing calibrated intervals or probabilities, specify the goal family, data-generating assumptions, measurement error, missingness, delays, context change and validation population; compare against simple baselines using future-held-out data and check calibration. Several identical observations must never become certainty merely because a range formula collapses.

Formal individual experiments, hierarchical learning or adaptive policies can be developed where they are justified. They require design-specific analysis, meaningful outcome measures, suitable data and prospective evaluation. Their sophistication does not remove the gap between population evidence and personal response. Build them when they improve decisions demonstrably; do not imply them through graph styling or confidence badges.

## 8. Make the simple explanation traceable

A pending recommendation can say “Try writing after breakfast,” with accept/decline/discuss/edit controls where a decision is needed. Already-authorized or applied changes show their actual state and appropriate correction controls. Three short rows show the observation, behavioural interpretation and expected effect. The interpretation always links to the particular construct/claim and source used. A label such as “Action cues · P2” is meaningful only when it opens the specific supported claim, its application and limits.

The first expansion answers what the person reported, what scientific idea informs the interpretation, why it fits and what would change the decision. Deeper evidence shows source material, grade, study context, theory versus empirical role, versions, alternatives and history. Avoid chains of empty accordions or generic science badges.

Render the main recommendation from the reviewed claim or bind its exact message segment to the saved claim. Review the actual outgoing wording so “may help” cannot become “we know this works” outside the structured record. Every interface links to that decision and current test; it does not generate a new explanation from generic method labels.

Onboarding can show a provisional starting step without fabricated personal insight. Today exposes the next useful action. Insights shows attributable observations and preferences alongside current hypotheses/tests and reviewed implications, with their status clear. Useful context or an insight does not require an invented hypothesis or test to appear. The landing page demonstrates those same product states in a fictional example, with a readable first frame and optional depth. This unifies product understanding and scientific disclosure.

### Worked decision: a writing window that keeps disappearing

Fictional inputs: the person says meetings displaced two writing sessions, has already chosen the editing work, and identifies Friday at 8:30 as an available 20-minute window. The coach should produce a simple recommendation with inspectable premises:

> **Try your writing session Friday at 8:30.**
>
> **Observation:** Meetings displaced both sessions. You said Friday morning is available.
>
> **Behavioural science:** The available window may be the obstacle. [COM-B: physical opportunity](https://doi.org/10.1186/1748-5908-6-42)
>
> **What we're testing:** Whether having that time available helps you get started.

Behind it, save the two report revisions, the user's stated availability, the specific COM-B concept and relevant P24/P10 principles, the tentative application and the unchanged chosen work. The paper supplies the opportunity concept; the user's report supplies Friday and 20 minutes. Neither is evidence that morning writing is universally better or that this change increases output by a particular amount.

Before presentation, deterministic preview checks the actual proposed slot and shared capacity. Semantic review rejects any added claim about motivation, productivity magnitude or universal morning preference. The saved test references the proposal and its current agreement state; agreement is not a completed attempt. If the user has already explicitly requested this exact move, process it as their authorized edit instead of asking them to approve an unsolicited coaching recommendation again.

After the relevant opportunity, a useful update distinguishes whether the window remained available, whether the chosen work started and what was produced. If another meeting displaced it, review feasibility. If it remained free but starting was difficult, the initial explanation is incomplete. If work happened, continuing may be reasonable while the causal interpretation stays tentative. The next review and Insights view read this same test and evidence; no interface invents a separate conclusion.

## 9. Verify the implementation at several distinct levels

The system must be tested where it can fail, not merely where it can return valid JSON. The [grounding research](../research/coaching-grounding-engineering.md) contains 20 adversarial cases and current test locations; the [learning research](../research/individual-learning-methodology.md) contains additional goal-specific cases.

| Level | Required verification |
| --- | --- |
| Deterministic integrity | Source/version eligibility, origin, units, missingness, dependencies, exact state transitions, capacity, authorization, revision checks and retry identity. |
| Scientific grounding | The cited material supports the stated premise; theory and efficacy remain distinct; transfer and personal evidence justify the tentative application; outgoing prose does not exceed it. |
| Longitudinal learning | Prior predictions survive; corrections and conflicts change current authority; delayed results and untried changes remain distinguishable; transfer is scoped. |
| Model/reviewer reliability | Evaluate generation and review separately against human-adjudicated examples, across supported providers and after framework/prompt/library changes. Agreement between models is not the reference label. |
| Usability | People identify the next action, actual report, proposed interpretation, acceptance consequence, active test and next review; they can correct and inspect evidence. |
| Effectiveness | Separately evaluate whether the delivered coaching improves meaningful user outcomes over time. Method adherence, interface preference and citation correctness do not answer this. |

Critical release cases must include: genuine opportunity-based help; real citation with false claim; unmeasured mediator; inappropriate domain transfer; sparse favourable reports; corrected barrier; inconsistent units; duplicated cross-channel report; no reports after a cycle; action completed with delayed outcome; declined/untried test; simultaneous changes; advice without a saved plan; and an already useful plan needing no change.

Use fixed adversarial cases for hard invariants and held-out, multi-turn cases for semantic quality. Track false acceptance of unsupported advice, false rejection of useful advice, unnecessary questions, latency and reporting burden. Establish and document a qualified-review baseline rather than inventing a single scientific confidence score. A passing fixed suite is required regression evidence, not a population guarantee.

## 10. Implement in coherent, reviewable slices

| Slice | Existing starting point | Completion evidence |
| --- | --- | --- |
| A. Evidence records | `server/behavioral-research.ts`, `server/research.ts`, owned research | Representative theory/empirical/heuristic claims have verified scope, excerpts, versions and negative tests; other library material is not silently promoted. |
| B. Grounded decisions | `shared/behavioral-reasoning.ts`, `server/behavioral-methodology.ts`, `server/service.ts` | Advice and plan recommendations use the same premise/application/review contract; simple reports remain simple. |
| C. Learning records and commands | `shared/validation.ts`, workspace/command handling and decision persistence | Hypothesis/test lifecycle, source corrections, measurement changes and prospective reviews pass state and multi-turn cases. |
| D. Shared context and adapters | `src/coach-context.ts`, service, API, text/MCP and plan worker | Active learning survives conversation/channel changes; cognitive app actions use the same module and capabilities; repeated requests do not duplicate changes. |
| E. Evidence/projection integrity | Shared workspace, adaptive-plan and goal-projection code | Unknown periods, stale outcomes, incompatible edits and sparse ranges have truthful outputs used by all surfaces. |
| F. Complete user journey | Onboarding, Today, Check-in, proposal and Insights views | One goal reaches a useful action, a reported obstacle, grounded adjustment, live test and later review on desktop/mobile. |
| G. Remaining surfaces and claims | Goal portfolio/detail, Calendar, settings, public method and captures | Same state meanings, current capabilities and readable evidence; outcome graph and forward scenario preserved. |
| H. Release and learning from use | Existing deterministic/browser/live-eval seams | Critical regressions pass, semantic results are reviewed, comprehension is checked, material limitations documented and outcome evaluation kept distinct. |

Prefer extending current deep modules and replacing divergent paths as they are covered. Avoid keeping a new implementation beside an equally authoritative legacy one. Migrate old records honestly and retain history; do not require all existing users to repeat onboarding or retroactively manufacture experiments.

This document records the engineering design work. Research curation, application implementation, model evaluations and usability studies remain work to execute; they have not been reported as complete merely because the design is saved.
