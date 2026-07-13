#!/usr/bin/env python3
"""Render the Chrome Web Store marquee promo tile (1400x560 PNG).

Used by CWS editors for the Featured collection. Same visual language as
the small 440x280 tile: indigo gradient, magnifier+check glyph, wordmark
on the right. Scaled up so the artwork breathes at large sizes.
"""
from pathlib import Path
import math
from PIL import Image, ImageDraw, ImageFont

INDIGO_TOP = (79, 70, 229)      # #4F46E5
INDIGO_BOT = (55, 48, 163)      # #3730A3
WHITE = (255, 255, 255)
GREEN = (16, 185, 129)          # #10B981
DIMWHITE = (210, 215, 240)

W, H = 1400, 560


def gradient_bg():
    img = Image.new("RGB", (W, H))
    px = img.load()
    for y in range(H):
        t = y / (H - 1)
        r = int(INDIGO_TOP[0] * (1 - t) + INDIGO_BOT[0] * t)
        g = int(INDIGO_TOP[1] * (1 - t) + INDIGO_BOT[1] * t)
        b = int(INDIGO_TOP[2] * (1 - t) + INDIGO_BOT[2] * t)
        for x in range(W):
            px[x, y] = (r, g, b)
    return img


def draw_grid_texture(img):
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    for y in range(0, H, 32):
        for x in range(0, W, 32):
            d.point((x, y), fill=(255, 255, 255, 28))
    return Image.alpha_composite(img.convert("RGBA"), overlay)


def draw_magnifier(draw, cx, cy, scale=1.0):
    radius = int(64 * scale)
    ring_thickness = int(10 * scale)
    bbox_outer = (cx - radius, cy - radius, cx + radius, cy + radius)
    draw.ellipse(bbox_outer, fill=WHITE)
    inner = (
        cx - radius + ring_thickness,
        cy - radius + ring_thickness,
        cx + radius - ring_thickness,
        cy + radius - ring_thickness,
    )
    draw.ellipse(inner, fill=WHITE)

    angle = math.radians(45)
    handle_start = (
        int(cx + math.cos(angle) * (radius - ring_thickness * 0.2)),
        int(cy + math.sin(angle) * (radius - ring_thickness * 0.2)),
    )
    handle_end = (int(cx + radius * 1.4), int(cy + radius * 1.4))
    draw.line([handle_start, handle_end], fill=WHITE, width=int(14 * scale))
    cap_r = int(7 * scale)
    draw.ellipse(
        (handle_end[0] - cap_r, handle_end[1] - cap_r,
         handle_end[0] + cap_r, handle_end[1] + cap_r),
        fill=WHITE,
    )

    stroke = int(8 * scale)
    short_start = (cx - int(22 * scale), cy + int(2 * scale))
    elbow = (cx - int(6 * scale), cy + int(18 * scale))
    long_end = (cx + int(26 * scale), cy - int(18 * scale))
    draw.line([short_start, elbow], fill=GREEN, width=stroke)
    draw.line([elbow, long_end], fill=GREEN, width=stroke)
    for pt in (short_start, elbow, long_end):
        r = stroke // 2
        draw.ellipse((pt[0] - r, pt[1] - r, pt[0] + r, pt[1] + r), fill=GREEN)


def load_font(size, weight="bold"):
    candidates = {
        "bold": [
            "/System/Library/Fonts/SFCompact.ttf",
            "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
            "/System/Library/Fonts/Helvetica.ttc",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        ],
        "regular": [
            "/System/Library/Fonts/SFNS.ttf",
            "/System/Library/Fonts/Supplemental/Arial.ttf",
            "/System/Library/Fonts/Helvetica.ttc",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        ],
    }
    for path in candidates[weight]:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def draw_text_block(draw):
    title_font = load_font(110, "bold")
    tagline_font = load_font(40, "bold")
    body_font = load_font(30, "regular")

    x = 520

    draw.text((x, 130), "QAKit Toolbox", font=title_font, fill=WHITE)
    draw.text(
        (x, 270),
        "13 offline tools for QA & developers",
        font=tagline_font,
        fill=WHITE,
    )

    bullets = [
        "JSON  ·  YAML  ·  JWT  ·  Regex",
        "Passwords  ·  Screenshot  ·  Diff",
        "Zero network  ·  6 languages  ·  Free",
    ]
    for i, line in enumerate(bullets):
        draw.text((x, 355 + i * 50), line, font=body_font, fill=DIMWHITE)


def main():
    bg = gradient_bg()
    bg = draw_grid_texture(bg).convert("RGB")
    draw = ImageDraw.Draw(bg)
    draw_magnifier(draw, cx=260, cy=280, scale=2.6)
    draw_text_block(draw)

    out = Path(__file__).resolve().parent.parent / "docs" / "assets" / "promo-marquee.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    bg.save(out, "PNG", optimize=True)
    print(f"wrote {out} ({bg.size})")


if __name__ == "__main__":
    main()
