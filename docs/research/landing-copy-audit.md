# Adler: line-by-line landing copy audit

Status: this records the earlier design review. The user’s subsequent approved update replaces breakfast/email with phone distraction and the hero proof card with original abstract scroll-controlled artwork. See [current landing implementation](../landing-assets.md) and [art direction](landing-hero-art-direction.md).

10 September 2026 · Companion to the [recommended story and visual direction](landing-page-critique.md).

This audits the current rendered landing, including all changing phone scenes and all 132 sidebar text fields. Repeated occurrences of identical navigation, dates, numerals and functional labels are grouped where their treatment is identical. Hidden accessibility descriptions are addressed separately. “Move” means retain the information in an appropriate place, not remove it from the product's methodology or records. Recommendations remain proposals; the running page has not been rewritten by this review.

## Navigation and opening

Sources: `src/LandingCore.tsx`, `src/LandingHero.tsx`.

| Current line or element | Decision | Criticism and specific treatment |
| --- | --- | --- |
| Adler wordmark and mark | Keep | Recognizable, restrained brand signature. Do not add a tagline to the logo. |
| How it works | Keep | Clear navigation. Anchor to the shorter continuing demonstration. |
| Our approach | Rewrite | “Approach” is vague. Use **The method** for the existing explanation and scientific depth. |
| Explore the app | Replace | Signed-out visitors encounter signup, not an explorable app. Use **Sign in** for returning users; **See an example** can link to the public demonstration. |
| Start with a goal | Keep, consistently | Concrete available action. Use this same label throughout. Its destination must explain account creation; improving that path is part of the work. |
| Open menu / Close menu | Keep | Functional accessibility labels. |
| Know what to do next to reach your goals. | Rewrite | It sells task selection. Use **Follow through on the goal that keeps slipping.** Add **Your AI goal coach** so the category is clear. |
| Tell Adler what you want to achieve. | Merge | Clear input, but generic and repeated by the CTA and demo. Fold into the single hero sentence. |
| It works out a plan, checks in on how it’s going, and recommends what to change when you’re stuck. | Rewrite | Useful functions, compressed into an undifferentiated list. Use **Adler helps you plan the work, understand what gets in the way, and adjust your next steps using what you’ve tried.** Scheduled checks require enabled setup; do not imply automatic text delivery for everyone. |
| You can talk it through over text. | Move | A good convenience benefit. Demonstrate it in the continuing story and state setup conditions near the offer. It should not be the hero's last and weakest phrase. |
| Download on the App Store | Remove for this build | The badge does not download an app. Reinstate only when its actual destination delivers. |
| Get it on Google Play | Remove for this build | Same unavailable-action problem. |
| Get started on the web. iOS and Android apps are coming soon. | Shorten | **Start on the web.** Put future-platform information in support if needed; it should not dominate acquisition choices. |
| The App Store version is coming soon. You can get started on the web. | Remove with badge | Clicking a supposed download to reveal an explanation creates disappointment. |
| The Google Play version is coming soon. You can get started on the web. | Remove with badge | Same issue. |
| A look inside Adler | Rewrite | **See an example.** The visitor wants to understand the benefit, not tour the company. |
| Large lime/green bloom | Reduce or replace | Strong brand color, weak product proof. Use a readable proposed/saved plan change as the hero's main visual; the bloom can become an accent. |
| Full-height opening with no app content | Recompose | Product evidence should appear in the first viewport on desktop and early on mobile. Keep the strong headline and one CTA. |

## The walkthrough's surrounding copy

Sources: `src/landing-sequence.ts`, `src/LandingJourney.tsx`.

| Current line | Decision | Criticism and treatment |
| --- | --- | --- |
| HOW ADLER HELPS | Shorten or remove | Another introduction after “How it works” and “A look inside.” A small **One goal, over time** label can orient the actual dated story if necessary. |
| 01 / 07 … 07 / 07 | Optional | Useful orientation, but should describe the shortened story, not imply seven compulsory lessons. |
| Scroll to continue | Keep, quiet | Necessary while progress depends on scroll. It should not be the page's main available action. |
| Skip | Keep accessibility function | Let people leave the demonstration immediately. Return a primary CTA near the demonstrated payoff too. |
| When the goal feels too big to start. | Merge into example | Plausible obstacle, but not the only reason people fail to follow through. The rough idea and first plan can communicate it. |
| Turn a rough idea into a clear goal. | Retain meaning | The current visual now supports it. Shorten to **Turn your goal into a first plan** and combine setup microsteps. |
| When your intentions get lost in the day. | Remove | Abstract person-level framing. Show the actual action due. |
| Know what to work on next. | Shorten | **See what to do today.** Useful supporting benefit, not the whole product positioning. |
| When effort doesn’t tell you how far you’ve come. | Remove | Awkward conceptual explanation. The distinction between reported work and published results is clearer in the chart. |
| See your progress toward the goal. | Shorten | **See what’s changed.** Put the specific goal, amount and target in the app. |
| When you mean to do it, but it doesn’t happen. | Move earlier | This is close to the core problem. Let the actual missed-action conversation carry it before the experiment. |
| Know what to try when your plan isn’t working. | Retain meaning, shorten | **Try a change with a reason.** Show obstacle, selected change, basis and review. |
| When you keep trying things that don’t work for you. | Rewrite through evidence | It implies repeated failed attempts not shown by this example, whose trial goes as intended. Remove this generalized sentence. |
| Get advice that builds on what you’ve already tried. | Rewrite | “Advice” understates the visible product result. **Put what you learned into your plan.** |
| When you need help picking things back up. | Remove as separate opener | This has already been established by the miss and adjustment. |
| Text Adler or chat in-app. It already knows what you’re working on. | Split and shorten | **Keep going by text.** One adjacent line can explain the shared goal, plan and reports. The current headline is too long, particularly on mobile. |
| When your plan feels separate from the rest of your life. | Remove | Vague and not supported by a specific unmet need in the story. |
| Bring Adler into the apps you already use. | Replace catalog with outcome | **Put the session in your calendar.** Show the confirmed booking in the final exchange. Keep compatible-client details in Connections or the method/setup pages. |
| INSIDE ADLER | Retain only where useful | Can label one short supporting explanation. It does not need a separate 33-step progression. |
| What it knows / Why this helps / What it does | Merge default presentation | The distinctions matter in the product. Repeating three labeled paragraphs for every UI event overloads the pitch. Use one decision-relevant explanation per beat; keep exact reasoning available in depth. |
| Sidebar step counter and segmented progress line | Remove with 33-panel narration | Adds another progress system beside the chapter counter and the app's own progress. |

