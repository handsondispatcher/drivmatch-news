"""Build public static data. No invented prices, no secret keys in published files.

Use --offline for deterministic local tests. External offers require explicit public
publication consent and article rights; other publisher full texts are excluded.
"""
from __future__ import annotations
import csv
import hashlib
import re
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


def translate_source_headline(title, source_lang, target_lang):
    """Best-effort no-key headline translation. Unofficial public endpoint can fail.
    Failure is explicit: the browser must identify the original language."""
    if target_lang==source_lang:return title
    params=urllib.parse.urlencode({'client':'gtx','sl':source_lang,'tl':target_lang,'dt':'t','q':title})
    raw=fetch('https://translate.googleapis.com/translate_a/single?'+params,timeout=5)
    result=json.loads(raw)
    translated=''.join(part[0] for part in result[0] if isinstance(part,list) and part and isinstance(part[0],str)).strip()
    if not translated or len(translated)>1000:raise ValueError('Empty or invalid headline translation')
    return translated


def verified_external_source_links(offline=False):
    """Short-lived original-source link supplements when an RSS publisher misses a story.

    Never a DrivMatch-authored article; no undated or fabricated update.
    """
    if offline:return []
    from urllib.parse import urlparse
    data=read_json(ROOT/'content/verified-external-links.json')
    if data.get('schema_version')!=1:raise ValueError('Invalid curated source link schema')
    result=[]
    seen=set()
    for item in data.get('verified_external_links',[]):
        if item.get('status')!='verified_external_link' or item.get('link_only') is not True or item.get('editorial_body_written') is not False:
            continue
        url=item.get('source_url','')
        parsed=urlparse(url)
        if parsed.scheme!='https' or parsed.hostname not in {'www.ttnews.com'}:
            continue
        if url in seen:continue
        seen.add(url)
        try:dt=datetime.fromisoformat(item['published_at'].replace('Z','+00:00'))
        except (ValueError,TypeError,KeyError):continue
        age=NOW()-dt
        if dt.tzinfo is None or age<timedelta(minutes=-5) or age>timedelta(hours=48):
            continue
        titles=item.get('titles') or {}
        if not all(isinstance(titles.get(lang),str) and titles[lang].strip() for lang in ('pt','en','es')):
            continue
        if item.get('region')!='US' or not item.get('geo_scope_verified') or not item.get('verification_note'):
            continue
        result.append({'id':'verified-link-'+hashlib.sha256(url.encode()).hexdigest()[:20],
                       'title':item['title'],'titles':titles,'source':item['source'],
                       'source_url':url,'published_at':dt.isoformat(),'category':item['category'],
                       'region':'US','origin_type':'publisher-curated','original_lang':'en',
                       'geo_scope_verified':True,'curated_verified_headline':True})
    return result


def localize_source_headlines(headlines, errors, offline):
    """Only the source headline is translated; never fabricate a translated article."""
    if offline:return headlines
    from concurrent.futures import ThreadPoolExecutor, as_completed
    def process(item):
        item=dict(item)
        # Curated external first-party link has independently checked human-readable
        # headline translations; don't overwrite them or fabricate a full article.
        if item.get('curated_verified_headline') is True and all((item.get('titles') or {}).get(l) for l in ('pt','en','es')):
            return item
        source_lang=item.get('original_lang') or ('es' if item.get('region')=='MX' else 'en')
        if source_lang not in ('pt','en','es'):source_lang='en'
        titles={source_lang:item['title']}
        for target in ('pt','en','es'):
            if target==source_lang:continue
            try:titles[target]=translate_source_headline(item['title'],source_lang,target)
            except Exception:pass
        item['titles']=titles
        item['original_lang']=source_lang
        return item
    # Bound external requests so translation outages cannot stall publishing.
    with ThreadPoolExecutor(max_workers=12) as pool:
        futures={pool.submit(process,item):i for i,item in enumerate(headlines)}
        output=[None]*len(headlines)
        for future in as_completed(futures):
            i=futures[future]
            try:output[i]=future.result()
            except Exception as exc:
                output[i]=headlines[i]
                errors.append('headline_translation:'+type(exc).__name__)
    failures=sum(any(lang not in item.get('titles',{}) for lang in ('pt','en','es')) for item in output)
    if failures:errors.append(f'headline_translation_incomplete:{failures}')
    return output


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
            allowed={'id','category','original_lang','status','demo','kind','published_at','source','source_url','image','locales','consent_publication','expires_at','commercial_relationship','usage_rights','verified_at','verification_note'}
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


