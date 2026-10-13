"""Public-domain market must match the newly deployed GitHub Pages market."""
import unittest
from scripts.check_public_market_sync import market_contract,verify,ORIGINS

class PublicMarketSyncTest(unittest.TestCase):
    def test_equal_observations_are_verified(self):
        p={'generated_at':'2026-10-13T16:00:00+00:00','indicators':{
            'diesel':{'value':6.199,'instrument':'diesel_eia_reference',
                      'observed_at':'2026-10-05','source':'EIA',
                      'quote_status':'last_official_publication'}}}
        result=verify(lambda origin:p,retries=1,wait=0)
        self.assertEqual(result['status'],'synchronized')

    def test_stale_custom_domain_fails_even_if_values_match(self):
        new={'generated_at':'2026-10-13T16:00:00+00:00','indicators':{
            'usdbrl':{'value':5.07,'observed_at':'2026-10-13T16:00:00Z'}}}
        old={'generated_at':'2026-10-10T10:00:00+00:00','indicators':{
            'usdbrl':{'value':4.98,'observed_at':'2026-10-09'}}}
        def fetch(origin):
            return new if origin==ORIGINS[0] else old
        result=verify(fetch,retries=1,wait=0)
        self.assertEqual(result['status'],'mismatch')

    def test_missing_domain_returns_a_blocker_not_fake_success(self):
        p={'generated_at':'2026-10-13T16:00:00+00:00','indicators':{}}
        def fetch(origin):
            if origin==ORIGINS[1]:raise ConnectionError('Offline custom origin')
            return p
        result=verify(fetch,retries=1,wait=0)
        self.assertEqual(result['status'],'mismatch')
        self.assertIn('ConnectionError',result['reason'])

if __name__=='__main__':
    unittest.main()
