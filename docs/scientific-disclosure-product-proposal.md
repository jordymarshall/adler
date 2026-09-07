# Adler: understandable coaching with inspectable evidence

Product review and proposals · 7 September 2026 · reviewed `935e0b6`

**Status: reviewed direction accepted; application changes are not implemented.**

Update: the user accepted all seven proposal areas and the [revised product-core plan](product-core-and-experience-plan.md). The decisions are now standing [product guidance](product-principles.md), with the deliberate implementation method in the [engineering design](method/coaching-engineering.md). This original review remains the evidence for identified gaps and the earlier proposal context.

## Recommendation

Make Adler do the methodological work and explain the practical consequence. Someone opening the app should understand their next action, why Adler selected it, what is still uncertain, and what happens after their next update. They should be able to inspect the personal evidence and relevant research without becoming responsible for selecting scientific methods or configuring prediction models.

Treat continuous disclosure as continuity across decisions and over time. A meaningful assumption is visible when a plan starts; a check-in shows what was understood; an adaptation explains what changed; a projection exposes its conditions; a correction changes the authority of dependent insights. Routine acknowledgements should remain brief.

This requires a common explanation contract **and** stronger evidence handling. Current screens can imply more certainty than the records support. Renaming fields alone would leave that mismatch intact.

## Scope, evidence and limits

Reviewed the active routes, coaching framework, research loading, prompts, schemas, substantive recommendation validation, projection arithmetic, learning records, manual edits, proposals, scheduling and channel entry points. Read the current [Adler Method](method/adler-method.md), [research synthesis](research/behavioural-science-synthesis.md), relevant individual-inference material and [input–outcome contract](input-outcome-coaching.md). The current method takes precedence over older fixed intake/cycle thresholds.

The review includes desktop/mobile fixture walkthroughs of Today, goal organization, Insights, Check-in, settings, provider setup, connections, integrations and the public method page, plus four synthetic model probes. Browser fixtures use fictional records and intercepted GET requests. No real account changes or external provider calls were made. This is an expert product/code review, not a user study, comprehensive accessibility/security audit, or independent replication of every research claim. Live inference quality across providers remains to be evaluated.

Detailed evidence is retained in `.context/reviews/journey-product-audit.md`, `coaching-model-audit.md`, browser observations/screenshots and `model-probe.ts`. [UX research and primary sources](research/scientific-disclosure-product-ux.md) support the design direction; the proposed layouts and priority order are product judgments to test.

## What is already worth preserving

Adler already loads the full P1–P36 synthesis into coaching turns, offers bounded access to research deep dives, and applies six decision gates. Saved recommendations can carry the reported barrier, method, mechanism, personal fit, prediction, review rule, limitation and source IDs. A separate model pass reviews substantive plans and learning records. Versioned plans, reviewable proposals and stale-proposal rejection also exist.

Those are useful foundations. They do not establish that the whole product improves goal attainment or that its individual predictions are calibrated. The stronger product opportunity is to connect these existing records to understandable decisions and enforce their meaning consistently.

Preserve the shared Check-in across channels; the requested outcome-versus-time line graph and forward projection; flexible cycles; multiple goals; the distinction between controllable work and observed results; and the ability to inspect past decisions.

## Findings that change the priority order

