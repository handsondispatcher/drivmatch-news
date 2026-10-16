# DrivMatch News — Paired Horizontal Advertising Rotation v1.0
**Date:** 2026-10-16  
**Scope:** main news column top and lower approved ad placements; independent of the sidebar vertical ticker.

## Owner-approved publication rules
- Two horizontal advertisements share exactly the same visual viewport aspect **1774:394**, aligned to the main news column's left and right edges.
- Each space changes **every 5 seconds** by closing the current banner and opening the next one from below, a **wipe / reveal**. This is not scrolling or moving a carousel up the page.
- Phase 0: top 3-car car-hauler creative, bottom UCR 2027.
- Phase 1: top UCR 2027, bottom AUTO M USA.
- Phase 2: top AUTO M USA, bottom 3-car creative.
- Repeat phases 0 → 1 → 2 indefinitely, with **no identical advertiser in the two placements at the same time**.
- AUTO M USA uses only the **exact three owner-uploaded horizontal 1774×394 PNG originals**, matched to the top PT/ES/EN language selector. Master pixels verified via SHA-256, downloaded to own site assets before build/tests. Phone overlay opens +1 (407) 600-4737 via WhatsApp with the message `Olá! Vim pelo anúncio da DrivMatch News.`; Instagram opens `@autom.usa`.
- Preserve the approved original UCR/car-hauler artworks, links, disclaimer semantics, no unauthorized creative regeneration.
- Keep the **vertical infinite ticker in the right sidebar** (UCR/driver/AUTO M USA) unchanged.
- Avoid rotating when the browser is hidden; pause on hover/focus; respect reduced-motion preference. Both slots remain paired through re-renders and top-language switching.

**Operational gate:** production means successful GitHub deployment, healthy assets, and a public-domain post-deploy verification. Deploy success alone is insufficient proof of real browser behavior.
