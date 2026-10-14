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

# Separate visual deployment success from actual market-feed availability.
# A valid site that lacks licensed realtime providers MUST NOT be marked live.
import json
for origin in SITES:
    try:
        def public_json(path):
            request=Request(origin+path+'?source-audit=20261014',headers={
                'Cache-Control':'no-cache','Accept':'application/json',
                'User-Agent':'Mozilla/5.0 DrivMatchNews-MarketFeed-Audit'})
            with urlopen(request,timeout=16) as response:
                return json.loads(response.read(400_000).decode('utf-8'))
        quotes=public_json('data/market.json')
        runtime=public_json('data/runtime.json')
        indicators=quotes.get('indicators') or {}
        print('MARKET_DATA_ON_PUBLIC_DOMAIN',origin,'generated_at=',quotes.get('generated_at'),
              'market_data=',{
                key:{field:(indicators.get(key) or {}).get(field) for field in
                     ('instrument','observed_at','quote_status','session_status','source')}
                for key in ('usdbrl','diesel','brent')},
              'browser_feeds_configured=',{
                'usdbrl_spot':bool(runtime.get('spot_url')),
                'brent_spot':bool(runtime.get('brent_spot_url'))},
              flush=True)
        if not indicators.get('usdbrl'):
            print('::warning title=USD/BRL feed not available::'+origin+' has no verified USD/BRL commercial rate',flush=True)
        if not indicators.get('brent') or (indicators['brent'].get('quote_status')=='historical_reference'):
            print('::warning title=Brent feed not current::'+origin+' only has a historical or unavailable Brent reference',flush=True)
    except Exception as err:
        print('::warning title=Unable to verify live market payload::'+origin+' '+type(err).__name__+': '+str(err)[:110],flush=True)

