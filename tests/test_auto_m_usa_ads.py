import json,hashlib,unittest
from pathlib import Path
P=Path(__file__).resolve().parents[1]
class AutoMUSAAds(unittest.TestCase):
 def test_advertiser_images_exact(self):
  ads=json.loads((P/'content/ads.json').read_text(encoding='utf-8'))
  p=next(x for x in ads['placements'] if x['slot']=='auto-m-usa')
  self.assertTrue(p['enabled'])
  self.assertEqual(p['language_variants'],['pt','es','en'])
  self.assertEqual(p['phone'],'+1 (407) 600-4737')
  self.assertEqual(p['whatsapp_url'],'https://wa.me/14076004737?text=Ol%C3%A1!%20Vim%20pelo%20an%C3%BAncio%20da%20DrivMatch%20News.')
  self.assertEqual(p['instagram_url'],'https://www.instagram.com/autom.usa/')
  for lang in ('pt','es','en'):
   asset=P/'site/assets/ads'/f'auto-m-usa-{lang}-original.png'
   self.assertTrue(asset.exists(),str(asset))
   self.assertEqual(hashlib.sha256(asset.read_bytes()).hexdigest(),p['master_images'][lang]['sha256'])
 def test_sidebar_language_and_contacts(self):
  html=(P/'site/index.html').read_text(encoding='utf-8')
  js=(P/'site/assets/auto-m-usa.js').read_text(encoding='utf-8')
  self.assertIn('id="auto-m-usa-banner"',html)
  self.assertIn('id="autom-usa-image"',html)
  self.assertIn('id="autom-usa-label"',html)
  self.assertIn('class="autom-usa-hit autom-usa-phone"',html)
  self.assertIn('class="autom-usa-hit autom-usa-instagram"',html)
  self.assertEqual(html.count('id="auto-m-usa-banner"'),1)
  self.assertLess(html.index('id="market-driver-availability-banner"'),html.index('id="auto-m-usa-banner"'))
  self.assertLess(html.index('id="auto-m-usa-banner"'),html.index('</aside>\n</div>\n<aside class="newsroom-partner-cta"'))
  self.assertIn("drivmatch:language",js)
  self.assertIn("a.filename+'?v=",js)
  self.assertNotIn('auto-m-usa-pt-wide.svg',html)
  self.assertIn('#mercados #auto-m-usa-banner',html)
 def test_other_campaigns_unchanged(self):
  a=json.loads((P/'content/ads.json').read_text(encoding='utf-8'))
  placements={p['slot']:p for p in a['placements']}
  self.assertEqual(placements['news-top']['creative_type'],'carhauler-approved-photo1')
  self.assertEqual(placements['market-sidebar']['creative_type'],'ucr-2027-official')
  self.assertEqual(placements['news-carhauler']['creative_type'],'ucr-2027-official')
if __name__=='__main__':unittest.main()
