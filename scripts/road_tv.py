"""DrivMatch Road TV discovery engine, v34.2.

Data sources: authorized YouTube Data API and Twitch Helix, official embeds only.
Safety: metadata may declare a USA forward cab view; API data cannot prove real
vehicle movement or recording geography. Every candidate retains evidence_grade.
No keys -> NO made-up live streams, NO stale recorded-video fallback.
Search query discovery cached hourly; verification of the resulting live candidates
runs on each editorial build (10-minute cadence).
"""
from __future__ import annotations
import datetime as dt
import json
import os
import re
import urllib.parse
import urllib.request
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
UTC = dt.timezone.utc
VIDEO_ID = re.compile(r'^[A-Za-z0-9_-]{11}$')
CHANNEL_ID = re.compile(r'^UC[A-Za-z0-9_-]{22}$')
US = re.compile(r'\b(?:usa|u\.s\.a\.?|united states|american highway|us interstate|interstate\s+\d{1,3}|i[-\s]?(?:5|10|15|20|25|35|40|44|55|64|65|70|75|76|77|80|81|84|85|90|94|95))\b', re.I)
US_ROUTE = re.compile(r'\b(?:ohio\s+(?:to|[-–>])\s+texas|denver\s*,?\s*(?:co|colorado)|colorado\s+(?:to|[-–>])\s+nebraska|schuyler\s*,?\s*(?:ne|nebraska))\b',re.I)
CAB = re.compile(r'\b(?:dashcam|dash[\s-]?cam|windshield|front[\s-]?facing|forward[\s-]?view|front[\s-]?camera|cab[\s-]?view|driver[\s-]?pov|trucker[\s-]?pov|road[\s-]?view|from[\s-]?the[\s-]?cab|drivecam|driving[\s-]?pov|ride[\s-]?along|irl[\s-]?driv(?:e|ing))\b', re.I)
CARGO = re.compile(r'\b(?:semi[\s-]?truck|18[\s-]?wheeler|tractor[\s-]?trailer|truck[\s-]?driv(?:er|ing)|trucking|box[\s-]?truck|straight[\s-]?truck|cargo[\s-]?van|sprinter[\s-]?van|pickup[\s-]?truck|pick[\s-]?up[\s-]?truck|hotshot[\s-]?truck|expedit(?:e|er|ing)[\s-]?van|truckers?|truck[\s-]?cam)\b', re.I)
STOP = re.compile(r'\b(?:parked|parking break|rest stop|sleeping|shower|truck stop break|off duty|not driving|stopped|lunch break|taking a break|end of stream)\b', re.I)
QUERIES = (
    'USA semi truck driver POV windshield live interstate',
    'USA box truck cargo van dashcam front cab live',
    'USA pickup truck hotshot trucking forward road live',
    'Florida I-4 interstate live traffic camera highway',
    'Peace Bridge Buffalo USA entrance live border traffic webcam trucks',
    'Trucking Duke DriveCam POV Ohio Texas live',
    'Ride Along Gang driving POV Denver Colorado live',
)
TWITCH_QUERIES = ('trucking', 'truckdriver', 'dashcam')
CACHE_PATH = ROOT / 'build' / 'roadtv-discovery.json'
PACIFIC = ZoneInfo('America/Los_Angeles')
REPLAY_CLOCK_WINDOW_MINUTES = 120
MAX_CANDIDATES = 70


def request_json(url, *, method='GET', headers=None, body=None, timeout=9):
    req = urllib.request.Request(url, data=body, method=method,
                                 headers={'User-Agent': 'DrivMatchNews-RoadTV/1.2',
                                          **(headers or {})})
    with urllib.request.urlopen(req, timeout=timeout) as response:
        return json.loads(response.read().decode('utf-8'))


def when(value):
    try:
        return dt.datetime.fromisoformat(str(value).replace('Z', '+00:00')).astimezone(UTC)
    except (TypeError, ValueError, AttributeError):
        return None


def evidence(title, desc=''):
    """Explicit USA + forward-facing cargo vehicle descriptions required."""
    text = f'{title or ""} {desc or ""}'[:1400]
    return bool((US.search(text) or US_ROUTE.search(text)) and CAB.search(text) and CARGO.search(text) and not STOP.search(text))