## Phone 1: creating the goal and first plan

Source: `GoalBuilder` in `src/LandingAppCapture.tsx`.

| Current text or element | Decision | Criticism and treatment |
| --- | --- | --- |
| New goal | Keep | Literal native-style screen title. |
| YOUR IDEA | Keep if needed | Helps distinguish input from the resulting goal. Do not add more labels around it. |
| I want to finish my portfolio. | Keep | Concrete rough input. It earns its place when followed immediately by a defined result. |
| What would a finished portfolio include? | Keep | A consequential clarification, not motivational filler. Show it once. |
| Make a plan | Remove this extra stage | The question is still unanswered. This adds a pseudo-action without new meaning. |
| Three case studies live by November 15. | Keep | Specific finish and date; use the same meaning throughout. |
| FROM WHAT YOU’VE SHARED | Shorten | **Your available time** if that is the visible information. Avoid announcing context assembly as a separate feature. |
| 3 projects chosen · 0 published | Keep as compact context | Demonstrates that Adler uses known work rather than inventing portfolio strategy. |
| 50 min/week · Tue & Thu after breakfast | Keep | The proposed work fits a stated constraint. This is more useful than generic “personalized” copy. |
| Build my plan | Merge | Use one clear **Create goal & plan** confirmation after the plan is shown. |
| YOUR GOAL | Keep | Distinguishes the result from the rough idea. |
| Publish 3 case studies. | Keep | A real measurable outcome, not a mood or activity count. |
| By Nov 15 | Keep | Necessary goal horizon. |
| Preferred | Clarify or subordinate | **Target date** is easier to interpret in a compact view. Preserve the fact that this is a preferred finish, not an inflexible external deadline. |
| Publish case study 1 / 2 / 3 | Keep as one compact milestone list | Concrete intermediate finishes. No separate animation lesson for each. |
| By Oct 15 / Nov 1 / Nov 15 | Keep with corresponding milestones | The dates explain the plan. Do not repeat them in surrounding narration. |
| YOUR FIRST ACTION | Keep | Establishes the goal → milestone → action relationship. |
| Draft the case study you chose | Shorten | **Draft case study 1**, with the chosen-work context already established. Do not fabricate specialist content guidance. |
| 25 min · Tue & Thu / After breakfast | Keep | Executable action, amount and cue. |
| Later actions set at review. | Clarify, keep meaning | **Later actions will be planned at review.** It prevents the screen from overstating a fully planned path; keep it subordinate rather than deleting the limitation. |
| Create goal & plan | Keep one confirmation | One meaningful decision, followed by its result. |
| Goal and plan created | Keep, shorten if space requires | **Goal and plan saved.** Show it within the setup beat. |
| Your first action is ready. | Remove if action is visible | The shown action already proves this. |

## Phone 2: today

| Current text or element | Decision | Criticism and treatment |
| --- | --- | --- |
| THURSDAY, OCTOBER 8 / Today | Keep | Dates are essential in a story that covers several weeks. |
| 2 actions for today / 1 of 2 actions done | Keep | Useful state at a glance. Show the change without five explanatory panels. |
| PUBLISH MY PORTFOLIO | Keep compact goal association | This is the continuing story. A short display name is fine when the SMART goal is established. |
| Draft case study 1 | Keep | Concrete next work. |
| 25 min · After breakfast | Keep | Dose and cue, both user-contextual. |
| READ 30 BOOKS / Read 20 pages / After dinner | Keep as secondary daily action | Shows the complete agenda. Do not launch a separate learning story about reading. |
| Check / X / chat icons | Keep | Familiar report controls; this preview remains passive. The scroll should make one state change understandable. |
| Check in / Partly done / 25 min · Done / Didn’t happen | Keep functional states | “Some,” “done,” and “missed” remain distinct. They do not each need their own buyer-facing lesson. |
| Seven weekday cells, rest and future marks | Keep | A compact useful visual; preserve dates, missingness and the scheduled-day rule. |
| Rest days keep your streak. | Move to product help or a brief secondary explanation | The rule stays implemented: scheduled rest adds no work. It is not the main reason to buy Adler. |
| Done · Didn’t happen · Discuss | Remove duplicate legend when icons/states are clear | Repeats the available controls. Keep accessible names in the actual app. |
| What got in the way? / Work ran late. | Cut this reading branch from the main narrative | The portfolio later gets a different missed-action explanation. Two obstacles across two goals dilute continuity. Use the portfolio conversation to establish the core coaching behavior. |

## Phone 3: progress and projection

