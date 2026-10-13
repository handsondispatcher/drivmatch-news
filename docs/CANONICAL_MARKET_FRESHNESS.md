# DrivMatch News — Canonical Market Data Freshness & Close Policy

Status: ACTIVE — 2026-10-13. Applies to the top utility strip, sidebar, mobile, every locale and every published build.

## Principles
1. NEVER show outdated, unverified or made-up rates as current. Refreshing the web page, redeploying HTML or checking a feed does not advance an unchanged price's observation date.
2. Each instrument has independent publication cadence, market-open status, session close, data provenance and redistribution rights. Render observed_at (actual source observation), source, and accurate status. Never confuse observed_at with build/generated_at.
3. USD/BRL commercial spot: use an explicit provider-authorized spot contract (HTTPS, symbol=USD/BRL, instrument=spot, price_type=commercial, source, source_url, authenticated if needed). During an open session, reject any observation older than 5 min. When the provider explicitly reports closed, show its verified close_date/close_value until the next verified price, up to a bounded five-day nontrading window. Never fabricate a close using arbitrary prior ticks. PTAX from the Banco Central is a distinct daily official reference, not interchangeable with real-time commercial spot, and must be labeled PTAX when used as fallback.
4. US on-highway diesel: GASDESW / EIA published weekly, mirrored by FRED. A survey published about Monday 5 PM US Eastern (Tuesday on specified holidays), NOT intraday exchange trading. Hold latest genuine published weekly observation until the next release; alert when delayed. Reject observations older than 12 days from the source-observation date. Never label weekly diesel price as LIVE.
5. Brent oil: default DCOILBRENTEU / EIA daily Brent Europe spot reference, mirrored by FRED: daily observation, sometimes lagging, NOT real-time or Brent futures. Keep latest attributed published observation through next scheduled release; reject observations older than 5 days. OPTIONAL licensed physical Brent spot feed requires BRENT_SPOT_URL, BRENT_REDISTRIBUTION_AUTHORIZED=true, optional BRENT_SPOT_TOKEN (GitHub Actions secret), and optionally BRENT_PUBLIC_URL for a licensed CORS-accessible feed polled every 15 seconds in-browser (without exposing any secret). Schema: instrument=brent_spot, unit=USD/bbl, session_status=open|closed; open quotes max 5 minutes, closed quotes contain verifiable close_date and close_value, 5-day cap. Never substitute futures/CFD silently.
6. Source outages: use previously verified quote of the SAME instrument only while still inside the bounded source window; otherwise show — / temporarily unavailable with alert. Do not extend freshness by reusing cached generated_at.
7. Protected published data includes provider identity, HTTPS source link, observation date/time, cadence/status, close evidence where available, and percentage change only when valid. No fabricated numbers or percentages.

## Refresh and operational QA
- GitHub Actions publication workflow runs on its existing TARGET ten-minute schedule, subject to GitHub delays. Authorized live currency endpoint is polled on page every 15 seconds; static market JSON every 5 minutes. Neither is truly live when provider is unavailable.
- After every build verify schemas, source age, observations and status. Missing quotes should trigger actionable warnings and never restore a frozen number.
- Exchange holidays and publication times matter; never assume 24/7 exchange market or that diesel surveys are traded securities.
- Commercial USD/BRL or Brent spot can only be displayed as live when the matching provider and redistribution authorization are configured.
- No changes to advertising art, ads placement, editorial chronology, languages or layout are authorized by this rule.

## Sources
US EIA diesel: https://www.eia.gov/petroleum/gasdiesel/learnmore.php ; FRED: https://fred.stlouisfed.org/series/GASDESW
EIA Brent daily on FRED: https://fred.stlouisfed.org/series/DCOILBRENTEU
BCB PTAX: https://dadosabertos.bcb.gov.br/dataset/dolar-americano-usd-todos-os-boletins-diarios