def publication_valid(a):
    try:
        dt=datetime.fromisoformat(a.get('published_at','').replace('Z','+00:00'))
        verified=datetime.fromisoformat(a.get('verified_at','').replace('Z','+00:00'))
        return (not a.get('demo') and a.get('status')=='approved' and
                a.get('usage_rights') in ('owned','licensed') and
                a.get('source_url','').startswith('https://') and bool(a.get('source')) and
                bool(a.get('verification_note')) and dt.tzinfo is not None and
                verified.tzinfo is not None and dt<=NOW() and verified<=NOW())
    except (ValueError, TypeError):return False


def normalize_spot_quote(d):
    """One market instrument: commercial USD/BRL spot, never PTAX or futures."""
    if d.get('symbol')!='USD/BRL' or d.get('instrument')!='spot' or d.get('price_type')!='commercial':
        raise ValueError('Not commercial USD/BRL spot')
    if not d.get('source') or not d.get('source_url','').startswith('https://'):
        raise ValueError('Source and attribution required')
    state=d.get('session_status')
    if state=='closed':
        close_date=d.get('close_date')
        close_dt=datetime.strptime(close_date,'%Y-%m-%d').date()
        if close_dt>NOW().date():raise ValueError('Future closing date')
        price=float(d.get('close_value'))
        q=dated_quote(price,d['source'],close_date,d.get('change_pct'),d['source_url'])
        q.update(symbol='USD/BRL',instrument='spot',price_type='commercial',session_status='closed',
                 close_date=close_date,close_value=price,quote_status='last_verified_close')
        return q
    if state!='open':
        # During auction, halt or unknown status, never manufacture a traded quote.
        raise ValueError('No fresh tradable quote; retain last verified close')
    dt=datetime.fromisoformat(d['observed_at'].replace('Z','+00:00'))
    if dt.tzinfo is None or dt>NOW()+timedelta(seconds=30) or NOW()-dt>timedelta(minutes=5):
        raise ValueError('Stale or future session quote')
    q=dated_quote(float(d['value']),d['source'],dt.isoformat(),d.get('change_pct'),d['source_url'])
    q.update(symbol='USD/BRL',instrument='spot',price_type='commercial',session_status='open',
             quote_status='live_snapshot')
    return q


def authorized_spot():
    url=os.getenv('USDBRL_SPOT_URL','')
    if not url or os.getenv('USDBRL_REDISTRIBUTION_AUTHORIZED')!='true':
        raise ValueError('Authorized spot provider not configured')
    if not url.startswith('https://'):raise ValueError('HTTPS required')
    token=os.getenv('USDBRL_SPOT_TOKEN','')
    d=json.loads(fetch(url,headers={'Authorization':'Bearer '+token} if token else {}))
    return normalize_spot_quote(d)


def verified_previous_close():
    """Last *commercial spot* close, accepted only for the immediate nontrading window."""
    q=normalize_spot_quote(read_json(ROOT/'content/usdbrl_last_close.json'))
    close_date=datetime.strptime(q['close_date'],'%Y-%m-%d').date()
    age=(NOW().date()-close_date).days
    if age < 0 or age > 4:
        raise ValueError('Commercial close fallback expired; do not display frozen rates')
    return q


