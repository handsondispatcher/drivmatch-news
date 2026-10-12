# NEWS DESK — WAR ROOM AMENDMENT 001: PRIORITY, SOURCES & SITE SCOPE
**Date:** 2026-10-11
**State:** FROZEN REQUIREMENTS AMENDMENT / NOT A PRODUCTION IMPLEMENTATION
**Governs:** content/NEWS_DESK_MASTER_PROMPT_FROZEN_V1.md and downstream News Desk editorial logic.
**Change control:** This amendment adds requirements; it does not silently rewrite the frozen master document.

## 1. Exact scope of change
The work concerns **NEWS AND ARTICLES ONLY**: discovery, facts, deduplication, priority, original reporting, role-specific analysis, newsroom placement, source attribution, archive, review and publish gate.
**OUT OF SCOPE — PRESERVE UNCHANGED:** Road TV, Ventusky, advertising/commercial placements and monetization surfaces, diesel-price quotations, USD/BRL quotations, Brent crude quotations, all other functioning market/weather/utility modules, branding and existing approved styles/layout. No changes to these modules may be introduced as an incidental side effect of News Desk development. Any change requires separate founder-approved change control and dedicated regression tests.

## 2. Priority does NOT equal exclusion
The News Desk shall discover broadly, then **rank for finite Gemini quota** rather than culling entire lower-priority editorials. Every covered domain can enter the verified backlog and lower-priority stories may publish when slots are available. Exclusion is reserved for out-of-scope, false, duplicated, unavailable/unverifiable, unlawful/unlicensed or unsafe content — not mere lack of top priority.

### Priority 0 — Urgent operational / safety
Verified active US highway restrictions and truck-relevant closures, critical weather and NWS/DOT alerts with road impact, major transport disruption, FMCSA/DOT rules and compliance deadlines, safety recalls, material fraud/security threats, border-entry disruptions and impacts. Do not state that a road is closed based only on weather alerts or an uncorroborated headline. Sensitive fatalities, allegations and contested reports remain HUMAN_REVIEW.

### Priority 1 — Directly actionable trucking work/economics
Lane and load availability, freight rates/capacity, broker/carrier/shipper operations, dispatch and rate negotiation, diesel and fuel costs as reported news (not changing quote widgets), parking and truck stops, equipment downtime and maintenance, trucking jobs and livelihoods, driver income, HOS/ELD/CDL issues, port/drayage and border procedures.

### Priority 2 — Transport industry/market
Transport company expansion, mergers/acquisitions, bankruptcies, earnings, new trucks and trailers, car hauling, flatbed, reefer, box truck, hotshot, cargo vans, technology, fleet operations, insurance, factoring, finance, logistics and supply chain trends. Relevant national coverage must not be blocked simply because no US city appears in headline.

### Priority 3 — Broader professionally useful context
Training, driver lifestyles/community, profiles and interviews, opinion columns, industry research, general business trends with defensible US trucking relevance and other current covered sections.

**Ranking factors:** relevance to US working driver/dispatcher and transportation operators; magnitude of real impact; urgency/effective date; freshness; evidence/corroboration strength; relevance to category/equipment/lane; novelty versus articles already published; diversity and reader usefulness. Provide an auditable weighted score; P0 and P1 get first *eligible* consideration but do not monopolize every day or erase other areas. If no P0 eligible, publish the strongest other verified coverage. Nonselected candidates remain in a time-stamped backlog and do not count as rejected due solely to priority.

## 3. Full discovery arsenal
Maintain configured 203 publisher/discovery source entries while expanding **within licensing, robots, terms, access limitations and actual supported integrations** to: original publisher RSS, published trade-press sites, government/agency official releases and APIs, DOT/511, FMCSA, NWS, EIA, state DOT, border/port authorities, public safety bulletins, industry associations, company investor relations and press releases, public reports and datasets, professional and academic research, named analysts' original publications, podcasts/transcripts where rights permit, social posts as leads and legitimate discovery/search feeds. Google News is discovery, NOT proof that every result is published by the publisher mentioned. Search-tool absence or inaccessible original material is logged; never invent access, publication or evidence. Favor primary-source validation and multiple independent sources for higher-impact claims.

## 4. Analyst as source — accurate attribution
When an identifiable professional analyst publishes an original, attributable analysis, **the named analyst is the author/source of that analytical assertion**. Preserve analyst_name, role/affiliation (only when independently known), originating publication/platform, original URL, published_at, access_at and direct claim/quotation provenance. Present, for example: “Segundo análise publicada por [Nome do Analista] em [Veículo/Plataforma] em [data], ...”. **Never replace the analyst with only the platform brand** or present their interpretation as an independently verified fact. If a platform republished the analyst, credit the original author and publication as appropriate. Check conflicts of interest, date, reputation and methodology; one person's opinion is not equivalent to primary evidence. Do not invent analysts, names, titles, credentials or endorsements. For a factual event, seek confirmation outside the analyst when material; for an opinion, clearly label it analysis/opinion. Never copy full original analysis without license.

## 5. Low-cost selection with editorial completeness
Finite free Gemini calls must go to high-value *verifiable* stories first, but preserve coverage breadth and lower-ranked queued stories. Dedup at the canonical-event level. Use Python/non-LLM steps for sorting, schema checks, source URL availability and known factual validations before consuming the daily model budget. A priority score cannot overrule publication gates. Aim for complete verified reporting, not a word or token number that truncates essentials; classify FAST/STANDARD/SPECIAL according to source sufficiency. Hold if one source headline cannot substantiate full article. No automatic paid fallback.

## 6. Site preservation regression suite
Must pass regression of Road TV, Ventusky, commercial/advertising areas, diesel/USD-BRL/Brent quotes, logo/color/typography/responsive identity, existing share destinations/cards, and entire homepage sections before release. Snapshot and DOM contract tests required. News Desk changes cannot be approved if any of those modules regress. Preserve the actual canonical frontend instead of generating an alternate site.

## 7. Acceptance tests
- Urgent verified safety event takes editorial priority but lower-priority verified equipment/business article remains queued and subsequently publishable.
- Non-US accident with no US transport relevance excluded.
- National US trucking equipment/market article eligible without city in title.
- Three publishers covering one event create one canonical event; retain material updates.
- Analyst original opinion is credited by **name + publishing context** and labeled analysis, not factual certainty.
- Anonymous social post or Google News snippet alone cannot underpin a full article.
- All four unaffected site areas — Road TV, Ventusky, advertising, and each of diesel/USD-BRL/Brent — function before/after News Desk changes.
- No output exceeds actual free tier; incomplete evidence/article or rights violation fails closed.

**Priority doctrine:** Search widely. Rank intelligently. Exclude only for substantive editorial/legal reasons. Preserve the whole DrivMatch News site outside the news/article engine.