# Additional approved *discovery categories*; YouTube metadata alone is not motion proof.
# These never bypass YouTube's public/embeddable/active livestream checks.
ROAD_US = re.compile(r'\b(?:florida|i[- ]?4|i[- ]?80|interstate\s+\d{1,3}|us\s+highway|united\s+states|nevada|usa)\b',re.I)
ROAD_CAM = re.compile(r'\b(?:traffic\s+cam(?:era)?s?|highway\s+cam(?:era)?s?|road\s+cam(?:era)?s?|webcam|live\s*stream|livestream)\b',re.I)
USBOUND_BORDER = re.compile(r'\b(?:usa\s+entrance|u\.?s\.?\s+inspection|u\.?s\.?\s*[- ]?bound|canada\s*(?:to|[-→>])\s*(?:usa|us)|entering\s+(?:the\s+)?(?:usa|united\s+states))\b',re.I)
BORDER = re.compile(r'\b(?:canada|ontario|fort\s+erie|peace\s+bridge|buffalo)\b',re.I)
MOTION_DECEPTION = re.compile(r'\b(?:recorded|archived|loop(?:ing)?|pre[- ]?recorded|highlights|replay|compilation)\b',re.I)


def source_profile(title, desc=''):
    """Rank publisher metadata; actual LIVE and embeddability are checked separately."""
    raw=f'{title or ""} {desc or ""}'[:1400]
    if STOP.search(raw):
        return None
    if evidence(title,desc):
        return {'source_rank':0,'view_type':'cargo_cab',
                'geo_evidence':'US stated in publisher metadata',
                'camera_evidence':'Forward cab view stated in publisher metadata'}
    if ROAD_CAM.search(raw) and not MOTION_DECEPTION.search(raw):
        if USBOUND_BORDER.search(raw) and BORDER.search(raw):
            return {'source_rank':2,'view_type':'usbound_border_traffic',
                    'geo_evidence':'US-bound Canada border crossing stated in publisher metadata',
                    'camera_evidence':'Public traffic camera asserted by publisher; active video not independently observed'}
        if ROAD_US.search(raw):
            return {'source_rank':1,'view_type':'us_highway_traffic',
                    'geo_evidence':'US road location stated in publisher metadata',
                    'camera_evidence':'Highway traffic camera asserted by publisher; truck presence not verified'}
    return None

def clock_offset(now, start, length_seconds):
    """For archived *complete original livestreams* with actual start time.
    Align the current Pacific time of day to the recorded broadcast time.
    Never infer filming time from upload/publish timestamps.
    """
    if length_seconds <= 0 or not start:
        return None
    here = now.astimezone(PACIFIC)
    then = start.astimezone(PACIFIC)
    # The same wall-clock hour, up to +/- two hours (account for midnight).
    current_minutes = here.hour * 60 + here.minute
    recorded_minutes = then.hour * 60 + then.minute
    forward = (current_minutes - recorded_minutes) % 1440
    near = min(forward, 1440 - forward)
    if near > REPLAY_CLOCK_WINDOW_MINUTES:
        return None
    seek = forward * 60 + here.second
    # If current time precedes recording start by ≤2h, start near the beginning
    # but explicitly label recorded, not synchronized real-time.
    if forward > REPLAY_CLOCK_WINDOW_MINUTES:
        seek = 0
    if seek >= length_seconds:
        return None
    return min(seek, length_seconds - 5) if length_seconds >= 6 else 0


def video_length(duration):
    if not isinstance(duration, str):
        return 0
    m = re.fullmatch(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', duration)
    if not m:
        return 0
    return int(m[1] or 0)*3600 + int(m[2] or 0)*60 + int(m[3] or 0)


def safe_cached_discovery(now):
    try:
        data = json.loads(CACHE_PATH.read_text(encoding='utf-8'))
        ts = when(data.get('checked_at'))
        if ts and 0 <= (now-ts).total_seconds() < 3700:
            return data
    except (OSError, ValueError, TypeError):
        pass
    return None


def store_cached_discovery(data):
    CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    CACHE_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n',
                          encoding='utf-8')


def youtube_discover(key, now, api, errors):
    candidates = {}
    # These searches discover beyond any initial 4 creators. Search "regionCode"
    # is ONLY relevance, never treated as verification of stream geography.
    # The discovery cache is hourly; two cycling LIVE searches plus one
    # completed-broadcast search = 72 YouTube search calls/day maximum.
    selected_live=(QUERIES[now.hour % len(QUERIES)],
                   QUERIES[(now.hour+1) % len(QUERIES)])
    for query in selected_live:
        try:
            params = dict(part='snippet', type='video', eventType='live',
                          videoEmbeddable='true', regionCode='US',
                          maxResults='15', q=query, key=key)
            response = api('https://www.googleapis.com/youtube/v3/search?'+urllib.parse.urlencode(params))
            for item in response.get('items', []):
                ident = (item.get('id') or {}).get('videoId')
                if VIDEO_ID.fullmatch(ident or ''):
                    candidates[ident] = item.get('snippet') or {}
        except (OSError, TimeoutError, ValueError, KeyError, TypeError):
            errors.append('youtube_discovery_unavailable')
    # Fresh archived live-replays are not limited to the initial creators.
    for query in (QUERIES[(now.hour+2) % len(QUERIES)],):
        try:
            params = dict(part='snippet',type='video',eventType='completed',
                          videoEmbeddable='true',order='date',
                          publishedAfter=(now-dt.timedelta(days=2)).isoformat().replace('+00:00','Z'),
                          regionCode='US',maxResults='10',q=query,key=key)
            response=api('https://www.googleapis.com/youtube/v3/search?'+urllib.parse.urlencode(params))
            for item in response.get('items', []):
                ident=(item.get('id') or {}).get('videoId')
                if VIDEO_ID.fullmatch(ident or ''):
                    candidates[ident]=item.get('snippet') or {}
        except (OSError, TimeoutError, ValueError, KeyError, TypeError):
            errors.append('youtube_replay_search_unavailable')
    return candidates


