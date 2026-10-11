"""Regression: exact Orlando trucking fraud headline must be localized in Portuguese."""
import sys,unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from update import localize_source_headlines
class TranslationTests(unittest.TestCase):
 def test_orlando_usps_fraud_is_not_english_when_portuguese_selected(self):
  item={'id':'source-orlando','title':'Orlando trucking owner pleads guilty in $1M USPS freight auction fraud',
   'source_url':'https://www.freightwaves.com/news/orlando-trucking-owner-pleads-guilty-in-1m-usps-freight-auction-fraud',
   'original_lang':'en','region':'US'}
  with patch('update.translate_source_headline',side_effect=OSError('translation backend unavailable')):
   result=localize_source_headlines([item],[],False)
  self.assertEqual(len(result),1)
  self.assertIn('Dono de transportadora de Orlando',result[0]['titles']['pt'])
  self.assertIn('US$ 1 milhão',result[0]['titles']['pt'])
  self.assertEqual(result[0]['titles']['en'],item['title'])
if __name__=='__main__':unittest.main()
