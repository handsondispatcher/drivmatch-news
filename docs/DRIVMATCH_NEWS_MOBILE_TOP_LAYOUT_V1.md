# DrivMatch News — Mobile Header / Quotes Cleanup v1
2026-10-17 · Owner approved.

## Reason
At smartphone widths the market/forecast utility section had conflicting accumulated CSS affecting USD, diesel, Brent, city forecast search, risk CTA and quote-strip square advertising. Result: asymmetric cards, the city search occupying one column, a floating risk CTA, right-aligned tiny sponsor poster and inconsistent ticker separation.

## Canonical rule
Only when viewport width <=850px:
1. Language picker remains in a single accessible row in header (existing implementation preserved).
2. USD and diesel share a balanced two-column first row.
3. Official TradingView Brent widget receives its own full-width second row, never scaled/cropped or replaced by fabricated market data.
4. Current weather (when available) and city/state forecast search each occupy their own full-width row.
5. Risk alert button follows forecast search, remains keyboard-accessible and tappable.
6. The existing 3×PT, 3×ES, 3×EN square advertiser is centered in its own row with a constrained 1:1 image, while preserving the existing original creative, rotation cadence and current SMS/WhatsApp target policy.
7. News ticker follows the utility area with safe margins and no horizontal viewport overflow.
8. News body, WEATHER ALERTS section, desktop visual, footer and original sponsor sidebar are untouched.

Implementation: `site/assets/mobile-top-layout.css` loaded after all legacy header styles, scoped to max-width 850px. Never mutate site finance data, official brand assets or ad semantics. Browser tests at 360/390/768 check actual bounding boxes, ordered modules, no overlap, fully visible ad, and ticker containment. Desktop widths >=944 retain previous regression checks.
