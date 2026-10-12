# NEWS DESK — FROZEN AMENDMENT 002: LANGUAGE & SHARING INVARIANTS
Date: 2026-10-11
Status: FOUNDER-APPROVED REQUIREMENTS / NOT A CLAIM OF NEW FEATURE DEPLOYMENT
Governs: content/NEWS_DESK_MASTER_PROMPT_FROZEN_V1.md; content/NEWS_DESK_FROZEN_AMENDMENT_001_PRIORITIES_SOURCES_SCOPE.md

## Three languages — exact order
1. Brazilian Portuguese (pt-BR), **native default automatically on first visit/open**.
2. English (en-US).
3. Español (es).

Keep the currently working language picker, flags, existing article-language and translation behavior, labels, accessibility and previously validated layout. No language may be silently replaced with unverified machine text. For a newly generated original article, require genuine, quality-checked pt-BR content as master; translated versions for en-US/es must be actually produced and reviewed, not merely marked translated or copied. If a translation is unavailable, indicate that honestly and preserve the current verified source translation/link alternatives; never simulate translation.

## Sharing — preserve all destinations and existing interactions
Do NOT create different WhatsApp-specific news articles or change sharing patterns. Retain currently supported WhatsApp, Facebook, Threads, X, LinkedIn, Telegram, Reddit, Pinterest, email, native share, copy link, and visual Stories where available; maintain the same familiar picker/workflow and mobile presentation.

## What the recipient sees
Each shared article's public, crawlable unique URL MUST serve accurate Open Graph and Twitter/X social meta tags for its **real story title** and a visually engaging, legally authorized DrivMatch-branded **1200×630 image**. The preview must show **the article's photo/approved illustration and title** on compatible receiving apps. Preserve source, publication and share identity; no misleading stock image portrayed as on-scene imagery. Detect/fail broken thumbnails, wrong article ID/title, invalid OG URL, paywall/auth/crawler blocks, or generic homepage previews. Recipients and app caches can vary; test supported apps and don't claim absolute control of preview rendering.

## Scope lock
Changes apply only to News Desk article production, translations, social metadata and the integration with existing article presentation. **Do not modify** Road TV, Ventusky, commercial/advertisement zones, diesel quotations, USD/BRL, Brent, or the approved visual identity.

## Release gate
Tests must verify initial pt-BR language, ability to choose English/Spanish, actual verified multilingual article content or honest availability state, unchanged sharing options, public OG title/image resolution (200, JPEG/PNG, 1200×630) for a newly published article, article-specific preview and public recipient navigation, mobile experience and full regressions of unaffected site modules. Any failure blocks production release of new News Desk features.

Changes to frozen requirements require explicit founder authorization, new amendment, code review and regression tests.
