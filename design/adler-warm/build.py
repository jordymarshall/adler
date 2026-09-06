"""Build Adler Warm from original, editable Bézier centerlines (no source font)."""

import json
from pathlib import Path
import unicodedata

import pathops
from fontTools.feaLib.builder import addOpenTypeFeaturesFromString
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.svgLib.path import parse_path


SOURCE = Path(__file__).resolve().parent
OUTPUT = SOURCE.parents[1] / "public" / "fonts"
WEIGHTS = {
    400: (80, "Regular"),
    450: (88, "Book"),
    500: (96, "Medium"),
    550: (104, "Text"),
    600: (112, "SemiBold"),
    650: (120, "DemiBold"),
    700: (128, "Bold"),
}
# Marks are drawn around an attachment origin, with a separate baseline anchor.
MARKS = {
    "\u0300": "M-66 82 L40 0",
    "\u0301": "M-40 0 L66 82",
    "\u0302": "M-95 0 L0 80 L95 0",
    "\u0303": "M-110 10 C-50 120 50 -60 110 50",
    "\u0304": "M-100 30 L100 30",
    "\u0306": "M-100 75 C-80 -25 80 -25 100 75",
    "\u0307": "M0 35 L1 35",
    "\u0308": "M-78 35 L-77 35 M78 35 L79 35",
    "\u030a": "M68 50 C68 89 39 118 0 118 C-39 118 -68 89 -68 50 C-68 11 -39 -18 0 -18 C39 -18 68 11 68 50 Z",
    "\u030b": "M-110 0 L-30 90 M40 0 L120 90",
    "\u030c": "M-95 80 L0 0 L95 80",
    "\u0327": "M0 0 L-40 -60 C70 -54 72 -150 -35 -160 Q-70 -163 -95 -149",
    "\u0328": "M30 0 C-80 -75 -50 -160 45 -130",
}


def name(char):
    return f"uni{ord(char):04X}"


def outline(path_data, stroke):
    path = pathops.Path()
    parse_path(path_data, path.getPen())
    path.stroke(stroke, pathops.LineCap.ROUND_CAP, pathops.LineJoin.ROUND_JOIN, 4)
    path.convertConicsToQuads(0.2)
    return pathops.simplify(path, clockwise=True)


