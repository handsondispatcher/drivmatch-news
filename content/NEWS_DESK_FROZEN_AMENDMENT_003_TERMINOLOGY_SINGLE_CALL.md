# NEWS DESK — FROZEN AMENDMENT 003 — TRILINGUAL TRUCKING TERMINOLOGY & SINGLE-CALL GENERATION
Date: 2026-10-11
Scope: ORIGINAL NEWS ARTICLES, not broader website features.
Status: FOUNDER-DIRECTED REQUIREMENTS / FROZEN DESIGN, NOT IMPLEMENTED.
Complements: NEWS_DESK_MASTER_PROMPT_FROZEN_V1.md, AMENDMENT_001, AMENDMENT_002.

## 1. Verified present-day architecture (2026-10-11)
- site/assets/app.js: site UI language is switched on the client from pre-existing label dictionaries; article modal uses article.locales[chosen] (or source-locale fallback), so selecting a flag is not itself translation of a full original article.
- scripts/update.py: external source headlines use best-effort prepublication translations via an unofficial Google Translate endpoint (no guaranteed uptime or suitable technical semantics); article bodies can be pretranslated via GOOGLE_TRANSLATE_API_KEY when configured, with auto_pending_editorial_review state; original third-party linked reports rely on publisher/browser Google Translate (when available). Existing translations may be imperfect; never claim all are fully expert-reviewed.
- Preserve pt-BR initial language, en-US then es-419, source-translation buttons, social sharing.
- New original reports must be generated as a **complete set of pt-BR, en-US and es-419 locale data** and selected by current frontend (adapter/template development required); do not impose live browser translation or a paid translation API as a dependency.
- The language switcher labels/interface already operate with zero Gemini calls. A single Gemini request may produce all three reports if input/output token budgets permit and quality checks pass, but does not guarantee approval.

## 2. Intent and constraints
Use **one evidence-grounded, structured Gemini generation request per eligible event whenever feasible**, bundling factual original draft in pt-BR, equivalent natural en-US and es-419 versions, and specific Driver/Dispatcher analyses in each language. Model performs nine role-question self-checks BEFORE answering, and returns concise machine-readable audit. **Self-review is not independent proof**: code verifies source URLs, source claim coverage, material number/date/units parity, word counts, completeness, license, schema, event dedup and safety risk; hold on failure; don't pay or call again without remaining free allowance and editorial justification.

## 3. Required terminology: CONTEXT IS THE MASTER
Never perform literal string substitution across professional vocabulary. Build a domain glossary with contextual cues, positive/negative examples and source-confirmed definitions. Prefer preserving US industry acronym/term in English on first use with an idiomatic gloss in pt-BR/es-419, then reuse consistently. Do not claim Brazilian documents/roles are legally interchangeable with US ones.

