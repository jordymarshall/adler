# Initial claim registry: source curation

Research date: 7 September 2026. Source curation for the implementation described in [Engineering the Adler Method](../method/coaching-engineering.md), following [the product principles](../product-principles.md). The twelve records are implemented in [the claim registry](../../shared/research-claims.ts); [release verification](../evaluation/shared-coaching-v2.md) records checks and limitations separately.

## Provenance and use

The initial curation labels below use `-v1`; runtime IDs use `claim:<name>` with version `2026-09-07.1`. External claims were **source-checked by this implementation research, not expert-certified**. Verification used the named original publication or its publisher/author/institutional copy; the access level is stated. Abstract verification supports only the scoped abstract claim. No independent replication, comprehensive systematic update, or expert appraisal is implied. There are no verbatim source excerpts below: the claim text is a paraphrase with a retrieval locator. Store that distinction in code; do not call paraphrases quotations.

The registry contains twelve records covering all seven current `METHODS`. Method and P IDs are routing links, not evidence by themselves. A P link means that the record informs that part of Adler's framework; it does **not** establish every assertion or product rule in that principle. In particular, dated milestones, check-in interfaces, review timing and personal decision thresholds need separate treatment from technique effects.

Retain two separate fields for evidence: **source design/grade** and **repository corpus grade**. The [synthesis](behavioural-science-synthesis.md) grades a body of evidence; an individual experiment does not inherit its entire domain's A grade. Where the source has no explicit repository grade, say so. The `EMP` label below comes from the idiographic deep dive and must not silently become an A/B grade.

Each runtime application should retain the claim ID/version, source locator, matching user observations and revisions, its proposed mechanism, applicability explanation, competing explanations and expected observable change. An approved ID alone does not validate that application. Plain-language sentences may be shorter than these records, but cannot exceed their scope. External research supplies no new observation about a user.

## Initial atomic records

### 1. `goal-specific-challenging-v1`

