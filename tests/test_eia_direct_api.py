"""Direct EIA API route, schema and provenance regression tests."""
import json
import unittest
from datetime import datetime, timezone
from unittest.mock import patch
from scripts import update as up

UTC=timezone.utc

class OfficialEnergySource(unittest.TestCase):
    def fixture(self,series,prices):
        return json.dumps({'response':{'data':[{
            'series':series,'period':dt,'value':str(value)
        } for dt,value in prices]}})

    def test_diesel_direct_official_api(self):
        payload=self.fixture('EMD_EPD2D_PTE_NUS_DPG',
                             [('2026-10-05',6.199),('2026-09-28',6.382)])
        with patch.dict('os.environ',{'EIA_API_KEY':'fake-key'}),\
             patch.object(up,'NOW',return_value=datetime(2026,10,13,15,tzinfo=UTC)),\
             patch.object(up,'fetch',return_value=payload) as fetch:
            quote=up.eia_direct_latest('diesel')
        self.assertAlmostEqual(quote['value'],6.199)
        self.assertEqual(quote['instrument'],'diesel_eia_reference')
        self.assertEqual(quote['session_status'],'published_reference')
        self.assertEqual(quote['cadence'],'weekly')
        self.assertIn('petroleum/pri/gnd/data/',fetch.call_args.args[0])
        self.assertIn('EMD_EPD2D_PTE_NUS_DPG',fetch.call_args.args[0])

    def test_brent_direct_official_api_aged_stays_historical(self):
        payload=self.fixture('RBRTE',[('2026-10-06',125.44),('2026-10-05',125.51)])
        with patch.dict('os.environ',{'EIA_API_KEY':'fake-key'}),\
             patch.object(up,'NOW',return_value=datetime(2026,10,13,15,tzinfo=UTC)),\
             patch.object(up,'fetch',return_value=payload) as fetch:
            quote=up.eia_direct_latest('brent')
        self.assertAlmostEqual(quote['value'],125.44)
        self.assertEqual(quote['instrument'],'brent_eia_reference')
        self.assertEqual(quote['quote_status'],'historical_reference')
        self.assertIn('petroleum/pri/spt/data/',fetch.call_args.args[0])
        self.assertIn('RBRTE',fetch.call_args.args[0])

    def test_api_requires_registered_key(self):
        with patch.dict('os.environ',{},clear=True):
            with self.assertRaisesRegex(ValueError,'EIA_API_KEY'):
                up.eia_direct_latest('diesel')

    def test_reject_other_series_in_response(self):
        payload=self.fixture('RWTC',[('2026-10-12',90.0)])
        with patch.dict('os.environ',{'EIA_API_KEY':'fake-key'}),\
             patch.object(up,'fetch',return_value=payload):
            with self.assertRaisesRegex(ValueError,'No valid official EIA'):
                up.eia_direct_latest('brent')

if __name__=='__main__':
    unittest.main()
