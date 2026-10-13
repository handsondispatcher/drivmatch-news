"""Canonical Market Cadence: never present a stale value as a live quote."""
import os
import unittest
from datetime import datetime, timezone, timedelta
from unittest.mock import patch

from scripts import update as market

UTC=timezone.utc

class MarketCadenceTests(unittest.TestCase):
    def test_eia_weekly_and_daily_have_distinct_expiry(self):
        now=datetime(2026,10,13,15,0,tzinfo=UTC)
        q=lambda iso:{'observed_at':iso}
        self.assertTrue(market.market_reference_current(q('2026-10-05'),'diesel',now))
        self.assertFalse(market.market_reference_current(q('2026-09-20'),'diesel',now))
        self.assertFalse(market.market_reference_current(q('2026-10-06'),'brent',now))
        self.assertTrue(market.market_reference_current(q('2026-10-12'),'brent',now))
        self.assertFalse(market.market_reference_current(q('not-a-date'),'brent',now))
        self.assertFalse(market.market_reference_current(q('2026-11-06'),'diesel',now))

    def test_commercial_close_expires_and_is_not_ptax(self):
        today=market.NOW().date()
        def contract(day):
            return dict(symbol='USD/BRL',instrument='spot',price_type='commercial',
                        session_status='closed',close_value=4.91,
                        close_date=day.isoformat(),source='Approved provider',
                        source_url='https://example.org/spot')
        ok=market.normalize_spot_quote(contract(today-timedelta(days=1)))
        self.assertEqual(ok['quote_status'],'last_verified_close')
        self.assertEqual(ok['instrument'],'spot')
        with self.assertRaises(ValueError):
            market.normalize_spot_quote(contract(today-timedelta(days=7)))

    def test_brent_authorized_feed_is_not_futures(self):
        sample=dict(instrument='brent_spot',unit='USD/bbl',
                    source='Licensed spot provider',source_url='https://example.org/brent',
                    session_status='open',value=81.52,
                    observed_at=market.NOW().isoformat())
        quote=market.normalize_brent_spot_quote(sample)
        self.assertEqual(quote['quote_status'],'live_snapshot')
        with self.assertRaises(ValueError):
            market.normalize_brent_spot_quote({**sample,'instrument':'brent_futures'})
        with self.assertRaises(ValueError):
            market.normalize_brent_spot_quote({**sample,'observed_at':
                (market.NOW()-timedelta(minutes=7)).isoformat()})

    def test_fred_source_is_a_published_reference_not_live(self):
        csv='DATE,DCOILBRENTEU\n2026-10-12,81.12\n'
        with patch.object(market,'fetch',return_value=csv),patch.object(market,'NOW',return_value=datetime(2026,10,13,15,tzinfo=UTC)):
            q=market.fred_latest('DCOILBRENTEU','EIA / FRED (diário)')
        self.assertEqual(q['session_status'],'published_reference')
        self.assertEqual(q['quote_status'],'last_official_publication')
        self.assertEqual(q['observed_at'],'2026-10-12')
        with patch.object(market,'fetch',return_value='DATE,DCOILBRENTEU\n2026-10-06,125.44\n'),patch.object(market,'NOW',return_value=datetime(2026,10,13,15,tzinfo=UTC)):
            stale=market.fred_latest('DCOILBRENTEU','EIA / FRED (diário)')
        self.assertEqual(stale['quote_status'],'historical_reference')
        self.assertEqual(stale['observed_at'],'2026-10-06')

if __name__=='__main__':
    unittest.main()
