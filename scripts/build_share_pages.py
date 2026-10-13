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
from functools import lru_cache
import json
import re
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"
SHARE_BASE = "https://handsondispatcher.github.io/drivmatch-news"
SHARE_PREVIEW_VERSION = "og-photo-top-no-cta-20261013-r4"
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
    """First choose the verified local archive photo; never scrape publisher art."""
    local_uri = str(story.get("image") or "")
    if re.fullmatch(r"assets/news-photos/[a-z0-9-]+[.]jpg", local_uri) and story.get("image_license") and story.get("image_credit"):
        local_path = SITE / local_uri
        try:
            with Image.open(local_path) as local:
                local.load()
                return local.convert("RGB")
        except (OSError, ValueError):
            pass
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


@lru_cache(maxsize=8)
def _illustrative_photo(category):
    """Unsplash-licensed illustrative photography, not a photo of the reported event."""
    photos={"Clima":"photo-1534274988757-a28bf1a57c17",
            "Fretes":"photo-1494412519320-aa613dfb7738"}
    code=photos.get(category,"photo-1601584115197-04ecc0da31d7")
    uri="https://images.unsplash.com/"+code+"?auto=format&fit=crop&w=900&q=80"
    try:
        req=Request(uri,headers={"User-Agent":"DrivMatchNews/1.0 (illustrative social image)"})
        with urlopen(req,timeout=7) as response:
            if not response.headers.get("Content-Type","").startswith("image/"):return None
            raw=response.read(2_500_001)
        if len(raw)>2_500_000:return None
        with Image.open(BytesIO(raw)) as photo:return photo.convert("RGB")
    except (OSError,ValueError,TimeoutError):
        return None


