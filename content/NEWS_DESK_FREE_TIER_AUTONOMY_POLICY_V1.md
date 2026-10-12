# NEWS DESK — FREE-TIER AUTONOMOUS PUBLICATION POLICY v1.0
Date: 2026-10-11
Status: FOUNDER-APPROVED OPERATIONAL REQUIREMENTS / AUTONOMOUS AI ENGINE NOT YET DEPLOYED
Project: handsondispatcher/drivmatch-news

## Mandate
The News Desk shall operate without human triggering, using the maximum *available* free-tier AI quota per day, and publish ONLY original, publication-ready, evidence-supported articles. Zero paid AI usage and no automatic fallback to a billable provider.

## Initial observed constraints
The founder's Google AI Studio screenshot for Gemini 2.5 Flash-Lite Free Tier visually shows approximately RPM=10, RPD=20 and input TPM between 200k and 300k. These are UI observations, NOT guaranteed API limits. The runtime must use actual API responses and the currently applicable provider quota policy. These quotas may change. Shared project traffic consumes the same limits.

## Cost and quota governance
- Never configure paid billing or upgrade tiers as part of the deployment workflow. A project with billing already enabled must not be assumed free.
- Provider account configuration and billing tier require explicit owner verification; no code can fully guarantee zero charges if paid billing is enabled independently.
- Initial budget: <=20 total model calls per provider reset day, including drafting, revision, verification retries and failed attempts counted against quota. Keep a safety margin until provider quota semantics are confirmed.
- Persist an atomic quota ledger so concurrent scheduled runs do not overspend. Respect provider 429/rate-limit responses; fail closed and defer remaining queue without publishing.
- Record tokens where available, per-event call counts, article status and rejection cause.
- An event cannot consume further budget after an explicit quota hard stop.

## Editorial workflow
203 configured sources → candidate gathering → quality/relevance filtering → canonical-event grouping/dedup → evidence acquisition → verified-claim registry → original draft → two professional views (Motorista, Dispatcher) → rights/attribution, copy, fact QA → full structured article + licensed/approved illustration → publish-gate → GitHub deployment → freshness and corrections monitoring.
- Do not treat headline+metadata as verification of an entire source article.
- No copying third-party full text merely with a source link.
- Label uncertainty; human review for high-risk allegations, fatalities, disputes, medical/legal implications or material unsupported claims.
- Reject incomplete output without silently substituting generic content for verified professional analyses.

## Maximum free output policy
Maximize *approved articles per free request*, not raw draft count. Batch or combine workflow phases only if output remains checkable and complete. Allocate slots dynamically based on source quality and priority. Keep backlog and retry next day. Do not make low-quality or unverified pieces just to use all daily slots.

## Publication gate
Only publish upon independently passing evidence sufficiency, original text, source traceability, authorized photo use, specific Driver/Dispatcher analysis, dedup, schema, language, and quality tests. Store immutable gate result, exact version, sources, publication timestamp and audit trail. An API failure, quota exhaustion, missing picture or missing verifiable claim produces DEFERRED/REVIEW, never PUBLISHED.

## Deployment status and prerequisites
The reader UI, sharing preview cards and GitHub Pages workflow already exist. The autonomous Gemini editorial agent, durable quota ledger and publish gate require code, tests and installation of a Google Gemini API key as a GitHub Actions secret by the authorized account owner. Never paste the secret in chat or commit it. No autonomous publication readiness is claimed by saving this policy.
