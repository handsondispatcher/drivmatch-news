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
    target_tag = {'pt':'pt-BR','en':'en-US','es':'es-419'}[target]
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
        # Human-reviewed exact headline from the original publisher.
        # Do not depend on an unreliable external translation endpoint for
        # this high-priority Orlando freight-fraud story.
        if (str(item.get('source_url') or '').rstrip('/') ==
            'https://www.freightwaves.com/news/orlando-trucking-owner-pleads-guilty-in-1m-usps-freight-auction-fraud' and
            item['title'].strip() ==
            'Orlando trucking owner pleads guilty in $1M USPS freight auction fraud'):
            titles['pt']='Dono de transportadora de Orlando se declara culpado por fraude de US$ 1 milhão em leilões de frete do USPS'
        for target in ('pt','en','es'):
            if target in titles:continue
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
        if (NOW().date()-close_dt).days>5:raise ValueError('Commercial close is too old')
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



def authorized_awesomeapi_usdbrl():
    """Read USD/BRL *indicative ask* with the owner's confirmed display permission.

    During Brazil's regular business-day trading window require a source tick
    within five minutes. Outside the window preserve the vendor's final
    *observed quote*, never describe it as an official exchange closing price.
    The API key stays in the GitHub secret, never shipped to browsers.
    """
    if os.getenv('AWESOMEAPI_REDISTRIBUTION_AUTHORIZED')!='true':
        raise ValueError('AwesomeAPI publication rights not enabled')
    token=os.getenv('AWESOMEAPI_API_KEY','')
    if not token:raise ValueError('AWESOMEAPI_API_KEY not configured')
    url='https://economia.awesomeapi.com.br/json/last/USD-BRL'
    response=json.loads(fetch(url,headers={'x-api-key':token},timeout=12))
    row=response.get('USDBRL',{})
    if row.get('code')!='USD' or row.get('codein')!='BRL':
        raise ValueError('AwesomeAPI unexpected USD/BRL pair')
    try:
        ask=float(row['ask'])
        bid=float(row['bid'])
        when=datetime.fromtimestamp(int(row['timestamp']),UTC)
    except (ValueError,KeyError,OverflowError,TypeError) as exc:
        raise ValueError('Invalid AwesomeAPI spot payload') from exc
    if not (0<bid<=ask<50):
        raise ValueError('Invalid AwesomeAPI USD/BRL bid/ask spread')
    age=NOW()-when
    if age<timedelta(seconds=-30):
        raise ValueError('AwesomeAPI quote timestamp is in the future')
    from zoneinfo import ZoneInfo
    local=NOW().astimezone(ZoneInfo('America/Sao_Paulo'))
    # Indicative FX business-session window. Do not infer official settlement.
    # Provider can halt or close earlier; the five-minute TTL will fail closed.
    business_session=(local.weekday()<5 and 9<=local.hour<18
                      and local.date().isoformat() not in {
                          '2026-01-01','2026-04-03','2026-04-21','2026-05-01',
                          '2026-09-07','2026-10-12','2026-11-02',
                          '2026-11-20','2026-12-25'})
    # Business-session source ticks older than five minutes must fail closed.
    # Outside business hours retain only the dated provider observation.
    if business_session and age>timedelta(minutes=5):
        raise ValueError('AwesomeAPI quote stale during trading window')
    # Do not keep indefinitely old values; covers weekends and normal holidays.
    if age>timedelta(days=4):
        raise ValueError('AwesomeAPI previous observation older than four days')
    try:change=float(row['pctChange'])
    except (ValueError,KeyError,TypeError):change=None
    q=dated_quote(ask,'AwesomeAPI — USD/BRL venda indicativa',
                  when.isoformat(timespec='seconds'),change,
                  'https://docs.awesomeapi.com.br/api-de-moedas')
    is_live=business_session and age<=timedelta(minutes=5)
    delayed=False
    q.update(symbol='USD/BRL',instrument='spot',price_type='commercial',
             quote_status='live_snapshot' if is_live else ('delayed_provider_observation' if delayed else 'last_provider_observation'),
             session_status='open' if is_live else ('delayed' if delayed else 'closed'),
             rate_side='ask',bid=bid,ask=ask,indicative=True,
             checked_at=NOW().isoformat(timespec='seconds'))
    if not is_live and not delayed:
        q.update(close_date=when.astimezone(ZoneInfo('America/Sao_Paulo')).date().isoformat(),close_value=ask)
    return q


