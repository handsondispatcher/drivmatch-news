"""Road TV source governance tests; no network, no simulated feeds shipped to site."""
import datetime as dt
import sys
import unittest
from pathlib import Path
from urllib.parse import parse_qs, urlparse

BASE=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(BASE/'scripts'))
from road_tv import make_road_tv,clock_offset,evidence,video_length,source_profile,youtube_curated_channel_discover

NOW=dt.datetime(2026,10,9,20,30,tzinfo=dt.timezone.utc)
ID="A1b2C3d4E5f"
CHANNEL="UC"+"A"*22
TITLE="USA semi truck driver POV windshield on I-40 trucking"
SNIPPET={"title":TITLE,"description":"LIVE forward cab view crossing USA interstate",
         "channelId":CHANNEL,"channelTitle":"Road POV Driver","liveBroadcastContent":"live"}
STATUS={"privacyStatus":"public","embeddable":True}
LIVE={"id":ID,"snippet":SNIPPET,"status":STATUS,
      "liveStreamingDetails":{"actualStartTime":"2026-10-09T20:00:00Z"}}
REPLAY={"id":ID,"snippet":{**SNIPPET,"liveBroadcastContent":"none"},
        "status":STATUS,"liveStreamingDetails":{
          "actualStartTime":"2026-10-08T20:10:00Z",
          "actualEndTime":"2026-10-08T21:30:00Z"},
        "contentDetails":{"duration":"PT1H20M"}}


