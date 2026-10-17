# DrivMatch News — Regra Canônica de Cronologia Editorial

Estado: VIGENTE — 2026-10-13.

## Últimas notícias (lista principal)
- Ordenar todas as matérias elegíveis estritamente por `published_at`, em ordem decrescente, usando o instante absoluto (UTC), independentemente de fuso, idioma, fonte, editoria ou tipo de conteúdo.
- Nunca promover uma notícia antiga acima de notícia recente por alternância de categoria, diversidade de fontes, preferência de reportagem versus boletim, ou prioridade comercial.
- Em empate, aplicar identificador estável como desempate para evitar saltos entre atualizações.
- Data inválida ou ausente não confere prioridade; a notícia vai após matérias com data válida. Não inventar horários.
- Paginação preserva essa ordenação. Filtros de usuário reduzem o conjunto mas não alteram o critério de ordenação.
- Uma matéria já visível nas seções de destaque não deve se repetir na lista principal.

## Destaques, Leia também e Em foco
- Podem usar curadoria por relevância, atualidade e diversidade editorial.
- Não renomear a curadoria como “Últimas notícias” ou sugerir que sua ordem seja cronológica.
- Nunca modificar o horário real de publicação, que deve continuar exibido com proveniência.

## QA obrigatório
- Caso 12/10 15:18 versus 13/10 00:33: na lista, 13/10 00:33 aparece antes.
- Mesma ordem por timestamp para PT, EN e ES.
- Nenhum anúncio, imagem licenciada, preço, idioma ou posicionamento publicitário deve ser alterado por esta regra.
- Proteger por teste automatizado e revisão de produção após deploy.

## Emenda — ALERTA CLIMÁTICO (2026-10-17)
Os boletins do NWS e as matérias classificadas editorialmente como Clima ficam exclusivamente na nova área pública ALERTA CLIMÁTICO, acessada pelo botão visível na capa. Sua lista é ordenada estritamente por `published_at`, mais recente primeiro, e inclui alertas distintos para localidades diferentes, sem colapsar avisos oficiais de municípios/condados distintos pelo simples tipo de fenômeno. A lista normal permanece cronológica após excluir os itens enviados à seção climática. Status, fonte e hora originais não são alterados; alerta publicado não é necessariamente ativo. Interdições rodoviárias exigem fonte DOT/511. O seletor PT/EN/ES e o filtro “Clima” devem acessar o mesmo conjunto, sem criar histórias nem descaracterizar outros conteúdos editoriais.
