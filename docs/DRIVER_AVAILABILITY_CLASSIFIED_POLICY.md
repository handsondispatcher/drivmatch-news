# DrivMatch News — Driver Availability Sidebar Classified

Status: APPROVED DESIGN / SOURCE ART IMMUTABLE / ORIGINAL BINARY PENDING REPOSITORY UPLOAD — 2026-10-13.

## Placement
The square **UCR 2027** ad remains untouched in `market-sidebar` (`#market-commercial-banner`). The third-party classified for **Aileen Souza** occupies the **next** independent sidebar section (`#market-driver-availability-banner`), directly below UCR. It must not replace, overlap, re-order or modify UCR or car-hauler banners.

## Exact creative
- Use solely the user-provided poster `1003878249.jpg` at 1229×1536, SHA-256 `191ab228dd8bf894e8ab4ff3585fd372eca9fff83c38cb8901a754afa66d1bc5`.
- Target repository binary: `site/assets/ads/aileen-souza-motorista-disponivel-original.jpg`.
- No text edit, translation, portrait redraw, color changes, cropping, CTA replacement or unauthorized art adaptations. Responsive geometry is `width:100%;height:auto;aspect-ratio:1229/1536;object-fit:contain`.
- On narrow sidebars the poster is still complete; allow click outside the phone number to open the unmodified full image to read all credentials.
- Only a transparent HTML anchor on top of the **printed phone number** is authorized. Original `(407) 285-2874`; WhatsApp destination `https://wa.me/14072852874` (USA +1). Do not redirect to DrivMatch or Fabricio's WhatsApp.
- Mark as third-party classified/advertising. Statements of qualifications and availability originate from the submitted advertisement and are not independently verified.
- Do not invent translated artwork when switching PT/EN/ES. Translate the small advertising disclosure outside the locked image only.

## Activation and QA
The poster must never render broken. It stays hidden if source JPEG fails to load. Valid SHA-256 is required before publishing; `python scripts/verify_aileen_driver_classified.py` checks exact bytes and status. GitHub issue #114 tracks binary transfer and production smoke test. Once the exact binary is uploaded, the prebuilt DOM location activates without additional layout changes. Verify on real desktop site that UCR is above driver poster, art fully visible without clipping, and that clicking digits opens WhatsApp, while clicking elsewhere opens full-size artwork. No release claimed until asset exists and public-domain QA passes.