def verify_youtube(ids, key, now, api, errors):
    found=[]
    for offset in range(0,min(len(ids),MAX_CANDIDATES),50):
        try:
            params=dict(part='snippet,status,liveStreamingDetails,contentDetails',
                        id=','.join(ids[offset:offset+50]),key=key)
            result=api('https://www.googleapis.com/youtube/v3/videos?'+urllib.parse.urlencode(params))
        except (OSError, TimeoutError, ValueError, KeyError, TypeError):
            errors.append('youtube_video_validation_failed')
            continue
        for vid in result.get('items',[]):
            info=vid.get('snippet') or {}
            status=vid.get('status') or {}
            live=vid.get('liveStreamingDetails') or {}
            ident=vid.get('id','')
            if not VIDEO_ID.fullmatch(ident):continue
            if status.get('privacyStatus')!='public' or status.get('embeddable') is not True:continue
            title=str(info.get('title') or '')
            desc=str(info.get('description') or '')[:850]
            profile=source_profile(title,desc)
            if not profile:continue
            channel=str(info.get('channelTitle') or 'Criador independente')
            base={'platform':'youtube','video_id':ident,
                  'video_url':'https://www.youtube.com/watch?v='+ident,
                  'channel_name':channel,
                  'channel_url':'https://www.youtube.com/channel/'+str(info.get('channelId') or ''),
                  'title':title[:160], **profile,
                  'verification':'YouTube platform status and publisher metadata; no independent frame/motion or content rights certification',
                  'checked_at':now.isoformat()}
            if (info.get('liveBroadcastContent')=='live'
                and when(live.get('actualStartTime')) and not live.get('actualEndTime')):
                found.append({**base,'live':True,'status':'live','start_seconds':0})
                continue
            ended=when(live.get('actualEndTime'))
            started=when(live.get('actualStartTime'))
            if not ended or not started or ended>now or started>now:continue
            # Only today/yesterday, in US Pacific time, completed actual live.
            if ended.astimezone(PACIFIC).date() not in (
                now.astimezone(PACIFIC).date(),
                (now-dt.timedelta(days=1)).astimezone(PACIFIC).date()):
                continue
            seconds=video_length((vid.get('contentDetails') or {}).get('duration'))
            start_at=clock_offset(now,started,seconds)
            if start_at is None:continue
            found.append({**base,'live':False,'status':'replay','started_at':started.isoformat(),
                          'ended_at':ended.isoformat(),'start_seconds':start_at,
                          'replay_time_evidence':'Actual start/end and duration from YouTube live metadata'})
    return found


def twitch_discover(client_id, access_token, now, api, errors):
    headers={'Client-Id':client_id,'Authorization':'Bearer '+access_token}
    found=[]
    for query in TWITCH_QUERIES:
        try:
            data=api('https://api.twitch.tv/helix/search/channels?'+
                     urllib.parse.urlencode({'query':query,'live_only':'true','first':25}),
                     headers=headers)
            for c in data.get('data',[]):
                login=str(c.get('broadcaster_login') or '').lower()
                title=str(c.get('title') or '')
                if re.fullmatch(r'[a-z0-9_]{3,25}',login) and evidence(title,' '.join(c.get('tags') or [])):
                    found.append({'user_id':str(c.get('id') or ''),'login':login,'title':title,
                                  'name':str(c.get('display_name') or login)})
        except (OSError, TimeoutError, ValueError, KeyError, TypeError):
            errors.append('twitch_discovery_unavailable')
    return found


def twitch_token(client_id, secret, api):
    data=api('https://id.twitch.tv/oauth2/token',method='POST',
             body=urllib.parse.urlencode({'client_id':client_id,
                  'client_secret':secret,'grant_type':'client_credentials'}).encode('utf-8'))
    return str(data.get('access_token') or '')


