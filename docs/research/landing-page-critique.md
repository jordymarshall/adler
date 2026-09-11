# Adler landing-page critique and recommended story

Status: this records the earlier design review. The user’s subsequent approved update replaces breakfast/email with phone distraction and the hero proof card with original abstract scroll-controlled artwork. See [current landing implementation](../landing-assets.md) and [art direction](landing-hero-art-direction.md).

10 September 2026 · Review of the current local page at `http://localhost:5174/`, its 33 scroll states, desktop/mobile screenshots, CTA destination, product principles and implemented coaching contract. This is a skeptical customer-and-business review informed by YC writing, not an official YC assessment. It proposes a direction; it does not change the running page.

**The page explains too much about operating Adler and too little about why someone would pay for it.** Its strongest material is the visible change from a reported obstacle, through a supported test, into the next plan. That material is buried inside a long tutorial, then repeated in a second conversation.

The prior implementation accumulated individual requests without making enough editorial decisions about the whole. Fixing the animation and filling the screens did not resolve the story. Passing layout tests did not establish readability or purchase intent.

Read this recommendation first. The companion [line-by-line copy audit](landing-copy-audit.md) provides specific keep/rewrite/move/delete decisions for the navigation, hero, seven screens, every sidebar sentence, conversation, finale and footer. [YC source notes](yc-landing-principles.md) distinguish source advice from its application here.

## What the current page actually asks of a visitor

Measured in a clean browser on the current build. These are layout facts, not evidence about conversion rates.

| Observation | Measurement | Implication |
| --- | --- | --- |
| Desktop page at 1440 × 900 | 15,712px tall: about 17.5 viewport heights | A large reading/scroll commitment before the last CTA. |
| Phone tour | 33 discrete steps; 10,998px on that desktop | Too many separate stops for the number of distinct benefits. |
| “Inside Adler” narration | 1,164 words across titles, context, reasons and results, excluding repeated labels | A substantial explanation alongside an already text-rich product demonstration. |
| iMessage chapter | 13 of 33 steps, about 39% of the tour | It retells goal context, experiments, review and plan saving already shown elsewhere. |
| Mountain finale on desktop | 3,600px, or four viewport heights | An additional scroll journey to repeat the idea of starting. |
| Phone on 390 × 844 | About 244px wide; main app text about 11.2px | Small product copy competes with large surrounding headings. |
| Phone on 375 × 667 | About 179px wide; main app text about 8.3px; some labels about 5.5px | Geometric fit has been achieved at the expense of reading. |
| First CTA, signed out | Account form with username/password | “Start with a goal” first asks for an account, not a goal. |
| Offer | No price or purchase control on the page; terms explicitly say subscription billing is absent | Copy alone cannot make this build a buying journey. |

Evidence: screenshots and measurement output in `.context/landing-review/`; current sources are `src/LandingHero.tsx`, `src/LandingJourney.tsx`, `src/landing-sequence.ts`, `src/LandingAppCapture.tsx`, `src/MountainFinale.tsx`, `src/LandingCore.tsx`, `src/Auth.tsx` and `src/Landing.tsx`.

## The major problems, in order

1. **The headline addresses a subordinate problem.** “Know what to do next” sells planning or task prioritization. The accepted core problem is having a goal and struggling to follow through. People who already know the work can reasonably think this is not for them. The opening also never plainly identifies Adler as an AI goal coach.

2. **The differentiator arrives too late.** Goal clarification, a task list and progress tracking are useful, but they do not by themselves explain the recurring value of this coach. Lead the visual proof with the saved plan change and the reports that informed it. The detailed journey can then show how that happened. This is a claim about Adler's demonstrated value, not an assertion that competing products lack these capabilities.

3. **The page repeats instead of progressing.** Goal setup, experiment creation and plan updating each get their own explanation. Then iMessage starts the same obstacle → test → review → update sequence again. A visitor must hold multiple dates and contexts in memory to learn that these are the same records. Demonstrate continuity once.

