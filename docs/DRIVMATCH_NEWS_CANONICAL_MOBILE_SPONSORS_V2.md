# DrivMatch News — Mobile sponsors canonical parity v2 (2026-10-17)
The user requires that the mobile media rail, placed at the end of the news and directly before the footer, display the **exact same** original UCR 2027, Aileen Souza and AUTO M USA advertisers as the desktop right sidebar. No clones, redesigns or alternate advertiser sources.

Root causes of missing sponsors: old mobile CSS forcibly hid `ad-placement-side` (UCR) and `market-driver-availability-banner` (Aileen); the old mobile ticker had a 355–600px height crop and 420px max-width.

Correction: new narrowly scoped mobile-only CSS restores the enabled original UCR and Aileen and AUTO M creative, with responsive full available width up to 680px, intrinsic poster ratios, all original link targets. No campaign `[hidden]` is force-unhidden. On mobile the same original moving ticker becomes an **expanded full-length three-sponsor vertical view** (motion suspended), to ensure every advertiser appears without waiting for a rotation. On desktop the existing infinite upward ticker, speed and pause controls remain unchanged. Re-entering mobile restores UCR→Aileen→AUTO M order by DOM moving, never cloning. The institutional footer comes after the final sponsor.

Tests verify full visible card geometry, unchanged three original DOM nodes, correct mobile/footer order, and desktop continuous motion.
