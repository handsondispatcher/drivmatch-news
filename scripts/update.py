"""Build public static data. No invented prices, no secret keys in published files.

Use --offline for deterministic local tests. External offers require explicit public
publication consent and article rights; other publisher full texts are excluded.
"""
from __future__ import annotations
import csv
import html as html_module
import io
import json
import os
from pathlib import Path
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone, timedelta

ROOT = Path(__file__).resolve().parents[1]
UTC = timezone.utc
NOW = lambda: datetime.now(UTC)
STOCKS = ['JBHT', 'KNX', 'SNDR', 'WERN', 'ODFL', 'XPO', 'LSTR', 'CHRW', 'FDX']


def read_json(path):
    return json.loads(Path(path).read_text(encoding='utf-8'))


def fetch(url, method='GET', payload=None, headers=None, timeout=15):
    body = json.dumps(payload).encode('utf-8') if payload is not None else None
    req = urllib.request.Request(url, method=method, data=body, headers={
        'User-Agent':'DrivMatchNews/0.1 (editorial-data-client)',
        'Accept':'application/json, text/csv;q=0.8, */*;q=0.5', **(headers or {})})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        result = resp.read(2_000_000)
    if len(result) >= 2_000_000:
        raise ValueError('Remote data too large')
    return result.decode('utf-8-sig')


def google_translate(text, target):
    key = os.getenv('GOOGLE_TRANSLATE_API_KEY','')
    if not key or not text:return None
    # Locale style requires editorial review: Basic Translation may not guarantee
    # idiomatic Brazilian Portuguese / US English / Latin American Spanish.
    target_tag = {'pt':'pt','en':'en','es':'es'}[target]
    url='https://translation.googleapis.com/language/translate/v2?key='+urllib.parse.quote(key)
    result=json.loads(fetch(url,'POST',{'q':text,'target':target_tag,'format':'text'},
                            {'Content-Type':'application/json; charset=utf-8'}))
    return html_module.unescape(result['data']['translations'][0]['translatedText'])


def translate_missing(article, errors, offline):
    article=dict(article)
    article['locales']=dict(article.get('locales') or {})
    native=article.get('original_lang','pt')
    base=article['locales'].get(native)
    if not base:return article
    for lang in ('pt','en','es'):
        if article['locales'].get(lang) or offline or not os.getenv('GOOGLE_TRANSLATE_API_KEY'):continue
        try:
            article['locales'][lang]={key:google_translate(str(base.get(key,'')),lang) or '' for key in ('title','summary','body')}
            article['translation_review']='auto_pending_editorial_review'
        except Exception as exc:
            errors.append(f'translation:{article.get("id")}/{lang}: {type(exc).__name__}')
    return article


def public_offers(errors, offline):
    url=os.getenv('DRIVMATCH_PUBLIC_OPPORTUNITIES_URL','').strip()
    if offline or not url:return []
    if not url.startswith('https://'):raise ValueError('DRIVMATCH_PUBLIC_OPPORTUNITIES_URL must be https')
    token=os.getenv('DRIVMATCH_PUBLIC_FEED_TOKEN','')
    try:
        obj=json.loads(fetch(url,headers={'Authorization':'Bearer '+token} if token else None))
        offers=obj.get('items',[]) if isinstance(obj,dict) else obj
        approved=[]
        for a in offers:
            if not isinstance(a,dict) or a.get('status')!='approved' or not a.get('consent_publication'):continue
            if not a.get('id') or not a.get('locales') or not a.get('source_url','').startswith('https://'):continue
            if not a.get('published_at'):continue
            if a.get('expires_at') and datetime.fromisoformat(a['expires_at'].replace('Z','+00:00'))<NOW():continue
            allowed={'id','category','original_lang','status','demo','kind','published_at','source','source_url','image','locales','consent_publication','expires_at','commercial_relationship','usage_rights'}
            item={key:value for key,value in a.items() if key in allowed}
            item['kind']='opportunity';item['demo']=False;item['source']=item.get('source') or 'DrivMatch';approved.append(item)
        return approved[:100]
    except Exception as exc:
        errors.append(f'opportunities:{type(exc).__name__}')
        return []


def dated_quote(value, source, asof, change_pct=None, url=None):
    if not isinstance(value,(float,int)) or value<=0:raise ValueError('Invalid quote')
    obj={'value':round(float(value),6),'source':source,'observed_at':asof}
    if change_pct is not None:obj['change_pct']=round(float(change_pct),3)
    if url:obj['source_url']=url
    return obj


