# Landing page best practices for Adler (research, 2026-09-01)

Scope: how best-in-class consumer software marketing pages are built and written, and what that means for a single-page static site for Adler, an AI goal coach whose differentiator is "it notices and adapts, like a real coach, in one tap a day". All page structures below were fetched live on 2026-09-01 unless flagged. Calm.com and whoop.com returned 403 to every fetch path (direct, reader proxy); their entries use indexed copy only and are marked as unverified.

## 0. What the pages actually do (fetched)

| Page | H1 (words) | Subhead (words) | Hero | Sections | Proof | FAQ |
|---|---|---|---|---|---|---|
| apple.com/iphone-17-pro | "iPhone 17 Pro" (3) | none; tagline "Innovative design for ultimate performance and battery life" (8) | product shot + film (HLS `.m3u8`, `_startframe`/`_endframe` stills) | 18: Get the highlights → Design → Cameras → Performance → All in the family → iOS 26 → Apple Intelligence → Stay connected → "Worth the upgrade? 100 percent." → Accessories → … → "Questions? Answers." | specs and comparatives ("Up to 8x optical-quality zoom", "Up to 50% faster 6-core CPU") | yes, 11 Q&A |
| apple.com/apple-watch-series-11 | "Apple Watch Series 11" (3) | "The ultimate way to watch your health." (7) | video + product, live finish picker | 11: Get the highlights → Take a closer look → Health → Fitness → Battery → On the go → Safety → Why Apple → Keep exploring → Environment → Values | clinical study, "100,000+ participants", 26 footnotes | no |
| apple.com/airpods-pro | "AirPods Pro 3" (2) | "The world's best in-ear Active Noise Cancellation." (7) + "Up to 2x more than AirPods Pro 2." | video with product | 14: Get the highlights → Take a closer look → Intelligent noise control → Audio performance → Personalized listening → Fitness → Hearing Health → Experience → All-day battery → Why Apple → … | comparatives, FDA authorisation footnote | no |
| apple.com/iphone, /watch (lineup pages) | "iPhone" (1), "Apple Watch" (2) | lease/trade-in or "Explore the lineup." | product shots | 14 / 6 | carrier logos | no |
| linear.app | "The product development system for teams and agents" (9) | "Purpose-built for planning and building products. Designed for the AI era." (12) | product UI | 12: announcement → UI showcase → logos → Intake → Planning → AI → Build/review/ship → Changelog → testimonials → closing CTA | "over 40,000 product teams", OpenAI/Ramp/Opendoor quotes | no |
| arc.net | customer quote as H1: "Arc is the Chrome replacement I've been waiting for." (10) | "Meet Dia…" banner | screenshot | 8 | 4 tweets | footer link only |
| culturedcode.com/things | "Things" (1) | 24-word descriptor | intro video | 6: Simply Powerful → Get Things, Get Done → What People Are Saying → Read All About It → Newsletter | 2 Apple Design Awards, WIRED/Wirecutter/MacStories | no |
| superhuman.com | "Superpowers, everywhere you work" (4) | "Mail, Docs, and AI that works in every app and tab" (11) | abstract illustration | 9 | 6 logos | no |
| raycast.com | "Your shortcut to everything." (4) | 15 words | keyboard graphic | 12, every headline a short declarative ("It's not about saving time.", "Don't repeat yourself.", "Take the short way.") | 24 avatar quotes, "37k members", "99.8% crash-free" | footer link |
| notion.com | "Where teams and agents Think together." (6) | 14 words | layered UI | 6: "AI where your team works." → Capture knowledge → Find answers → Automate busywork → See what Notion can do → "Trusted by teams that ship." | "98% of the Forbes Cloud 100", 15 logos | no |
| cal.com | "The better way to schedule your meetings" (7) | 22 words | text + signup | 9, includes 3-step "Connect your calendar → Set your availability → Choose how to meet" | 6 named testimonials | yes, 3 Qs |
| amie.so | "Run your workday on autopilot with AI agents" (8) | 16 words | screenshot + App Store badge | 13, includes "What you can achieve with Amie in just 7 days" and "How it works" | logos, 3 quotes, X posts | yes, 7 Qs |
| dayoneapp.com | "Your journal for life." (4) | "The #1 journaling app." (4) | screenshot | 9, all full sentences ("Tell your story, words optional.", "You own the data, we keep it safe.") | "Over 150,000 5-star reviews", Editors' Choice, App of the Year, ADA, press | no |
| headspace.com | "Stress less all with Headspace" (5) | "Mental health app with expert-led meditations and tools" (8) | illustration | 8 | "Over 4,000 leading organizations" | yes, 8 Qs (what is it, cost, renew, cancel…) |
| finchcare.com | "Your new self-care best friend." (5) | 16 words | logo + store badges (rest JS-rendered, not captured) | 1 captured | "5.0", "500k+ ratings" | footer link |
| habitkit.app | "Habits you can actually see" (5) | "One tap logs the day. Every day fills a tile. The grid becomes a chain you won't want to break. Private, offline, no account." (26) | 3 fanned iPhone screens | 6: hero → "TRUSTED BY 100,000+" → "AS FEATURED IN" → "Have a look inside" → "People stick with it, and say so" → "Day one starts today" | 4.8★ (8,335) / 4.7★ (11,493), 12 quotes | nav link |
| sunsama.com | "Start Calm. Stay Focused. End Confident." (6) | "Make work-life balance a reality" (5) | screenshot | 16 (long): quotes → logos → "Work is f***ing chaotic" → "turns chaos into clarity" → Start your Day → Work through your day → Make every day count → integrations → comparison → Wirecutter | YC/Eco quotes, 8 logos, NYT Wirecutter | no |
| ouraring.com | "Subtle. Power." (2) | "The world's smallest smart ring is here." (7) | product shot | 12, includes five daily scenarios (Starting day, Taking a walk, Under the weather, Winding down, Hosting a party) | CNBC/Guardian/Esquire/CNET, 3 quotes | no |
| calm.com (unverified, 403) | "Find your calm" / "Calm your mind. Change your life." | "#1 app for sleep, meditation, and relaxation" | full-bleed video (waves/rain), nav stripped, single CTA "Start your free trial" | — | — | — |
| whoop.com (unverified, 403) | indexed title "Unlock Human Performance & Healthspan"; indexed copy "Optimize sleep, strain, and recovery with WHOOP, the most advanced fitness and health wearable." | — | — | — | — | — |

