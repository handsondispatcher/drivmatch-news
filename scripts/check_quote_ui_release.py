"""Post-deployment acceptance check for the user-visible compact market ticker.

Assert both GitHub Pages and the real custom domain serve the approved CSS
and JS, not stale cached assets. Only presentation assets are checked here;
numeric source quality remains the responsibility of audit_market.py.
"""
from __future__ import annotations

import os
import time
from urllib.request import Request,urlopen

ORIGINS=(
 'https://handsondispatcher.github.io/drivmatch-news',
 'https://drivmatch.com/news',
)
CANARIES={
 '':'CANONICAL COMPACT QUOTES: values and percentage only',
 'assets/utility-strip.js':'MARKET_QUOTE_UI_RELEASE: compact-prices-only-20261013',
 'assets/app.js':'MARKET_QUOTE_UI_RELEASE: compact-prices-only-20261013',
}

def read_live(url):
    request=Request(url,headers={
        'User-Agent':'DrivMatchNewsQuoteUI/1.0',
        'Cache-Control':'no-cache',
        'Pragma':'no-cache',
    })
    with urlopen(request,timeout=15) as resp:
        return resp.read(2_000_000).decode('utf-8','replace')

def verify(fetch=read_live,attempts=4,delay=10):
    missing={}
    for origin in ORIGINS:
        for path,marker in [*CANARIES.items(), ('', 'VELOCITY:BRENT'), ('', 'tv-single-ticker')]:
            url=origin.rstrip('/')+'/'+path+'?quote-ui-check='+os.getenv('GITHUB_RUN_ID','manual')
            ok=False
            for attempt in range(attempts):
                try:
                    if marker in fetch(url):
                        ok=True
                        break
                except Exception as exc:
                    missing[origin+' / '+path]=type(exc).__name__
                if attempt+1<attempts:time.sleep(delay)
            if not ok:
                missing.setdefault(origin+' / '+path,'Missing approved compact quote UI release marker')
    return missing

def main():
    failures=verify()
    if failures:
        for path,reason in failures.items():
            print('::error title=Quote UI deployment mismatch::'+path+': '+reason)
        raise SystemExit(1)
    print('PUBLIC MARKET UI PASS: compact price-only layout active on Pages AND drivmatch.com/news')

if __name__=='__main__':
    main()
