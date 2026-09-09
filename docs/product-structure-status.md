# Structure decisions and remaining work

8 September 2026. Reconciles the original UX grilling with the accepted prototypes and inspected application code. This is a delivery/status record, not a new product specification or a claim that the prototypes are deployed.

The user has accepted the corrected All Goals activity treatment. The compact landing-style grid belongs only in the overview. The calendar added to the individual goal was explicitly rejected and removed.

## Already decided

- One All Goals overview. Goal → Plan → Milestones → Actions expresses work ownership, through meaningful visual grouping and time. Plan, actions, milestones and progress are not separate app-level destinations.
- All Goals A and Goal C are the selected visual directions. Goal rows summarize work and its implication; a selected goal contains its plan, action controls, input evidence, outcome outlook and meaningful learning history. The grid is exclusive to All Goals.
- Current milestone work is expanded; known upcoming/completed milestones remain discoverable and can expand in place. Multiple milestones can be active. An ongoing action retains its identity and learning across milestones. A small goal need not invent an intermediate milestone.
- Each milestone leads with its own success criterion. Work completion and outcomes remain separate when they measure different things. Supported conditional projections retain their range; unknown relationships do not manufacture dates.
- One Coach handles conversation and check-ins. Contextual action controls and quick replies use the same records, with an explicit dated report and a correctable save receipt. Check/x/edit/calendar is tied to the selected action and actual state.
- Coach opened from a goal sits beside its plan on desktop, preserving the selected action and timeline. Entering Coach from navigation opens its full workspace. Mobile provides a clear return to the selected work. Both presentations use the same conversation, memory and records; the user's “ok” to the preceding placement question is recorded as acceptance.
- Proposed changes preview Current → Suggested effects in the existing plan. Acceptance, scheduling, reported use and a review result remain different events. This preview is an accepted requirement, not a newly proposed feature.
- Meaningful plan changes and reviews form the goal's learning journey. Related experiments open from the affected work and from Coach as the same record.
- Insights groups useful learning questions and scoped findings about the person. Goals are linked context and a filter. Original predictions, personal observations, cited behavioural interpretations, evidence, review timing and corrections remain inspectable. A fact need not be an experiment or insight.
- The coach chooses useful actions, measurement, cycle and learning design from the person, goal and owned methodology. There is no universal review interval, adherence target or automatic difficulty increase.

These decisions should not be repeatedly re-grilled. Their concrete interaction and difficult cases still need to be resolved or verified below.

## What is still needed

| Area | Current state | Remaining work |
| --- | --- | --- |
| All Goals | Selected A prototype, compact capacity disclosure, activity grids, input graphs and milestone outlook. The existing app also has an older goals/activity table. | Implement the accepted composition with authoritative live state and consistent goal/context links. Preserve the corrected grid scope. |
| Goal plan | C illustrates current work, selection, reports, history and conditional outlook. The application still renders a separate step sequence and milestone sections. | Complete known milestone expansion, concurrent work, dependencies, contribution/counting rules and the same selection context across references. Exercise real multi-action and short-goal cases rather than treating the reading fixture as the full model. |
| Coach | The shared service and conversation already exist. Navigation and the conversation still say Check-in. Prototype conversation is only a local draft. Contextual placement is agreed. | Design/implement the accepted placement, reporting quick replies, typed inline context, actual save/correction receipts and the proposed-change flow in that same conversation. Final primary/utility navigation still needs an explicit composition. |
| Insights and experiments | Durable learning records, revisions, source rationale, controls and a learning journey exist. The current dashboard primarily groups records into current/past. | Compose the accepted question-first overview: what is being learned, current test/experience, next review and practical implication. Opening an entry reveals its experiments/history, conflicting evidence and source reasoning. Keep corrections and original scope visible without expanding all detail by default. |
| Change preview | Current code has proposal decision controls and explanation. The prototype has manual edits and a capacity comparison. | Preview the real proposal on affected plan/timeline elements. Settle grouped edits, occurrence versus future scope and the relation to calendar effects; show partial failures and what was actually applied. |
| First goal | A short goal-entry form already hands off to conversation. | Verify the complete route to a useful editable first plan, coach-selected tracking and an appropriate initial timeline. Include complex/qualitative goals, insufficient context and unavailable-provider recovery. |
| Tools and settings | Calendar, connections, reminders and coaching/provider settings already have surfaces. | Clarify their placement and contextual entry points. Preserve one coach and actual read/write capability; avoid presenting tools or settings as additional learning systems. |
| Scientific and state integrity | Shared methodology, claim grounding, reviewed advice and durable learning exist. | Apply the accepted second-pass evaluation cases to real flows. Resolve date-derived test-use labels, sparse/single-driver projection applicability, useful action size, delayed outcomes and correction propagation. Define milestone forecast dependencies only where defensible; current projections do not implement a full milestone dependency forecast. |
| Streaks and exceptions | The illustrative counter and planned-rest rule are visible. | Specify pause/resume, missing evidence, recovery and period-based plan semantics before treating the counter as production policy. Streak rate is not an established optimization target. |
| Validation and release | Prototypes passed local interaction/layout inspections; earlier production work has its own tests. | Check comprehension of the whole journey, then implement and verify shared persistence/context across channels, failure recovery and the canonical deployment. Prior release checks do not verify these newer designs. |

## Recommended order

1. Continue the grilling with how Insights and experiments are reached within Coach, then their interaction. Contextual Coach placement, learning ownership and question-first grouping are already decided; the remaining work is how the person uses them without losing their place.
2. Walk one complete journey: enter a goal → first useful plan → report experience → inspect a supported proposed change → apply it → report use → review learning. Include a correction and a changed circumstance. Settle remaining milestone/dependency, edit-scope and recovery rules where that journey exposes them.
3. Implement coherent pieces of that agreed journey in the existing shared system. Verify scientific/state meaning alongside the interface rather than treating it as later polish.
4. Validate cross-goal, short-goal, unknown-outcome and mobile cases. Then update actual-app landing captures and verify release. The Today redesign remains deferred.

Next proposed grilling question: should Conversation and Insights be two views within Coach? Recommendation: yes. Insights makes active experiments and scoped findings visible, grouped around what Adler is learning, with links to the affected work. These are presentations of the same learning records, not a new experiment administration area. Exact navigation placement is not yet a recorded decision; question-first Insights grouping is already accepted.

## Audit references

- Original grilling: G04–G13 (hierarchy, time, reporting and proposals), G16–G19 (action continuity, C, goal history and Insights), G22–G29 (A, progress implications and accepted second pass), G31 (All Goals-only activity), and G33 (contextual Coach placement) in the [archived decision map](https://github.com/jordymarshall/adler/blob/prototype/goal-views-integrated/docs/prototypes/goal-views-integrated/design-map.md).
- [Governing principles](product-principles.md), [current method](method/adler-method.md), [target engineering](method/coaching-engineering.md), [accepted second pass](product-coaching-second-pass.md).
- Inspected application: `src/App.tsx`, `src/GoalPlan.tsx`, `src/GoalWorkspace.tsx`, `src/GoalOrganization.tsx`, `src/GoalActivity.tsx`, `src/LiveCoach.tsx`, `src/LearningDashboard.tsx`, `src/Insights.tsx`, `src/Onboarding.tsx`, `shared/projection-model.ts` and `shared/goal-projection.ts`.

No production UI or runtime was changed during this audit. Hosted state was not checked; the existing deployment record is historical, not a fresh availability claim.
