# Landing page assets

The active landing leads with “Know what to do next to reach your goals.” After the hero, one centred phone contains the entire story. The original mountain ending follows immediately, with its original copy, styling and scroll animation.

## Current page and visual assets

- `LandingHero.tsx` retains the opening bloom, outcome-led promise, web entry and clearly identified coming-soon store buttons.
- `LandingJourney.tsx` and `LandingAppCapture.tsx` show seven chapters across seven positions in one persistent phone: goals, Today’s next action, progress, a saved experiment, its pending learning follow-up, texting through one iMessage mockup, and connections. Only the texting chapter uses conversation bubbles. The heading mentions texting and in-app chat; one iMessage mockup demonstrates the conversation, without channel buttons or a duplicate chat stop. The phone stays in place while scrolling changes its content and quiet background artwork. Direct selection, arrow keys and skip controls remain available; reduced motion removes blending. Short viewports allow the phone’s contents to scroll so its text need not shrink indefinitely.
- The illustrations use HTML/CSS/SVG summaries of existing app views. Each opens an actual mobile app capture. The learning view also opens the saved reasoning. Connections, the coaching method and setup details are available from the phone footer; they do not add sections to the page.
- `MountainFinale.tsx` retains the original “Your someday.” → “Let’s give it a start.” ending.

All data is fictional. The portfolio story preserves its order: the first plan and Today view precede the October 12 stopping-point test. Progress shows six reported sessions through October 8 (two done, two partial, two reported as not happening) and the first case study published October 11. The displayed learning chapter stops on October 18, with the test awaiting a check-in and no review result. The underlying fixture also retains later history: the person reports using the change on October 13 and 15 and asks to keep it on October 19. That later review preserves the original prediction, attributed feedback, competing explanations and a next review, without appearing in the earlier chapter. Finishing a section does not imply another published case study. A booking changes neither reported work nor the learning result.

The short explanation and saved record share `src/landing-story.ts`. The `writing-finish` record uses `claim:goal-specific-challenging` and P29. Specific, difficult goals generally outperform “do your best” in the cited review; specificity alone is insufficient. Applying this to repeated editing remains tentative. P29 supplies task-fit and transfer boundaries, not a separate efficacy grade. Full claims and limitations remain inspectable.

Scheduled session and end-of-day check-ins use the existing per-user workspace, connections and durable jobs. They require a linked phone and enabled check-ins. The landing is illustrative and sends no messages or calendar writes. The runtime sends a factual invitation; interpreting a reply and changing a plan use the shared coach.

## Refresh the app captures

With the local development server running:

```sh
LANDING_CAPTURE_URL=http://127.0.0.1:5173 npx tsx scripts/capture-landing.ts
```

The script renders `scripts/landing-workspace.ts` in the real app at 390 CSS pixels and 2× resolution, with fixed dates, an idle event stream and mocked read-only API responses. Historical portfolio snapshots exclude later plans, feedback and bookings. All Goals is captured September 21, Today October 8, progress October 11, the experiment in the goal view October 12, and pending learning and reasoning October 18. The calendar uses October 20 at 08:00, before that day’s sessions. The fictional calendar block and booking response refer to the same Tuesday session. The connections capture renders the actual public catalog, including its availability labels. Surrounding navigation is hidden for framing. Unexpected API requests fail the capture.

Active WebP captures in `public/media/app`: `goals-mobile`, `plan-mobile`, `hero-progress-mobile`, `portfolio-experiment-mobile`, `portfolio-learning-mobile`, `portfolio-reasoning-mobile`, `calendar-mobile`, `connections-mobile`. PNG originals are in `.context/app-captures`. Older reading/desktop captures, hotspot coordinates and videos remain source material; the landing does not load them.

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
