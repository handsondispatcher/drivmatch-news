# DrivMatch News — Mobile Media Footer Rule v1.0
Date: 2026-10-17
Owner-approved.

## Requirement
Desktop view (991px and wider) retains the canonical right-side column containing Ventusky, live ROAD TV / highway camera player, verified transport market and the complete continuously rotating advertiser panel (UCR, independent driver, AUTO M USA).

At viewports **990px and smaller**, move the **same** canonical DOM sidebar to a dedicated media section **after the news stories, their pagination, the platform-opportunity callout and the news search panel, immediately BEFORE the site's institutional footer**. Do not clone the ads, iframe players, market widgets or data. On responsive breakpoint changes, return the same node to its original desktop grid position.

Hide prior partial mobile-only duplicates of weather, ROAD TV and market to prevent double video streams/iframes/market values; show the original desktop versions inside the relocated rail. Preserve all outbound weather links, cameras and TV controls, advertiser WhatsApp and Instagram links, rotation speed and interactive pause/focus behavior, locale switching, source transparency, and footer. No new advertisers or new cards are created.

Layouts must be legible at 360, 390, 430, 768, 990 and 1280 CSS pixels, without horizontal overflow, clipping or unnecessary duplicate players. Visible priority after stories on mobile: Ventusky → ROAD TV live cameras → market → ad ticker → footer. The desktop media sidebar stays to the right.
Tests require correct DOM order, singleton rail and live ad inventory, camera/weather visibility, and responsive return to desktop.

## Deployment caveat
Commit and passing code-only tests do not prove real-site rendering; the public DrivMatch.com/news deployment and visual/mobile tests must succeed before claiming live functioning.
