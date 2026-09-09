# App screenshots for the landing page

The centred landing phone uses concise HTML summaries of the fictional reading workspace in `scripts/landing-workspace.ts`. Opening the phone shows the corresponding actual mobile app capture; learning and progress retain additional reasoning and assumptions views. The summaries are illustrative previews, not a new app workflow or customer result.

The retained assets include desktop captures (1000 × 900 CSS pixels for Goals/Calendar; 840 × 900 for other views), mobile captures (390 × 1050), and closer hero captures (390 × 780), at 2× resolution. The main capture script hides surrounding navigation and renders actual app components. Desktop files and cursor positions remain capture-source assets; the active phone story does not load them or automatically animate screenshots.

To refresh after app UI changes, start the app locally and run:

```sh
npx tsx scripts/capture-landing.ts
```

`LANDING_CAPTURE_URL` can select a different local preview URL. The capture script fixes the browser clock to October 17, 2026, supplies the example workspace through intercepted API responses, and leaves its event stream idle. It creates no accounts or saved workspace records. Unknown requests or app error messages fail the capture. Raw PNGs are saved in `.context/app-captures/` for inspection.