| Finding | Evidence | Product consequence |
| --- | --- | --- |
| The next action is buried on Today | In the reading fixture it starts 3,109px down at 1440×1000, and 3,281px down at 390×844. `Today.tsx` embeds the full goal workspace. | A daily action surface currently behaves like a detailed report. |
| Missing periods can count as observed zero work | Synthetic probe: months with no records become eight weeks of “Observed input pace: 0.” Explicit unanswered action rows are handled differently. | An absence of evidence can change the forecast as though the user reported doing nothing. |
| A current projection can end in the past | Probe on Jan 20: last reported outcome remains 0/1 books, but “Projected finish” is Jan 4. | The app needs a result update, yet presents an expired estimate as its current answer. |
| A small sample can erase the visible range | Three identical revenue intervals produce identical low/expected/high values. | The fan is a scenario calculation; its width does not establish statistical certainty. |
| An edited action can retain incompatible evidence | Changing reading to audiobook listening retains pages, the pages-to-books conversion and prior reasoning. | The same explanation or graph can become invalid without looking different. |
| Connector context can qualify as a user report | Webhook messages enter the shared service as user-role messages and their IDs are eligible as reported sources. Prompt text says they are unverified. | Provenance needs a structural boundary; wording alone is insufficient. This is a code-verified gap, not an observed live hallucination. |
| Learning has incomplete revision semantics | Insights resolve mutable source records live; overview states depend on populated fields and historical proposal status. | Correcting evidence or replacing a plan may leave an old insight looking current. |
| Scientific detail is inconsistent across surfaces | Chat shows generic checks/catalog links; plans/insights expose richer rationale; SMS can serialize nested proposal objects. | Depth varies by channel, and users encounter internal terminology instead of a clear decision. |

Reproduction and exact references are in the audit artifacts. Primary implementation boundaries are [projection](../shared/goal-projection.ts), [plan edits](../shared/workspace.ts), [source eligibility and evidence review](../server/service.ts), [channels](../server/channels.ts), and [insight rendering](../src/Insights.tsx).

## 1. Establish one explanation contract

**Priority: foundational. Value: understandable decisions with consistent evidence semantics.**

Use the saved decision rationale across Today, Check-in, proposals, goal detail, Insights and messaging. Avoid generating a second explanation that can disagree with the recommendation it describes.

| Depth | User question | Proposed content |
| --- | --- | --- |
| Visible in the task | What should I do, and why now? | Concrete action/change; short personal reason; consequential uncertainty; current state and appropriate control. |
| “Why this fits you” | What led Adler to this suggestion? | Dated reports, tentative explanation, selected behavioural mechanism, expected observation, next review and relevant alternative explanation. |
| “Evidence & method” | How robust is that reasoning? | Research excerpt and source, evidence grade explained in words, study context and transfer limits, framework/principle IDs, assumptions/calculation and historical versions where applicable. |

Users should be able to follow a source link directly from its claim. Avoid several nested disclosures before the useful answer. Any limitation that could change the immediate decision belongs in the visible summary. Full scientific terminology remains available at depth.

Keep separate: what the person reported, what a connection supplied, Adler's interpretation, what the literature supports, data completeness, projection assumptions, and proposed/saved/booked state. A checkmark that a structural rule passed must not look like proof the intervention will work.

Example, using fictional reports:

> **Try your writing session after breakfast.** You said evening interruptions stopped the last two attempts. A familiar cue may make starting easier. We'll review whether it helps after your next attempts. **Suggested change · not scheduled yet.**

Opening “Why this fits you” shows the actual two reports, why opportunity/cue support fits better than increasing workload, the observation Adler will ask for and the relevant research limitation. A routine “I read 12 pages” update needs a concise saved receipt and correction route; it does not need to manufacture a new experiment.

**Method connection:** expose Define → Observe → Understand → Select → Design → Learn through their useful outputs. The engine still performs the six gates; the user sees their practical meaning. Keep COM-B as a supported inquiry into capability, opportunity and motivation, with uncertainty where the reports do not distinguish them.

**Tradeoff:** fewer visible fields require stronger summary accuracy. Generate summaries from the same validated record and test that important consequences and limitations survive compression. This is a supported rationale, not a claim to reveal the model's private internal reasoning.

## 2. Make evidence remain valid as the user changes

**Priority: fix before stronger certainty language. Value: trustworthy updates and corrections.**

Record the origin, relevant date and confirmation state of evidence. A calendar conflict can prompt “Did this affect your session?” It cannot become a confirmed reason for a missed action until the user supplies that interpretation.

