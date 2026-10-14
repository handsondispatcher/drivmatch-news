"""Market quote UI: clean numbers only, with source provenance retained in metadata."""
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'site/index.html').read_text(encoding='utf-8')
UTILITY=(ROOT/'site/assets/utility-strip.js').read_text(encoding='utf-8')
APP=(ROOT/'site/assets/app.js').read_text(encoding='utf-8')
WORKFLOW=(ROOT/'.github/workflows/deploy.yml').read_text(encoding='utf-8')

class MarketQuoteUiContract(unittest.TestCase):
    def test_main_quote_has_no_visible_source_or_date_footer(self):
        self.assertIn('CANONICAL COMPACT QUOTES: values and percentage only',HTML)
        self.assertIn('.dm-util-quote .dm-util-provenance,',HTML)
        self.assertIn('.market-live-row .market-asof{',HTML)
        self.assertIn('clip-path:inset(50%)!important',HTML)
        self.assertNotIn('Market integrity: make original observation date visible',HTML)
        self.assertIn('#market-note,#market-note-mobile{display:none!important}',HTML)
        self.assertIn('grid-template-rows:16px 23px!important',HTML)

    def test_market_data_and_instrument_type_are_not_erased(self):
        self.assertIn("meta.textContent=source",UTILITY)
        self.assertIn("value.title=source",UTILITY)
        self.assertIn("marketFresh(v,item.id)&&!historical",UTILITY)
        self.assertIn("el('top-usd-label').textContent=localized('Dólar','US Dollar','Dólar')",UTILITY)
        self.assertIn("market.usdbrl?.instrument==='spot'",UTILITY)
        self.assertNotIn("initializeTradingViewMarket()",UTILITY)
        self.assertIn("{id:'usd',data:usd,decimals:3",UTILITY)
        self.assertIn("{id:'diesel',data:market.diesel,decimals:2",UTILITY)
        self.assertIn("{id:'brent',data:brent,decimals:2",UTILITY)
        self.assertNotIn("decimals:4",UTILITY)
        self.assertEqual(UTILITY.count("decimals:3"),1)
        self.assertIn('maximumFractionDigits:2',APP)
        self.assertNotIn("maximumFractionDigits:key==='usdbrl'?4:3",APP)
        self.assertNotIn("tv-tickers",HTML)
        self.assertNotIn("tradingview-widget.com/w/en/tv-tickers.js",HTML)
        self.assertIn('id="top-usd-label" class="dm-util-label dm-market-ref-link"',HTML)
        self.assertIn('id="top-brent-label" class="dm-util-label dm-market-ref-link"',HTML)
        self.assertIn('id="top-diesel-label" class="dm-util-label dm-market-ref-link"',HTML)
        self.assertIn('font-size:15px!important',HTML)
        self.assertIn('font-size:19px!important',HTML)
        self.assertIn("localized('Ver cotação ↗'",UTILITY)
        self.assertIn("https://br.investing.com/commodities/brent-oil",APP)
        self.assertNotIn("Dólar PTAX",UTILITY)
        self.assertNotIn("Dólar PTAX",APP)
        self.assertIn("setInterval(quotes,60*1000)",UTILITY)
        self.assertIn("const valid=verifiedMarketQuote(v,key)&&",APP)
        self.assertIn("!(key==='usdbrl'&&v?.instrument==='ptax_reference')",APP)
        self.assertIn("key==='brent'&&v?.quote_status==='historical_reference'",APP)
        self.assertIn("return '<div class=\"sideitem market-live-row\" ",APP)
        self.assertIn("MARKET_QUOTE_UI_RELEASE: compact-prices-only-20261013",UTILITY)
        self.assertIn("MARKET_QUOTE_UI_RELEASE: compact-prices-only-20261013",APP)

    def test_public_domain_visual_release_guard(self):
        self.assertIn('python scripts/check_quote_ui_release.py',WORKFLOW)
        monitor=(ROOT/'scripts/check_quote_ui_release.py').read_text(encoding='utf-8')
        self.assertIn('https://drivmatch.com/news',monitor)
        self.assertIn('https://handsondispatcher.github.io/drivmatch-news',monitor)
        self.assertIn('CANONICAL COMPACT QUOTES',monitor)

if __name__=='__main__':
    unittest.main()
