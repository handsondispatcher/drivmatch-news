"""Build reliable first-party photographic thumbnails from licensed Commons archive.

External publishers' OG images are NOT scraped or reproduced. Pictures are illustrative
archive images, credit/link/license metadata is preserved. Failing downloads never
publish a broken image. A unique photo may appear once per issue.
"""
from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path
from urllib.parse import quote, urlsplit
from urllib.request import Request, urlopen
import json
import re
import sys
import hashlib

from PIL import Image, ImageOps, ImageStat, UnidentifiedImageError

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"
LIBRARY = ROOT / "content" / "photo-library.json"
DEST = SITE / "assets" / "news-photos"
MANIFEST = SITE / "data" / "news-images.json"
SAFE_ID = re.compile(r"^[a-z0-9][a-z0-9-]{2,85}$")
USER_AGENT = "DrivMatchNews/1.0 (licensed Wikimedia photography; mail contact on website)"


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def _candidate_urls(photo: dict):
    # Sources must be pre-curated and attributed, never dynamically scraped publishers.
    remote = str(photo.get("download") or "")
    if urlsplit(remote).hostname == "upload.wikimedia.org":
        yield remote
    filename = str(photo["file"]).replace(" ", "_")
    encoded = quote(filename, safe="")
    digest = hashlib.md5(filename.encode("utf-8")).hexdigest()
    base = f"https://upload.wikimedia.org/wikipedia/commons"
    # Wikimedia Commons stores files under the normalized filename's MD5 path.
    # A canonical local JPG thumb is much more reliable than Special:Redirect.
    yield f"{base}/thumb/{digest[0]}/{digest[:2]}/{encoded}/560px-{encoded}"
    yield f"{base}/{digest[0]}/{digest[:2]}/{encoded}"
    yield "https://commons.wikimedia.org/wiki/Special:Redirect/file/" + encoded + "?width=560"


def _download_photo(photo: dict):
    """Download, decode, and store a real local JPEG, or decline this asset."""
    ident = photo["id"]
    if not SAFE_ID.fullmatch(ident) or not photo.get("credit") or not photo.get("license") or not photo.get("source_url"):
        return None
    if not str(photo["source_url"]).startswith("https://commons.wikimedia.org/wiki/File:"):
        return None
    diagnostics=[]
    for url in _candidate_urls(photo):
        try:
            req = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "image/jpeg,image/png,image/webp,image/*;q=0.5"})
            with urlopen(req, timeout=9) as resp:
                if not resp.headers.get("Content-Type", "").lower().startswith("image/"):
                    diagnostics.append("not-image:" + str(resp.headers.get("Content-Type", ""))[:40])
                    continue
                # Reject unexpected file hosts and huge files.
                if urlsplit(resp.geturl()).hostname not in {"upload.wikimedia.org", "commons.wikimedia.org", "thumb.wikimedia.org"}:
                    diagnostics.append("bad-redirect:" + str(urlsplit(resp.geturl()).hostname))
                    continue
                raw = resp.read(3_500_001)
                if len(raw) > 3_500_000:
                    diagnostics.append("oversize")
                    continue
            with Image.open(BytesIO(raw)) as source:
                source.load()
                im = ImageOps.exif_transpose(source).convert("RGB")
                if im.width < 340 or im.height < 180:
                    diagnostics.append("too-small")
                    continue
                if max(ImageStat.Stat(im.resize((32, 24))).stddev) < 7:
                    diagnostics.append("not-photograph")
                    continue
                im.thumbnail((1040, 760), Image.Resampling.LANCZOS)
                DEST.mkdir(parents=True, exist_ok=True)
                destination = DEST / (ident + ".jpg")
                im.save(destination, "JPEG", quality=84, optimize=True)
                # Confirm the public image is a real decodable photographic JPEG.
                with Image.open(destination) as check:
                    check.verify()
                return {"image": "assets/news-photos/" + ident + ".jpg",
                        "image_credit": photo["credit"], "image_license": photo["license"],
                        "image_source_url": photo["source_url"],
                        "image_alt": photo.get("description") or "Fotografia de arquivo ilustrativa",
                        "image_context": "illustrative_archive",
                        "source_library_id": ident}
        except (OSError, TimeoutError, ValueError, UnidentifiedImageError) as exc:
            diagnostics.append(f"{type(exc).__name__}:{getattr(exc,'code','')}")
            continue
    print(f"NEWS PHOTO UNAVAILABLE {ident}: {','.join(diagnostics[:4])}")
    return None