| Current text or element | Decision | Criticism and treatment |
| --- | --- | --- |
| PUBLISH 3 CASE STUDIES / Progress | Keep | Anchors the graph to an outcome. Add a clearly readable **As of Oct 11**. |
| 1 / 3 published | Lead with this | The most useful and defensible result on the screen. |
| PROJECTED FINISH / Nov 5 | Reduce prominence | An exact date dominates despite one measured interval. Keep the date within the conditional projection, not as a headline promise. |
| If this pattern continues | Keep beside the estimate | The assumption is essential. It must remain legible at the rendered mobile size. |
| Goal: 3 by Nov 15 | Keep | Distinguishes the target from an estimate. |
| Observed solid line and area | Keep | The baseline and observed publication must be visible. |
| Filled range and dashed projected line | Keep | Requested and useful when supported. Do not make the range look like a calibrated probability interval. |
| Recorded / Projected / Scenario range | Keep readable | Consider **Reported / If this pattern continues / Possible range**, with the same semantics. Never rely on color alone. |
| 0 / 1 / 2 / 3; Oct 1 / Oct 11 / Nov 15 | Keep chart labels | Units/date reading should not require enlarging a miniature phone. |
| 29 min/wk | Keep as forecast basis | Explains the recorded pace. Do not silently replace the stated 50-minute plan with an implication that 29 was the target. |
| 87 min recorded | Move to detail if needed | Another summary of the same input history. Keep the underlying measurement and make it inspectable. |
| 6 check-ins · Sep 21 – Oct 11 | Subordinate | Useful provenance, but lower priority than the result, target and assumptions. Do not let a strip of attendance replace measured input or outcomes. |
| Early estimate from one measured interval. | Keep in simpler language | **Early estimate from one observed period.** This is a real limitation, not expendable legalese. |
| The range includes no further progress. | Keep meaning visible | Necessary to interpret the range honestly. Combine with the preceding note when space is tight. |
| NEXT MILESTONE / Publish case study 2 / By Nov 1 | Keep | Connects the graph to the next practical target. |

Do not carry this Oct 11 estimate forward into the revised plan without new comparable evidence. Reducing visual clutter does not authorize removing consequential uncertainty.

## Phone 4: the experiment

| Current text or element | Decision | Criticism and treatment |
| --- | --- | --- |
| PUBLISH 3 CASE STUDIES | Keep compact | The experiment belongs to this goal. |
| Try a change / Your experiment | Keep the state distinction | A proposal and an accepted experiment differ. Merge their narration, not their meaning. |
| WHAT GOT IN THE WAY | Shorten if necessary | **Your report** or simply the quoted observation. |
| “Email takes over writing time.” | Keep | Concrete personal premise. The preceding conversation must establish that time before email is available. |
| ONE CHANGE | Keep | Helps delimit the test. |
| Draft before email. | Lead with this | Literal change to how the person starts their chosen work. |
| Breakfast → Draft → Email | Keep | This visual does more useful work than another paragraph. |
| Same writing time: 25 minutes | Keep | Makes the limited change clear. |
| Implementation intentions | Keep as secondary scientific name | Pair with the specific explanation and source; the framework label alone does not establish fit. |
| A breakfast cue may help you start before email. | Keep or clarify | **Link breakfast to opening the draft, before email. This may help you start.** Preserve the tentative application and connection to the saved rationale. |
| TRY IT / Oct 13 & 15 / 2 writing sessions | Merge visually | **Two sessions · Oct 13 & 15.** The exact dates belong in one location. |
| REVIEW / Oct 19 | Keep | The test has a review point. |
| What helped you start? | Move to review prompt | Useful question, unnecessary as additional permanent setup text. |
| REPORT AFTER EACH SESSION | Shorten | **After each session.** |
| Started before email / Minutes written | Keep | Observable signals for the proposed mechanism and behavior. Preserve actual user reports rather than inferring them from acceptance. |
| Try this | Keep | A clear acceptance action. |
| Experiment added | Keep result | Should appear after agreement, within the same story beat. |
| Oct 13 & 15 · After breakfast | Remove duplicate if adjacent schedule remains | Same dates and cue have already been shown. |
| Waiting for your first report. | Keep state, not a separate scroll lesson | Clear distinction between agreeing and having evidence. |

## Phone 5: learning changes the plan

| Current text or element | Decision | Criticism and treatment |
| --- | --- | --- |
| PUBLISH 3 CASE STUDIES · OCT 19 | Keep compact | Outcome and review date anchor the change. |
| Plan update | Keep | This is the strongest outcome-oriented screen heading in the tour. |
| BEFORE THE TEST | Keep | Comparison is to the original plan, not a fabricated prior failure. |
| Write for 25 min after breakfast. | Keep | Actual pre-test action. |
| KEEP FROM THE TEST | Rewrite | **Proposed next plan.** The current label makes the state harder to interpret. |
| YOUR UPDATED PLAN | Keep after acceptance | Do not show an applied label while the recommendation is pending. |
| Open your draft before email. | Lead and highlight | This is the visible difference; the product should make it unmistakable. |
| 25 min after breakfast · Tue & Thu | Keep | Shows what stays the same without a new paragraph. |
| YOUR TWO REPORTS | Shorten | **Two reported sessions.** Makes evidence type explicit. |
| Oct 13 / Oct 15 · Started before email · 25 min | Keep two aligned rows | The recommendation is visibly based on dated attempts. |
| Starting felt easier. | Keep as user report | Not a universal claim or measured causal effect. |
| No new case study published. | Preserve fact, consider status wording | **Still 1 of 3 published.** Distinguish behavioral success from goal attainment through the UI. |
| WHY KEEP THIS CHANGE | Keep once | This is where a concise rationale earns space. |
| A breakfast cue may help you start before email. | Keep once | The same saved rationale, not newly generated generic science. Avoid repeating it again in a sidebar paragraph. |
| Implementation intentions | Secondary source access | Method name supports inspection. It is not an endorsement badge. |
| Keep testing / Review Oct 25 | Keep compact | Two reports justify tentative continuation and a later review, not declaring the question settled. |
| Use this plan | Keep | Clear acceptance of the proposed revision. |
| Plan updated | Keep | A concrete product result. Bring the page CTA back near this moment. |
| Next session Oct 20 · Review Oct 25 | Keep, de-duplicate review date | Connect the learned change to the next action. |

