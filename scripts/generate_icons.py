#!/usr/bin/env python3
"""Render DevKit Toolbox icons at 16/32/48/128 px.

Renders at 1024 px and downsamples with LANCZOS so the small sizes stay crisp.
Source design lives in public/icons/source.svg — keep this script in sync.
"""
from pathlib import Path
from PIL import Image, ImageDraw

BLUE_TOP = (59, 130, 246, 255)      # #3B82F6
BLUE_BOT = (29, 78, 216, 255)       # #1D4ED8
WHITE = (255, 255, 255, 255)
YELLOW = (251, 191, 36, 255)
DARK = (29, 78, 216, 255)

CANVAS = 1024


def gradient_bg(size, top, bottom):
    img = Image.new("RGBA", (size, size))
    px = img.load()
    for y in range(size):
        t = y / (size - 1)
        r = int(top[0] * (1 - t) + bottom[0] * t)
        g = int(top[1] * (1 - t) + bottom[1] * t)
        b = int(top[2] * (1 - t) + bottom[2] * t)
        for x in range(size):
            px[x, y] = (r, g, b, 255)
    return img


def rounded_mask(size, radius):
    mask = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=255)
    return mask


def draw_d(canvas, draw):
    # "D" glyph centred-ish: x in [28..106]px @128 → [224..848] @1024
    s = CANVAS / 128
    left = int(38 * s)
    top = int(28 * s)
    right = int(106 * s)
    bottom = int(100 * s)
    thickness = int(16 * s)

    # Outer D: vertical stroke + right semicircle
    # Use a path traced via polygon arcs approximation — easier: draw filled outer,
    # then cut inner.
    draw.pieslice(
        (right - (bottom - top), top, right, bottom),
        start=-90, end=90, fill=WHITE,
    )
    draw.rectangle((left, top, right - (bottom - top) // 2, bottom), fill=WHITE)

    # Inner hole
    in_left = left + thickness
    in_top = top + thickness
    in_right = right - thickness
    in_bottom = bottom - thickness
    draw.pieslice(
        (in_right - (in_bottom - in_top), in_top, in_right, in_bottom),
        start=-90, end=90, fill=(0, 0, 0, 0),
    )
    draw.rectangle(
        (in_left, in_top, in_right - (in_bottom - in_top) // 2, in_bottom),
        fill=(0, 0, 0, 0),
    )


def draw_accent(canvas, draw):
    s = CANVAS / 128
    cx, cy, r = int(100 * s), int(100 * s), int(14 * s)
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=YELLOW)
    # Tiny notch suggesting a wrench head
    nw, nh = int(7 * s), int(4 * s)
    draw.rectangle((cx - nw, cy - nh, cx + nw, cy + nh), fill=DARK)


def render_large():
    bg = gradient_bg(CANVAS, BLUE_TOP, BLUE_BOT)
    mask = rounded_mask(CANVAS, int(28 * CANVAS / 128))
    bg.putalpha(mask)
    # Now draw on a transparent overlay and composite, so we can cut holes.
    overlay = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    draw_d(overlay, draw)
    draw_accent(overlay, draw)
    return Image.alpha_composite(bg, overlay)


def main():
    out_dir = Path(__file__).resolve().parent.parent / "public" / "icons"
    out_dir.mkdir(parents=True, exist_ok=True)
    large = render_large()
    for size in (16, 32, 48, 128):
        img = large.resize((size, size), Image.LANCZOS)
        img.save(out_dir / f"icon-{size}.png", optimize=True)
        print(f"wrote {out_dir / f'icon-{size}.png'} ({img.size})")


if __name__ == "__main__":
    main()