def authorized_fx_market_quote():
    """Prefer approved contracted FX feed; fail over to independently licensed API."""
    failures=[]
    for name,reader in [('primary_spot',authorized_spot),
                        ('awesomeapi',authorized_awesomeapi_usdbrl)]:
        try:return reader()
        except Exception as exc:failures.append(name+':'+type(exc).__name__)
    raise ValueError('No currently licensed USD/BRL spot provider: '+','.join(failures))


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


def official_bcb_ptax_odata():
    """BCB Olinda PTAX bulletins: latest dated USD sell *reference*, not FX spot.

    OData period endpoint includes intermediate intraday bulletins. Preserve
    the actual quote timestamp and identify them explicitly as a PTAX quote.
    """
    from zoneinfo import ZoneInfo
    zone=ZoneInfo('America/Sao_Paulo')
    local_now=NOW().astimezone(zone)
    first=(local_now.date()-timedelta(days=10)).strftime('%m-%d-%Y')
    last=local_now.date().strftime('%m-%d-%Y')
    url=('https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/'
         'CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)'
         '?%40dataInicial=%27'+first+'%27&%40dataFinalCotacao=%27'+last+
         '%27&%24format=json&%24top=200')
    rows=json.loads(fetch(url,timeout=16)).get('value',[])
    if not isinstance(rows,list):raise ValueError('Invalid Olinda response')
    records=[]
    for row in rows:
        if not isinstance(row,dict):continue
        try:
            price=float(row['cotacaoVenda'])
            raw=str(row['dataHoraCotacao'])
            local_dt=datetime.fromisoformat(raw.replace(' ','T'))
            if local_dt.tzinfo is None:
                local_dt=local_dt.replace(tzinfo=zone)
            observation=local_dt.astimezone(UTC)
            if not 0<price<50 or observation>NOW()+timedelta(seconds=30):
                continue
            bulletin=str(row.get('tipoBoletim') or '').strip()
            records.append((observation,price,bulletin))
        except (KeyError,ValueError,TypeError,OverflowError):continue
    if not records:raise ValueError('No recent PTAX bulletin in BCB Olinda')
    records.sort(key=lambda x:x[0])
    observation,price,bulletin=records[-1]
    if NOW()-observation>timedelta(days=5):
        raise ValueError('Expired PTAX bulletin')
    previous=next((v for dt,v,_ in reversed(records[:-1])
                   if dt.astimezone(zone).date()<observation.astimezone(zone).date()),None)
    percent=((price/previous)-1)*100 if previous else None
    observed_date=observation.astimezone(zone).date()
    # Never infer a final close from time of day alone.
    # Olinda has an explicit "tipoBoletim" value for Fechamento.
    intraday=bulletin.casefold()!='fechamento'
    quote=dated_quote(price,'Banco Central do Brasil — PTAX OData',
                      observation.isoformat(timespec='seconds'),percent,
                      'https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/')
    quote.update(symbol='USD/BRL',instrument='ptax_reference',price_type='ptax_venda',
                 session_status='reference_intraday' if intraday else 'closed',
                 quote_status='official_bcb_ptax_intraday' if intraday else 'official_bcb_ptax_last',
                 cadence='daily',checked_at=NOW().isoformat(timespec='seconds'))
    return quote


