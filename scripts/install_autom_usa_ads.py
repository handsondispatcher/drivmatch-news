"""Install EXACT owner-provided AUTO M USA images for GitHub Pages.

Strict checksums and sizes prevent substitution or regeneration.
Images are supplied by the advertiser; no creative transforms are permitted.
"""
import hashlib
import io
import os
from pathlib import Path
import time
import urllib.request
from PIL import Image

BASE=Path(__file__).resolve().parents[1]
ASSETS=BASE/'site/assets/ads'
ASSETS.mkdir(parents=True,exist_ok=True)
ARTS={"en":{"url":"https://cdn.openart.ai/openart-uploads/production/attachment-transfers/d768f613505254571a3491999b0f765b8745218fce79e7bd93ba6e00ad615ed5.png","sha256":"12a5708291c3e5cdd62c32980fac5d24c0dea21a51a434defcbfcf81e5bab417","size":1215824},"es":{"url":"https://cdn.openart.ai/openart-uploads/production/attachment-transfers/37907c30e22cded948606c26b781159e29c738d4861fe7d4b009517b03cae77f.png","sha256":"d0b776a552cca3de9cbd80f2f81b0b7cad95058c9988908331888c0f3d5f0c83","size":1266630},"pt":{"url":"https://cdn.openart.ai/openart-uploads/production/attachment-transfers/f36f5790c3be8b1f982c6e0bb65473c4f1896c2c66fbe572b75b2d0b2c10fb7d.png","sha256":"cef3af63240c505a84f65c190feaabcd0a05553b2afc328c81b718a96e3207ec","size":1654031}}
def main():
    for lang,item in ARTS.items():
        path=ASSETS/f'auto-m-usa-{lang}-original.png'
        data=path.read_bytes() if path.exists() else None
        if data is None or hashlib.sha256(data).hexdigest()!=item['sha256']:
            data=None
            for attempt in range(3):
                try:
                    req=urllib.request.Request(item['url'],headers={'User-Agent':'Mozilla/5.0 DrivMatchNews/1.0'})
                    with urllib.request.urlopen(req,timeout=35) as response:
                        data=response.read(3_000_000)
                    break
                except Exception:
                    if attempt==2:raise
                    time.sleep(2*(attempt+1))
        assert len(data)==item['size'],f"{lang}: image byte length changed"
        assert hashlib.sha256(data).hexdigest()==item['sha256'],f"{lang}: image SHA-256 mismatch"
        im=Image.open(io.BytesIO(data))
        assert im.format=='PNG' and im.size==(1254,1254),f"{lang}: unexpected image dimensions"
        path.write_bytes(data)
        print(f"AUTO M USA ORIGINAL {lang.upper()} VERIFIED: {len(data)} bytes")
if __name__=='__main__':main()
