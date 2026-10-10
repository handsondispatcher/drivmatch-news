"""NWS official notices must never receive an unrelated stock truck image."""
import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from build_news_photos import choose_photos


class NewsImageSafetyTests(unittest.TestCase):
    def test_nws_does_not_receive_archival_truck_photography(self):
        media={'source_library_id':'archive-red-truck',
               'image':'assets/news-photos/archive-red-truck.jpg',
               'image_credit':'Commons contributor',
               'image_license':'CC BY-SA',
               'image_source_url':'https://commons.wikimedia.org/wiki/File:Red_truck.jpg'}
        available=[{'index':0,'meta':media,'keywords':['truck','freight']}]
        nws={'id':'nws-tornado','category':'Clima','title':'NWS: Tornado Warning — Aiken',
             'editorial_type':'operational_bulletin'}
        freight={'id':'truck-freight','title':'US trucking freight demand',
                 'category':'Fretes'}
        assigned=choose_photos([nws,freight],available)
        self.assertNotIn('nws-tornado',assigned)
        self.assertIn('truck-freight',assigned)

    def test_nws_origin_guard_even_if_editorial_type_missing(self):
        media={'source_library_id':'archive-truck',
               'image_source_url':'https://commons.wikimedia.org/wiki/File:Truck.jpg'}
        row={'id':'nws-2','title':'NWS: Blizzard Warning','category':'Clima',
             'origin_type':'official-operational-alert'}
        self.assertEqual(choose_photos([row],[{'meta':media,'index':0,'keywords':['truck']}]),{})


if __name__=='__main__':
    unittest.main()
