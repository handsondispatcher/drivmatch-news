# Dispatch Desk → DrivMatch News Multichannel & Professional Impact Layer
Status: PARTIAL UI IMPLEMENTATION / EDITORIAL COMPILER NOT YET IMPLEMENTED
Date: 2026-10-11
Canonical companion: content/DISPATCH_DESK_NEWSROOM_ENGINE_WAR_ROOM_001.md

## Founder request
From one verified, internally-authored original news story, compose tailored formats for the DrivMatch website, WhatsApp, newsletter, and future approved distribution channels. Within the complete website story, include exactly two reader-selectable professional perspectives: **Motorista** and **Dispatcher**. Each should explain relevant operational consequences, decisions, deadlines, documents, route/cost exposure and uncertainty for that persona.

## Content architecture
Verified Event + Evidence Graph → Canonical Original Article → Audience Impact Views (Driver, Dispatcher) → Channel Formatters (Web Article, WhatsApp, Newsletter, future) → Rights & Factual QA → Publication.
One canonical event ID and immutable referenced evidence; channel versions should not contradict, invent or silently exaggerate the original. WhatsApp and newsletters need tailored length, headline, lead, CTA, URLs, timestamps and attribution; do not copy full third-party articles. Automated distribution requires opt-in, privacy, unsubscribe where applicable and actual permitted provider integration.

## Impact view content contract
`professional_impact.driver.pt/en/es`, `professional_impact.dispatcher.pt/en/es` may be attached to an article after evidence-supported editorial preparation. Each impact claim should be evidence-bound and distinguish CONFIRMED, POSSIBLE and ACTION_TO_VERIFY. Unavailable specific analyses must degrade gracefully to generic, explicitly qualified operational checkpoints, not fabricate consequences from the headline.

## Implementation checkpoint
Implemented: article modal 2 buttons + accessible pressed state, distinct role-specific advice, structured fields preferred, localized pt/en/es fallback, analytics event, responsive UI; source-credit controls preserved.
NOT implemented: automatic real-event-specific impact analysis engine, full Dispatch Desk drafting pipeline, newsletter campaign sending, WhatsApp sending, standalone full-report generation from external RSS, independent editorial/legal approval automation. No assertion of fully automated newsroom production or licensed third-party reproduction.

## Acceptance gates for next phase
Evidence-grounded, non-redundant analyses; verify actual impact vs scenario; driver/dispatcher role distinction; language QA; per-channel approved copy; tests across full article, external headline and demo; subscriptions consent; business and copyright review; cost/quality monitoring.