def twitch_verify(candidates, client_id, token, now, api, errors):
    if not candidates:return []
    headers={'Client-Id':client_id,'Authorization':'Bearer '+token}
    users={c['login']:c for c in candidates}
    found=[]
    for group_at in range(0,len(users),90):
        try:
            params=urllib.parse.urlencode([('user_login',x) for x in list(users)[group_at:group_at+90]])
            data=api('https://api.twitch.tv/helix/streams?'+params,headers=headers)
            for live in data.get('data',[]):
                login=str(live.get('user_login') or '').lower()
                c=users.get(login)
                if not c or live.get('type')!='live' or not when(live.get('started_at')):continue
                title=str(live.get('title') or '')
                if not evidence(title,' '.join(live.get('tags') or [])):continue
                found.append({'platform':'twitch','channel_login':login,
                    'video_url':'https://www.twitch.tv/'+login,
                    'channel_url':'https://www.twitch.tv/'+login,'channel_name':c['name'],
                    'title':title[:160],'live':True,'status':'live',
                    'geo_evidence':'US stated in publisher metadata',
                    'camera_evidence':'Forward cab view stated in publisher metadata',
                    'verification':'Twitch Helix active stream + publisher metadata, not video frames',
                    'checked_at':now.isoformat(),'start_seconds':0})
        except (OSError, TimeoutError, ValueError, KeyError, TypeError):
            errors.append('twitch_live_validation_failed')
    return found


def make_road_tv(offline=False,api_key=None,now=None,get_json=None,
                 twitch_id=None,twitch_secret=None,cache=None):
    now=now or dt.datetime.now(UTC)
    now=now.astimezone(UTC)
    cfg=json.loads((ROOT/'content/road-tv-curated.json').read_text(encoding='utf-8'))
    result={'schema_version':2,'generated_at':now.isoformat(),
      'live_checked_at':None,'live_status':'unverified','current_live':None,
      'candidates':[],'featured_recording':None,'channels':cfg['channel_sources'],
      'autoselect_policy':'live_first_today_or_yesterday_replay_with_clock_alignment',
      'idle_policy':'metadata stop indicators + status refresh and alternate-switch timeout; pixel-level stopped-motion detection unavailable',
      'attribution':'Third-party YouTube/Twitch official players; no DrivMatch retransmission.',
      'warnings':[]}
    if offline:return result
    key=api_key if api_key is not None else os.getenv('YOUTUBE_DATA_API_KEY','')
    tid=twitch_id if twitch_id is not None else os.getenv('TWITCH_CLIENT_ID','')
    secret=twitch_secret if twitch_secret is not None else os.getenv('TWITCH_CLIENT_SECRET','')
    if not key and not (tid and secret):
        result['warnings'].append('youtube_and_twitch_api_credentials_not_configured')
        return result
    api=get_json or request_json
    cached=cache if cache is not None else safe_cached_discovery(now)
    fresh_cache=cached and when(cached.get('checked_at')) and (now-when(cached['checked_at'])).total_seconds()<3700
    discovery={'checked_at':now.isoformat()}
    approved=[]
    if key:
        if fresh_cache and isinstance(cached.get('youtube_ids'),list):
            ids=[i for i in cached['youtube_ids'] if VIDEO_ID.fullmatch(str(i))]
        else:
            found=youtube_discover(key,now,lambda u:api(u),result['warnings'])
            ids=list(found)[:MAX_CANDIDATES]
        discovery['youtube_ids']=ids
        approved+=verify_youtube(ids,key,now,lambda u:api(u),result['warnings'])
    if tid and secret:
        try:
            token=twitch_token(tid,secret,api)
            if fresh_cache and isinstance(cached.get('twitch_channels'),list):
                twitch_candidates=cached['twitch_channels']
            else:
                twitch_candidates=twitch_discover(tid,token,now,api,result['warnings'])
            discovery['twitch_channels']=twitch_candidates
            approved+=twitch_verify(twitch_candidates,tid,token,now,api,result['warnings'])
        except (OSError,TimeoutError,ValueError,KeyError,TypeError):
            result['warnings'].append('twitch_authentication_failed')
    if not fresh_cache and cache is None:
        store_cached_discovery(discovery)
    result['live_checked_at']=now.isoformat()
    # Live first, sorting recent starts; only one player's video is ever loaded.
    lives=[x for x in approved if x.get('live')]
    replays=[x for x in approved if not x.get('live')]
    lives.sort(key=lambda v:(v.get('source_rank',99),v.get('channel_name','')))
    replays.sort(key=lambda v:(v.get('source_rank',99),v.get('ended_at','')))
    result['candidates']=(lives+replays)[:12]
    result['current_live']=lives[0] if lives else None
    result['featured_recording']=replays[0] if replays else None
    result['live_status']='verified_live' if lives else ('verified_replay' if replays else 'none_verified')
    return result


if __name__=='__main__':
    import sys
    print(json.dumps(make_road_tv(offline='--offline' in sys.argv),ensure_ascii=False,indent=2))
