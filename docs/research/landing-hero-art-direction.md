# Landing hero: artwork within the page

Updated 11 September 2026. The user asked for an embedded visual flow, inspired by Apple's creative product pages. The hero now uses transparent artwork, a sweeping ribbon and a shared page background. The approved headline, goal example and app story remain.

## Composition and motion

[Apple's AirPods presentation](https://www.apple.com/airpods-pro/) informed the use of an isolated visual subject, generous surrounding space and a sequence that directs attention to the product. Our application keeps Adler's forest green, lime, ivory, peach and rounded typography.

The large folded form extends beyond the right edge of the viewport. As the visitor scrolls, it opens, turns, becomes smaller and settles at the center just above the app. Two generated pictures supply the folded and open shapes; position, rotation and scale advance in twelve held poses. The ribbon fades into the same background used by the next section, and artwork may cross the section boundary without a rectangular cutoff.

The composition uses normal page scrolling and adds no extra section or sticky scroll distance. Reversing scroll rewinds the poses; stopping holds them. Reduced motion retains the first pose. Artwork is decorative, has no pointer interactions, and cannot capture clicks or keyboard focus. All pictures must load and decode before the sequence advances, preventing an empty picture during a swap.

## Saved assets

Generated and edited with the built-in `image_gen` tool. Browser canvas exports only resize and encode the generated PNGs as WebP, preserving their alpha; they do not redraw or remove image content. Final files have transparent outer pixels and substantial transparent area, not a painted checkerboard.

| Pose | 1200px | 640px |
| --- | --- | --- |
| Folded | [adler-form-v2-01-1200.webp](../../public/media/hero/adler-form-v2-01-1200.webp) · 80,468 bytes | [adler-form-v2-01-640.webp](../../public/media/hero/adler-form-v2-01-640.webp) · 34,276 bytes |
| Open | [adler-form-v2-02-1200.webp](../../public/media/hero/adler-form-v2-02-1200.webp) · 109,380 bytes | [adler-form-v2-02-640.webp](../../public/media/hero/adler-form-v2-02-640.webp) · 43,894 bytes |

Responsive sources total about 190 KB for both larger pictures or 78 KB for both smaller pictures. Intrinsic dimensions reserve the artwork's proportions. The page-native SVG ribbon is a separate decorative layer.

The superseded framed JPEG assets were removed from the deployed files. Their source artwork and original prompts remain in [the previous revision](https://github.com/jordymarshall/adler/blob/e002d89/docs/research/landing-hero-art-direction.md). Original generated PNGs remain in the image tool's output directory.

## Exact final prompt set

### Open form: edit of the original campaign image

Use case: background-extraction / stylized-concept. Edit the supplied Adler artwork into an isolated transparent web-compositing asset. Keep the distinctive folded six-lobed flower in chartreuse/lime, soft ivory rims and deep forest-green folded interiors, fine tactile print grain and airbrushed sculptural depth. This is the SAME visual identity. Remove the entire surrounding poster background, all fan bands, arcs and the peach orb. Show just ONE complete six-lobed abstract folded flower, compact and slightly tilted, entirely inside the canvas with 10 percent transparent padding. Keep the ivory edges subtle so lime remains dominant. Organic paper/ribbon folds with lovely dimensionality, no photorealism. Output a genuinely transparent alpha background, with transparent holes if any, not a white background or a baked checkerboard. No frame, panel, container, border, ground plane, cast shadow, text, logo, numbers, people, metallic or glass surfaces. Intended as a large free-floating graphic directly on the page.

### Folded form: edit of the transparent open form

Edit this isolated Adler six-lobed sculptural flower into an earlier tightly folded stop-motion pose. Preserve the exact lime/ivory/forest-green palette, soft fine print texture, lighting, single-object composition and genuinely transparent alpha background. Bring all six lobes inward into a compact folded rosette, a little more irregular and tilted 15 degrees counterclockwise, with thicker ribbon curls. Keep the whole object centered and inside the canvas with 10 percent transparent margin; no cropped petals. Remove all stray pixels, white fringes and debris outside the silhouette; edges should be clean antialiased against transparency. No background, square, poster, cast shadow, border, text, logo, people, extra objects, chrome or glass. This is the first animation pose of the same recognizable object, not a different design.

## Verification and boundaries

Browser coverage checks real alpha, a full-width borderless composition, all twelve poses forward and backward, the centered handoff above the app, idle behavior and live changes to reduced-motion preference. The existing 19-state app demonstration, its accessible disclosure and short-screen layouts remain covered.

This revision changes presentation only. The phone-distraction example, personal evidence, research claims, conditional projection, trial history and coaching behavior remain as documented in [landing assets](../landing-assets.md).