def official_bcb_usdbrl():
    """BCB SGS 1: official PTAX USD/BRL sell reference, distinct from commercial spot.

    Public, dated daily reference; never label as real-time or commercial execution.
    Official series is updated on Brazilian banking days (not weekends).
    """
    url='https://api.bcb.gov.br/dados/serie/bcdata.sgs.1/dados/ultimos/5?formato=json'
    rows=json.loads(fetch(url,timeout=12))
    if not isinstance(rows,list):raise ValueError('Invalid BCB series shape')
    observations=[]
    for row in rows:
        if not isinstance(row,dict):continue
        try:
            day=datetime.strptime(str(row['data']),'%d/%m/%Y').date()
            value=float(str(row['valor']).replace(',','.'))
            if not 0 < value < 50 or day>NOW().date():continue
            observations.append((day,value))
        except (KeyError,TypeError,ValueError):continue
    observations=sorted(set(observations))
    if not observations:raise ValueError('No BCB USD/BRL observations')
    day,value=observations[-1]
    if (NOW().date()-day).days>5:
        raise ValueError('BCB reference date too old for public market strip')
    previous=next((v for d,v in reversed(observations[:-1]) if d<day),None)
    change=(value/previous-1)*100 if previous else None
    quote=dated_quote(value,'Banco Central do Brasil — SGS 1 (PTAX venda)',day.isoformat(),
                      change,'https://www.bcb.gov.br/estabilidadefinanceira/historicocotacoes')
    quote.update(symbol='USD/BRL',instrument='ptax_reference',price_type='ptax_venda',
                 session_status='closed',quote_status='official_bcb_ptax_last')
    return quote


def fred_latest(series, source):
    # Series are US EIA data republished via FRED; not real-time, and subject
    # to source licensing/attribution review prior to monetized launch.
    csvdata=fetch('https://fred.stlouisfed.org/graph/fredgraph.csv?id='+urllib.parse.quote(series))
    rows=list(csv.DictReader(io.StringIO(csvdata)))
    observations=[]
    for row in rows:
        try:
            val=float(row[series]);dt=row.get('DATE') or row['observation_date']
            if val>0:observations.append((dt,val))
        except (ValueError,KeyError,TypeError):continue
    if not observations:raise ValueError(f'No valid observations for {series}')
    current=observations[-1];previous=observations[-2] if len(observations)>1 else None
    change=((current[1]/previous[1])-1)*100 if previous else None
    return dated_quote(current[1],source,current[0],change,'https://fred.stlouisfed.org/series/'+series)


def finnhub_quotes(errors):
    key=os.getenv('FINNHUB_API_KEY','')
    if not key or os.getenv('FINNHUB_REDISTRIBUTION_AUTHORIZED')!='true':return {}
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


def class8_quotes(errors):
    url=os.getenv('CLASS8_DATA_URL','')
    if not url or os.getenv('CLASS8_REDISTRIBUTION_AUTHORIZED')!='true':return {}
    try:
        if not url.startswith('https://'):raise ValueError('HTTPS required')
        d=json.loads(fetch(url))
        result={}
        for key in ('class8_orders','class8_sales'):
            q=d.get(key,{})
            dt=datetime.fromisoformat(q.get('observed_at','').replace('Z','+00:00'))
            if q.get('unit')!='vehicles' or not q.get('source') or not q.get('source_url','').startswith('https://') or dt.tzinfo is None or dt>NOW():raise ValueError('Invalid Class 8 contract')
            result[key]=dated_quote(q['value'],q['source'],dt.isoformat(),q.get('change_pct'),q['source_url'])
        return result
    except Exception as exc:errors.append('class8:'+type(exc).__name__);return {}


