# Core goal and learning clarity

Current user priority: fix the shared coaching product and learn from Statsig’s experimentation process. Defer the Today timeline redesign. Research: [Statsig and Linear](research/statsig-linear-coaching.md).

## Preservation contract

- Actual app captures lead landing demonstrations; do not replace them with invented UI.
- Keep the approved headline, three mobile screens and immersive opening graph.
- Keep the full behavioural-science framework, claim citations and shared coach across every channel.
- Use chronology, dependency and input→outcome relationships for visual structure. Decorative equal cards are not a substitute.
- Keep observed input, reported outcome, hypothesis, pending change and conditional projection distinct.

## Plan and verification

- [x] Research Statsig setup, measurements, evidence, decisions and history; verify key sources and distinguish transfer limits.
- [x] Reproduce the missing setup state through the actual manual goal flow.
- [x] Fix setup defaults at the shared coach boundary; verify complete and incomplete plan outputs.
- [x] Give manual/older goals a useful starting timeline and honest tracking state without inventing commitments.
- [x] Organize the goal home with a visible section index, current work, horizon, progress and learning.
- [x] Show the starting point and successive test/review versions in the learning journey.
- [x] Make Check-in prompts specific to the current action/test while using the same conversation.
- [x] Restore actual app demonstrations to the landing journey and refresh captures after app changes.
- [x] Verify affected regressions, full checks, accessibility and independent code review.
- [ ] Commit and push main.
- [ ] Deploy and verify withadler.com with durable backend storage (external hosting dependency).

## Current diagnosis

`npx playwright test tests/adler.spec.ts --grep 'manual goal setup' --reporter=line` reproduces “Choose the first cycle” after a saved manual plan. The saved action was real; the page failed to present it as a starting plan. This regression now passes with the actual first action, a starting timeline and chosen tracking. The shared AI creation boundary already requires adaptive plans, so that path must be tested separately rather than assuming it has the same cause. Projection setup was optional and the graph conflated missing projection with missing tracking. The shared creation boundary now repairs an omitted projection decision, and the UI keeps chosen tracking visible for numeric, milestone and qualitative goals.

## Verification

- 109 server tests passed, including a failing-then-passing shared MCP goal-creation repair case. The same service handles web, messaging and jobs.
- 68 browser tests passed: manual and coach setup, legacy upgrade, durable learning versions, contextual Check-in, quantitative/qualitative tracking, projections, account isolation, mobile, keyboard and accessibility. Follow-up learning checks cover the final discussion-prompt wording.
- `npm run build` and `git diff --check` passed. The existing single-bundle size advisory remains.
- Independent standards/spec review found and resolved: wrong projection-driver label, hidden qualitative tracking, lost legacy evidence links, suggested-test exposure prompts, and reversed screenshot chronology.
- Inspected actual app captures and desktop/mobile pages. Phone gathering, static reduced-motion presentation, and 390/820/1024px width checks passed. Ordinary app text is neutral; headings and graph/goal colours retain meaning.

## Deployment dependency

The Vercel `adler7/adler` project and withadler.com domain are linked. No hosted backend exists and no production persistence checks have passed. The free Turso marketplace database option was investigated; Vercel returned `integration_terms_acceptance_required` before provisioning. No installation or charge was created. User action is pending at the [Vercel terms screen](https://vercel.com/adler7/~/integrations/accept-terms/tursocloud?source=cli). Database acceptance alone is not a deployment: the current persistent Node runtime still needs hosting or a separately verified serverless/database migration. Do not bypass `ADLER_BACKEND_URL` validation to publish a broken app.
