# App screenshots for the landing page

Sections 01–04 show captures of Adler's real Goals, Calendar, goal workspace, and Insights routes. They share a fictional portfolio, reading, and career workspace. These are screenshots, not interactive embeds or customer results.

Each view has a desktop capture (1000 × 900 CSS pixels) and a mobile capture (390 × 1050), rendered at 2× resolution and saved as WebP. The goals and progress views are scrolled to their relevant records using the app's normal layout. Only the surrounding sidebar, top bar, and mobile navigation are hidden for the captures; the content uses the actual app components and styling. Each view also captures the result of a real click: selecting a week, moving to the next calendar week, or opening an insight source. The landing page animates a cursor between these two real frames, with click positions generated in `src/landing-capture-points.json`. Animation pauses outside the current section, has a pause control, and becomes a still image for reduced motion. Mobile uses its own captures and cursor positions. Any view can be enlarged.

To refresh after app UI changes, start the app locally and run:

```sh
npx tsx scripts/capture-landing.ts
```

`LANDING_CAPTURE_URL` can select a different local preview URL. The capture script fixes the browser clock to October 17, 2026, supplies the example workspace through intercepted API responses, and leaves its event stream idle. It creates no accounts or saved workspace records. Unknown requests or app error messages fail the capture. Raw PNGs are saved in `.context/app-captures/` for inspection.
