# Auditoria inicial SOMENTE LEITURA — aplicação principal DrivMatch
**Data:** 2026-10-12  
**Fonte:** repositório privado `DrivMatch/drivmatch`, conectado à conta `DrivMatch`; inspeção do `main` por GitHub; **não** executou deploy, login, consulta direta ao Supabase nem teste de visitante real.  
**Objetivo:** corrigir o backlog transversal, evitando construir novamente módulos que o Ricardo já desenvolveu.

## 1. Comprovação de acesso e baseline

- Repo privado `DrivMatch/drivmatch` acessível por conexão GitHub da conta DrivMatch.
- Branch default `main`; commit mais recente consultado `b785ab31fb87c60f97fb20314be881c1caaf0b6b` ("Add News link to public header"), commit datado 2026-10-08; não inferir que deploy atual usa exatamente esse commit sem checagem Cloudflare/Lovable.
- Código: React 18 / TypeScript / Vite 5.4.x, React Router, Supabase JS/Auth, React Query, Stripe JS e testes Vitest + Playwright.
- `src/integrations/supabase/client.ts` usa variáveis `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` para a conexão Supabase.
- Documentação existente: `AGENTS.md`, `docs/contexto-projeto.md`, `docs/decisoes-tecnicas.md`, `docs/backlog.md`, `docs/2026-04-26-provider-marketplace-gap-plan.md`.
- O repositório tem diretório `supabase/` com `migrations` e `functions`; nenhuma alteração ou SQL foi aplicada.

## 2. Inventário do código (não representa homologação integral em produção)

| Domínio existente | Evidência de código | Implicação para Ecosystem 360 |
|---|---|---|
| Portal público e autenticação | `src/App.tsx` rotas `/`, `/signup`, `/login`, `/pricing`, Supabase Auth | Usar estrutura atual, não criar uma segunda base de logins |
| DrivMe / requests | `CreateRequest`, `RequestDetail`, dashboards, `job_requests`, `driver_pool`, negociação e unlock (documentação e código relacionado) | Reutilizar ou melhorar fluxo existente antes de construir solicitação de frete B2C |
| Carriers/Drivers/Dispatchers | `src/pages/carrier/`, `src/pages/dispatcher/`, `DriverDashboard`, `CarrierFindDrivers` com `driver_profiles`, `carrier_drivers` e convite via `job_invitations` | Não definir Jobs & Recruiting como módulo inexistente; auditar a elegibilidade e o fluxo real |
| Marketplace de prestadores | `src/pages/Marketplace.tsx`, `MarketplaceJoin.tsx`, `ProviderProfile.tsx`, `AdminMarketplace.tsx` | Diretório/categorias/candidatura/admin **já implementados**; ampliar e integrar, não construir outro |
| Leads de prestadores | `docs/2026-04-26-provider-marketplace-gap-plan.md` registra `Request a Quote`, `service_requests`, `submit-provider-quote-request`, email e visibilidade admin | Verificar em ambiente real antes de reutilizar; completar experiência do prestador, atendimento e medição conforme backlog atual |
| Listagens de equipamentos | `Equipment.tsx`, `EquipmentDetail.tsx`, `MyListings.tsx` e preços por listing | Capacidade de classificados/equipment já existe; não iniciar catálogo paralelo |
| Live | `Live.tsx`, `AdminLive.tsx`, funções/backend descritos nos docs | Integrar notícias de modo correto, **sem** confundir feed editorial com alerta operacional validado |
| Billing/Payments | `@stripe/stripe-js`, Edge Functions de checkout/webhook documentadas | Fazer levantamento de receita, responsabilidade e contratos antes de ampliar cobranças |
| News CTA no site | `GlobalHeader.tsx` inclui link `/news`; commit `b785ab3` | Existe navegação inicial, mas a jornada inversa News→serviço ainda requer teste de ponta a ponta |

## 3. Decisões arquiteturais do próprio projeto que devem ser respeitadas