class RoadTVTests(unittest.TestCase):
 def cache(self,video_ids=None):
  return {"checked_at":NOW.isoformat(),"youtube_ids":video_ids or [ID],
          "twitch_channels":[]}

 def result(self,video):
  def api(url,**kwargs):
   if "/videos?" in url:
    return {"items":[video]}
   raise AssertionError("Unexpected request: "+url)
  return make_road_tv(now=NOW,api_key="test-key",get_json=api,cache=self.cache())

 def test_verified_public_live_with_explicit_usa_cab_cargo(self):
  doc=self.result(LIVE)
  self.assertEqual(doc["schema_version"],2)
  self.assertEqual(doc["live_status"],"verified_live")
  self.assertEqual(doc["current_live"]["video_id"],ID)
  self.assertEqual(doc["current_live"]["platform"],"youtube")
  self.assertEqual(doc["current_live"]["status"],"live")
  self.assertTrue(doc["current_live"]["live"])
  self.assertIn("publisher metadata",doc["current_live"]["verification"].replace("Stream metadata, not frame/motion analysis","publisher metadata") if False else doc["current_live"]["geo_evidence"])
  self.assertIsNone(doc["featured_recording"])

 def test_yesterday_completed_original_broadcast_matches_us_clock(self):
  doc=self.result(REPLAY)
  self.assertEqual(doc["live_status"],"verified_replay")
  self.assertIsNone(doc["current_live"])
  v=doc["featured_recording"]
  self.assertFalse(v["live"])
  self.assertEqual(v["status"],"replay")
  self.assertGreater(v["start_seconds"],0)
  self.assertIn("Actual start/end",v["replay_time_evidence"])

 def test_yesterday_upload_without_original_capture_time_rejected(self):
  missing={**REPLAY,"liveStreamingDetails":{}}
  self.assertEqual(self.result(missing)["candidates"],[])

 def test_six_days_old_replay_rejected(self):
  stale={**REPLAY,"liveStreamingDetails":{
      "actualStartTime":"2026-10-01T20:10:00Z",
      "actualEndTime":"2026-10-01T21:30:00Z"}}
  self.assertEqual(self.result(stale)["live_status"],"none_verified")

 def test_stopped_bathing_parked_is_excluded(self):
  idle={**LIVE,"snippet":{**SNIPPET,"title":TITLE+" — parked for a shower"}}
  self.assertEqual(self.result(idle)["candidates"],[])

 def test_unverified_country_camera_or_vehicle_are_excluded(self):
  for title in ("USA trip highway driver 4K","box truck dashcam Europe",
                "USA passenger car windshield road view"):
   with self.subTest(title=title):
    x={**LIVE,"snippet":{**SNIPPET,"title":title,"description":" "}}
    self.assertEqual(self.result(x)["candidates"],[])

 def test_us_highway_live_camera_requires_platform_live_and_embed(self):
  camera={**LIVE,"snippet":{"title":"Florida I-4 interstate live traffic camera Orlando",
          "description":"Official USA interstate webcam with real road traffic",
          "channelId":CHANNEL,"channelTitle":"Road Traffic","liveBroadcastContent":"live"}}
  doc=self.result(camera)
  self.assertEqual(doc["live_status"],"verified_live")
  self.assertEqual(doc["current_live"]["view_type"],"us_highway_traffic")
  self.assertEqual(doc["current_live"]["source_rank"],1)
  self.assertNotIn("truck presence verified",doc["current_live"]["camera_evidence"].lower())
  self.assertEqual(self.result({**camera,"status":{"privacyStatus":"public","embeddable":False}})["candidates"],[])

 def test_us_bound_canada_border_requires_direction(self):
  title="Peace Bridge USA Entrance Buffalo US bound live border traffic webcam trucks"
  p=source_profile(title,"Fort Erie Ontario to Buffalo USA border crossing")
  self.assertEqual(p["view_type"],"usbound_border_traffic")
  self.assertEqual(p["source_rank"],2)
  self.assertIsNone(source_profile("Peace Bridge Canada Entrance traffic webcam trucks","Ontario Canada-bound traffic"))
  self.assertIsNone(source_profile("old Peace Bridge USA Entrance replay traffic webcam",""))

 def test_trucker_live_rank_precedes_road_and_border(self):
  self.assertEqual(source_profile(TITLE)["source_rank"],0)
  self.assertEqual(source_profile("Florida I-4 interstate live traffic camera")["source_rank"],1)
  self.assertEqual(source_profile("Peace Bridge USA Entrance live traffic webcam")["source_rank"],2)

 def test_curated_creator_channel_poll_uses_low_quota_official_endpoints(self):
  calls=[]
  def api(url):
   calls.append(url)
   if '/channels?' in url:
    return {'items':[{'contentDetails':{'relatedPlaylists':{'uploads':'UUtestcreator'}}}]}
   if '/playlistItems?' in url:
    return {'items':[{'contentDetails':{'videoId':ID}}]}
   raise AssertionError(url)
  ids=youtube_curated_channel_discover('test-key',
      [{'handle':'@Ridealonggang'}],api,[])
  self.assertEqual(ids,[ID])
  self.assertEqual(len(calls),2)
  self.assertIn('forHandle=%40Ridealonggang',calls[0])
  self.assertIn('playlistItems?',calls[1])

 def test_no_key_fail_closed_instead_of_stale_static_demo(self):
  doc=make_road_tv(now=NOW,api_key="",twitch_id="",twitch_secret="")
  self.assertEqual(doc["live_status"],"unverified")
  self.assertEqual(doc["candidates"],[])
  self.assertIsNone(doc["featured_recording"])
  self.assertIn("credentials_not_configured",doc["warnings"][0])

 def test_video_unembeddable_or_private_excluded(self):
  for status in ({"privacyStatus":"public","embeddable":False},
                 {"privacyStatus":"private","embeddable":True}):
   self.assertEqual(self.result({**LIVE,"status":status})["candidates"],[])

 def test_same_day_replay_far_outside_clock_window_rejected(self):
  # Recording started 7 hours before local current time, ended 6 hours ago.
  morning={**REPLAY,"liveStreamingDetails":{
      "actualStartTime":"2026-10-09T12:00:00Z",
      "actualEndTime":"2026-10-09T13:00:00Z"}}
  self.assertEqual(self.result(morning)["candidates"],[])

 def test_discovery_rotates_categories_under_daily_search_cap(self):
  calls=[]
  def api(url,**kwargs):
   q=parse_qs(urlparse(url).query)
   if '/search?' in url:
    calls.append((q.get("eventType"),q.get("q")));return {"items":[]}
   raise AssertionError(url)
  c={"checked_at":"2026-10-08T00:00:00Z"}
  doc=make_road_tv(now=NOW,api_key="test",get_json=api,cache=c)
  self.assertEqual(len(calls),2)
  self.assertEqual(sum(x[0]==["live"] for x in calls),1)
  self.assertEqual(sum(x[0]==["completed"] for x in calls),1)
  self.assertEqual(doc["live_status"],"none_verified")

 def test_twitch_discovery_live_but_not_stationary(self):
  def api(url,**kwargs):
   if "oauth2/token" in url:return {"access_token":"testtoken"}
   if "/search/channels?" in url:
    return {"data":[{"id":"12345","broadcaster_login":"truckroad",
      "display_name":"US Truck Road","title":TITLE,"tags":["windshield"]}]}
   if "/streams?" in url:
    return {"data":[{"user_login":"truckroad","type":"live","title":TITLE,
      "started_at":"2026-10-09T19:30:00Z","tags":["trucking"]}]}
   raise AssertionError(url)
  doc=make_road_tv(now=NOW,api_key="",twitch_id="testid",
     twitch_secret="testsecret",get_json=api,cache={"checked_at":"2026-10-08T00:00:00Z"})
  self.assertEqual(doc["live_status"],"verified_live")
  self.assertEqual(doc["current_live"]["platform"],"twitch")
  self.assertEqual(doc["current_live"]["channel_login"],"truckroad")

 def test_clock_aligned_cab_replay_precedes_live_highway_camera(self):
  # User priority is not equivalent to "every LIVE outranks every replay".
  replay_id='B1b2C3d4E5f'
  camera_id='C1b2C3d4E5f'
  cab={**REPLAY,'id':replay_id}
  cam={**LIVE,'id':camera_id,'snippet':{
    'title':'Florida I-4 interstate live traffic camera Orlando',
    'description':'Official USA interstate webcam with real road traffic',
    'channelId':CHANNEL,'channelTitle':'Road Traffic',
    'liveBroadcastContent':'live'}}
  def api(url,**kwargs):
   if '/videos?' in url:return {'items':[cam,cab]}
   raise AssertionError(url)
  d=make_road_tv(now=NOW,api_key='test',get_json=api,
                 cache=self.cache([camera_id,replay_id]))
  self.assertEqual([x['video_id'] for x in d['candidates']],[replay_id,camera_id])
  self.assertEqual(d['current_live']['video_id'],camera_id)
  self.assertEqual(d['featured_recording']['video_id'],replay_id)

 def test_exact_channel_live_search_uses_resolved_youtube_id(self):
  from road_tv import youtube_curated_channel_discover
  calls=[]
  channels=[{'name':'Ride Along Gang','handle':'@Ridealonggang'},
            {'name':'Trucking Duke','handle':'@TruckingDuke'}]
  def api(url):
   q=parse_qs(urlparse(url).query)
   if '/channels?' in url:
    return {'items':[{'id':CHANNEL,'contentDetails':{
      'relatedPlaylists':{'uploads':'UUknown'}}}]}
   if '/playlistItems?' in url:return {'items':[]}
   if '/search?' in url:
    calls.append(q)
    return {'items':[{'id':{'videoId':ID}}]}
   raise AssertionError(url)
  diagnostic={'targeted_channel_checked':None,
              'targeted_channel_unresolved':None,'targeted_live_hits':0}
  ids=youtube_curated_channel_discover('test-key',channels,api,[],targeted_hour=0,
                                      diagnostics=diagnostic)
  self.assertEqual(ids,[ID])
  self.assertEqual(len(calls),1)
  self.assertEqual(calls[0]['channelId'],[CHANNEL])
  self.assertEqual(calls[0]['eventType'],['live'])
  self.assertEqual(calls[0]['videoEmbeddable'],['true'])
  self.assertEqual(diagnostic['targeted_channel_checked'],'Ride Along Gang')
  self.assertEqual(diagnostic['targeted_live_hits'],1)

 def test_priority_channels_alternate_and_no_uploads_required(self):
  from road_tv import youtube_curated_channel_discover
  calls=[]
  def api(url):
   if '/channels?' in url:
    return {'items':[{'id':CHANNEL,'contentDetails':{}}]}
   if '/search?' in url:
    q=parse_qs(urlparse(url).query)
    calls.append(q['channelId'][0])
    return {'items':[{'id':{'videoId':ID}}]}
   raise AssertionError(url)
  channels=[{'name':'Ride Along Gang','handle':'@Ridealonggang'},
            {'name':'Trucking Duke','handle':'@TruckingDuke'}]
  result=youtube_curated_channel_discover('test',channels,api,[],targeted_hour=1)
  self.assertEqual(result,[ID])
  self.assertEqual(calls,[CHANNEL])

 def test_ride_along_live_pov_with_trucker_in_description_qualifies(self):
  title='LIVE Driving POV- IRL- Denver CO to Schuyler NE | Relaxing Ride Along'
  description='One trucker answers the call on the road. This is not just a delivery.'
  self.assertEqual(source_profile(title,description)['view_type'],'cargo_cab')
  self.assertIsNone(source_profile(title,'A passenger car driving POV'))
 
 def test_clock_alignment_require_real_recording_duration(self):
  t=dt.datetime(2026,10,8,20,10,tzinfo=dt.timezone.utc)
  self.assertEqual(video_length("PT1H30M"),5400)
  self.assertIsNotNone(clock_offset(NOW,t,5400))
  self.assertIsNone(clock_offset(NOW,None,5400))
  self.assertIsNone(clock_offset(NOW,t,0))
  self.assertTrue(evidence(TITLE))
  self.assertFalse(evidence(TITLE+" parked sleeping"))

if __name__=="__main__":
 unittest.main()
