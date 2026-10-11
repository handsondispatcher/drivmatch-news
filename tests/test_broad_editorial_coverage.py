"""National US freight and equipment coverage remains eligible even without a city."""
import sys, unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from editorial_gate import eligible

class BroadEditorialCoverageTests(unittest.TestCase):
    def row(self,title,category='Fretes'):
        return {'title':title,'source':'Google News · FleetOwner','source_url':'https://news.google.com/rss/articles/verified-identifier','region':'US','origin_type':'aggregator-discovery','category':category}
    def test_national_freight(self):
        for title in ('Truckload freight rates rise as carrier capacity tightens',
                      'New reefer trailers unveiled for refrigerated freight fleets',
                      'Freight brokerage merger reshapes truckload market',
                      'Box truck fleet technology launch improves dispatch operations',
                      'Flatbed and step deck equipment market report',
                      'Cargo van manufacturer introduces new commercial fleet model'):
            with self.subTest(title=title):self.assertTrue(eligible(self.row(title)))
    def test_foreign_local_road_incident_excluded(self):
        self.assertFalse(eligible(self.row('Truck crash closes highway in Tanzania','Acidentes')))
    def test_off_topic_excluded(self):
        self.assertFalse(eligible(self.row('Celebrity concert returns next week')))
