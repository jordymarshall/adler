# Guided goals and research-backed planning

Adler owns the choice of measurement and approach. The application supplies research retrieval, structured decision records, an evidence review, and the UI needed to inspect and act on those decisions. There is no hardcoded preference for revenue, work hours, or another particular goal metric.

## Coaching process

All coaching channels still call `Service.chat`. The model can clarify the user's meaning without creating a goal. For a new goal or a recommended plan revision, it must request scientific literature before returning its recommendation.

1. The model returns up to three `researchQueries` and no mutations. Queries should describe scientific concepts without identifying user information.
2. `server/research.ts` searches Europe PMC and Crossref through fixed HTTPS endpoints. No additional search key is required. It returns publication metadata, study types where supplied, abstracts, source IDs, retrieval times, and explicit lookup failures. DOI duplicates are removed. Results are bounded; these indexes and abstract access do not provide exhaustive literature coverage.
3. The model compares candidate measurements and approaches against the user's intent, constraints, observations, and applicable evidence. A goal or plan command includes a structured `basis`: interpretation, strategy, measurement rationale, alternatives, action measure or null, evidence findings and applicability, limitations, assumptions, uncertainty, and a dated review question with adaptation criteria.
4. The service validates the command and citations. The model cannot invent source IDs or substitute its own citation metadata. The service attaches snapshots of the cited sources. A recommendation to change the goal's measurement must include a researched plan revision in the same bundle.
5. A separate model call checks the proposed recommendation against the retrieved sources, user context, and the actual resulting goal records. It checks evidence claims, causal overstatements, applicability, measurement meaning, and consistency between described and saved dates/durations. Material issues are returned for correction before saving. This is an additional model check, not a guarantee of scientific validity.
6. Explicit creation saves a Draft. Recommendations remain reviewable proposals. Starting, recording work, and external calendar confirmation remain separate actions.

Each turn permits at most two research rounds and one repair after an invalid recommendation. Failed or irrelevant searches may lead to an explicitly provisional plan without citations. They must not become fabricated evidence. Source snapshots distinguish an actual retrieved abstract from a curated method summary. The app displays findings, applicability, limitations, and source links in **Why this plan?**.

Selected source snapshots live with their plan version. Decision records keep query history, result counts, and failed lookups without duplicating all retrieved abstracts. Existing versions preserve earlier explanations; later recommendations do not replace their sources.

The existing provider configuration is used for the planning and evidence-review calls. Planning can therefore use several model calls. Switching provider does not bypass the command or citation checks.

## Goal and action lifecycle

The main navigation is Today, Goals, and Calendar. Today and each goal use the same next-step rules (`shared/next-step.ts`). The first visit and New goal begin with one description field. Continue starts a dedicated intake conversation and submits that description inline; clarification stays in place. Once the draft is created or approved, the intake conversation is filed under its goal. Creating a researched draft opens its goal directly. Manual setup remains available under a disclosure at `/app/goals/new/manual`.

A newly created UI/coach goal is a **Draft**. Its compact card shows one first action, finish criterion, intended result, and material uncertainty. **Start plan** activates the saved goal without creating another action. The next card suggests a time, with alternative times and calendar settings expandable below. **I’ll do it now** starts the action immediately. `startedAt` records starting without recording an outcome, modifying milestones, or claiming a calendar booking.

Confirmed future work ends at a useful stopping point. Current work offers **Start action**, then **I’m finished**, then an inline check-in. Completed work and due check-ins use the account timezone and actual booking/starting times. A date alone is not a confirmed appointment. Today prioritizes current work over old unanswered check-ins. **Leave this for later** leaves the old record unknown and advances within the current visit. A due review enters the same flow when current work no longer needs attention; it can be skipped.

Research, alternatives, progress, action observations, milestones, history, and conversations sit below the next action in closed vertical disclosures. Goal tabs and the coaching section navigation have been removed. Existing plan/progress links open the relevant disclosure; learning links still redirect to sourced observations. The user can choose another focus from Today without losing goal context in Ask Adler.
A plan can store `durationMinutes`. Scheduling uses the duration of the selected action's plan version, falling back to the user's default session length for older plans. Free-text timing is a suggestion or cue; it is never treated as a confirmed external booking. Revising a plan no longer assigns an arbitrary tomorrow date or rewrites booked work. Cue-only edits retain the unchanged research explanation, action measure, and duration.

The model may choose an action measure with a target per action, day, or week, or choose no action measure. Actual amounts are recorded during action check-ins. Progress & history aggregates observations for the current plan and period and keeps them separate from the desired outcome. Missing amounts remain unknown.

