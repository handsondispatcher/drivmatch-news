# DrivMatch News — War Room v34.8 | User Approved Five-Image Freeze
Date: 10 October 2026. Canonical rollback snapshot/v34-7-before-20261010-reader-corrections (commit 7f9dd188727d37003ebb08eb6900b8dbd344ec52).

## Immutable until explicit owner Change Control
1. Copyright footer retains the exact Hands On Dispatcher LLC statement, followed by the current release v34.8. Masthead never shows version/edition.
2. 'Leia o contexto no DrivMatch News' is ONLY a navigation CTA for the three related 'Leia Também' cards, not a newly reported DrivMatch analysis. No CTA in hero or general Noticias list; keep factual article dates/sources.
3. Language: Brazilian, US and Spanish flag buttons are individually bordered and horizontally compact. No outer picker border or selected-button double shadow; pt-BR, en-US, es-419 maintained.
4. Panorama arrows/dots positioned above the HERO area; advance ONLY hero picture/headline. Exactly three related stories remain fixed when carousel is navigated. Responsive widths supported.
5. Dollar: verify actual commercial USD/BRL 09/10/2026 close R$4.9850 (-0.79%) with source https://economia.uol.com.br/cotacoes/noticias/redacao/2026/10/09/dolar-fecha-abaixo-de-r-5-e-cai-443-na-semana-bolsa-sobe.htm. BCB PTAX official sell 09/10 R$4.9892 is a DIFFERENT rate, auto-request from https://api.bcb.gov.br/dados/serie/bcdata.sgs.1/dados/ultimos/5?formato=json. Quote must have real date/source and expiry; prefer freshest commercial close for equal dates, otherwise a labeled BCB reference. Never fabricate or present stale data as current.
6. News: published source event date is never replaced by build date. Missing eligible headlines on Saturday is an editorial coverage alert (P0 #36), not a license to invent reports. Preserve continuous RSS retries, primary-source/geo and rights constraints, warning in machine logs without public diagnostic paragraphs.

## Separate release gates
- Python tests, Node smoke, Playwright at 360/390/768/944/1440: footer persistence, hero-only carousel, three green card prompts, no nested language border, validated market source and date.
- Deploy and verify actual custom domain version and market data payload, not just successful CI.
- Native camera playback and movement remain independently P0 (#35); embed load tests are NOT actual live certification.
- Existing search above footer, approved logo, news listing, translation and institutional footer remain frozen.