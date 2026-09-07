# Product comprehension across the landing page and onboarding

Research notes, 7 September 2026. Proposals only. This builds on [progress and insights UX](progress-insights-ux.md), [headline research](landing-headline-copy.md), and [scientific disclosure](scientific-disclosure-product-ux.md). It does not claim a tested conversion improvement or replace the [Adler Method](../method/adler-method.md).

## Recommendation

Let a visitor understand one evolving goal before asking them to inspect the application. Demonstrate the distinctive sequence: **the person reports what happened, Adler connects it to a relevant behavioural mechanism, the plan changes, and later feedback informs the next decision**. Expose a concise report-to-adjustment example in the hero, then retain the five-section structure with one focal interaction per section. Keep real app screens available as supporting detail.

For onboarding, help the person develop their own first usable action and plan. Teach the interface while that work happens. Finishing a tour, connecting a calendar or receiving a long generated plan is not itself evidence that the person has received value.

These are product hypotheses informed by the sources below. A focused demonstration still needs enough concrete information to show what Adler does; reducing text to slogans would remove the explanation along with the clutter.

## Evidence and guidance

| Type | Finding | Implication and limit |
| --- | --- | --- |
| Empirical UX study | NN/g compared viewing versus skipping card tutorials with 70 participants across four relatively simple iOS apps. Viewing tutorials did not significantly improve task success or time, and participants rated tasks as more difficult. [Mobile Tutorials](https://www.nngroup.com/articles/mobile-tutorials/) | Do not assume extra onboarding explanations make the product easier. These apps were not complex AI coaching systems, so this is not evidence that Adler needs no guidance. |
| Research-informed guidance | NN/g recommends contextual, dismissible and revisitable help, avoiding requirements to memorize steps from an earlier tutorial. [Onboarding Tutorials vs. Contextual Help](https://www.nngroup.com/articles/onboarding-tutorials/) | Explain a projection when one appears; explain a plan change while reviewing it. Keep help available later. |
| Professional homepage guidance | NN/g recommends explaining the offering immediately and showing specific, representative examples. It also cautions against imagery that misrepresents the product. [Homepage Design Principles](https://www.nngroup.com/articles/homepage-design-principles/) | Demonstrate one authentic user situation. A complete feature inventory is unnecessary for first comprehension, but a visually attractive fiction is insufficient. |
| Professional disclosure guidance | Important meaning belongs in the initial view, with obvious access to secondary material. GOV.UK warns against hiding information most users need. [NN/g Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/), [GOV.UK Details](https://design-system.service.gov.uk/components/details/) | The core benefit and actual example must work without expansion. Full screenshots, long reasoning and research references can be secondary. |
| First-party AI product guidance | Google PAIR recommends identifying the user's problem, mapping their workflow and evaluating whether AI adds useful value; it cautions against narrow immediate metrics that harm the longer experience. [User Needs + Defining Success](https://pair.withgoogle.com/guidebook-v2/chapter/user-needs/) | Define initial value through a usable user-owned plan, then separately assess useful check-ins and adaptation over time. Account creation alone is an incomplete outcome. |
| Visualization guidance and accessibility requirement | ONS recommends a useful starting view, minimal animation and user control. WCAG requires control for nonessential automatic moving content lasting over five seconds alongside other content. [ONS Interactive Charts and Animations](https://service-manual.ons.gov.uk/data-visualisation/guidance/interactive-charts-and-animations), [W3C Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) | Motion can connect states, but the value must remain understandable in a static view. Preserve manual state selection, pause and reduced motion. |

The empirical study concerns onboarding tutorials. The other sources supply design guidance or accessibility requirements. None proves that a particular Adler story, screen count or animation duration is optimal.

## What the current code suggests

- [LandingCore.tsx](../../src/LandingCore.tsx) presents five separate feature chapters: goals, calendar, progress, insights and connections, followed by further methodology and FAQ content. This provides breadth, but visitors must connect those features into a reason to use Adler. That interpretation is a review hypothesis, consistent with the user's report of overwhelm.
- [LandingAppCapture.tsx](../../src/LandingAppCapture.tsx) already offers real app captures, enlargement, pause/play and explicit progress/insights frame selection. Preserve those useful controls. The proposed change is what each first view communicates and how much interface it asks the visitor to read.
- The current examples shift among a reading goal, portfolio drafting and other goals. The initial insight story focuses on drafting while the progress chart focuses on reading. Reusing one goal and recognisable context would make the sequence easier to follow; this is an inference to test, not an established effect size.
- [Onboarding.tsx](../../src/Onboarding.tsx) is already a simple goal field with an optional manual route. It sends the goal to the canonical Check-in. Do not add a feature tour to this screen. Inspect the burden from that handoff through the first usable plan; this file alone does not establish the complexity of the whole intake.

## Proposed landing story: one representative goal

Use the existing fictional **Read 30 books** example throughout. Reading is relatable and supports a transparent pages-to-books scenario. Keep other goals visible only as quiet context for shared planning, and show broader goal types elsewhere so the product is not mistaken for a reading tracker. Example action quantities must remain the fictional person's choice, not universal coaching prescriptions.

| Existing section | Story purpose | Focused demonstration |
| --- | --- | --- |
| 01 Goals | Show what the person wants and what they can do next. | One clear reading goal and its outcome, with a small indication that Adler also manages other goals. The next state stays attached to this goal. |
| 02 Plan | Show how the action fits the person's day. | A chosen reading action and one highlighted place in the person's real-looking calendar. Keep surrounding commitments sufficient to show fit, without a full calendar becoming the main reading task. |
| 03 Progress | Show observed progress and what continued action could mean. | The same goal's observed outcome line, conditional projection and forward range, with target and dates readable. Preserve the range meaning and use the actual measurement model. Do not imply that a suggested change immediately improves the forecast. |
| 04 Insights | Explain the adjustment introduced in the hero, and what happened next. | A short report beside a proposed or saved adjustment, with a behavioural reason. For example, the existing book-nearby report can inform a practical setup change. Show a later report separately; saving the adjustment is not its result. Other personal insights provide context without competing with this focal interaction. |
| 05 Connections | Show continuity through the person's preferred channels. | The same reading check-in and plan through another channel and calendar. Keep reported pages distinct from books finished and make scheduling authority clear. |

These are storyboard proposals, not approved final copy. The report and adaptation carry the strongest distinction from a generic task list: show that relationship in the hero so visitors do not have to reach section 04 to understand the product. A short caption can explain that behavioural research informs the adjustment; fuller rationale stays available.

Connections can close the story by showing that the **same** check-in and plan are available through another channel and calendar. They need not restart the demonstration with another set of unrelated phone conversations.

Use focused crops of actual components and authentic states, keeping relevant status and metric labels intact. Offer the complete view for visitors who want to inspect it. This preserves product credibility while reducing the initial reading burden. Higher screenshot resolution improves sharpness, not the displayed size of tiny text.

For a proposed adjustment, three short rows can distinguish **observation / behavioural science / expected change**. The first names the person's evidence, the second the relevant mechanism and consequential transfer limit, and the third a testable expectation rather than a promised result. Keep accept/decline/discuss/edit available without making four equal-weight controls compete on every message. This layout is a product inference; source references and full history can expand, but essential uncertainty should remain visible. Typed hypothesis and test records should preserve these distinctions across channels, as described in the method contract; their presence alone does not establish that an inference is valid.

## Onboarding and the first useful experience

1. Preserve the person's own goal when entering Check-in. Ask only for information that changes the immediate recommendation; do not impose a fixed question count, review interval or questionnaire across all goal types.
2. Make a useful draft visible as it becomes possible: outcome, controllable next action, timing or cue where useful, and next review. Explain the most consequential assumption beside it. A draft remains recognisably provisional until the user has chosen it.
3. Let the user refine the plan in ordinary language. Do not require them to learn terms such as hypothesis, projection model or implementation intention before starting. The underlying method remains rigorous even when the interface uses familiar language.
4. Introduce connections when they provide a concrete benefit, such as placing an action around commitments. Keep manual scheduling/reporting viable. Explain relevant data use and action authority at the point of connection, respecting authorization already given.
5. After the plan is saved, emphasize the next usable action and the canonical Check-in. Empty forecasts or insights should explain what evidence is missing; they should not become prerequisites or fabricated signs of personalization.
6. Reveal deeper options in the task where they help. Keep the user's progress if they leave and return. Measure time and effort to a usable plan separately from later follow-through and learning.

These proposals describe desired experience rather than a new intake script or implementation plan. The first usable plan is our candidate definition of initial value, to be checked with users.

## Observable comprehension tests

- **Landing, first impression:** after brief exposure, ask visitors to explain what Adler does, what makes it different from a tracker, and what the person contributes. Compare a focused story with the current screenshot-led presentation. An example five-second exposure is a test condition, not a universal attention limit.
- **Story continuity:** ask what happened to the same goal, what the user reported, what changed, and why. Check for false causal interpretations, such as believing the illustration proves the technique works or that the system completes the goal automatically.
- **Static and mobile:** repeat with animation disabled and on a narrow screen. The outcome, adjustment and projection meaning should still be understandable without enlarging a screenshot.
- **Onboarding task:** have someone enter their own goal, reach a plan they can accurately explain, change an unsuitable detail and identify how to report their next result. Record stalls, repeated information, unnecessary navigation, completion and perceived effort.
- **Return visit:** ask the person to resume after an interruption and correct a prior report. Check whether the saved plan, next action and consequences of the correction remain understandable.

Set comparison criteria before testing. Observe comprehension and successful action alongside preference; a pleasing animation or higher signup rate does not demonstrate correct understanding, sound coaching or long-term goal attainment.
