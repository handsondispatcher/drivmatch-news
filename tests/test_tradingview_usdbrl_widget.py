"""USD/BRL card experiment: TradingView supplies its own pixels and numbers.

The commercial-data JSON remains an independently attributed fallback. No
TradingView JS values are scraped or relabeled as an AwesomeAPI rate.
"""
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'site/index.html').read_text(encoding='utf-8')
UTILITY=(ROOT/'site/assets/utility-strip.js').read_text(encoding='utf-8')
APP=(ROOT/'site/assets/app.js').read_text(encoding='utf-8')

class TradingViewUsdCard(unittest.TestCase):
    def test_official_tradingview_widget_not_embedded_snapshot(self):
        self.assertIn('class="dm-util-quote dm-usd-quote"',HTML)
        self.assertIn('<tv-single-ticker symbol="FX_IDC:USDBRL"',HTML)
        self.assertIn('<tv-single-ticker symbol="FRED:GASDESW"',HTML)
        self.assertIn('class="dm-util-quote dm-diesel-quote"',HTML)
        self.assertIn('class="dm-diesel-provider"',HTML)
        self.assertIn('id="top-diesel-label" class="dm-util-label dm-market-ref-link"',HTML)
        self.assertIn('Diesel no varejo EUA',HTML)
        self.assertIn('EIA / FRED, cotação semanal',UTILITY)
        self.assertIn('https://widgets.tradingview-widget.com/w/en/tv-single-ticker.js',HTML)
        self.assertIn('class="dm-usd-provider"',HTML)
        self.assertIn(':has(tv-single-ticker:defined) .dm-usd-fallback',HTML)
        self.assertIn(':has(tv-single-ticker:defined) .dm-diesel-fallback',HTML)
        self.assertIn('height:89px',HTML)
        self.assertNotIn('transform:scale(',HTML.split('<style id="dm-usd-tradingview-native-v1">')[1].split('</style>')[0])

    def test_original_source_link_and_graceful_fallback(self):
        self.assertIn('id="top-usd-label" class="dm-util-label dm-market-ref-link"',HTML)
        self.assertIn('href="https://br.tradingview.com/symbols/FX_IDC-USDBRL/"',HTML)
        self.assertIn('class="dm-util-money dm-usd-fallback"',HTML)
        self.assertIn('id="top-usd-value"',HTML)
        self.assertIn('id="top-usd-change"',HTML)

    def test_no_two_hour_old_live_quote(self):
        self.assertIn("if(v.session_status==='open')return age<=5*60000;",UTILITY)
        self.assertIn("age<=(v.session_status==='open'?5*60000:maxAge)",APP)
        self.assertNotIn("key==='usd'?120:5",UTILITY)
        self.assertNotIn("key==='usdbrl'?120:5",APP)
        self.assertIn("market.usdbrl?.instrument==='spot'",UTILITY)
        self.assertIn("!(key==='usdbrl'&&v?.instrument==='ptax_reference')",APP)

if __name__=='__main__':unittest.main()