4. **The narration often explains bookkeeping.** “Adler keeps your report,” “saves them together,” “attaches the reports,” and “preserving the original test” recur. Persistence matters to the product. Repeated descriptions of persistence are weak purchase arguments. Show one saved change, explain why it was chosen, and let the next scene prove that Adler remembers it.

5. **The mobile product is too small to sell itself.** The heading and explanation retain space while the phone shrinks. The chart is especially illegible. A properly proportioned phone can still be a bad demonstration. Recompose the mobile presentation around readable app content instead of fitting three compositions into one small viewport.

6. **The most obvious distribution buttons do not deliver.** App Store and Google Play badges look like download actions. Clicking them changes a coming-soon sentence. Tiny qualifying text does not repair the expectation created by the badges. Remove unavailable download actions from the primary pitch.

7. **The connections scene implies more than the delivered consumer product.** Apple Health and branded assistant logos appear as ordinary available connections. The repo distinguishes compatible MCP access and existing adapters from undelivered consumer-app integrations. Sell what a new customer can actually use. Remove unavailable items instead of building a prominent roadmap or another paragraph of caveats.

8. **The ending spends attention without resolving the purchase decision.** “Your someday” and “Let’s give it a start” introduce a new metaphor after a detailed, dated goal. The mountain adds no evidence, price, concrete offer or reason to act now. It also resembles another chart immediately after a real projection, despite representing no measured data.

9. **The buying questions are unanswered.** Who is this especially useful for? Why keep paying after a plan exists? What does it cost? What is included? What setup is required? What real evidence supports the product? What happens after clicking? The current page has no customer-result proof and no purchasable offer. The fictional walkthrough establishes understanding of functionality; it cannot establish effectiveness or willingness to pay.

10. **The signup experience weakens the consumer promise.** The CTA leads to “Create workspace,” then warns that email recovery is not configured. The UI exposes model-provider configuration elsewhere. Server-provided credentials can exist, so do not claim everyone must bring an API key. Nevertheless, a paid consumer offer needs a verified, supported path from account creation to its first useful coaching response. Fix operational gaps rather than concealing them with reassuring copy.

YC's messaging guidance puts customer value ahead of enabling technology and workflow. Its application here is to give the harness explanation a supporting role, after a clear benefit. [Dominika Blackappl, Practical Design: Messaging](https://www.ycombinator.com/blog/practical-design-messaging).

