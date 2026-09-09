# Action inputs, contextual editing and tentative scheduling

9 September 2026 · Follow-up to baseline `48fd268`. This record describes implemented source and local verification, not deployment or demonstrated coaching effectiveness.

## Delivered

- **Goal → intermediate result → concrete input.** The domain glossary, executable coaching framework (`besci-coaching-v2.1`), schema/tool descriptions, generation instructions and semantic review now agree: milestones are subgoal outcomes, and actions are work the user can execute and report. User-selected quantities are reconciled with input measures; domain strategy and input-to-outcome conversion rates are not invented. The interface labels the selected milestone as a result and the selected action as input. A milestone title/date edit no longer refreshes its outcome observation.
- **Edit in context.** All Goals, the goal plan, a selected milestone and a selected action expose the same editor. Its request includes goal/plan/item identity, field changes and optional explanation. `/api/coach` supplies the same research, context, memory, tools and review used by conversation. There is a processing state, preserved failed input, stable retries and stale-editor detection. Exact requested edits apply after semantic review; additional recommendations remain pending with an in-place comparison and accept/dismiss controls. Earlier plan versions remain inspectable; applying an edit displays the current version even when entered through an action link.
- **One-week placement.** Add to calendar opens a week with the selected action previewed when it fits. Users can click a time, select a day with the keyboard or enter a precise date/time. Goal colours connect actions to their owners. Mobile uses the same seven-day agenda and time controls.
- **Shared tentative schedule.** Calendar and coaching context use `shared/tentative-schedule.ts`. It derives tentative blocks across active/draft goals from saved work and time constraints, reserving confirmed work and fresh known calendar conflicts. It counts reported actual minutes when available, excludes retired/reported/blocked work from new suggestions and exposes work that cannot fit. Moving a preview rearranges tentative work without changing confirmed bookings or marking exposure. The persistent global Continue CTA has been removed from Coach; contextual links remain.

## Method and limits

P10 supports keeping the user's own choices and corrections authoritative. P3 supports attributable monitoring; a plan edit is not a new report. P2/P24 require feasible opportunity before prescribing cues or more work; saved capacity and actual commitments constrain placement. P29 limits transfer from behavioural evidence to business/domain strategy. These connections add no efficacy claim or universal scheduling rule.

Milestone/action meaning is checked semantically against the same saved context and research; it is not guaranteed by keyword matching. Duration is a time budget, while pages/counts or reported minutes measure performed input. Existing milestone forecasts still require a supported relationship; prose is not a conversion model. Existing records are not bulk rewritten.

Tentative placement is a deterministic feasible arrangement, not learned optimal scheduling. Dated work stays on its saved day; unscheduled work takes the first feasible opening, placing active work before draft work and prioritizing the focus goal when dates compete. The coach can revise dates/work/capacity using shared commands. Fresh external availability must cover the viewed range; unavailable or expired coverage stays unknown. Tentative blocks are recomputed views, not stored appointments or external events. Connected-calendar tests use fixtures rather than live provider writes.

## Verification

- Targeted scheduling tests cover competing goals, overlap, capacity, reports on booked and unbooked work, prerequisites, retirement, calendar freshness/coverage, week boundaries and milestone observation integrity.
- Browser tests exercise actual command/proposal persistence with deterministic model responses: loading, scoped requests, failure/retry, stale edits, proposal acceptance, action-version continuity, placement, exhausted capacity, mobile accessibility, partial-booking recovery and calendar-range changes.
- Web/MCP/SMS service tests verify the same reviewed exact input edit changes the current measure while preserving the original version and milestone/result state.
- A live Gemini correction began with an inverted milestone/action pair. It saved “First book finished” as the milestone and “Read 10 pages” as a daily measured input, retained the 30-book goal, linked the action to its milestone, and reconciled the supplied 140-minute weekly capacity. The final live run required repair for an infeasible first draft; those drafts did not persist. This is a narrow quality check, not evidence of general reliability. Local trace: `.context/plan-edits-live-results.json`.
- Independent Standards/Spec review caught stale version display, booked actual-time accounting, budget bypass and availability-range reuse. Those cases were corrected and added to regression coverage.

Full verification: **136 server tests passed**, **85 browser tests passed**, and TypeScript/production build passed. The 32-test shared API suite also passed after the framework version update. Vite retains its existing bundle-size advisory.

Desktop (1280px/1440px) and phone (390px) captures were inspected. Scheduling waits for the dialog to become visible before scrolling the calendar to its selected action; a browser assertion verifies the preview is actually in the viewport. No horizontal phone overflow or axe violations were found in the affected flows. Captures are `.context/preview-milestone-editor-desktop.png`, `.context/preview-week-placement-desktop.png`, `.context/preview-week-placement-phone.png` and `.context/preview-*` for the unchanged goal compositions.

The running real-app preview is `http://localhost:5173`, using the existing local workspace. No hosted deployment is claimed.
