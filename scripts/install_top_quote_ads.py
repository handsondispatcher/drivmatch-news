"""Install 9 original square advertising images: 3 per language.
Source content must match SHA-256 and 1254x1254; never redraw or resize.
"""
import json,hashlib,time,urllib.request,io
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT/'content/top-quote-ad-models.json'
def main():
    item=json.loads(MANIFEST.read_text(encoding='utf-8'))
    for lang,entries in item['models'].items():
        for idx,entry in enumerate(entries,1):
            out=ROOT/'site'/entry['file']
            out.parent.mkdir(parents=True,exist_ok=True)
            data=out.read_bytes() if out.exists() else None
            if data is None or hashlib.sha256(data).hexdigest()!=entry['sha256']:
                data=None
                for attempt in range(3):
                    try:
                        req=urllib.request.Request(entry['url'],headers={'User-Agent':'Mozilla/5.0 DrivMatchNews'})
                        with urllib.request.urlopen(req,timeout=40) as res:data=res.read(3000000)
                        break
                    except Exception:
                        if attempt==2:raise
                        time.sleep(2*(attempt+1))
            assert len(data)==entry['size'],f"{lang}-{idx} byte count changed"
            assert hashlib.sha256(data).hexdigest()==entry['sha256'],f"{lang}-{idx} image SHA changed"
            with Image.open(io.BytesIO(data)) as image:
                assert image.format=='PNG' and image.size==(1254,1254),f"{lang}-{idx} wrong PNG size"
            out.write_bytes(data)
            print(f"TOP QUOTE AD {lang.upper()} model {idx} verified")
if __name__=='__main__':main()