Cross-page observations:

- Headline median is 4–6 words. The mechanism lives in the subhead (7–16 words); HabitKit's 26-word subhead is the outlier and it is the best "grandma" explanation in the set.
- Hero: product-as-hero dominates (Apple, HabitKit, Sunsama, Day One, Linear, Notion, Oura). Abstract art only where the product is invisible (Superhuman, Headspace). Video only when it is the product moving (Apple, Things, Calm).
- Section order convention: hero → (proof strip) → problem/why → core loop → 2–4 feature "one thing" tiles → proof → FAQ (consumer only) → closing CTA. Consumer/health pages (Headspace, Cal.com, Amie, iPhone) carry FAQs; dev/pro tools do not.
- Length: indie/consumer 6–9 sections; Apple product pages 11–18 but each is one idea; Sunsama at 16 reads as bloated.
- Apple motion: autoplaying muted video segments with `_startframe`/`_endframe` poster pairs (play once on enter, hold last frame), horizontal media-card galleries, sticky product viewers. No smooth-scroll hijack anywhere in the set.
- Colour: Apple's system is 13 tokens but any single tile uses two neutrals plus one accent (#0066cc); full-bleed tiles alternate light (#ffffff/#f5f5f7) and dark (#000/#272729) edge-to-edge with zero gap — "the color change itself acts as the section divider"; 80px vertical padding desktop / 48px mobile; exactly one drop-shadow rule, reserved for product imagery. Linear: #08090a bg, #f7f8f8 text, one accent #5e6ad2. Notion: monochrome.
- Typography: Apple statement headlines `.typography-headline-standalone` = SF Pro Display 96px ≥1069px / 80px below, weight 600, letter-spacing -0.015em, line-height 1.04; product-title hero 56px/600/1.07 scaling 56→40→34→28; body SF Pro Text 17px/400/1.47; tagline 21px/600. Linear: Inter Variable (fallback SF Pro Display), display-hero 80px at weight 510 with -0.025em, display 64px, H1 48px, body 15px, OpenType `cv01`,`ss03` on globally; easing `cubic-bezier(0.4,0,0.2,1)`, 120/180/280 ms.
- CTA: one primary label repeated (top nav + hero + close). Apple "Buy" appears 4+ times; HabitKit store badges 3 times; Sunsama "Try for free" with "14-day free trial / No credit card required" under it.

