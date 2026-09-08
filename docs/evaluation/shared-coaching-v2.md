# Shared coaching v2: release verification

Implementation date: 7 September 2026. Baseline: `fbc804e`. Scope: the accepted [product principles](../product-principles.md), [experience plan](../product-core-and-experience-plan.md) and [engineering design](../method/coaching-engineering.md). Completion is tracked in the [checklist](../implementation-checklist.md).

## Delivered boundaries

- The shared service owns research-grounded planning, advice, personal learning and review across app chat, intelligent app requests, messaging, MCP and jobs. Ordinary explicit commands remain deterministic. API/MCP clients cannot attach new scientific rationale without shared review.
- Twelve versioned, scoped claims cover the seven enabled methods and supplement the full P1–P36 synthesis/deep-dive library. Exact claims, personal evidence revisions and automated review provenance are saved. Actual outgoing advice is reviewed, including advice without a plan mutation.
- Goal-linked learning retains prospective predictions, current versus proposed revisions, agreement state, review timing, reported use, mechanism/behaviour/outcome feedback, alternatives and practical decisions. Corrected context changes current authority while preserving the original account.
- Onboarding retains the goal/draft; Today leads with the next action; Check-in contains recommendations and their controls; Insights exposes live learning and specific research with progressive disclosure. Historical context remains reachable. The goal graph retains its full-horizon conditional range and explicit assumptions.
- Landing demonstrations use one fictional reading example and actual desktop/mobile product captures. Static/manual/pause alternatives remain available. Connection demos identify setup requirements.

## Deterministic and browser checks

`npm run test:server`: **108 passed** in the complete run after the workspace retry and concurrent database opening fixes. Coverage includes unsupported grounding, semantic-repair stubs, raw scientific-write rejection, corrected premises, proposal/learning agreement, measurement changes, unknown activity, sparse outcome projections, stale/repeated requests, provider configuration, origin/account isolation, messaging and calendar idempotency.

The complete browser suite contains **67 scenarios**, including accessibility assertions on mobile/desktop, navigation, first goal, scheduling, recommendation controls, live learning, linked evidence, correction-related states, real capture playback and reduced motion. All 67 passed in the final full run, including the added exact-version acceptance journey. Review findings are recorded below and in the checklist. A final send-completion assertion exposed a real draft race: a newly saved conversation could arrive over SSE before the coach response and restore the old contextual prompt. The composer now keeps the in-flight draft and clears both relevant draft keys after success.

`npm run build`: TypeScript and Vite production build passed. Vite reports the existing large client bundle advisory; it is not a failed build or a measured performance guarantee. Landing captures were regenerated with `npx tsx scripts/capture-landing.ts` and visually inspected for the progress fan, current learning and readable evidence.

Tests substitute model output where deterministic scenarios require precise failure cases. They establish regression behaviour, not independent scientific correctness of a model. Browser coaching fixtures use an isolated test database; production HTTP exposes no fixture bypass.

## Limited live provider evaluation

`scripts/evaluate-coaching.ts` runs the actual service/provider/reviewer in temporary fictional accounts; it removes its temporary database and stores local results under `.context`. No private user records or real calendar writes are used.

Provider tested: Gemini, `gemini-3.8-flash`. The initial full smoke run exposed an incomplete plan at the old output limit. Ambiguous revenue work and an opportunity-related advice-only conversation completed without inventing a business strategy or personal outcome rate. After bounded incomplete-output repair, the 12,000-token output limit and deterministic attachment of source bookkeeping, the focused reading/correction run completed:

| Scenario | Observed result |
| --- | --- |
| Read 30 books with a stated reading opportunity | Draft plan, suggested/untested learning and specific implementation-intention claims; semantic review saved. The earlier run took about 29 seconds with two repairs; the final run took about 21 seconds with one repair for an inclusive-date capacity overrun. |
| Correct the availability behind that draft | Original account retained, dependent hypothesis marked for reconsideration, clarification requested; no invented test result. About 4 seconds in the final run (about 5 seconds earlier). |

The script's `passed` field means the request completed the protocol; it does not mean an expert endorsed the content or the intervention helped. Generation/reviewer reliability across providers, false acceptance/rejection rates and comprehension with real users have **not** been measured by these few examples. Model latency and repair frequency remain material product limitations. Do not use the smoke run as an efficacy or first-pass reliability claim.

## Standards review

Fixed baseline `fbc804e`, implementation commit `967c60d`, then working-tree corrections. The independent standards review found three hard state-integrity defects: a standalone revision could not be decided, saving unrelated work could accept advice, and reviewing an old test could suppress its replacement. All three were corrected and rechecked. Learning actions now share exact-version transitions across chat/API/MCP, and regression cases preserve agreement, pending versions and the prior review.

## Spec review

The independent requirements review found corrected memory being reintroduced in a confirmation check, unrelated report/advice agreement, and silent exclusion of decreases/zero-input outcome periods. Its follow-up found a new suggestion could remain hidden after its predecessor was declined. All four were corrected. Current context uses one correction-aware collection; excluded periods retain reports/reasons and ambiguous returns are withheld; revised unstarted suggestions become visible and actionable. Starting a goal also cannot accept unrelated pending advice.

Review counts: **Standards 3 resolved, 0 open; Spec 4 resolved, 0 open** within the reviewed changes. This is code review, not scientific adjudication or a production effectiveness study.

## Interactive presentation and production smoke

The user's follow-up about intuitive, structured pages is recorded in the product principles. Position now explains the relationship: personal observations and specific research meet at a working explanation; the action holds its controls and review timing; later feedback follows. Recommendations lead with the actionable choice. Plain observations connect context to a planning implication without empty experiment stages. Supporting detail expands in place, and conversation replies retain readable paragraphs/lists and record links. Updated actual-app captures were checked on desktop and mobile.

The follow-up against `ec811ef` passed both review axes with no new findings. Seven affected browser journeys passed. A separate desktop/mobile Check-in inspection found and corrected a skipped heading level; the subsequent accessibility, overflow, evidence disclosure and contextual Discuss checks passed at 1320px and 390px. These are implementation checks and visual inspection, not a user comprehension study.

The final full run initially exposed connection contention and a premature booking-test assertion. A minimized worker test reproduced the database lock; configuring its existing wait timeout before journal setup fixed it. The booking trace showed the work block persisted normally after the test had already read the earlier revision. A gated response now verifies retry stays disabled until confirmation finishes before checking persistence. Both reproductions passed after correction; both review axes found no further issues.

The built Node server was started locally with production configuration in an isolated temporary data directory. A real account created a manual goal through the browser; after a complete server restart, the same session could read the same goal. Anonymous access was refused and a second account remained empty. Built assets were served successfully. The smoke removed its temporary accounts/data afterward. This verifies the local production process and persistence path, **not a hosted deployment**.

## What remains separate

- Independent domain-expert adjudication of claims and held-out model/reviewer examples, followed by user comprehension and longitudinal effectiveness studies.
- Formal randomized individual experiments, calibrated goal probabilities, causal input–outcome estimates and hierarchical/adaptive-policy evaluation. Current scenario bands are explicit heuristics, not calibrated confidence intervals.
- Full source coverage beyond the initial claim registry. Candidate retrieval cannot silently become source-checked authority.
- Production host verification and real external-account messaging/calendar checks. The available Vercel account exposes an unrelated project and no Adler persistent backend URL is configured. Do not deploy Adler over that project or count frontend assets alone as the running app. See [deployment requirements](../deployment.md).
