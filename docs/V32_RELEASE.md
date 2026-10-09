# DrivMatch News v32 — Consolidated release baseline

**Version:** v32  
**Date consolidated:** 2026-10-09  
**State:** DEVELOPMENT / PRELAUNCH — `public_launch_approved=false`  
**Official publisher:** DrivMatch News — um produto da Hands On Dispatcher LLC.

## Why v32 exists

v32 is a consolidation of the **v31 editorial interface**, the approved visual brand, and improvements committed to `main` after v31. This is **not** a rollback to v18. The old `reference/drivmatch_news_v18_aprovada.html` remains a historical archive only.

## What is integrated in the actual repository

- **Editorial layout v31:** one prominent lead/photo story, three related stories, the news list, filters, pagination and multilingual site shortcuts with flags.
- **Reading experience:** per-article summary/context and, where available and licensed, original editorial text; PT/EN/ES choices in the article, explicit links to the original publisher and honest guidance where automatic translation is not available.
- **Sharing:** WhatsApp, Facebook, Threads, X, LinkedIn, Telegram, Reddit, Pinterest, email, link copying, native system share where supported, story-card image and distinct OG pages (1200 × 630 JPEG). The **verified share host** is GitHub Pages; a custom-domain `/news/share/*` proxy is not implied.
- **Brand:** the official blue-gradient horizontal PNG remains unmodified. The exact institutional wording is maintained in the footer.
- **Weather:** Ventusky embed on desktop and mobile, seasonally selected rain/snow layer; NWS forecasts for US travel corridors with unavailable results shown honestly.
- **News monitoring:** an 82-source registry as of 2026-10-09 (RSS publishers, Google News *discovery only*, and sources requiring human review), geography/relevance gates, deduplication, source attribution, freshness and separate editorial-approval status. A headline monitor is not equivalent to a complete, reviewed article.
- **Markets:** diesel and Brent with dated attribution, USD/BRL **commercial spot only** or clearly marked verified closing reference, Class 8 and named trucking equities only when provider data and redistribution permissions exist. No synthetic market quotes.
- **Integration output:** `/data/live-feed.json` with the last 24 hours of time-bounded news headlines in PT/EN/ES for the **separate** DrivMatch Live application. This does **not** activate traffic, crash or severe-weather alerts on the separate application.

## Single source of truth

- `content/release.json` defines v32 and keeps `public_launch_approved=false`.
- `site/index.html` exposes v32 in a visible, unobtrusive masthead label, HTML dataset and metadata.
- `scripts/update.py` stamps `site/data/content.json` with `site_version=v32` and regenerates `site/data/release.json` on each build.
- `README.md` (current top section) and this document supersede all old "v18 current" instructions, which are historical.
- The version gate requires Python unit tests, client JS smoke, Playwright checks at 360 / 390 / 768 / 1440 px and a post-deploy check for the public HTML and manifest.

## Explicitly not claimed as complete

1. The product is **NOT authorized for public-launch announcements**. Follow issue #18 for final review and approval.
2. USD/BRL live spot, equities and Class 8 feeds require authorized vendor access, and potentially redistribution contracts. No API key or rights are inferred.
3. Some publisher feeds fail or require manual review. The editor must verify sources, dates, licenses and rights; crawler headlines are not automatically approved full reports.
4. The embedded weather map and illustrative photos need applicable commercial/redistribution rights verified for the final business use.
5. `drivmatch.com/live`, the main home-page ticker and operational alerts belong to a **different** deployment and have not been altered by the News repository; see `docs/DRIVMATCH_LIVE_INTEGRATION.md`.
6. Custom-domain deep links and real WhatsApp preview quality should undergo end-to-end acceptance testing on real devices.

## Historical pull requests

- **PR #7** is an old v31 visual branch. Its relevant editorial hierarchy and site-language controls were *ported* to `main` by PR #17. Do not merge the stale PR wholesale.
- **PR #9** is an old partial share implementation. `main` contains a more complete, tested social sharing flow. Do not merge the stale PR wholesale or replace the newer code with it.
- **PR #16** fixed stale source snapshots and the publisher wording.
- **PR #17** restored the v31 editorial lead and related items on top of the later improvements.

## Verification and rollback

```sh
python -m unittest discover -s tests
node tests/test_client.js
python scripts/update.py --offline
python scripts/build_share_pages.py
npm ci
npx playwright install --with-deps chromium
npm run test:browser
```

The GitHub Actions workflow runs automated tests on PRs; only a passing `main` build deploys the site. Any public claim about the v32 deployment needs the deployment smoke test to pass, not merely a successful PR. If there is a visual regression, revert the **v32 consolidation** commit, not the historically approved v31 components.

**Release classification:** Versioned development build (v32). NOT FINAL / NOT PROMOTION-APPROVED.