## Phone 6: every conversation message

Source: `portfolioConversation` in `src/landing-story.ts`. The problem is duplication and wording length, not the existence of a deeper conversation. Move the early exchange to the obstacle/test beats; use the later exchange to prove continuity.

| Current message | Decision | Proposed treatment |
| --- | --- | --- |
| I skipped writing on October 1. Email took over after breakfast. | Keep | Strong concrete opening. Place before the experiment, once. |
| Was the 25 minutes still available before you opened email? | Keep, shorten slightly | **Was the 25 minutes available before you opened email?** The answer can change the appropriate support. |
| After breakfast I open email, and my writing time disappears. I still have 25 minutes if I open the draft first. | Shorten | **Yes. I can write for 25 minutes if I open the draft first.** Do not repeat the obstacle just stated. Preserve the full report in saved evidence. |
| After breakfast, open your draft before email. Work on your chosen case study for 25 minutes. | Shorten | **After breakfast, open your draft before email. Write for 25 minutes.** The chosen work is already visible. |
| Linking breakfast to opening your draft may help you start before email takes over. | Keep once, adjacent | The actual saved rationale. Put it beside the proposal, or in the reply, rather than both plus another sidebar. |
| Try it October 13 and 15, then review on October 19? | Keep, reduce repetition | **Try it October 13 and 15?** The adjacent proposed-test card must still show the Oct 19 review before agreement. |
| Yes, let’s try it. | Keep | Acceptance precedes the saved experiment. |
| Did you open the draft before email? Did you get your writing time, and was this workable? | Shorten | **Did you open the draft first? How much writing happened, and how did starting feel?** Preserve exposure, behavior and workability; do not multiply questions into a new intake. |
| On October 13 and 15, I opened my draft before email after breakfast and wrote for 25 minutes. Starting felt easier. Neither session finished another case study. | Shorten | **I opened the draft first both days and wrote 25 minutes each time. Starting felt easier.** The same view should retain **1 of 3 published**, so shortening does not imply another outcome. |
| Both sessions went as planned, and starting felt easier. Two reports are encouraging, but early. Keep draft-before-email next week and review on October 25? | Shorten, lead with proposed action | **Keep draft-before-email next week and review October 25? Two sessions are encouraging, but early.** The report above already states what happened. |
| Keep draft before email in my next plan. | Keep or shorten | **Yes, keep it.** The immediately preceding proposal must make “it” unambiguous. |
| What do I have to do today? | Keep | A natural question that demonstrates saved-plan continuity. |
| Two actions today: Portfolio: 25 min after breakfast, before email. Reading: 20 pages after lunch. | Keep formatted as two entries | Actionable and brief. Preserve the reading plan's actual cue for Oct 20. |
| Am I on track with my portfolio? | Keep | A real buyer question; do not drop it just to shorten the tour. |
| Your first milestone is done: 1 of 3 case studies published. Next: case study 2 by November 1. | Keep | Answers from recorded progress without inventing a future success probability. |
| I need a new publication report to update the outlook for this plan. | Rewrite or make actionable | **How far along is case study 2?** if the coach is genuinely requesting the missing observation. Otherwise end at the factual milestone status. Preserve the unavailable forecast; do not manufacture “on track.” |
| Book today’s portfolio session. | Keep in compact final exchange | Shows that the conversation can result in a concrete action. |
| 8:30–8:55 is available. Book it in Google Calendar? | Keep | Availability followed by explicit confirmation. This is useful product behavior, not expendable consent text. |
| Yes, book it. | Keep | Required before this depicted external booking. |
| Booked for 8:30–8:55. | Merge with result card | The card already provides the time and confirmed result. Keep a minimal conversational acknowledgment if needed. |

| Other iMessage text/visual | Decision | Treatment |
| --- | --- | --- |
| Adler contact name/avatar, blue outgoing and gray incoming bubbles | Keep | Familiar, credible presentation. |
| October 10 / 12 / 19 / 20 dividers | Keep where the date changes | Make the passage of time clear without replaying the entire thread in a later chapter. |
| Typing dots | Optional | Can signal a reply is next, but must not become a separate scroll stop or timed wait. |
| EXPERIMENT ADDED / Draft before email | Keep once | The action produces a durable visible result. |
| 25 min after breakfast / Oct 13 & 15 · Review Oct 19 / Waiting for your first report. | Keep on saved experiment card | This is the compact organized record the user asked for. Do not repeat all of it in adjacent narration. |
| PLAN UPDATED / Draft case study 2 before email | Keep once | Makes the resulting plan concrete. |
| 25 min after breakfast · Tue & Thu / Next session Oct 20 · Review Oct 25 | Keep on plan card | Schedule and next review; no separate save-state lesson. |
| TUE, OCT 20 / Portfolio session / 8:30–8:55 · Case study 2 | Keep on booking card | Sufficient event details. |
| Booked in Google Calendar | Keep | Clear committed external state after confirmation. |
| iMessage composer placeholder and send icon | Keep chrome, passive | Demonstration must remain noneditable; do not add visitor input controls to a scripted exchange. |

## Phone 7: connections

