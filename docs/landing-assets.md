# Landing page assets

The current page implements the [landing critique](research/landing-page-critique.md): a literal follow-through promise, original abstract brand artwork, eight parts of one goal's history, and a short invitation to start.

## Current page and visual assets

- `LandingHero.tsx` names the AI goal coach within an unframed page composition: two transparent abstract forms unfold, turn and settle toward the app in twelve held scroll poses. A ribbon and a shared background connect the sections; artwork may cross the boundary. Motion reverses with scroll, adds no extra section, waits for the pictures to load and decode, and stays on the first pose with reduced motion. Responsive WebPs are local in `public/media/hero`; [art direction and exact generation prompts](research/landing-hero-art-direction.md) record their provenance. `LandingEvidence.tsx` supplies the tour’s before/after plan comparison, reports and research disclosure.
- `LandingJourney.tsx` uses eight parts and 19 scroll states: goal creation, today's actions, a barrier conversation, dated progress, an experiment, trial results, the accepted next plan and continuing in iMessage. Forward scroll advances, backward scroll rewinds, and stopping holds. No timer, playback control, in-phone click/input/focus, decorative app tab or screenshot expansion is present. These authored demonstrations make no account, coach, message or calendar writes.
- Desktop preserves the centred 390 × 844 phone. Mobile panels use native-size text without a device bezel or scaling. At portrait heights of 620px or less, and wider viewports 600px high or less, the same eight parts appear in normal document flow so complete content stays readable. This fallback presents complete states and the full conversation. Reduced motion disables decorative motion and retains deliberate navigation.
- One short explanation accompanies each part. The research disclosure uses the same saved personal observation, mechanism, prediction/feedback and limits as the fixture. A pre-test explanation excludes later reports. It is an authored account of the service's decision, not live agent activity or a reasoning transcript.
- `LandingClosing.tsx` replaces the long mountain finale. The primary action opens the goal input before account creation; authentication preserves the pending goal. Sign-in links open login. No price, trial, billing service or customer proof was invented. The goal input does not itself claim that a researched plan has already been saved.
- Removed from the active page: standalone problem/ribbon introduction, decorative bloom and backdrop, store buttons for unavailable downloads, connection catalog, repeated bottom controls and mountain finale. Historical assets remain source material and are not loaded.
- App headings and visual structure carry the meaning: a SMART goal and milestone/action rows, weekly status cells, a complete projection fan, a phone-away/write sequence, dated trial results and a before/after plan comparison. The website and metadata use the same literal promise.

All scenario data is fictional. The relevant records are in `scripts/landing-workspace.ts`; the presentation and saved rationale share `src/landing-story.ts`.

| Scene | Record and state |
| --- | --- |
| Goal | The person wants three case studies published by November 15, has chosen the projects, and can write for 25 minutes at 8:30 on Tuesdays and Thursdays. The demonstration clarifies the outcome, reviews milestones and contributing work, and saves the first plan. Later work remains provisional. |
| Today · October 8 | Portfolio writing and evening reading are due. Scrolling shows partial work and completion. The missed portfolio session and its context appear in the subsequent barrier exchange. Seven cells belong to the reported portfolio action. Planned rest preserves continuity without work credit; future dates remain future. |
| Barrier · October 10 | A report about losing the October 1 writing session to phone scrolling leads to a question about needing the phone for work or being reachable. The user confirms it can stay in the kitchen. No cause is inferred from the missed check-in alone. |
| Progress · October 11 | Six writing reports: three done, one partial, two explicit noncompletions. The first published case study is a separately attributed outcome. Explicit fictional measurements total 87 writing minutes (12, 25, 25 and 25) with two reported misses. The shared projection engine calculates an early conditional November 5 finish at the recorded 29 minutes/week pace. The one comparable interval supports only an exploratory association; the range includes no further progress. Dated targets remain commitments. The later phone-away plan requires new comparable evidence instead of inheriting this estimate. |
| Experiment · October 12 | The person reports phone scrolling displaced writing and confirms the phone can stay in the kitchen. The agreed test changes its location, retaining the 25-minute work at 8:30 and Tuesday/Thursday opportunities. Acceptance does not establish use or a result. Review is October 19. |
| Learning · October 19 | On October 13 and 15, the user reports keeping the phone in the kitchen, not checking it, and writing for 25 minutes. The recommendation carries that setup into the next plan, visibly contrasting it with the pre-test plan. Agreement saves version 3 without rewriting the trial’s original prediction. No additional publication is inferred; the next review is October 25. |
| Text · October 20 | The current accepted plan informs the due agenda and milestone answer. The old forecast is not reused. An explicit booking request, proposed available time and confirmation precede the 8:30–8:55 portfolio block in an already connected calendar. |