def normalize_brent_spot_quote(d):
    """Authorized Brent physical spot USD/bbl, not a futures contract or CFD."""
    if d.get('instrument')!='brent_spot' or d.get('unit')!='USD/bbl':
        raise ValueError('Only Brent spot, USD/bbl, may replace EIA Brent reference')
    if not d.get('source') or not str(d.get('source_url','')).startswith('https://'):
        raise ValueError('Brent provider attribution required')
    state=d.get('session_status')
    if state=='open':
        dt=datetime.fromisoformat(str(d['observed_at']).replace('Z','+00:00'))
        if dt.tzinfo is None or dt>NOW()+timedelta(seconds=30) or NOW()-dt>timedelta(minutes=5):
            raise ValueError('Stale Brent live snapshot')
        q=dated_quote(float(d['value']),d['source'],dt.isoformat(),d.get('change_pct'),d['source_url'])
        q.update(instrument='brent_spot',unit='USD/bbl',session_status='open',quote_status='live_snapshot')
        return q
    if state=='closed':
        day=datetime.strptime(str(d['close_date']),'%Y-%m-%d').date()
        if not 0<=(NOW().date()-day).days<=5:
            raise ValueError('Brent last close expired')
        value=float(d['close_value'])
        q=dated_quote(value,d['source'],day.isoformat(),d.get('change_pct'),d['source_url'])
        q.update(instrument='brent_spot',unit='USD/bbl',session_status='closed',
                 close_date=day.isoformat(),close_value=value,quote_status='last_verified_close')
        return q
    raise ValueError('Unknown Brent session state')


def authorized_brent_spot():
    url=os.getenv('BRENT_SPOT_URL','')
    if not url or os.getenv('BRENT_REDISTRIBUTION_AUTHORIZED')!='true':
        raise ValueError('Authorized Brent spot feed not configured')
    if not url.startswith('https://'):
        raise ValueError('Brent provider must use HTTPS')
    token=os.getenv('BRENT_SPOT_TOKEN','')
    obj=json.loads(fetch(url,headers={'Authorization':'Bearer '+token} if token else {},timeout=12))
    return normalize_brent_spot_quote(obj)



def oilpriceapi_brent_for_internal_validation():
    """Validate OilPriceAPI Brent privately. No public redistribution rights.

    Source explicitly prohibits public display of third-party Brent on all
    standard tiers. This method must not be wired into make_market() or site/.
    Never log or serialize the API token.
    """
    token=os.getenv('OILPRICEAPI_API_KEY','').strip()
    if not token:
        raise ValueError('OILPRICEAPI_API_KEY not configured')
    url='https://api.oilpriceapi.com/v1/prices/latest?by_code=BRENT_CRUDE_USD'
    payload=json.loads(fetch(url,headers={'Authorization':'Token '+token},timeout=12))
    data=payload.get('data')
    if payload.get('status')!='success' or not isinstance(data,dict):
        raise ValueError('OilPriceAPI did not return a successful Brent response')
    if data.get('code')!='BRENT_CRUDE_USD' or data.get('currency') not in ('USD',None):
        raise ValueError('OilPriceAPI unexpected instrument/currency')
    import math
    value=data.get('price')
    if type(value) not in (int,float) or not math.isfinite(value) or not 0<value<10000:
        raise ValueError('Invalid OilPriceAPI Brent price')
    # Use source observation time, never collection or response creation time.
    observed_str=data.get('as_of') or data.get('observed_at')
    if not isinstance(observed_str,str):
        raise ValueError('OilPriceAPI source observation time missing')
    observed=datetime.fromisoformat(observed_str.replace('Z','+00:00'))
    if observed.tzinfo is None or observed>NOW()+timedelta(seconds=30):
        raise ValueError('Invalid OilPriceAPI source observation time')
    if data.get('stale') is True or data.get('synthetic') is True or data.get('data_status')=='stale':
        raise ValueError('Stale/synthetic OilPriceAPI reading')
    if NOW()-observed>timedelta(minutes=30):
        raise ValueError('OilPriceAPI source observation older than 30 minutes')
    return {'instrument':'brent_price_api_internal','value':float(value),
            'unit':'USD/bbl','observed_at':observed.isoformat(),
            'source':'OilPriceAPI (internal evaluation only)',
            'public_display_authorized':False}


