"""The first paint contains only verifiable source-linked headlines; no forged article."""
import datetime as dt
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from update import bootstrap_external_story_cards


class InitialExternalHeadlinesTests(unittest.TestCase):
    def row(self):
        return {'id':'source-test-1','title':'FMCSA updates US truck inspections',
                'source':'Trucking publication','source_url':'https://example.com/real-report',
                'published_at':(dt.datetime.now(dt.timezone.utc)-dt.timedelta(minutes=4)).isoformat(),
                'geo_scope_verified':True,'origin_type':'publisher-feed',
                'category':'Fiscalização','original_lang':'en',
                'titles':{'en':'FMCSA updates US truck inspections',
                          'pt':'FMCSA atualiza inspeções de caminhões dos EUA'}}

    def test_publish_immediate_headline_without_manufacturing_body(self):
        doc=bootstrap_external_story_cards([self.row()], [])
        self.assertEqual(len(doc),1)
        card=doc[0]
        self.assertEqual(card['kind'],'external_link')
        self.assertEqual(card['status'],'external_source')
        self.assertEqual(card['source_url'],'https://example.com/real-report')
        self.assertEqual(card['translated_langs'],['pt','en'])
        self.assertEqual(card['locales']['es']['title'],self.row()['title'])
        self.assertTrue(all(loc['body']=='' for loc in card['locales'].values()))

    def test_aggregators_unsupported_geo_and_duplicates_not_included(self):
        trusted=self.row()
        wrong=dict(trusted,id='other',geo_scope_verified=False)
        aggregate=dict(trusted,id='google',source_url='https://news.google.com/item',
                       origin_type='aggregator-discovery')
        result=bootstrap_external_story_cards([wrong,aggregate,trusted,trusted],[])
        self.assertEqual(len(result),1)
        self.assertEqual(bootstrap_external_story_cards([trusted],[{'source_url':trusted['source_url']}]),[])

    def test_unverifiable_or_future_date_is_excluded(self):
        row=self.row()
        future=dict(row,id='future',published_at=(dt.datetime.now(dt.timezone.utc)
                              +dt.timedelta(days=1)).isoformat())
        missing=dict(row,id='missing',published_at='')
        self.assertEqual(bootstrap_external_story_cards([future,missing],[]),[])

    def test_output_does_not_claim_editorial_approval(self):
        row=self.row()
        card=bootstrap_external_story_cards([row],[])[0]
        self.assertFalse(card['demo'])
        self.assertNotEqual(card['status'],'approved')
        self.assertNotIn('usage_rights',card)


if __name__=='__main__':
    unittest.main()
