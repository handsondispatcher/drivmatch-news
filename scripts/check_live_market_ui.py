"""Independent external verification that real visitors receive clean market UI."""
from urllib.request import Request, urlopen
import time

SITES = [
    "https://handsondispatcher.github.io/drivmatch-news/",
    "https://drivmatch.com/news/",
]
MARKERS = (
    'assets/utility-strip.js?v=market-links-clean-v1-20261013',
    'assets/app.js?v=market-links-clean-v1-20261013',
    'id="top-usd-label" class="dm-util-label dm-market-ref-link"',
    'id="top-brent-label" class="dm-util-label dm-market-ref-link"',
)
UNSUPPORTED = ('<tv-tickers', 'widgets.tradingview-widget.com/w/en/tv-tickers.js')

def verify_site(origin):
    url = origin + '?market-ui-check=20261014-verified'
    req = Request(url, headers={'User-Agent':'DrivMatchNews/Market-UI-Audit','Cache-Control':'no-cache'})
    with urlopen(req,timeout=20) as resp:
        html=resp.read(1_500_000).decode('utf-8','replace')
    absent=[t for t in MARKERS if t not in html]
    bad=[t for t in UNSUPPORTED if t in html]
    print('PUBLIC_MARKET_UI', origin, 'length=',len(html),
          'missing=',absent,'unsupported=',bad,flush=True)
    if absent or bad:raise ValueError('Site serves stale TradingView-widget version')
    for path,needle in [
        ('assets/utility-strip.js','localized(\'Dólar\',\'US Dollar\',\'Dólar\')'),
        ('assets/app.js',"class=\"sideitem market-live-row\"")
    ]:
        req=Request(origin+path+'?market-ui-check=20261014-verified',
                    headers={'Cache-Control':'no-cache',
                             'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36',
                             'Accept':'text/javascript,application/javascript,*/*'})
        with urlopen(req,timeout=20) as resp:
            body=resp.read(500_000).decode('utf-8','replace')
        if needle not in body:raise ValueError(origin+path+': outdated script still served')

errors={}
for site in SITES:
    for attempt in range(6):
        try:
            verify_site(site)
            errors.pop(site,None)
            break
        except Exception as exc:
            errors[site]=type(exc).__name__+': '+str(exc)
            print('CHECK_RETRY',site,attempt+1,errors[site],flush=True)
            if attempt < 5:time.sleep(6)
if errors:
    for host,reason in errors.items():
        print('::error title=Stale public market UI::'+host+' '+reason)
    raise SystemExit(1)
print('PASS: both public domains serve linked clean market titles with no unsupported widgets')
