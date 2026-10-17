import unittest
from pathlib import Path
P=Path(__file__).resolve().parents[1]
class CanonicalMobileSponsors(unittest.TestCase):
 def test_same_source_and_mobile_visibility(self):
  html=(P/'site/index.html').read_text(encoding='utf-8')
  js=(P/'site/assets/sidebar-ad-rotation.js').read_text(encoding='utf-8')
  self.assertEqual(html.count('id="dm-ad-rotation"'),1)
  for ident in ('market-commercial-banner','market-driver-availability-banner','auto-m-usa-banner'):
   self.assertEqual(html.count('id="'+ident+'"'),1)
  for key in ('ucr-2027','driver-available','auto-m-usa'):
   self.assertIn('data-ad-campaign="'+key+'"',html)
  for fragment in ('#market-commercial-banner.ad-placement-side:not([hidden])',
                   '#market-driver-availability-banner:not([hidden])',
                   'max-width:680px!important','height:auto!important'):
   self.assertIn(fragment,html)
  self.assertIn("const canonicalOrder=['ucr-2027','driver-available','auto-m-usa']",js)
  self.assertIn('track.appendChild(item); // Move, NEVER clone originals.',js)
  self.assertIn("canonical-full-mobile",js)
  self.assertIn('requestAnimationFrame(tick)',js)
 def test_footer_after_sponsors(self):
  html=(P/'site/index.html').read_text(encoding='utf-8')
  self.assertLess(html.index('id="mobile-media-footer-slot"'),html.index('<footer class="footer"'))
  self.assertIn('id="dm-canonical-mobile-sponsors-v2"',html)
if __name__=='__main__':unittest.main()
