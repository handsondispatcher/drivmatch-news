#!/usr/bin/env python3
"""Install exact advertiser-approved Gracie Barra Burlington creatives.
Downloads exact original bytes; SHA-256 mismatches fail the deployment.
"""
import hashlib
import json
import time
import urllib.request
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/"site/assets/ads"
ARTS={
  "en-square": {
    "url": "https://cdn.openart.ai/openart-uploads/production/attachment-transfers/0803b00bffc1e738fce27c62b37923feda1b54a8ca12612e53de415fe4e0c33f.png",
    "sha256": "e10d76a95f7e927c34e5155367fa0316e52ee52dc0eb63069d873d3767ca3107",
    "size": 3052360
  },
  "pt-square": {
    "url": "https://cdn.openart.ai/openart-uploads/production/attachment-transfers/2c9470bbe89e5a64bea08d3c03cfe159ffa734919f450c10ec179422f11b5ecd.png",
    "sha256": "4eaa9a8c1f5efdcf75781513ca86cf9f31e6327030b2f4df9208d2709afceced",
    "size": 3093424
  },
  "es-square": {
    "url": "https://cdn.openart.ai/openart-uploads/production/attachment-transfers/d34e1a10b1d8cd6c3c68346d95ccdd250f9a5bd8395721959e18e92e46c56f0d.png",
    "sha256": "cf3fd055f0aa87454a1cfed6dad164a4d5fbc04142393e929bf74c431af73efe",
    "size": 3086460
  },
  "es-wide": {
    "url": "https://cdn.openart.ai/openart-uploads/production/attachment-transfers/909641ba1058ae2b633b8d81e5d4d4342e5ad760f79497fae02a36128edc3241.png",
    "sha256": "8b0d2e48979c8f13ffa6cbb1e64455a49e4d0ae851ff071ef9ca1233276257e1",
    "size": 1931008
  },
  "pt-wide": {
    "url": "https://cdn.openart.ai/openart-uploads/production/attachment-transfers/6349400c1adeb7b5f13cee365bffbccc5aeab9f645da32c3548eb2fdae2f0b0f.png",
    "sha256": "43f3737ddbc2bbba9741766eacfc354d0e6fe5e789821b3fad91041abd2514a3",
    "size": 1933227
  },
  "en-wide": {
    "url": "https://cdn.openart.ai/openart-uploads/production/attachment-transfers/3671c98b662975c4936116e0c4b730b0ac48afd81487112dc96bff8e55d96b94.png",
    "sha256": "88a5340338f5eec8a2df228f7b6c773c10d752d8b5e4c40600dc000b70180a3f",
    "size": 1894850
  }
}

def main():
    ASSETS.mkdir(parents=True,exist_ok=True)
    for variant,item in ARTS.items():
        dest=ASSETS/("gracie-barra-"+variant+".png")
        existing=dest.read_bytes() if dest.exists() else b""
        if hashlib.sha256(existing).hexdigest()==item["sha256"]:
            print("Verified cached:",dest.name)
            continue
        last=None
        for attempt in range(3):
            try:
                request=urllib.request.Request(item["url"],headers={"User-Agent":"DrivMatchNews/1.0 authorized-publisher"})
                with urllib.request.urlopen(request,timeout=35) as response:
                    raw=response.read(item["size"]+1)
                if len(raw)!=item["size"]:
                    raise RuntimeError("Original file size mismatch: "+variant)
                if hashlib.sha256(raw).hexdigest()!=item["sha256"]:
                    raise RuntimeError("Original image checksum mismatch: "+variant)
                dest.write_bytes(raw)
                print("Installed approved original:",dest.name)
                break
            except Exception as exc:
                last=exc
                if attempt<2:time.sleep(2)
        else: raise RuntimeError("Approved advertiser image unavailable: "+variant) from last
    print("Gracie Barra original assets: PASS (6/6)")

if __name__=="__main__":
    main()