The retained opaque `writing-finish` ID uses `claim:com-b-opportunity` (theoretical distinction, relation `defines`) and `claim:situational-modification-student-trials` (empirical finding, relation `motivates`), with source snapshots and P7. The latter is B/moderate for short student field experiments with one-week self-report and transfer limits; it does not inherit P7's broader A grade. The research does not isolate phone placement or establish benefit for this adult, their portfolio or Adler. Two reports support considering continuation, not a causal conclusion. The short rationale summarizes the same saved observation and mechanism; the detail retains original prediction, review timing and uncertainty. See [source curation](research/claim-curation.md#13-claimsituational-modification-student-trials).

Adler supports execution of the person's chosen work. The recommendation changes the surroundings, without choosing portfolio content or prescribing domain-specific work. The user's chosen 8:30 time and 25-minute session are held constant; neither is asserted to be an optimal dose.

## Copy and projection verification

Adler's actual `Service.chat` and its semantic review ran against an isolated fictional workspace using the configured Gemini provider. The review informed the app labels, measurable goal structure, trial evidence and explicit booking confirmation. Its suggestion to remove streaks conflicted with the user's accepted scheduled-day rule and was rejected. The review was editorial; it did not modify real accounts or authorize external work. The deeper conversation and explanation of the shared service received a second actual `Service.chat` and semantic-review pass. The user’s scheduled-day streak rule still takes precedence over the coach’s historical no-streak instruction. A further actual `Service.chat` and semantic-review pass checked the phone-distraction revision: it supported the general behavioral recommendation and the distinction between work and publication. Its suggestion to refer to the immediately preceding Thursday was not adopted because October 8 already has a completed writing report; October 1 remains the explicitly dated miss. Its more assertive “removes the cue” suggestion remains the narrower “may reduce the pull to check it.” The original prediction now names fewer checks and more writing; the follow-up separately asks what actually happened.

`src/landing-progress.json` is a recorded output of `goalProjection(portfolioSnapshot("2026-10-11T18:00:00-04:00"), …, "2026-10-11")`, including the complete assumptions and 41 scenario points. The fixture regression recomputes and compares it with the shared engine. It contains fictional evidence, not observed customer performance. No forecast algorithm or coaching prompt changed.

Browser regressions exercise all scroll frames forward and backward, matching explanations, complete content without clipping, passive clicks, no time-driven advancement, blue/gray iMessage styling, accepted experiment and plan states, explicit booking confirmation, desktop device proportions, native-size mobile text, complete short-viewport flow, keyboard navigation, research disclosure and reduced-motion scrolling. Authentication tests also cover goal-before-signup and login mode. Checking only reduced motion previously missed the opacity-zero pause defect; normal-motion verification is required.

## Earlier generated artwork

An earlier paper texture was generated with the built-in image tool on September 10 and is retained locally in `.context/landing-simplification/paper-texture-unused.jpg`. It and the original mountain/bloom are not loaded by the landing. The later hero-art direction uses the two transparent forms listed above; the product’s plan, reports and graph remain the tour’s visual explanation.

## Integration implementation boundaries

The landing no longer shows an integration catalog or implies Apple Health and branded consumer-assistant integrations are delivered. Current calendar/text adapters and compatible MCP access retain their actual setup requirements. The `/integrations` catalog preserves runtime availability labels. A model provider's API does not establish its consumer-app integration. The final text scene assumes a previously connected calendar and requires explicit confirmation before displaying the booking.

Scheduled session and end-of-day check-ins use the existing per-user workspace, credentials and durable jobs. They require a linked phone and enabled check-ins. The runtime’s factual invitation is separate from interpreting a reply or changing a plan through the shared coach.

## Earlier app-capture workflow (not loaded by the landing)

With the local development server running:

```sh
LANDING_CAPTURE_URL=http://127.0.0.1:5173 npx tsx scripts/capture-landing.ts
```

