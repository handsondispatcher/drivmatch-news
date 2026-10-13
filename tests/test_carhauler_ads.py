import json,unittest
from pathlib import Path
P=Path(__file__).resolve().parents[1]
class CarHaulerAds(unittest.TestCase):
 def test_campaign(self):
  ads=json.loads((P/'content/ads.json').read_text())
  self.assertEqual(len(ads['placements']),4)
  self.assertEqual({x['slot'] for x in ads['placements']},{'news-top','market-sidebar','article-inline','mobile-inline'})
  for a in ads['placements']:
   self.assertTrue((P/'site'/a['image']).is_file())
   self.assertIn('fabriciodispatcher',a['url'])
   self.assertIn('19082913386',a['whatsapp_url'])
 def test_markup(self):
  html=(P/'site/index.html').read_text()
  js=(P/'site/assets/app.js').read_text()
  for key in ('news-commercial-banner','market-commercial-banner','article-commercial-banner','mobile-commercial-banner'):
   self.assertIn('id="'+key+'"',html)
   self.assertIn("'"+key+"'",js)
  self.assertIn('Vehicles are not for sale',js)
 def test_dimensions(self):
  for name,size in [('horizontal','1440 480'),('rectangle','1200 628'),('square','1080 1080')]:
   s=(P/f'site/assets/ads/carhauler-{name}.svg').read_text()
   self.assertIn('viewBox="0 0 '+size+'"',s)
   self.assertIn('Kissimmee',s)
   self.assertIn('fabriciodispatcher',s)
