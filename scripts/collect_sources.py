"""Collect RSS/Atom candidates, never publish unreviewed publisher text."""
import hashlib
import json
import re
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from editorial_text import clean_title
ROOT=Path(__file__).resolve().parents[1]
def parse_feed(raw, source, now=None):
    now=now or datetime.now(timezone.utc)
    root=ET.fromstring(raw)
    items=root.findall('.//item') or root.findall('.//{http://www.w3.org/2005/Atom}entry')
    result=[]
    for node in items[:100]:
        def value(tag):
            e=node.find(tag)
            if e is None:e=node.find('{http://www.w3.org/2005/Atom}'+tag)
            return ''.join(e.itertext()).strip() if e is not None else ''
        title=value('title');url=value('link')
        if not url:
            for link in node.findall('{http://www.w3.org/2005/Atom}link'):
                if link.get('rel','alternate')=='alternate':url=link.get('href','');break
        date=value('pubDate') or value('published') or value('updated')
        try:
            try:dt=parsedate_to_datetime(date)
            except (ValueError,TypeError):dt=datetime.fromisoformat(date.replace('Z','+00:00'))
            if dt.tzinfo is None or dt>now or now-dt>timedelta(days=2):continue
        except (ValueError,TypeError):continue
        # Only first-party URLs. Aggregator redirects and date-less posts are excluded.
        hostname=urlparse(url).hostname or ''
        expected=urlparse(source['url']).hostname or ''
        if not url.startswith('https://') or hostname.removeprefix('www.')!=expected.removeprefix('www.') or not title:continue
        if source.get('access')=='discovery-rss' and hostname not in ('news.google.com',):continue
        result.append({'id':hashlib.sha256(url.encode()).hexdigest()[:20], 'title':clean_title(title,source.get('name','')),
            'source':source['name'],'source_url':url,'published_at':dt.isoformat(),
            'collected_at':now.isoformat(),'category':source['category'],'original_lang':source['original_lang'],
            'region':source.get('region','US'),'origin_type':('aggregator-discovery' if source.get('access')=='discovery-rss' else 'publisher-feed'),
            'status':'pending_review','publication_blockers':['verify-event-and-original-date','write-owned-summary','complete-three-languages','approve-editorially']})
    return result

def collect():
    sources=json.loads((ROOT/'content/sources.json').read_text())['sources']
    def check(source):
        if not source.get('feed_url'):return [],dict(id=source['id'],status='manual-review',url=source['url'])
        try:
            req=Request(source['feed_url'],headers={'User-Agent':'DrivMatchNews/1.0 (+https://drivmatch.com/news)'})
            with urlopen(req,timeout=9) as res:raw=res.read(2_000_000)
            if len(raw)>=2_000_000:raise ValueError('Oversized feed')
            rows=parse_feed(raw,source)
            return rows,dict(id=source['id'],status='ok',candidates=len(rows),url=source['feed_url'])
        except Exception as exc:return [],dict(id=source['id'],status='failed',error=type(exc).__name__,url=source['feed_url'])
    candidates={};health=[]
    with ThreadPoolExecutor(max_workers=12) as pool:
        for rows,status in pool.map(check,sources):
            health.append(status)
            for row in rows:
                if row['source_url'] not in candidates:candidates[row['source_url']]=row
    out=ROOT/'build';out.mkdir(exist_ok=True)
    (out/'news-candidates.json').write_text(json.dumps(list(candidates.values()),ensure_ascii=False,indent=2)+'\n')
    report={'checked_at':datetime.now(timezone.utc).isoformat(),'sources':health,'candidate_count':len(candidates)}
    (out/'source-health.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print('Sources:',len(sources),'candidates:',len(candidates),'feed failures:',sum(x['status']=='failed' for x in health))
    return report
if __name__=='__main__':collect()
