# Progress and insights UX

Researched 7 September 2026 for landing chapters 03 and 04 and their actual app views. Scope: readability, distinct purposes, projection uncertainty, expandable coaching reasoning, and animated product captures.

## Product boundary

Chapter 03 should use the same goal-detail view opened from a goal elsewhere in the product. It should show observed goal progress, the conditional projection and its forward range. Weekly action completion is useful evidence, but substituting it for the goal projection changes the question being answered. Chapter 04 should show accumulated personal observations and working insights, their planning implications, and an expandable explanation of how Adler arrived there. These are user requirements, not findings from external UX research.

The [Adler Method](../method/adler-method.md) and [input–outcome contract](../input-outcome-coaching.md) govern meaning. The projection range reflects input/conversion assumptions; it is not a statistical confidence interval or a probability of success. Working insights remain tentative, with actual reports, behavioural framework fit, alternatives and limits available. A visual change must not strengthen those claims.

## What the primary sources support

| Guidance | Relevance to Adler |
| --- | --- |
| ONS recommends shaded ranges around a central estimate when uncertainty materially affects interpretation, and clear explanations of what the range means. [Showing uncertainty in charts](https://service-manual.ons.gov.uk/data-visualisation/guidance/showing-uncertainty-in-charts) | Keep the forward band with the projection. Apply the visual guidance, but retain Adler's conditional-scenario terminology; ONS statistical examples do not validate Adler's model. |
| Chart text should be concise, consistent with surrounding language, readable on mobile and desktop, and free of overlaps. [ONS: Chart text](https://service-manual.ons.gov.uk/data-visualisation/guidance/chart-text) | A caption saying weekly actions while the adjacent view shows goal attainment creates a semantic mismatch. Present the metric, time span and projection meaning together. |
| Annotations should be near the relevant point, concise and separated from other marks; essential annotation information should also exist in surrounding text. [ONS: Annotations](https://service-manual.ons.gov.uk/data-visualisation/guidance/annotations) | Clearly mark the latest outcome, future projection and target. Do not require a tiny hover label to understand the range. |
| Visual hierarchy uses scale, contrast and grouping to establish importance. Excessive similar treatments weaken that hierarchy. [Nielsen Norman Group: Visual hierarchy](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/) | Make the personal finding and planning implication prominent; subordinate provenance and controls. Six similarly weighted boxes do not by themselves communicate reasoning. |
| Progressive disclosure keeps the important material visible and makes secondary detail available through obvious, clearly labelled controls. [Nielsen Norman Group: Progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/) | Show what Adler has learned and what it changes before opening the methodological detail. Give the opening action visible text. |
| Accordions can support scanning related sections and selectively reading detail. GOV.UK warns against hiding material everyone needs or nesting accordions/disclosures, and recommends short, descriptive controls. [GOV.UK Design System: Accordion](https://design-system.service.gov.uk/components/accordion/) | The overview must remain meaningful while closed. Opening one insight should reveal a readable explanation, rather than another menu of opaque labels. Full sources can remain secondary, but the relevant evidence and mechanism should be visible. |
| ONS recommends a useful initial view, minimal animated elements and user controls; animation must not be the only route to information. [Interactive charts and animations](https://service-manual.ons.gov.uk/data-visualisation/guidance/interactive-charts-and-animations) | The first capture should already explain the feature. Let visitors select overview/detail without waiting for the simulated cursor. |
| Automatically moving content lasting over five seconds alongside other content needs a pause, stop or hide mechanism at WCAG Level A. Nonessential interaction-triggered motion can be disabled under Level AAA guidance. [W3C: Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html), [Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) | Preserve visible playback control and reduced-motion behavior. Reduced motion should retain meaningful static content and manual access to every state. |
| Ordinary text requires 4.5:1 contrast at Level AA; meaningful graphics generally require 3:1 against adjacent colours. Colour cannot be the sole signal. [W3C: Text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [Non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html), [Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) | Use labelled solid/dashed lines, readable text and identifiable range boundaries. A subdued fill is appropriate only if the range remains understandable through its boundaries or equivalent information. |
| Complex images need an appropriate short description and access to the essential information conveyed; surrounding text can explain the important relationships. [W3C: Complex images](https://www.w3.org/WAI/tutorials/images/complex/) | Captures demonstrate the interface, but essential product meaning should also be in actual page text, not only embedded pixels. |

These sources provide first-party professional guidance and accessibility requirements. They do not establish a measured conversion lift or prove that a particular Adler layout is optimal. The recommendations below are our design inferences to verify.

## Recommended iteration

### 03: Where am I heading?

- Capture the actual goal projection panel, keeping the same goal, colour and data used when opening that goal from the table. Distinguish the chapters by purpose: 01 portfolio overview, 02 scheduled work, 03 one goal's trajectory, 04 personal learning.
- Make the graph the first frame. Preserve the goal-attainment y-axis with a 100% target, dated x-axis, observed outcome line, conditional projection and forward scenario band. Keep actual controllable input in the explanation or adjacent evidence; do not relabel adherence as goal attainment.
- Keep the latest confirmed outcome and its date distinguishable from today. An old outcome report does not become today's observation merely because the chart is viewed today.
- The second frame should show the same panel's assumptions/evidence or selected projection detail. It should answer what the projection is based on, without switching to a different weekly chart.
- Frame only the relevant app region at a readable scale, with its heading and legend intact. Capturing more content at higher pixel density improves sharpness, not apparent text size after shrinking.

### 04: What is Adler learning about me?

- Start with multiple entries. Each should visibly separate the observation or working insight, its evidence status, and the saved/proposed planning implication. Preserve exact saved meaning; do not turn tentative findings into assertive personality labels for a shorter heading.
- Use greater type emphasis for the finding, quiet metadata, and a clearly named planning column/region. Make the reasoning affordance visible, with an unambiguous open/closed state.
- After opening one entry, use a straight numbered explanation with distinct roles: reported evidence → research-informed explanation → change tried → reported result → tentative interpretation → next question. These display roles expose the existing Adler methodology; they are not a replacement generic scientific method.
- Within that explanation, show the relevant behavioural method/mechanism and the evidence that motivated it. Preserve source links, predictions and limits. Keep the full research record available without making users open every source to understand why the plan changed.
- In the landing demonstration, retain orientation to the selected finding as the detail opens. Let the visitor choose the overview and reasoning states directly. Do not compress the full six-stage history into an unreadable thumbnail merely to fit it all at once.

## Verification for this iteration

1. At desktop and mobile sizes, the first 03 frame visibly contains the actual projection and range. No legends, target labels or dates are clipped. Its expanded view presents the same goal and metric.
2. In 04's closed state, a reader can identify multiple findings, distinguish evidence from inference, and state what is saved versus proposed. Opening one retains its identity and reveals the existing method-grounded reasoning and source links.
3. Manual state selection, pause/play, keyboard activation and reduced motion preserve access to the information. Text and meaningful graphic contrast are checked in the actual app and at the landing's displayed capture scale.
4. Run a brief comprehension check with users: ask what is observed versus projected in 03, what the shaded range means, what Adler learned in 04, and what it changed. This is a proposed validation activity, not a test already performed or an externally validated timing threshold.

## Implemented and checked

The iteration restores 03's actual goal projection, with labelled scenarios and a responsive mobile plot; its second frame opens the input evidence. Insights now separates recorded observations, hypotheses and working inferences from their planning implications, shows the behavioural mechanism at the hypothesis step, and uses a larger numbered reasoning path. Both captures use closer desktop framing, slower playback and manual frame selection, including reduced motion.

Verification: production build and capture-script typecheck passed; nine distinct browser scenarios passed across projection/evidence links, the insights reasoning path, calendar continuity, landing capture loading, keyboard enlargement, pause/play, manual frame selection and reduced motion. Desktop and mobile screenshots were visually reviewed for clipping and reading hierarchy. No user comprehension study has been run.