Distinguish unknown periods from explicit zero activity and agreed rest days. Measure coverage for the same period shown in the pace estimate. Let the coach choose freshness requirements based on the goal, outcome delay and decision; do not introduce a universal expiry threshold.

Tie an insight or estimate to the observation and measurement versions it actually used. Materially changing the behaviour, unit or relationship should put affected conclusions in “Needs review,” preserving their history. A corrected typo should not reset a valid plan. A changed cue may preserve the outcome measure while making earlier cue-specific reasoning historical.

Corrections should tell the user their consequence: “I've corrected that update. The earlier explanation relied on it, so Adler will review it.” If the review has not happened, do not claim the insight or forecast is already repaired. Removed personal content should remain removed; preserving decision history must respect that deletion rather than re-exposing the content through a hidden snapshot.

**Method connection:** Observe and Learn require comparable, attributable evidence. P24 and the synthesis's individual-inference cautions prevent a sparse association or changed measure from becoming a stable personal rule.

**Tradeoff:** dependency tracking adds work below the UI, but it is necessary to support continuous learning honestly. Keep it bounded to records already supporting decisions, rather than building an unrelated knowledge platform.

## 3. Make progress answer three distinct questions

**Priority: high. Value: meaningful progress without asking users to understand prediction models.**

The goal screen should answer: **What am I trying to achieve? What work is planned and actually happening? What does that imply about the goal, if we can estimate it?**

Keep the outcome/time graph, target, future line and shaded forward range. Show the last reported result/date, the relevant input pace and the condition behind the projection beside it. Retain planned cycles, dated milestones and scheduled actions on a shared time axis; distinguish tentative future work from calendar bookings. Avoid competing charts with unexplained denominators.

Choose the display according to the relationship:

| Goal/evidence | Default explanation | Deeper inspection |
| --- | --- | --- |
| Reading with pages recorded | “At your recent reading pace, this is the estimated finish. We're using 300 pages per book until you refine that estimate.” | Actual books/list lengths if known, input coverage, conversion range, arithmetic and included reports. Pages and completed books stay distinct. |
| Revenue with focused hours and sparse results | “You're recording the work. We don't yet know how reliably it predicts revenue.” Show actual hours and revenue over the same period. | An explicitly exploratory scenario if its assumptions are defensible; matched periods, outcome delay, missing work and alternative explanations. |
| Qualitative/structural goal | Show the next verifiable step, milestones and next review. | Why the coach selected this cycle and what evidence will change the plan. Numerical attainment forecasts may be unavailable. |
| Stale or inconsistent result | “Your result needs an update to refresh this estimate.” | Last report, accumulated input, expired estimate and the specific discrepancy. Never silently mark the goal achieved. |

For the current model, describe the band as **a range under different assumptions**. A label such as “95% chance of success” would require a separately specified and validated probability model. Widening a shaded shape cosmetically would not supply that validation. Likewise, three recorded intervals must not automatically imply a reliable personal relationship.

Hours-to-revenue is currently a descriptive ratio with a lag assumption. It is not a causal return, and zero-input revenue is useful contrary evidence. Keep it visible when examining the relationship. Changes in strategy, measurement, environment and interval length need attention before pooling history.

Use completion counts and coverage without a generic success score: “5 completed, 1 update missing, 8 still ahead”; separately “1 of 30 books reported finished.” If an adherence percentage is shown, explain its denominator and the missing reports nearby. Planned future actions must not look missed.

**Method connection:** separate execution support from outcome response. Behavioural literature may support a cue or feedback method; it cannot establish how many work hours generate a dollar of revenue. Adapt the behaviour support and reconsider the input–outcome assumption separately.

**Tradeoff:** some users will receive no finish date for an uncertain goal. The screen must still offer useful work, review timing and the next missing observation. Forecast availability is not the measure of coaching quality.

