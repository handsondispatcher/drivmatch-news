import json, unittest
from pathlib import Path
P=Path(__file__).resolve().parents[1]
class AdvertisingCampaigns(unittest.TestCase):
 def test_slots_and_campaigns(self):
  ads=json.loads((P/'content/ads.json').read_text())
  self.assertTrue(ads['enabled'])
  self.assertEqual({x['slot'] for x in ads['placements']},{'news-top','market-sidebar','article-inline','mobile-inline','news-carhauler'})
  ucr=[p for p in ads['placements'] if p.get('creative_type')=='ucr-2027-official']
  self.assertEqual({p['slot'] for p in ucr},{'market-sidebar','mobile-inline'})
  self.assertEqual({p['slot'] for p in ucr if p['enabled']},{'market-sidebar'})
  self.assertEqual(ads['official_campaign']['language_variants'],['pt','en','es'])
  for p in ucr:
   self.assertEqual(p['url'],'https://ig.me/m/fabriciodispatcher')
   self.assertTrue(p['whatsapp_url'].startswith('https://wa.me/19082913386'))
   self.assertTrue(p['master_image'].startswith('https://cdn.openart.ai/'))
  car=[p for p in ads['placements'] if p.get('creative_type')!='ucr-2027-official']
  self.assertEqual({p['slot'] for p in car},{'news-top','article-inline','news-carhauler'})
  self.assertEqual({p['slot'] for p in car if p['enabled']},{'news-top','article-inline'})
  self.assertEqual(ads['placement_policy']['desktop']['news-top'],'carhauler-approved-photo1 / horizontal')
  self.assertTrue(all(p['creative_type']=='carhauler-approved-photo1' for p in car))
  self.assertTrue(all(p['approved_master_sha256']=='1bb40335eb3f058eaeae14a011e42f51e8c00194822b942e5c5628c19a88622d' for p in car))
  self.assertTrue(all(p['approved_master']==ads['approved_creative_rules']['carhauler_photo1']['master_image'] for p in car))
 def test_html_slots_and_translations(self):
  html=(P/'site/index.html').read_text()
  js=(P/'site/assets/app.js').read_text()
  for name in ('news-commercial-banner','market-commercial-banner','article-commercial-banner','mobile-commercial-banner','news-carhauler-banner'):
   self.assertIn('id="'+name+'"',html)
  self.assertIn('function renderAds()',js)
  self.assertIn('ucr-frame-horizontal',js)
  self.assertIn('ucr-frame-square',js)
  self.assertIn('ig.me/m/fabriciodispatcher',js)
  self.assertIn("pt:{label:",js)
  self.assertIn("en:{label:",js)
  self.assertIn("es:{label:",js)
  self.assertIn('renderStories();renderMarket();renderAds();',js)
  self.assertIn('carhauler-approved-photo1',js)
  self.assertIn('car-official-visual',js)
  self.assertIn('data-approved-photo1-sha256',js)
  self.assertNotIn('car-ad-actions',js)
  self.assertIn('assets/ads/carhauler-photo1-',js)
  self.assertIn('background-size:100% 100%',js)
 def test_official_master_asset_immutable(self):
  builder=(P/'scripts/install_carhauler_photo1.py').read_text()
  workflow=(P/'.github/workflows/deploy.yml').read_text()
  self.assertIn('1bb40335eb3f058eaeae14a011e42f51e8c00194822b942e5c5628c19a88622d',builder)
  self.assertIn('ImageChops.difference',builder)
  self.assertIn('"horizontal": (0, 0, 1774, 394)',builder)
  self.assertIn('"rectangle": (668, 449, 1677, 810)',builder)
  self.assertIn('"square": (55, 445, 595, 821)',builder)
  self.assertIn('python scripts/install_carhauler_photo1.py',workflow)
  self.assertIn('OFFICIAL PHOTO 1 PASS',builder)
 def test_legacy_art_kept(self):
  for name,size in [('horizontal','1440 480'),('rectangle','1200 628'),('square','1080 1080')]:
   s=(P/f'site/assets/ads/carhauler-{name}.svg').read_text()
   self.assertIn('viewBox="0 0 '+size+'"',s)
