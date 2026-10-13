"""Post-deploy verification of *actual* published market JSON on both domains.

A successful GitHub Pages build does not prove drivmatch.com/news is current.
This smoke check runs after deployment and fails if the user-facing domain
still serves a different source observation, snapshot or instrument.
"""
from __future__ import annotations
import json
import os
from pathlib import Path
import time
from urllib.request import Request, urlopen

ROOT=Path(__file__).resolve().parents[1]
ORIGINS=(
    'https://handsondispatcher.github.io/drivmatch-news',
    'https://drivmatch.com/news',
)

def market_contract(data):
    indicators=data.get('indicators') or {}
    return {
        'generated_at':data.get('generated_at'),
        'quotes':{key:{
            'value':(indicators.get(key) or {}).get('value'),
            'instrument':(indicators.get(key) or {}).get('instrument'),
            'observed_at':(indicators.get(key) or {}).get('observed_at'),
            'source':(indicators.get(key) or {}).get('source'),
            'quote_status':(indicators.get(key) or {}).get('quote_status'),
        } for key in ('usdbrl','diesel','brent')},
    }

def fetch_public_market(origin):
    cache_key=os.getenv('GITHUB_RUN_ID','market-sync')
    url=origin+'/data/market.json?market-sync='+cache_key
    request=Request(url,headers={
        'User-Agent':'DrivMatchMarketWatch/1.0',
        'Cache-Control':'no-cache',
        'Accept':'application/json'
    })
    with urlopen(request,timeout=18) as response:
        return json.loads(response.read(2_000_000).decode('utf-8'))

def verify(producer=fetch_public_market,retries=5,wait=9):
    first=market_contract(producer(ORIGINS[0]))
    last_reason=''
    for attempt in range(retries):
        try:
            custom=market_contract(producer(ORIGINS[1]))
            if first==custom and first['generated_at']:
                return {'status':'synchronized','pages':first,'custom':custom}
            last_reason='Public domain returned a different market snapshot or no generated_at'
        except Exception as exc:
            last_reason=type(exc).__name__+': '+str(exc)[:160]
        if attempt<retries-1:
            time.sleep(wait)
    return {'status':'mismatch','pages':first,'reason':last_reason}

def main():
    result={'status':'mismatch'}
    try:
        result=verify()
    except Exception as exc:
        result={'status':'mismatch','reason':type(exc).__name__+': '+str(exc)[:160]}
    target=ROOT/'build/market-public-sync.json'
    target.parent.mkdir(exist_ok=True,parents=True)
    target.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    if result['status']!='synchronized':
        print('::error title=Public market mismatch::drivmatch.com/news has not been verified against GitHub Pages market.json:',result.get('reason'))
        raise SystemExit(1)
    print('PUBLIC MARKET PASS: current identical quoted observations on GitHub Pages and drivmatch.com/news')

if __name__=='__main__':
    main()