## 4. Give each main screen a clear job

**Priority: high. Value: daily usefulness and a coherent journey.**

| Surface | Proposed primary job | Change and reason |
| --- | --- | --- |
| Goal setup | Agree the goal and a feasible starting system | Keep the own-words Check-in handoff. Explain the coach's proposed action/cycle and unresolved assumption. Let the person confirm constraints; ask only what changes the decision. |
| Manual setup/organization | Express user-owned choices | Remove unrelated milestone/deadline requirements from tag/category edits. Allow a meaningful firm, flexible or absent date according to goal type. Stop presenting default dates/assessments as agreed facts. |
| Today | Help me act now | Put the next action, timing, finish condition and current state in the first viewport. Keep a small progress/review summary and contextual links into goal detail. |
| Goals | Manage my commitments together | Preserve rows, categories and activity history. Make capacity conflicts, current status and the availability of an estimate understandable. Use the same definitions of action completion, outcome and unknown data as goal detail. |
| Goal detail | Understand this goal's system and trajectory | Goal/result/date → current cycle and next action → timeline/projection → active adjustment and next review. Consolidate repeated learning panels and keep their status/source intact. |
| Check-in | Report, reflect, ask, correct and review changes | Preserve one shared coach with contextual links. Format messages as short paragraphs and meaningful lists. Clearly acknowledge extracted facts and saved/proposed changes. |
| Calendar | Know what is planned and what will be booked | Show destination, availability status and every event next to confirmation, including an extra check-in if enabled. Explain partial booking/retry state. Contextual rescheduling returns to Check-in. |

A lightweight Check-in receipt might say: “Saved: 12 pages on Tuesday. You said the lunch cue helped. Your projection now includes this update.” Only show the last sentence if it actually refreshed. Important proposed changes use a concise before/after and state workload/calendar consequences before confirmation; exact record differences remain available below.

Remove the independent coaching-review form from settings in favour of the same Check-in. Keep direct editing where it is quicker and the meaning is clear. One canonical conversation does not mean every minor control must become a chat exchange.

**Method connection:** autonomy and useful feedback (P4/P10), proportionate monitoring (P1), context and opportunity before workload increases. Present planned review timing as the coach's current choice, with a reason and a way to adjust it.

## 5. Make Insights an evolving understanding of the person

**Priority: high. Value: the user can see what Adler has learned and how it affects their life.**

Keep multiple insights visible in a compact overview. Each entry needs an understandable finding, relevant goals, the evidence so far, whether it still applies and its current planning consequence. Keep user-confirmed context clearly identified within Insights, without reviving a separate “About you” destination.

Example: “A clear stopping point may help you move on from polishing. Two sessions reported; you linked the stopping point to progress in one. **Currently trying:** choose a finish line before opening the draft.” This is more informative than either an unexplained “Hypothesis” badge or an absolute claim about the person's personality.

Use a small lifecycle appropriate to the evidence: “Worth trying,” “Waiting for your update,” “Some support,” “Needs review,” “No longer using.” These are proposed states to grill; they must be derived from records, not invented by the renderer. Approval of a test is different from attempting it, and a previously applied change is different from the current plan.

Opening an item shows the relevant path: **your report → method-informed explanation → change tried → actual feedback → what it suggests → next question**. Show the stages that exist. A saved observation should not expand into six mostly empty boxes implying a completed investigation.

“That's not what happened” and “This no longer fits” should reach the shared Check-in with the exact record context. Personal source links need to land on the actual report and relevant version. Research links need to show what the cited study supports and where it may not transfer. Repeated reports are not automatically independent confirmations.

**Tradeoff:** a calmer overview may reveal less of the research at first glance. Its practical implication and evidence status must stay visible, with direct access to the full basis.

## 6. Make the shared coach equally rigorous across channels

**Priority: foundational enforcement, then channel presentation. Value: the same standard wherever a user checks in.**

