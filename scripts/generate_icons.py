#!/usr/bin/env python3
"""Render QAKit Toolbox icons at 16/32/48/128 px.

The mark is a rounded-square badge in an indigo gradient with a white
magnifying-glass outline. Inside the lens sits a green check-mark —
visual shorthand for "QA: inspected & passed". Renders at 1024 px and
downsamples with LANCZOS so the small sizes stay crisp.
"""
from pathlib import Path
from PIL import Image, ImageDraw

# Indigo gradient — distinct from the sea of blue/teal dev-tool icons.
INDIGO_TOP = (79, 70, 229, 255)     # #4F46E5
INDIGO_BOT = (55, 48, 163, 255)     # #3730A3
WHITE = (255, 255, 255, 255)
GREEN = (16, 185, 129, 255)         # #10B981 — "pass" semantic
TRANSPARENT = (0, 0, 0, 0)

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


def draw_magnifier(overlay, draw):
    """White magnifying-glass with a filled lens and a diagonal handle."""
    s = CANVAS / 128
    # Lens bounding box (slight upper-left bias so the handle fits)
    left = int(22 * s)
    top = int(18 * s)
    right = int(86 * s)
    bottom = int(82 * s)
    ring_thickness = int(11 * s)

    # White ring: outer disc minus inner disc.
    draw.ellipse((left, top, right, bottom), fill=WHITE)
    inner = (
        left + ring_thickness,
        top + ring_thickness,
        right - ring_thickness,
        bottom - ring_thickness,
    )
    # Inner disc — also white, so the lens has a clean opaque background
    # for the check-mark to sit on.
    draw.ellipse(inner, fill=WHITE)

    # Handle: a thick white bar from the lens edge out to the bottom-right.
    cx, cy = (left + right) // 2, (top + bottom) // 2
    r_outer = (right - left) // 2
    # Start the handle a bit inside the ring so it visually attaches.
    import math
    angle = math.radians(45)
    handle_start = (
        int(cx + math.cos(angle) * (r_outer - ring_thickness * 0.2)),
        int(cy + math.sin(angle) * (r_outer - ring_thickness * 0.2)),
    )
    handle_end = (int(108 * s), int(108 * s))
    draw.line([handle_start, handle_end], fill=WHITE, width=int(16 * s))
    # Rounded cap on the handle tip
    cap_r = int(8 * s)
    draw.ellipse(
        (handle_end[0] - cap_r, handle_end[1] - cap_r,
         handle_end[0] + cap_r, handle_end[1] + cap_r),
        fill=WHITE,
    )


def draw_checkmark(overlay, draw):
    """Green check-mark centred inside the lens."""
    s = CANVAS / 128
    cx, cy = int(54 * s), int(50 * s)
    stroke = int(9 * s)
    # Two segments: short down-stroke then long up-stroke.
    short_start = (cx - int(16 * s), cy + int(2 * s))
    elbow = (cx - int(4 * s), cy + int(14 * s))
    long_end = (cx + int(20 * s), cy - int(14 * s))
    draw.line([short_start, elbow], fill=GREEN, width=stroke)
    draw.line([elbow, long_end], fill=GREEN, width=stroke)
    # Round each end so corners don't look chipped at small sizes.
    cap_r = stroke // 2
    for pt in (short_start, elbow, long_end):
        draw.ellipse(
            (pt[0] - cap_r, pt[1] - cap_r, pt[0] + cap_r, pt[1] + cap_r),
            fill=GREEN,
        )


def render_large():
    bg = gradient_bg(CANVAS, INDIGO_TOP, INDIGO_BOT)
    mask = rounded_mask(CANVAS, int(28 * CANVAS / 128))
    bg.putalpha(mask)
    overlay = Image.new("RGBA", (CANVAS, CANVAS), TRANSPARENT)
    draw = ImageDraw.Draw(overlay)
    draw_magnifier(overlay, draw)
    draw_checkmark(overlay, draw)
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
