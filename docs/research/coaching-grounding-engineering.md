# Engineering research-grounded coaching decisions

Status: **proposal, not implemented**. Research and source-code review: 2026-09-07. This document specifies the grounding part of the shared coach; it does not replace the current [Adler Method](../method/adler-method.md) or define a second coaching service. Product, hypothesis lifecycle and measurement models should use the same decision identities described here. Names in the proposed schemas are illustrative until the shared design is finalized.

## 1. Required outcome

Every substantive behavioural interpretation must make an inspectable connection between:

1. What the person or a connected source actually supplied.
2. The specific behavioural construct or research finding Adler is using.
3. Why that construct might explain this situation, including competing explanations and transfer limits.
4. What action, clarification or deliberate hold follows.
5. What future observation would support, weaken or fail to test the interpretation.

This must be saved before the interpretation is presented as Adler's recommendation. It applies to advice in a conversation as well as plans, insights, scheduling recommendations and reviews. A direct user instruction, factual acknowledgement or clarifying question needs accurate provenance, not an invented scientific explanation. A user preference may guide the plan without becoming an empirically proven personal effect.

The implementation should expose a concise decision rationale. It should not ask the model to reveal or persist private chain-of-thought. The required artifact consists of claims, their sources, stated application assumptions and a reviewable decision.

## 2. Verified current implementation

| Current seam | What it already does | Specific extension needed |
| --- | --- | --- |
| [server/behavioral-research.ts](../../server/behavioral-research.ts) | Loads the full synthesis, extracts P1–P36 as source summaries, allows selected deep-dive reads | Stable concept/evidence entries tied to precise source excerpts and versions; research-library selection must expose applicable limits as well as supporting principles |
| [shared/coaching-framework.ts](../../shared/coaching-framework.ts) and [server/behavioral-methodology.ts](../../server/behavioral-methodology.ts) | Define six gates and require reported barrier, enabled method, mechanism, fit, prediction, review rule, limits | Require evidence bindings for each interpretation and consequential recommendation, including advice-only turns; distinguish theory from effect evidence |
| [shared/behavioral-reasoning.ts](../../shared/behavioral-reasoning.ts) | Stores the preceding rationale as strings and source IDs | Bind claims to the particular source/concept/observation version that supports or motivates them; link the decision to the persistent hypothesis/test it updates |
| [server/research.ts](../../server/research.ts) | Retrieves Europe PMC/Crossref abstracts, deduplicates by DOI, retains metadata; semantic reviewer assesses evidence and consistency | Normalize candidate claim/excerpt records; assess claim-level support and applicability; preserve reviewer verdict and evidence packet rather than only an empty issues array |
| [server/service.ts](../../server/service.ts) | One shared orchestration loop, structured output, feasibility preview, bounded repair, evidence-ID validation and semantic review | Resolve evidence before presenting an interpretation; run semantic review for substantive advice without a plan mutation; save one validated decision artifact shared by all surfaces |
| [src/coach-context.ts](../../src/coach-context.ts) | Supplies all goal contexts, saved plans, recent conversation, previous decisions and derived evidence | Always include active hypothesis/test state and its original prediction, comparison, source revisions and latest unresolved evidence, independent of recent-chat truncation |
| [shared/planning.ts](../../shared/planning.ts), [shared/validation.ts](../../shared/validation.ts) | Keep research summaries, plans and learning records readable; preserve dates and source IDs | Add explicit source access/version and decision provenance without pretending historical decisions satisfy the new contract |
| [server/channels.ts](../../server/channels.ts), [server/mcp.ts](../../server/mcp.ts) | SMS/iMessage and MCP coaching route to the same service | Carry the same evidence origin and decision links; separate raw edits from Adler-generated coaching; prevent connector context becoming user-reported evidence |

Two current gates are insufficient on their own. `validateBehavioralReasoning` proves that source IDs exist, not that their content supports the proposed mechanism. The semantic review in `Service.chat` runs only when a change includes `basis` or an insight includes `learning`; a substantive reply with neither can bypass it. The current semantic-repair test in [tests/adaptive-service.test.ts](../../tests/adaptive-service.test.ts) correctly tests orchestration with a simulated reviewer. It does not measure the real reviewer's ability to detect a false application.

