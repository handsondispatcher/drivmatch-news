# DrivMatch News v34.10 — War Room visual / product / QA (10 October 2026)

## Authority and rollback
- Official baseline: v34.9, commit `16de69068cc97223df682a76709ff930f7e88435`.
- Frozen rollback: `snapshot/v34-9-before-v34-10-warroom-2026-10-10`.
- Owner's five visual screenshots and instructions are change authority. No discretionary redesign of other sections, banner geometry, video, news schedule or copyrights.

## Brand review — alternatives and recommendation
- **A. Official blue gradient artwork on neutral near-black #020408 — CHOSEN.** Preserve the exact `assets/logo-drivmatch-news.png` file (symbol, wordmark, hues, horizontal format, no filters). Separates the hero blue from a competing navy band.
- **B. White artwork on navy — NOT APPROVED.** High-contrast newspaper look can work (G1-style analogy) but requires a legally/visually approved official white-logo asset and an explicit owner decision; do not recreate, invert or convert logo in CSS or code.
- Institutional footer and approved three flag/language selectors unchanged. Masthead has NO category navigation; obsolete CSS has a fail-safe hidden rule, DOM test enforces absence.

## Five owner corrections
1. Nav `Capa / Caminhoneiros / Fretes / Regulamentação / Segurança / Tecnologia` must remain absent from HTML and from DOM. No duplicate navigation returning via script, regardless of locale.
2. Background must remain neutral black; logo artwork must never be modified.
3. Weather occupies a compact field **Cidade, UF** between actual weather and risk. Reader types a city/state (e.g. Tampa, FL), presses Enter/OK, and valid NWS-forecast cities pin across refresh using local preference. Datalist suggestions come from the currently valid NWS-backed locations. Unsupported/unavailable cities return a clear message, never a guessed forecast. Selecting ↻ returns to automatic mode, rotating **every 10 seconds** among pre-collected, timestamp-verified city forecasts. This is a display rotation, **not** a new external API request every 10 seconds. Weather source refresh remains 15 minutes, so no fabricated 10-second observations. To cover all ~20k US municipalities later, a licensed/authorized geocoder and operational load testing are required; this baseline covers the verified NWS cities included in the existing network.
4. News category filter pills removed from the public upper section; the news promotional owned-media banner and right-side owned-media banner remain in place. Footer archive search and existing editorial categories remain functional. Count of 33/other article totals is editorial telemetry, must not appear for readers.
5. Remove exact public kicker 'PUBLICIDADE · DRIVMATCH' in all languages; keep promotional copy and outbound links to DrivMatch only. The brand affiliation remains apparent in the creative and is described for accessibility as an institutional promotional area. Third-party paid advertisements must have separate sponsorship disclosure and approval.

## Operational controls
- All v34.10 CSS/JS references carry v34-10 cache identifiers to prevent stale resource mixing across deployments.
- Release manifest asserts `v34.10` and remains `development_prelaunch` / public launch approval false.
- Regression by width 360, 390, 768, 944, 1440: no horizontal overflow/collision, official logo unchanged, masthead black, nav/categories absent, ad labels removed, count hidden, city search usable, invalid city rejected, weather pin persists across >10 seconds, and the full prior publishing/reading suite.
- Production domain and deployed release version are independently verified by GitHub Actions after merge; CI iframe stubs do not prove that a native live road camera is playing (issue #35).
- Editorial freshness / regular sources remain under independent issue #36. No manual conversion of old stories into new stories.

## Change control
Frozen until owner approves otherwise: official gradient-blue logo, black header, no navigation strip, the single news promotional region, the side banner, readable three-language buttons, city/state search and auto 10-second display rotation, absence of article counts and ad-brand eyebrow.
