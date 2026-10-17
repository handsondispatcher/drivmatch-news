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

class ExpandedDeliveryAndSpecializedLoadsTests(unittest.TestCase):
    def row(self,title):
        return {'title':title,'source':'Google News · Verified publisher','source_url':'https://news.google.com/rss/articles/external-candidate','region':'US','origin_type':'aggregator-discovery','category':'Transporte'}
    def test_new_domains(self):
        for title in ('DoorDash food delivery drivers report pay changes',
                      'Amazon Flex delivery blocks change pay rates for drivers',
                      'Amazon Relay updates freight rates for carriers',
                      'FedEx parcel delivery company expands last-mile hub',
                      'Curri courier drivers see same-day delivery network expansion',
                      'Medical courier services expand specimen transport for US hospitals',
                      'Livestock hauling rates rise for cattle trucking',
                      'Grain hauling harvest freight delivery costs rise in US',
                      'UPS delivery drivers negotiate new contracts'):
            with self.subTest(title=title):self.assertTrue(eligible(self.row(title)))
    def test_nontopical_and_foreign(self):
        for title in ('Food trucks open new dining location',
                      'Amazon Prime releases new streaming episode',
                      'DoorDash celebrity launches new fashion brand',
                      'ICE detains unrelated tourists overseas',
                      'Truck crash closes highway in Tanzania'):
            with self.subTest(title=title):self.assertFalse(eligible(self.row(title)))
