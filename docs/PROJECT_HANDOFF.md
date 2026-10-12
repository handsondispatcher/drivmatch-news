# DRIVMATCH ECOSYSTEM 360° — PROJECT HANDOFF
**Edição:** 2026-10-12  
**Propósito:** continuar o trabalho em novos chats com ChatGPT/Gemini/Codex sem colar todo o histórico.  
**IMPORTANTÍSSIMO:** este handoff resume um plano; ele não confirma produção, integração, contratos, pagamentos ou aprovação de lançamento.

## Leitura em 5 minutos — links na ordem certa

1. [Este handoff](PROJECT_HANDOFF.md), identificando branch/versão efetivamente consultada.
2. [ECOSYSTEM_MASTER.md](ECOSYSTEM_MASTER.md): tese, operações existentes declaradas, arquitetura e controles.
3. [MASTER_BACKLOG.md](MASTER_BACKLOG.md): E360-01…E360-28, dependências, critérios de conclusão.
4. [DECISION_LOG.md](DECISION_LOG.md): diretivas, propostas e decisões pendentes.
5. [CONTINUIDADE_DRIVMATCH_NEWS.md](CONTINUIDADE_DRIVMATCH_NEWS.md), `content/release.json`, [War Room](WAR_ROOM_ESTRATEGIA_DRIVMATCH_NEWS_E_RECEITA_2026-10-09.md), docs v34.x e [release gate #18](https://github.com/handsondispatcher/drivmatch-news/issues/18); olhar também issues #59/#36/#35/#88.

**Precedência:** quando houver divergência, preferir estado de código/release e logs/testes atuais para fatos técnicos, depois atas e declarações do fundador identificadas como tais. Não tratar relatório Gemini simulado como auditoria do GitHub.

## Repositórios e fronteira

- News disponível: `handsondispatcher/drivmatch-news`, branch principal `main`, docs `docs/`.
- Repositório principal citado: `DrivMatch/drivmatch`; em 12/10/2026 retornou 404 à conexão disponível: **acesso não confirmado**. Confirmar endereço e permissão antes de qualquer afirmação ou PR técnico.
- Site principal: `https://drivmatch.com/`; News: `https://drivmatch.com/news/`. **URL de site não prova que função esteja homologada.**
- Baseline News consultada: `v34.11`, `development_prelaunch`, `public_launch_approved=false`. Checar novamente a cada retomada.
- Docs deste pacote foram propostas em branch `docs/ecosystem-360-master-20261012`; **não presumir merge** na `main` até consultar o PR.

## O que já sabemos, sem reabrir o briefing

- Fundador vende cursos dispatcher (500+ alunos informados) e cargo van (300 alunos informados; potencial sobreposição); presta consultorias e serviços operacionais, atua em brokerage e transporte de veículos e tem dispatchers parceiros.
- Mantém base de cadastros DrivMatch e Instagram `@fabriciodispatcher` com divulgação de terceiros, incluindo seguro saúde e Oficina Gorila de Massachusetts; custos, receita das divulgações e contratos não comprovados aqui.
- Quer construir um ecossistema colaborativo: imprensa não excludente, terceiros como colunistas e patrocinadores (sem vender julgamento editorial), News como entrada para empregos, educação/English Lab, serviços e fretes.
- Paulo Landim / Road TV são parceria potencial, nunca licença assumida.
- Operação lean e IA sob controles editoriais, jurídicos, de privacidade e segurança.
- Gemini Missão 01 revisada tem ideias de 20 tarefas, mas sua auditoria foi simulada e parte das classificações e prioridades estava incorreta; a versão corrigida é o backlog acima.
- Proteger a identidade/layout congelados News e backups v32/v33/v34.x; não voltar à v18.

## Primeira tarefa de uma nova sessão

**Missão de inventário somente leitura, E360-01 e E360-02.**

1. Revisar GitHub main/release, issues abertas, últimas execuções e evidências de teste da News.
2. Conferir o repositório principal da DrivMatch se o acesso já existir, mapeando páginas/funcionalidades realmente existentes.
3. Produzir tabela `FEATURE | ESTADO | URL/ARQUIVO | EVIDÊNCIA | FALTA | DONO` e reconciliar com backlog.
4. Não duplicar issue nem instalar outro CRM/matching sem estudar o atual.
5. Atualizar o `DECISION_LOG` ou propor PR separado documentando apenas fatos novos.
6. Não pedir ao fundador que repita o briefing já preservado; perguntar apenas decisões impossíveis de inferir.

## Modelo padrão para repassar tarefa entre modelos

```text
CONTINUE DRIVMATCH ECOSYSTEM 360°.
Fonte de verdade: docs/PROJECT_HANDOFF.md, docs/ECOSYSTEM_MASTER.md,
docs/MASTER_BACKLOG.md, docs/DECISION_LOG.md no repositório
handsondispatcher/drivmatch-news (verifique o PR/branch atual).

Leia também content/release.json, continuidade e issues #18/#59/#36/#35/#88.
Não confunda pré-lançamento da News com negócios existentes do fundador.
Separe fatos auditados, declarações do fundador, hipóteses e bloqueios.
Preserve UX, logos e backups existentes. Nenhum deploy ou alteração na main.
Tarefa desta execução: [ID e texto do backlog].
Entregue: evidências, arquivos afetados, testes, riscos, dependências,
próximo passo e decisões humanas necessárias.
Se o app principal não estiver acessível, declare UNKNOWN e não invente.
```

## Forma segura de trabalhar com Codex

- Uma tarefa definida → branch isolada → diff/PR → CI → screenshots/testes reais quando aplicável → revisão → merge autorizado → smoke pós-deploy.
- Mudanças de runtime diferentes deste pacote exigem PR próprio; não escrever secrets em código/issues/chats.
- Confirmar a experiência do visitante real, não somente HTML, mock, build verde ou `iframe.onload`.
- Problema de vídeo/News: continuar nas issues existentes (#18, #59, #35, #36, #88), não reabrir pedidos equivalentes.
- Não criar anúncios falsos para demonstrar slot, nem publicar preço não aprovado; não usar cadastro legado indiscriminadamente para marketing.

## Como medir um resultado verdadeiro

Evidência da jornada completa `origem → conteúdo/oferta → clique → consentimento quando necessário → lead → operador → retorno → conversão real`, mais qualidade editorial, custo por fluxo, direitos, suporte, reclamações e estado financeiro (receita faturada/recebida não equivale a volume bruto intermediado).

## Atualização deste handoff

Ao concluir tarefa material: registrar data, status, evidência e PR/issue; atualizar backlog/decisions com mínimo necessário; manter histórico, não apagar bloqueadores para parecer que projeto está pronto. Se um documento antigo afirmar número conflitante, marcar divergência e buscar fontes primárias em vez de escolher o maior.

**Próximo avanço imediato:** acesso/inspeção do app principal e auditoria de flows existentes, em paralelo às issues editoriais abertas. Publicação pública da News permanece bloqueada até aprovação humana expressa.