def build(weight, stroke, style):
    source = json.loads((SOURCE / "glyphs.json").read_text())
    widths = {char: data[0] for char, data in source.items()}
    paths = {char: outline(data[1], stroke) for char, data in source.items()}

    for char, data in MARKS.items():
        paths[char] = outline(data, stroke * 0.78)
        widths[char] = 0

    for char, base in {"\u00a0": " ", "\u00ad": "-", "＋": "+"}.items():
        paths[char], widths[char] = paths[base], widths[base]
    for char, width in {"\u2002": 500, "\u2003": 1000, "\u2009": 200, "\u202f": 200}.items():
        paths[char], widths[char] = pathops.Path(), width

    for char, base in {"Ø": "O", "ø": "o"}.items():
        slash = "M128 -5 L604 710" if char == "Ø" else "M98 -10 L457 552"
        paths[char] = pathops.op(paths[base], outline(slash, stroke * 0.8), pathops.PathOp.UNION)
        widths[char] = widths[base]
    for char, digit in {"¹": "1", "²": "2", "³": "3", "ª": "a", "º": "o"}.items():
        paths[char] = paths[digit].transform(0.62, 0, 0, 0.62, 0, 300)
        widths[char] = round(widths[digit] * 0.62)
    for char, numerator, denominator in [("¼", "1", "4"), ("½", "1", "2"), ("¾", "3", "4")]:
        path = paths[numerator].transform(0.56, 0, 0, 0.56, 0, 320)
        path.addPath(paths[denominator].transform(0.56, 0, 0, 0.56, 440, 0))
        path.addPath(outline("M220 20 L575 680", stroke * 0.7))
        paths[char], widths[char] = pathops.simplify(path, clockwise=True), 765

    # Compose Latin accents from our own bases and marks; retain combining marks
    # too, so both precomposed and decomposed user input render correctly.
    compositions = []
    for codepoint in range(0xC0, 0x180):
        char = chr(codepoint)
        parts = unicodedata.normalize("NFD", char)
        if char in paths or len(parts) != 2 or parts[0] not in paths or parts[1] not in MARKS:
            continue
        base, mark = parts
        below = mark in "\u0327\u0328"
        anchor = -45 if below else (790 if base.isupper() or base in "bdfhklt" else 625)
        undotted = {"i": "ı", "j": "ȷ"}.get(base, base) if not below else base
        path = pathops.Path(paths[undotted])
        path.addPath(paths[mark].transform(translateX=widths[base] / 2, translateY=anchor))
        paths[char], widths[char] = pathops.simplify(path, clockwise=True), widths[base]
        compositions.append((base, mark, char))

    glyphs, metrics = {}, {}
    notdef = outline("M90 0 L90 700 L510 700 L510 0 Z M90 0 L510 700", stroke)
    named_paths = {".notdef": notdef, **{name(c): p for c, p in paths.items()}}
    for glyph_name, path in named_paths.items():
        pen = TTGlyphPen(None)
        path.draw(Cu2QuPen(pen, max_err=0.6, reverse_direction=False))
        glyph = pen.glyph()
        glyph.recalcBounds(None)
        glyphs[glyph_name] = glyph
        advance = 600 if glyph_name == ".notdef" else widths[chr(int(glyph_name[3:], 16))]
        metrics[glyph_name] = (advance, getattr(glyph, "xMin", 0))

    fb = FontBuilder(1000, isTTF=True)
    fb.setupGlyphOrder(list(glyphs))
    fb.setupCharacterMap({ord(char): name(char) for char in paths})
    fb.setupGlyf(glyphs)
    fb.setupHorizontalMetrics(metrics)
    fb.setupHorizontalHeader(ascent=970, descent=-290, lineGap=0)
    fb.setupNameTable({
        "familyName": "Adler Warm" if weight in (400, 700) else f"Adler Warm {style}",
        "styleName": "Bold" if weight == 700 else "Regular",
        "typographicFamily": "Adler Warm",
        "typographicSubfamily": style,
        "uniqueFontIdentifier": f"AdlerWarm-1.000-{style}",
        "fullName": f"Adler Warm {style}",
        "psName": f"AdlerWarm-{style}",
        "version": "Version 1.000",
        "description": "Original rounded letterforms drawn for Adler. Source: design/adler-warm/glyphs.json.",
    })
    fb.setupOS2(
        version=4,
        sTypoAscender=970, sTypoDescender=-290, sTypoLineGap=0,
        usWinAscent=970, usWinDescent=290, usWeightClass=weight,
        sxHeight=round(520 + stroke / 2), sCapHeight=round(670 + stroke / 2), fsType=0,
        fsSelection=0x80 | (0x20 if weight == 700 else 0x40 if weight == 400 else 0),
    )
    fb.font["head"].macStyle = 1 if weight == 700 else 0
    fb.setupPost(underlinePosition=-145, underlineThickness=55)

    features = ["languagesystem DFLT dflt;", "languagesystem latn dflt;"]
    features.append("feature ccmp {")
    features.extend(f"sub {name(base)} {name(mark)} by {name(char)};" for base, mark, char in compositions)
    features.append("} ccmp;")
    # Optical pairs preserve breathing room while closing obvious diagonal gaps.
    pairs = [
        ("A", "TVWY", -38), ("VWTY", "aegos", -32), ("VWTY", ".,", -50),
        ("F", "aeo.,", -28), ("P", "a.,", -30), ("L", "TVWY", -40),
        ("r", ".,", -24), ("f", "aoi", -10), ("T", "ru", -18),
    ]
    features.append("feature kern {")
    for left, right, adjustment in pairs:
        features.append(f"pos [{' '.join(name(c) for c in left)}] [{' '.join(name(c) for c in right)}] {adjustment};")
    features.append("} kern;")
    addOpenTypeFeaturesFromString(fb.font, "\n".join(features))
    # Fixed timestamps make the checked-in assets reproducible.
    fb.font["head"].created = fb.font["head"].modified = 3871497600
    fb.font.recalcTimestamp = False
    OUTPUT.mkdir(parents=True, exist_ok=True)
    desktop = SOURCE / "ttf"
    desktop.mkdir(exist_ok=True)
    fb.save(desktop / f"AdlerWarm-{style}.ttf")
    fb.font.flavor = "woff2"
    target = OUTPUT / f"adler-warm-{weight}.woff2"
    fb.save(target)
    print(f"{target.relative_to(SOURCE.parents[1])}: {len(paths)} characters, {target.stat().st_size:,} bytes")


if __name__ == "__main__":
    for weight, (stroke, style) in WEIGHTS.items():
        build(weight, stroke, style)