| Current text or element | Decision | Criticism and treatment |
| --- | --- | --- |
| Connections | Move out of the main tour | A settings catalog is a weak ending for this buyer story. |
| Google Calendar / Connected | Keep where it supports the actual booking | Demonstrate the session in its calendar context once. Availability/setup must be true for the sold offer. |
| AI assistants / Goal, plan & reports | Move to setup or optional detail | Abstract capability without an immediate user outcome. Compatible MCP access is not proof of every branded consumer integration. |
| IN YOUR CONNECTED CALENDAR | Shorten or remove | The recognizable event view and confirmed booking are enough. |
| Portfolio session / date / time / Booked in Google Calendar | Keep once | The same card is already used in the conversation. Avoid another full demonstration of it. |
| 9:00 / Team meeting | Keep if needed for context | Shows why the chosen slot fits, without another explanatory panel. |
| Linked to: Publish 3 case studies | Keep compact goal association | Can be visible on the event rather than a separate footnote. |
| YOUR ASSISTANT HAS THE CONTEXT | Remove from default story | Backend continuity should be proven by the next useful response, not announced. |
| ChatGPT, Claude, Gemini logos | Remove from the default pitch until respective consumer paths are verified | Provider APIs and compatible client access do not establish those products as delivered one-click connections. |
| Publish my portfolio / 1 / 3 published | Remove duplicate card | The same state has already been established. Retain the shared state in the actual product. |
| NEXT ACTION / Draft case study 2 before email. | Show through the final text agenda instead | A concrete response proves memory more effectively than a context inventory. |
| Includes your two trial reports. | Remove duplicate narration | The evidence-informed response should demonstrate this. |
| Apple Calendar / Connect | Move to actual setup | It has no role in this portfolio story unless used. State actual availability in the setup flow. |
| Apple Health / Connect | Remove from this landing build | The implementation boundary says this remains a gap. It is also unrelated to the shown goal. |

## Closing and footer

Sources: `src/MountainFinale.tsx`, `src/LandingCore.tsx`.

| Current line or element | Decision | Criticism and treatment |
| --- | --- | --- |
| A GOAL THAT MATTERS TO YOU | Remove | Generic and already presumed throughout the story. |
| Your someday. | Remove | Returns to vague aspiration after a measurable goal with dates. |
| It starts with one step | Remove | Familiar motivational line; adds no reason to choose Adler. |
| Mountain chart shape, grid and convergence | Remove from the scroll path | Four desktop viewport heights for a metaphor. It can be a small static brand detail, but should not resemble another data result or delay the offer. |
| Let’s give it a start. | Rewrite | **Which goal do you want to work on?** Clear next action, consistent with the product. |
| One goal. One manageable first step. | Remove or replace with actual offer | Repeats setup. The missing information is price/access/what happens next. |
| Take your first step | Standardize | **Start with a goal.** Changing CTA language adds no value. |
| Footer wordmark | Keep | Simple identity and home navigation. |
| How it works | Keep optional navigation | Same anchor as the header. |
| Our approach | Rename consistently | **The method.** |
| Explore the app | Replace consistently | **Sign in** for returning users, not an implied public sandbox. |
| © 2026 Adler | Keep | Ordinary footer information. |
| Privacy / Terms / Help | Keep | Necessary answers close to the offer; their contents must remain truthful about data, setup and billing. |
| Proudly built in Canada | Keep small or remove if space is tight | Brand provenance, not proof of coaching quality. No separate section or animation. |

## First click: part of the landing's promise

Source: `src/Auth.tsx`; destination inspected without creating an account.

| Current line | Decision | Criticism and treatment |
| --- | --- | --- |
| YOUR ADLER WORKSPACE | Remove jargon | The user clicked to start a goal. **Create your account** is clearer if signup must come first. |
| Start with a goal of your own. | Align with the actual step | The form currently asks for credentials. **Create an account to save your goal** is an honest transition; ideally preserve an already-entered goal through signup. |
| Your goals, conversations, and check-ins stay together across the app and your connected phone. | Shorten | **Save your goal, plan and conversations in one place.** Phone setup belongs later unless already configured. |
| Create workspace / Create my workspace | Rewrite | **Create account.** The buyer does not need workspace terminology. |
| Sign in / Welcome back. | Keep | Familiar returning-user language. |
| Username / Password | Functional; review flow separately | The current build uses these. Do not promise email login or password reset without implementing it. |
| Use at least 10 characters. | Keep with password requirements | Clear functional help. |
| Keep your password somewhere safe; email recovery is not configured. | Fix the underlying gap | Do not merely hide this warning. A paid consumer account needs a supported recovery path consistent with the offer. |
| Opening… / Back to Adler | Keep | Ordinary state and navigation. |

## Shared phone chrome and accessibility

Keep meaningful status symbols, Adler branding, dates, checks, goal/action associations and familiar back/composer controls where they orient the shown interface. The sample status time, avatar initial, repeated weekday initials, chart tick numerals and device chrome do not require new marketing copy or separate animation stages. Reduce their visual cost on mobile if they make the actual product unreadable.

Retain noninteractive semantics for the demo and accessible descriptions of each state. Update descriptions with the shortened chronology. Keep real keyboard navigation, reduced-motion support, and a way to bypass the story. Accessibility summaries must describe the depicted example and its limitations, not invent availability or user results.

## Every “Inside Adler” sentence

The rows below quote every current title, context, reason and result once, in order. Their individual verdicts implement the shorter story recommended above. Removing a sentence from the landing never means removing the underlying validation, evidence, memory or authorization behavior.

### goals

