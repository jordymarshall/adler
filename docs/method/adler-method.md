# The Adler Method — current app contract

Version: `besci-coaching-v2`. This is the operational method for the current shared web, text and MCP coach. Screens, prompts, schemas and evaluations must follow it. It implements the research as a decision process, with explicit limits on what the app currently measures and can infer.

The user's accepted direction is recorded in [governing product principles](../product-principles.md). The [engineering design](coaching-engineering.md) explains claim-level grounding, live hypotheses/tests and the shared system. The [implementation checklist](../implementation-checklist.md) and [release verification](../evaluation/shared-coaching-v2.md) distinguish delivered code, measured checks and outstanding hosted/external validation. The earlier [product review](../scientific-disclosure-product-proposal.md) is the audit that motivated this work.

## Source hierarchy

1. The user's current product instructions and explicit choices govern scope, autonomy and interaction design.
2. [Governing product principles](../product-principles.md) preserve the accepted product direction for future iterations.
3. This document defines the current method and resolves older product mechanics; [the engineering design](coaching-engineering.md) specifies the target implementation with its status explicit.
4. [Behavioural science synthesis](../research/behavioural-science-synthesis.md) supplies P1–P36, evidence grades, resolved conflicts, population/transfer limits, tailoring, and the limits of individual inference. It was recovered from commit `472e979` on `swift-ai-goal-coach-app`; it was absent from the web branch. Its [23 deep dives](../research/deep/README.md) and companion research provide supporting citations and qualifications. The newer [grounding](../research/coaching-grounding-engineering.md) and [individual-learning](../research/individual-learning-methodology.md) research distinguish specific source support from proposed engineering choices.
5. [Research baseline v0.5](research-baseline-v0.5.md) preserves the earlier method unchanged for provenance. Its intake scripts, numerical gates, deployment architecture and unimplemented statistical/safety systems are historical design, not claims about current runtime capabilities.

This hierarchy resolves product direction and implementation status. It does not let a product requirement strengthen a research finding or override a primary source's actual scope.

The synthesis and underlying research were authored in the repository. Importing them does not independently verify every statistic, establish clinical efficacy, or update their legal references. Research claims retain their grade and population limits. Current medical/legal guidance requires current appropriate sources; the coach does not provide treatment or legal compliance advice.

## Deliberate decision path

| Gate | Research that informs it | What Adler must establish | Saved or visible output |
| --- | --- | --- | --- |
| Define | P9–P12, P26–P29; values, autonomy, goal definition | The person's own reason, chosen work, meaning of success, deadline flexibility and goal type | User-owned goal, outcome and controllable input; ask only a consequential missing question |
| Observe | P1, P3–P5, P14–P15, P19, P25 | Dated reports, useful successes and difficulties, capacity across goals, missing evidence | Counts and quantities; observed context; source links; no invented completion or personality evaluation |
| Understand | P7, P16–P18, P20, P22, P24, P27–P29; COM-B | Reported constraint vs tentative explanation; setup, capability, opportunity, motivation, or an unresolved distinction | Sourced barrier with reported/tentative/unknown status; structural constraints considered before internal explanations |
| Select | Applicable P principles plus the enabled technique catalog | A supported mechanism that fits this person and goal, with a real source and transfer limitation | Primary method, synthesis principle IDs, mechanism, personal fit, limitation and relevant research excerpts |
| Design | P2, P8, P10, P20–P24, P29, P35–P36 | Feasible action or support, useful comparison, observable prediction, feedback timing and review rule | Reviewable adaptive plan with controllable work, cue/fallback when useful, measurement model, goal route and exceptions |
| Learn | P3–P6, P14–P18, P24, P29; synthesis §3–5 | Whether feedback tests the prediction, confounds, changed action size, weak outcome response, remaining uncertainty | Sourced result; tentative inference; keep, adjust, clarify, pause or maintain; next question linked to earlier reasoning |

The complete synthesis is supplied in every agent turn, not just a list of framework names. A bounded `methodologyRequests` tool reads full documents from the owned research library. It accepts known document IDs only. The agent uses deeper reading when the synthesis leaves mechanism, applicability or conflict unresolved, then can search current scientific literature through the existing Europe PMC/Crossref tool. The evidence reviewer receives the same synthesis, selected readings, sources and actual user records.

## Inference contract

New coach-created plans and recommended revisions save `adaptive.reasoning`. Advice-only interpretations also save a recommendation or learning rationale. It contains synthesis principle IDs, goal route, exceptions to defaults, a sourced barrier, enabled primary method, cited research, mechanism, personal fit, observable prediction, review rule and limitation. Grounding binds the application to specific claim IDs and exact versions, distinguishing supports, defines, motivates, limits and contradicts.

The initial [claim registry](../../shared/research-claims.ts) has twelve scoped records across the seven enabled methods. It supplements the full synthesis and does not verify every assertion in it. [Curation provenance](../research/claim-curation.md) records primary-source access, locators and limits. Source checking was AI-assisted, not independent expert certification. Curated evidence comes first; deeper owned reading and primary literature retrieval address material unresolved gaps. Retrieval does not promote a candidate into a verified claim.

Service checks reject unknown/disabled methods, invented principles or source IDs, outdated or withdrawn claims, unsupported barrier records and conclusions without eligible reports. Decisions retain source/claim snapshots, personal evidence revisions, framework/readings and model-review provenance. A separate model invocation checks semantic fit and the actual outgoing advice, including replies without plan changes. It receives the actual records and proposed learning. Valid IDs alone do not establish support. Rejected output receives bounded repair before a recommendation is saved. Automated review can still make mistakes; it is not an expert label or efficacy guarantee.

