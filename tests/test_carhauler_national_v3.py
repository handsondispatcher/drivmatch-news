"""No newspaper-brand graphic on each 1774x394 approved advertising PNG."""
from pathlib import Path
import unittest,io,json,hashlib
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
class TestThreeLocalizedTransportBanners(unittest.TestCase):
 def test_approved_files_logo_removed(self):
  spec=json.loads((ROOT/'content/ads.json').read_text(encoding='utf-8'))['paired_horizontal_ad_rotation']['carhauler_national_service_v3']
  for lang,rec in spec['assets'].items():
   raw=(ROOT/'site'/rec['path']).read_bytes()
   self.assertEqual(len(raw),rec['size'])
   self.assertEqual(hashlib.sha256(raw).hexdigest(),rec['sha256'])
   im=Image.open(io.BytesIO(raw))
   self.assertEqual(im.size,(1774,394))
   top=im.convert('RGB').crop((47,17,325,55))
   white=sum(1 for r,g,b in top.getdata() if r>175 and g>175 and b>175)
   self.assertLess(int(white),20,lang)
 def test_locale_paths_render(self):
  js=(ROOT/'site/assets/app.js').read_text(encoding='utf-8')
  self.assertIn("carhauler-national-no-news-logo-'+lang+'-1774x394.png",js)
  self.assertIn("data-approved-national-v3-locale",js)
if __name__=='__main__':unittest.main()
