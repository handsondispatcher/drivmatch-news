# DrivMatch News — Canonical Advertising Localization & Creative Approval

Status: ACTIVE — 2026-10-13

## Language
The selected site language (pt / en / es) governs all translatable advertising copy, including disclosures, accessibility labels, descriptions, and approved image-language variants.
Translate the meaning naturally, not mechanically. Never translate proper names, branded terms, usernames, WhatsApp, Instagram, DrivMatch News, UCR, brand/model names, vehicle years, addresses, postal codes, currency amounts, telephone numbers or URLs.
Do not translate legal/compliance terms to a materially different promise. Validate each language manually before publication.
Localized image variants must maintain exact approved layouts and images; only approved textual substitution is permitted, once user-approved.

## Creative-lock gate
If text is rasterized within an approved image, changing that text requires a NEW localized creative version (even when all other pixels remain identical). Such a draft MUST be shown to the owner in chat and explicitly approved BEFORE any publish, swap, deployment or change to the active URL. Do not insert overlays, invent buttons, copy, art, framing, gradients, or retouch images to circumvent approval.
After explicit approval, register asset URL, crop, language, approval date and immutable checksum; then activate that version. Until then keep the prior approved version visible and disclose the untranslated-image limitation. Never claim an asset was translated based solely on its HTML disclosure.
Do not silently revert the other languages or alter advertising placement or product information during localization.

## Active campaign status
- UCR 2027: approved original multilingual master contains PT/EN/ES crops; use the corresponding approved crop for selected language and same format.
- Available Load / Car Haulers: **OWNER APPROVED** PT/ES horizontal adaptations in the chat on 2026-10-13 ("Boa! Crie a regra, faca o deploy e salve"). English original remains approved and unchanged. The approved PNGs are stored in the owner's DrivMatch News / Approved Ads Library, not yet in the GitHub repository.
  - PT original PNG 2172×724, SHA-256 `949727deb1c5d37cb4e4b68c8162973fbde6362112937fca73eecb724fcd5dc0`; target `site/assets/ads/carhauler-photo1-pt-approved-20261013.png`.
  - ES original PNG 2172×724, SHA-256 `f2e7c2b7527286d29ac0620df98ab2d61ba92ff8d030f66cf66a6a43ccad5806`; target `site/assets/ads/carhauler-photo1-es-approved-20261013.png`.
  - **Approval does not equal publication**. GitHub Pages displays a localized raster image only after verified assets exist at those repository paths and SHA-256 matches exactly; otherwise the approved English image remains unchanged. No "new" resynthesis from descriptions allowed. Images have a 3:1 aspect ratio and must not be stretched into 1774:394.
  - Translate the horizontal ad only. The original rectangle/square crops used elsewhere cannot be modified or republished as translated art without specific review.
- Approved placement: vehicle landscape TOP, UCR landscape LOWER, UCR square RIGHT.

## Review and QA
For each language and each screen breakpoint: assert crop and approval status, check text fits and matches original facts, ensure brands and contact links are invariant, and verify exact current production asset URL/hash. Fail publication when an unapproved localized graphic would replace an approved asset.
