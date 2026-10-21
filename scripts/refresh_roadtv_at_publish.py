"""Reverify live Road TV candidates near GitHub Pages artifact packaging.

The original newsroom build can take minutes. Rechecks use low-cost YouTube
channels/playlistItems and videos.list, plus an existing hourly discovery cache.
Do not re-run expensive YouTube search.list or fabricate a LIVE if offline.
"""
from __future__ import annotations
import json
import os
from pathlib import Path
from road_tv import make_road_tv, ROOT

def main():
    dest=ROOT/'site/data/road-tv.json'
    # Repo/Pages may be offline; fail closed instead of republishing old LIVE.
    result=make_road_tv(final_refresh=True)
    if result.get('schema_version')!=2:
        raise RuntimeError('Invalid Road TV schema')
    dest.parent.mkdir(parents=True,exist_ok=True)
    tmp=dest.with_name(dest.name+'.tmp')
    tmp.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    tmp.replace(dest)
    current=result.get('current_live') or {}
    print('ROADTV_FINAL_STATUS:',result.get('live_status'))
    print('ROADTV_FINAL_CHECKED_AT:',result.get('live_checked_at'))
    print('ROADTV_FINAL_LIVE_COUNT:',sum(bool(v.get('live')) for v in result.get('candidates',[])))
    print('ROADTV_FINAL_CAMERA_1_CHANNEL:',current.get('channel_name') or 'none')
    # If YouTube is unavailable, user-facing page can link to original channel;
    # never expose credentials, suggest the channel is live, or reuse past status.
    return 0

if __name__=='__main__':
    raise SystemExit(main())
