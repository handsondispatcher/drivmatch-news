"""Install owner-requested nationwide car-carrier service banner in native wide ratio.
Preserve previous immutable Photo 1 source for all historical/article placements.
This new replacement is scoped to the paired homepage horizontal ad only.
"""
from pathlib import Path
import hashlib,io,time,urllib.request
from PIL import Image
URL="https://cdn.openart.ai/openart-uploads/production/attachment-transfers/e9714d4e1115bad8752332f92cff4a185555b2e842e0d6abf2027c628e3eefad.png"
DIGEST="d013f68020a12c8b9dc2c7721ba19a2fc710999217bbf78ab891cfc9f9df9442"
SIZE=1027424
DEST=Path(__file__).resolve().parents[1]/'site'/ "assets/ads/carhauler-national-service-pt-1774x394.png"
def main():
    DEST.parent.mkdir(parents=True,exist_ok=True)
    data=DEST.read_bytes() if DEST.exists() else None
    if data is None or hashlib.sha256(data).hexdigest()!=DIGEST:
        for attempt in range(3):
            try:
                with urllib.request.urlopen(urllib.request.Request(URL,headers={'User-Agent':'Mozilla/5.0 DrivMatchNews/1.0'}),timeout=35) as r:data=r.read(3000000)
                break
            except Exception:
                if attempt==2:raise
                time.sleep(2*(attempt+1))
    assert len(data)==SIZE,'new car service image size changed'
    assert hashlib.sha256(data).hexdigest()==DIGEST,'new car service creative checksum changed'
    im=Image.open(io.BytesIO(data));assert im.format=='PNG' and im.size==(1774,394),'native ratio mismatch'
    DEST.write_bytes(data)
    print('NATIONWIDE VEHICLE TRANSPORT OWNER CREATIVE VERIFIED',DIGEST)
if __name__=='__main__':main()