| Step / field | Current exact copy | Decision | Reason / destination |
| --- | --- | --- | --- |
| 1 · title | Make “finished” specific. | Merge | Use the visible rough idea → measurable goal as the heading’s proof. |
| 1 · context | You want to finish your portfolio. | Delete | Repeats the user’s portfolio message. |
| 1 · reason | A useful plan needs an observable finish. | Delete | A definition of good planning is weaker than the visible specific finish. |
| 1 · result | Adler asks what finished would include. | Delete | The exact question is already in the phone. |
| 2 · title | Use what you’ve already shared. | Move | Keep context reuse as one supporting benefit, not another setup lesson. |
| 2 · context | Three projects chosen. Fifty minutes a week available. | Delete | Projects and available time are already in the phone. |
| 2 · reason | The plan has to fit your actual week. | Merge | Retain the useful constraint in one caption: Your goal, deadline and available time shape the first plan. |
| 2 · result | Adler brings your outcome, deadline and available time together. | Delete | Restates the assembly of information already shown. |
| 3 · title | Work backward to a first action. | Merge | The goal → milestone → action layout should explain this directly. |
| 3 · context | Three published case studies by November 15. | Delete | Repeats the goal headline and date. |
| 3 · reason | Milestones make the outcome concrete; dated actions make it possible to start. | Move | Useful product-structure explanation for onboarding or the method, excessive beside the complete plan. |
| 3 · result | Adler checks the schedule and capacity, then presents a plan for you to accept. | Shorten | Capacity checking matters; say The proposed work fits the time you said was available. Show acceptance in the phone. |
| 4 · title | Save something you can act on. | Delete | Another generic setup headline after the result is already visible. |
| 4 · context | You’ve accepted the goal and first plan. | Delete | The acceptance is depicted in the phone. |
| 4 · reason | The goal, milestones and actions need to stay connected. | Delete | Connected records are a system requirement, not another buyer lesson. |
| 4 · result | Adler saves them together. Later work can change as you learn. | Merge | Let the saved goal and later changed plan prove continuity; retain provisional later work in the app. |

### plan

| Step / field | Current exact copy | Decision | Reason / destination |
| --- | --- | --- | --- |
| 1 · title | Read today’s actual plan. | Merge | Use See what to do today for the whole beat. |
| 1 · context | Writing and reading are scheduled for today. | Delete | The two visible action cards already communicate this. |
| 1 · reason | You need the next actions across your goals in one place. | Delete | Explains why a task list exists rather than why this coach is valuable. |
| 1 · result | Adler shows what’s due and what you’ve already reported. | Shorten | One caption is enough: Today’s actions come from your saved goals and schedule. |
| 2 · title | Keep partial work visible. | Delete | A report-state tutorial does not merit another major heading. |
| 2 · context | You report that some of the writing happened. | Delete | The yellow square is the visible report. |
| 2 · reason | Some work and no work are different observations. | Move | Preserve the distinction in state semantics and accessible labels, not repeated landing prose. |
| 2 · result | The report updates today’s square to yellow. | Delete | Narrates the color change the visitor can already see. |
| 3 · title | Record the work you did. | Delete | Another basic report-state heading. |
| 3 · context | You report completing the 25-minute session. | Delete | The completed session is already labeled. |
| 3 · reason | Writing is an input; a published case study is a separate outcome. | Move | Make this distinction visible once in the progress chart: work and publication are separate. |
| 3 · result | Today turns green. Rest days preserve your streak without adding work. | Move | Keep the scheduled-rest rule in the product and help; the green square demonstrates this update. |
| 4 · title | Keep a miss in the record. | Delete | No separate lesson is needed to explain saving an X report. |
| 4 · context | You report that reading didn’t happen. | Delete | Repeats the secondary reading card’s miss. |
| 4 · reason | A missed action alone doesn’t tell Adler what got in the way. | Merge | Use the useful principle once in the main portfolio conversation: ask what got in the way. |
| 4 · result | Adler records the miss without changing your plan. | Delete | Expected bookkeeping, not a new reason to buy. |
| 5 · title | Add the reason, in your words. | Delete | Remove this second-goal branch from the main story. |
| 5 · context | You say work ran late. | Delete | Work ran late is a different obstacle from the portfolio’s email sequence. |
| 5 · reason | A time constraint calls for different support than difficulty starting. | Move | Use the distinction in the portfolio clarification, where available time actually affects advice. |
| 5 · result | Adler keeps that context with the action for the next coaching conversation. | Delete | Retain context in the real product; do not narrate storing it again. |

### progress

| Step / field | Current exact copy | Decision | Reason / destination |
| --- | --- | --- | --- |
| 1 · title | Separate effort from results. | Merge | Use the visual distinction between recorded work and published case studies. |
| 1 · context | 87 minutes of writing reported. One case study published. | Keep compact | One of three published should lead. The input total can sit in the projection basis. |
| 1 · reason | Doing the work doesn’t automatically mean the outcome happened. | Keep once | Important scientific meaning, but express it through separate work/result labels plus a short caption. |
| 1 · result | Adler plots published work and keeps writing reports alongside it. | Delete | Narrates the chart already visible beside it. |
| 2 · title | Show a conditional projection. | Delete | The graph and its legend already announce the projection. |
| 2 · context | One measured interval links recorded writing with publication. | Shorten | Early estimate from one observed period is more readable than measured-interval terminology. |
| 2 · reason | That early pattern is uncertain. It may not continue. | Keep | Consequential uncertainty must stay beside the forecast. |
| 2 · result | The projection shows a November 5 finish if it does, with a range that includes no further progress. | Keep compact | Preserve the conditional date and range, but do not repeat the full graph explanation in a second panel. |
| 3 · title | Keep the next milestone clear. | Delete | The next-milestone card already supplies this orientation. |
| 3 · context | The next target is case study 2 by November 1. | Delete | Repeats the card’s exact milestone and date. |
| 3 · reason | An estimate helps you assess a plan; it doesn’t move your target. | Move | Keep target and projection visually distinct; the conceptual explanation belongs in optional detail. |
| 3 · result | Adler keeps the milestone visible and updates the outlook as you report results. | Shorten | Show the next target and ask for new outcome reports when needed. Avoid an extra claim-like explanation of updating. |

### checkin

