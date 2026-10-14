"""Approved AwesomeAPI and fallbacks cannot publish stale or unlicensed FX rates."""
import json
import unittest
from datetime import datetime,timedelta,timezone
from unittest.mock import patch
from scripts import update as market

UTC=timezone.utc

class CommercialFX(unittest.TestCase):
    def response(self,now,ask='5.0710',bid='5.0700'):
        return json.dumps({'USDBRL':{'code':'USD','codein':'BRL',
            'ask':ask,'bid':bid,'pctChange':'0.45',
            'timestamp':str(int(now.timestamp()))}})

    def test_fresh_authorized_ask_is_labeled_indicative(self):
        now=datetime(2026,10,13,15,tzinfo=UTC)
        with patch.object(market,'NOW',return_value=now),\
             patch.dict('os.environ',{'AWESOMEAPI_REDISTRIBUTION_AUTHORIZED':'true',
                                      'AWESOMEAPI_API_KEY':'test-key'}),\
             patch.object(market,'fetch',return_value=self.response(now)) as fetch:
            q=market.authorized_awesomeapi_usdbrl()
        self.assertEqual(q['value'],5.071)
        self.assertEqual(q['instrument'],'spot')
        self.assertEqual(q['session_status'],'open')
        self.assertEqual(q['rate_side'],'ask')
        self.assertTrue(q['indicative'])
        self.assertIn('x-api-key',fetch.call_args.kwargs['headers'])
        self.assertEqual(fetch.call_args.kwargs['headers']['x-api-key'],'test-key')

    def test_forbid_publishing_without_rights(self):
        with patch.dict('os.environ',{'AWESOMEAPI_REDISTRIBUTION_AUTHORIZED':'false',
                                      'AWESOMEAPI_API_KEY':'test-key'}):
            with self.assertRaisesRegex(ValueError,'rights'):
                market.authorized_awesomeapi_usdbrl()

    def test_stale_or_future_market_tick_is_rejected(self):
        now=datetime(2026,10,13,15,tzinfo=UTC)
        with patch.object(market,'NOW',return_value=now),\
             patch.dict('os.environ',{'AWESOMEAPI_REDISTRIBUTION_AUTHORIZED':'true',
                                      'AWESOMEAPI_API_KEY':'test-key'}):
            for age in (-6,6):
                timestamp=now+timedelta(minutes=age)
                with patch.object(market,'fetch',return_value=self.response(timestamp)):
                    with self.assertRaisesRegex(ValueError,'stale'):
                        market.authorized_awesomeapi_usdbrl()

    def test_last_provider_quote_after_hours_is_available_but_not_live(self):
        # 01:03 UTC on Wednesday = 22:03 in Brazil on Tuesday.
        now=datetime(2026,10,14,1,3,tzinfo=UTC)
        seen=now-timedelta(minutes=153)
        with patch.object(market,'NOW',return_value=now),\
             patch.dict('os.environ',{'AWESOMEAPI_REDISTRIBUTION_AUTHORIZED':'true',
                                      'AWESOMEAPI_API_KEY':'test-key'}),\
             patch.object(market,'fetch',return_value=self.response(seen)):
            q=market.authorized_awesomeapi_usdbrl()
        self.assertEqual(q['session_status'],'closed')
        self.assertEqual(q['quote_status'],'last_provider_observation')
        self.assertEqual(q['instrument'],'spot')
        self.assertEqual(q['close_date'],'2026-10-13')
        self.assertEqual(q['close_value'],q['value'])

    def test_stale_during_business_session_fails_closed(self):
        now=datetime(2026,10,14,15,tzinfo=UTC)
        with patch.object(market,'NOW',return_value=now),\
             patch.dict('os.environ',{'AWESOMEAPI_REDISTRIBUTION_AUTHORIZED':'true',
                                      'AWESOMEAPI_API_KEY':'test-key'}),\
             patch.object(market,'fetch',return_value=self.response(now-timedelta(minutes=7))):
            with self.assertRaisesRegex(ValueError,'stale during trading'):
                market.authorized_awesomeapi_usdbrl()

    def test_error_primary_tries_authorized_secondary(self):
        now=datetime(2026,10,13,15,tzinfo=UTC)
        with patch.object(market,'authorized_spot',side_effect=ValueError('offline')),\
             patch.object(market,'authorized_awesomeapi_usdbrl',return_value={'instrument':'spot','value':5.1}):
            result=market.authorized_fx_market_quote()
        self.assertEqual(result['value'],5.1)

if __name__=='__main__':unittest.main()
