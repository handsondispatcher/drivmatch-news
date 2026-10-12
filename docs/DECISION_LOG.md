# DRIVMATCH ECOSYSTEM 360° — DECISION LOG
**Atualizado:** 2026-10-12 · **Escopo deste PR:** documentação para revisão; as entradas registram o que foi declarado, recomendado ou comprovado; **não** são aprovações automáticas para executar software, assumir obrigações comerciais ou lançar.

## Convenção

- `FOUNDER_DIRECTIVE`: intenção/diretriz expressa pelo fundador.
- `REPO_FACT`: inspeção do GitHub em data indicada (pode mudar).
- `PROPOSED`: alternativa a analisar, não adotada.
- `REQUIRES_DECISION`: decisão pendente.
- `BLOCKED`: não avançar a atividade afetada sem evidência.
- `CLOSED_WITH_EVIDENCE`: exige link de PR/issue/teste/contrato; **nenhum gate de lançamento ganha esse status por criar este documento**.

## Decisões e princípios já estabelecidos

| ID | Estado | Registro | Consequência prática |
|---|---|---|---|
| D-001 | FOUNDER_DIRECTIVE | DrivMatch = ecossistema de informação, oportunidades, educação, transporte, serviços e parceiros; News é porta de entrada, não fim em si | Projetar CTAs contextualizados e uma rede de valor recíproco |
| D-002 | FOUNDER_DIRECTIVE | Não disputar leitores de forma excludente; veículos e concorrentes podem ser aliados | Estudar syndication, mídia-kit e distribuição recíproca |
| D-003 | FOUNDER_DIRECTIVE | Visão de helicóptero: riscos devem provocar oportunidades e alternativas, não só objeções | Risco + mitigação + experimento, mantendo avaliação independente |
| D-004 | FOUNDER_DIRECTIVE | Já há cursos, consultorias, brokerage, transporte, Instagram, alunos e dispatchers parceiros; não recomeçar o negócio | Auditoria e reaproveitamento precedem construção |
| D-005 | FOUNDER_DIRECTIVE | Divulgação no Instagram de seguro saúde e Oficina Gorila (Massachusetts) já acontece | Mapear relações/condições; **não** inferir receita, licença ou contrato |
| D-006 | FOUNDER_DIRECTIVE | Especialistas podem ser colunistas e patrocinadores/prestadores | Independência editorial e disclosure obrigatório |
| D-007 | FOUNDER_DIRECTIVE | Paulo Landim / Road TV são exemplos de colaboração potencial | Tratar como prospect; não afirmar permissão de reprodução |
| D-008 | FOUNDER_DIRECTIVE | IA como operação enxuta, com propriedade societária preservada e crescimento bootstrap preferido | Controlar custos, segredos, qualidade, supervisão e expansão |
| D-009 | REPO_FACT | `content/release.json` na inspeção de 12/10: News v34.11 / `public_launch_approved=false` | Public launch ainda requer issue #18 e evidência |
| D-010 | REPO_FACT | News tem histórico de backups v32/v33 e v34.x com proibições de regressão | Preservar layout, identidade, funcionalidades e backups; PRs de baixo escopo |
| D-011 | REPO_FACT | Issues #59/#36/#35/#88 reportam falhas/restrições de vídeo e frescor editorial; abertas na inspeção | Não considerar build verde confirmação de player ao vivo ou notícia nova |
| D-012 | REPO_FACT | `DrivMatch/drivmatch` retornou 404 na conexão disponível em 12/10 | Engenharia do app principal: UNKNOWN até recuperar acesso |

## Hipóteses e propostas ainda NÃO aprovadas

