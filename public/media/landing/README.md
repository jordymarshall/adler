# Landing story artwork

Created 9 September 2026 with the built-in `image_gen` tool, without an API key. The tool does not expose its model identifier, so GPT Image 2.5 could not be verified.

Assets:
- [wrapped-bloom.webp](wrapped-bloom.webp): the lime opening chapter.
- [learning-rhythm.webp](learning-rhythm.webp): the peach approach chapter.

Both are original decorative graphics at 1254 × 1254, encoded as WebP for the page. They follow the user's Spotify Wrapped-style direction and Adler's Today palette. They carry no personal data, results, or scientific claims. Real app captures, the existing goal journey, shared-coach explanations, and uncertainty disclosures remain separate from this artwork; see [product principles](../../../docs/product-principles.md) and [the landing journey](../../../docs/landing-journey-implementation.md).

## wrapped-bloom.webp

Generation prompt:

```text
Use case: ads-marketing.
Asset type: a custom flat graphic poster tile for Adler's landing-page hero.
Primary request: the bold, energetic visual language of a Spotify Wrapped-style story, translated into Adler's lime and forest-green palette. Create one original abstract graphic, without text or branding. This is graphic design, not a photograph or a physical object.
Composition: square 1:1, edge-to-edge electric pale lime background #ddf578. One oversized, dramatically off-centre eight-lobed rounded flower/burst fills most of the composition and is slightly cropped by the right and bottom edges. Make it an expressive optical flower using 5 or 6 nested wavy contour bands that alternate deep forest green #203e32 and lime #ddf578, with a solid forest centre. Give the contour bands an asymmetric rhythmic swirl. A few small solid cream #f8f8ef circles and a single dark green four-point sparkle balance the upper-left negative space. Confident, simple, very graphic; one dominant form, not a collage of unrelated shapes.
Art direction: contemporary music campaign, oversized shapes, high contrast, playful optical motion, precise crisp hard edges and solid colour fields. Bold enough to read at thumbnail size. Flat 2D, SVG-like finish rendered as a high-resolution bitmap. The image should feel like a full-bleed celebratory visual chapter.
Palette: only electric pale lime #ddf578, deep forest green #203e32, warm off-white #f8f8ef.
Avoid: any text, numbers, words, logo, Spotify logo, brand marks, UI, people, physical flowers, photography, paper fibres, grain, texture, 3D, shadows, gradients, realism, notebooks, objects, borders, or watermarks.
```

Cleanup prompts, applied in order:

```text
Edit this original abstract Adler poster asset with one precise cleanup. Keep the composition, dimensions, flower silhouette, wavy bands, sparkle, circles, cropping, and all colours unchanged. The central forest-green flower currently has faint partially transparent blotches that become visible on a lime webpage. Fill the entire central flower interior with a clean, uniform, fully opaque deep forest green #203e32, with no patches, blur, holes or gradients. Preserve transparency outside the artwork, preserve the crisp outer contours and all other shapes. This is a flat 2D graphic, no new objects, text, texture or shadows.

Precise background replacement on this original graphic. Replace EVERY grey checkerboard area with one completely flat, uniform, solid lime colour #ddf578. There must be NO checkerboard left anywhere. Deliver a fully OPAQUE image: alpha 255 everywhere, no transparency. Preserve the existing flower, wavy forest-green and lime bands, green sparkle, ivory circles, exact composition and dimensions. The central flower must remain solid forest green. No extra shapes, blur, text, textures, shadows, gradients, or new objects. The final image is a clean flat graphic on a single lime colour field, edge to edge.
```

## learning-rhythm.webp

Generation prompt:

```text
Use case: ads-marketing.
Asset type: a custom flat graphic artwork for the learning/approach chapter of Adler's landing page.
Primary request: an original energetic abstract poster tile with the visual confidence of a Spotify Wrapped-style story. Bold, expressive, graphic and completely flat. No type or brand logos.
Composition: square 1:1 full bleed. Warm pale peach background #f0dfd0. Three wide, smooth forest-green #203e32 paths rise from the lower left, bend through a striking oversized loop in the centre-right, and fan toward the top right. Inside each wide green path are thin lime #ddf578 stripes, creating a rhythmic optical ribbon effect. A large flat lime disc sits behind the loop in the upper right; a small off-white #f8f8ef four-point star sits in the lower-right negative space. Forms deliberately crop into the left and top edges. Keep one coherent bold composition with generous negative space, not many scattered objects. Avoid a literal chart or a diagram.
Art direction: contemporary music-campaign graphic design, rhythmic looping shapes, flat solid fields of colour, clean hard edges, playful but highly composed. Reads immediately at thumbnail size. High-resolution bitmap with an SVG-like finish.
Palette: ONLY pale peach #f0dfd0, deep forest #203e32, electric pale lime #ddf578, warm off-white #f8f8ef.
Avoid: text, numbers, letters, logos, Spotify marks, arrows, axes, UI, people, objects, notebooks, plants, photographs, 3D, shadows, lighting effects, grain, paper texture, gradients, borders or watermarks. No physical ribbons: these are pure flat graphic shapes.
```
