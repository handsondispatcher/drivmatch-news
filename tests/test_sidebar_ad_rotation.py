"""Official DrivMatch News right-column infinite ad rotation v1.0."""
import json,unittest
from pathlib import Path
P=Path(__file__).resolve().parents[1]
class SidebarAdRotation(unittest.TestCase):
 def test_official_rule_and_config(self):
  ads=json.loads((P/'content/ads.json').read_text(encoding='utf-8'))
  cfg=ads['sidebar_ad_rotation']
  self.assertEqual(cfg['status'],'active')
  self.assertEqual(cfg['direction'],'up')
  self.assertTrue(cfg['infinite'])
  self.assertEqual(cfg['speed_css_pixels_per_second'],56)
  self.assertTrue(cfg['state_indicator'])
  self.assertEqual(cfg['slots'],['market-sidebar','market-sidebar-driver','auto-m-usa','gracie-barra'])
  for key in ('hover_pause','focus_pause','touch_pause','reduced_motion_default_paused','clickable_ads_preserved'):
   self.assertTrue(cfg[key])
  self.assertTrue((P/cfg['governance_doc']).exists())
 def test_live_one_copy_of_each_ad_and_language(self):
  html=(P/'site/index.html').read_text(encoding='utf-8')
  js=(P/'site/assets/sidebar-ad-rotation.js').read_text(encoding='utf-8')
  for key in ('market-commercial-banner','market-driver-availability-banner','auto-m-usa-banner'):
   self.assertEqual(html.count('id="'+key+'"'),1)
  for key in ('dm-ad-rotation','dm-ad-rotation-viewport','dm-ad-rotation-track','dm-ad-rotation-toggle'):
   self.assertIn('id="'+key+'"',html)
  self.assertIn('sidebar-ad-rotation.js?v=20261017-four-advertisers-v1',html)
  self.assertIn('id="dm-ad-rotation-status"',html)
  self.assertIn(' const speed=56;',js)
  self.assertIn("track.appendChild(first)",js)
  self.assertNotIn("cloneNode",js)
  self.assertIn('pointerenter',js)
  self.assertIn('focusin',js)
  self.assertIn('touchstart',js)
  self.assertIn('prefers-reduced-motion',js)
  self.assertIn("drivmatch:language",js)
  self.assertIn("IntersectionObserver",js)
  self.assertIn("href=\"https://www.instagram.com/autom.usa/\"",html)
  self.assertIn('14076004737?text=',html)
if __name__=='__main__':unittest.main()