Current goal/plan creation also requires a dynamic literature-search round even if the owned research already answers the question. Replacing that requirement with adequate, current, claim-specific evidence is a proposed change. It must not become permission to skip evidence retrieval altogether.

## 3. What different evidence can establish

The original COM-B paper developed a framework for characterizing and designing interventions and tested classification reliability in two public-health domains. It explicitly left open whether using the framework makes intervention design more effective. Therefore it can ground an opportunity/capability/motivation analysis; it cannot, by itself, prove that Adler's selected adjustment works. [Michie, van Stralen & West, 2011](https://link.springer.com/article/10.1186/1748-5908-6-42).

BCT Taxonomy v1 identifies and defines intervention components and tests their reliable description. Membership in its taxonomy is not an effect-size estimate for that component. [Michie et al., 2013](https://pubmed.ncbi.nlm.nih.gov/23512568/).

The product should encode these distinctions rather than hope that the model remembers them:

| Evidence role | Permitted use | Inference it cannot supply alone |
| --- | --- | --- |
| Framework concept / theoretical relationship | Identify relevant variables; organize a reported barrier; motivate a testable mechanism | Diagnose the person's cause, establish an intervention's effectiveness, or calculate a personal probability |
| Technique definition / taxonomy | Specify exactly what support is being tried and make trials comparable | Claim that the technique improves the outcome |
| Empirical technique-effect finding | Describe the measured effect or association in the study's population, setting, comparison and time window | Prove the same effect for this person; assume an intervention effect demonstrates its hypothesized mediator |
| User-reported observation | Establish what the user reported, when, in which circumstances, with which measure | Prove the person's explanation is the cause or that the report was objectively verified |
| Connected context | Establish what an external system supplied | Establish completed work or the user's interpretation without confirmation |
| Adler's personal hypothesis | Synthesize reports with a relevant framework into an explicitly tentative explanation | Become a fact because a study or previous model reply cites it |
| Operational heuristic | Choose a practical trial size, review point or provisional measurement assumption | Become an optimum established by research |

The final distinction is essential: **a paper may support the premise without proving the personal inference**. The system should check that the personal inference is a reasonable, bounded application of the premise, not demand that a paper literally entails the user's private situation. The [repository's idiographic-inference review](deep/idiographic-inference.md) and [current method](../method/adler-method.md) already make this limitation explicit; the proposed structure operationalizes it.

## 4. Curated evidence first; dynamic retrieval when it changes the decision

### 4.1 Curated research records

Keep the full synthesis as the common decision framework. Add a small, versioned evidence registry maintained alongside the owned research, loaded by the existing `behavioral-research.ts`. This is not a replacement seven-method menu, vector database or new agent. It is an index of the claims and concepts the current framework is allowed to rely on.

Each entry should contain only what is needed to verify its use:

| Field | Purpose |
| --- | --- |
| Stable evidence ID and version | Preserve exactly which interpretation of a source was used |
| Principle IDs, framework name and specific construct | For example, the physical-opportunity concept, not merely “COM-B” |
| Claim type | Framework definition, theoretical relationship, technique definition, empirical effect, observational association, or Adler heuristic |
| Atomic supported statement | One sufficiently specific claim, without bundling an effect, mechanism and personal promise |
| Source reference, access level, excerpt locator and excerpt/version hash | Let code establish that the cited support exists in the material actually read; full text, abstract and owned summary stay distinct |
| Scope | Population, behavior, intervention, comparison, measured outcome and time scale, where applicable; unknown where unavailable |
| Qualification | Existing evidence grade and meaning, transfer limits, null/conflicting results and what must not be inferred |
| Review provenance | Who/what prepared and reviewed it, when it was reviewed, and whether it is current, superseded or withdrawn |

