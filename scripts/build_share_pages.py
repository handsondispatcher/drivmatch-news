"""Generate branded OG cards and social preview pages for approved DrivMatch stories.

Crawlers see a static HTML page with Open Graph metadata (no JavaScript required).
People are redirected to the original DrivMatch News article modal. The share
host is the deployment we control; the custom /news/share/ proxy is NOT yet
confirmed to exist on drivmatch.com.
"""
from __future__ import annotations
from datetime import datetime, timezone
from html import escape
from io import BytesIO
import json
import re
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"
SHARE_BASE = "https://handsondispatcher.github.io/drivmatch-news"
ARTICLE_BASE = "https://drivmatch.com/news"
SAFE_ID = re.compile(r"^[a-z0-9][a-z0-9-]{0,99}$")
CARD_SIZE = (1200, 630)
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_REGULAR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"


def _font(size: int, bold: bool = False):
    name = FONT_BOLD if bold else FONT_REGULAR
    try:
        return ImageFont.truetype(name, size)
    except OSError:
        return ImageFont.load_default()


def _line_wrap(draw, value, font, width, max_lines=4):
    words = str(value).split()
    lines = []
    for word in words:
        if not lines or draw.textbbox((0, 0), lines[-1] + " " + word, font=font)[2] > width:
            lines.append(word)
        else:
            lines[-1] += " " + word
    if len(lines) > max_lines:
        lines = lines[:max_lines]
        while lines[-1] and draw.textbbox((0, 0), lines[-1] + "…", font=font)[2] > width:
            lines[-1] = lines[-1][:-1]
        lines[-1] += "…"
    return lines


def _image_for_story(story):
    """Only reuse specifically credited Commons images; never scrape publisher art."""
    uri = str(story.get("image") or "")
    if not story.get("image_license") or not story.get("image_credit"):
        return None
    parts = urlsplit(uri)
    if parts.scheme != "https" or parts.hostname != "upload.wikimedia.org":
        return None
    try:
        req = Request(uri, headers={"User-Agent": "DrivMatchNews/1.0 (editorial social card)"})
        with urlopen(req, timeout=8) as resp:
            if not resp.headers.get("Content-Type", "").startswith("image/"):
                return None
            buf = resp.read(3_000_001)
            if len(buf) > 3_000_000:
                return None
        img = Image.open(BytesIO(buf))
        img.load()
        return img.convert("RGB")
    except (OSError, ValueError, TimeoutError):
        return None


def create_card(title: str, category: str, target: Path, story=None):
    """Always produces a 1200x630 JPEG, even when editorial photography is offline."""
    w, h = CARD_SIZE
    image = Image.new("RGB", (w, h), "#07192c")
    px = image.load()
    for y in range(h):
        for x in range(w):
            px[x, y] = (7, 24 + (14*x//w) + (8*y//h), 43 + (25*x//w))
    d = ImageDraw.Draw(image)
    photo = _image_for_story(story or {})
    if photo:
        image.paste(ImageOps.fit(photo, (465, 630), Image.Resampling.LANCZOS), (735, 0))
        d = ImageDraw.Draw(image, "RGBA")
        d.rectangle((688, 0, 810, 630), fill=(7, 24, 43, 155))
        d.rectangle((735, 0, 1200, 630), outline=(255, 255, 255, 18), width=2)
    else:
        d = ImageDraw.Draw(image)
        for i in range(7):
            x = 860 + i*46
            d.line((x, 115, x-120, 510), fill=(15, 68+i*6, 113+i*7), width=16)
        d.ellipse((870, 167, 1200, 497), outline="#1d90f1", width=5)
        d.line((787, 500, 1190, 500), fill="#2b9ee8", width=6)
    d = ImageDraw.Draw(image)
    d.rectangle((0, 0, 16, 630), fill="#148ff0")
    # Use the approved horizontal logo file; do not recreate its symbol or type.
    logo_path = SITE / "assets" / "logo-drivmatch-news.png"
    if logo_path.is_file():
        with Image.open(logo_path) as logo:
            logo = logo.convert("RGBA")
            logo.thumbnail((470, 112), Image.Resampling.LANCZOS)
            image.paste(logo, (55, 40), logo)
    else:
        d.text((61, 65), "DrivMatch News", font=_font(40, True), fill="white")
    d = ImageDraw.Draw(image)
    label = (str(category or "TRANSPORTE").upper())[:36]
    d.rounded_rectangle((62, 176, min(700, 90+len(label)*17), 220), radius=10, fill="#1379bc")
    d.text((78, 188), label, font=_font(19, True), fill="white")
    font = _font(45, True)
    lines = _line_wrap(d, title, font, 620, max_lines=4)
    for n, line in enumerate(lines):
        d.text((60, 248+n*63), line, font=font, fill="#ffffff", stroke_width=0)
    d.line((62, 556, 680, 556), fill="#38aeff", width=4)
    d.text((62, 575), "NOTÍCIAS DE TRANSPORTE E LOGÍSTICA", font=_font(17, True), fill="#c5e4f9")
    target.parent.mkdir(parents=True, exist_ok=True)
    image.save(target, "JPEG", quality=89, optimize=True, progressive=False)


def build() -> int:
    feed = json.loads((SITE / "data" / "content.json").read_text(encoding="utf-8"))
    directory = SITE / "share"
    directory.mkdir(parents=True, exist_ok=True)
    count = 0
    for story in feed.get("articles", []):
        if story.get("status") != "approved" or story.get("demo"):
            continue
        slug = story.get("id", "")
        if not isinstance(slug, str) or not SAFE_ID.fullmatch(slug):
            continue
        locale = story.get("locales", {}).get("pt") or {}
        title = str(locale.get("title", "")).strip()
        description = str(locale.get("summary", "") or locale.get("body", "")).strip()
        if not title or not description:
            continue
        share_url = SHARE_BASE + "/share/" + slug + "/"
        article_url = ARTICLE_BASE + "/?story=" + slug
        target = directory / slug
        create_card(title, str(story.get("category") or "Notícias"), target / "social.jpg", story)
        image_url = share_url + "social.jpg"
        esc = lambda v: escape(str(v), quote=True)
        page = f"""<!doctype html>
<html lang="pt-BR"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)} | DrivMatch News</title>
<meta name="description" content="{esc(description[:230])}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="DrivMatch News">
<meta property="og:locale" content="pt_BR">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(description[:230])}">
<meta property="og:url" content="{esc(share_url)}">
<meta property="og:image" content="{esc(image_url)}">
<meta property="og:image:secure_url" content="{esc(image_url)}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{esc(title)} — DrivMatch News">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{esc(title)}">
<meta name="twitter:description" content="{esc(description[:230])}">
<meta name="twitter:image" content="{esc(image_url)}">
<link rel="canonical" href="{esc(article_url)}">
</head><body>
<p>Leia a notícia <a href="{esc(article_url)}">no DrivMatch News</a>.</p>
<script>window.location.replace({json.dumps(article_url)});</script>
</body></html>
"""
        (target / "index.html").write_text(page, encoding="utf-8")
        count += 1
    print(f"SHARE PAGES WITH BRANDED 1200x630 CARDS: {count} approved articles")
    return count


if __name__ == "__main__":
    build()