| Step / field | Current exact copy | Decision | Reason / destination |
| --- | --- | --- | --- |
| 1 · title | Match the support to the obstacle. | Merge | The short beat is Try a change with a reason. |
| 1 · context | Email takes over after breakfast. You say 25 minutes are available before it. | Keep compact | The user-reported time constraint and available alternative are necessary premises. Do not repeat them in both phone and sidebar. |
| 1 · reason | An if–then plan may help link breakfast to opening your draft. | Keep | This is the decision-relevant rationale. Connect it to the exact saved implementation-intention claim. |
| 1 · result | Adler proposes changing the order, keeping your chosen work and writing time. | Merge | The cue sequence and unchanged 25-minute amount show the proposal without another description. |
| 2 · title | Turn the idea into a test. | Merge | The structured test card communicates this better than a separate heading. |
| 2 · context | You agree to try drafting before email. | Delete | The acceptance message already establishes agreement. |
| 2 · reason | The test needs a prediction, two opportunities and something observable to report. | Move | Keep prediction, opportunities and signals in the actual test card; this meta-description is unnecessary. |
| 2 · result | Adler saves a goal-linked experiment for October 13 and 15, with an October 19 review. | Delete | The saved card already shows the goal, dates and review. |
| 3 · title | Wait for what actually happens. | Delete | A waiting state is important; a whole waiting lesson is not. |
| 3 · context | The experiment is accepted. Neither session has been reported yet. | Merge | Use Awaiting reports on the accepted test card. |
| 3 · reason | Agreeing to try something is not evidence that it helped. | Keep meaning | Agreement is not exposure. Convey it through the state and use this explanation in optional scientific depth. |
| 3 · result | Adler keeps the prediction and waits for your reports of starting and minutes written. | Delete | Repeats the waiting status and evidence fields. |

### insights

| Step / field | Current exact copy | Decision | Reason / destination |
| --- | --- | --- | --- |
| 1 · title | Compare the reports with the prediction. | Move | Useful review method, but lead the buyer with the proposed plan change. |
| 1 · context | You started before email and wrote 25 minutes on both trial days. | Keep visually | Keep the two dated result rows instead of restating them in prose. |
| 1 · reason | Starting felt easier, but no additional case study was published. | Keep as reported facts | Starting felt easier and publication remains 1/3. Use concise separate labels. |
| 1 · result | Adler reviews the original test against those specific reports. | Delete | Narrates review without adding evidence or a new user benefit. |
| 2 · title | Show exactly what would change. | Delete | Show the before/after; do not explain that you are showing it. |
| 2 · context | Both reported trials went as intended. | Delete | The two report rows already establish this. |
| 2 · reason | The breakfast cue may help you start. Two reports support trying again, not a proven rule. | Keep, shorten | The cue may help starting; two reports support trying again. Preserve uncertainty and the specific basis. |
| 2 · result | Adler proposes keeping draft-before-email in the next plan, with another review. | Merge | The proposed plan and next review should carry this information directly. |
| 3 · title | Carry the learning into your plan. | Merge | Use the concrete beat Put what you learned into your plan. |
| 3 · context | You’ve accepted the revised plan. | Delete | Visible acceptance already establishes this. |
| 3 · reason | The useful change should become your next action, not another tip to remember. | Keep idea, shorten | This is the strongest value: the agreed change becomes your next action. Say it once. |
| 3 · result | Adler saves the next plan and October 25 review, preserving the original test and reports. | Move | Show the updated plan and next review. Preservation of test history belongs in inspectable depth, not another paragraph. |

### imessage

