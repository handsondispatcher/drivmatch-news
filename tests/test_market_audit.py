"""Market audit must distinguish valid published references from stale/absent rates."""
import unittest
from datetime import datetime, timedelta, timezone
from scripts.audit_market import validate

UTC=timezone.utc

class MarketAudit(unittest.TestCase):
    def test_fresh_references_are_accepted(self):
        now=datetime(2026,10,13,15,tzinfo=UTC)
        inds={
            'usdbrl':{'instrument':'ptax_reference','session_status':'closed',
                'value':4.93,'observed_at':'2026-10-10',
                'source':'Banco Central do Brasil','source_url':'https://www.bcb.gov.br/'},
            'diesel':{'instrument':'diesel_eia_reference','session_status':'published_reference',
                'value':4.0,'observed_at':'2026-10-05',
                'source':'EIA / FRED (semanal)','source_url':'https://fred.stlouisfed.org/series/GASDESW'},
            'brent':{'instrument':'brent_eia_reference','session_status':'published_reference',
                'value':81.2,'observed_at':'2026-10-12',
                'source':'EIA / FRED (diário)','source_url':'https://fred.stlouisfed.org/series/DCOILBRENTEU'}}
        report=validate({'indicators':inds},now)
        self.assertEqual(report['status'],'ok',report)

    def test_older_daily_brent_is_rejected(self):
        now=datetime(2026,10,13,15,tzinfo=UTC)
        q={'instrument':'brent_eia_reference','session_status':'published_reference',
           'value':125.44,'source':'EIA','source_url':'https://fred.stlouisfed.org/',
           'observed_at':'2026-10-06'}
        report=validate({'indicators':{'brent':q}},now)
        self.assertEqual(report['indicators']['brent'],'invalid')
        self.assertIn('brent:expired observation',report['errors'])

    def test_official_but_aged_brent_is_explicitly_historical(self):
        now=datetime(2026,10,13,15,tzinfo=UTC)
        q={'instrument':'brent_eia_reference','session_status':'historical_reference',
           'quote_status':'historical_reference','value':125.44,'source':'EIA / FRED (diário)',
           'source_url':'https://fred.stlouisfed.org/series/DCOILBRENTEU',
           'observed_at':'2026-10-06'}
        report=validate({'indicators':{'brent':q}},now)
        self.assertEqual(report['status'],'partial')
        self.assertEqual(report['indicators']['brent']['status'],'historical_reference')
        self.assertIn('brent:EIA_reference_is_historical_not_current_market',report['warnings'])
        self.assertFalse(report['errors'])

    def test_missing_feeds_warn_without_fabricating(self):
        now=datetime(2026,10,13,15,tzinfo=UTC)
        report=validate({'indicators':{}},now)
        self.assertEqual(report['status'],'partial')
        self.assertEqual(len(report['warnings']),3)
        self.assertFalse(report['errors'])

    def test_open_quote_expires_after_five_minutes(self):
        now=datetime(2026,10,13,15,tzinfo=UTC)
        q={'instrument':'spot','session_status':'open','value':4.91,
           'source':'Authorized provider','source_url':'https://example.org/spot',
           'observed_at':(now-timedelta(minutes=6)).isoformat()}
        report=validate({'indicators':{'usdbrl':q}},now)
        self.assertEqual(report['indicators']['usdbrl'],'invalid')

if __name__=='__main__':
    unittest.main()
