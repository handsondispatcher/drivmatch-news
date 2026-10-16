"""Install exact PT/ES/EN approved advertisement snapshots, logo removed only top left."""
from pathlib import Path
import urllib.request, hashlib, io, time
from PIL import Image
ITEMS={"pt":{"url":"https://cdn.openart.ai/openart-uploads/production/attachment-transfers/5e08983e3fa3536928427fd1f4fadccf5aa22a92561a480923c94ff5c3eb1902.png","sha256":"eebe7f5a3bd7a9dee02dbceda4367b1c3561a29f5eeb195e015d3bb2dc287bcf","size":1073222},"es":{"url":"https://cdn.openart.ai/openart-uploads/production/attachment-transfers/47cfba018c7f3256084ba7e37b399e1d8ed54f210d1eab05c4eca716b4cf85d4.png","sha256":"371005effd90f611af914a002d5852a3e388f0eb25c9a5a5710032aea6fd8509","size":1096183},"en":{"url":"https://cdn.openart.ai/openart-uploads/production/attachment-transfers/5d4d4a39d5ac9e80aade76bde9d9ecb2ace376586b9bdee7ad51e62e86c46c59.png","sha256":"02857fb3a61dfd432e3afceeae27ea3f699423fa4da2c72269603debdd319c5a","size":1068904}}
BASE=Path(__file__).resolve().parents[1]
def main():
 for lang,item in ITEMS.items():
  dest=BASE/'site/assets/ads'/f'carhauler-national-no-news-logo-{lang}-1774x394.png'
  dest.parent.mkdir(parents=True,exist_ok=True)
  raw=dest.read_bytes() if dest.is_file() else None
  if raw is None or hashlib.sha256(raw).hexdigest()!=item['sha256']:
   for attempt in range(3):
    try:
     req=urllib.request.Request(item['url'],headers={'User-Agent':'Mozilla/5.0 DrivMatchNews'})
     with urllib.request.urlopen(req,timeout=45) as response:raw=response.read(3000000)
     break
    except Exception:
     if attempt==2:raise
     time.sleep(3*(attempt+1))
  assert len(raw)==item['size'],f"{lang}: unexpected byte count"
  assert hashlib.sha256(raw).hexdigest()==item['sha256'],f"{lang}: source was altered"
  img=Image.open(io.BytesIO(raw))
  assert img.format=='PNG' and img.size==(1774,394),f"{lang}: wrong image"
  dest.write_bytes(raw)
  print('AD BANNER VERIFIED',lang,hashlib.sha256(raw).hexdigest())
if __name__=='__main__':main()