The shared runtime is already a strength. Close the gaps where advice-only replies can avoid the substantive evidence review, or direct external proposals bypass the coaching pipeline. Route substantive Adler recommendations through the same supported rationale and evidence rules whether they save a plan or simply advise a change. Exact user-requested edits and factual acknowledgements should remain proportionate and identified as such.

On SMS/iMessage, send the actionable summary, personal reason, material uncertainty and confirmation instruction. Link to the authenticated full proposal/evidence using the same saved proposal, while letting users ask “why?” in the channel. Avoid nested JSON and internal record fields. Connected events retain their origin across ingestion, prompts, validation, saved insights and display.

Preserve existing approval semantics during the first implementation. The degree of routine automatic adaptation is a separate product decision for grilling, with explicit distinctions between updating an estimate, proposing a behavioural change and booking external calendar events.

**Tradeoff:** additional semantic checks can increase latency and cost. Apply them to substantive recommendations, measure their benefit and test failure cases; do not add a second scientific review to every acknowledgement. A model's successful API connection test does not establish coaching quality.

## 7. Make settings, public claims and research depth match the product

**Priority: supporting consistency; some onboarding decisions need discovery.**

Ordinary settings should cover availability, review/check-in preferences, reminders, connected data, automation boundaries and correction/export controls. Technical method selection, program versions, provider identifiers, API keys and MCP/webhooks belong in clearly identified advanced areas. The coach should recommend an appropriate method; the user can express preferences or opt out without being asked to choose a scientific technique.

There is a business/product decision about a managed default AI provider versus requiring users to bring an API account. A consumer coaching product would benefit from a usable default, but cost, deployment model and evaluated provider reliability must be settled before implementation. Existing power-user setup should remain available. Do not infer equal coaching performance from a common schema.

Update the public method page to explain the actual six-gate method, the research library and the distinction between population evidence, personal learning and Adler's own effectiveness. Its current seven-technique catalog and references to older fixed mechanics do not fully describe the runtime. Keep the existing disclosure that the combined program has not been evaluated for effectiveness.

Make public integration claims match available, setup-required and planned capabilities. Update help instructions to the canonical Check-in and current screens. Keep privacy explanations practical at the point of connection: what Adler can read, what it may change and what goes to the selected provider. Existing account recovery, legal and deployment work is outside this proposal unless a separate review identifies a concrete need.

At the deepest evidence level, preserve source excerpts/versions, evidence grades, population/setting, transfer limits, access type and framework version. Distinguish source publication, retrieval and actual review dates. Loading a saved catalog summary today is not a fresh literature review. Establish an owner and process for updating the research library and reconsidering affected guidance when evidence changes.

## Copy should translate the decision, not just the noun

| Current phrase | Suggested direction |
| --- | --- |
| Model choice | What this estimate assumes |
| Observed input pace | Your recent reading pace / Your recorded focused time |
| Provisional input pace | Starting estimate — until you have recorded enough activity |
| Review the model in Check-in | State the real next need: “Update your book total” or “Discuss how this work connects to revenue” |
| Input → outcome | How your actions relate to your goal |
| 26/27 action quantities known | 26 of 27 reading updates include page counts — with the relevant date range |
| Current planning cycle | Your plan for Oct 12–25 |
| Next assessment | Next review — with whether Adler needs an update from you |
| Verified milestone | Reported complete — when that is its actual provenance |
| Scientific hypothesis | An idea we're trying — with the formal term in deeper evidence |
| Confirmed by you / Entered by you | Use the actual origin: said by you, saved with your approval, or supplied by a connection |

These are examples, not a global find-and-replace. “Model” on a provider screen means something different from “model” in a goal estimate. Rendering should explain the actual state and next action.

## Delivery proposal and validation

