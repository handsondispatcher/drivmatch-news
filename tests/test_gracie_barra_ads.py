import hashlib,json,unittest
from pathlib import Path
P=Path(__file__).resolve().parents[1]
EXPECTED={
'en-square':'e10d76a95f7e927c34e5155367fa0316e52ee52dc0eb63069d873d3767ca3107',
'pt-square':'4eaa9a8c1f5efdcf75781513ca86cf9f31e6327030b2f4df9208d2709afceced',
'es-square':'cf3fd055f0aa87454a1cfed6dad164a4d5fbc04142393e929bf74c431af73efe',
'en-wide':'88a5340338f5eec8a2df228f7b6c773c10d752d8b5e4c40600dc000b70180a3f',
'pt-wide':'43f3737ddbc2bbba9741766eacfc354d0e6fe5e789821b3fad91041abd2514a3',
'es-wide':'8b0d2e48979c8f13ffa6cbb1e64455a49e4d0ae851ff071ef9ca1233276257e1'}
class GracieAds(unittest.TestCase):
 def test_exact_art(self):
  for key,digest in EXPECTED.items():
   p=P/'site/assets/ads'/('gracie-barra-'+key+'.png')
   self.assertTrue(p.is_file(),str(p))
   self.assertEqual(hashlib.sha256(p.read_bytes()).hexdigest(),digest,key)
 def test_translation_and_clickable_links(self):
  h=(P/'site/index.html').read_text()
  s=(P/'site/assets/gracie-barra-ads.js').read_text()
  w=(P/'site/assets/horizontal-ad-sequence.js').read_text()
  self.assertIn('assets/gracie-barra-ads.js?v=',h)
  self.assertIn('assets/gracie-barra-ads.css?v=',h)
  self.assertIn("const order=['cars','ucr','auto']; order.push('gracie');",w)
  self.assertIn('document.addEventListener(\'drivmatch:language\'',s)
  for lang in ['pt','es','en']:
   self.assertIn('gracie-barra-'+lang+'-square.png',s)
  self.assertIn('gracie-barra-\'+locale+\'-wide.png',w)
  for piece in [s,w]:
   self.assertIn('graciebarraburlington.com',piece)
   self.assertIn('207+Cambridge+Street+Burlington+MA+01803',piece)
 def test_campaign_governance(self):
  c=json.loads((P/'content/ads.json').read_text())
  ads=[a for a in c['placements'] if a.get('campaign_id')=='gracie-barra-burlington-20261017']
  self.assertEqual(len(ads),2)
  self.assertEqual({a['slot'] for a in ads},{'sidebar-rotation','paired-horizontal-rotation'})
if __name__=='__main__':unittest.main()