| ID | Estado | Hipótese/proposta | Verificação prévia |
|---|---|---|---|
| P-001 | PROPOSED | Links/deep links primeiro; API e CRM integrado depois, somente quando necessário | Inventário do app atual e fluxo de lead |
| P-002 | PROPOSED | Diretório piloto com 2–5 parceiros, inclusive Oficina Gorila se houver concordância | Contrato, autorização, forma de cobrança, jurisdição, contato correto |
| P-003 | PROPOSED | Vagas/carrier-paid recruiting como via de caixa complementar | Contratos, regras, fluxo e números reais; preços no War Room são testes |
| P-004 | PROPOSED | Mídia-kit/colunas e patrocínio da News | Audiência medida, anúncios identificados e gate editorial |
| P-005 | PROPOSED | English Lab como oportunidade de formação de motoristas | Conteúdo, estrutura pedagógica, instrutor, operação, preço, demanda |
| P-006 | PROPOSED | Revisão expandida de fretes B2C e marketplace de prestadores | Operação/authority/seguro, mecanismos antifraude, suporte |
| P-007 | PROPOSED | Uso de parceiros como canais de distribuição de mão dupla | Consentimento, attribution, métricas por origem/receita |
| P-008 | PROPOSED | Estrutura de entregas em quatro arquivos GitHub | Revisão e aprovação do PR; estes arquivos não alteram produção |

## Decisões exclusivamente do fundador / evidências pendentes

| ID | Questão | Opções sem pressupor resposta | Gate/dependência |
|---|---|---|---|
| R-001 | Qual é o repositório/instância oficial do app DrivMatch? | Acesso à URL correta por integração GitHub ou revisão assistida read-only | E360-02 |
| R-002 | Quais serviços têm preço, operador, formulário e contrato vigentes? | Catálogo por operação, não por ideia de produto | E360-08, G-SERVICES |
| R-003 | Qual a finalidade legítima das bases de contatos para campanhas? | Contato individual legítimo, opt-in renovado, apenas atendimento de contrato; avaliar cada caso | E360-10, G-DATA |
| R-004 | Como parceiros existentes são remunerados ou divulgados? | Cortesia, anúncio contratado, patrocinador, referral quando permitido, outros | E360-16, G-PARTNERS |
| R-005 | Qual piloto comercial ativa primeiro? | (A) curso/consultoria; (B) vagas/carriers; (C) prestadores; (D) frete B2C — podem coexistir se simples | E360-09, E360-15 |
| R-006 | Quem revisa matérias críticas e aprova a abertura News? | Fundador + editor designado; se não houver editor designado, processo de aprovação humana | G-NEWS |
| R-007 | Há autorização de terceiros para foto/vídeo/entrevista/syndication? | Obter licença formal ou usar somente links/embeds autorizados dentro dos termos | E360-19/20 |
| R-008 | Como cobrar anúncios de prestadores? | Espaço, destaque, patrocínio, lead consentido, ou gratuito no piloto — preços só após teste | G-COMMERCIAL |
| R-009 | Quem responde por cada fluxo no momento da exceção? | Responsável humano e fallback, mesmo com agentes IA | E360-14 |
| R-010 | Autorizar go-live da News? | **NÃO AUTOMÁTICO**; depende de evidências de #18 e critérios vinculados | G-NEWS, G-RELEASE |
| R-011 | Aceitar PR de documentação? | Revisão/merge de docs exclusivamente após decisão do proprietário | PR de documentação |

## Política de decisão operacional

1. Quando houver conflito entre relatório de IA e arquivo de release + teste datado, usar o fato verificado; manter divergência em aberto até inspeção.
2. Não promover `USER_DECLARED` a `REPO_VERIFIED` sem fonte independente.
3. Uma promessa comercial pública nova exige aceite do fundador e regras apropriadas.
4. Nenhuma decisão financeira, licença, parceria, acesso a dados ou fusão de cadastros ocorre por implicação de um plano.
5. Em caso de problema material, modo seguro: não publicar, não atribuir valor não verificado, reduzir automação e escalar a humano.
6. Datas de conclusão só após estimar esforço com acesso ao sistema real.
7. Mudanças de interface News respeitam o contrato visual congelado e os PRs/Change Control existentes.

## Registro de alterações

- **12/10/2026 — proposta documental:** harmoniza conversas do fundador, War Room 09/10, release News v34.11, issues abertas e relatório Gemini Missão 01. Nenhuma alteração de código, publicação, pricing ou lançamentos executada. Autoridade final de implementação permanece com o proprietário.

Links: [Ecossistema](ECOSYSTEM_MASTER.md) · [Backlog](MASTER_BACKLOG.md) · [Handoff](PROJECT_HANDOFF.md).
