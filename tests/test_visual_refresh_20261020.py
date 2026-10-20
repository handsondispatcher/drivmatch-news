"""Approved market-area visual refresh: protect provider widgets and mobile UX."""
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
PAGE=(ROOT/'site/index.html').read_text(encoding='utf-8')
MOBILE=(ROOT/'site/assets/mobile-top-layout.css').read_text(encoding='utf-8')

class ApprovedVisualRefresh(unittest.TestCase):
    def test_refresh_is_last_and_only_presentation(self):
        marker='<style id="dm-news-visual-refresh-20261020-v1">'
        self.assertEqual(PAGE.count(marker),1)
        refresh=PAGE.split(marker,1)[1].split('</style>',1)[0]
        self.assertGreater(PAGE.index(marker),PAGE.index('dm-usd-tradingview-native-v1'))
        self.assertNotIn('tv-single-ticker{display:none',refresh.replace(' ',''))
        self.assertNotIn('transform:scale',refresh)
        self.assertNotIn('clip-path',refresh)
        self.assertIn('box-shadow:0 4px 15px',refresh)
        self.assertIn('border-radius:17px',refresh)

    def test_native_provider_symbols_and_source_links_survive(self):
        self.assertIn('<tv-single-ticker symbol="FX_IDC:USDBRL"',PAGE)
        self.assertIn('<tv-single-ticker symbol="FRED:GASDESW"',PAGE)
        self.assertIn('<tv-single-ticker symbol="VELOCITY:BRENT"',PAGE)
        self.assertIn('https://br.tradingview.com/symbols/FX_IDC-USDBRL/',PAGE)
        self.assertIn('https://www.tradingview.com/symbols/FRED-GASDESW/',PAGE)
        self.assertIn('https://www.tradingview.com/symbols/VELOCITY-BRENT/',PAGE)
        self.assertIn('grid-template-rows:23px 89px!important',PAGE)

    def test_mobile_layout_weather_and_ad_still_present(self):
        refresh=PAGE.split('id="dm-news-visual-refresh-20261020-v1"',1)[1]
        self.assertIn('max-width:850px',refresh)
        self.assertIn('grid-column:1/-1!important',refresh)
        self.assertIn('dm-util-city:not([hidden])',refresh)
        for token in ('id="top-city-query"','id="top-risk"','id="top-quote-ad-slot"','id="language"'):
            self.assertIn(token,PAGE)
        self.assertIn('grid-template-columns:repeat(2,minmax(0,1fr))!important',MOBILE)

if __name__=='__main__':
    unittest.main()