| Step / field | Current exact copy | Decision | Reason / destination |
| --- | --- | --- | --- |
| 1 · title | Connect your message to your goal. | Delete | A second introduction to context restarts the story. |
| 1 · context | You describe the writing session you missed on October 1. | Keep in the message | The specific dated miss is valuable; no separate narration is needed. |
| 1 · reason | Your saved goal, action and reports give this message context. | Move | One short continuity statement near the final text exchange is enough. |
| 1 · result | The same coach used in the app receives your text. | Keep once | Text and in-app chat use the same coach. Demonstrate it through the remembered plan. |
| 2 · title | Check what would change the advice. | Shorten | Ask what could change the advice is useful, but the phone’s question should lead. |
| 2 · context | Email took over the writing window. | Delete | Repeats the user’s just-visible report. |
| 2 · reason | If the time wasn’t available, a different cue wouldn’t solve that. | Keep | This is a substantive explanation of why the question matters. |
| 2 · result | Adler asks whether the 25 minutes were available before email. | Delete | The phone already shows the exact question. |
| 3 · title | Use the answer as evidence. | Delete | No separate lesson on turning an answer into evidence. |
| 3 · context | You confirm you can write if you open the draft first. | Keep in the message | The availability confirmation is a necessary personal premise. |
| 3 · reason | That makes the order of actions a reasonable thing to test. | Merge | Connect this tentative fit to the proposed cue change; do not create another intermediate panel. |
| 3 · result | Adler keeps your report as the premise for its suggestion. | Delete | Another description of saving a report. |
| 4 · title | Explain why this might help. | Delete | The actual reason can stand without a heading that announces explanation. |
| 4 · context | Breakfast is an existing cue. Email gets opened before the draft. | Merge | Keep the observed order in the cue visual or one sentence. |
| 4 · reason | Implementation intentions link a specific situation to a chosen action. | Keep with application | Use the specific if–then mechanism and link to the saved source, paired with why it fits this reported obstacle. |
| 4 · result | Adler checks the suggestion against the research and your report, then proposes a two-session test. | Move | The review/checking mechanism is useful scientific depth. Default copy should explain the proposed action’s fit and uncertainty. |
| 5 · title | Save the agreed experiment. | Merge | The saved experiment card is the result; remove a second setup sequence. |
| 5 · context | You say yes to the proposed test. | Delete | Repeats Yes, let’s try it. |
| 5 · reason | You shouldn’t have to remember advice scattered across messages. | Keep idea once | Organized follow-through is valuable. Prove it with the saved test and later plan rather than explaining it repeatedly. |
| 5 · result | Adler validates and saves the experiment, its prediction and review date with your goal. | Move | Validation, prediction and goal linking remain implemented, but their full description belongs in the method view. |
| 6 · title | Learn from reported use. | Merge | Use the review beat; do not replay it in a second chapter. |
| 6 · context | You report opening the draft first and writing 25 minutes on both days. | Keep as dated reports | Show the original user report and trial rows once. |
| 6 · reason | Use, starting, writing time and publication are separate observations. | Move | Retain distinct labels for exposure, behavior and goal outcome; avoid an enumeration of methodology in the main pitch. |
| 6 · result | Adler attaches the reports to the existing test for review. | Delete | Attaching reports is invisible bookkeeping; show the consequential review instead. |
| 7 · title | Keep the conclusion proportionate. | Delete | This reads like an internal evaluator instruction. |
| 7 · context | Starting felt easier in two sessions. No new case study was finished. | Keep facts | Show user-reported easier starting and the unchanged publication count. |
| 7 · reason | That is encouraging early evidence, not proof that the cue caused it. | Keep briefly | Two sessions are encouraging, but early. The longer causal explanation can remain inspectable. |
| 7 · result | Adler proposes continuing for another week and reviewing on October 25. | Keep as proposed action | The next plan and review are the practical conclusion; show the user’s decision. |
| 8 · title | Update the plan after you agree. | Merge | One clear confirmation → plan-updated transition is enough. |
| 8 · context | You ask to keep draft-before-email. | Delete | Repeats the user’s visible agreement. |
| 8 · reason | A recommendation needs to reach the plan you actually use. | Keep idea once | The recommendation becoming an executable plan is central; express it in the shortened plan-update beat. |
| 8 · result | Adler saves the next plan while keeping the trial’s original prediction and evidence. | Move | Preserve prediction/history in the system. The default visual should show the actual next action. |
| 9 · title | Read the current plan, wherever you ask. | Shorten | Keep going by text is enough for the final exchange. |
| 9 · context | It’s October 20. The revised plan is now current. | Keep date in the thread | The date establishes which plan is current; no extra sentence is needed. |
| 9 · reason | Text and in-app chat use the same saved workspace. | Keep once | Text and app use the same goal, plan and reports. |
| 9 · result | Adler reads today’s actions across your goals. | Delete | Show the returned agenda instead of announcing that Adler reads it. |
| 10 · title | Give you the next actions. | Delete | The response itself demonstrates this. |
| 10 · context | Writing and reading are due today. | Delete | Repeats the two due actions. |
| 10 · reason | A factual agenda doesn’t need a new coaching recommendation. | Move | Correct engineering distinction, but not a consumer sales argument. Keep it in implementation documentation. |
| 10 · result | Adler replies with the two actions and their existing cues. | Delete | Narrates the visible reply. |
| 11 · title | Answer from recorded progress. | Delete | Let the concrete answer lead. |
| 11 · context | One of three case studies is published; the next is due November 1. | Keep in reply | The published count and next target answer the user’s question. |
| 11 · reason | Two writing sessions don’t establish another published case study. | Keep meaning once | Do not infer publication from writing; show current outcome and keep the forecast appropriately unavailable. |
| 11 · result | Adler reports the milestone status and says what’s needed to update the outlook. | Rewrite through the response | Answer with the milestone status and a useful question if a new outcome report is needed, rather than announcing how the answer is generated. |
| 12 · title | Check the calendar before offering a time. | Shorten | A real proposed time is enough to demonstrate calendar support. |
| 12 · context | You ask to book today’s portfolio session. | Delete | Repeats the booking request. |
| 12 · reason | A time needs to fit your calendar, and the booking needs your confirmation. | Keep behavior | Show availability and explicit confirmation. No separate consent tutorial is necessary. |
| 12 · result | Adler checks availability and offers 8:30–8:55. | Delete | The offered time is already visible. |
| 13 · title | Make the confirmed change. | Delete | The confirmed booking card is the meaningful result. |
| 13 · context | You confirm the proposed time. | Delete | Repeats Yes, book it. |
| 13 · reason | The saved plan and calendar should refer to the same session. | Move | Keep the event linked to the chosen action; this relationship can be labeled on the event. |
| 13 · result | Adler rechecks availability, creates the calendar event and saves the linked work block. | Move | Rechecking availability and stable linked records are real implementation details. Keep in method/setup documentation, not another landing paragraph. |

### connections

| Step / field | Current exact copy | Decision | Reason / destination |
| --- | --- | --- | --- |
| 1 · title | Keep the session connected to its goal. | Merge | Use the confirmed event within the final conversation, not another chapter. |
| 1 · context | Your confirmed portfolio session is booked before the team meeting. | Keep event context | The session and meeting establish the booking’s practical fit. |
| 1 · reason | Calendar time is useful when it points back to the work you chose. | Delete | Explains an obvious benefit of labeled calendar time. |
| 1 · result | Adler keeps the calendar event and planned action linked. | Move | Keep the linkage in the app and optional setup detail. |
| 2 · title | Use one coach and one record. | Keep idea once | One coach with one shared record is useful. The final remembered response should demonstrate it. |
| 2 · context | Your goal, current plan and two trial reports are saved in Adler. | Delete | Repeats the goal, plan and evidence inventory. |
| 2 · reason | Switching interfaces shouldn’t mean starting the conversation over. | Keep idea, shorten | You should not have to explain the same goal again. Do not claim all competing tools lack memory. |
| 2 · result | Compatible assistants can read that context and reach the same coach through Adler’s connection tools. | Move and verify availability | Compatible tools can use the shared service, but this does not establish every branded consumer integration. Put exact setup in Connections. |

All 132 sidebar fields are covered. The main recommendation replaces this narration with eight short, decision-relevant explanations while retaining the underlying methodology and evidence.
