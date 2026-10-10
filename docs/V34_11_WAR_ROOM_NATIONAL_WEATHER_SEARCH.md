# WAR ROOM — v34.11 US-wide City Forecast Search / Reader UX
Date: 10 October 2026. Owner screenshot: typed St Charles not found; three crowded buttons Digitar/OK/↻.
Rollback: snapshot/v34-10-before-v34-11-city-search-20261010 at bfee2a7f0ab404abd22d737d6ab5210a37113c31.

## Decision — product, UX, data, quality
- No more pretending the manually curated ~170 truck-route weather cities are a national search service.
- Publish a full search gazetteer from the official U.S. Census Bureau's 2025 National Places Gazetteer, with unambiguous city, two-letter state, and coordinates. Parser fail-closed, sanity checked for >20,000 places and both St. Charles, Missouri / St. Charles, Illinois. Search locally in browser: typing stays private; no third-party geocoder or invented coordinates.
- ONE compact user interaction: Previsão do tempo label; search box with city/state placeholder, datalist suggestions, and one adjacent magnifying-glass icon that submits on click or Enter. No Digitar or separate OK buttons. Clearing the query restores the automatically rotating featured city, while manually confirmed location stays pinned in local preference.
- Search case/diacritics/punctuation tolerant; St Charles yields state disambiguation, St. Charles, MO or St Charles IL selects correctly; neither selects an arbitrary St Charles.
- After choosing a place, ask api.weather.gov/points/{lat},{lon}, validate official HTTPS api.weather.gov forecast URL, fetch its real periods, accept only trustworthy dated high+low+conditions and present source. Cache the confirmed forecast in client for 15 minutes, refresh pin after 20 minutes. If NWS unavailable, display honest error with direct official forecast map link. No fabricated weather.
- Keep the approved 10-second automatic display rotation among existing pre-fetched NWS city forecasts; do not hit NOAA every ten seconds. Manual choice survives automatic clock ticks and page reloads.
- Keep original approved navy-free dark brand bar, official gradient blue master logo, 3-language navigation, six market/weather elements and their responsive arrangement, two house banners, editorial layout/translation/dollar provenance. Do not redesign.
- Publication gate: snapshot backup, Python Census ZIP tests, real Census national ZIP download in GitHub Actions, St Charles MO/IL coordinates in published JSON, Playwright mock NWS response tests at six viewport sizes incl 1440 & 360, language/invalid queries and pin across 10 seconds. PR review then main CI/deploy/custom domain version. Index and real provider status independently audited; no claim of national coverage unless artifact and network tests pass.

## Privacy and deployment
- Public Census city database contains public geodata only, without reader information. Selected city stored on the reader device. Selecting a city sends its lat/lon to NOAA's API, under NOAA's use/availability constraints.
- Scheduled build caches the official 2025 Gazetteer (does not refetch 1.2 MB every 10 minutes). Backend source index is not an API proxy; live data is fetched only on explicit selection.
- Census 2025 place inventory covers designated incorporated places and CDPs, not every informal neighborhood or address. Search must say não encontrado rather than misrepresent completeness.
- Browser NWS interception in CI tests API-contract handling, not guaranteed real-time NOAA uptime. Publisher API interruptions remain explicit user-visible errors.