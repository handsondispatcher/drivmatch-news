"""Conservative headline cleanup and event-level deduplication."""
from difflib import SequenceMatcher
from html import unescape
import re
import unicodedata

_SOURCE_SUFFIX=re.compile(r'\s*(?:[-–—|])\s*(?:thetrucker(?:\.com)?|the trucker|freightwaves|transport topics|truck news|trucknews(?:\.com)?|land line|overdrive(?:online)?|fleetowner|cdllife|wday-tv|wdam-tv|[\w-]+\.(?:com|net|org|co\.uk))\s*$',re.I)

def clean_title(title,source=''):
    value=re.sub(r'\s+',' ',unescape(re.sub(r'<[^>]+>','',str(title or '')))).strip()
    for _ in range(2):
        new=_SOURCE_SUFFIX.sub('',value).strip()
        if new==value:break
        value=new
    name=re.sub(r'\s+',' ',str(source or '')).strip()
    if name and value.casefold().endswith(' - '+name.casefold()):
        value=value[:-(len(name)+3)].rstrip()
    return value

def fingerprint(title):
    value=unicodedata.normalize('NFKD',clean_title(title))
    value=''.join(c for c in value if not unicodedata.combining(c))
    return re.sub(r'\s+',' ',re.sub(r'[^a-z0-9]+',' ',value.casefold())).strip()

def same_event(first,second):
    a,b=fingerprint(first),fingerprint(second)
    if not a or not b:return False
    if a==b:return True
    wa,wb=set(a.split()),set(b.split())
    if min(len(wa),len(wb))<6:return False
    na,nb={x for x in wa if x.isdigit()},{x for x in wb if x.isdigit()}
    if na and nb and na!=nb:return False
    overlap=len(wa&wb)/max(1,len(wa|wb))
    return overlap>=.82 or (overlap>=.70 and SequenceMatcher(None,a,b).ratio()>=.88)

def deduplicate_external(headlines,approved=()):
    kept,known,urls=[],[],set()
    for story in approved:
        if story.get('source_url'):urls.add(story['source_url'])
        known.append([x.get('title','') for x in (story.get('locales') or {}).values()])
    for story in headlines:
        url=story.get('source_url')
        if not url or url in urls:continue
        variants=[clean_title(story.get('title',''),story.get('source',''))]
        variants.extend(clean_title(t,story.get('source','')) for t in (story.get('titles') or {}).values())
        if any(same_event(a,b) for group in known for a in variants for b in group):continue
        item=dict(story);item['title']=variants[0]
        item['titles']={k:clean_title(v,item.get('source','')) for k,v in (story.get('titles') or {}).items()}
        kept.append(item);known.append(variants);urls.add(url)
    return kept
