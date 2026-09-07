# Coaching through controllable actions and testable learning

Review base: `470dee7`. This records the user's latest direction, superseding the outcome forecasting parts of the earlier adaptive-plan proposal. Keep branch `reengineeredv2`; commit and push when verified.

## Landing page

Keep the five focused scroll chapters: goals; organizing and managing multiple goals; progress and check-ins; behavioral learning and adaptation; life connections. Restore the floating-card hero and scroll transition from `08c565e`, retaining the requested headline “Reach your goals with a system that adapts to you.” Use the subheadline “Adler turns your goals into a manageable plan, then uses behavioural science and your check-ins to help you follow through.” Use a relatable portfolio example, not the old fitness or “A clear next step” scene.

The opening scroll moves into a full-viewport chart of scattered, struggling goals joining one plan. Scrolling follows a close view along the time axis, with short explanations of attempts, setbacks and adjustments, then pulls back to reveal the whole illustrative action-completion curve. Reduced-motion and smaller-screen layouts retain the complete static view. This is a demonstration of the learning loop, not measured efficacy. Chapter headlines state the problem, then Adler’s solution.

Chapter 02 must show multiple goals and their commitments in one plan. Chapter 03 restores a recorded-actions vs dated-plan chart with an explicitly illustrative future projection and shaded possible range; this does not reintroduce an outcome-forecast engine. Chapter 05 must show three proportionate phone mockups: Adler check-in in the center, Claude chat and calendar beside it, with connected-app icons arranged on orbital paths. Chapter 05 explicitly explains messaging Adler in the app, by text, or through connected AI tools, plus finding calendar time and booking next steps with approval. Retain accurate availability labels for Apple Health and shared goals/stakes. Desktop animation must retain a readable static layout on mobile and reduced motion.

The closing scroll begins with a large mountain-shaped area chart (“Your someday.”), contracts to one small starting point, and reveals “Let’s give it a start.” with the goal-creation action. Use the same green chart language as the rest of the page, without landscape, road, tree, or seed illustrations. The footer ends with a small Canadian flag and “Proudly built in Canada.” Typography uses the same Adler Warm family throughout, with shared 500 body and 550 heading weights across the landing page and app. Keep large landing backgrounds in Adler’s existing cream and grey-sage palette, with a Gemini-generated stippled pigment sweep and a separate fine-grit paper layer at a fixed tile size. Avoid orange, peach, or beige colour casts; keep demo cards readable. Asset prompts and preparation are in `public/media/textures/README.md`. Publish the verified branch to `main` as requested.

## App and coaching contract

- The goal is direction. Controllable actions and behavioral execution are the primary measures. Outcome observations stay visible as evidence for whether the user's chosen work helps.
- Do not infer revenue pace, outcome per session, achievement probabilities, or expected finish dates from sparse reports. Target and milestone dates are commitments. Discuss and propose changes explicitly.
- The input–outcome relationship is an uncertainty to investigate over time. Each repeating coaching plan saves a testable hypothesis, linked input steps, an observable outcome signal, starting comparison, decision rule, and alternative explanations. Feedback delay and review timing fit the signal and person's constraints; there is no universal weekly cycle or three-observation threshold.
- Separate whether a coaching intervention improves execution from whether execution helps the goal. Use dated reports, missing evidence, delayed feedback, changing circumstances and competing explanations. Keep uncertainty visible. Do not diagnose a trait or prescribe domain strategies based on behavioral research. Make changes reviewable and preserve earlier plans, evidence and sourced insights.
- One conversation destination named Check-in handles planning, reporting, outcome updates, and reviews. All goals are in context; inline mentions link to owned records. Old Coach routes preserve query/anchors through redirects. Remove duplicate sidebar check-in and redundant top-right actions.
- Insights is primary; saved confirmed context appears below implications and evidence. Preferences stay in Settings.
- Each full-width goal screen shows goal success, target flexibility, current cycle, action status, a date-scaled cycle/milestone timeline, selectable weekly action commitments, and learning/adaptations. Unanswered actions are unknown; future work is upcoming. Unsaved future cycles are not fabricated.
- Goals overview remains wide rows with per-goal action charts and overall completion rate plus a line for each goal. Completion rate is Done / reported actions, with coverage visible.
- Historical forecast records remain readable but leave active maintenance, model context, previews, and UI. New plans omit the legacy field.

## Methodological grounding and limits

The repository's method catalog supplies goal-setting, implementation intentions, monitoring, COM-B, and structured debriefing principles. This change turns those into an explicit personal learning loop; it does not establish that Adler itself has been validated.

The [MRC complex-intervention framework (2021)](https://www.bmj.com/content/374/bmj.n2061) emphasizes explicit theory, context, key uncertainties, refinement and evaluation. Adler's saved hypothesis and review rule adapt those principles to coaching; that application is a product design inference, not evidence of efficacy.

The [AHRQ N-of-1 design guide](https://effectivehealthcare.ahrq.gov/products/n-1-trials/research-2014-5) describes prospective comparisons in individuals; its [analysis chapter](https://effectivehealthcare.ahrq.gov/products/n-1-trials/research-2014-1) discusses timing and carryover. Adler's observations are not randomized N-of-1 trials. The system must not label an observed association as a causal effect or impose clinical-trial methods on ordinary goal check-ins.

## Verification

Unit/service checks cover weekly grouping, partial/missed/unknown/upcoming separation, preserved reports and revisions, short/long cycles, undated milestones, legacy compatibility, delayed feedback, experiment step references, all-goal context, and preview immutability. Browser checks cover canonical navigation/deep links, Insights, weekly details and timelines, full width/mobile/accessibility, five landing chapters and scroll animation, multiple goals and three phones. Run live synthetic coaching evaluations, build, server/browser suites, then standards/spec review before pushing.