def make_market(offline=False):
    market={'generated_at':NOW().isoformat(timespec='seconds'),'mode':'verified-or-unavailable','indicators':{},'stocks':{},'errors':[]}
    if offline:
        market['mode']='offline-test';return market
    for key,fn in [('usdbrl',authorized_spot),('diesel',lambda:fred_latest('GASDESW','EIA / FRED (semanal)')),
                   ('brent',lambda:fred_latest('DCOILBRENTEU','EIA / FRED (diário)'))]:
        try:market['indicators'][key]=fn()
        except Exception as exc:
            market['errors'].append(f'{key}:{type(exc).__name__}')
            if key=='usdbrl':
                # Commercial close and BCB PTAX are not interchangeable instruments.
                # Prefer the newest observation, commercial if dates coincide.
                fallback=[]
                try:fallback.append(verified_previous_close())
                except Exception as exc2:market['errors'].append('usdbrl_previous_close:'+type(exc2).__name__)
                try:fallback.append(official_bcb_usdbrl())
                except Exception as exc3:market['errors'].append('usdbrl_bcb_ptax:'+type(exc3).__name__)
                if fallback:
                    fallback.sort(key=lambda q:(q['observed_at'][:10],q.get('instrument')=='spot'),reverse=True)
                    market['indicators'][key]=fallback[0]
    # V34.1: unproven securities/Class 8 feeds no longer requested or rendered.
    # Retain authorized source adapters for future separately approved pilots.
    return market


def bootstrap_external_story_cards(headlines, first_party):
    """Show vetted source-linked briefs immediately, before any client fetch.

    These are NOT DrivMatch-written reports. Preserve original publisher URLs,
    timestamps and attribution. Only the headline is reproduced or translated.
    """
    categories={'Transporte','Combustíveis','Acidentes','Clima','Rodovias',
                'Fiscalização','Tecnologia','Fretes','Empregos','Caminhões',
                'Mecânica','Caminhoneiros','Socorro','Negócios','Governo',
                'Imigração','Segurança'}
    existing={x.get('source_url') for x in first_party}
    ids={x.get('id') for x in first_party}
    result=[]
    for item in headlines:
        url=item.get('source_url','')
        stamp=item.get('published_at')
        titles=item.get('titles') or {}
        if (not item.get('geo_scope_verified') or
            item.get('origin_type')=='aggregator-discovery' or
            not url.startswith('https://') or not stamp or
            not item.get('source') or not item.get('title') or
            url in existing or item.get('id') in ids):
            continue
        try:
            published=datetime.fromisoformat(stamp.replace('Z','+00:00'))
            if published.tzinfo is None or published>NOW():
                continue
        except (TypeError, ValueError):
            continue
        original=item.get('original_lang') if item.get('original_lang') in ('pt','en','es') else 'en'
        result.append({
            'id':item['id'], 'kind':'external_link', 'status':'external_source',
            'demo':False,
            'category':item.get('category') if item.get('category') in categories else 'Transporte',
            'source':item['source'], 'source_url':url, 'published_at':stamp,
            'original_lang':original, 'region':item.get('region','US'),
            'translated_langs':[language for language in ('pt','en','es') if titles.get(language)],
            'locales':{language:{'title':titles.get(language) or item['title'],
                                 'summary':'','body':''}
                       for language in ('pt','en','es')}
        })
        existing.add(url)
        ids.add(item['id'])
    return result


