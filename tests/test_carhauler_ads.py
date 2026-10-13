import json, unittest
from pathlib import Path
P=Path(__file__).resolve().parents[1]
class AdvertisingCampaigns(unittest.TestCase):
 def test_slots_and_campaigns(self):
  ads=json.loads((P/'content/ads.json').read_text())
  self.assertTrue(ads['enabled'])
  self.assertEqual({x['slot'] for x in ads['placements']},{'news-top','market-sidebar','article-inline','mobile-inline'})
  ucr=[p for p in ads['placements'] if p.get('creative_type')=='ucr-2027-official']
  self.assertEqual({p['slot'] for p in ucr},{'news-top','market-sidebar','mobile-inline'})
  self.assertEqual(ads['official_campaign']['language_variants'],['pt','en','es'])
  for p in ucr:
   self.assertEqual(p['url'],'https://ig.me/m/fabriciodispatcher')
   self.assertTrue(p['whatsapp_url'].startswith('https://wa.me/19082913386'))
   self.assertTrue(p['master_image'].startswith('https://cdn.openart.ai/'))
  car=[p for p in ads['placements'] if p.get('creative_type')!='ucr-2027-official']
  self.assertEqual(len(car),1)
  self.assertEqual(car[0]['slot'],'article-inline')
 def test_html_slots_and_translations(self):
  html=(P/'site/index.html').read_text()
  js=(P/'site/assets/app.js').read_text()
  for name in ('news-commercial-banner','market-commercial-banner','article-commercial-banner','mobile-commercial-banner'):
   self.assertIn('id="'+name+'"',html)
  self.assertIn('function renderAds()',js)
  self.assertIn('ucr-frame-horizontal',js)
  self.assertIn('ucr-frame-square',js)
  self.assertIn('ig.me/m/fabriciodispatcher',js)
  self.assertIn("pt:{label:",js)
  self.assertIn("en:{label:",js)
  self.assertIn("es:{label:",js)
  self.assertIn('renderStories();renderMarket();renderAds();',js)
  self.assertIn('Vehicles are not for sale',js)
 def test_legacy_art_kept(self):
  for name,size in [('horizontal','1440 480'),('rectangle','1200 628'),('square','1080 1080')]:
   s=(P/f'site/assets/ads/carhauler-{name}.svg').read_text()
   self.assertIn('viewBox="0 0 '+size+'"',s)
