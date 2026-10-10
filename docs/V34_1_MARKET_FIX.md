# DrivMatch News v34.1 — Mercado em Foco sem tickers vazios

**Data:** 09/10/2026 · **Estado:** `development_prelaunch` / `public_launch_approved=false`.

## Evidência de problema
O usuário enviou uma captura real do smartphone mostrando uma coluna muito longa de tickers sem qualquer valor — J.B. Hunt, Knight-Swift, Schneider, Werner, Old Dominion, XPO, Landstar, C.H. Robinson, FedEx — e indicadores Class 8 pedidos/vendas também como “—”. Isso ocupava várias telas e não entregava valor, embora v34 já estivesse identificada como publicada. **Falha de acabamento e de verificação de utilidade**, não problema que deva ser atribuído automaticamente ao cache.

## Remediação adotada
- **Excluir por completo da interface pública** a seção de ações (inclusive seus tickers) e os indicadores Class 8. Não apenas esconder “—” por CSS: a lógica de rendering deixa de gerar essas linhas.
- **Não solicitar** no `make_market()` dados Finnhub/Class 8 que não serão consumidos; contratos de fonte conservados como código histórico para futuro piloto legalmente autorizado.
- **Exibir somente** USD/BRL comercial, diesel EIA/FRED ou petróleo Brent quando o dado tiver preço numérico positivo, data válida, fonte atribuída e idade aceitável (USD/BRL até 5 dias; diesel até 35; Brent até 14); números atrasados são referenciais, nunca “live”.
- Quando todos indisponíveis, exibir **uma única mensagem** clara em PT/EN/ES, não 14 linhas de “—”. Metadados de origem, unidade e data continuam visíveis para os valores reais.
- Preservar hero editorial, fotos/atribuições, filtros, ticker de manchetes, Ventusky, modal mobile compacto, compartilhamento, logomarca oficial e idioma.

## Baseline/rollback
- **v34 publicada original** permanece em `backup/v34-initial-2026-10-09`, SHA `3ea738b87f1efd482d5dac95b536c241b9cae9de`.
- **v33** permanece em `backup/v33-approved-2026-10-09`, SHA `fea227dde034e101ace8299357579ddfe98fe256`.
- **v32** permanece em `backup/v32-approved-2026-10-09`, SHA `659a146b8f48c342c2a62d86a1330d59760116d4`.
- Rollback exige PR regular, testes, nunca apagar história/force push.

## Testes de aceite (não dispensáveis)
Python unittest, JS smoke incluindo dados vazios e cotação válida, testes Playwright 360/390/768/1440 que exigem **sem FDX/ações e sem Class 8**, sem overflow, no máximo 3 indicadores válidos, fallback único se nenhum. Pós-deploy GitHub Pages + verificação de `v34.1` no domínio oficial e manifesto; issue #18 permanece aberta para revisão humana e direitos editoriais.

**Princípio financeiro:** não inventar cotações, receita, matches ou valuation para preencher espaços. Não existe cobrança adicional, integração com outro Matching Engine ou conteúdo pago nesta correção.
