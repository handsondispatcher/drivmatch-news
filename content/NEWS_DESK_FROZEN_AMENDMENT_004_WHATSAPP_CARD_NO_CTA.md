# NEWS DESK — FROZEN AMENDMENT 004: WHATSAPP SOCIAL CARD, NO CTA
Date: 2026-10-13
Status: FOUNDER-APPROVED / CANONICAL / IMPLEMENTATION AND PUBLICATION SUBJECT TO RELEASE GATES
Supersedes: any previous proposal to place a small "CLIQUE E LEIA" or other promotional button on the image of a shared news story.
Extends: NEWS_DESK_FROZEN_AMENDMENT_002_LANGUAGES_SHARING.md.

## Canonical visual rule
A WhatsApp news-card image **must not contain "CLIQUE E LEIA", "Click to read", artificial button, arrow CTA, promotional banner or similar call-to-action overlay**. A WhatsApp preview is a compact editorial link card, not an advertisement.

Use the current approved DrivMatch News 1200×630 editorial card layout, retaining:
- Relevant legally authorized news photograph/approved illustration at the top.
- Story headline in readable bold lettering beneath the photo.
- Restrained publisher/DrivMatch News branding and truthful image license/provenance.
- Consistent strong hierarchy and legibility at WhatsApp thumbnail size.

The receiving app itself makes the card clickable; don't depict a fake button. The whole link must navigate to the corresponding DrivMatch News story. WhatsApp-generated title, description, link metadata and truncation are controlled by WhatsApp and need not be duplicated as extra overlays.

## Implementation lock
- Generator: `scripts/build_share_pages.py`, particularly `create_card()`.
- Source and card image must match the article ID and have valid HTTPS Open Graph metadata with a 1200×630 public JPEG.
- Use a new versioned social URL on materially changed share imagery to limit stale previews.
- Preserve headline text, photographs, licensing disclosures, existing article modal, language selection, share destination choices, and the final Driver/Dispatcher placement.
- No unrequested new UI controls or alterations to the newsroom layout.

## Regression and release gate
- A permanent regression test must assert absence of "CLIQUE E LEIA" in the image generator, the former CTA location clean of a graphical button, and successful 1200×630 rendering.
- Verify the public OG HTML and JPEG with a crawler-like request and verify mobile share URL is absolute HTTPS and article-specific.
- Do not claim the WhatsApp UI displays a preview until verified using an actual WhatsApp message; public OG readiness alone is not proof of client-side preview.
- Publication through GitHub Pages and the current domain must pass standard build, browser regressions, deployment and domain checks.

## Change governance
Changing this no-CTA rule requires explicit founder approval, a versioned amendment and regression tests. No future automated layout or share-card optimization may silently restore promotional overlay controls.

## Absolute-link-only WhatsApp delivery invariant (2026-10-13)
When a reader taps WhatsApp in the share picker, the outgoing message MUST contain exactly one absolute `https://handsondispatcher.github.io/drivmatch-news/share/{article_id}/?v={preview_version}` URL. Do not prepend titles, summaries, Markdown, a second link or any relative `/news/share/` route: WhatsApp itself generates the bold headline and image preview from public Open Graph tags. Clipboard fallback and Android/native share MUST follow the same URL-only rule. The no-CTA editorial artwork remains unchanged. Keep automated Samsung/Android and desktop share contract tests. A real WhatsApp photo preview is validated only from a fresh message screenshot.