Changing the outcome measurement through the command system archives the old observations and units. They are shown under Previous measurements. Old observations are not silently relabeled with the new unit. A measurement-only edit leaves the old explanation in its previous plan version and invites evaluation of the revised plan.

## Calendar and reviews

The built-in calendar has previous/next-week navigation, timed columns on desktop, and an agenda on phones. It shows Adler work, checked external busy periods, and the weekly review. Empty space is explicitly unknown when connected calendars have not been checked. Calendar connections remain available in a secondary section.

Users can select suggested slots or review a specific date and time. Scheduling uses the account timezone. Tests cover timezone conversion and daylight-saving gaps/overlaps. Booking a first action preserves its identity, original completion criterion, and plan version, including when it was already placed on Today. Choosing a day constrains suggestions to that day. Calendar entries show their provider and open the selected action. A partially confirmed booking keeps its retry available even after the session ends; retrying or explicitly closing it returns to the action.

Google/iCloud booking still uses the existing provider adapters, explicit confirmation, and availability rechecks. Existing external events are managed at their provider. This change adds a built-in view of work and checked busy periods; it does not claim continuous two-way synchronization or import every external event's details.

**Review your week** begins with a short purpose and optional context field. Review time and prior reviews open on request. Reviews have explicit periods so a completed review does not hide the next week's review. Review with Adler opens a contextual conversation in place; the note and records remain available to the model. Prior reviews remain archived. The weekly appointment repeats in future calendar weeks and reserves a 15-minute planning allowance in Adler. Suggestions and booking checks respect that reservation. It is not an external booking.

## Chats and organization

Chats are shown in goal folders and General. New chat inherits the current goal, and the folder editor supports moving it to another goal or General. Conversations opens the folder library on request. Each goal can open a contextual conversation inline.

Areas and tags are optional organization. New manual goals start Unassigned. The interface explains areas, user-created tags, and priority, and exposes their editing from the goal overview. Coaching instructions require supplied or explained suggestions rather than an unexplained default category.

## Validation

Run:

```sh
npm run build
npm run test:server
npm test
```

Service tests cover research retrieval, unavailable searches, invented citations, evidence-review corrections, draft activation, measurement-history preservation, and channel parity. Browser tests cover the complete draft-to-scheduled-action journey, research explanations, action amounts, contextual chat folders, recurring reviews, mobile layout, and accessibility.

A live Gemini check in an isolated test account asked for clarification of an ambiguous monetary goal and researched a separately specified writing goal through both literature indexes. It produced a sourced Draft, alternatives, a dated review question, an action-measure period, and an explicit action duration. Live checks establish that the integration executes; they do not establish the best personal strategy or the effectiveness of the combined product.

## Landing page

The landing uses Adler Warm typography and one six-step journey: set a goal, plan the week, make time, check in, see progress, then learn and adapt. The opening restores the scattered goal, action, chart, and coach cards, which gather into a single next-step preview as the user scrolls. Hidden controls are inert; phones, short viewports, and reduced-motion preferences use a static preview. The preview’s secondary links lead into the same walkthrough rather than adding a second tour.

Each numbered step has a direct instruction and one main visual. Goal definition explains the outcome, reason, finish criterion, baseline, and milestones. The weekly plan shows actions, a result check, the review, and a time budget. Start plan leads to a concrete day/time example. Texts and check-ins inform revised timing suggestions; external calendar changes still require confirmation. The phone is centered in the check-in step with messaging and calendar connections around it.

The flow heading reads “Reach your goals with a plan that adapts to you.” Step 05 shows recorded results, current checkpoints, and proposed checkpoints together in the app’s `ProgressChart`, without tabs. Graphs retain their natural aspect ratio and legible labels on desktop and mobile. Proposed checkpoints are explicitly distinct from predicted results. Step 06 keeps “Life moves. Your plan should, too.” and combines learned context with a reviewable revision to the approach, preparation, milestones, and timing. Supporting reasons and saved context open on request; reported facts and hypotheses are distinguished. Confirming the illustrative proposal leaves recorded outcomes unchanged and points to the next review.

Illustrations never write account data. Browser checks cover the opening animation, primary actions, disclosures, phone check-ins, scrolling, graph sizing, proposed and recorded values, reduced motion, and accessibility.

The landing describes the implemented research, saved-context, check-in, and review system. Additional model training and proprietary goal-attainment data are identified as planned development in the FAQ, not current capabilities.
