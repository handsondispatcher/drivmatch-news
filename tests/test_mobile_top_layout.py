"""Mobile DrivMatch News market/forecast advertising layout regression."""
import unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
class MobileTopLayout(unittest.TestCase):
 def test_layout_is_mobile_only_and_canonical(self):
  page=(ROOT/'site/index.html').read_text(encoding='utf8')
  style=(ROOT/'site/assets/mobile-top-layout.css').read_text(encoding='utf8')
  self.assertIn('assets/mobile-top-layout.css?v=20261017-1',page)
  self.assertIn('@media screen and (max-width:850px)',style)
  self.assertIn('grid-template-columns:repeat(2,minmax(0,1fr))!important',style)
  self.assertIn('grid-column:1/-1!important',style)
  self.assertIn('#dm-utility #top-quote-ad-slot',style)
  self.assertIn('width:clamp(154px,43vw,184px)!important',style)
  self.assertIn('#dm-news-crawler',style)
  self.assertNotIn('display:none!important',style.split('/* Commercial square')[1])
  self.assertEqual(page.count('id="top-quote-ad-slot"'),1)
  self.assertEqual(page.count('id="dm-news-crawler"'),1)
 def test_existing_source_and_language_controls(self):
  page=(ROOT/'site/index.html').read_text(encoding='utf8')
  for control in ('top-usd-label','top-diesel-label','top-brent-label','top-city-query','top-risk','top-quote-ad-sms','top-quote-ad-whatsapp'):
   self.assertIn('id="'+control+'"',page)
  for lang in ('pt','es','en'):
   self.assertIn('data-site-lang="'+lang+'"',page)
if __name__=='__main__':unittest.main()