Apple copy rules (HIG Writing + WWDC22 "Writing for interfaces" + marketing analyses): "Be clear: choose words that are easily understood and convey the right thing." "Be concise: if you can use fewer words, do so. When in doubt, read your writing out loud." "Write for everyone: choose simple, plain language… avoiding jargon." Buttons are verbs; "Favorites" not "Your Favorites"; "tap" not "click". PACE (Purpose, Anticipation, Context, Empathy): "think about the most important thing someone needs to know at that moment. That's the purpose of your screen"; "rather than give too many details, aim for simplicity". Marketing copy: one idea per headline; inverted pyramid; one-word sentences ("Wonderfull."), rule of three ("Your photo. Your font. Your widgets. Your iPhone."), specific numbers ("Up to 26 hours video playback"), feature→advantage→benefit ("A bigger sensor and larger aperture let in 49% more light so you can make sensational pics, even in low light."), start sentences with And/But, "Short paragraphs. Short sentences. And simple words."

## 1. The one thing

How top pages compress to one sentence:

1. Name + superlative claim (Apple: "AirPods Pro 3 / The world's best in-ear Active Noise Cancellation."; Day One "Your journal for life. / The #1 journaling app.").
2. Category redefinition with "the": "The product development system for teams and agents"; "The better way to schedule your meetings".
3. Outcome verb, plain words: "Habits you can actually see"; "Stress less".
4. Rhythmic fragments: "Start Calm. Stay Focused. End Confident."; "Subtle. Power."
5. Possessive metaphor: "Your shortcut to everything."; "Your new self-care best friend."
6. Borrowed voice: Arc runs a customer quote as the H1.

Candidate patterns for Adler ("notices and adapts, like a real coach, one tap a day"):

- P1 Category + verb: "The coach that ___." Owns the differentiator in three words.
- P2 Mechanism → promise: "One tap a day. ___." Grandma-simple, leads with effort.
- P3 Enemy contrast: "Trackers count. Adler notices." Names the incumbent (Sunsama/Maxi pattern).
- P4 Triad: "Notice. Adapt. Repeat." Apple rhythm; risks sounding like a feature list.
- P5 Possessive warmth: "Your coach, ___." Consumer-health tone (Finch, Day One).

Eight headlines with critique:

1. "The coach that notices." — 4 words, P1, already in the prototype. Strongest: the noun says category, the verb says difference. Weakness: "notices" is abstract alone; it needs the subhead to say what it notices and what it does about it. Recommended.
2. "One tap a day. A coach that adapts." — 8 words, P2. Effort first (good for the objection "I don't have time"), then the promise. Two ideas in one H1; Apple would split them. Strong alternate.
3. "Trackers count. Adler notices." — 4 words, P3. Sharp, memorable, ad-ready. Assumes the reader knows Adler is a coach; on a cold hero it reads as a slogan, not an explanation.
4. "A real coach notices. So does Adler." — 7 words. The analogy is the pitch, but "real" pre-empts the "it's just AI" objection and thereby raises it. Better as body copy under 1.
5. "Goals that survive week three." — 5 words, outcome + specific number. Uses the churn insight (competitors.md failure mode 1). Insidery; a first-time visitor doesn't yet know week three is the cliff.
6. "Tell it once. It remembers. It adapts." — 7 words, P4. Covers memory and adaptation but "it" is vague and the triad reads like a spec sheet.
7. "Your coach, one tap away." — 5 words, P5. Warm and generic; "one tap away" is telecom cliché and says nothing about noticing.
8. "It notices when you slip. Then it changes the plan." — 11 words. The clearest sentence of the eight and the best grandma explanation, but too long for a 96px H1. Use it as the subhead for 1.

Recommendation: H1 "The coach that notices." Subhead: "It notices when you slip, then changes the plan. One tap a day." (Current prototype subhead is 27 words; cut to ≤16.)

## 2. Grandma-simple explanation

Patterns and where they work:

