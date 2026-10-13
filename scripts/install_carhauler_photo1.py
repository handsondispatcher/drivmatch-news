#!/usr/bin/env python3
"""Install only the exact advertiser-approved Foto 1 artwork into site assets.

No generative transformation, recoloring, resampling, overlays, or retouching.
Three site files are exact pixel crops of the immutable 1774x887 PNG master.
A cryptographic mismatch blocks deployment rather than substituting an image.
"""
from __future__ import annotations

import hashlib
import io
import time
from pathlib import Path
from urllib.request import Request, urlopen

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "site/assets/ads"
MASTER = OUT / "carhauler-photo1-master.png"
SOURCE_URL = (
    "https://cdn.openart.ai/openart-uploads/production/attachment-transfers/"
    "9d0e786f0c9e07c6d708a1759af5b9ea1734fb4a210330efaacc9dc317f2437a.png"
)
APPROVED_SHA256 = "1bb40335eb3f058eaeae14a011e42f51e8c00194822b942e5c5628c19a88622d"
SOURCE_SIZE = (1774, 887)
CROPS = {
    "horizontal": (0, 0, 1774, 394),
    "rectangle": (668, 449, 1677, 810),
    "square": (55, 445, 595, 821),
}


def verified(data: bytes) -> bool:
    return hashlib.sha256(data).hexdigest() == APPROVED_SHA256


def source_bytes() -> bytes:
    if MASTER.exists():
        cached = MASTER.read_bytes()
        if verified(cached):
            print("OFFICIAL PHOTO 1: verified cached master", APPROVED_SHA256)
            return cached
        MASTER.unlink()
    last = None
    for attempt in range(4):
        try:
            request = Request(SOURCE_URL, headers={
                "User-Agent": "DrivMatchNews-ApprovedArtwork/1.0",
                "Accept": "image/png",
            })
            with urlopen(request, timeout=25) as response:
                data = response.read(8_000_001)
            if len(data) > 8_000_000:
                raise ValueError("Unexpectedly large image")
            if not verified(data):
                raise ValueError("SHA-256 mismatch: downloaded art is NOT approved Foto 1")
            return data
        except Exception as exc:
            last = exc
            print(f"OFFICIAL PHOTO 1: source attempt {attempt+1}/4 failed: {exc}")
            if attempt < 3:
                time.sleep(2 * (attempt + 1))
    raise RuntimeError("Approved original unavailable; no unapproved substitute permitted") from last


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    data = source_bytes()
    with Image.open(io.BytesIO(data)) as img:
        img.load()
        if img.size != SOURCE_SIZE or img.format != "PNG":
            raise ValueError(f"Approved original geometry changed: {img.size}, {img.format}")
        # The exact original byte sequence is retained on our own website.
        MASTER.write_bytes(data)
        for fmt, coords in CROPS.items():
            crop = img.crop(coords)
            output = OUT / f"carhauler-photo1-{fmt}.png"
            crop.save(output, format="PNG", optimize=True)
            with Image.open(output) as reread:
                reread.load()
                if reread.size != crop.size or ImageChops.difference(crop, reread).getbbox():
                    raise AssertionError(f"Pixel fidelity check failed for {fmt}")
            print(f"OFFICIAL PHOTO 1 PASS: {fmt} {crop.width}x{crop.height}; pixel-perfect crop")
    print("OFFICIAL PHOTO 1 PASS: exact original SHA-256", APPROVED_SHA256)


if __name__ == "__main__":
    main()
