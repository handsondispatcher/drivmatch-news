# NEWS DESK — FROZEN AMENDMENT 005: EDITORIAL PHOTOGRAPHY AND AD FREQUENCY
Date: 2026-10-13
Status: FOUNDER-APPROVED / CANONICAL

## Photography on the public news homepage
News article cards and lead stories should show relevant photography, not title-painted graphics, whenever properly licensed photos are available. Priority: story-specific attributed local JPEG, then topical locally hosted Commons archive photo with verified license/credit/source, and only then an explicitly marked editorial illustration.

**Reuse window:** never repeat the same photo in the previous **20** displayed story positions (so reusing a photo after 20 intervening stories is permitted). Absolute one-time-only use is NOT the rule. Do not duplicate the same photo consecutively or in nearby cards.

**Catalog expansion:** increase verified photographic capacity towards **10× the original 35-entry manual source list** (target approximately 350 distinct source photographs). Automated discovery can propose Commons JPEG candidates but they may enter the published gallery **only after license metadata, author/credit, original Commons file source, safe format, valid JPEG image and image dimensions are verified**. Never assert the 350 target has been reached when the audited build count is lower. Keep existing curated images and a functional archive fallback during licensing, rate-limit or download outages.

Photos of a vehicle, road or warehouse used for another story are ALWAYS identified as illustrative archival imagery, NOT as the event/people/equipment depicted in the article. Preserve visible attribution and original license/source link within the article. Weather bulletins do not use generic truck photos as purported meteorological evidence.

## Advertising frequency
For the same campaign, only **one visible advertisement per contemporaneous desktop page area**: when owner-approved Available Load displays below the news highlights, the identical campaign must not appear again in the right-hand sidebar. Mobile can use its distinct square layout where the desktop horizontal creative is hidden. The article-format version may appear in its own story context; do not duplicate it beside another of the same campaign. Preserve sponsored labels, factual vehicles/origin/destination and existing advertiser destinations.

## Implementation and regression
- `scripts/build_news_photos.py`: local verified licensed JPEG library and stable manifest.
- `scripts/discover_commons_photos.py`: search Commons for candidate sources, reject unknown rights.
- `site/assets/app.js`: 20-story rolling photo cooldown; `renderAds()` dedupe by canonical campaign identity.
- `site/index.html`: honor hidden ad sections and cache-bust reader updates.
- Test photos and HTML visually on desktop/mobile; enforce sequential image reuse limits, source attribution and no repeated sidebar campaign.
- Any change requires founder approval, recorded revision, and regression coverage. Do not touch the approved article-reader/trilingual/WhatsApp canonical arrangements.