If reasoning cannot pass review, the system preserves an eligible user report without saving unsupported advice. Connected context and scheduled jobs are typed separately and cannot certify performed work. Raw app/MCP mutations cannot add new coaching rationale around this review path; explicit manual choices can be saved without attaching invented science.

## Durable learning and current authority

`Data.learning` owns goal-linked hypotheses, test versions, agreement events, reviews and invalidations. A proposed revision remains separate from the active version until accepted. Original predictions, source fingerprints and review rules remain historical records; new feedback does not rewrite them. Ordinary reported context and preferences remain usable without inventing a test.

Workflow (suggested, agreed, paused, reviewed, closed or declined) and evidence standing (untested, insufficient, consistent, mixed, inconsistent or reconsider) are separate. The view derives waiting/active/review-due labels from dates. Reviews distinguish unknown, untried and used support, mechanism evidence, behaviour, ultimate outcome, confounds and a practical keep/change decision. Dates initiate review; they do not establish that a hypothesis worked. New feedback must be eligible and cannot merely reuse all already-reviewed reports as fresh support. Aggregate accounts remain accounts; source counts are not exposure counts.

Corrections retain the original account and explicit replacement references, remove corrected context from current confirmed memory, and mark dependent learning for reconsideration. Source deletion/change, measurement changes and withdrawn claim versions also change current authority. A corrected draft cannot be started on its old rationale. Manual meaning changes discard obsolete scientific plan rationale; unchanged historical records remain inspectable. Applying learning to another goal requires a scoped transfer explanation, without creating a universal personal trait.

Web controls, chat, SMS/iMessage, MCP and background reviews use the same service, current workspace and research contract. Active learning is supplied across conversation boundaries. Request identity, workspace revisions and proposal/calendar idempotency protect writes. Learning controls agree, decline, pause, resume or close the existing record; interpretation and revision return to canonical Check-in.

Observational personal feedback does not prove a coaching intervention caused an improvement. Preserve exposure counts, changed circumstances, plausible alternative explanations and measurement changes. A two-session log cannot become a confirmed personal rule. No Bayesian probabilities, partial pooling, randomized causal estimates or false-discovery control are claimed: those research recommendations are not implemented. Conditional input–outcome arithmetic has a different purpose and is documented in [input–outcome coaching](../input-outcome-coaching.md).

## Goal-specific application and current overrides

- **Habit-shaped:** stable cues, manageable repetition, practical setup and maintenance may be useful. Task size, recurrence and review timing remain chosen from the person's circumstances.
- **Structural:** a change that stays in place needs verification and occasional review; it does not need a fabricated daily habit or shrinking ladder.
- **Session:** learning, writing and craft need useful work sessions and quality feedback. Retrieval and spacing apply when the learning task calls for them. They are not universal productivity prescriptions.
- **Campaign:** a sequence of applications, sales work or other chosen efforts needs dated steps and lag-aware outcome checks. A rejection is not failure to execute. Behavioural research cannot choose the user's acquisition channel or prescribe business quotas.
- **Dyadic or uncertain:** clarify the person's controllable action and scope; never treat another person's response as an input the user controls. Respect the synthesis's limits and safety scope.

The user's latest direction supersedes universal two-minute starts, fourteen-day holds, daily taps, mandatory weekly reviews, fixed session counts and the older 44-question intake. Keep the principle; identify when its numeric or domain-specific implementation does not transfer. Goals can take hours, days or years. One canonical Check-in conversation handles reports and reviews, supported by connected context. Missing reports remain unknown. The goal-attainment charts requested by the user show conditional scenarios with their assumptions, not success probabilities or causal findings.

Advice stays within the user's request, respects prior authorization, and keeps consequential plan/calendar changes reviewable. Do not impose repeated permission questions after the user has already requested help. No automatic escalation of notifications, imposed stakes, manufactured disagreement, identity labels, personality diagnosis, mood-benefit claims or willpower explanations. The method can acknowledge agreement, hold an approach, or park a goal without inventing a need for more coaching.

## Product consequences

Today leads with useful work and canonical Check-in. Recommendations show the practical change and its actual saved/pending state, with Try this / No thanks / Discuss / Edit where a decision is needed. Observation, behavioural interpretation and expected effect appear below, with specific sources and optional depth. Authentication and provider setup preserve the stated goal and draft. Ordinary preferences precede advanced method/history settings.

Goals show actual activity and outcome evidence separately. Unknown work does not become zero; conditional projections start today from the last reported outcome and disclose that assumption. Sparse relationships retain a wide heuristic scenario range rather than a causal or calibrated probability. Calendar identifies Adler work and preserves surrounding commitments. Insights groups current learning and reviewed history, with a straight observation → science → test → review path, dates, tentative standing and evidence. Saved context remains available in a separate disclosure. Legacy insights remain readable without invented test dates or stronger conclusions.

The landing page preserves the selected headline, established five-section style, outcome graph/range and real app captures. A short, manually explorable reading example connects a report to a tentative adjustment and later feedback before the detailed feature chapters. Fictional examples and integration setup requirements remain explicit. Motion has pause/static alternatives; screenshots do not establish product efficacy.

Future product work must identify which gate and principle it serves, whether its numbers are evidence-derived or heuristics, what observable behaviour it supports, and what it must not infer. Verify the relevant behavior and evidence boundary. A visual redesign cannot silently introduce a different coaching method.