def frankfurter_usdbrl():
    d=json.loads(fetch('https://api.frankfurter.dev/v2/rate/usd/brl'))
    return dated_quote(float(d['rate']),'Frankfurter (referência diária)',d['date'],url='https://frankfurter.dev/')


def fred_latest(series, source):
    # Series are US EIA data republished via FRED; not real-time, and subject
    # to source licensing/attribution review prior to monetized launch.
    csvdata=fetch('https://fred.stlouisfed.org/graph/fredgraph.csv?id='+urllib.parse.quote(series))
    rows=list(csv.DictReader(io.StringIO(csvdata)))
    observations=[]
    for row in rows:
        try:
            val=float(row[series]);dt=row['DATE']
            if val>0:observations.append((dt,val))
        except (ValueError,KeyError,TypeError):continue
    if not observations:raise ValueError(f'No valid observations for {series}')
    current=observations[-1];previous=observations[-2] if len(observations)>1 else None
    change=((current[1]/previous[1])-1)*100 if previous else None
    return dated_quote(current[1],source,current[0],change,'https://fred.stlouisfed.org/series/'+series)


def finnhub_quotes(errors):
    key=os.getenv('FINNHUB_API_KEY','')
    if not key:return {}
    results={}
    for sym in STOCKS:
        try:
            obj=json.loads(fetch('https://finnhub.io/api/v1/quote?symbol='+sym+'&token='+urllib.parse.quote(key)))
            v=float(obj.get('c') or 0)
            timestamp=int(obj.get('t') or 0)
            # Hide stale securities quote rather than promoting historic data as current.
            if not v or timestamp<1:continue
            asof=datetime.fromtimestamp(timestamp,UTC)
            if NOW()-asof>timedelta(days=5):continue
            results[sym]=dated_quote(v,'Finnhub',asof.isoformat(),obj.get('dp'),
                                     'https://finnhub.io/')
        except Exception as exc:errors.append(f'{sym}:{type(exc).__name__}')
    return results


def make_market(offline=False):
    market={'generated_at':NOW().isoformat(timespec='seconds'),'mode':'verified-or-unavailable','indicators':{},'stocks':{},'errors':[]}
    if offline:
        market['mode']='offline-test';return market
    for key,fn in [('usdbrl',frankfurter_usdbrl),('diesel',lambda:fred_latest('GASDESW','EIA / FRED (semanal)')),
                   ('brent',lambda:fred_latest('DCOILBRENTEU','EIA / FRED (diário)'))]:
        try:market['indicators'][key]=fn()
        except Exception as exc:market['errors'].append(f'{key}:{type(exc).__name__}')
    market['stocks']=finnhub_quotes(market['errors'])
    return market


def build(offline=False):
    errors=[]
    articles=read_json(ROOT/'content/editorial.json')
    mode=os.getenv('DRIVMATCH_PUBLICATION_MODE','demo').strip().lower()
    if mode=='production':articles=[a for a in articles if not a.get('demo')]
    for article in articles:
        if article.get('status')!='approved':raise ValueError('Unapproved editorial article in publication file')
        if article.get('demo') is not True and article.get('usage_rights') not in ('owned','licensed'):
            raise ValueError('Production article lacks owned/licensed content rights')
    articles += public_offers(errors,offline)
    unique={}
    for a in articles:
        if a['id'] in unique:continue
        unique[a['id']]=translate_missing(a,errors,offline)
    market=make_market(offline)
    ads=read_json(ROOT/'content/ads.json')
    data={'schema_version':1,'publication_mode':mode,'generated_at':NOW().isoformat(timespec='seconds'),
          'articles':list(unique.values()),'market':market,'ads':ads}
    path=ROOT/'site/data';path.mkdir(parents=True,exist_ok=True)
    (path/'content.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (path/'market.json').write_text(json.dumps(market,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (path/'bootstrap.js').write_text('window.DRIVMATCH_BOOTSTRAP='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
    print(f'Published {len(unique)} stories (demo={sum(a.get("demo") is True for a in unique.values())}); '
          f'quotes={len(market["indicators"])}; stocks={len(market["stocks"])}; errors={len(errors+market["errors"])}')
    for err in errors+market['errors']:print('nonfatal:',err)
    return data

if __name__=='__main__':build(offline='--offline' in sys.argv)