def _headline(story):
    return (" ".join(str(story.get("titles", {}).get(k) or "") for k in ("pt", "en", "es")) + " " +
            str(story.get("title") or "") + " " +
            str(story.get("category") or "")).lower()


def choose_photos(stories: list, available: list):
    """Topical selection, no duplicate photographs in one publication snapshot."""
    used = set()
    assigned = {}
    for story in stories:
        sid = story.get("id")
        if not sid or sid in assigned:
            continue
        headline = _headline(story)
        preferred_url = story.get("image_source_url", "")
        ranked = []
        for item in available:
            meta = item["meta"]
            if meta["source_library_id"] in used:
                continue
            if story.get("kind") == "opportunity" and not story.get("image_source_url"):
                continue
            same_photo = preferred_url and preferred_url == meta["image_source_url"]
            keywords = item.get("keywords") or []
            relevance = sum((12 if " " in kw else 8) for kw in keywords if kw.lower() in headline)
            # Explicit article photography must win; other matches are illustrative.
            ranked.append((1000 if same_photo else relevance, -item["index"], item))
        if not ranked:
            continue
        ranked.sort(key=lambda x: (-x[0], -x[1]))
        chosen = ranked[0][2]["meta"]
        used.add(chosen["source_library_id"])
        assigned[sid] = {k: v for k, v in chosen.items() if k != "source_library_id"}
    return assigned


def build(minimum=0):
    photos = read_json(LIBRARY)["photos"]
    ids = [p.get("id") for p in photos]
    if len(ids) != len(set(ids)) or len(ids) < 8:
        raise ValueError("Photo catalog must contain at least eight distinct licensed photos")
    DEST.mkdir(parents=True, exist_ok=True)
    # A clean gallery means old, unlicensed or no-longer-valid images cannot linger.
    for p in DEST.glob("*.jpg"):
        p.unlink()
    downloaded = {}
    with ThreadPoolExecutor(max_workers=2) as pool:
        pending = {pool.submit(_download_photo, p): p for p in photos}
        for future in as_completed(pending):
            photo = pending[future]
            try:
                result = future.result()
            except Exception as exc:
                print(f"NEWS PHOTO error {photo['id']}: {type(exc).__name__}")
                result = None
            if result:
                downloaded[photo["id"]] = result
    available = [{"index": i, "meta": downloaded[p["id"]],
                  "keywords": p.get("keywords", [])}
                 for i, p in enumerate(photos) if p["id"] in downloaded]
    editorial = read_json(SITE / "data" / "content.json").get("articles", [])
    headlines = read_json(SITE / "data" / "source-headlines.json").get("headlines", [])
    stories = [*editorial, *headlines]
    # News on the first page gets first claim on unique, relevant photographs.
    stories.sort(key=lambda s: str(s.get("published_at") or ""), reverse=True)
    assigned = choose_photos(stories, available)
    manifest = {
        "schema_version": 1, "generated_at": datetime.now(timezone.utc).isoformat(),
        "image_context": "illustrative_archive", "license_policy": "curated_commons",
        "images": assigned
    }
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    with_photo = sum(1 for s in headlines if s.get("id") in assigned)
    print(f"NEWS PHOTO LIBRARY: {len(downloaded)}/{len(photos)} valid local JPEG files; "
          f"assigned {len(assigned)}/{len(stories)} stories; external headlines with photos {with_photo}/{len(headlines)}")
    if len(downloaded) < minimum:
        raise RuntimeError(f"Photo thumbnail gate failed: {len(downloaded)} verified photos; required {minimum}")
    if minimum and len(headlines) >= 12 and with_photo < 12:
        raise RuntimeError(f"Photo coverage gate failed: only {with_photo} external headlines have photo thumbnails")
    return manifest


if __name__ == "__main__":
    build(minimum=16 if "--ci" in sys.argv else 0)
