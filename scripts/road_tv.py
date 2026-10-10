"""DrivMatch News Road TV: curated YouTube player registry, fail-closed live discovery.
Only the official YouTube player may play the videos: no scraping/rehosting.
No YouTube API key -> verified recorded video (not marked live) plus channels.
With an authorized YouTube Data API key, use the channels' public Atom feeds
for candidate IDs and ONE batched videos.list verification request per build.
This avoids the expensive search.list operation and never infers "live" from
a video title or an arbitrary RSS snippet.
"""
from __future__ import annotations
import json
import os
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
ATOM='{http://www.w3.org/2005/Atom}'
YT='{http://www.youtube.com/xml/schemas/2015}'
VIDEO_ID=re.compile(r'^[A-Za-z0-9_-]{11}$')
CHANNEL_ID=re.compile(r'^UC[A-Za-z0-9_-]{22}$')

def _text(url):
    request=urllib.request.Request(url,headers={'User-Agent':'DrivMatchNews-RoadTV/1.0'})
    with urllib.request.urlopen(request,timeout=9) as response:
        return response.read().decode('utf-8')

def _json(url):
    request=urllib.request.Request(url,headers={'User-Agent':'DrivMatchNews-RoadTV/1.0'})
    with urllib.request.urlopen(request,timeout=9) as response:
        return json.loads(response.read().decode('utf-8'))

def make_road_tv(offline=False,api_key=None,now=None,get_text=None,get_json=None):
    now=now or datetime.now(timezone.utc)
    cfg=json.loads((ROOT/'content/road-tv-curated.json').read_text(encoding='utf-8'))
    channels=cfg['channel_sources']
    recorded=cfg['recorded_fallback']
    result={'schema_version':1,'generated_at':now.isoformat(),'live_checked_at':None,
            'live_status':'unverified','current_live':None,
            'featured_recording':recorded,'channels':channels,
            'attribution':'Third-party creators / YouTube. Press play to load YouTube; not a DrivMatch transmission.',
            'policy':'Only confirmed, embeddable public broadcasts can be labeled live. Recorded fallback is labeled.'}
    if offline:return result
    key=api_key if api_key is not None else os.getenv('YOUTUBE_DATA_API_KEY','')
    if not key:return result
    get_text=get_text or _text
    get_json=get_json or _json
    video_channels={}
    for ch in channels:
        channel_id=ch.get('channel_id')
        if not channel_id or not CHANNEL_ID.fullmatch(channel_id):continue
        try:
            feed=ET.fromstring(get_text('https://www.youtube.com/feeds/videos.xml?channel_id='+channel_id))
            for entry in feed.findall(ATOM+'entry')[:15]:
                vid=entry.findtext(YT+'videoId')
                if vid and VIDEO_ID.fullmatch(vid):video_channels[vid]=ch
        except (OSError,TimeoutError,ET.ParseError,ValueError,TypeError):
            continue
    if not video_channels:return result
    # One videos.list request per 50 candidates = 1 YouTube quota unit/call.
    ids=list(video_channels)[:50]
    url='https://www.googleapis.com/youtube/v3/videos?'+urllib.parse.urlencode({
        'part':'snippet,status,liveStreamingDetails','id':','.join(ids),'key':key})
    try:
        payload=get_json(url)
    except (OSError,TimeoutError,ValueError,TypeError,KeyError):
        return result
    if not isinstance(payload,dict) or not isinstance(payload.get('items'),list):return result
    result['live_checked_at']=now.isoformat()
    result['live_status']='none_verified'
    confirmed=[]
    for v in payload['items']:
        if not isinstance(v,dict):continue
        ch=video_channels.get(v.get('id'))
        if not ch:continue
        snippet=v.get('snippet') or {}
        status=v.get('status') or {}
        times=v.get('liveStreamingDetails') or {}
        if (snippet.get('channelId')!=ch['channel_id']
            or snippet.get('liveBroadcastContent')!='live'
            or status.get('embeddable') is not True
            or status.get('privacyStatus')!='public'
            or not times.get('actualStartTime')
            or times.get('actualEndTime')):continue
        confirmed.append({
            'video_id':v['id'],'video_url':'https://www.youtube.com/watch?v='+v['id'],
            'channel_name':ch['name'],'channel_url':ch['channel_url'],
            'title':str(snippet.get('title') or ch['name'])[:160],
            'live':True,'verified_at':now.isoformat(),
            'verification':'YouTube Data API videos.list liveBroadcastContent/liveStreamingDetails/status'
        })
    if confirmed:
        result['current_live']=confirmed[0]
        result['live_status']='verified_live'
    return result

if __name__=='__main__':
    print(json.dumps(make_road_tv(offline='--offline' in __import__('sys').argv),
                     ensure_ascii=False,indent=2))
