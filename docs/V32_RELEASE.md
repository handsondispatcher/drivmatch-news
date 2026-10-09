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

## Photographic news thumbnails — v32 correction (09/10/2026)

- **Screenshot regression resolved in source:** previously `site/assets/app.js` intentionally forced `external_link` stories to use unique SVG headline illustrations. A headline from the source pipeline consequently appeared as a blue graphic instead of an image.
- **New build workflow:** `content/photo-library.json` lists reviewed Commons photos and license/credit/source URL; `scripts/build_news_photos.py` downloads and verifies actual JPEGs, resizes them, and writes `site/assets/news-photos/*.jpg` plus `site/data/news-images.json`. It refuses unknown domains and never scrapes photographs from publishers.
- **Consumer UI:** `site/assets/app.js` loads `data/news-images.json` alongside live headlines, selecting unique, topical photos from the manifest for hero, related, list and article modal, with photo credit linked to Wikimedia Commons. When no valid image is available, it uses a unique labeled vector card rather than a broken image.
- **Social compatibility:** `scripts/build_share_pages.py` reuses the verified local images when composing 1200×630 social previews.
- **Editorial accuracy:** These are **illustrative archival photographs**; they are **not** claimed to depict the reported event, carrier, weather incident or location. Attribution includes license, author and crop/resizing. Actual event-specific publisher photographs can only be added when reuse/redistribution rights are obtained.
- **Gate:** The v32 photo downloader must produce at least 16 verified local JPEGs and cover at least 12 current external headlines when the feed has 12+ items. Mobile and desktop Playwright checks validate real loaded dimensions, local asset URLs and illustrative-photo disclosure. On network failure, the deployment gate fails closed, retaining the last successful published edition rather than silently replacing all photographs with graphics.

## Single source of truth

- `content/release.json` defines v32 and keeps `public_launch_approved=false`.
- `site/index.html` exposes v32 in a visible, unobtrusive masthead label, HTML dataset and metadata.
- `scripts/update.py` stamps `site/data/content.json` with `site_version=v32` and regenerates `site/data/release.json` on each build.
- `README.md` (current top section) and this document supersede all old "v18 current" instructions, which are historical.
- The version gate requires Python unit tests, client JS smoke, Playwright checks at 360 / 390 / 768 / 1440 px and a post-deploy check for the public HTML and manifest.

## v32 mobile article/share reader — regression and correction (09/10/2026)

Android screenshots showed the article modal's two primary sharing controls pushed below the initial viewport. The earlier CSS already contained a sticky-footer intention but later selectors overrode it with relative/static positioning. This was not an invitation to redesign the newspaper.

The correction in `site/index.html` restores an always-visible mobile share dock with the **Compartilhar** blue icon button on the left and **Copiar link** on the right, with safe-area spacing. The source-language buttons, article hero, title, attribution and link presentation are compact on <=650px, and padding reserves room for the dock so it never hides the last paragraph. The share picker opens above the dock inside the viewport. Larger screens keep existing styling. Mobile Playwright regression asserts both buttons are visible **before scrolling**, after scrolling, and that the picker fits at 360px and 390px.

**DO NOT propose copy-paste CSS patches to the user** when GitHub access is connected. Implement fixes, run tests, verify production and carry forward decisions in [CONTINUIDADE_DRIVMATCH_NEWS.md](CONTINUIDADE_DRIVMATCH_NEWS.md).

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