The script renders `scripts/landing-workspace.ts` in the real app at 390 CSS pixels and 2× resolution, with fixed dates, an idle event stream and mocked read-only API responses. Historical portfolio snapshots exclude later plans, feedback and bookings. All Goals is captured September 21, Today October 8, progress October 11, the experiment in the goal view October 12, and pending learning and reasoning October 18. The calendar uses October 20 at 08:00, before that day’s sessions. The fictional calendar block and booking response refer to the same Tuesday session. The connections capture renders the actual public catalog, including its availability labels. Surrounding navigation is hidden for framing. Unexpected API requests fail the capture.

Earlier WebP captures in `public/media/app`: `goals-mobile`, `plan-mobile`, `hero-progress-mobile`, `portfolio-experiment-mobile`, `portfolio-learning-mobile`, `portfolio-reasoning-mobile`, `calendar-mobile`, `connections-mobile`. PNG originals are in `.context/app-captures`. Older reading/desktop captures, hotspot coordinates and videos remain source material; the landing does not load them.

## Earlier video assets

The background video is generated footage, not a recording of Adler users. Generated September 6, 2026 using the Gemini API, `veo-3.1-fast-generate-preview`, two 6-second, 720p, 16:9 clips. The clips are joined with a 1-second dissolve, muted, desaturated slightly, and encoded as H.264 for the browser. No API keys or provider URLs are sent to the browser.

- Video: `public/media/personal-goals.mp4` (11 seconds; audio removed).
- Poster: `public/media/personal-goals-poster.jpg`.
- REST reference: https://ai.google.dev/gemini-api/docs/veo
- Playback pauses when the tab is hidden. Reduced-motion and data-saving preferences start on the poster without loading the video. A visible playback control is provided.

## Generation prompts

### Running

Premium cinematic sports campaign, aspirational and emotionally powerful, photorealistic 16:9 film. A focused adult recreational runner accelerates along an empty athletics track just before sunrise. Low tracking camera beside their feet rising to a three-quarter silhouette, breath visible in cool morning air, golden rim light through light mist, dramatic long shadows, subtle film grain and deep pine green and charcoal tones. Fluid purposeful forward motion, authentic human anatomy and natural gait. One continuous six-second shot with a smooth cinematic tracking movement. Quiet determination and the feeling of showing up for yourself, not a race or a stadium crowd. High-end athletic brand editorial photography, warm highlights and rich darks. No logos, no text, no branding, no graphics, no speech or music.

### Studying

Aspirational cinematic campaign about personal ambition and dedication, photorealistic 16:9 film. An adult woman intently learning at a desk in a modern room before dawn, framed in profile by a large window overlooking a waking city. She glances from an open textbook to her notebook and confidently writes a short note. A smooth camera push from her focused face to her hand on the page. Dramatic but soft window light, cool pine green shadows, warm amber desk lamp, subtle 35mm film grain, beautiful negative space, tactile paper, natural anatomically correct movement. Premium editorial, visually striking, the quiet work behind a meaningful achievement. One continuous six-second shot, no cuts, no readable text, no logos or graphics, no speech or music.

## Brand artwork

- ChatGPT, Claude, Gemini: `@lobehub/icons-static-svg` via https://cdn.jsdelivr.net/npm/@lobehub/icons-static-svg@latest/icons/ (openai.svg, claude-color.svg, gemini-color.svg).
- Monochrome service marks: Simple Icons via https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/.
- Apple Health, Messages, Calendar, Reminders: Apple App Store artwork from the public iTunes lookup API, app IDs 1242545199, 1146560473, 1108185179, 1108187841 respectively.
- Google Calendar: https://www.gstatic.com/calendar/images/dynamiclogo_2020q4/calendar_31_2x.png.
- Microsoft Outlook: Apple App Store artwork, app ID 951937596.
- Oura: the ouraring.com favicon retrieved via Google’s favicon cache.

The integrations catalog distinguishes planned connections from existing setup paths. It does not show any account as connected without an actual connection. AI model API support is distinct from planned ChatGPT, Claude, and Gemini chat-app connections.

The current iMessage view and calendar entry are rendered in HTML/CSS, using existing Adler and service brand artwork. The entry follows the explicit booking request; there is no example-confirmation control. It is an illustrative conversation, not a message sent or calendar booking made by the landing page.
