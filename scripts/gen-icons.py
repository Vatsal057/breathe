"""Regenerate app icon assets for the light Coral & Deep Blue theme.

Ivory background + deep-blue 2-petal bloom mark (from src/components/icons.tsx
PetalMark). Flat, no gradients, no glow. Supersampled for clean edges.
"""
from PIL import Image, ImageDraw

IVORY = (246, 241, 231)
DEEP_BLUE = (27, 58, 107)
WHITE = (255, 255, 255)

# PetalMark paths in a 24x24 viewBox (cubic beziers: P0, P1, P2, P3)
RIGHT_PETAL = [
    ((12, 12), (15, 7.5), (19, 7.5), (22, 12)),
    ((22, 12), (19, 16.5), (15, 16.5), (12, 12)),
]
LEFT_PETAL = [
    ((12, 12), (9, 7.5), (5, 7.5), (2, 12)),
    ((2, 12), (5, 16.5), (9, 16.5), (12, 12)),
]
PETALS = (RIGHT_PETAL, LEFT_PETAL)


def cubic(p0, p1, p2, p3, t):
    u = 1 - t
    x = u**3 * p0[0] + 3 * u**2 * t * p1[0] + 3 * u * t**2 * p2[0] + t**3 * p3[0]
    y = u**3 * p0[1] + 3 * u**2 * t * p1[1] + 3 * u * t**2 * p2[1] + t**3 * p3[1]
    return (x, y)


def petal_outline(scale, n=64):
    """Closed polyline of the 2-petal mark, scaled to `scale` px for 24 units."""
    pts = []
    for petal in PETALS:
        for seg in petal:
            for i in range(n + 1):
                x, y = cubic(*seg, i / n)
                pts.append((x * scale, y * scale))
    return pts


def draw_mark(canvas_size, mark_span, stroke_color, bg=None, supersample=4):
    """Draw the 2-petal mark centered. mark_span = fraction of canvas the mark covers."""
    s = canvas_size * supersample
    img = Image.new("RGBA", (s, s), bg + (255,) if bg else (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    scale = (s * mark_span) / 24.0
    stroke_w = max(1, int(round(1.5 * scale)))
    ox = (s - 24 * scale) / 2
    oy = (s - 24 * scale) / 2
    for petal in PETALS:
        pts = []
        for seg in petal:
            for i in range(65):
                x, y = cubic(*seg, i / 64)
                pts.append((ox + x * scale, oy + y * scale))
        d.line(pts, fill=stroke_color + (255,), width=stroke_w, joint="curve")
    return img.resize((canvas_size, canvas_size), Image.LANCZOS)


def save(path, img):
    img.save(path)
    print("wrote", path, img.size, img.mode)


ASSETS = "assets"

# App icon + splash: ivory background, deep-blue mark
icon = draw_mark(1024, 0.56, DEEP_BLUE, bg=IVORY)
save(f"{ASSETS}/icon.png", icon.convert("RGB"))
save(f"{ASSETS}/splash-icon.png", icon.convert("RGB"))

# Android adaptive foreground: ivory mark on transparent (background is deep blue)
fg = draw_mark(512, 0.52, IVORY, bg=None)
save(f"{ASSETS}/android-icon-foreground.png", fg)

# Android adaptive background: solid deep blue
bg_img = Image.new("RGBA", (512, 512), DEEP_BLUE + (255,))
save(f"{ASSETS}/android-icon-background.png", bg_img)

# Android monochrome: white mark on transparent (alpha mask)
mono = draw_mark(432, 0.52, WHITE, bg=None)
save(f"{ASSETS}/android-icon-monochrome.png", mono)

# Favicon: ivory background, deep-blue mark
fav = draw_mark(48, 0.62, DEEP_BLUE, bg=IVORY, supersample=8)
save(f"{ASSETS}/favicon.png", fav)