def market_reference_current(quote, key, now=None):
    """Bound age by actual source cadence, never by website polling frequency.

    FRED/EIA Brent is a daily *observation* (not live Brent futures);
    EIA US highway diesel is weekly and typically released Monday ~17 ET.
    Late/outage releases must not be presented as fresh indefinitely.
    """
    now=now or NOW()
    limits={'diesel':12,'brent':5,'usdbrl':5}
    try:
        observed=str(quote.get('observed_at') or '')
        day=datetime.fromisoformat(observed.replace('Z','+00:00'))
        if day.tzinfo is None:
            day=day.replace(tzinfo=UTC)
        if day>now+timedelta(seconds=30):return False
        delta=now-day.astimezone(UTC)
        return timedelta(seconds=-30)<=delta<=timedelta(days=limits[key])
    except (ValueError,TypeError,KeyError,OverflowError):
        return False


def cached_verified_market_reference(key):
    """Short outage fallback: only a known, attributed SAME instrument."""
    # The generated market.json can legitimately lose a quote after an upstream
    # outage. Keep a separate, checked-in verified observation as an independent
    # disaster-recovery input; never silently extend its expiry.
    path=ROOT/'site/data/market.json'
    primary=read_json(path).get('indicators',{}).get(key,{}) if path.exists() else {}
    if key=='brent':
        # Prefer the freshest attributed official observation, never an archived
        # observation if the active cache has a newer timestamp.
        archive=ROOT/'content/verified-brent-reference.json'
        archived=read_json(archive) if archive.exists() else {}
        if archived and (not primary or str(archived.get('observed_at',''))>str(primary.get('observed_at',''))):
            primary=archived
    record=primary
    if not record:raise ValueError('No previously verified public snapshot')
    approved_provenance={
        'diesel':{
            ('EIA / FRED (semanal)','https://fred.stlouisfed.org/series/GASDESW'),
            ('EIA — diesel rodoviário EUA (semanal)',
             'https://www.eia.gov/opendata/browser/petroleum/pri/gnd')},
        'brent':{
            ('EIA / FRED (diário)','https://fred.stlouisfed.org/series/DCOILBRENTEU'),
            ('EIA — Brent Europe spot (diário)',
             'https://www.eia.gov/opendata/browser/petroleum/pri/spt')}
    }
    if (record.get('source'),record.get('source_url')) not in approved_provenance[key]:
        raise ValueError('Previously served snapshot has wrong official source')
    historic=key=='brent' and not market_reference_current(record,key)
    if historic:
        day=datetime.fromisoformat(record['observed_at']).date()
        if not 0<=(NOW().date()-day).days<=21:
            raise ValueError('Cached Brent historical observation older than 21 days')
    elif not market_reference_current(record,key):
        raise ValueError('Cached official quote expired')
    record={**record,
            'quote_status':'historical_reference' if historic else 'previous_verified_publication',
            'session_status':'historical_reference' if historic else 'published_reference',
            'instrument':key+'_eia_reference','cadence':'weekly' if key=='diesel' else 'daily',
            'checked_at':NOW().isoformat(timespec='seconds')}
    return record



