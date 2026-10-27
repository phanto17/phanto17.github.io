"""Open Graph preview images (1200x630 JPEG) in the Prism style.

usage: python -I tools/make-og.py            (writes public/media/og/*.jpg)

One image for the site and one per project: prism band, film grain, serif title, the project's
hero screenshot on the right. Georgia stands in for Fraunces (not installed locally).
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "media", "og")
W, H = 1200, 630
BG = (26, 23, 19)
STOPS = [(233, 92, 58), (242, 124, 82), (246, 211, 112), (159, 211, 168), (143, 195, 223), (202, 181, 206), (250, 161, 147)]

PROJECTS = [
    ("default", "Tymoteusz Jaskólski", "Junior Gameplay Programmer · Unity / C#", "PORTFOLIO · PHANTO17.GITHUB.IO", None),
    ("push-comes-to-shove", "Push Comes to Shove", "Deterministic grid tactics · playable in the browser", "PROJECT · TACTICS", "push-comes-to-shove/cover.avif"),
    ("horde-hours", "Horde Hours", "3D survivors-like · playable in the browser", "PROJECT · SURVIVORS-LIKE", "horde-hours/cover.avif"),
    ("cinderhold", "Cinderhold", "2D dungeon crawler · playable in the browser", "PROJECT · DUNGEON CRAWLER", "cinderhold/cover.avif"),
    ("eternity-keeper", "Eternity Keeper", "Open-source save editor for Pillars of Eternity", "PROJECT · TOOL", "eternity-keeper/inventory.avif"),
]


def font(names, size):
    for name in names:
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def backdrop():
    img = Image.new("RGB", (W, H), BG)
    band = Image.new("RGB", (W + 400, 200), BG)
    d = ImageDraw.Draw(band)
    for x in range(band.width):
        t = x / (band.width - 1)
        i = min(len(STOPS) - 2, int(t * (len(STOPS) - 1)))
        f = t * (len(STOPS) - 1) - i
        d.line([(x, 0), (x, 200)], fill=tuple(int(STOPS[i][k] * (1 - f) + STOPS[i + 1][k] * f) for k in range(3)))
    band = band.rotate(-7, resample=Image.BICUBIC, expand=True).filter(ImageFilter.GaussianBlur(34))
    layer = Image.new("RGB", (W, H), BG)
    layer.paste(band, (-200, -110))
    mask = Image.new("L", (W, H), 0)
    ImageDraw.Draw(mask).rectangle([0, 0, W, 210], fill=170)
    img = Image.composite(layer, img, mask.filter(ImageFilter.GaussianBlur(80)))
    vig = Image.new("L", (W, H), 0)
    vd = ImageDraw.Draw(vig)
    for r in range(0, 760, 6):
        vd.ellipse([W / 2 - r * 1.5, H / 2 - r, W / 2 + r * 1.5, H / 2 + r], outline=int(255 * (r / 760) ** 2.2))
    img = Image.composite(Image.new("RGB", (W, H), (11, 7, 11)), img, vig.filter(ImageFilter.GaussianBlur(60)))
    grain = Image.effect_noise((W, H), 16).convert("L")
    return Image.blend(img, Image.merge("RGB", (grain, grain, grain)), 0.05)


def render(slug, title, subtitle, kicker, shot):
    img = backdrop()
    if shot:
        pic = Image.open(os.path.join(ROOT, "public", "media", shot)).convert("RGB")
        pw = 560
        ph = int(pic.height * pw / pic.width)
        resample = Image.NEAREST if "cinderhold" in shot else Image.LANCZOS
        pic = pic.resize((pw, ph), resample)
        frame = Image.new("RGB", (pw + 2, ph + 2), (93, 65, 43))
        frame.paste(pic, (1, 1))
        img.paste(frame, (W - pw - 64, H - ph - 72))
    d = ImageDraw.Draw(img)
    serif = font(["georgiab.ttf", "georgia.ttf", "times.ttf"], 62 if shot else 92)
    mono = font(["consola.ttf", "cour.ttf"], 22)
    sans = font(["segoeui.ttf", "arial.ttf"], 27)
    x = 64
    y = 190 if shot else 268
    d.text((x, y - 56), kicker, font=mono, fill=(246, 211, 112))
    # wrap the title to the space left of the screenshot
    max_w = (W - 560 - 64 - 64 - 40) if shot else W - 128
    words, lines, line = title.split(), [], ""
    for w in words:
        trial = (line + " " + w).strip()
        if d.textlength(trial, font=serif) <= max_w or not line:
            line = trial
        else:
            lines.append(line)
            line = w
    lines.append(line)
    for i, ln in enumerate(lines):
        d.text((x + 2, y + i * (serif.size + 6) + 3), ln, font=serif, fill=(11, 7, 11))
        d.text((x, y + i * (serif.size + 6)), ln, font=serif, fill=(243, 230, 211))
    sy = y + len(lines) * (serif.size + 6) + 18
    sub_lines, line = [], ""
    for w in subtitle.split():
        trial = (line + " " + w).strip()
        if d.textlength(trial, font=sans) <= max_w or not line:
            line = trial
        else:
            sub_lines.append(line)
            line = w
    sub_lines.append(line)
    for i, ln in enumerate(sub_lines):
        d.text((x, sy + i * 40), ln, font=sans, fill=(185, 166, 143))
    d.text((x, H - 64), "phanto17.github.io", font=mono, fill=(138, 122, 102))
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, f"{slug}.jpg")
    img.save(path, "JPEG", quality=86, optimize=True, progressive=True)
    print(f"{slug}.jpg", os.path.getsize(path) // 1024, "KB")


if __name__ == "__main__":
    for p in PROJECTS:
        render(*p)
    sys.exit(0)
