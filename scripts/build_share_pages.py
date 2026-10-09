"""Build one shareable social-preview page per approved DrivMatch News story.

A static page supplies title, summary, and photo to WhatsApp and other link
preview crawlers; a browser redirects readers into our existing article modal.
"""
from __future__ import annotations

from html import escape
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"
BASE_URL = "https://drivmatch.com/news"
SAFE_ID = re.compile(r"^[a-z0-9][a-z0-9-]{0,99}$")


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
        description = str(locale.get("summary", "")).strip()
        if not title or not description:
            continue
        image = str(story.get("image") or "")
        if not image.startswith("https://"):
            image = BASE_URL + "/assets/logo-drivmatch-news.png"
        share_url = BASE_URL + "/share/" + slug + "/"
        article_url = BASE_URL + "/?story=" + slug
        image_alt = str(story.get("image_alt") or title)

        esc = lambda value: escape(value, quote=True)
        title_full = title + " | DrivMatch News"
        page = f"""<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title_full)}</title>
<meta name="description" content="{esc(description)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="DrivMatch News">
<meta property="og:locale" content="pt_BR">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(description)}">
<meta property="og:url" content="{esc(share_url)}">
<meta property="og:image" content="{esc(image)}">
<meta property="og:image:alt" content="{esc(image_alt)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="{esc(article_url)}">
</head>
<body>
<p>Leia esta notícia no <a href="{esc(article_url)}">DrivMatch News</a>.</p>
<script>window.location.replace({json.dumps(article_url)});</script>
</body>
</html>
"""
        target = directory / slug
        target.mkdir(parents=True, exist_ok=True)
        (target / "index.html").write_text(page, encoding="utf-8")
        count += 1
    print(f"SHARE PAGES: {count} approved articles")
    return count


if __name__ == "__main__":
    build()