def eia_direct_latest(key):
    """Use EIA's own registered APIv2, not scraped news pages or FRED mirroring.

    Diesel: nationwide weekly No.2 retail diesel USD/gal.
    Brent: Europe Brent daily physical spot reference USD/bbl.
    API registration and an EIA_API_KEY secret are required by EIA.
    """
    api_key=os.getenv('EIA_API_KEY','')
    if not api_key:raise ValueError('EIA_API_KEY not configured')
    instruments={
        'diesel':('petroleum/pri/gnd','weekly','EMD_EPD2D_PTE_NUS_DPG','EIA — diesel rodoviário EUA (semanal)','USD/gal'),
        'brent':('petroleum/pri/spt','daily','RBRTE','EIA — Brent Europe spot (diário)','USD/bbl'),
    }
    if key not in instruments:raise ValueError('Unsupported EIA market instrument')
    route,frequency,series,source,unit=instruments[key]
    params=urllib.parse.urlencode([
        ('api_key',api_key),('frequency',frequency),('data[0]','value'),
        ('facets[series][]',series),('sort[0][column]','period'),
        ('sort[0][direction]','desc'),('offset','0'),('length','8')
    ])
    response=json.loads(fetch('https://api.eia.gov/v2/'+route+'/data/?'+params,timeout=18))
    records=response.get('response',{}).get('data',[])
    if not isinstance(records,list):raise ValueError('Invalid EIA API response')
    observations=[]
    for row in records:
        try:
            if row.get('series')!=series:continue
            day=str(row['period'])
            datetime.strptime(day,'%Y-%m-%d')
            value=float(row['value'])
            if not 0<value<10000:continue
            observations.append((day,value))
        except (KeyError,ValueError,TypeError):continue
    if not observations:raise ValueError('No valid official EIA observations for '+series)
    observations.sort(key=lambda record:record[0])
    current=observations[-1]
    older=next((rec for rec in reversed(observations[:-1]) if rec[0]<current[0]),None)
    change=(current[1]/older[1]-1)*100 if older else None
    quote=dated_quote(current[1],source,current[0],change,
                      'https://www.eia.gov/opendata/browser/'+route)
    historical=key=='brent' and not market_reference_current(quote,key)
    if key=='diesel' and not market_reference_current(quote,key):
        raise ValueError('Expired official EIA diesel data')
    if historical and (NOW().date()-datetime.fromisoformat(current[0]).date()).days>21:
        raise ValueError('Official EIA Brent data older than 21 days')
    quote.update(
        session_status='historical_reference' if historical else 'published_reference',
        quote_status='historical_reference' if historical else 'last_official_publication',
        cadence=frequency,instrument=key+'_eia_reference',
        unit=unit,checked_at=NOW().isoformat(timespec='seconds'))
    return quote


