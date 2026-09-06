# Landing page assets

The background video is generated footage, not a recording of Adler users. Generated September 6, 2026 using the Gemini API, `veo-3.1-fast-generate-preview`, two 6-second, 720p, 16:9 clips. The clips are joined with a 1-second dissolve, muted, desaturated slightly, and encoded as H.264 for the browser. No API keys or provider URLs are sent to the browser.

- Video: `public/media/personal-goals.mp4` (11 seconds; audio removed).
- Poster: `public/media/personal-goals-poster.jpg`.
- REST reference: https://ai.google.dev/gemini-api/docs/veo
- Playback pauses when the tab is hidden. Reduced-motion and data-saving preferences start on the poster without loading the video. A visible playback control is provided.

## Generation prompts

### Running

Quiet cinematic editorial B-roll for a thoughtful personal goal coaching website. Wide 16:9 shot of an ordinary adult recreational runner in a muted sage green T-shirt jogging at an easy pace along a leafy park path in soft early morning light. Natural realistic motion, camera gently follows from the side and slightly behind, comfortable noncompetitive effort, trees and warm cream sunlight out of focus. One continuous shot, subtle 35mm film texture, muted greens and warm neutrals, understated and human. No text, no graphics, no brand logos, no transitions, no fast camera movements. Background ambient park sounds only, no music, no speech.

### Studying

Quiet cinematic editorial B-roll for a thoughtful personal goal coaching website. Wide 16:9 close side view of an adult studying at a warm wooden desk beside a sunlit window. One hand steadily writes a few notes in a real open paper notebook, an open book and a ceramic cup nearby. Natural anatomically accurate hand motion. Soft shallow focus and slow gentle camera slide, sunlight shifts subtly across paper, peaceful everyday effort. Muted sage greens, warm cream and soft brown palette, subtle 35mm film texture. One continuous shot. No readable words, no text overlays, no graphics, no logos, no fast camera movement. Ambient room sound only, no music or speech.

## Brand artwork

- ChatGPT, Claude, Gemini: `@lobehub/icons-static-svg` via https://cdn.jsdelivr.net/npm/@lobehub/icons-static-svg@latest/icons/ (openai.svg, claude-color.svg, gemini-color.svg).
- Monochrome service marks: Simple Icons via https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/.
- Apple Health, Messages, Calendar, Reminders: Apple App Store artwork from the public iTunes lookup API, app IDs 1242545199, 1146560473, 1108185179, 1108187841 respectively.
- Google Calendar: https://www.gstatic.com/calendar/images/dynamiclogo_2020q4/calendar_31_2x.png.
- Microsoft Outlook: Apple App Store artwork, app ID 951937596.
- Oura: the ouraring.com favicon retrieved via Google’s favicon cache.

The integrations catalog distinguishes planned connections from existing setup paths. It does not show any account as connected without an actual connection. AI model API support is distinct from planned ChatGPT, Claude, and Gemini chat-app connections.

The phone example is rendered in HTML/CSS so its message, delivery format, and corresponding app check-in can change together. iMessage and SMS are visual examples, not messages sent by the landing page.
