# A useful coach with proportionate, inspectable learning

Research and product review · 8 September 2026. Recommendations for the agreed All Goals A / Goal C iteration; no product implementation or deployment. Examples below are fictional. This is a targeted primary-source audit and synthesis of the owned research, not a new systematic review or independent expert certification.

Read with the [agreed next iteration](https://github.com/jordymarshall/adler/blob/prototype/goal-views-integrated/docs/prototypes/goal-views-integrated/GOAL-VIEWS-NEXT-ITERATION.md), [product principles](../product-principles.md), [current Method](../method/adler-method.md), [engineering design](../method/coaching-engineering.md), [domain language](../../CONTEXT.md), and [individual-learning methodology](individual-learning-methodology.md). The existing methodology already contains most of the necessary reasoning contract. The next opportunity is to make that contract reliably drive decisions, defaults and visible state. These recommendations do not imply that the current app lacks all the safeguards described here.

## Product judgment

Adler should help the person answer two connected questions: **Can I perform useful work in a way that fits my life? Is that work helping me achieve what I wanted?** The first is not answered by attendance alone; the second is not answered by a higher attendance score. This is a proposed product framing of the existing support → mechanism → behaviour → outcome distinction, not an additional scientific theory. [Engineering design §2.1](../method/coaching-engineering.md#21-separate-four-links).

Keep A/C, their existing charts and the canonical Coach. Make the default view show the next useful decision within the user's plan, including a reason to continue when things are working. Do not turn the overview into a list of problems or show every uncertainty the coach considers. The scientific work belongs in the shared system and its saved evidence; the person sees a clear action, its consequence and optional depth.

## 1. Define meaningful work before optimizing its completion

**Proposed refinement.** At goal formation, Adler should choose a reasonable first controllable action from the user's chosen work and current context, explain how it contributes, and make it editable. Ask only if a missing answer would materially change that first step. Sparse personal history need not delay a useful provisional start. A deadline can be an aspiration, a fixed external constraint or a negotiable preference; it must not silently become a scientific prediction.

For each action, preserve what counts as useful work, its amount or finish criterion, the applicable plan version and the goal outcome it is intended to support. This does not mean a questionnaire of mandatory fields. Much of it can be inferred provisionally from the user's request and corrected in the existing action controls.

Reading pages may directly contribute to finishing a particular book, subject to remaining length and what the user means by finishing. Hours of focused work are a possible controllable input to a revenue goal, not sufficient evidence of useful business output. The coach may help the user clarify a meaningful output or learning question; behavioural literature cannot select a business strategy or invent a quota.

In A/C, allow these combinations without collapsing them into one on-track grade:

| Reported situation | Useful coaching decision |
| --- | --- |
| Work is feasible and meaningful results are progressing | Continue; reduce unnecessary supervision when appropriate. |
| Work is happening; relevant results have not yet had time to arrive | Keep the outcome question pending. |
| Work is happening; interpretable results repeatedly disappoint | Examine whether the chosen work, quality criterion or assumed relationship needs review. |
| Work is not happening | Establish what was reported and what blocked the opportunity or execution before proposing a change. |

**Basis and limits.** P29 supplies the domain-transfer boundary; the current claim `claim:goal-learning-before-performance` supports considering a learning objective for unfamiliar complex work, not requiring learning-first for everyone. P1's monitoring evidence supports measuring relevant progress, not maximizing an arbitrary completion denominator. [Claim registry](../../shared/research-claims.ts), [Harkin et al., original meta-analysis](https://pubmed.ncbi.nlm.nih.gov/26479070/). Existing action/outcome separation is already in [CONTEXT.md](../../CONTEXT.md); the refinement is making it govern the default decision and its prominence.

## 2. Locate the actual constraint before choosing a behavioural technique

**Proposed refinement.** The shared coach should consider distinct possibilities: missing report, unavailable opportunity, difficulty starting or persisting, ineffective work, delayed response, or a goal the person no longer wants to prioritize. These are internal alternatives, not six new UI fields or six badges. Surface the relevant question and its context.

For example, if two reported sessions were displaced by meetings, “Would the protected Friday slot still be available?” is more useful than explaining motivation. If the slot remained free but the person could not identify the next task, that suggests a different question. Calendar context can make the question specific; it cannot prove that a session happened or that the available time was usable.

Treat capacity as shared across goals. A nominally free hour can still be unusable because of a stated dependency, setup requirement or external demand. The compact capacity strip in A should reveal a practical trade-off when it matters; it should not fill every free calendar slot. Changing the schedule, reducing scope, negotiating the target or parking a goal are legitimate coaching decisions. User priority governs the trade-off; the lowest adherence score does not automatically get the most resources.

**Basis and limits.** `claim:com-b-opportunity` / `curated:com-b-opportunity` is **D, theory**. COM-B distinguishes opportunity, capability and motivation but does not establish “external constraints first” as its own priority rule; that ordering is Adler's chosen policy. P24's broader empirical base is **A finding / D thresholds**. The digital physical-activity review found unequal effects by socioeconomic status; it does not establish how Adler will affect every constrained user. [COM-B original framework](https://link.springer.com/article/10.1186/1748-5908-6-42), [Western et al., original review](https://ijbnpa.biomedcentral.com/counter/pdf/10.1186/s12966-021-01218-4.pdf). Current instructions already require these distinctions in [server/behavioral-methodology.ts](../../server/behavioral-methodology.ts); evaluate their use rather than merely adding more prompt text.

## 3. Make an experiment serve a decision the person cares about

**Proposed refinement.** Before proposing a test, Adler should identify what decision a different answer could change. Preserve a scoped explanation, relevant research, the exact support, what would count as using it, an observable prediction and a useful review trigger before new feedback arrives. A preference can settle a plan directly. An observation can remain an observation. The system should not create experiments simply to keep the learning journey populated.

The default can be a reasonable change followed prospectively, with uncertain attribution. A repeated comparison is useful only when opportunities and measures are comparable. Formal individual experimentation additionally needs an appropriate assignment scheme, analysis and treatment of carryover; it is not automatically superior coaching. Preserve the existing distinction between:

- The support was agreed or scheduled.
- The person reported using it, and what followed.
- The evidence supports, weakens or fails to test the explanation.
- The person and coach choose to keep, change or stop it.

Only the relevant state needs prominence. “Agreed · first try planned Friday” is clearer than implying experience before it exists. **Concrete current gap:** `learningStatus()` returns “Trying now” after date/workflow checks without testing reported exposure. Reviews separately retain exposure. The visible label should describe the scheduled learning window or actual reported use accurately, without inventing an exposure counter from message counts. [shared/learning.ts](../../shared/learning.ts).

**Basis and limits.** SOBC and CLIMBR distinguish proposing a mechanism, measuring/engaging it, and establishing a relation to behaviour; these are methodological frameworks, not proof of Adler efficacy. Ordinary conversation is not a validated mechanism measure. CENT is a reporting standard for planned repeated crossover trials; it does not validate observational before/after stories. Keep uncertainty without withholding a sensible low-burden choice. [SOBC original article](https://pubmed.ncbi.nlm.nih.gov/26622921/), [CLIMBR original paper, pp. 709–711](https://scienceofbehaviorchange.org/wp-content/uploads/2023/09/Birk_Otto_Edmondson_2023_BehTherapy_ChecklistForInvestigatingMechInBehChangeResearchCLIMBR.pdf), [CENT explanation](https://www.bmj.com/content/350/bmj.h1793). This implements the already-designed [learning modes and review order](individual-learning-methodology.md#2-choose-a-learning-design-that-fits-the-question).

## 4. Give work, learning and outcomes appropriate clocks

**Proposed refinement.** Keep the goal horizon, current concrete work, relevant action opportunities, earliest useful feedback and next review distinct. In the existing timeline, show the dates that affect the current decision; disclose the rest. A review date is an invitation to evaluate evidence, not a scheduled scientific result.

For a structural change, verify installation and then the first relevant use or a changed condition. For skill development, inspect useful work and task-appropriate quality or retention feedback. For a campaign, track controllable execution now and external responses when they can reasonably arrive. A campaign can contain recurring sessions; choose timing at the level being changed. No universal daily tap, weekly review or fixed minimum observation count follows from the literature.

Before asking for an extra report, the coach should identify which plausible answer would change its advice. Reuse attributed context, accept a concise correction, and stop when the useful decision is settled. The same Coach can hold a brief report without requiring a reflective conversation. A stable plan can receive less contact; the app should remain useful when opened less often because the person is performing the work.

**Basis and limits.** The JITAI framework separates proximal/distal outcomes, decision points, options, tailoring variables and rules; it explicitly permits providing no support and discusses assessment burden. Its optimal timing is not established for Adler. The local `claim:review-proportionate-design` is correctly labelled a **heuristic**, not an efficacy claim. Kwasnicka's maintenance source is **D, systematic theory review**, not proof of a fixed maintenance schedule. [JITAI original article](https://pmc.ncbi.nlm.nih.gov/articles/PMC5364076/), [Kwasnicka et al.](https://pubmed.ncbi.nlm.nih.gov/26854092/), [existing temporal contract](../method/coaching-engineering.md#42-keep-the-time-horizons-separate).

## 5. Make forecasts earn their prominence, and preserve the ruler

**Proposed refinement.** Keep the user's requested projection graph, target and broad scenario fan where meaningful. Distinguish the current plan's scenario, recent reported work's scenario, and an actually saved historical forecast revision. A date produced by arithmetic can be useful without being an empirically established expected completion date.

Current projection code already preserves important safeguards: missing quantities remain unknown, incompatible measures are rejected, excluded intervals are disclosed, and the fan is explicitly heuristic. However, it estimates input pace from complete seven-day bins in a bounded recent window, falls back to planned pace until two complete weeks, and can produce a learned finish date after one eligible positive input/outcome interval. Three pairs change a descriptive status label. The model also selects a single driver action. [goal-projection.ts](../../shared/goal-projection.ts), [projection-model.ts](../../shared/projection-model.ts).

These defaults need goal/cadence-specific evaluation before a headline date implies a dependable outlook. Completeness alone cannot establish comparability or a defensible lag. If difficult weeks are less often reported, complete-week pace may be unrepresentative. A broad band cannot remedy an unsupported relationship. Use the current evidence state to decide whether A should lead with a conditional date, reported result, next response to review, or an explicit uncertainty; any speculative scenario remains inspectable in C. Do not replace this with an arbitrary universal pair-count threshold or invent a multi-input causal model.

Preserve actual amounts and useful output after changing difficulty. “Five pages completed” and “twenty pages completed” can each meet their contemporaneous plan while contributing different quantities. Preserve old commitments and report definitions rather than retrospectively editing them to increase adherence. Keep explicit noncompletion, unknown reports, planned rest and confirmed unavailable opportunities distinct; exclusions need reasons and remain inspectable. Do not silently discard a hard week as noise.

**Basis and limits.** These are measurement and product recommendations, not experimentally validated display rules. Existing `claim:individual-inference-transfer` is **EMP**, an empirical methodological analysis rather than an intervention-effect grade. Repeated associations, even with real citations, do not identify personal causal returns. [Fisher et al., original analysis](https://pmc.ncbi.nlm.nih.gov/articles/PMC6142277/), [CENT's missing-period and dependence reporting guidance](https://www.bmj.com/content/350/bmj.h1793), [existing comparability requirements](individual-learning-methodology.md#5-make-the-record-comparable-without-increasing-reporting-burden).

## 6. Learn from success and make returning easy

**Proposed refinement.** C's chronology should retain useful continuation decisions and lessons from successful attempts, not only failures and plan changes. When appropriate, ask what made a successful attempt possible, compare it with the existing explanation, and preserve that condition in future planning. Keep language specific to the recorded situation. A successful session does not establish a personality trait.

After a miss, help the person choose the next feasible opportunity. Do not require a full retrospective before they can resume. A past deficit should not silently become compulsory extra work. Above-plan quantity may help a milestone, have no relevant benefit, or impose a cost on another priority. The coach must assess meaning, burden and user preference before recommending more.

Keep the approved inline flame as a secondary visual. A streak is a description under an agreed plan-relative rule, not the coach's objective. High adherence can mean a suitable sustainable plan; it does not automatically mean difficulty is too low. Low adherence can indicate unavailable opportunity, reporting friction or a poor action, not just excessive dose. No universal 80%, 85% or 100% optimization target is justified here. The 85% learning paper derives a result for particular binary-classification learning algorithms; it is not a target for habit adherence. [Wilson et al., original paper, pp. 1–2](https://www.nature.com/articles/s41467-019-12552-4.pdf).

**Basis and limits.** P3 is **A / moderate, transfer untested**; the specific success-plus-failure review finding is **B**, a soldier-navigation quasi-experiment. It motivates trying a balanced review, not mandating a success/failure ritual or promising its effect in adult app users. `claim:review-debrief-performance` supports the broader practice. P8 is **A ingredient / H numbers**; its old dose/growth thresholds do not transfer automatically. P10–P11 and the current Method support user ownership; that does not require multiplying choices. [Ellis & Davidi](https://pubmed.ncbi.nlm.nih.gov/16162059/), [Tannenbaum & Cerasoli](https://pubmed.ncbi.nlm.nih.gov/23516804/), [Iyengar & Lepper's bounded choice findings](https://pubmed.ncbi.nlm.nih.gov/10101874/).

P34 remains a genuine evidence conflict. Silverman and Barasch show that how intact versus broken streaks are represented can affect subsequent engagement, including moderation by attribution and repair. Aulagnon's large education field study found benefits of streak messages. Neither validates Adler's exact flame, rest-day credit or reset rule. Agree those semantics explicitly and evaluate return after misses alongside meaningful work and user burden. [Silverman & Barasch](https://doi.org/10.1093/jcr/ucac029), [Aulagnon et al., authors' working paper](https://publications.iadb.org/publications/english/document/Streaking-to-Success-The-Effects-of-Highlighting-Streaks-on-Student-Effort-and-Achievement.pdf).

## 7. Make cumulative understanding change planning, with scope intact

**Proposed refinement.** An insight should earn its place by identifying what it changes in the plan: a window to preserve, an obstacle to accommodate, a useful finish criterion, a support worth continuing, or a question still unresolved. The current learning entry should link directly to the affected action and dates. Selecting it reveals the same saved observation, specific research premise, personal application and prediction used by the coach. Further disclosure supplies source scope, alternatives and corrections. Do not generate a separate persuasive rationale for the UI.

Preserve both what worked and where it did not. “This setup fitted the last two reading sessions” can inform another goal only through an explicit shared-mechanism/context rationale. A stated preference need not expire because it lacks experimental proof. A working hypothesis should be reconsidered when its sources, measurements or relevant circumstances change, not automatically become a permanent personal rule or expire on a universal timer. Goal-linked records can support one coherent memory without copying an insight into multiple authoritative versions. [Existing memory and transfer requirements](../method/coaching-engineering.md#53-make-correction-change-current-authority).

**Research quality action.** The runtime already says research is evidence, not executable instructions, and explicitly overrides old mechanics. Preserve that. The twelve curated records should grow according to actual decision failures and coverage needs, including contrary evidence, rather than treating all P1–P36 paragraphs as already verified atomic claims. Prioritize reviews of success/recovery, autonomy, maintenance, opportunity constraints and domain fit when those are the premises the coach uses. Grades, personal evidence and heuristic labels are distinct. [Current prompt](../../server/behavioral-methodology.ts), [claim registry](../../shared/research-claims.ts), [curation design](coaching-grounding-engineering.md#41-curated-research-records).

**A concrete correction surfaced in this audit:** [feedback-and-progress.md §4](deep/feedback-and-progress.md#4-progress-framing-and-display-the-streak-evidence-cuts-against-us) says Aulagnon reports nothing about behaviour after a break. The accessible authors' working paper actually examines consecutive weeks without connecting as a discouragement check and finds no evidence of longer nonconnection relative to personalized reminders (printed p. 12; PDF p. 14, Appendix A.3 panel B). This is not a randomized comparison specifically conditioned on the first break, nor proof of no harm in Adler. The categorical “nothing” claim needs correction in the next research-curation pass. This review changes no source file outside this memo. [Primary paper](https://publications.iadb.org/publications/english/document/Streaking-to-Success-The-Effects-of-Highlighting-Streaks-on-Student-Effort-and-Achievement.pdf).

## 8. Evaluate the incremental value of the coach

**Proposed refinement.** The product's scientific claim should remain “research-informed coaching” until evidence supports stronger claims. A readable graph, correct citation or happy conversation is valuable but does not establish that adaptive coaching improves the person's life. The current engineering design already distinguishes deterministic integrity, grounding, longitudinal learning, model reliability, usability and effectiveness; keep these as separate evaluations. [Engineering design §9](../method/coaching-engineering.md#9-verify-the-implementation-at-several-distinct-levels).

Use a staged evaluation plan:

1. **Trace realistic decisions:** evaluate held-out multi-turn cases with qualified human adjudication, including useful holds, wrong-but-valid citations, success, constraint, uncertainty, changing measurement and late outcomes. Score unsupported advice and unnecessary questioning separately.
2. **Check comprehension and effort:** can a person find the next action, interpret its goal relationship, correct the record, and tell a hypothesis from a result without opening all scientific detail? Include new users, interrupted routines and mobile use.
3. **Measure behaviour outside the interface:** predefine goal-appropriate meaningful work, reported/observed outcome, burden and recovery. Track coverage and attrition; more reporting can increase apparent progress without increasing actual work.
4. **Test added coaching value:** after feasibility, compare adaptive coaching with a credible chosen-plan plus monitoring experience. Hold measurement opportunities appropriately comparable; specify the outcome, duration, analysis and treatment changes before seeing results. Stratify or otherwise plan examination of important goal/context differences without inventing a universal cross-goal success score. An experiment's consent and data practices should match its real design; ordinary product use is not silently a causal trial.

This comparator is motivated by P1's existing monitoring benefit and the synthesis's own proposed tap-versus-coach evaluation. No sample size or duration is scientifically determined by this memo. Product changes within an effectiveness study need explicit versioning and a design that can interpret them.

**Evidence boundary.** PREEMPT, an RCT of 215 adults with chronic musculoskeletal pain, found improved medication-related shared decision-making but no statistically significant primary pain-interference benefit at six months from app-supported individual trials. This neither predicts Adler's effect nor establishes no possible benefit; it shows why a convincing personal-experiment experience is not an outcome-efficacy result. The MRC framework supports testing programme theory, context, feasibility, relevant outcomes and resource consequences. [PREEMPT original study](https://escholarship.org/uc/item/3pn8j188), [MRC/NIHR original framework](https://www.bmj.com/content/374/bmj.n2061), [synthesis's product-evaluation questions](behavioural-science-synthesis.md#7-what-adler-should-test-with-its-own-data).

## What this adds to the agreed A/C work

| Existing surface | Visible improvement | Deeper requirement |
| --- | --- | --- |
| All Goals A | Useful steady progress or a worthwhile next decision, under stable user priorities | Do not rank attention from shortfall alone; distinguish result, input and report uncertainty. |
| Goal C current plan | Meaningful action within its milestone, with the relevant date or consequence | Preserve action semantics, scope and current version; use goal-appropriate timing. |
| Existing action/outcome graphs | An interpretable comparison and conditional outlook when supported | One-driver scenarios, missingness and weak associations cannot masquerade as dependable personal forecasts. |
| Current learning event | What is being proposed or tried; what the next feedback will clarify | Agreement, exposure, available feedback, evidence standing and practical decision remain distinct. |
| History / Why this change? | The actual change, evidence, cited rationale and its effect on planning | Original predictions, contrary cases, source versions and corrections remain linked. |
| Action controls and Coach | A brief report or exact action; contextual help when useful | One shared state and coaching method, with proportionate processing. |

No new scientific settings page, experimentation administration, universal score, action inbox or separate status graph is required. The interaction should usually expose one relevant piece of learning, while the coach retains the full structure.

## Verification cases before treating the refinement as complete

- A new user has enough information for one useful action but no baseline: provide a provisional step without invented personalization or a forced waiting period.
- The user meets a tiny target more often but produces less meaningful work: retain both quantities and do not declare improvement from adherence alone.
- A calendar block exists but there is no report: completion and test exposure remain unknown.
- A change is agreed and its start date passes: the UI does not claim it was used.
- Several favourable reports describe the same attempt: count the occurrence once and keep attribution tentative.
- An action is performed but a response is delayed: preserve execution credit and defer the relevant outcome decision.
- One revenue interval implies a high return: do not promote its conditional date to a dependable outlook; explain the unresolved relationship.
- Sparse reports preferentially omit difficult periods: disclose the relevant coverage and avoid treating complete periods as a representative personal pace without qualification.
- The goal horizon is a day, or the work is structural: do not require two complete weeks, recurring flame mechanics or empty experimental stages to make it useful.
- A workable plan is succeeding and acceptable: holding it, learning from that success and reducing unnecessary contact remain available decisions.
- A shared constraint affects several goals: show its actual trade-off without reallocating life priorities from adherence scores.
- A cue worked in one goal: a new application retains its original context and transfer uncertainty.
- A source or report correction undermines an explanation: current guidance changes authority while the historical decision remains understandable.
- The user returns after a miss: the next feasible action is reachable without settling old reporting debt or supplying an obligatory reflection.

## Source-access and grade notes

The complete P1–P36 synthesis, its conflict resolutions, individual tailoring, wisdom, scope and proposed product tests were surveyed; relevant deep dives and the newer grounding/individual-learning notes were read. The recommendations emphasize P1–P8, P9–P12, P14–P24, P27–P29 and P34 because they govern the selected plan/progress/learning experience. P13/P30–P31 remain boundaries of the existing product; this is not a medical, legal or safety-system revalidation. P26/P32–P36 do not become mandatory new UI features because they exist in the library.

Repository grades are preserved at their proper level: synthesis **A/B/C/D** denotes its stated evidence rubric; **EMP**, **TH**, **STD** and **heuristic** are not interchangeable efficacy grades. Several deep dives use their own design labels; source-specific records preserve those rather than inheriting the strongest nearby principle grade. Recommendations and mockup comprehension remain unvalidated product hypotheses.

Primary verification used original papers/frameworks through publisher pages, PubMed-indexed original abstracts, or authors' institutional copies. Some direct PMC/publisher opens were blocked; where available, indexed text was used and claims were limited to what it contained. Full text was accessible for COM-B, CLIMBR, the JITAI indexed article, CENT, the MRC indexed article, Wilson's PDF and the Aulagnon authors' working paper. The latter is the April 2024 paper; the 2025 journal version was not independently compared in this pass. Harkin, debriefing, Ellis, Kwasnicka, choice and PREEMPT claims above use accessible original abstract text, not an independent audit of all methods or reanalysis. No registry claim was promoted or source file amended by this memo.
