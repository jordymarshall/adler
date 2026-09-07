# The Adler Method — current app contract

Version: `besci-coaching-v1`. This is the operational method for the current shared web, text and MCP coach. Screens, prompts, schemas and evaluations must follow it. It implements the research as a decision process, with explicit limits on what the app currently measures and can infer.

## Source hierarchy

1. The user's current product instructions and explicit choices govern scope, autonomy and interaction design.
2. This document defines the current implementation and resolves older product mechanics.
3. [Behavioural science synthesis](../research/behavioural-science-synthesis.md) supplies P1–P36, evidence grades, resolved conflicts, population/transfer limits, tailoring, and the limits of individual inference. It was recovered from commit `472e979` on `swift-ai-goal-coach-app`; it was absent from the web branch. Its [23 deep dives](../research/deep/README.md) and companion research provide supporting citations and qualifications.
4. [Research baseline v0.5](research-baseline-v0.5.md) preserves the earlier method unchanged for provenance. Its intake scripts, numerical gates, deployment architecture and unimplemented statistical/safety systems are historical design, not claims about current runtime capabilities.

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

New coach-created plans and recommended revisions save `adaptive.reasoning`. New learning records save the same structure in `insights.learning.reasoning`. It contains synthesis principle IDs, goal route, exceptions to defaults, a sourced barrier, enabled primary method, cited research, mechanism, personal fit, observable prediction, review rule and limitation.

Service checks reject unknown/disabled methods, invented principles or source IDs, unsupported barrier records, generic hypotheses without a rationale, conclusions without reported results, and links to nonexistent earlier insights. They retain the cited source excerpts, framework version and IDs of consulted deep dives. A separate model review checks semantic fit: valid IDs alone do not prove that a source supports an inference. Rejected output receives bounded repair feedback before any recommendation is saved.

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

Goals show actual activity and outcome evidence separately. Calendar identifies Adler work and preserves the surrounding commitments. Insights uses a straight reasoning path with observation, hypothesis, test, result, inference and next question. Framework fit, predictions, limits and original sources are available in disclosures. Existing records remain readable and become eligible for review; no historical inference is silently strengthened.

Future product work must identify which gate and principle it serves, whether its numbers are evidence-derived or heuristics, what observable behaviour it supports, and what it must not infer. Verify the relevant behavior and evidence boundary. A visual redesign cannot silently introduce a different coaching method.
