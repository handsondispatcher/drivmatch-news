# WAR ROOM v34.7 — Reader layout freeze and direct camera

Date: 2026-10-10. Owner-approved screenshot references: five-column quote and weather strip, compact related stories, no public edition metadata, open camera instead of map. Baseline: v34.6 `33e75e0c46767a6c37b118d2bfbf7831f48c541b`. Snapshot: `snapshot/v34-6-before-v34-7-2026-10-10`.

## FROZEN
1. Public Portuguese title **Cotações e Mercado** on both sidebars. English **Quotes & Markets**, Spanish **Cotizaciones y Mercado**.
2. Desktop top bar: **Dólar / Diesel EUA / Petróleo Brent / local weather / risk** in that exact order, with icons, labels, legitimate quotes and signed changes when available. Reference image is for visual layout, *not an authorization to invent numbers*. Stable weather city preference Tampa FL; if unavailable, deterministic fallback to actual available city. Never rotate random cities on a 10-second timer. On mobile only responsive wrapping is authorized.
3. No reader-visible "EDIÇÃO DIGITAL", release number, "Sources checked" or "Newest identified story". Operational provenance still resides in version metadata, site data and build logs; no masking errors from editors. Article dates and source attribution remain legitimate editorial facts (only diagnostic paragraph hidden).
4. "Leia o contexto no DrivMatch News" cannot orphan "News" on a new line; compact related-story cards only, logo unchanged, three language options unchanged, search only above footer, no invented section title.
5. Ventusky → open camera → Cotações e Mercado. Use a **specific camera video iframe** without reader selecting from a mini map. YouTube/Twitch verified driver/cargo feed receives priority when available. No false LIVE label when only an iframe load is known.

## Camera player providers
CamStreamer lists its own iframe code on pages for:
- Bridge of Lions, St Augustine FL: https://camstreamer.com/live/stream/110525310
- Mid-Bay Bridge, Destin FL: https://camstreamer.com/live/stream/101125169
- Peace Bridge Canada Bound: https://camstreamer.com/live/stream/159142974-peace-bridge-canada-bound

These are direct embedded players, **not certified operational live feeds**. In particular, the Peace Bridge camera is Canada-bound, not the user-preferred US-bound inspection entrance. Failover on iframe load failure does not detect frozen images; real movement and actual stream validation are separate production acceptance gates. Do not claim I-4 selected while showing another Florida location. No scraping or rehosting. Preserve FL511 / MileCheck / Nevada source research for further authorized provider integrations.

## Remaining release gates
- Package, JavaScript and Playwright in widths 360/390/768/1440.
- Source and attribution/permission and real playback checks at official domain are independent of mocked Playwright.
- Editorial freshness investigation remains open in issue #36: a successful ingestion run with stale articles is a failure of the news freshness target, not a new article.
- Publish only through successful GitHub Actions + domain version check.
- Formal public launch approval remains false, despite site already accessible.