- Three-step strip (Cal.com "Connect your calendar → Set your availability → Choose how to meet"; HabitKit's subhead is a three-sentence strip). Works because it sets the whole expectation at a glance. Fails past four steps or with any jargon. Use for the daily loop: "Say the goal. Tap once a day. Adler adjusts."
- "A day with X" (Sunsama Start / Work / End; Oura's five scenarios "Starting day, Taking a walk, Under the weather, Winding down, Hosting a party"). Works when value is a rhythm. Anchor on clock times and real sentences; Apple Watch shows the actual notification ("Way to go! That was your fastest 5K ever.") rather than describing it.
- "A week with X" / timeline (Amie "What you can achieve with Amie in just 7 days"; Things "Within the hour, you'll have everything off your mind"). Best fit for Adler because adaptation is only visible across days: Mon set goal → Tue–Sat one tap → Wed miss → Wed evening Adler shrinks the step → Sun five-minute review. Show day-1 vs day-7 screens side by side.
- Screen-by-screen (HabitKit three fanned screens; Apple "Take a closer look"). Works only if the UI is self-explanatory; cap at three ("Three screens. No manual." in the prototype is right).
- Conversational scenario (Superhuman's agent dialogue). Right for AI products; show three short message bubbles, never a paragraph.

Older-reader accessibility (WCAG 2.2, NN/g, W3C WAI "Older Users"):

- Body 18–20px on desktop, never below 16px anywhere (NN/g: "at least 12-point fonts as the default" for senior-targeted sites; usability declines ~0.8%/year from age 25). Set `html { font-size: 112.5% }` and use rem.
- Contrast 4.5:1 body, 3:1 for ≥24px or ≥18.66px bold (SC 1.4.3). The prototype's `--ink-3 #8a8e99` on `#f6f5f2` is ≈3.0:1: legal only for large text; darken it for eyebrows and small captions.
- Line-height ≥1.5, paragraph spacing ≥2×, letter-spacing ≥0.12em when the user overrides (SC 1.4.12); measure 55–70 characters (SC 1.4.8 says ≤80). Text must reflow at 200% zoom (1.4.4).
- Targets ≥24×24 CSS px minimum (SC 2.5.8); aim 48px for buttons. No hover-only reveals.
- Motion: `@media (prefers-reduced-motion: reduce)` disables scroll-driven and autoplay; no parallax under body text; no text over moving or blurred backgrounds (W3C: reduced contrast sensitivity and near-focus).
- Language: no product jargon. "Adler checks in", not "proactive outreach"; "the step gets smaller", not "adaptive scaffolding". Read every sentence aloud (HIG).

## 3. Stack 2026

- Framework: Astro 7.2 (released 2026-08-06). Zero-JS by default, islands opt-in, stable Fonts API (`fontProviders.fontsource()` / `local()` with variable weight ranges, `<Font cssVariable>`), `<Picture formats={['avif','webp']}>` built in. Next.js only if the marketing site shares an app or auth; plain HTML (the current `landing/index.html`) works for one page but loses image pipeline, font subsetting, and components. Astro keeps the plain-HTML feel with those back.
- CSS: Tailwind v4.3 via `@tailwindcss/vite` (the `@astrojs/tailwind` integration is deprecated); single `@import "tailwindcss";`, tokens in `@theme`. Keep glass and keyframes in one hand-written CSS file.
- Scroll storytelling: native CSS scroll-driven animations (`animation-timeline: view()` / `scroll()`, `animation-range`) for reveals and parallax — Chrome 115+, Safari 26 (Sept 2025; threaded in 26.4), Firefox still behind a flag; wrap in `@supports (animation-timeline: scroll())` and `@media not (prefers-reduced-motion)`. GSAP 3.15 (100% free incl. ScrollTrigger, SplitText, ScrollSmoother since 2025-04-29 under Webflow) only for pinned, scrubbed scenes such as the week timeline. Motion (`motion` 2.3 kb animate, 5.1 kb `scroll()` on native ScrollTimeline) is excellent but redundant next to GSAP; pick one — GSAP for pinning depth.
- Lenis 1.3.x: honours `prefers-reduced-motion` by default and syncs with ScrollTrigger, but no page in the studied set hijacks scroll, and older users find altered scroll feel disorienting. Skip it.
- View transitions: cross-document `@view-transition { navigation: auto }` is Chrome 126+/Safari 18.2+, not Firefox; irrelevant for a single page.
- 3D: Spline/Three.js heroes add 500 KB–2 MB and stall mid-range phones. Use pre-rendered AVIF or short H.265/AV1 video plus CSS glass instead.
- Images: AVIF first (Chrome 85+, Firefox 93+, Safari 16+), WebP fallback, via Astro `<Picture>`. Video: `.mp4` (H.265) + `.webm` (AV1), poster AVIF, `preload="none"`, start/end-frame stills the Apple way.
- Type: Inter Variable via Astro Fonts API with `font-feature-settings: "cv01","ss03"` (Linear's SF-like tuning), weights 400/500/600 only, fallback `-apple-system`. SF Pro cannot legally be self-hosted; a system stack gives SF only on Apple devices. Geist is fine but reads "developer tool"; Adler wants warmth.

Recommended stack: Astro 7 + Tailwind v4 + native scroll-driven CSS + GSAP ScrollTrigger (one pinned scene) + Inter Variable (Fontsource) + AVIF/WebP via `<Picture>`; no Lenis, no 3D, no Motion. Deploy static (`astro build` → `dist/`) to Cloudflare Pages or Netlify.

```bash
npm create astro@latest adler-site -- --template minimal --install --git
cd adler-site
npm install tailwindcss @tailwindcss/vite gsap
```

```js
// astro.config.mjs
import { defineConfig, fontProviders } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  vite: { plugins: [tailwindcss()] },
  fonts: [{
    provider: fontProviders.fontsource(),
    name: "Inter", cssVariable: "--font-inter",
    weights: ["400 600"], styles: ["normal"],
  }],
});
```

```css
/* src/styles/global.css */
@import "tailwindcss";
@theme { --font-sans: var(--font-inter), -apple-system, system-ui, sans-serif; }
```

```astro
---
// src/layouts/Base.astro
import { Font } from "astro:assets";
import "../styles/global.css";
---
<head><Font cssVariable="--font-inter" preload /></head>
```

```js
// src/scripts/scenes.js  (only for the pinned week timeline)
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
```

Run `npm run dev`; build `npm run build`.

## 4. Glass aesthetic on the web

Apple's own description (Newsroom, June 2025): Liquid Glass "is translucent and behaves like glass in the real world… reflects and refracts its surroundings, while dynamically transforming to help bring greater focus to content"; it "uses real-time rendering and dynamically reacts to movement with specular highlights"; "its color is informed by surrounding content and intelligently adapts between light and dark environments"; controls "act as a distinct functional layer that sits above apps". The web can fake the first three; the last two need a strong colour field behind the glass and a light/dark pair of tokens.

Recipe that holds up (one glass layer over a colour field, never glass on glass):

```css
.glass {
  position: relative;
  background: rgba(255,255,255,.55);                 /* tint; .78 behind text */
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  backdrop-filter: blur(16px) saturate(160%);
  border: 1px solid rgba(255,255,255,.7);            /* outer edge catches light */
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.85),             /* top specular line */
    inset 0 -1px 0 rgba(0,0,0,.06),                  /* bottom shade */
    0 20px 60px rgba(20,21,26,.06);                  /* lift, one shadow only */
  border-radius: 28px;
}
.glass::before {                                     /* specular sweep */
  content: ""; position: absolute; inset: 0; border-radius: inherit;
  background: linear-gradient(135deg, rgba(255,255,255,.55), transparent 40%);
  pointer-events: none;
}
@supports not (backdrop-filter: blur(1px)) { .glass { background: rgba(255,255,255,.92); } }
@media (prefers-reduced-transparency: reduce) { .glass { background: #fff; backdrop-filter: none; } }
```

- Noise: SVG `feTurbulence` at 0.03–0.05 opacity, `mix-blend-mode: multiply`, on the background field (the prototype already does this). Never on the glass itself.
- Refraction: `feDisplacementMap` from a radial displacement map with `backdrop-filter: url(#glass)` gives real edge bending (kube.io) but only Chromium accepts SVG filters as `backdrop-filter`; Safari/Firefox silently drop it. Use it only as an enhancement on the hero card, never on navigation or anything holding text.
- Sticky nav: extend the backdrop element to 200% height and mask it back so nearby content contributes to the blur (Comeau); add `pointer-events: none` to the extension.
- Avoid: blur >16px (frame drops on mid-range phones; "12px is the sweet spot"), more than 3–4 glass surfaces per viewport, animating the blur radius, body text directly on glass over photography or video (NN/g: "more background blur is better… with intricate backgrounds"; contrast depends on the backdrop, so measure against the worst-case pixel). Put copy on a ≥0.78-opacity tint and keep 4.5:1. Apple ships Reduce Transparency for a reason; honour the media query.

## 5. Generative art assets (Gemini API, Sept 2026)

Models (docs fetched 2026-09-01): `gemini-3.1-flash-lite-image` (Nano Banana 2 Lite, GA 2026-06-30, 1K only, $0.0336/image), `gemini-3.1-flash-image` (Nano Banana 2, GA 2026-05-28; 512px/1K/2K/4K at $0.045/$0.067/$0.101/$0.151), `gemini-3-pro-image` (Nano Banana Pro; 1K/2K at $0.134, 4K at $0.24; best text rendering), `gemini-2.5-flash-image` (legacy, $0.039). Batch tier halves every price. No free tier for image output. The `-preview` IDs were shut down 2026-06-25. Imagen 4 (`imagen-4.0-*-001`) was shut down 2026-08-17 on both the Gemini API and Vertex; `generate_images()` is gone — do not target it. Aspect ratios for all three current models: 1:1, 3:2, 2:3, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9. Every image carries a SynthID watermark. Transparent backgrounds are not supported (RGB output only); workaround is to prompt a flat `#00FF00` chromakey background and key it out in HSV (philschmid), or render on white and black and difference-matte.

Endpoint: `POST https://generativelanguage.googleapis.com/v1beta/interactions` (Interactions API, launched 2025-12-11). Image options go in `response_format` with `type: "image"`, `mime_type`, `aspect_ratio`, `image_size` (uppercase K).

```python
from google import genai
import base64
client = genai.Client()  # GEMINI_API_KEY in env
r = client.interactions.create(
    model="gemini-3.1-flash-image",
    input="PROMPT",
    generation_config={"image_config": {"aspect_ratio": "21:9", "image_size": "2K"}},
)
open("hero.png", "wb").write(base64.b64decode(r.output_image.data))
```

```bash
curl -s -X POST "https://generativelanguage.googleapis.com/v1beta/interactions" \
  -H "x-goog-api-key: $GEMINI_API_KEY" -H "Content-Type: application/json" \
  -d '{"model":"gemini-3.1-flash-image",
       "input":[{"type":"text","text":"PROMPT"}],
       "response_format":{"type":"image","mime_type":"image/png","aspect_ratio":"21:9","image_size":"2K"}}'
```

Prompt patterns for premium, not-AI-looking hero art (Google's own tips: subject, composition, action, location, style, then camera and lighting; the docs' "minimalist & negative space" section):

- Name a physical medium and a photographic process, not "digital art": "studio photograph of a hand-blown frosted glass form", "macro photograph of stacked translucent acrylic sheets", "light through fluted glass, long exposure".
- Direct the camera: "85mm, f/2.8, soft north-window light from the left, shallow depth of field, slight vignette".
- Constrain palette to two named colours plus paper white, "low saturation, muted"; Adler's field is peach `#ffd9c2` / sky `#d8e6ff` / mint `#e8f7e4`.
- Reserve room for copy: "vast empty negative space on the right two-thirds, subject low-left".
- Ban the tells: "no lens flare, no bokeh orbs, no glowing edges, no neon purple-blue, no text, no symmetry, no perfectly smooth gradients".
- Ask for imperfection: "subtle film grain, natural dust on the glass, asymmetric".
- Generate 6–8 at 21:9 2K on `gemini-3.1-flash-image` (~$0.60), pick one, then desaturate 10%, crop, add your own noise, export AVIF. Use `gemini-3-pro-image` only if the image must contain rendered text.

Example: "Editorial studio photograph of a single soft-edged frosted glass pebble resting on warm paper, faint peach and pale sky-blue light passing through it, 85mm f/2.8, soft window light from the left, muted low-saturation palette, subtle film grain, vast empty negative space on the right, no text, no lens flare, no glow, asymmetric composition."

## 6. Recommended outline for Adler (8 sections)

The prototype has 12 sections; merge to eight so each carries one idea.

1. Hero — "The coach that notices." + 16-word mechanism subhead + one CTA ("Join early access") + one Today screen. Purpose: the one thing.
2. Why apps stop working by week three — "Trackers count. Chatbots forget. Stakes apps profit when you slip." Three-up contrast, Adler row last. Purpose: name the enemy.
3. A week with Adler — pinned 7-day timeline with real screen text; Wednesday miss, Wednesday-evening adaptation, Sunday five-minute review. Purpose: the whole loop, start to finish, grandma-simple (absorbs "what notices means" and "how a miss becomes a fix").
4. Three screens. No manual. — Today / Goals / Talk. Purpose: show the app is small.
5. It remembers — record, patterns, playbook; "Tell Adler everything you want. It starts you on one thing." Purpose: adaptation compounds over goals.
6. Built on the literature, not vibes — three cards max. Purpose: credibility while pre-launch proof numbers don't exist.
7. What if I miss a day? — plus "Is it a chatbot?", "Can I cancel?", "Who sees my data?". Purpose: objections (the FAQ pattern consumer-health pages use).
8. Get a coach that notices. — CTA repeated, founding-price anchor, no credit card line. Purpose: close.

## Sources

Product pages (fetched 2026-09-01): https://www.apple.com/iphone-17-pro/ · https://www.apple.com/apple-watch-series-11/ · https://www.apple.com/airpods-pro/ · https://www.apple.com/iphone/ · https://www.apple.com/watch/ · https://linear.app/ · https://arc.net/ · https://culturedcode.com/things/ · https://superhuman.com/ · https://www.raycast.com/ · https://www.notion.com/ · https://cal.com/ · https://amie.so/ · https://dayoneapp.com/ · https://www.headspace.com/ · https://finchcare.com/ · https://habitkit.app/ · https://www.sunsama.com/ · https://ouraring.com/ · calm.com and whoop.com (403; indexed copy via https://unbounce.com/landing-page-examples/best-landing-page-examples/ and https://www.whoop.com/us/en/ search snippet)

Copy and typography: https://developer.apple.com/design/human-interface-guidelines/writing (via reader proxy) · https://developer.apple.com/videos/play/wwdc2022/10037/ · https://www.marketingexamined.com/blog/how-to-write-copy-like-apple · https://www.enchantingmarketing.com/write-like-apple/ · https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/apple/DESIGN.md · https://www.webdesignhot.com/design.md/linear/ · https://medium.com/@iam.hari/how-to-make-typography-effortlessly-right-for-every-screen-size-1a82ece4926d

Accessibility: https://www.w3.org/TR/WCAG21/ · https://www.w3.org/WAI/older-users/ · https://www.nngroup.com/articles/usability-for-senior-citizens/ · https://www.nngroup.com/reports/senior-citizens-on-the-web/ · https://www.nngroup.com/articles/glassmorphism/ · https://axesslab.com/glassmorphism-meets-accessibility-can-frosted-glass-be-inclusive/

Stack: https://astro.build/blog/ (Astro 7.2) · https://docs.astro.build/en/install-and-setup/ · https://docs.astro.build/en/guides/fonts/ · https://tailwindcss.com/docs/installation/framework-guides/astro · https://gsap.com/pricing/ · https://gsap.com/docs/v3/Installation/ · https://webflow.com/updates/gsap-becomes-free · https://motion.dev/docs/quick-start · https://motion.dev/docs/scroll · https://github.com/darkroomengineering/lenis · https://webkit.org/blog/17101/a-guide-to-scroll-driven-animations-with-just-css/ · https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations · https://developer.chrome.com/docs/web-platform/view-transitions/cross-document · https://fontsource.org/fonts/inter/install · https://vercel.com/i/astro-vs-next-js · https://www.hontran.dev/blog/gsap-vs-framer-motion · https://crystallize.com/blog/avif-vs-webp · https://svilenkovic.com/3d/three-js-vs-spline

Glass: https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/ · https://kube.io/blog/liquid-glass-css-svg/ · https://www.joshwcomeau.com/css/backdrop-filter/ · https://blog.logrocket.com/how-create-liquid-glass-effects-css-and-svg/ · https://github.com/w3c/svgwg/issues/1142

Gemini: https://ai.google.dev/gemini-api/docs/image-generation · https://ai.google.dev/gemini-api/docs/pricing · https://ai.google.dev/gemini-api/docs/changelog · https://ai.google.dev/gemini-api/docs/imagen (deprecated) · https://firebase.google.com/docs/ai-logic/imagen-models-migration · https://blog.google/products-and-platforms/products/gemini/prompting-tips-nano-banana-pro/ · https://www.philschmid.de/generate-stickers · https://ruky.me/nano-banana/
