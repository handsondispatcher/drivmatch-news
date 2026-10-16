import json,unittest
from pathlib import Path
P=Path(__file__).resolve().parents[1]
class AutoMUSAAds(unittest.TestCase):
  def test_campaign(self):
    ads=json.loads((P/'content/ads.json').read_text(encoding='utf-8'))
    p=next(x for x in ads['placements'] if x['slot']=='auto-m-usa')
    self.assertTrue(p['enabled'])
    self.assertEqual(p['language_variants'],['pt','es','en'])
    self.assertEqual(p['phone'],'+1 (407) 600-4737')
    self.assertEqual(p['whatsapp_url'],'https://wa.me/14076004737?text=Vim%20pelo%20DrivMatch%20News')
    self.assertEqual(p['instagram_url'],'https://www.instagram.com/autom.usa/')
    for lang in ('pt','es','en'):
      for fmt,dims in [('wide','width="1774" height="394"'),('square','width="1254" height="1254"')]:
        asset=P/'site/assets/ads'/f'auto-m-usa-{lang}-{fmt}.svg'
        svg=asset.read_text(encoding='utf-8')
        self.assertIn(dims,svg)
        self.assertIn('@autom.usa',svg)
        self.assertIn('+1 (407) 600-4737',svg)
    html=(P/'site/index.html').read_text(encoding='utf-8')
    self.assertIn('id="auto-m-usa-banner"',html)
    self.assertIn('auto-m-usa.js?v=',html)
    self.assertIn('autom-usa-wide-phone',html)
    self.assertIn('autom-usa-square-ig',html)
    js=(P/'site/assets/auto-m-usa.js').read_text(encoding='utf-8')
    self.assertIn("drivmatch:language",js)
  def test_old_campaigns_preserved(self):
    ads=json.loads((P/'content/ads.json').read_text(encoding='utf-8'))
    placements={p['slot']:p for p in ads['placements']}
    self.assertEqual(placements['news-top']['creative_type'],'carhauler-approved-photo1')
    self.assertEqual(placements['market-sidebar']['creative_type'],'ucr-2027-official')
    self.assertEqual(placements['news-carhauler']['creative_type'],'ucr-2027-official')
if __name__=='__main__':unittest.main()