Do not automatically convert each P paragraph into a verified empirical fact. Some paragraphs mix findings, theory, synthesis and historical product heuristics. Curating a record requires following its supporting deep dive to the source that owns the claim and separating these components. Start with the concepts and supports actually used by the enabled coaching routes; preserve the rest of the synthesis as qualified research, not silently as validated records.

An offline model may draft an extraction, but it must not approve its own extraction as a reusable scientific authority. Source checking and research review belong to the library's release process. This is internal product quality control, not an end-user approval gate. Keep quoted excerpts short and appropriately licensed; source locators and faithful scoped paraphrases often suffice, while the verifier must have the underlying material it is assessing.

### 4.2 Dynamic literature retrieval

Use the existing bounded `researchQueries` capability when the curated entries do not answer a consequential fit question, when relevant conflict is unresolved, or when a source needs updating. Search for the mechanism and target behavior, not the person's private details. Select for relevance and study design; do not treat search rank as evidence quality.

Normalize retrieved results into the same claim/excerpt representation with `reviewStatus: candidate` and their true access level. An abstract-only candidate can support an abstract-level statement; it cannot establish unreported attrition, mediation, intervention content or subgroup efficacy. If a material claim requires missing detail, read an available owned full-text source, obtain an appropriate primary source through a bounded tool, narrow the claim or ask a question. Do not fabricate methodological detail to complete a schema.

A reviewed candidate can support the current tentative decision. It does not automatically modify the global curated framework or become a durable personal rule. Save its source snapshot with the decision; a later library review can promote, qualify or withdraw it. Research unavailable is a meaningful state: use relevant owned evidence if adequate, otherwise acknowledge the limit and choose a proportionate next observation or exact user-directed edit.

### 4.3 Retrieval output must include the contrary case

For a selected construct, return its constraints and relevant counterevidence with its supporting excerpt. For example, a cue record should arrive with the condition that a viable opportunity exists; retrieval should not offer only the attractive headline about implementation intentions. A limited entry set selected by principle/construct and goal route is enough initially. Introduce semantic search only if a measured retrieval failure justifies it.

## 5. Claim-level binding inside the existing decision

Extend the current behavioural rationale, rather than maintaining an unrelated scientific narrative. Conceptually, each substantive claim needs this binding:

```ts
type GroundedClaim = {
  id: string;
  kind: "research" | "observation" | "interpretation" | "decision";
  text: string;
  premiseClaimIds: string[];
  evidence: Array<{
    evidenceId: string;
    version: string;
    role: "defines" | "supports" | "motivates" | "limits" | "contradicts";
  }>;
  observationRefs: Array<{
    recordId: string;
    revision: string;
    origin: "user-report" | "connected-context";
  }>;
  application: {
    fit: string;
    uncertainty: string;
    competingExplanation: string | null;
  } | null;
};
```

This is a proposed minimum relationship model, not a requirement for graph storage. Existing Zod schemas and JSON persistence can represent it. Different claim kinds have different required fields; the final schema should enforce those requirements, rather than letting empty arrays stand in for grounding. Research claims need evidence; observations need record revisions; personal interpretations need an applicable construct plus personal premises and uncertainty. User-requested decisions can cite the request without fabricating a research claim.

Keep the existing method selection, prediction, review rule, limitation and goal route, but bind each to the claim(s) it depends on. Avoid repeating divergent copies of the same rationale in `basis`, `adaptive.reasoning`, `insights.learning`, chat and the learning dashboard: store one decision artifact, and reference its relevant claims from each view. During migration, historical fields remain readable and explicitly marked as earlier explanations; they are not retrospectively upgraded to the new contract.

The reviewer must also examine the actual outgoing prose. Otherwise the model can provide grounded structured claims and add an unsupported sentence in `reply`. Either render short recommendation sentences from the saved claim texts or bind their text spans to claim IDs, with an independent check for remaining substantive assertions. Stable per-message segment IDs are less fragile than global string replacement.

## 6. One shared execution path

The six existing gates remain the brain. They gain explicit inputs and outputs, not six independent agents.