def eia_reference_with_fred_fallback(key):
    """Prefer official EIA API when a registered key is available.

    Preserve existing FRED/EIA fallback during migration. It remains a dated
    official publication, never intraday market data.
    """
    if os.getenv('EIA_API_KEY'):
        try:return eia_direct_latest(key)
        except Exception:
            # Provenance remains that of the actual fallback, not of EIA API.
            pass
    config={
        'diesel':('GASDESW','EIA / FRED (semanal)'),
        'brent':('DCOILBRENTEU','EIA / FRED (diário)'),
    }
    return fred_latest(*config[key])


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
    key={'GASDESW':'diesel','DCOILBRENTEU':'brent'}.get(series)
    quote=dated_quote(current[1],source,current[0],change,'https://fred.stlouisfed.org/series/'+series)
    historical=bool(key=='brent' and not market_reference_current(quote,key))
    if key=='diesel' and not market_reference_current(quote,key):
        raise ValueError('Expired weekly EIA diesel quote')
    if historical:
        # Keep the exact last EIA reference when FRED has stopped updating,
        # but mark it prominently as historical, NEVER live/last close.
        if (NOW().date()-datetime.fromisoformat(current[0]).date()).days>21:
            raise ValueError('EIA Brent publication is older than 21 days')
    quote.update(session_status='historical_reference' if historical else 'published_reference',
                 quote_status='historical_reference' if historical else 'last_official_publication',
                 cadence='weekly' if key=='diesel' else 'daily',instrument=key+'_eia_reference',
                 checked_at=NOW().isoformat(timespec='seconds'))
    return quote


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
    for key,fn in [('usdbrl',authorized_fx_market_quote),('diesel',lambda:eia_reference_with_fred_fallback('diesel')),
                   ('brent',lambda:eia_reference_with_fred_fallback('brent'))]:
        try:
            if key=='brent' and os.getenv('BRENT_REDISTRIBUTION_AUTHORIZED')=='true' and os.getenv('BRENT_SPOT_URL'):
                try:market['indicators'][key]=authorized_brent_spot()
                except Exception as provider_exc:
                    market['errors'].append('brent_spot:'+type(provider_exc).__name__)
                    market['indicators'][key]=fn()
            else:market['indicators'][key]=fn()
        except Exception as exc:
            market['errors'].append(f'{key}:{type(exc).__name__}')
            if key in ('diesel','brent'):
                try:market['indicators'][key]=cached_verified_market_reference(key)
                except Exception as cache_exc:market['errors'].append(f'{key}_cache:{type(cache_exc).__name__}')
            if key=='usdbrl':
                # Fail over only to the verified commercial spot CLOSE; never
                # overwrite the public dollar with a BCB PTAX reference.
                try:market['indicators'][key]=verified_previous_close()
                except Exception as exc2:market['errors'].append('usdbrl_previous_close:'+type(exc2).__name__)
                # Preserve PTAX separately for internal diagnostics/analytics.
                try:market.setdefault('references',{})['usdbrl_ptax']=official_bcb_ptax_odata()
                except Exception as exc3:
                    market['errors'].append('usdbrl_bcb_olinda:'+type(exc3).__name__)
                    try:market.setdefault('references',{})['usdbrl_ptax']=official_bcb_usdbrl()
                    except Exception as exc4:market['errors'].append('usdbrl_bcb_sgs:'+type(exc4).__name__)
    # PTAX must never supersede an actual commercial close, regardless of
    # which publication has a later date; the instruments are different.
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
            (item.get('origin_type')=='aggregator-discovery' and not
             (item.get('editorial_type')=='discovery_link' and str(item.get('source','')).startswith('Google News · '))) or
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
            'origin_type':item.get('origin_type','publisher-feed'),
            'editorial_type':item.get('editorial_type','publisher_headline'),
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
                discovery=item.get('origin_type')=='aggregator-discovery'
                if discovery and not item.get('source','').startswith('Google News · '):
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
                external_headlines.append({**{k:item[k] for k in ('title','source','source_url','published_at','category','region','origin_type')},'id':'source-'+hashlib.sha256(item['source_url'].encode()).hexdigest()[:20],'original_lang':item.get('original_lang','en'),'geo_scope_verified':True,'editorial_type':('discovery_link' if discovery else 'publisher_headline')})
                rejection_counts['eligible_source_links']+=1
                seen.add(item['source_url'])
                if len(external_headlines)>=240:break
        except (OSError,ValueError,TypeError,KeyError) as exc:
            errors.append('external_headlines:'+type(exc).__name__)
    # Official US weather bulletins are separate from journalistic reporting.
    # Each bulletin keeps the NWS 'sent' timestamp and exact official source URL.
    official_alerts=[]
    if not offline:
        try:
            from official_alerts import collect_nws_alerts
            official_alerts=collect_nws_alerts()
        except (OSError,TimeoutError,ValueError,KeyError,TypeError) as exc:
            errors.append('nws_official_alerts:'+type(exc).__name__)
            safe_http_code=getattr(exc,'code',None)
            print('NWS_OFFICIAL_ALERTS_UNAVAILABLE:',type(exc).__name__,
                  'HTTP_'+str(safe_http_code) if isinstance(safe_http_code,int) else '')
    print('NWS_OFFICIAL_ALERTS:',len(official_alerts),'current high-impact official bulletins (not verified road closures)')
    # Verified first-party links supplement RSS gaps, never get a new build timestamp.
    try:external_headlines=verified_external_source_links(offline)+external_headlines
    except (OSError,ValueError,TypeError,KeyError) as exc:errors.append('verified_external_links:'+type(exc).__name__)
    external_headlines=deduplicate_external(localize_source_headlines(official_alerts+external_headlines,errors,offline),articles)
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
    # Locale-specific raster art can only go live after explicit owner
    # approval AND an exact SHA-256 match against the approved source bytes.
    # A missing file never causes a broken advertisement: English stays active.
    for locale in ('pt','es'):
        approved=ads.get('approved_localized_creatives',{}).get(locale,{})
        if approved.get('status')!='owner_approved_asset_pending_repo':
            continue
        rel=approved.get('asset','')
        if not re.fullmatch(r'assets/ads/carhauler-photo1-(?:pt|es)-approved-20261013\.png',rel):
            raise ValueError('Invalid localized artwork path')
        target=ROOT/'site'/rel
        if target.exists():
            digest=hashlib.sha256(target.read_bytes()).hexdigest()
            if digest!=approved['sha256']:
                raise ValueError('Localized artwork checksum mismatch: '+locale)
            approved['status']='published_locked'
            print('APPROVED LOCALIZED AD ASSET VERIFIED:',locale,digest)
        else:
            print('APPROVED LOCALIZED AD ASSET PENDING UPLOAD:',locale)

    release=read_json(ROOT/'content/release.json')
    if release.get('version')!='v34.11' or release.get('public_launch_approved') is not False:
        raise ValueError('Invalid release contract: v34.11 must remain prelaunch')
    # Source-linked headlines are part of the initial issue: an extra failed
    # client fetch must not leave readers staring only at old approved stories.
    # They remain external links, not fabricated DrivMatch original reporting.
    initial_links=bootstrap_external_story_cards(external_headlines,unique.values())[:160]
    latest_source=max((x.get('published_at','') for x in external_headlines),default='')
    data={'schema_version':1,'site_version':release['version'],'publication_mode':mode,'generated_at':NOW().isoformat(timespec='seconds'),
          'source_monitor':{'checked_at':(NOW().isoformat(timespec='seconds') if not offline else None),
                            'latest_original_published_at':latest_source},
          'articles':list(unique.values())+initial_links,'market':market,'ads':ads}
    path=ROOT/'site/data';path.mkdir(parents=True,exist_ok=True)
    public_spot=os.getenv('USDBRL_PUBLIC_URL','')
    public_brent=os.getenv('BRENT_PUBLIC_URL','')
    runtime={
        'spot_url':public_spot if (public_spot.startswith('https://') and
                                  os.getenv('USDBRL_REDISTRIBUTION_AUTHORIZED')=='true') else '',
        'brent_spot_url':public_brent if (public_brent.startswith('https://') and
                                        os.getenv('BRENT_REDISTRIBUTION_AUTHORIZED')=='true') else ''
    }
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
    # Editorial freshness measures newspaper source publication dates only.
    # Active government bulletins are operational information, not "new news".
    publisher_headlines=[x for x in external_headlines
                         if x.get('editorial_type')!='operational_bulletin']
    latest=max((x.get('published_at','') for x in publisher_headlines),default='')
    now=NOW()
    fresh_6h=sum(1 for x in publisher_headlines if x.get('published_at') and
                 0<=(now-datetime.fromisoformat(x['published_at'].replace('Z','+00:00'))).total_seconds()<=6*3600)
    fresh_12h=sum(1 for x in publisher_headlines if x.get('published_at') and
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
             'official_nws_bulletins':sum(1 for x in external_headlines if x.get('editorial_type')=='operational_bulletin'),
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
        'approved_external_headlines':len(publisher_headlines),
        'official_nws_bulletins':len(external_headlines)-len(publisher_headlines),
        'published_last_60_minutes':sum(
            1 for x in publisher_headlines if x.get('published_at') and
            0 <= (now-datetime.fromisoformat(x['published_at'].replace('Z','+00:00'))).total_seconds() <= 3600),
        'published_last_180_minutes':sum(
            1 for x in publisher_headlines if x.get('published_at') and
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
    # Canonical owner preference survives all scheduled rebuilds and deploys.
    owner_tv_policy=read_json(ROOT/'content/road-tv-policy.json')
    if owner_tv_policy.get('schema_version')!=1 or not owner_tv_policy.get('driver_live_first'):
        raise ValueError('Road TV owner policy contract invalid')
    (path/'road-tv-policy.json').write_text(json.dumps(owner_tv_policy,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
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