def build(offline=False):
    errors=[]
    articles=read_json(ROOT/'content/editorial.json')
    mode='production'
    if mode=='production':articles=[a for a in articles if not a.get('demo')]
    from claim_integrity import social_origin_ready_for_publication
    for article in articles:
        if article.get('origin_type')=='social-post' and not social_origin_ready_for_publication(article):
            raise ValueError('Social-origin editorial item has incomplete verification, provenance or rights')
        if article.get('status')!='approved':raise ValueError('Unapproved editorial article in publication file')
        if article.get('demo') is not True and article.get('usage_rights') not in ('owned','licensed'):
            raise ValueError('Production article lacks owned/licensed content rights')
    articles += public_offers(errors,offline)
    articles = [a for a in articles if publication_valid(a)]
    # Headlines are attributed external links, never auto-approved DrivMatch articles.
    # Editorial relevance gate: audience = truck drivers, dispatchers and freight brokers.
    # Feed category is not evidence of relevance. Require a concrete trucking,
    # freight, commercial-road, logistics or material road-weather connection.
    # Scope: domestic US or US-Canada / US-Mexico corridors only.
    from editorial_gate import eligible as editorial_eligible
    from editorial_text import deduplicate_external

    external_headlines=[]
    # Private diagnostics separate actual source freshness from relevance decisions.
    # No successful build is ever presented as a new article.
    rejection_counts={'aggregator_discovery':0,'off_topic_or_wrong_corridor':0,
                      'duplicate_or_invalid':0,'eligible_source_links':0}
    recent_candidates_3h=0
    recent_eligible_3h=0
    if not offline:
        from collect_sources import collect
        collect()
        candidates_path=ROOT/'build/news-candidates.json'
        try:
            rows=read_json(candidates_path)
            seen={a.get('source_url') for a in articles}
            for item in sorted(rows,key=lambda a:a.get('published_at',''),reverse=True):
                if item.get('source_url') in seen or not item.get('title') or not item.get('source_url','').startswith('https://'):
                    rejection_counts['duplicate_or_invalid']+=1
                    continue
                # Discovery feeds are broad. Exclude entertainment/streaming false positives
                # rather than labeling them as operational weather alerts.
                if item.get('origin_type')=='aggregator-discovery' or 'news.google.com' in item.get('source_url',''):
                    rejection_counts['aggregator_discovery']+=1
                    continue
                try:
                    recent=0<=(NOW()-datetime.fromisoformat(item['published_at'].replace('Z','+00:00'))).total_seconds()<=10800
                except (KeyError,ValueError,TypeError,AttributeError):
                    recent=False
                if recent:recent_candidates_3h+=1
                if not editorial_eligible(item):
                    rejection_counts['off_topic_or_wrong_corridor']+=1
                    continue
                if recent:recent_eligible_3h+=1
                headline=item['title'].casefold()
                if item.get('category')=='Clima' and any(term in headline for term in
                    ('season 2','season 3','how to watch','streaming','episode','trailer','rocky mountain wreckers')):
                    continue
                external_headlines.append({**{k:item[k] for k in ('title','source','source_url','published_at','category','region','origin_type')},'id':'source-'+hashlib.sha256(item['source_url'].encode()).hexdigest()[:20],'original_lang':item.get('original_lang','en'),'geo_scope_verified':True})
                rejection_counts['eligible_source_links']+=1
                seen.add(item['source_url'])
                if len(external_headlines)>=90:break
        except (OSError,ValueError,TypeError,KeyError) as exc:
            errors.append('external_headlines:'+type(exc).__name__)
    # Verified fresh first-party links supplement RSS gaps, never get a new build timestamp.
    try:external_headlines=verified_external_source_links(offline)+external_headlines
    except (OSError,ValueError,TypeError,KeyError) as exc:errors.append('verified_external_links:'+type(exc).__name__)
    external_headlines=deduplicate_external(localize_source_headlines(external_headlines,errors,offline),articles)
    unique={}
    for a in articles:
        if a['id'] in unique:continue
        translated=translate_missing(a,errors,offline)
        if all(translated.get('locales',{}).get(l,{}).get('title') and translated['locales'][l].get('body') for l in ('pt','en','es')):
            unique[a['id']]=translated
        else: errors.append(f'translation_incomplete:{a["id"]}')
    market=make_market(offline)
    from weather_brief import collect_weather
    weather=collect_weather(fetch,offline=offline)
    ads=read_json(ROOT/'content/ads.json')
    release=read_json(ROOT/'content/release.json')
    if release.get('version')!='v34.11' or release.get('public_launch_approved') is not False:
        raise ValueError('Invalid release contract: v34.11 must remain prelaunch')
    # Source-linked headlines are part of the initial issue: an extra failed
    # client fetch must not leave readers staring only at old approved stories.
    # They remain external links, not fabricated DrivMatch original reporting.
    initial_links=bootstrap_external_story_cards(external_headlines,unique.values())[:75]
    latest_source=max((x.get('published_at','') for x in external_headlines),default='')
    data={'schema_version':1,'site_version':release['version'],'publication_mode':mode,'generated_at':NOW().isoformat(timespec='seconds'),
          'source_monitor':{'checked_at':(NOW().isoformat(timespec='seconds') if not offline else None),
                            'latest_original_published_at':latest_source},
          'articles':list(unique.values())+initial_links,'market':market,'ads':ads}
    path=ROOT/'site/data';path.mkdir(parents=True,exist_ok=True)
    public_spot=os.getenv('USDBRL_PUBLIC_URL','')
    runtime={'spot_url':public_spot if public_spot.startswith('https://') else ''}
    # Curated live-camera discovery directory: sources are not automatically video streams.
    # Publish only explicitly allowed outbound references and the official FL511 map embed.
    camera_network=read_json(ROOT/'content/camera-source-network.json')
    allowed_display={'approved_official_embed','external_link_only','external_link_only_license_required'}
    if camera_network.get('schema_version')!=1 or not isinstance(camera_network.get('sources'),list):
        raise ValueError('Invalid camera network schema')
    public_sources=[];camera_ids=set()
    for camera in camera_network['sources']:
        ident=camera.get('id')
        if not isinstance(ident,str) or ident in camera_ids or not ident:
            raise ValueError('Duplicate or invalid camera source identifier')
        camera_ids.add(ident)
        if camera.get('verified_playing_live') is not False:
            raise ValueError('Camera directory must not certify verified live playback')
        source_url=camera.get('source_url','')
        if not isinstance(source_url,str) or not source_url.startswith('https://'):
            raise ValueError('Camera source must use HTTPS')
        if camera.get('display') not in allowed_display:
            continue
        public={'id':ident,'name':camera['name'],'label':camera['label'],
                'source_url':source_url,'display':camera['display'],
                'verified_playing_live':False,'priority':camera['priority']}
        if camera['display']=='approved_official_embed':
            embedded=camera.get('embed_url','')
            if ident!='fl511-i4' or not embedded.startswith('https://fl511.com/Map/EmbeddedMap?'):
                raise ValueError('Only explicitly sanctioned FL511 map embedding is allowed')
            public['embed_url']=embedded
        elif camera.get('embed_url'):
            raise ValueError('Unlicensed camera provider may not have embed URL')
        public_sources.append(public)
    public_sources.sort(key=lambda c:c['priority'])
    (path/'camera-source-network.json').write_text(
        json.dumps({'schema_version':1,'sources':public_sources,
                    'all_camera_streams_verified':False},ensure_ascii=False,indent=2)+'\n',
        encoding='utf-8')
    (path/'release.json').write_text(json.dumps(release,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (path/'runtime.json').write_text(json.dumps(runtime)+'\n',encoding='utf-8')
    (path/'content.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    source_health_path=ROOT/'build/source-health.json'
    try:
        source_health=read_json(source_health_path) if not offline else {}
    except (OSError,ValueError,TypeError):
        source_health={}
    statuses=source_health.get('sources',[])
    source_metrics={'total':len(statuses),'working':sum(x.get('status')=='ok' for x in statuses),
                    'failed':sum(x.get('status')=='failed' for x in statuses),
                    'manual':sum(x.get('status')=='manual-review' for x in statuses)}
    latest=max((x.get('published_at','') for x in external_headlines),default='')
    now=NOW()
    fresh_6h=sum(1 for x in external_headlines if x.get('published_at') and
                 0<=(now-datetime.fromisoformat(x['published_at'].replace('Z','+00:00'))).total_seconds()<=6*3600)
    fresh_12h=sum(1 for x in external_headlines if x.get('published_at') and
                  0<=(now-datetime.fromisoformat(x['published_at'].replace('Z','+00:00'))).total_seconds()<=12*3600)
    newest_age_h=(now-datetime.fromisoformat(latest.replace('Z','+00:00'))).total_seconds()/3600 if latest else None
    if newest_age_h is None or newest_age_h>8:
        print('::warning::NEWS FRESHNESS: no eligible headline published in the past 8 hours. '
              'Successful deployment is not a new editorial story.')
    monitor={'generated_at':NOW().isoformat(timespec='seconds'),
             'last_source_check':source_health.get('checked_at'),
             'latest_headline_at':latest,'source_metrics':source_metrics,
             'fresh_6h':fresh_6h,'fresh_12h':fresh_12h,
             'newest_headline_age_hours':round(newest_age_h,2) if newest_age_h is not None else None,
             'editorial_status':'external_feed_links_not_editorially_approved',
             'headlines':external_headlines}
    (path/'source-headlines.json').write_text(json.dumps(monitor,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    # Independent private operations signal. A successful deployment is NOT
    # proof of a fresh article, and the reader never sees this diagnostic.
    age_minutes=round(newest_age_h*60) if newest_age_h is not None else None
    freshness={
        'schema_version':1,
        'checked_at':now.isoformat(timespec='seconds'),
        'latest_original_published_at':latest or None,
        'latest_original_age_minutes':age_minutes,
        'approved_external_headlines':len(external_headlines),
        'published_last_60_minutes':sum(
            1 for x in external_headlines if x.get('published_at') and
            0 <= (now-datetime.fromisoformat(x['published_at'].replace('Z','+00:00'))).total_seconds() <= 3600),
        'published_last_180_minutes':sum(
            1 for x in external_headlines if x.get('published_at') and
            0 <= (now-datetime.fromisoformat(x['published_at'].replace('Z','+00:00'))).total_seconds() <= 10800),
        'source_metrics':source_metrics,
        'source_candidate_rejections':rejection_counts,
        'publisher_candidates_last_180_minutes':recent_candidates_3h,
        'eligible_publisher_candidates_last_180_minutes':recent_eligible_3h,
        'status':'fresh' if age_minutes is not None and 0<=age_minutes<=180 else 'stale_or_no_verified_headlines',
        'policy':'Preserve source dates and editorial gates. Never invent a story or label a build as a new publication.'
    }
    (ROOT/'build').mkdir(exist_ok=True)
    (ROOT/'build/newsroom-health.json').write_text(json.dumps(freshness,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    if freshness['status']!='fresh':
        print('::warning title=Editorial freshness::No verified source headline published in the past 3 hours; review sources and eligibility.')
    print('NEWS FRESHNESS:',len(external_headlines),'eligible', 'fresh_6h:',fresh_6h,
          'fresh_12h:',fresh_12h,'latest_age_h:',round(newest_age_h,1) if newest_age_h is not None else 'unknown')
    # A safe current-news endpoint for the separately deployed DrivMatch Live site.
    # Do not confuse this with verified active traffic or weather incidents.
    from live_feed import make_live_feed
    live=make_live_feed(list(unique.values()),external_headlines,NOW())
    (path/'live-feed.json').write_text(json.dumps(live,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (path/'market.json').write_text(json.dumps(market,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (path/'weather.json').write_text(json.dumps(weather,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    # Verified livestreams only; without authorized API key this publishes a
    # clearly labeled, playable third-party recording, never a fictitious LIVE.
    from road_tv import make_road_tv
    road_tv=make_road_tv(offline=offline)
    (path/'road-tv.json').write_text(json.dumps(road_tv,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (path/'bootstrap.js').write_text('window.DRIVMATCH_BOOTSTRAP='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
    # Content hashes prevent browsers mixing new HTML with cached runtime/data.
    page=ROOT/'site/index.html'
    markup=page.read_text(encoding='utf-8')
    for asset in ('data/bootstrap.js','assets/app.js','assets/road-tv-live.js','assets/news-crawler.js','assets/clima-spot.js','assets/utility-strip.js'):
        version=hashlib.sha256((ROOT/'site'/asset).read_bytes()).hexdigest()[:16]
        markup=re.sub(r'(src="'+re.escape(asset)+r')(?:\?[^"]*)?"',lambda m:m.group(1)+'?v='+version+'"',markup)
    page.write_text(markup,encoding='utf-8')
    print(f'Published {len(unique)} stories (demo={sum(a.get("demo") is True for a in unique.values())}); '
          f'quotes={len(market["indicators"])}; stocks={len(market["stocks"])}; errors={len(errors+market["errors"])}')
    for err in errors+market['errors']:print('nonfatal:',err)
    return data

if __name__=='__main__':build(offline='--offline' in sys.argv)
