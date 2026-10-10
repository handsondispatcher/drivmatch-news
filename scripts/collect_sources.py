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
from urllib.error import HTTPError, URLError
from time import sleep
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

TRANSIENT_HTTP = frozenset({408, 425, 429, 500, 502, 503, 504})
MAX_RSS_BYTES = 2_000_000

def fetch_rss_with_retry(feed_url, *, attempts=2):
    """Bounded retries for transient feed transport failures, never 403/404 or malformed XML.
    The feed's original date and strict publisher-host checks remain authoritative.
    """
    req = Request(feed_url, headers={
        'User-Agent': 'DrivMatchNews/1.1 (+https://drivmatch.com/news)',
        'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9'
    })
    for attempt in range(attempts):
        try:
            with urlopen(req, timeout=9) as res:
                raw = res.read(MAX_RSS_BYTES)
            if len(raw) >= MAX_RSS_BYTES:
                raise ValueError('Oversized feed')
            return raw,attempt+1
        except HTTPError as exc:
            if exc.code not in TRANSIENT_HTTP or attempt == attempts-1:
                raise
        except (URLError, TimeoutError, ConnectionResetError):
            if attempt == attempts-1:
                raise
        sleep(0.7 * (attempt+1))
    raise RuntimeError('RSS retry exhausted')

def safe_feed_error(exc):
    """Log an error class/code only, never expose stack traces to public readers."""
    if isinstance(exc, HTTPError):
        return 'HTTP_'+str(exc.code)
    if isinstance(exc, URLError):
        return 'URLError'
    return type(exc).__name__

def merge_verified_candidate_history(current, sources, now=None, *, path=None):
    """Retain only previously fetched original publisher headline metadata for 48 hours.

    A failed feed run must not erase still-valid history. Never relabel a past story
    with the build timestamp, and never import Google/discovery or untrusted domains.
    """
    now=now or datetime.now(timezone.utc)
    path=path or ROOT/'build/news-candidates-cache.json'
    trusted={(urlparse(x['url']).hostname or '').removeprefix('www.'):x
             for x in sources if x.get('access')=='rss' and x.get('url','').startswith('https://')}
    added=0
    if not path.exists():return 0
    try:
        previous=json.loads(path.read_text(encoding='utf-8'))
        if not isinstance(previous,list):return 0
    except (OSError,ValueError,UnicodeDecodeError):return 0
    for row in previous[:1500]:
        if not isinstance(row,dict) or row.get('origin_type')!='publisher-feed' or row.get('status')!='pending_review':
            continue
        url=row.get('source_url','')
        p=urlparse(str(url))
        host=(p.hostname or '').removeprefix('www.')
        source=trusted.get(host)
        if p.scheme!='https' or not source or row.get('source')!=source.get('name'):
            continue
        if not isinstance(row.get('title'),str) or not row['title'].strip() or len(row['title'])>600:
            continue
        try:
            dt=datetime.fromisoformat(row['published_at'].replace('Z','+00:00'))
            age=now-dt
            if dt.tzinfo is None or age<timedelta(minutes=-5) or age>timedelta(hours=48):continue
        except (ValueError,TypeError,KeyError,AttributeError):continue
        if url not in current:
            current[url]=row
            added+=1
    return added

def collect():
    sources=json.loads((ROOT/'content/sources.json').read_text())['sources']
    def check(source):
        if not source.get('feed_url'):return [],dict(id=source['id'],status='manual-review',url=source['url'])
        try:
            raw,attempts_used=fetch_rss_with_retry(source['feed_url'])
            rows=parse_feed(raw,source)
            return rows,dict(id=source['id'],status='ok',candidates=len(rows),attempts=attempts_used,url=source['feed_url'])
        except Exception as exc:
            return [],dict(id=source['id'],status='failed',error=safe_feed_error(exc),url=source['feed_url'])
    candidates={};health=[]
    with ThreadPoolExecutor(max_workers=8) as pool:
        for rows,status in pool.map(check,sources):
            health.append(status)
            for row in rows:
                if row['source_url'] not in candidates:candidates[row['source_url']]=row
    out=ROOT/'build';out.mkdir(exist_ok=True)
    retained=merge_verified_candidate_history(candidates,sources)
    (out/'news-candidates.json').write_text(json.dumps(list(candidates.values()),ensure_ascii=False,indent=2)+'\n')
    (out/'news-candidates-cache.json').write_text(
        json.dumps([x for x in candidates.values() if x.get('origin_type')=='publisher-feed'],
                   ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    report={'checked_at':datetime.now(timezone.utc).isoformat(),'sources':health,'candidate_count':len(candidates)}
    (out/'source-health.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print('Sources:',len(sources),'candidates:',len(candidates),'feed failures:',sum(x['status']=='failed' for x in health))
    failing=[x for x in health if x['status']=='failed']
    if failing:
        print('SOURCE_FAILURE_DIAGNOSTICS:',', '.join(f"{x['id']}:{x['error']}" for x in failing))
    print('EDITORIAL_SOURCE_HISTORY:', 'retained_48h_original_publications:',retained,
          'fresh_fetched_candidates:',max(0,len(candidates)-retained))
    print('RSS_RETRY_METRICS:', 'recovered_on_retry:',
          sum(x['status']=='ok' and x.get('attempts',1)>1 for x in health),
          'working:',sum(x['status']=='ok' for x in health),
          'manual:',sum(x['status']=='manual-review' for x in health))
    return report
if __name__=='__main__':collect()
