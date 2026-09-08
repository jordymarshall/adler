# Shared coaching system implementation

Started 7 September 2026. Authorized scope: implement the accepted product principles, experience plan and engineering design, commit/push to main and deploy. Starting implementation baseline: `fbc804e`.

## Delivery rules and verification

Extend the existing shared service and versioned workspace. Preserve existing accounts and historical records honestly. Use the full P1–P36 methodology; curated claims supplement it with specific source support. Scientific reasoning is reviewed before presentation, with bounded repair and a useful fallback. Exact user commands remain proportionate.

The agreed verification boundaries are the shared command/workspace API, coaching service (including provider output validation), projection outputs, and browser journeys. These exercise externally observable behaviour rather than private implementation. Validate affected cases per slice, typecheck regularly, then run the complete server/browser suites and production build. Review the complete diff against the accepted design before release. Live provider, hosted deployment and real-user effectiveness checks must be reported separately from deterministic tests.

## Checklist

- [x] Commit accepted guidance and push to main (`fbc804e`).
- [x] A. Specific research grounding
  - [x] Add versioned, scoped research claims for supported methods with primary passages/locators, source access, evidence roles and limits.
  - [x] Bind personal interpretations to exact observation and research revisions; distinguish supports/defines/motivates/limits/contradicts.
  - [x] Use curated evidence first; retrieve primary literature for a material unresolved gap, without mandatory searches for routine planning.
  - [x] Validate source eligibility and semantic support, including actual advice-only reply text; retain review provenance and bounded repair.
  - [x] Verify wrong-claim/right-citation, inappropriate transfer, withdrawn evidence and unknown context cases.
- [x] B. Durable learning and corrections
  - [x] Persist goal-linked hypotheses, prospective tests, immutable revisions, predictions, review timing and scientific standing.
  - [x] Keep proposed/agreed/active/reviewed state separate from exposure, mechanism observations, behaviour and outcome.
  - [x] Record original source revisions, preserve aggregates and avoid duplicate cross-channel exposure.
  - [x] Review with missingness, feedback delays, competing explanations and practical keep/change decisions; scope cross-goal transfer.
  - [x] Reconsider dependent learning after correction, removal, measurement change or research revision; retain honest historical records.
  - [x] Keep observations/preferences usable without requiring a test; migrate existing workspaces without invented experiments.
- [x] C. One system across interactions
  - [x] Include active hypotheses/tests, pending decisions, relevant confirmed context and capacity across goals in shared context.
  - [x] Route intelligent app actions, chat, messaging, MCP and background reviews through the same service, tools and authorization.
  - [x] Type report origin; connected/background context cannot become user-reported evidence.
  - [x] Preserve request identity, revision checks and proposal/booking idempotency.
  - [x] Keep valid reports if optional coaching fails; display actual saved/pending state.
- [x] D. Planning and projection integrity
  - [x] Choose action size, cycle and review conditions by meaningful work, opportunity, feedback timing and user capacity.
  - [x] Remove fixed intake/cycle requirements and inappropriate forced experiments.
  - [x] Keep unknown activity distinct from zero and separate action adherence from outcome progress.
  - [x] Fix stale projection origin, incompatible measures and sparse/collapsed ranges; preserve conditional forward graph with explicit assumptions.
  - [x] Invalidate obsolete planning rationale after manual meaning changes.
- [x] E. Clear complete app journey
  - [x] Preserve the user's goal through authentication/setup; reach a feasible first action without a methodology questionnaire.
  - [x] Put the next action first on Today, with one canonical Check-in.
  - [x] Present pending recommendations with Try this / No thanks / Discuss / Edit and observation/science/expected effect.
  - [x] Link progressive evidence disclosure to the saved decision and specific sources.
  - [x] Build Insights around observations, live tests, review timelines and learned implications; expand a clear reasoning path.
  - [x] Align goal detail/portfolio, calendar, settings and public method with those meanings; retain outcome projection graph and goal colours.
  - [x] Keep provider configuration honest and optional when a managed provider is actually available.
- [x] F. Landing and connections
  - [x] Preserve the selected headline, five sections and visual style; demonstrate a report leading to adjustment early.
  - [x] Use focused, readable real-product demonstrations with one focal change and the same fictional reading goal.
  - [x] Distinguish goals, calendar, progress and learning; preserve projection/range in 03 and multiple insights with detail in 04.
  - [x] Keep centre Adler phone, clear shared-channel/calendar value and accurate integration availability.
  - [x] Support static/reduced-motion/mobile comprehension and pause/manual progression.
- [ ] G. Release verification
  - [ ] Run affected deterministic and multi-turn cases, full server suite, full browser suite, accessibility checks and production build.
  - [x] Evaluate live generation/review where credentials are available; record limitations without claiming clinical or causal efficacy.
  - [ ] Review standards and spec coverage against `fbc804e`, fix material findings, and update the current method with delivered capabilities.
  - [ ] Commit implementation, push main and verify remote commit.
  - [ ] Deploy frontend and persistent backend, verify health and authenticated persistence through the canonical site, and record the actual URL/status.

## Release record

Core implementation is complete. The [verification record](evaluation/shared-coaching-v2.md) describes the checks, limited live evaluation and material limitations. Final review and release status are recorded below. Advanced causal experiments, calibrated probabilities and long-term effectiveness are separate research capabilities in the design; do not label them implemented without their required data and validation.


- Full server suite: 103/103 passed.
- Production build/typecheck: passed, with a non-blocking bundle-size advisory.
- Browser suite: 66 scenarios; final rerun pending after fixing the send/draft race.
- Landing captures: regenerated from the actual app with a fictional reading workspace; desktop/mobile progress and learning inspected.
- Live provider: reading-plan and context-correction flows completed with checked claim references. First plan required repairs; this is limited smoke evidence, not expert adjudication or proven efficacy.
- Deployment: blocked by the missing Adler hosting target and persistent backend. Existing Vercel login can access only the unrelated `rio-domingo` project. Backend origin and hosting access have been requested; no hosted Adler URL verified.
