import json, unittest
from pathlib import Path
P=Path(__file__).resolve().parents[1]
class AdvertisingCampaigns(unittest.TestCase):
 def test_slots_and_campaigns(self):
  ads=json.loads((P/'content/ads.json').read_text())
  self.assertTrue(ads['enabled'])
  self.assertEqual({x['slot'] for x in ads['placements']},{'news-top','market-sidebar','article-inline','mobile-inline','news-carhauler'})
  ucr=[p for p in ads['placements'] if p.get('creative_type')=='ucr-2027-official']
  self.assertEqual({p['slot'] for p in ucr},{'news-top','market-sidebar','mobile-inline'})
  self.assertEqual(ads['official_campaign']['language_variants'],['pt','en','es'])
  for p in ucr:
   self.assertEqual(p['url'],'https://ig.me/m/fabriciodispatcher')
   self.assertTrue(p['whatsapp_url'].startswith('https://wa.me/19082913386'))
   self.assertTrue(p['master_image'].startswith('https://cdn.openart.ai/'))
  car=[p for p in ads['placements'] if p.get('creative_type')!='ucr-2027-official']
  self.assertEqual({p['slot'] for p in car},{'article-inline','news-carhauler'})
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
 def test_legacy_art_kept(self):
  for name,size in [('horizontal','1440 480'),('rectangle','1200 628'),('square','1080 1080')]:
   s=(P/f'site/assets/ads/carhauler-{name}.svg').read_text()
   self.assertIn('viewBox="0 0 '+size+'"',s)
