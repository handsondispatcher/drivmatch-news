# UCR 2027 — Native Horizontal Ad Production Gate

Status: ACTIVE (owner-requested correction, 2026-10-13)

## Why the earlier banner was rejected
The original horizontal UCR panel is approximately 2:1 but the allocated
DrivMatch News slot is 1774:394 (4.5025:1). A 2:1 image centered in a 4.5:1
frame necessarily leaves large dark side gutters; stretching or cropping
would distort or remove approved content. The prior release was visually wrong.

## Required workflow (no owner QA burden)
1. Measure the actual ad container, including mobile widths.
2. Produce distinct PT/EN/ES **native 1774x394 raster assets**.
3. Use the exact original approved source pixels for the UCR circular badge and
   truck; the native composition and typography may be new only in the lower
   horizontal slot, under the owner's corrective instruction.
4. Make price and independent-private-service disclosure legible.
5. Verify WhatsApp +1 908-291-3386 opens wa.me chat and Instagram opens
   ig.me/m/fabriciodispatcher (Direct, not Follow/profile).
6. Inspect all three languages and responsive layout in the browser.
7. Check zero blank gutters, no aspect distortion, source SHA, and 1774x394
   natural image dimensions; release is blocked if checks fail.
8. Deploy and verify the custom domain before reporting publication.

## Immutable boundaries
- The existing UCR square sidebar creative remains untouched.
- Car-hauler Foto 1 remains untouched.
- No government endorsement, universal $5,000 fine, or claim that the
  advertiser's US$110 starting price is an official UCR fee.

Files: scripts/build_ucr_exact_wide.py, tests/test_ucr_wide.py,
content/ads-ucr2027-official.json, tests/test_browser.cjs.

## 2026-10-13 — cinematic 4.5:1 corrective release (r10)

A separately generated candidate measured 2170x725 (2.993:1) and is
**REJECTED** for the 1774x394 (4.5025:1) lower UCR slot. Do not deploy it.
The corrected cinematic source was recomposed to exactly 1774x394 in
three separate WebP files (PT, EN, ES), pixel-hash locked by test_ucr_wide.py.
The owner-approved UCR square sidebar and Foto 1 car-hauler stay unchanged.
The visible WhatsApp and Instagram regions match the transparent clickable
hotspots; mobile receives additional 44px accessible buttons.
