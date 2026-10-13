"""PTAX OData bulletin acquisition and newest-timestamp selection."""
import json
import unittest
from datetime import datetime,timezone
from unittest.mock import patch
from scripts import update as up

UTC=timezone.utc

class PtaxOdataAdapter(unittest.TestCase):
    def test_same_day_intraday_bulletin_beats_friday_close(self):
        fixture=json.dumps({'value':[
            {'cotacaoVenda':4.9892,'dataHoraCotacao':'2026-10-09 13:10:00'},
            {'cotacaoVenda':5.0133,'dataHoraCotacao':'2026-10-13 12:02:00'}
        ]})
        with patch.object(up,'NOW',return_value=datetime(2026,10,13,16,0,tzinfo=UTC)):
            with patch.object(up,'fetch',return_value=fixture) as fetch:
                quote=up.official_bcb_ptax_odata()
        self.assertEqual(quote['value'],5.0133)
        self.assertEqual(quote['instrument'],'ptax_reference')
        self.assertEqual(quote['price_type'],'ptax_venda')
        self.assertEqual(quote['quote_status'],'official_bcb_ptax_intraday')
        self.assertEqual(quote['session_status'],'reference_intraday')
        self.assertIn('2026-10-13T15:02:00',quote['observed_at'])
        self.assertIn('CotacaoDolarPeriodo',fetch.call_args.args[0])
        self.assertIn('10-13-2026',fetch.call_args.args[0])

    def test_rejects_future_and_absent_data(self):
        with patch.object(up,'NOW',return_value=datetime(2026,10,13,16,tzinfo=UTC)):
            with patch.object(up,'fetch',return_value=json.dumps({'value':[
                {'cotacaoVenda':5.50,'dataHoraCotacao':'2026-10-14 15:00:00'}]})):
                with self.assertRaises(ValueError):up.official_bcb_ptax_odata()

    def test_selected_newest_reference_does_not_masquerade_as_commercial_spot(self):
        older=dict(value=4.985,source='UOL Economia',source_url='https://example.org/fri',
                   instrument='spot',session_status='closed',observed_at='2026-10-09',
                   price_type='commercial')
        newer=dict(value=5.0133,source='Banco Central do Brasil — PTAX OData',
                   source_url='https://olinda.bcb.gov.br/',observed_at='2026-10-13T15:02:00+00:00',
                   instrument='ptax_reference',session_status='reference_intraday',
                   price_type='ptax_venda',quote_status='official_bcb_ptax_intraday')
        with patch.object(up,'authorized_spot',side_effect=ValueError('not configured')),\
             patch.object(up,'verified_previous_close',return_value=older),\
             patch.object(up,'official_bcb_ptax_odata',return_value=newer),\
             patch.object(up,'official_bcb_usdbrl',return_value=older),\
             patch.object(up,'fred_latest',side_effect=ValueError('no feed')):
            got=up.make_market()['indicators']['usdbrl']
        self.assertEqual(got['value'],5.0133)
        self.assertEqual(got['instrument'],'ptax_reference')

if __name__=='__main__':unittest.main()
