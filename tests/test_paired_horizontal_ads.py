"""Native wide AUTO M USA and synchronized 5-second ad reveal policy."""
import json,hashlib,unittest
from pathlib import Path
P=Path(__file__).resolve().parents[1]
class PairedWideAds(unittest.TestCase):
 def test_campaign_policy(self):
  c=json.loads((P/'content/ads.json').read_text(encoding='utf-8'))['paired_horizontal_ad_rotation']
  self.assertEqual(c['cycle_seconds'],5)
  self.assertEqual(c['native_resolution'],[1774,394])
  self.assertEqual(c['phase_sequences']['top'],['cars','ucr','auto-m-usa'])
  self.assertEqual(c['phase_sequences']['bottom'],['ucr','auto-m-usa','cars'])
  for a,b in zip(c['phase_sequences']['top'],c['phase_sequences']['bottom']):self.assertNotEqual(a,b)
  for l in ('pt','es','en'):
   master=c['approved_auto_m_usa_wide'][l]
   data=(P/'site'/master['path']).read_bytes()
   self.assertEqual(len(data),master['size'])
   self.assertEqual(hashlib.sha256(data).hexdigest(),master['sha256'])
 def test_native_html_and_events(self):
  h=(P/'site/index.html').read_text(encoding='utf-8')
  a=(P/'site/assets/app.js').read_text(encoding='utf-8')
  j=(P/'site/assets/horizontal-ad-sequence.js').read_text(encoding='utf-8')
  self.assertIn('assets/horizontal-ad-sequence.js?v=',h)
  self.assertIn('aspect-ratio:1774/394!important',h)
  self.assertIn("CustomEvent('drivmatch:horizontal-ads-rendered'",a)
  self.assertIn("window.setInterval(advance,5000)",j)
  self.assertIn("const order=['cars','ucr','auto'];",j)
  self.assertIn('dm-horizontal-close',j)
  self.assertIn('dm-horizontal-open',j)
  self.assertIn('auto-m-usa-pt-wide-original.png',j)
  self.assertIn('14076004737?text=',j)
  self.assertIn('data-fallback',j)
if __name__=='__main__':unittest.main()