- `public.users` é referência principal de identidade operacional; `profiles` aparece como exceção documentada. Não migrar ou fundir tabelas por iniciativa isolada.
- Roles confirmados: `driver`, `dispatcher`, `carrier`, `client`, `provider`; `seller` funciona como addon, não role principal de banco verificado.
- Arquitetura é connection marketplace com DrivMe e não apenas um load board.
- Supabase/Stripe integrações e funções já existem; ações sensíveis exigem auditoria de RLS, permissions e logs.
- `docs/backlog.md` já prioriza inventário de tabelas, roles, RLS e fluxos; não duplicar esse backlog sem reconciliação.
- `AGENTS.md`: mudanças pequenas, preservar a arquitetura, informar arquivos afetados, validar e documentar; escopo atual é **read-only**.

## 4. Correções de interpretação do plano Gemini / Ecosystem 360

1. **Não criar "Diretório de Prestadores" de zero (EXP-04/E360-18).** Trabalhar sobre marketplace existente; piloto com parceiros atuais e funil de contatos, verificando lacunas de uso real.
2. **Não tratar "Classificados & Jobs" genericamente como propostas inexistentes.** Já há equipment listing, busca de drivers, job requests e dashboards; falta separar cada oferta com escopo e estado.
3. **Não criar CRM, formulário, identidade única ou pagamento paralelo antes da auditoria.** Leverages `users`, `service_requests`, `provider_applications`, `job_requests` e automações existentes.
4. **Serviços consultivos/educação/English Lab:** catálogo de ofertas e páginas ainda precisa de verificação; não supor integrados digitalmente.
5. **News v34.11 continua bloqueada para anúncio público:** os gates técnicos/editoriais do repo `handsondispatcher/drivmatch-news` são independentes da existência de negócio principal.

## 5. Verificações pendentes e riscos relevantes

- **Segurança:** arquivo `.env` aparece versionado no root do repositório privado. Não lemos seu conteúdo nem afirmamos conter secrets. Fazer revisão de segredos por processo confidencial, verificar se há credenciais sensíveis em histórico/CI, rotacionar se necessário; jamais colar conteúdo em issue, chat ou documento.
- **Testes reais:** não foram executados checkout, cadastro, RLS, aplicação do provider, email, notificações, matching, Cloudflare ou Lovable. Documentação de testes anteriores não equivale a reprodução nesta sessão.
- **Backend:** confirmar projeto Lovable/Supabase atual, migrations efetivamente aplicadas, RLS e ambiente staging, sem consultas a dados pessoais como primeiro passo.
- **Infra:** verificar se Cloudflare Pages `drivmatch-app` aponta para SHA desejado; não confundir com Worker separado.
- **Integridade comercial:** auditar claims e preços de `/pricing` e `/join` com evidências atuais e decisão do fundador.
- **Monetização do provider:** documento de abril relata que Featured Provider ainda não possuía ciclo comercial completo; revalidar antes de prometer venda automática.

## 6. Próximas cinco execuções sugeridas (sem repetir planejamento já aprovado)

- **A01** Inventariar roteamento, módulos, tabelas/RLS e funções usadas pelo DrivMe, Marketplace, Equipment e Jobs a partir do app existente (sem SQL/deploy).
- **A02** Mapear jornadas do leitor News até rotas **reais** (ofertas, fornecedor, emprego, cotação), identificando quais já terminam em lead e quais falham.
- **A03** Verificar separadamente os bloqueios News #18/#59/#36/#35/#88, sem mudar gates ou layout por implicação desta auditoria.
- **A04** Revisar segurança do `.env` versionado e autorização/atribuição de leads, em processo privado apropriado.
- **A05** Criar piloto *dentro do Marketplace existente* com parceiros consentidos (ex.: Gorila apenas mediante concordância), com atribuição e atendimento, sem criar CRM paralelo.

**Conclusão:** a conexão das duas contas GitHub resolveu o bloqueio documental de acesso. O maior valor agora vem de auditar, integrar e comercializar capacidades existentes, e não de desenvolver novo portal.
