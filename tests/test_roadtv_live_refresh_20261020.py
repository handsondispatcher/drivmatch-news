"""Road TV 20 Oct regression: owner-observed Ride Along Gang LIVE route to camera 1.

No external network. Source metadata and channel ID are verified by the mocked
official YouTube API, not assumed from title or screenshots alone.
"""
import datetime as dt
import sys
import unittest
from pathlib import Path
from unittest.mock import patch
from urllib.parse import urlparse,parse_qs
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from road_tv import (usa_route_evidence,source_profile,
                     youtube_curated_channel_discover,make_road_tv)
NOW=dt.datetime(2026,10,21,0,6,tzinfo=dt.timezone.utc)
RIDE='R1dEA1oNg22'
OTHER='O1b2C3d4E5f'
CH='UC'+'A'*22
TITLE='LIVE Driving POV- IRL- Dodge City KS➜ Abingdon VA | Relaxing Ride Along'

class CurrentTruckerLive(unittest.TestCase):
    def test_route_without_comma_is_valid(self):
        self.assertTrue(usa_route_evidence(TITLE,''))
        self.assertIsNone(source_profile(TITLE,''))
        self.assertTrue(usa_route_evidence('LIVE Driving POV Dodge City KS → Abingdon VA',''))

    def test_targeted_channel_rotation_uses_all_creators_and_favors_ride(self):
        channels=[{'name':x,'handle':'@'+x.replace(' ','')} for x in
                  ['Ride Along Gang','Trucking Duke','51 Logistics','Freight Relocators Live','Johnny Trucker USA']]
        def discovery(slot):
            calls=[]
            def api(url):
                q=parse_qs(urlparse(url).query)
                if '/channels?' in url:
                    return {'items':[{'id':CH,'contentDetails':{'relatedPlaylists':{'uploads':'UUpload'}}}]}
                if '/playlistItems?' in url:return {'items':[]}
                if '/search?' in url:
                    calls.append(q);return {'items':[]}
                raise AssertionError(url)
            youtube_curated_channel_discover('test',channels,api,[],targeted_hour=slot)
            self.assertEqual(len(calls),1)
            self.assertEqual(calls[0]['eventType'],['live'])
            return calls[0]['channelId'][0],calls[0]['maxResults']
        for slot in [0,2,3,5,6,8]:
            channel,maxresults=discovery(slot)
            self.assertEqual(channel,CH)
            self.assertEqual(maxresults,['15'])

    def test_actual_owner_stream_supplants_generic_live_on_channel_one(self):
        video={'id':RIDE,'snippet':{
          'title':TITLE,'description':'Driver live trucking windshield POV; subscribe for road trips.',
          'channelId':CH,'channelTitle':'Ride Along Gang','liveBroadcastContent':'live'},
          'status':{'privacyStatus':'public','embeddable':True},
          'liveStreamingDetails':{'actualStartTime':'2026-10-20T22:20:00Z'}}
        generic={'id':OTHER,'snippet':{
          'title':'Florida I-4 interstate live traffic camera Orlando',
          'description':'Official USA interstate webcam',
          'channelId':'UC'+'B'*22,'channelTitle':'Traffic Station','liveBroadcastContent':'live'},
          'status':{'privacyStatus':'public','embeddable':True},
          'liveStreamingDetails':{'actualStartTime':'2026-10-20T22:20:00Z'}}
        cache={'checked_at':NOW.isoformat(),'discovery_version':6,
               'youtube_ids':[OTHER],'curated_ids':[RIDE]}
        def api(url,**_):
            if '/channels?' in url:
                qs=parse_qs(urlparse(url).query)
                return {'items':[{'id':CH if qs.get('forHandle')==['@Ridealonggang'] else 'UC'+'B'*22,
                                  'contentDetails':{'relatedPlaylists':{'uploads':'UUtest'}}}]}
            if '/playlistItems?' in url:return {'items':[]}
            if '/videos?' in url:
                ids=parse_qs(urlparse(url).query)['id'][0].split(',')
                return {'items':[v for v in (video,generic) if v['id'] in ids]}
            if '/search?' in url:raise AssertionError('Final refresh must not search')
            raise AssertionError(url)
        with patch('road_tv.safe_cached_discovery',return_value=cache):
            doc=make_road_tv(now=NOW,api_key='test',get_json=api,final_refresh=True)
        self.assertEqual(doc['live_status'],'verified_live')
        self.assertEqual(doc['current_live']['video_id'],RIDE)
        self.assertEqual(doc['current_live']['channel_name'],'Ride Along Gang')
        self.assertEqual(doc['candidates'][0]['view_type'],'cargo_cab')
        self.assertEqual(doc['candidates'][1]['view_type'],'us_highway_traffic')
        self.assertEqual(doc['live_checked_at'],NOW.isoformat())

    def test_expired_or_non_embeddable_live_never_faked(self):
        from road_tv import verify_youtube
        base={'id':RIDE,
           'snippet':{'title':TITLE,'description':'Trucking dashcam','channelId':CH,
                      'channelTitle':'Ride Along Gang','liveBroadcastContent':'live'},
           'status':{'privacyStatus':'public','embeddable':False},
           'liveStreamingDetails':{'actualStartTime':'2026-10-20T22:00:00Z'}}
        def api(url):return {'items':[base]}
        found=verify_youtube([RIDE],'test',NOW,api,[])
        self.assertEqual(found,[])
        base['status']['embeddable']=True
        base['liveStreamingDetails']['actualEndTime']='2026-10-21T00:05:00Z'
        found=verify_youtube([RIDE],'test',NOW,api,[])
        self.assertFalse(any(v.get('live') for v in found))

    def test_workflow_refreshes_after_news_and_browser_tests(self):
        text=(ROOT/'.github/workflows/deploy.yml').read_text(encoding='utf-8')
        self.assertGreater(text.index('run: python scripts/refresh_roadtv_at_publish.py'),
                           text.index('run: npm run test:browser'))
        self.assertLess(text.index('run: python scripts/refresh_roadtv_at_publish.py'),
                        text.index('- uses: actions/upload-pages-artifact@v4'))
        js=(ROOT/'site/assets/road-tv-live.js').read_text(encoding='utf-8')
        self.assertIn('Ver transmissões do Ride Along Gang',js)
        self.assertIn('videos.filter(v=>v.live&&v.view_type',js)
        self.assertIn('if(target)start(target)',js)

if __name__=='__main__':
    unittest.main()
