<!-- CANONICAL WORKING DOCUMENT: User requested 'Salvar' after the full DrivMatch/News War Room business strategy discussion. -->
> **Registro para continuidade:** ata estratégica recuperada integralmente do [War Room #26](https://github.com/handsondispatcher/drivmatch-news/issues/26), salva em arquivo versionado do repositório em 09/10/2026. É proposta em análise, não nova decisão de preço/lançamento. As referências e cifras são hipóteses que exigem auditoria e validação comercial.
>
> **Governo:** não modificar o site principal ou o DrivMatch News por implicação desta ata; mudanças requerem um PR/Change Control separado, testes e autorização conforme gates. Manter backup v32 e v33 prelaunch.

# WAR ROOM DrivMatch / DrivMatch News — Estratégia comercial, homepage, monetização e expansão trilingue
**Data:** 2026-10-09 · **Status:** PROPOSTA EXECUTIVA PARA DECISÃO; NÃO É APROVAÇÃO PARA MODIFICAR O SITE, COBRAR OU ANUNCIAR TRAÇÃO. 
**Participantes simulados:** Tônio (Produto), Vinny Jr. (Growth/Brand), Sra. Deloitte (Finanças/Compliance), Paulo Guedes (Economia e unit economics), Chico (Operação de motoristas), agentes de Editorial, Revenue, SEO/Analytics, Sales, Engineering e War Room. Papéis fictícios de avaliação, sem representação real de pessoas/organizações.

## 1. Constatação: site público (captura indexada em outubro/2026)
- Homepage /: “THE TRANSPORT CONNECTION PLATFORM”, “Optimizing Jobs, Loads & Services All in One Platform”, CTA por Driver/Dispatcher/Carrier/Client, DrivMe, Marketplace, Live, Driver Rewards. Fluxo “Post Request → up to 5 offers → Negotiate → Pay Fee/Unlock Contact”. Link: https://drivmatch.com/
- /pricing: conta de motorista sempre gratuita, match/contact fees dispensados durante launch, diferentemente das afirmações da homepage “drivers pay only when selected” e “small connection fee”. https://drivmatch.com/pricing
- /join: prova social visível “500+ Drivers, 50+ Carriers, 30+ Providers”, além de “500+ drivers this week” na home. https://drivmatch.com/join
- Snapshot interno *reportado* em 2026-10-08: 210 usuários (89 drivers, 66 dispatchers, 40 carriers, 7 clients, 8 providers), 48 jobs (23 completed e 18 open), não evidência auditada de receita ou paid hires. **Conciliar com marketing acima antes de anunciar**. “Completed job” não prova contratação paga, receita ou match convertido.
- Notícias são publicadas em /news e já foram promovidas à v33, com backup v32. Manter issue #18 com release gate editorial, direitos e dados. Main app/repo não disponível pela conexão GitHub nesta reunião (só handsondispatcher/drivmatch-news): alterações da homepage exigirão acesso ao outro código/Cloudflare.

## 2. Posicionamento recomendado
**DrivMatch = plataforma de oportunidades, conexões e soluções de transporte nos EUA.**
**DrivMatch News = porta de entrada gratuita, confiável, útil e trilingue (PT-BR para trabalhadores brasileiros nos EUA → ES latino → EN-US), conectada ao produto sem transformar notícia em publicidade oculta.**
Headline /news recomendada: “O que muda hoje no transporte rodoviário americano — e como isso impacta sua operação.”
Diferencial em relação a agregadores: notícias verificadas em linguagem acessível + “O que aconteceu/Por que importa/Quem afeta/Quando/Origem” com revisão humana + dados situacionais com data (Ventusky/NWS, câmbio, diesel) + oportunidades e soluções *separadas* editorial/comercialmente.
Não copiar logos, redação integral ou fotos sem licenciamento. Cada notícia crítica deve ter fonte primária/horário/jurisdição, nunca auto-publicar resumos genéricos de RSS.

## 3. Homepage DrivMatch: estrutura proposta
1. Top utility: logo + produto News + Opportunities/Jobs + For Carriers + Marketplace + Services + idioma e login.
2. Hero claro com prova real: “Encontre oportunidades. Contrate motoristas qualificados. Resolva necessidades da sua operação.” CTAs primários **Sou motorista — grátis** e **Sou transportadora — contratar**; secundário **Ler as notícias**.
3. Ticker discreto “Hoje no Transporte” com 3 chamadas reais datadas + botão ver News (não fake real-time alerts).
4. Três portas de entrada por intenção: Quero trabalho / Preciso contratar / Quero serviço ou parceiro.
5. Como funciona com 3 etapas, qualificações/transparência; declarar o que é gratuito e quem paga conforme modelo verdadeiramente ativo.
6. Últimas notícias com thumbnails e links rastreáveis + fatos úteis / Market Pulse.
7. Prova verificável de resultados (não números fictícios), testemunhos consentidos, FAQs e rodapé.
8. Sales CTAs segmentados com formulário curto e consentimento (sem spam): “Preciso contratar”, “Solicitar diagnóstico”, “Anuncie/Seja parceiro”.

## 4. News /news: homepage
- Marca oficial horizontal preservada; seletor PT/EN/ES; ticker real/data; alertas de clima/mercado com fontes e sem simulações.
- Hero com 1 manchete + 3 relacionadas; “5 manchetes essenciais” + filtros/categorias (motoristas, fretes, carriers, brokers, regulação, economia, segurança e tecnologia). Carrossel setas/dots acessíveis.
- Ventusky em lugar privilegiado; opção ampliar; USD/BRL comercial, diesel/EIA, Brent/dados verificados no módulo Mercado em Foco. Não rotular delayed como live.
- Módulo futuro editorial humano “Por que importa para Driver / Carrier / Dispatcher?”; não gerá-lo só com headline.
- 1-2 CTAs contextuais por página em blocos explicitamente comerciais, **não mascarar publicidade de reportagem**. Newsletter trilingue opcional com consentimento e gestão opt-out.
- Modal Android compacto aprovado SEM SCROLL desnecessário; imagens com licença/credito; backup v32.
- Primeiro distribuir por conteúdos de alta utilidade US em português; ES e EN ampliam com controle editorial/qualidade, não apenas strings auto-traduzidas.

## 5. Arquitetura de receita (valores de TESTE, não preços aprovados)
A. **Carrier-paid** recruiting/placement (primeiro motor de caixa): piloto US$900–1,200 por motorista efetivamente seated/verified; referência defensável US$1,200 split em US$600 na orientação/início e US$600 após 21 dias, com termos de substituição e atribuição; preço regular teste US$1,200–1,600 conforme custo de aquisição e nicho. **Candidatura e contratação do motorista não devem exigir pagamento**.
B. **Jobs em destaque**: US$79–149 por 30 dias, distinguindo autopublicação/visibilidade de serviço de recrutamento; vender depois de provar distribuição e qualidade de leads; não prometer contratação.
C. **Consultoria operacional para carriers**: diagnóstico US$299–499; projeto curto e escopo contratado US$990–2,500; compliance legal/tributário reservado a profissionais licenciados, e separar claramente honorários do trabalho de implementação por terceiros.
D. **Providers/Partners**: micro-patrocínio/categoria US$300–750/mês em piloto após audiência medida; qualified referral/lead aceito US$30–100 se consentimento/direitos permitirem; identificar patrocinado; não vender contatos pessoais ocultos.
E. **Newsletter DrivMatch Brief**: grátis para leitor e bilíngue/trilingue conforme escala; patrocínio mais tarde cotado por aberturas verificadas e não por inscritos brutos. CPM B2B de newsletter varia amplamente e contratos devem partir de amostra de público efetivo.
F. **Marketplace DrivMe**: manter regras e taxas legítimas para serviços/solicitações não relacionadas a emprego; nunca confundir com recruiting para motorista e validar contratos, autoridade regulatória, pagamentos e worker classification.
G. Academy/frota B2B US$10–30 motorista/mês é hipótese futura sob piloto com ROI e métricas verificadas, **não receita atual**.

**Benchmarks externos:** OTR Express Group declara US$1,600 seated driver split 50/50 (https://otrexpressgroup.com/carriers/); Platon Family oferece US$800 + US$800 (https://platonfamily.com/); RigGigs anuncia sem setup/mensalidade (https://riggigs.net/). São ofertas comerciais de fornecedores, não preço universal.

## 6. Exemplos de receita bruta mensal de teste — NÃO previsões
Piso: 3 successful hires×US$1,200 +2 diagnostics×US$350 +2 sponsorships×US$350 = **US$5,000 brutos/mês**.
Base: 6×US$1,200 +4×US$450 +3×US$400 = **US$10,200 brutos/mês**.
Crescimento: 12×US$1,200 +6×US$650 +6×US$600 = **US$21,900 brutos/mês**.
Não inclui ad spend, repasses a scouts/dispatchers, salários, reembolsos, refunds, impostos, licensing ou ferramentas; recebimento depende de venda, qualificação e contratos. Não chamar faturamento projetado de valor da empresa.
Escala inicial deve otimizar contribuição por matched hire real, com remuneração transparente a scouts parceiros vinculada a receita líquida recebida e retenção, SEM incentivo a spam/discriminação.

## 7. Prova/valuation: nada de métricas inventadas
Snapshot reportado 08/10: 210 usuários, 48 jobs, 23 completed, 18 open. Necessário reconciliar 7 jobs restantes, auditoria de hire, pagamento, receita real, CAC, retenção e origem.
Estimativas históricas de valuation divergiram (desde faixas conservadoras ~US$500k–1.5m até hipóteses base muito maiores); **não há avaliação independente ou receita comprovada nesta reunião**. Atualizar valuation somente com dados auditáveis e múltiplos compatíveis.
Correção comercial URGENTE: remover/suspender “500+ drivers this week”, “500+ Drivers, 50+ Carriers, 30+ Providers” se analytics interno não sustentar os números, e alinhar Home “drivers pay after selected” com /pricing “fees waived in launch”; preferir employer-pays recruiting (sujeito à decisão formal).

## 8. Equipe mínima e plano 90 dias
**Dias 1–14:** auditar homepage/promessas, definir employer-paid policy e contratos; corrigir copy e KPIs; analytics/GA4 + Search Console + eventos UTM + CRM pipeline; landing B2B simples, notícias com deep links, 10 calls com carriers atuais, 20 entrevistas com drivers/dispatchers.
**Dias 15–30:** 3 clientes carrier piloto contratados, 3–5 prospects por cargo, 1 briefing diário PT-BR em formato sustentável, 1 case verificado, termos de sponsorship; acompanhar páginas/news→signup→match.
**Dias 31–60:** confirmar seated hires e recebimentos, 2 ofertas de consultoria, 2 pilotos com patrocinadores SOMENTE se audiência mensurada, news SEO forte em states/corridors e direitos; escalar outreach B2B.
**Dias 61–90:** meta operacional de teste 5–10K receita BRUTA mensal recebida, alvos de 300–500 drivers opt-in ativos apenas se CAC/retencão suportarem, 3–6 carriers pagantes, métricas funnel+repeat e revisão financeira.
**Medir semanalmente:** usuários ativos segmentados, qualified carrier leads, jobs válidas, drivers elegíveis, entrevistas, offer, seated/retained 21d, revenue collected, refunds, margem por hire, origem News vs outros, CTR News→Job/Carrier/Consulting, opt-ins e unsubscribe, latência da publicação, fontes revisadas.

## 9. Governança
- Lei de consumidor e direitos de trabalho/recrutamento/worker classification, background/consentimento/data retention; FMCSA qualificação de motoristas e certificações/authority com validação humana. Não prometer que tradução linguística substitui requisitos profissionais.
- FTC exige identificar claramente publicidade nativa e conexão material com patrocinadores: https://www.ftc.gov/business-guidance/resources/native-advertising-guide-businesses
- **Main website pertence a implantação diferente da News**. GitHub conectado nesta reunião lista apenas `handsondispatcher/drivmatch-news`; não afirmar alteração do `drivmatch.com/`. News v33 / backup v32 intactos até aprovação/PR.

## Decisão para o conselho
**Recomendar** “Media → Trust → Intent → Qualified Lead → Paid B2B Match/Consulting → Retention” como arquitetura de crescimento e monetização, com execução web-first e validação rápida. Dar prioridade a carrier-paid hiring e consultoria; monetizar anúncios SOMENTE com métricas. Avaliar novo layout em protótipo responsivo e testes, não liberar automaticamente. Todos os preços e metas neste documento são hipóteses comerciais para aprovação, não estado atual do negócio.