| English term | Preferred pt-BR, subject to context | Critical exception |
| capacity (trucking market) | oferta/capacidade disponível de transporte, caminhões e equipamentos disponíveis para atender cargas | Not generic industrial capacity; may represent *effective hauling supply* rather than a literal count of trucks |
| Bill of Lading (BOL) | conhecimento de embarque; documento de transporte (BOL) | Not automatically equivalent to Brazilian CT-e or a freight invoice |
| detention fee | cobrança por espera excedente na coleta/entrega; cobrança de detention | NOT taxa de detenção; who pays/receives and trigger depend on rate confirmation/contract |
| detention time | tempo de espera além da franquia contratual | Different from law-enforcement detention |
| pickup / pick up (verb or shipment event) | coletar, retirar, coleta, retirada | Pickup truck = caminhonete/picape; pickup appointment = horário de coleta |
| truck | caminhão/veículo de carga | pickup truck = caminhonete/picape; box truck = caminhão baú; tow truck = guincho/caminhão de reboque; semi-truck = caminhão-trator com semirreboque/carreta, as the situation warrants |
| dispatcher/dispatch | dispatcher; profissional de coordenação de cargas; coordenação de fretes | Not simply despachante aduaneiro |
| broker / freight broker | intermediador/corretor de fretes (broker) | Not insurance/real estate broker |
| carrier / motor carrier | transportadora/operador de transporte rodoviário | Not merely any cargo-carrying employee |
| shipper / receiver | embarcador / destinatário ou recebedor | Preserve actual pickup/delivery parties |
| lane / freight lane | rota/corredor de frete (lane) | Not traffic lane (faixa de rolamento) |
| rate / linehaul rate | valor/tarifa de frete / parcela referente ao transporte | Check if price is per mile, per trip, linehaul, or all-in |
| spot rate | valor de frete do mercado spot (negociação pontual) | Not instantly the rate of all contracts |
| load / loads available | carga, frete; cargas disponíveis | Not load = peso in every context |
| load-to-truck ratio | relação entre cargas anunciadas e caminhões disponíveis | Do not invent denominator, platform or period |
| rate confirmation | documento de confirmação de tarifa/valor e condições do frete | Not an invoice |
| deadhead | deslocamento sem carga; milhas rodadas em vazio | Not literal dead head |
| detention vs layover | detention=espera excedente; layover=parada/pernoite ou dia adicional conforme acordo | Not interchangeable payments |
| lumper fee | custo/cobrança de equipe terceirizada de carga/descarga | Not 'taxa de carregador' if operationally vague |
| POD (Proof of Delivery) | comprovante de entrega (POD) | Not Bill of Lading automatically |
| CDL / ELD / HOS | carteira de habilitação comercial (CDL); dispositivo eletrônico de registro (ELD); horas de serviço/jornada (HOS) | Keep legal acronym and US-specific regulatory context |
| DOT inspection | inspeção/fiscalização DOT de veículo comercial | Check whether state DOT, federal DOT or enforcement agency |
| owner-operator | proprietário-operador; motorista dono do caminhão que opera fretes | Distinguish leased-on vs own-authority where material |
| dry van / reefer / flatbed | carreta baú seca (dry van); carreta refrigerada (reefer); prancha/plataforma aberta (flatbed) | Regional equipment names depend on configuration |
| drayage / hotshot | transporte curto de contêineres entre portos/terminais; modalidade hotshot de carga rápida/geralmente com caminhonete e reboque | Do not invent particular vehicle class |
| tractor / trailer | cavalo mecânico/caminhão-trator / semirreboque, carreta ou reboque according to configuration | Tractor is NOT farm tractor here |

For en-US: maintain natural US trucking professional terminology as originally used, with exact distinctions. For es-419: use neutral, profession-idiomatic US/LatAm transportation Spanish, preserve US-specific acronyms, and avoid false equivalence with Latin American local legal categories. Proper names, law titles, place names, units, acronyms, dates and source names must remain correct, with units conversions only if validated.

## 4. Minimum full-report acceptance
- For STANDARD, native pt-BR 400–700 words as guidance when evidence supports, and en-US/es-419 *complete equivalent reporting* (not abridged summaries) with all material facts; FAST 180–320 words as guidance if event factual content is limited.
- Always retain: who, what, where, when and applicable jurisdiction; figures/dates and their denominators; effective vs proposed regulations; unknowns; sources and direct analyst authorship; two specific professional viewpoints per locale; corrections and explicit distinction facts vs possible consequences.
- Do not invent based on titles, social posts or missing source bodies. A source's analysis is attributed to the named analyst + original outlet/platform, not converted into independent fact.
- A press release is primary for what its author announced, not independently proven evidence of the promised outcome.
- Digital licensing and source references are independent from image generation. Media selected from a rights-cleared catalog by non-LLM tooling; no event photograph fabricated from text or guessed asset URL.
- Preserve existing share preview metadata: unique article URL + appropriate authoritatively licensed image + actual article title (1200×630 social JPEG). No special WhatsApp-only stories.

## 5. Token / quota decisions
- A **request** is a provider API call, not a token or a word. One request may contain three fully drafted language versions, but output token usage increases significantly.
- Google documents model 2.5 Flash-Lite output limit up to 65,536 tokens, not a promise that any requested long JSON will succeed. Set application-specific max_output_tokens from the required output manifest and monitor actual response usage/finish reason; stop truncated content from being published.
- Screenshot initial free-tier per-project RPD=20 and RPM=10 remain contingent on live project/model access, actual API quotas and currently applicable free allowance. RPD resets midnight US Pacific time per provider docs, not local Brazilian midnight. Do not run daily calls simply to meet a quota.
- Keep output lean: never reproduce nine essays/analyses on agent deliberations; return compact audit failures plus three reader-facing articles. If too long, return HOLD/incomplete rather than omit a required locale.
- Independence: deterministic software validation + original primary evidence, not nine copies of Gemini, is what reduces unwanted API revision requests.
- If free API model version is unavailable, abort rather than switch to paid tier.

## 6. Release state
This amendment governs code implementation and prompt architecture. No new News Desk Gemini API workflow, credential, article translator, rights verification, fact-checking engine or full end-to-end autonomy is claimed as deployed here. Existing site modules (Road TV, Ventusky, ads, market) remain out of scope.
