# Adler Warm

An original typeface drawn for Adler: thick, rounded strokes, tall open lowercase
letters, single-storey **a** and **g**, curled **l** and **t**, and a looped ampersand.
The drawings start in `glyphs.json`; no existing font or letter outlines are used.

The app uses seven upright weights (400, 450, 500, 550, 600, 650, 700). Each weight
is a real outline, with fixed advance widths across weights and tabular numerals
for progress values and dates. The family includes ASCII, Latin-1, common extended
Latin letters, punctuation, currency signs, and the app's text arrows. Other
scripts and emoji use the system fallback. There are no italic drawings.

## Preview and use

Run `npm run dev`, then open `/design/adler-warm/specimen.html` on that server to
see the alphabet, weight comparisons, and text at app sizes. This source specimen
is for local review and is not included in the production app build.

`public/fonts/` contains the WOFF2 files served by the app. `ttf/` contains the
same family as installable desktop fonts for design tools. The app's family is
defined in `src/styles.css` through `--body-font` and `--heading-font`; regular
and medium weights are preloaded in `index.html`.

## Rebuild the fonts

From the repository root, with Python 3.9 or newer:

```sh
python3 -m venv .context/font-venv
.context/font-venv/bin/pip install -r design/adler-warm/requirements.txt
.context/font-venv/bin/python design/adler-warm/build.py
```

Generated fonts are checked in. Python is only needed when editing the typeface;
the app's normal build and runtime have no font tooling dependency.

Each `glyphs.json` entry contains an advance width and an SVG path in font
coordinates: 1,000 units per em, positive Y upward, baseline at zero. The paths
describe original Bézier centerlines. The builder expands them with rounded caps
and joins, removes overlapping contours, converts curves to TrueType outlines,
adds accents and optical kerning pairs, and writes TTF and WOFF2 files.

Weight thicknesses, accent drawings, kerning, and metrics are in `build.py`.
Keep enough room in counters and between adjacent letters when changing the
heavier weights. Check the specimen at 12–16 px as well as headline sizes, then
check the landing page and signed-in views on mobile. The first version is
unhinted; browser rendering has been checked in Chrome on macOS.

The build uses [fontTools](https://github.com/fonttools/fonttools) for font tables
and [skia-pathops](https://github.com/fonttools/skia-pathops) for outline geometry.
These tools process the original drawings; they do not supply the glyph designs.