- **Method / principles:** `goal-definition`; P29 (task fit).
- **Role:** empirical; research review, not a new trial.
- **Claim:** The reviewed studies generally found better task performance with specific, difficult goals than with instructions to do one's best; specificity alone was insufficient.
- **Source / locator:** [Locke & Latham (2002), *Building a Practically Useful Theory of Goal Setting and Task Motivation*](https://med.stanford.edu/content/dam/sm/s-spire/documents/PD.locke-and-latham-retrospective_Paper.pdf), p. 706, “Core Findings.” DOI: `10.1037/0003-066X.57.9.705`. Relevant full text checked.
- **Applicability / limits:** Fit difficulty to ability and commitment. Does not establish that every goal needs a numeric outcome or a particular milestone cadence.
- **Grade:** Source not separately graded in the repository. P29's broader domain/transfer distinction applies to application, not source quality.

### 2. `goal-feedback-progress-v1`

- **Method / principles:** `goal-definition`, `monitoring`; P4.
- **Role:** empirical; research review.
- **Claim:** In the reviewed comparisons, goals accompanied by feedback about progress were more effective than goals alone.
- **Source / locator:** [Locke & Latham (2002)](https://med.stanford.edu/content/dam/sm/s-spire/documents/PD.locke-and-latham-retrospective_Paper.pdf), p. 708, “Feedback.” Relevant full text checked.
- **Applicability / limits:** Feedback must meaningfully relate to the goal. Does not validate Adler's chart, outcome estimator or every form of feedback.
- **Grade:** Source not separately graded. P4's A/high concerns the wider feedback corpus, not this review alone.

### 3. `goal-learning-before-performance-v1`

- **Method / principles:** `goal-definition`; P29.
- **Role:** empirical; research review.
- **Claim:** For unfamiliar complex tasks, the reviewed evidence supports considering strategy-learning goals when difficult performance targets interfere with acquiring an effective strategy.
- **Source / locator:** [Locke & Latham (2002)](https://med.stanford.edu/content/dam/sm/s-spire/documents/PD.locke-and-latham-retrospective_Paper.pdf), pp. 707–709, “Goal Mechanisms,” items 5–6, and “Task Complexity.” Relevant full text checked.
- **Applicability / limits:** Requires a relevant learning need. Does not supply Adler with domain expertise or prove learning-first is always best.
- **Grade:** Source not separately graded; preserve P29's transfer caution.

### 4. `implementation-if-then-v1`

- **Method / principles:** `implementation`; P2.
- **Role:** technique definition, separate from an effect claim.
- **Claim:** An implementation intention links a specified situation or cue to a concrete goal-directed response, spelling out when, where or how action will occur.
- **Source / locator:** [Gollwitzer & Sheeran (2006), *Implementation Intentions and Goal Achievement: A Meta-analysis of Effects and Processes*](https://doi.org/10.1016/S0065-2601%2806%2938002-1), abstract's definition of implementation intentions. Publisher abstract/preview checked; [author publication record](https://www.socmot.uni-konstanz.de/publications/implementation-intentions-and-goal-achievement-meta-analysis-effects-and-processes) confirms attribution.
- **Applicability / limits:** Requires an identifiable cue and executable response. Calendar availability and the user's endorsement require personal evidence; writing a plan does not create either.
- **Grade:** Definition is not efficacy-graded. P2's A direction/moderate magnitude belongs to empirical support, represented separately below.

### 5. `implementation-attainment-v1`

- **Method / principles:** `implementation`; P2.
- **Role:** empirical; meta-analysis.
- **Claim:** Across 94 independent tests in this meta-analysis, implementation intentions improved goal attainment on average relative to comparison conditions.
- **Source / locator:** [Gollwitzer & Sheeran (2006)](https://doi.org/10.1016/S0065-2601%2806%2938002-1), abstract's quantitative synthesis. Abstract/preview checked.
- **Applicability / limits:** Supports considering cue-linked action planning. It does not establish a personal effect magnitude, superiority to every other technique, or the best cue for this user. Digital-coach transfer remains an application question.
- **Grade:** Preserve repository P2 **A direction / moderate magnitude** as the broader corpus assessment. Do not turn the historical pooled effect into an Adler forecast.

### 6. `monitoring-attainment-v1`

- **Method / principles:** `monitoring`; P1.
- **Role:** empirical; meta-analysis of randomized comparisons.
- **Claim:** Across 138 studies involving 19,951 participants, interventions that increased progress monitoring improved goal attainment on average compared with controls.
- **Source / locator:** [Harkin et al. (2016), *Does monitoring goal progress promote goal attainment?*](https://pubmed.ncbi.nlm.nih.gov/26479070/), abstract's inclusion criteria and results. DOI: `10.1037/bul0000025`. Abstract checked.
- **Applicability / limits:** Monitoring must actually occur and concern a relevant quantity. Missing reports are not failed actions. Study-level moderators about reporting/recording do not establish that an AI recipient has the same effect or that daily logging is optimal.
- **Grade:** Preserve P1 **A / high** for the broader monitoring corpus; confidence in a particular Adler delivery or personal effect is separate.

### 7. `com-b-opportunity-v1`

- **Method / principles:** `barriers`, `implementation`; P24, P7.
- **Role:** theory/framework.
- **Claim:** COM-B treats opportunity as external conditions that make a behaviour possible or prompt it, distinct from capability and motivation.
- **Source / locator:** [Michie, van Stralen & West (2011), *The behaviour change wheel*](https://link.springer.com/article/10.1186/1748-5908-6-42), Background, COM-B definitions and physical/social opportunity discussion. DOI: `10.1186/1748-5908-6-42`. Relevant full text and conclusion checked.
- **Applicability / limits:** Organizes inquiry into reported constraints. The paper does not prove that COM-B-guided interventions outperform alternatives or that a calendar move will work. A missed action cannot diagnose motivation; framework categories are not verified personal mechanisms. Adler's choice to check external constraints first is its method policy, not a priority ordering intrinsic to COM-B.
- **Grade:** **D (theory)** under the synthesis rubric. P24/P7 empirical findings are separate evidence and must not be attributed to this framework paper.

### 8. `retrieval-delayed-retention-v1`

- **Method / principles:** `retrieval`; P29.
- **Role:** empirical; two experiments.
- **Claim:** In students learning prose passages, prior free-recall testing without feedback improved retention after two days or one week compared with restudy; restudy performed better after five minutes.
- **Source / locator:** [Roediger & Karpicke (2006), *Test-Enhanced Learning: Taking Memory Tests Improves Long-Term Retention*](https://journals.sagepub.com/doi/10.1111/j.1467-9280.2006.01693.x), abstract's two experiments and delayed versus immediate findings. DOI: `10.1111/j.1467-9280.2006.01693.x`. Abstract checked.
- **Applicability / limits:** Most directly supports delayed retention of comparable learned material. Does not establish the value of corrective feedback in this study, broad transfer to arbitrary skills, or validity of generated assessments.
- **Grade:** This source is not separately graded. Preserve P29 **A within domains / C transfer** for the broader learning corpus, not as a claim that this single paper is meta-analytic evidence.

### 9. `spacing-retention-horizon-v1`

- **Method / principles:** `spacing`; P29.
- **Role:** empirical; experiment.
- **Claim:** In factual learning with delayed tests, the spacing gap associated with the best retention depended on how long the material needed to be retained.
- **Source / locator:** [Cepeda et al. (2008), *Spacing Effects in Learning: A Temporal Ridgeline of Optimal Retention*](https://doi.org/10.1111/j.1467-9280.2008.02209.x); [institutional paper copy](https://labs.biology.ucsd.edu/rifkin/courses/bieb100/f14/Cepeda_et_al_2008_Psychological_Science_Spacing_Effects_in_Learning_A_Temporal_Ridgeline_of_Optimal_Retention.pdf), pp. 1096–1100, “The Current Study,” Procedure, Results, Table 1 and Figures 1–2. Relevant full text checked.
- **Applicability / limits:** Supports separate learning opportunities and attention to retention horizon. Studied facts and repeated testing do not establish a universal interval, an optimal Adler scheduling algorithm, or benefit from spacing arbitrary business tasks.
- **Grade:** Source not separately graded. Preserve P29 **A within domains / C transfer** for the broader evidence base.

### 10. `review-debrief-performance-v1`

- **Method / principles:** `review`; P3.
- **Role:** empirical; meta-analysis.
- **Claim:** Across 46 samples involving 2,136 participants, individual and team debriefs improved subsequent performance on average relative to controls.
- **Source / locator:** [Tannenbaum & Cerasoli (2013), *Do Team and Individual Debriefs Enhance Performance?*](https://pubmed.ncbi.nlm.nih.gov/23516804/), abstract, Method and Results. DOI: `10.1177/0018720812448394`. Indexed primary abstract checked; full methods were not independently reviewed here.
- **Applicability / limits:** Supports considering a structured, task-relevant review. Does not establish equivalence to unstructured journaling, an AI-led review effect, a five-minute weekly dose, a two-session trial, or superiority to every other intervention. Keep effect magnitudes out of personal promises.
- **Grade:** Preserve P3 **A / moderate (transfer untested)** for the repository corpus; its transfer caveat is material.

### 11. `individual-inference-transfer-v1`

- **Methods:** all seven; this constrains application of every empirical or theory claim.
- **Principle / framework links:** P29's transfer caution; synthesis §§2–3 and [idiographic inference §1](deep/idiographic-inference.md). The synthesis section is the direct framework home; P29 is a related routing link.
- **Role:** empirical; methodological analysis of six repeated-measures datasets.
- **Claim:** In the analyzed datasets, group-level estimates did not reliably describe individuals' within-person distributions and relationships.
- **Source / locator:** [Fisher, Medaglia & Jeronimus (2018), *Lack of group-to-individual generalizability is a threat to human subjects research*](https://pure.rug.nl/ws/portalfiles/portal/63406911/E6106.full.pdf), p. E6106 abstract and pp. E6113–E6114 Discussion. DOI: `10.1073/pnas.1711978115`. Relevant full text checked.
- **Applicability / limits:** Supports caution when translating aggregate findings to a particular person. It does not mean population research is useless, establish that every user responds differently, or authorize a universal uncertainty multiplier. A personal causal claim still requires its own adequate design and evidence.
- **Grade:** Preserve **EMP** from the repository's idiographic deep dive; do not recode it as a graded technique-efficacy claim.

### 12. `review-proportionate-design-v1`

- **Method / principles:** `review`; P3, with current engineering §§4.3 and 6 governing the product choice.
- **Role:** heuristic; Adler engineering policy.
- **Claim:** Choose the least burdensome learning approach adequate for the pending decision, and revisit a change when relevant opportunities and interpretable feedback can inform that decision.
- **Source / locator:** [Engineering the Adler Method](../method/coaching-engineering.md), §4.3 “Select the least burdensome adequate learning design” and §6 “Review with a disciplined method.” Local policy checked; **not an external empirical finding**.
- **Applicability / limits:** Can justify an explained practical review condition or a reversible change followed by feedback. Cannot justify a fixed optimal dose, causal confirmation after two successes, randomization without an appropriate design, or an efficacy claim for Adler. The chosen timing and information sought must be recorded for the particular case.
- **Grade:** **Heuristic, not efficacy-graded.** Preserve the synthesis's separation between supported ingredients and heuristic numbers; do not borrow P3's A grade.

## Catalog wording and deployment boundaries

These are source-to-wording findings, not a request to rewrite the app in this research change:

| Current wording or tempting inference | What this curation supports changing |
| --- | --- |
| `retrieval`: “then compare your reasoning” and the statistics-problem example | Keep retrieval's supported delayed-retention claim narrow. Checking against a suitable source can remain a clearly identified coaching/practice choice; separately curate relevant feedback/problem-solving evidence before calling the entire sequence empirically established by Roediger & Karpicke. |
| `implementation`: “Booking time creates an opportunity” | Say a booked slot is a proposed opportunity whose feasibility needs checking. Cue planning does not establish actual availability or performed work. |
| `goal-definition`: dated milestones presented as a direct consequence of one citation | The particular milestone units and timing are engineering choices fitted to the task. The cited review does not establish a universal milestone scheme. |
| P1's human-recipient findings used to assert equivalent AI witnessing | The current registry permits the monitoring claim; equivalence of recipients and a particular digital delivery remains unverified here. |
| P2/P3 phrases such as “most consistently replicated move” or “largest effect available to this product” | No cross-technique ranking or Adler efficacy claim follows from these separately studied pooled effects. Use the scoped benefit with its transfer limit. |
| “One thing,” “two sessions,” or “weekly” treated as proven rules | Use `review-proportionate-design-v1` only as an explicit heuristic, with a case-specific rationale. |
| An A label attached to COM-B, a source ID, or this curation itself | Show framework versus efficacy roles and corpus versus individual-source grades. Source checking establishes traceability, not personal efficacy or expert certification. |

The existing `barriers`, `monitoring`, `spacing` and `review` limit text already contains valuable boundaries. Preserve those boundaries when simplifying display. This starter registry is deliberately incomplete: it does not substantiate all 36 principles, mental-health claims, arbitrary domain strategy, personal outcome conversion rates, or new numerical thresholds. Where a substantive recommendation needs a mechanism absent from this set, use another specifically curated claim or clarify the relevant facts; do not force-fit a convenient citation.

## Minimum implementation checks using these records

1. Accept an external-opportunity hypothesis when the user reports meetings displaced writing; retain the meetings report separately from COM-B's theoretical classification and the tentative calendar adjustment.
2. Reject using `com-b-opportunity-v1` as proof that the proposed time will increase output, or using `implementation-attainment-v1` to assign that user a success percentage.
3. Reject the otherwise valid retrieval claim as support for moving sales work to morning, and reject the spacing claim as proof that three revenue sessions per week is optimal.
4. Reject claims that this retrieval source established corrective-feedback benefits. Correct attribution must survive a semantically plausible but source-inaccurate explanation.
5. Accept “these two sessions went better; keep this for now if useful” while rejecting “this proves mornings are your productive time.” Save the observed comparison and unresolved interpretation separately.
6. When a supporting check-in is corrected, keep the historical claim/version and rationale, but invalidate the old current application until its premises are reviewed. Reusing the same valid research citation does not repair a changed personal premise.
7. Cover advice-only responses as well as saved actions across the shared coach. A chat paragraph can make the same unsupported inference as a mutation.

These checks concern source fidelity and inference boundaries. Passing them does not demonstrate that the product improves goal attainment; that remains a separate outcome-evaluation question.
