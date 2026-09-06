# Landing page assets

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

The phone example is rendered in HTML/CSS so its message, delivery format, and corresponding app check-in can change together. iMessage and SMS are visual examples, not messages sent by the landing page.
