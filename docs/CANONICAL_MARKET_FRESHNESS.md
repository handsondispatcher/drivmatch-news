# DrivMatch News — Canonical Market Data Freshness & Close Policy

Status: ACTIVE — 2026-10-13. Applies to the top utility strip, sidebar, mobile, every locale and every published build.

## Principles
1. NEVER show outdated, unverified or made-up rates as current. Refreshing the web page, redeploying HTML or checking a feed does not advance an unchanged price's observation date.
2. Each instrument has independent publication cadence, market-open status, session close, data provenance and redistribution rights. Render observed_at (actual source observation), source, and accurate status. Never confuse observed_at with build/generated_at.
3. USD/BRL commercial spot: use an explicit provider-authorized spot contract (HTTPS, symbol=USD/BRL, instrument=spot, price_type=commercial, source, source_url, authenticated if needed). During an open session, reject any observation older than 5 min. When the provider explicitly reports closed, show its verified close_date/close_value until the next verified price, up to a bounded five-day nontrading window. Never fabricate a close using arbitrary prior ticks. PTAX from the Banco Central is a distinct daily official reference, not interchangeable with real-time commercial spot, and must be labeled PTAX when used as fallback. First try the BCB Olinda OData period API to get the most recent dated sell bulletin (intraday/partial until confirmed final), then SGS 1, then the old commercial close. Never imply intraday PTAX is a commercial FX trade.
4. US on-highway diesel: GASDESW / EIA published weekly, mirrored by FRED. Weekly U.S. EIA retail diesel reference, generally released on Tuesday around 10 AM U.S. Eastern for Monday's surveyed prices (Wednesday after Monday holidays), NOT intraday exchange trading. The next confirmed release after October 5, 2026 is Wednesday October 14, 2026. Hold latest genuine published weekly observation until the next release; alert when delayed. Reject observations older than 12 days from the source-observation date. Never label weekly diesel price as LIVE.
5. Brent oil: default DCOILBRENTEU / EIA daily Brent Europe spot reference, mirrored by FRED: daily observation, sometimes lagging, NOT real-time or Brent futures. Display official daily references up to 5 days old as current-to-source (not live). If the verified latest EIA record is 6–21 days old, retain it ONLY with explicit HISTORICAL / NOT CURRENT warning, suppress change arrow, and link to ICE Brent Futures as a distinct (not equivalent) traded instrument. After 21 days without new official data, hide the value. OPTIONAL licensed physical Brent spot feed requires BRENT_SPOT_URL, BRENT_REDISTRIBUTION_AUTHORIZED=true, optional BRENT_SPOT_TOKEN (GitHub Actions secret), and optionally BRENT_PUBLIC_URL for a licensed CORS-accessible feed polled every 15 seconds in-browser (without exposing any secret). Schema: instrument=brent_spot, unit=USD/bbl, session_status=open|closed; open quotes max 5 minutes, closed quotes contain verifiable close_date and close_value, 5-day cap. Never substitute futures/CFD silently.
6. Source outages: use previously verified quote of the SAME instrument only while still inside its bounded source window; for Brent, only a confirmed historical reference may be retained up to 21 days with a warning. Otherwise show — / temporarily unavailable with alert. Do not extend freshness by reusing cached generated_at.
7. Protected published data includes provider identity, HTTPS source link, observation date/time, cadence/status, close evidence where available, and percentage change only when valid. No fabricated numbers or percentages.

## Refresh and operational QA
- GitHub Actions publication workflow runs on its existing TARGET ten-minute schedule, subject to GitHub delays. Authorized live currency endpoint is polled on page every 15 seconds; static market JSON every 5 minutes. Neither is truly live when provider is unavailable.
- After every build verify schemas, source age, observations and status. Missing quotes should trigger actionable warnings and never restore a frozen number.
- Exchange holidays and publication times matter; never assume 24/7 exchange market or that diesel surveys are traded securities.
- Commercial USD/BRL or Brent spot can only be displayed as live when the matching provider and redistribution authorization are configured.
- No changes to advertising art, ads placement, editorial chronology, languages or layout are authorized by this rule.

## Reliable acquisition and cross-check — 2026-10-13
- USD/BRL commercial: approved licensed commercial spot feed ONLY when authorized; an unavailable feed cannot be silently replaced by UOL scraping. Prioritize Banco Central Olinda PTAX OData bulletins for a separate official USD/BRL reference. Mark the boletim as "intraday/partial" unless tipoBoletim explicitly equals "Fechamento". Never advertise PTAX as traded commercial spot.
- Reader's FX cross-check: https://economia.uol.com.br/cotacoes/cambio/ . This is a **LINK**, not a data provider. UOL website terms restrict unauthorized automated extraction and redistribution. If the UOL page itself is unavailable, it must never suppress verified official reference data.
- US diesel primary official API: https://api.eia.gov/v2/petroleum/pri/gnd/data/ , series EMD_EPD2D_PTE_NUS_DPG, frequency weekly, metric USD/gal. EIA_API_KEY registered with https://www.eia.gov/opendata/register.php and stored ONLY as GitHub Actions secret. When unconfigured, maintain existing dated, separately attributed EIA/FRED publication adapter pending rights review.
- Brent primary official API: https://api.eia.gov/v2/petroleum/pri/spt/data/ , series RBRTE, frequency daily, USD/barrel. Same EIA_API_KEY secret. The EIA publication is a historical Brent Europe spot observation, **not live ICE traded futures**. A separate licensed Brent commercial feed is required for true intraday trading indication.
- Before publishing a number, validate provider, instrument, observed_at, units, cadence, publication age and whether it is an observed quote, last close, historical reference or unavailable. No unsourced HTML scraping or copied numbers from news headlines.
- Source adapter changes are limited to market quotes; existing adverts, route/weather modules and editorial ordering must remain unchanged.

## Sources
US EIA diesel: https://www.eia.gov/petroleum/gasdiesel/learnmore.php ; FRED: https://fred.stlouisfed.org/series/GASDESW
EIA Brent daily on FRED: https://fred.stlouisfed.org/series/DCOILBRENTEU
BCB PTAX: https://dadosabertos.bcb.gov.br/dataset/dolar-americano-usd-todos-os-boletins-diarios

## Reader reference links
- US diesel weekly EIA retail survey: TradingView FRED:GASDESW (https://www.tradingview.com/symbols/FRED-GASDESW/). Keep units USD/gal and frequency weekly.
- Distinct traded diesel futures: TradingView NYMEX:HO1! (https://br.tradingview.com/symbols/NYMEX-HO1%21/). Do not substitute for retail diesel.
- Brent futures: Investing.com (https://br.investing.com/commodities/brent-oil). Do not substitute for EIA physical Brent daily spot; identify contract and possible delay.
- These references are clickable external sources, not automated price APIs. Display data inside official attributed vendor widgets only after separate site-layout review, respecting vendor terms and feed delays.
