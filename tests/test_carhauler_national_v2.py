"""Verify scoped 2026-10-16 nationwide vehicle transport creative."""
import unittest,json,hashlib
from pathlib import Path
P=Path(__file__).resolve().parents[1]
class NationwideCreative(unittest.TestCase):
 def test_approved_artwork(self):
  ads=json.loads((P/'content/ads.json').read_text(encoding='utf8'))
  c=ads['paired_horizontal_ad_rotation']['carhauler_national_service_v2']
  file=P/'site'/c['path'];data=file.read_bytes()
  self.assertEqual(len(data),c['size'])
  self.assertEqual(hashlib.sha256(data).hexdigest(),c['sha256'])
  self.assertEqual(c['width'],1774);self.assertEqual(c['height'],394)
  self.assertEqual(c['contact_phone'],'(908) 291-3386')
  self.assertEqual(c['instagram'],'@fabriciodispatcher')
 def test_scoped_replacement_only(self):
  js=(P/'site/assets/app.js').read_text(encoding='utf-8')
  self.assertIn("const national=slot==='news-top'&&fmt==='horizontal'",js)
  self.assertIn("carhauler-national-no-news-logo-'+lang+'-1774x394.png",js)
  # Archived v2 remains in content manifest as an immutable historical source.
  c=json.loads((P/'content/ads.json').read_text(encoding='utf-8'))['paired_horizontal_ad_rotation']
  self.assertIn('carhauler_national_service_v2',c)
  self.assertEqual(c['carhauler_national_service_v2']['path'],'assets/ads/carhauler-national-service-pt-1774x394.png')
  self.assertIn("data-approved-photo1-sha256",js)
  self.assertIn("const nationwideWhatsapp='https://wa.me/19082913386?text='",js)
if __name__=='__main__':unittest.main()