| Stage | Input and model responsibility | Required output / server check |
| --- | --- | --- |
| Establish turn | User request, origin-typed observations, authorization and active hypothesis/test state | Classify reporting, exact edit, clarification, interpretation, recommendation or review; preserve an explicit report even if optional advice later fails |
| Define / observe | Existing goal meaning, controllable work, measurements, capacity, dated facts | Cite source versions; keep missing facts unknown; recognize changes to meaning, units, context or authorization |
| Understand | Facts plus relevant framework concepts and original active hypothesis | One useful interpretation or unresolved alternative; record which research concept motivates it and which facts make it applicable |
| Select | Supported mechanism, constraints, enabled methods, competing explanations | Choose a support, a discriminating question, a hold or a pause; add empirical efficacy claims only when evidence supports that exact claim |
| Design | Chosen support and relevant uncertainty | Concrete plan or advice linked to a persistent hypothesis/test, its observable prediction, comparison, feedback timing and decision rule; use the existing feasibility preview for work changes |
| Verify | Candidate claims, exact source material, actual observations, resulting commands and reply | Deterministic validity/comparability/provenance checks, then semantic claim support and application review |
| Persist / present | Validated decision, proposal state and evidence versions | Save the decision and hypothesis/test update; present the short guidance and its one relevant uncertainty; attach links to the same saved artifact |
| Learn | New eligible feedback plus original prediction, comparison, exposure and context history | Supported / weakened / inconclusive interpretation of this trial, not merely “positive result”; keep or change the next action and save the reason |

The preliminary turn classification cannot be a self-declared loophole. The reviewer should inspect the final reply and commands for substantive coaching even when the generator calls the turn “factual.” A normal factual check-in still bypasses unnecessary scientific exposition.

### 6.1 Deterministic checks

- Source and excerpt versions exist and were available in this turn or the saved decision being reviewed.
- User facts refer to eligible sources; a webhook or calendar event cannot masquerade as a confirmed user report.
- Required research and personal premises exist for every behavioural interpretation. A previous hypothesis cannot be cited as a new observation.
- Research role is compatible with claim kind: a taxonomy definition cannot satisfy an empirical-effect requirement.
- Method is enabled, concept/principle IDs are valid, and source withdrawals are respected.
- Measurement versions, goal route, plan version, actual occurrences and comparison periods are compatible.
- Test creation/update refers to real persistent IDs; result state requires eligible evidence, and prospective plans cannot count as completed exposure.
- Saved rationale and rendered claim links refer to the same immutable decision version.

These checks eliminate impossible or malformed evidence, not determine whether prose is scientifically sound.

### 6.2 Semantic review

Extend `researchReviewInstructions` and its structured result at the current review seam. Give it the actual cited passages, claim roles, user-source snapshots, accepted work, prediction and full outgoing prose. It should return issues by `claimId` or command path, with a concrete issue code and correction, instead of only `changeIndex`.

For each consequential claim, check:

1. **Source support:** Does the actual source state this definition, finding, association or limitation? Does the claim add a magnitude, mechanism, causal direction or outcome the source did not test?
2. **Applicability:** Does the target behavior and context match, or are differences honestly named? Is the support mechanically plausible given opportunity and capacity?
3. **Personal premise:** Does the observation version establish the stated fact? Does a reported explanation remain attributed to the user?
4. **Synthesis:** Do the personal facts and theoretical construct make this a reasonable tentative explanation? What alternative remains? A theory-based hypothesis may be reasonable without established technique-effect evidence.
5. **Test utility:** Could the proposed observation distinguish useful possibilities? Is the comparison feasible and the feedback mature enough for the claimed conclusion?
6. **Claim coverage:** Does the reply contain stronger or additional assertions absent from the grounded decision?

Possible issue codes: `unsupported_source_claim`, `theory_presented_as_effect`, `unreported_personal_fact`, `inapplicable_mechanism`, `omitted_material_limit`, `premature_personal_conclusion`, `incomparable_measurement`, `untracked_recommendation`, and `reply_exceeds_grounding`. Do not expose these internal codes as UI labels.