def create_card(title: str, category: str, target: Path, story=None):
    """1200x630 social preview: news photo on top, bold headline below.

    Reuse only licensed, attributed, first-party archive photographs. When no
    appropriate licensed news illustration exists, fall back to an explicitly
    illustrative photo or the branded abstract graphic, not scraped publisher art.
    """
    w,h=CARD_SIZE
    image=Image.new("RGB",(w,h),"#07192c")
    draw=ImageDraw.Draw(image)
    photo=_image_for_story(story or {}) or _illustrative_photo(category)
    if photo:
        image.paste(ImageOps.fit(photo,(w,325),Image.Resampling.LANCZOS,
                                centering=(0.5,0.55)),(0,0))
    else:
        for y in range(325):
            draw.line((0,y,w,y),fill=(7,32+y//12,54+y//12))
        for i in range(7):
            draw.line((140+i*180,62,20+i*180,320),fill="#176da2",width=13)
    draw=ImageDraw.Draw(image,"RGBA")
    draw.rectangle((0,0,w,88),fill=(0,16,32,190))
    draw.rounded_rectangle((39,224,300,277),radius=8,fill=(6,109,185,245))
    draw.text((57,238),str(category or "TRANSPORTE").upper()[:22],
              font=_font(20,True),fill="white")
    draw.rounded_rectangle((840,269,1165,307),radius=6,fill=(0,17,34,200))
    draw.text((854,279),"FOTO ILUSTRATIVA • ARQUIVO",
              font=_font(16,True),fill="white")
    draw.rectangle((0,325,w,h),fill=(6,26,49,255))
    # Preserve the official logo asset.
    logo_path=SITE/"assets"/"logo-drivmatch-news.png"
    if logo_path.is_file():
        with Image.open(logo_path) as logo_img:
            logo=logo_img.convert("RGBA")
            logo.thumbnail((325,57),Image.Resampling.LANCZOS)
            image.paste(logo,(48,335),logo)
    else:
        draw.text((48,341),"DrivMatch News",font=_font(25,True),fill="#65c0ff")
    # Scale long syndicated headlines to fit a legible news card.
    title=str(title).strip()
    for size in (40,38,36,34,32,30,28):
        font=_font(size,True)
        lines=_line_wrap(draw,title,font,1095,max_lines=4)
        if len(lines)*(size+8)<=181 and (len(lines)<4 or size<=32):
            break
    lines=_line_wrap(draw,title,font,1095,max_lines=4)
    for n,line in enumerate(lines):
        draw.text((48,387+n*(size+8)),line,font=font,fill="white")
    draw.text((50,577),"NOTÍCIAS DE TRANSPORTE E LOGÍSTICA",
              font=_font(15,True),fill="#d3e4f4")
    target.parent.mkdir(parents=True,exist_ok=True)
    image.save(target,"JPEG",quality=89,optimize=True,progressive=False)


def _write_page(directory, story, slug, title, description, locale="pt-BR"):
    if not SAFE_ID.fullmatch(slug):return False
    share_root=SHARE_BASE+"/share/"+slug+"/"
    share_url=share_root+"?v="+SHARE_PREVIEW_VERSION
    article_url=ARTICLE_BASE+"/?story="+slug
    target=directory/slug
    target.mkdir(parents=True,exist_ok=True)
    create_card(title,str(story.get("category") or "Transporte"),target/"social.jpg",story)
    image_url=share_root+"social.jpg?v="+SHARE_PREVIEW_VERSION
    esc=lambda v:escape(str(v),quote=True)
    og_locale={"pt-BR":"pt_BR","en-US":"en_US","es-419":"es_MX"}.get(locale,"pt_BR")
    page=f"""<!doctype html>
<html lang="{esc(locale)}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)} | DrivMatch News</title>
<meta name="description" content="{esc(description[:230])}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="DrivMatch News">
<meta property="og:locale" content="{og_locale}">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(description[:230])}">
<meta property="og:url" content="{esc(share_url)}">
<meta property="og:image" content="{esc(image_url)}">
<meta property="og:image:secure_url" content="{esc(image_url)}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Imagem editorial ilustrativa: {esc(title)} — DrivMatch News">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{esc(title)}">
<meta name="twitter:description" content="{esc(description[:230])}">
<meta name="twitter:image" content="{esc(image_url)}">
<link rel="canonical" href="{esc(share_url)}">
<meta name="robots" content="index,follow,max-image-preview:large">
</head><body>
<p>Leia a notícia <a href="{esc(article_url)}">no DrivMatch News</a>.</p>
<script>window.location.replace({json.dumps(article_url)});</script>
</body></html>
"""
    (target/"index.html").write_text(page,encoding="utf-8")
    return True


def build() -> int:
    feed=json.loads((SITE/"data"/"content.json").read_text(encoding="utf-8"))
    directory=SITE/"share"
    directory.mkdir(parents=True,exist_ok=True)
    count=0
    created_ids=set()
    gallery_path = SITE / "data" / "news-images.json"
    images = json.loads(gallery_path.read_text(encoding="utf-8")).get("images", {}) if gallery_path.is_file() else {}
    for story in feed.get("articles",[]):
        if story.get("demo"):continue
        slug=story.get("id","")
        if not isinstance(slug,str) or not SAFE_ID.fullmatch(slug):continue
        own=story.get("status")=="approved"
        external=(story.get("kind")=="external_link" and story.get("status")=="external_source"
                  and story.get("origin_type")!="aggregator-discovery")
        if not own and not external:continue
        if external:
            original=str(story.get("source_url") or "")
            parts=urlsplit(original)
            if (parts.scheme!="https" or not parts.hostname or
                parts.hostname in {"news.google.com","www.google.com"}):continue
        locale=story.get("locales",{}).get("pt") or {}
        title=str(locale.get("title","")).strip()
        if not title:continue
        description=(str(locale.get("summary","") or locale.get("body","")).strip() if own else
          str(story.get("source") or "veículo de origem")+" · DrivMatch News")
        combined={**story, **images.get(slug,{})}
        if _write_page(directory,combined,slug,title,description):
            count+=1
            created_ids.add(slug)
    monitor=SITE/"data"/"source-headlines.json"
    if monitor.is_file():
        rows=json.loads(monitor.read_text(encoding="utf-8")).get("headlines",[])
        for story in rows:
            if story.get("geo_scope_verified") is not True:continue
            url=str(story.get("source_url") or "")
            if not url.startswith("https://") or "news.google.com" in url:continue
            slug=story.get("id") or ""
            if not isinstance(slug,str) or not SAFE_ID.fullmatch(slug) or slug in created_ids:continue
            translations=story.get("titles") or {}
            title=str(translations.get("pt") or story.get("title") or "").strip()
            if not title:continue
            locale="pt-BR" if translations.get("pt") else "en-US"
            publisher=str(story.get("source") or "veículo de origem")
            description=publisher+" · DrivMatch News"
            combined={**story, **images.get(slug,{})}
            if _write_page(directory,combined,slug,title,description,locale):
                count+=1
                created_ids.add(slug)
    print(f"SHARE PAGES WITH BRANDED 1200x630 CARDS: {count} articles and external headlines")
    return count


if __name__=="__main__":
    build()
