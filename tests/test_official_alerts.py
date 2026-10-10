"""Real-time public NWS bulletins are not silently rewritten as DrivMatch news."""
import sys
import unittest
from datetime import datetime,timezone,timedelta
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from official_alerts import parse_alerts, collect_nws_alerts

NOW=datetime(2026,10,10,21,0,tzinfo=timezone.utc)
API_URL='https://api.weather.gov/alerts/urn:oid:2.49.0.1.840.0.officialtest'


def make_alert(event='Flash Flood Warning',age_minutes=15,expires_minutes=120,
               severity='Severe',url=API_URL):
    return {'id':url,'properties':{
        'event':event,'status':'Actual','messageType':'Alert','severity':severity,
        'sent':(NOW-timedelta(minutes=age_minutes)).isoformat(),
        'expires':(NOW+timedelta(minutes=expires_minutes)).isoformat(),
        'areaDesc':'Okaloosa County; Walton County; Florida',
    }}


class NwsBulletinTests(unittest.TestCase):
    def test_active_official_bulletin_can_publish_without_made_up_road_claim(self):
        row=parse_alerts({'features':[make_alert()]},now=NOW)[0]
        self.assertEqual(row['published_at'],(NOW-timedelta(minutes=15)).isoformat())
        self.assertEqual(row['source_url'],API_URL)
        self.assertTrue(row['geo_scope_verified'])
        self.assertEqual(row['editorial_type'],'operational_bulletin')
        self.assertIn('Flash Flood Warning',row['titles']['en'])
        self.assertIn('inundação repentina',row['titles']['pt'])
        self.assertFalse('closure' in row['title'].lower())
        self.assertNotIn('body',row)
        self.assertNotEqual(row['origin_type'],'publisher-feed')

    def test_reject_expired_old_undated_minor_and_non_official(self):
        fixtures=[
            make_alert(expires_minutes=-1),
            make_alert(age_minutes=60*34),
            make_alert(severity='Minor'),
            make_alert(event='Beach Hazards Statement'),
            make_alert(url='https://evil.example/alerts/a'),
        ]
        self.assertEqual(parse_alerts({'features':fixtures},now=NOW),[])

    def test_dedup_uses_event_and_region_and_preserves_original_issued_time(self):
        a=make_alert()
        b=make_alert(age_minutes=8,url='https://api.weather.gov/alerts/test2')
        c=make_alert(event='Hurricane Warning',age_minutes=4,
                     url='https://api.weather.gov/alerts/test3')
        result=parse_alerts({'features':[a,b,c]},now=NOW)
        self.assertEqual(len(result),2)
        self.assertEqual(result[0]['published_at'],(NOW-timedelta(minutes=4)).isoformat())

    def test_fail_closed_invalid_geojson(self):
        with self.assertRaises(ValueError):
            parse_alerts({'data':[]},now=NOW)

    def test_us_trucking_source_may_publish_relevant_undated_location_headlines(self):
        import json
        from editorial_gate import eligible
        roots=json.loads((Path(__file__).resolve().parents[1]/'content/sources.json').read_text())
        source=next(x for x in roots['sources'] if x['id']=='truckdrivernews-primary')
        self.assertEqual(source['feed_url'],'https://truckdrivernews.com/feed/')
        valid={'title':'Truck Driver Pay Rises in New ATA Compensation Study',
               'region':'US','category':'Caminhoneiros',
               'source_url':'https://truckdrivernews.com/truck-driver-pay-rises-in-new-ata-compensation-study/'}
        self.assertTrue(eligible(valid))
        self.assertFalse(eligible({**valid,'title':'Celebrity sports betting news'}))

    def test_fallback_uses_only_documented_state_alerts_on_national_failure(self):
        from unittest.mock import patch
        from official_alerts import fetch_nws_json,API_URL
        calls=[]
        def fake(url):
            calls.append(url)
            if url==API_URL:raise OSError('nationwide temporarily unavailable')
            if url.endswith('?area=FL'):return {'features':[make_alert()]}
            return {'features':[]}
        with patch('official_alerts._request_nws',side_effect=fake):
            doc=fetch_nws_json()
        self.assertEqual(doc['coverage'],'partial_nws_state_fallback')
        self.assertEqual(len(doc['features']),1)
        self.assertIn(API_URL+'?area=FL',calls)

    def test_fetch_injection_is_not_network_required(self):
        self.assertEqual(len(collect_nws_alerts(NOW,lambda:{'features':[make_alert()]})),1)


if __name__=='__main__':
    unittest.main()