Do the work in an order that tests the hardest assumptions early, following the distinction between value, usability, feasibility and business viability in [SVPG's discovery guidance](https://www.svpg.com/four-big-risks/). Priority here is qualitative, based on observed defects and the consequence of misunderstanding. There are no measured customer impact or effort scores yet.

1. **Grill the contract and boundaries.** Agree what must stay visible, which uncertain goals receive a scenario, how correction changes earlier conclusions, and which adaptations remain proposed versus automatic.
2. **Prototype one complete journey.** Setup → Today → Check-in → refreshed result/estimate → proposed adjustment → Insights. Use three different goal shapes: reading with a direct assumption, revenue with an uncertain relationship, and a structural task without a numeric outcome. Reuse the same evidence and states across views.
3. **Repair foundational integrity and implement the accepted journey.** Provenance, missingness, freshness, changed measurement and learning state come before any stronger certainty claim. Carry the agreed contract through schemas, prompts, evidence validation, runtime and UI together.
4. **Extend to remaining surfaces and channels.** Calendar consequences, manual editing, settings, texting/MCP and public claims. Update landing captures from the actual accepted app flow.
5. **Evaluate before broadening claims.** Keep interface comprehension, method adherence and real-world effectiveness as separate questions.

For usability, ask representative novice and detail-seeking participants to identify the next action, distinguish a report from a suggestion, explain the shaded projection, correct a mistaken record, understand what accepting a change does, and find the relevant evidence. Include sparse, contradictory, corrected and stale states, plus repeat visits. Measure successful decisions, serious misunderstandings and effort. Evidence clicks, satisfaction and confidence are secondary.

For methodology, test unsupported domain advice; conflicting observations; delayed outcomes; changed units/actions; zero-input outcomes; paused/expired cycles; missing quantities; connector versus confirmed reports; unattempted experiments; and evidence outside the studied context. Check source support and semantic applicability as well as schema validity. Add representative provider evaluations with an explicit rubric; existing deterministic/fake-runner tests do not establish live scientific quality.

For accessibility, test keyboard access, screen-reader state announcements, reflow, readable charts and statuses without relying on colour or hover. Verify that mobile presentation retains consequential qualifications and source access.

For effectiveness, define a separate longitudinal evaluation if Adler will make outcome-improvement claims. Better comprehension, stronger prompting or an attractive learning graph cannot establish that result.

The research cautions against using increased trust as the primary success metric: in [Bansal et al.'s CHI 2021 classification and question-answering studies](https://www.microsoft.com/en-us/research/uploads/prod/2021/02/does_the_whole_exceed_its_parts-chi21.pdf), explanations increased acceptance of AI advice regardless of correctness. That finding has transfer limits to coaching, but supports testing appropriate reliance and correction. [Microsoft's HAI guidelines](https://www.microsoft.com/en-us/research/blog/guidelines-for-human-ai-interaction-design/) also emphasize correction and cautious adaptation over time. [GOV.UK's disclosure guidance](https://design-system.service.gov.uk/components/details/) supports keeping information most users need visible.

## Decisions to grill, in order

These are the next discussion topics, not an intake questionnaire or rules the user should configure for each goal.

1. **Default experience:** recommendation + personal reason + material uncertainty, with contextual evidence depth. Recommended over a separate scientific dashboard or mandatory expert-mode toggle.
2. **Forecast promise:** conditional scenarios where defensible; useful action/review guidance where the relationship is unknown. Calibrated probabilities would be a separate model project.
3. **Adaptation authority:** decide which routine updates can happen automatically and which behavioural/calendar changes require review. Preserve current boundaries until that decision.
4. **Meaningful learning:** agree what evidence supports “some support,” when an insight becomes historical, and how the system responds to correction. Let the framework choose cycle length and observation needs by goal and context.
5. **Consumer setup:** decide whether a managed AI default is part of this work or a subsequent business/deployment change.
6. **Release bar:** agree scenario-specific comprehension and model-fidelity requirements, then test them before expanding the redesign.
