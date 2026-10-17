"""Preserve complete DrivMatch News media rail at mobile footer, same DOM instance."""
import unittest
from pathlib import Path
P=Path(__file__).resolve().parents[1]
class MobileMediaFooter(unittest.TestCase):
 def test_movable_unique_sidebar(self):
  html=(P/'site/index.html').read_text(encoding='utf8')
  js=(P/'site/assets/mobile-media-footer.js').read_text(encoding='utf8')
  self.assertEqual(html.count('id="mercados"'),1)
  self.assertEqual(html.count('id="mobile-media-footer-slot"'),1)
  self.assertLess(html.index('id="pesquisa-noticias"'),html.index('id="mobile-media-footer-slot"'))
  self.assertLess(html.index('id="mobile-media-footer-slot"'),html.index('<footer class="footer"'))
  self.assertIn("mobileSlot.appendChild(rail)",js)
  self.assertIn("news.insertAdjacentElement('afterend',rail)",js)
  self.assertIn("matchMedia('(max-width: 990px)')",js)
  self.assertIn("assets/mobile-media-footer.js?v=",html)
 def test_single_live_modules_for_mobile(self):
  html=(P/'site/index.html').read_text(encoding='utf8')
  for fragment in ('.main > main > .weather-mobile{display:none!important}',
                   '#mercados.side{',
                   '#mercados .weather-desktop{display:block!important}',
                   '.mobile-market{display:none!important}',
                   '#mercados #dm-ad-rotation{display:block!important}'):
   self.assertIn(fragment,html)
  for item in ('id="clima-desktop"','id="roadtv-desktop"','id="market"','id="dm-ad-rotation"',
               'id="market-commercial-banner"','id="market-driver-availability-banner"','id="auto-m-usa-banner"'):
   self.assertIn(item,html)
if __name__=='__main__':unittest.main()