Paul Graham recommends showing strong product material early and designing for casual visitors. Putting the concrete plan change in the first viewport follows that advice; an obligatory 33-step tour does not. [The Hardest Lessons for Startups to Learn](https://www.paulgraham.com/startuplessons.html).

## The one story to tell

**Adler helps you follow through by turning what happened into a better next plan.**

The word “better” is the intended purpose, not a guarantee of improvement. The visible product must show a proposed, supported adjustment, the user's choice, and what later reports actually establish.

Recommended initial audience hypothesis: people with a self-chosen personal project that repeatedly slips despite attempts to plan it. The portfolio example fits this audience. Do not quietly turn this into a validated customer segment or claim the same offer will sell equally well for fitness, study, finances and relationships. The first paying audience and price remain open commercial decisions; neither is established by the current landing.

The buyer should leave with four concrete understandings:

- I bring a goal and tell Adler what happens when I work on it.
- Adler helps me plan the work and identify a useful adjustment when I get stuck.
- The adjustment has a reason, is tried deliberately, and changes my plan when I agree.
- My next conversation starts from that plan and what I have already tried.

The “draft before email” suggestion alone is modest advice. A skeptical buyer can reasonably ask why it requires a subscription. The demonstration must make the continuing service tangible: Adler helps identify the obstacle, organizes an informative test, revisits the actual reports and carries an accepted change into the plan. More explanation of the harness cannot substitute for evidence that customers value that ongoing help.

The emotional recognition belongs in the opening and the example. Do not add another standalone problem section, symptom grid, motivational manifesto or second set of screenshots.

## Recommended page, with canonical copy

The copy below is one proposed direction, not a menu of interchangeable slogans. Exact paragraph length and the eight-beat budget are editorial hypotheses to test, not scientific or YC requirements.

### 1. Opening: identify the product and make the problem recognizable

| Element | Proposed copy or treatment |
| --- | --- |
| Small category label | **Your AI goal coach** |
| Headline | **Follow through on the goal that keeps slipping.** |
| Supporting sentence | Adler helps you plan the work, understand what gets in the way, and adjust your next steps using what you’ve tried. |
| Primary CTA | **Start with a goal** |
| Availability | **Start on the web.** |
| Secondary link | **See an example** |
| Hero product proof | A legible before/after action: “Write for 25 minutes after breakfast” → “Open the draft before email. Write for 25 minutes.” Two dated reports sit beside the change. “Starting felt easier in two reported sessions. Keep testing.” |

The hero proof is explicitly an example of the result of coaching, not a claim that the visitor has already tried it or a customer testimonial. It previews the payoff before the dated walkthrough explains the process. The actual goal remains “Publish 3 case studies by November 15”; the two sessions do not become two published studies.

Keep one clear action. Price/trial text must be supplied from the actual offer, once decided and supported. Do not insert “free,” “no card,” a trial duration, a setup-time promise or a made-up monthly price into this version.

### 2. One short product story

Use one continuing goal and approximately eight meaningful beats. Merge microstates such as “save,” “saved,” and “waiting” into their parent beat; do not give each a separate lesson. Preserve scroll-controlled, reversible motion. On first viewing each beat must already communicate useful meaning.

| Beat | Literal product content | One supporting explanation | What to cut from the current tour |
| --- | --- | --- | --- |
| 1. Goal and first plan · Sep 21 | Rough idea becomes **Publish 3 case studies by Nov 15**, three dated milestones and the chosen 25-minute Tue/Thu action. Show acceptance and saved result within this beat. | Your goal, deadline and available time shape the first plan. | Three differently worded planning buttons and four separate lessons about setup. |
| 2. Today's work · Oct 8 | All actions due that day remain visible. Focus one report on the portfolio action; keep the other action as context. | Today's actions come from your saved goals and schedule. | The separate reading-miss storyline and a tutorial on every report state. Retain those capabilities in the app. |
| 3. A specific obstacle · Oct 10 | Blue user bubble about the Oct 1 writing miss; Adler asks whether the 25 minutes were available before email. User confirms. | Adler checks available time before suggesting a different cue. | Reintroducing this same exchange after the experiment has already been reviewed. |
| 4. Actual progress · Oct 11 | **1 of 3 published.** Observed line, target, filled conditional projection and next milestone. The observation date is explicit. | Writing time and publication are different reports. The projection is an early estimate if the recorded pattern continues. | A separate narration stop for each graph element and an oversized exact projected date. |
| 5. A test with a reason · Oct 12 | **Open the draft before email.** Same 25 minutes, Oct 13 and 15; review Oct 19; acceptance creates the saved experiment. | An if–then plan links breakfast to opening your draft. That cue may help you start before email. | Repeating the dates, action, science definition and save mechanism in three places. |
| 6. What happened · Oct 19 | Oct 13 and 15: started before email, 25 minutes each; user says starting felt easier. **No new case study published.** | Two reports support trying again; they do not establish a personal rule. | A new generalized “insight” card that loses the action and original test. |
| 7. The next plan · Oct 19 | Compare the pre-test action with the proposed next plan. Show the user's acceptance, **Plan updated**, next session Oct 20 and review Oct 25. | The change you agree to becomes your next action. | Another full explanation of storing, attaching and preserving records. |
| 8. Keep going · Oct 20 | “What do I have to do today?” receives the current agenda. “Am I on track?” gets reported milestone status. A compact confirmed calendar booking can close the same exchange. | Text and the app use the same goal, plan and reports. | The second experiment tutorial and a standalone connection-logo catalog. |

This keeps goal creation, milestones, all daily actions, partial/done/miss capability, a projection, rigorous experiments, evidence-informed plan changes and a deeper text exchange. It changes their editorial weight. Ordinary report controls do not need equal demonstration time with the learning process.

The Oct 11 forecast must stay with the Oct 11 plan and evidence. The changed before-email plan needs new comparable evidence; do not move the old November 5 estimate onto the Oct 19 plan to make the ending look successful. The existing record supports a useful plan update, not a finished portfolio. Stronger outcome proof must come from actual reported results.

The context → reason → change structure belongs beside the relevant decision. Replace 33 three-part panels with one short explanation per beat. Let **Why this change?** reveal the particular saved observation, research claim, applicability and limits where useful. Keep scientific reasoning inspectable; remove the requirement to read the whole method while deciding whether the product is relevant.

### 3. Credibility and offer, close to the useful result

Bring the CTA back beside the visible updated plan. It should not disappear for the full tour and a mountain sequence.

Use one compact explanation of the science:

> **A reason for the change.**
> Adler connects what you report with relevant behavioral research and keeps the test and its results with your goal.

Link to the actual method and its limitations. Do not use “scientifically proven,” “expert-certified,” “knows what works for you,” numerical success rates, or a generic science badge as a replacement for support. A second model review is an implemented quality check, not independent expert certification.

The page also needs the real offer: what the customer gets, price and billing period, any trial conditions, usage limits that affect the decision, available platforms, and help. These are not known from the current landing. The implementation explicitly has no subscription billing. The current honest conversion is starting a goal; a paid launch needs an actual offer and purchase path.

Resolve only material objections. A compact group next to the offer can answer:

| Buyer question | Factual content needed |
| --- | --- |
| What do I get after the first plan? | Continued check-ins where enabled, reviews of reported attempts, and accepted plan changes that retain what has been tried. |
| Is it ready on my device? | Web is available. State text/calendar setup conditions accurately. No unavailable app-download buttons. |
| What does it cost? | The agreed real price, included usage and billing/trial conditions. This decision is outstanding. |
| What evidence supports it? | A real product example; specific method sources; genuine customer evidence if available. None of these is interchangeable with the others. |
| Can I trust it with my goals and conversations? | Plain summary and direct privacy/help links, consistent with actual storage, provider processing and account controls. |

Do not add an oversized FAQ wall or invented testimonials to fill this space. Ask early users for concrete permissioned accounts of what changed, over what period, and what remains unresolved. Preserve limitations. The current example should remain product explanation rather than social proof.

Hale's conversion critique explicitly considers price, conditions, credibility, fit and access to help. The proposed offer block addresses those missing questions; it is not evidence that a particular layout will increase sales. [YC conversion and pricing lecture recap](https://www.ycombinator.com/blog/startup-school-week-7-recap-kevin-hale-on-conversion-rates-and-pricing/).

### 4. Close with the actual next action

**Which goal do you want to work on?**

**Start with a goal**

Use the same CTA wording and destination as the opening. Place the real availability/offer alongside it. Keep a compact footer with method, help, privacy, terms and sign-in links. The country credit can remain small; it is not a sales argument.

Remove the four-viewport mountain sequence from the conversion path. If the mountain mark remains important to the brand, use a restrained static detail in this closing block. Do not require another animation journey to reach the CTA. This deliberately challenges the earlier approved finale because the current request is to critique the whole page's usefulness.

## One visual language

| Element | Direction | Reason |
| --- | --- | --- |
| Brand | Keep the Adler mark, forest green, warm pale background and controlled lime accent. | The site has recognizable character worth preserving. |
| Hero artwork | Replace the large standalone bloom with the legible plan change. Keep the bloom as a small background accent, if needed. | The strongest visual should show what the buyer receives. |
| Type | Display face for the brand and short headlines; system-style type for product content; readable neutral body text. | Distinguish brand expression from actual app information. |
| Color | Green for completion/current selection, yellow for partial work, neutral for unknown/rest with distinct symbols, blue for outgoing iMessage. | Use color to communicate state consistently. Preserve the agreed scheduled-day streak semantics. |
| Backgrounds | One continuous light surface; one restrained motif or palette shift at a meaningful story transition. | Seven large motif changes turn the same goal into seven separate presentations. |
| Hierarchy | Product change first, short explanation second. Reduce large repeated “When…” text and long chapter headlines. | Currently headline, phone and sidebar compete as three reading surfaces. |
| Desktop layout | A large, readable product view with one concise adjacent explanation. Keep the phone centered where this helps continuity. | Preserve the useful composition without obliging three columns of prose. |
| Mobile layout | Recompose the app content at readable size. Reduce device chrome; move extended explanations into normal flow/optional depth. | A complete phone, large headline and full explanation cannot all fit readably into a short viewport. |
| Motion | Scroll changes the action, report, projection or plan. Rewind works. No independent loops or waiting for meaning. | Motion should reveal the product's state changes. |
| Chart | Show observed results, the target and conditional projection with readable labels; keep uncertainty beside the estimate. | A quantitative visual must answer a question rather than merely look technical. |
| Closing image | Small brand detail or none; same surface and CTA treatment. | End by making the next action easy. |

Proposed usability budget: essential demo text should remain roughly 16 CSS pixels at the rendered size on target mobile screens; this is a design target, not a research-derived threshold. If the full device frame prevents that, prioritize the app content. Keep device proportions accurate whenever a device is shown. Do not stretch the phone, bring back expansion controls, or shrink the text until a geometry assertion passes.

Use native-looking controls and blue/gray iMessage bubbles. The innovation to demonstrate is the supported change to the plan and the continuity of learning. It does not require novel navigation or additional dashboard panels. [Graham's Taste for Makers](https://www.paulgraham.com/taste.html) informs this emphasis on solving the underlying design problem; it does not mandate an Adler color palette or type size.

## Implementation priorities and verification

| Order | Concrete work | Verify |
| --- | --- | --- |
| 1 | Confirm the first buyer and actual offer; verify the consumer setup, supported connections and purchase path. | A new prospective customer can accurately state what they get, its cost and what happens after clicking. No unavailable action or unsupported availability claim. |
| 2 | Rewrite hero, show product proof above the fold, remove unavailable store badges and duplicate exploration CTA. | Someone unfamiliar with Adler can describe the product and intended problem without reading the tour. |
| 3 | Merge the 33 steps into the short continuous story; remove duplicate text-channel learning tour and most sidebar narration. | Every beat supplies new information. Dates, reports, experiment acceptance and applied changes remain coherent and reversible. |
| 4 | Recompose mobile product views and shorten the closing. | Read the actual app text on 375px and 390px devices at normal zoom. Confirm that the key change, dates and projection qualification are legible. |
| 5 | Place the real offer and CTA near the demonstrated value; fix mismatch with signup. | Complete the supported first-goal flow. If selling, complete payment and access with the stated conditions. Do not assert conversion from button clicks alone. |
| 6 | Observe prospective buyers using the revised page. | Ask what it is, who it helps, what Adler changes, why they would pay, cost, and expected next step; then observe behavior without coaching their answers. |

Proposed evaluation process: conduct an initial small round with relevant prospective customers, record their unaided interpretations and objections, revise the most repeated misunderstanding, then repeat. A small round is directional usability evidence, not a conversion-rate estimate. Measure first useful goal/plan and completed paid activation when applicable; track where people abandon or encounter setup failures. Collect reasons for declining. The site currently states that analytics is not configured; measurement is proposed work, not an existing capability or a reason to introduce unnecessary tracking.

The acceptance standard is a clear decision: a visitor understands the problem Adler helps with, sees the change it makes, understands the real offer, and can take the stated next step. A shorter page, higher scroll completion, more animation or passing technical tests alone would not establish that.

## Review provenance

The primary-source research is in [YC landing principles](yc-landing-principles.md). Browser inspection covered all 33 current phone states at desktop and two mobile sizes, plus the opening, finale, footer and signed-out CTA destination. No account was created and no payment, message or calendar action was performed.

Adler’s actual `Service.chat` and semantic reviewer also reviewed the shorter proposed coaching exchange in an isolated fictional workspace. They supported its reported-trial interpretation, retained 1/3 publication state and isolation of the old projection. The review raised a useful concern that “putting off” overemphasized avoidance; the recommended headline uses “the goal that keeps slipping” to avoid narrowing the problem to procrastination. This remains editorial judgment, not a validated winning headline. The isolated database was removed; the review output is retained in `.context/landing-review/coach-copy-review.json`.
