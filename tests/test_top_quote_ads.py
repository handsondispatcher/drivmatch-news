"""Exact nine original images and language/interaction wiring for quote ad rotation."""
import hashlib,json,unittest
from pathlib import Path
P=Path(__file__).resolve().parents[1]
class TopQuoteAds(unittest.TestCase):
 def test_images(self):
  m=json.loads((P/'content/top-quote-ad-models.json').read_text(encoding='utf-8'))
  self.assertEqual(m['rotation_seconds'],4)
  for lang in ('pt','en','es'):
   self.assertEqual(len(m['models'][lang]),3)
   for rec in m['models'][lang]:
    raw=(P/'site'/rec['file']).read_bytes()
    self.assertEqual(len(raw),rec['size'])
    self.assertEqual(hashlib.sha256(raw).hexdigest(),rec['sha256'])
 def test_html_js(self):
  h=(P/'site/index.html').read_text(encoding='utf-8')
  j=(P/'site/assets/top-quote-ad-rotation.js').read_text(encoding='utf-8')
  self.assertEqual(h.count('id="top-quote-ad-slot"'),1)
  self.assertIn('id="top-quote-ad-sms"',h)
  self.assertIn('id="top-quote-ad-whatsapp"',h)
  self.assertIn('top-quote-ad-rotation.js?v=',h)
  self.assertIn("window.setInterval(advance,4000)",j)
  self.assertIn("drivmatch:language",j)
  self.assertIn("assets/ads/top-square/",j)
  self.assertIn("object-fit:contain",h)
if __name__=='__main__':unittest.main()