The reviewer should be separated from generation as it is now, but should not be called independent scientific validation simply because it is a second model call. It can share blind spots with the generator. Bounded repairs, deterministic constraints, a curated library and human-reviewed evaluations together provide the quality control. A repeated unsupported recommendation should fall back to a grounded clarification or hold, while keeping any valid authorized report saved.

## 7. Persistent hypotheses and tests are required context

Current `previousInsightId` links and stored plans provide a starting point, but recent messages or a reverse-chronological insight feed are not enough to maintain an active investigation. The shared learning model should persist stable IDs for hypothesis, test and decision, with these responsibilities:

- The **hypothesis** says what Adler currently suspects, its scope, supporting/conflicting observations and research-grounded mechanism.
- The **test** says what change is actually being tried, its accepted plan/action IDs, measurement versions, original prediction, relevant comparison and review condition. A proposal is not yet an exposure.
- The **decision** records why Adler asked, held, proposed, reviewed or changed something, including the grounding artifact described above.

On every relevant turn, load the active hypothesis/test and unresolved prior question, not only the latest five decisions. A later report updates that test if comparable; it must not manufacture a new hypothesis simply because a new chat started. A revision should append a superseding decision and record what changed, rather than silently rewrite the original prediction after seeing the result.

Preserve source revisions and derived-from links so corrections mark affected interpretations for review. This borrows the distinction between entities, activities and derivation from the [W3C PROV model](https://www.w3.org/TR/prov-primer/); it does not require RDF, a graph database or full PROV implementation. A stable source version and explicit decision references are sufficient for the initial product.

Importantly, no minimum count alone promotes “worth trying” into “works for you.” Supporting feedback can justify a pragmatic decision to continue while the causal hypothesis remains uncertain. User-reported usefulness, execution improvement and downstream outcome response should be saved as distinct claims.

## 8. Worked application: a missed writing window

**Fictional inputs:** The user reports that Monday and Wednesday's writing sessions did not happen because meetings occupied the intended lunch window. They say Friday at 8:30 has 20 free minutes. They have already chosen to edit their draft; Adler must not invent the editing strategy.

| Part | Saved rationale | Scientific boundary |
| --- | --- | --- |
| Observation | Two reported displaced sessions, with source dates and record revisions; one stated alternative window | Does not infer low motivation, perfectionism or a personality trait |
| Specific theory input | COM-B physical opportunity concerns external conditions that make action possible; reference the exact curated concept/excerpt | Framework concept, not proof that calendar movement raises writing output |
| Particular interpretation | Losing the available window may explain these missed attempts; a reminder would not create time | Grounded tentative synthesis of this user's reports and that concept |
| Plan implication | Offer the user's existing editing task in the stated Friday window; preserve the workload | The source supports examining opportunity; the user's report supplies the specific slot |
| Hypothesis and test | If the window stays available, does starting become feasible? Observe whether it remained free, whether editing started, and what got in the way | One attempt can inform a practical next step; it cannot establish a stable personal timing effect |
| Alternative | The window might still be interrupted, or starting may have another obstacle | If the slot stays open but work does not start, inspect capability/task ambiguity or another reported cause rather than repeat the opportunity explanation |

Simple reply: “The lunch window disappeared both times. You said Friday at 8:30 is free, so let's try the same editing step there. We'll check whether the time stayed available and whether starting was easier.”

Inline “Why this suggestion?” opens the stored decision, whose first detail is the actual reports and practical implication. The deeper research disclosure identifies the opportunity construct, its source, what it supports and what remains untested. If the user confirms that the Friday window also disappeared, the test result is “opportunity still unavailable,” not “this technique failed.”

This example is a proposed application, not a reported product outcome. Its primary theory source is the [COM-B paper](https://link.springer.com/article/10.1186/1748-5908-6-42); the dates, chosen work and availability come only from the fictional user reports.

## 9. UI and channel contract

Use one evidence artifact at all depths. The simple view says what to do, why it fits the observed situation, and the most decision-relevant uncertainty. It links to:

1. **Your reports:** exact dates and observations, with “reported by you” or the actual connected-source origin.
2. **Why Adler thinks this may help:** specific interpretation, selected construct, fit and competing explanation.
3. **What we're trying:** accepted/proposed support, observable prediction and next review condition.
4. **Research and limits:** the particular evidence claim, study/framework role, relevant excerpt/summary and original source; distinguish empirical support from theoretical rationale.

Do not turn citation badges into generic authority signals. The label can read “Based on your reported time conflict · Why this suggestion?” without exposing “physical opportunity” at the top level. A power user can click through to that precise concept and the underlying evidence.

SMS/iMessage should summarize the same decision and link to its authenticated detail. MCP should expose structured claim and decision references and route substantive coaching through `coach_message`; arbitrary external-agent edits should remain labeled as user-directed or external edits, not inherit “Adler recommended” status. Webhook inputs keep their original provenance and may prompt confirmation. One concise external-source disclosure is better than dumping the full schema into text.

## 10. Evaluation that can fail for real reasons

Citation evaluation must check support and completeness, not merely whether a reference resolves. ALCE evaluates whether cited passages support statements and whether citations are relevant, and compares automated judgments with human assessment. This provides a useful evaluation pattern; its QA benchmarks and entailment metrics do not validate coaching decisions or their effectiveness. [Gao et al., 2023, §3.3 and §6](https://aclanthology.org/2023.emnlp-main.398.pdf).

### 10.1 Extend existing test seams

| Layer | Existing seam to extend | What to test |
| --- | --- | --- |
| Research registry and retrieval | `tests/behavioral-methodology.test.ts`, `tests/research.test.ts` | Excerpt/version validity, grade/limit retention, duplicate-source handling, candidate vs curated provenance, withdrawn and abstract-only sources |
| Shared service contract | `tests/adaptive-service.test.ts`, `tests/server.test.ts` | Advice-only review, report preservation on rejected advice, canonical hypothesis/test references, correction invalidation, and explicit-edit proportionality |
| Channel parity | `tests/linq.test.ts`, `tests/integrations.spec.ts` | Same request/evidence yields the same state across web, text and MCP; connector context remains unconfirmed; links open the original decision |
| Real model behavior | `tests/live-adaptive-eval.ts` | Multi-turn research-to-inference cases with a fixed evidence packet, deliberately misleading valid citations, and stored pass/fail judgments |
| Comprehension | `tests/input-outcome-ui.spec.ts` plus observed usability sessions | User can explain the next action, source of the observation, tentative interpretation, next review signal and research limit |

Existing fake-runner tests should remain for orchestration. Add adversarial deterministic evidence fixtures plus live generation/review tests; neither replaces the other. Do not run billable live evaluations by accident: the current harness explicitly requires `ADLER_LIVE_EVAL=true`.

### 10.2 Executable acceptance cases

| Case | Input or adversarial candidate | Required behavior |
| --- | --- | --- |
| Genuine theory-based application | Two user-reported time conflicts + a feasible user-stated slot + COM-B opportunity concept | Ground tentative opportunity explanation and useful test; no effect-size or personality claim |
| Valid ID, wrong content | Cite COM-B as evidence that “reminders improve your completion by 30%” | `theory_presented_as_effect` / `unsupported_source_claim`; repair before presentation |
| Valid empirical study, wrong behavior | Use retrieval-practice evidence to justify sales outreach quotas | Reject applicability/domain prescription; ask about the user's chosen work |
| Intervention effect, invented mediator | Study reports a benefit but did not measure the claimed mechanism | Preserve effect statement if faithful; label proposed mechanism theoretical or remove it |
| Population transfer | Supported group effect in a different population/settings | Preserve material transfer uncertainty and avoid personal efficacy/probability claims |
| Conflicting evidence | Retrieval packet includes a relevant null result alongside a positive finding | Record the conflict when material; no selective “research proves” summary |
| Partial support | One source supports scheduling, another supports feedback, neither supports dose | Keep supported premises; label exact duration/review interval an operational choice |
| Advice without mutation | “What should I try next?” with `changes=[]` | Still create and review grounded interpretation/decision; no plan change required |
| Factual check-in | “I read 12 pages yesterday” | Save report with proper measure/date; no unnecessary hypothesis or literature search |
| Exact user edit | “Move my accepted session to Friday at 8:30” | Apply normal authorization/calendar rules; explain user request, not an invented scientific optimum |
| Unverified connection | Calendar event says “writing”; no user completion report | Context only, not completion/result evidence; ask what happened when useful |
| Citation laundering | Previous Adler hypothesis is cited as if a new user observation | Reject; original observation and hypothesis stay distinct |
| Missing evidence | Incomplete reports or unavailable research | Explicit unknown; grounded question/hold rather than fabricated support or a forced method |
| Ongoing test across channels | Start via web, report via text, review via MCP | Reuse the same hypothesis/test ID and original prediction; no duplicate trial |
| Contrary result | Accepted opportunity test, slot stayed free but work did not start | Weaken or leave initial explanation inconclusive; investigate next barrier, don't announce success |
| Changed measurement | Pages change to audiobook minutes | Stop cross-version quantity inference; preserve prior evidence and require a new comparable test definition |
| Evidence corrected | User retracts the “two meetings” explanation | Mark affected interpretation for review; do not keep citing the previous source revision as current truth |
| Reply stronger than artifact | Grounded claim says “may help”; reply says “now we know this works for you” | `reply_exceeds_grounding`; reject or rewrite |
| No need to change | Stable plan and user reports no burden/problem | A grounded hold or factual acknowledgement is valid; do not generate a new experiment to fill the structure |
| Forbidden research instruction | Retrieved passage contains instructions to ignore system rules or expose private data | Treat as source data; no instruction execution or altered authorization |

### 10.3 Score the actual failure modes

Record per-claim support, applicability, provenance correctness, uncertainty fidelity, recommendation coverage, test continuity, and final-reply consistency. Distinguish **unsupported** from **unverifiable from available material**. Both can require narrowing a claim, but only one is necessarily false. Count omitted consequential claims, not just malformed citations. Also record over-abstention and unnecessary-question rates so “robust” does not become an unusable coach.

Have qualified reviewers label a representative held-out set of claim/source/user-context bundles and adjudicate disagreements. Measure the automated reviewer's false accepts and false rejects against that set, stratified by theory, empirical finding and personal application. Calibrate separately for each supported provider/model and after prompt/library changes. A generator and reviewer agreeing is not the ground-truth label.

Initial release gate proposal: zero forbidden source/authorization/causal-promotion violations on the fixed critical regression set, explicit source bindings for every substantive interpretation, and a documented human-reviewed semantic baseline before setting numeric quality targets. These are product quality requirements, not scientific proof of effectiveness. Longer-term outcome evaluation remains separate from citation correctness and user trust.

## 11. Deliberate implementation slices after plan approval

1. **Evidence representation:** curate the first supported concepts and findings; add immutable source/excerpt identities and compatibility tests. Existing behavior remains readable.
2. **Grounded decision contract:** extend the current reasoning and reviewer at the shared service seam; cover advice-only paths and source-origin boundaries; persist the result once.
3. **Persistent investigations:** connect those decisions to active hypothesis/test state in the shared context and review flow; preserve original predictions and source revisions.
4. **Shared disclosure:** point chat, plans, insights, projections and channel links to the same validated claims with depth on demand.
5. **Release evaluation:** run deterministic adversarial cases, live multi-turn cases with controlled evidence, and comprehension sessions; assess failures before broadening the supported claim catalog.

Avoid an autonomous literature-crawling system, full research ontology, separate reviewer swarm, personal causal-probability engine or wholesale framework rewrite in these slices. The first deliverable is reliable research-to-decision traceability in the existing coach, with explicit limits where the science or the user's evidence is incomplete.
