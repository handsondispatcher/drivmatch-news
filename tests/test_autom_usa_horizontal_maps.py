import json,unittest
from pathlib import Path
P=Path(__file__).resolve().parents[1]
class MapsHorizontalAds(unittest.TestCase):
 def test_details(self):
  a=json.loads((P/'content/ads.json').read_text(encoding='utf-8'))['paired_horizontal_ad_rotation']['auto_m_usa_google_maps']
  self.assertTrue(a['phone_and_instagram_unchanged'])
  self.assertTrue(a['preserve_original_png_sha256'])
  self.assertIn('Kissimmee',a['href'])
  self.assertEqual(set(a['locales']),{'pt','es','en'})
  self.assertIn('2040 E Irlo Bronson Memorial Hwy',a['address'])
 def test_wiring(self):
  h=(P/'site/index.html').read_text(encoding='utf-8')
  j=(P/'site/assets/horizontal-ad-sequence.js').read_text(encoding='utf-8')
  for value in ('VER NO GOOGLE MAPS','VER EN GOOGLE MAPS','VIEW ON GOOGLE MAPS','dm-horizontal-auto-maps','dm-horizontal-auto-phone','dm-horizontal-auto-instagram'):
   self.assertIn(value,j)
  self.assertIn('20261017-maps-button-v1',h)
  self.assertIn('width:42.25%',h)
if __name__=='__main__':unittest.main()
