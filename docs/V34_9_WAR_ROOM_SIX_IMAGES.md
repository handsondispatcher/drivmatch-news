# WAR ROOM — DrivMatch News v34.9 / User-approved six-image correction
Date: 2026-10-10. Baseline snapshot: `snapshot/v34-8-before-v34-9-six-requests-20261010` at `ebe47c6ba961db5c19fa9a1b13537c8f8702a8b4`.

## Immutable public contract
1. **No top bar Capa / Caminhoneiros / Fretes / Regulamentação / Segurança / Tecnologia.** The extra newsroom navigation is deleted, not simply hidden by a conditional template. Archive search stays only above the footer.
2. **No news category pills under NOTÍCIAS.** Replace that full region with a visually complete, explicitly labeled owned-media DrivMatch advertisement. No fake paid advertiser, no unlabeled sponsored editorial.
3. **Side advertisement** below Cotações e Mercado fills previously unused sidebar space with a second owned-media creative, clearly labeled PUBLICIDADE and linked to the official brand. External sponsors require explicit creative, contract, disclosure and change control.
4. **Weather city/state selector** between current weather and risk pill. Selecting an available city fixes it locally across page refreshes; Auto rotates to another verified weather forecast every 10 minutes, with weather data refreshed every 15 minutes. Manual choice must never be overwritten by the rotation clock. City rotation may temporarily show only available forecast locations; unavailable location must never display fabricated conditions.
5. No public sentence 'Seleção por relevância e recência do feed; confira a fonte original.' beneath five headlines. Keep five photographic headlines and verified publisher/source information on actual story cards.
6. Language buttons Portuguese / English / Español each have their own border, no second enclosing language-picker border/shadow, and remain responsive.

## Source and freshness principle
- GitHub Actions rebuilds are **targeted every 10 minutes** (not a guaranteed instantaneous news service); the browser reloads deployed headlines every 60 seconds. Never claim time-zero true real-time RSS if the publisher isn't pushing.
- Fresh verified first-party URLs should appear to the reader **in their original language** if human-reviewed/localized title is not yet available. Show an ORIGINAL / original-language notice rather than blocking publication based solely on translation availability. Full article text is NOT republished.
- Source history cache uses content-addressed original article URLs, trusted first-party domains, original publication timestamps, 48h TTL, and retains valid candidates during temporary RSS failures. No feed's 403/503 is solved by fabricating a new story.
- Aggregator RSS search-only feeds remain discovery, not publishable source-of-record; date, US relevance, cross-border scope and license constraints remain.
- Watch issues #35 for native road-camera playback and #36 for persistent source outages, coverage of weekends and repeatable freshness.

## Gate
Node app smoke and Python publication tests; Playwright at 360,390,768,944,1440px; no nav/pills, two banners, five source-based highlights, locale-button outlines, 10-minute city selection, no false headline timestamps; GitHub Pages + custom domain version and market provenance checks. FROZEN v34.9 only after all tests pass.