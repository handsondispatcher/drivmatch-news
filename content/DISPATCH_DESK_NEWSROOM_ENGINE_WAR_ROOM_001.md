# DrivMatch News — WAR ROOM 001
## Dispatch Desk Newsroom Engine™ — Canonical Development Decision
**Date:** 2026-10-11
**Status:** STRATEGIC DIRECTION APPROVED FOR DEVELOPMENT / NOT IMPLEMENTED / NOT PRODUCTION AUTHORIZED
**Repository:** handsondispatcher/drivmatch-news
**Site:** https://drivmatch.com/news/

### Founder intent
Move beyond a link aggregator: readers should understand complete original, consistent, illustrated and attributed DrivMatch News reporting *without being forced to leave the site*. Coverage of US road freight, truck drivers, dispatchers, carriers, brokers, owner-operators, car haulers, shippers, highways, DOT, equipment, fuel, supply chain, technology, mergers, management and regulations. Maintain continuous discovery including weekends.

### War Room decision
Approve development of an autonomous specialized digital newsroom, built on the existing Dispatch Desk intelligence concept, but **not** wholesale republication of third-party articles. A link or source attribution at the end does **not** itself grant reuse rights. Report facts independently in original language/structure with traceable evidence, rights-cleared photographs/graphics and original value-added analysis. License or permission required where applicable for protected third-party material. Preserve source links, dates, corrections, uncertainty and licensing metadata.

The War Room roles were simulated analytical perspectives, NOT actual separately convened human advisers.

### Canonical pipeline
SOURCE DISCOVERY → EVENT CLUSTERING & DEDUPLICATION → FACT/EVIDENCE EXTRACTION → SOURCE VERIFICATION → TRUCKING IMPACT ANALYSIS → ORIGINAL EDITORIAL DRAFT → RIGHTS/ATTRIBUTION REVIEW → QUALITY/RISK GATE → TEMPLATE/LAYOUT → PUBLICATION → MONITORING/UPDATES/ARCHIVE.

### Proposed functional agents (not yet deployed)
1. News Discovery Agent — monitor feeds, official advisories and relevant emerging sources.
2. Event Intelligence Agent — group stories/updates into canonical events.
3. Fact Verification Agent — distinguish verified, inferred, disputed and unknown facts; source and timestamp each material assertion.
4. Trucking Impact Analyst — explain practical implications for the transport ecosystem.
5. Editorial Writer — original Portuguese articles; optional other languages after verification.
6. Rights & Attribution Guardian — copyright, quotation, photos/graphics licenses, source evidence.
7. Copy Editor & QA — fact consistency, neutral tone, duplicates, corrections, style.
8. Publishing & Layout Engine — structured article to templated page and structured metadata.
9. Newsroom Monitoring Agent — cadence, freshness, incidents, QA and corrections.

### Three editorial products
**FAST**: Short source-linked, factual, time-stamped news/update for adequately corroborated low-risk events, with gated automation.
**STANDARD**: Full original reporting with evidence, context, historical comparison, impact analysis and citations; automated publication only for qualified source/evidence/risk combinations.
**SPECIAL**: Allegations, fatal accidents, criminal proceedings, controversial or high-stakes assertions, investigative reporting; human editorial review required.

### Reader experience
A DrivMatch original headline/subtitle, licensed image, byline, publication/update timestamps, engaging lead, clear sections, facts and context, explicit trucking impact, figures/data with provenance, sources linked at end and inline as needed, corrections and archive. Distinct canonical URLs per article, e.g. /news/articles/<slug>/. Reader can finish the story within DrivMatch. Clear labels for external-source linked briefs versus original reported articles. No invented witnesses, quotes, numbers, images, implications or incidents.

### Technical reference
Keep current GitHub Pages frontend if practical. Generate original validated structured article JSON + static HTML through an authorized editorial backend/workflow. Store persistent event IDs, claim evidence, dedup fingerprints, source URLs, license status, version history, gate decisions, and corrections. Separate 10-minute discovery cadence from LLM drafting frequency to control cost. Job failures should not erase existing editions. Monitoring should detect stale output and skipped runs.

### Editorial protection
Facts are not automatically copyrighted; original expressive text, photography and figures may be. Attribution is necessary but NOT a substitute for authorization, a license or legally supported fair use. Never download and republish complete protected articles just to append a link. AI rewriting/paraphrasing of one article without substantive independent reporting is not the desired product. Third-party social posts are leads, not verified claims. SEO value requires original useful contribution rather than mass low-value rewritten content.

### Roadmap and gates
1. Curriculum/requirements crosswalk with existing Dispatch Desk and DrivMatch code, without replacing live production abruptly.
2. Prototype FAST, STANDARD and SPECIAL article schemas, source-evidence graph, attribution/license controls and 3 layout templates.
3. Controlled pilot on real source evidence, including negative and disputed-data cases.
4. Measure actual publication count, accuracy, auditability, corrections, duplicate rate, editorial intervention, costs/article, reader engagement and impact analysis usefulness.
5. Legal/editorial review, operational readiness, failure recovery and controlled expansion.
6. Promote to autonomous production only after documented quality/safety/economic readiness gates.

### Decisions and non-decisions
- APPROVED FOR DEVELOPMENT: complete original DrivMatch articles, consistent professional layout, human-in-the-loop as risk requires, bounded automation by category, continuous source monitoring, source credits and external links.
- CONDITIONAL: using licensed syndication/media consistent with rights; automated Standard material conditional on verifiable evidence.
- REJECTED: copying full external news solely with a source credit; false original-reporting or live claims; publishing sensitive unverified facts; deleting all source links.
- NOT YET CLAIMED: autonomous article-generation deployment, licensing clearance, individual agent execution, production quality proof, commercial budgets, or full legal authorization.

**Strategic principle:** DrivMatch News should not just tell readers where to find news; it should explain the event and the operational consequences for US trucking in a trustworthy original publication.
