# DrivMatch News v34 — War Room Editorial Edition | Release Control

**Data de elaboração:** 09/10/2026. **Status:** `development_prelaunch` / `public_launch_approved=false`. **Natureza:** revisão editorial de aparência, sem relançar o negócio principal, sem criar matching/cadastros, sem prometer receita ou valuation.

## 1. Snapshot conservado ANTES da primeira alteração v34

- **v33 preservada integralmente** (árvore Git versionada): branch `backup/v33-approved-2026-10-09`, commit exato **`fea227dde034e101ace8299357579ddfe98fe256`**. Recuperável sem reverter à v32 e sem apagar o histórico v34.
- **v32 também preservada:** `backup/v32-approved-2026-10-09`, commit `659a146b8f48c342c2a62d86a1330d59760116d4`.
- **Desenvolvimento:** `development/v34-editorial-newsroom-2026-10-09`. Não mover branches de backup e **não executar reset ou force-push** sobre `main`. Restaurar apenas por PR regular, após testes e deploy.
- Não afirmar que branches em si sejam proteção operacional garantida: são pontos de recuperação versionados; backups externos de infraestrutura são distintos.

## 2. War Room de decisão — *papéis analíticos simulados*, sem alegar a participação real de conselheiros

| Mesa de controle | Critério de veto ou aprovação |
|---|---|
| Produto (Tônio) | O visitante entende que é jornal? Navegação de categorias usa busca/filtro existentes, sem criar cadastro extra? |
| Marca/Growth (Vinny Jr.) | Logomarca oficial preservada, fotografia e manchetes dominam; navegação usável em celular? |
| Operação (Chico) | Clima Ventusky, dólar spot, diesel, fretes e alertas editoriais mantidos com fonte e disponibilidade honesta? |
| Finanças/Valuation (Paulo Guedes — lente econômica) | Receita e valor da empresa não são alegados sem ledger/dados auditados? Notícias geram tráfego para soluções reais, não promessas financeiras? |
| Deloitte — lente de auditoria (não representação real) | `public_launch_approved=false`, fontes verificáveis, licença das imagens, delimitação editorial/comercial e contratos não inventados? |
| Editorial/Legal/Privacy Agents | Fotos licenciadas ou ilustrações marcadas; leitor acessa fonte externa; propaganda não mascarada; sem dados pessoais em URL? |
| Engenharia/Acessibilidade/Qualidade Agents | Regressão Playwright 360/390/768/1440, zero overflow, popup compartilhar, link original e release gate; CDN/domínio certo? |

**Regra:** barreiras de compliance, conteúdo, atribuição, publicidade, dados e segurança não podem ser compensadas por uma nota visual alta. Aprovação automatizada comprova apenas seus testes, não equivalência a aprovação humana/editorial de produção pública.

## 3. Diretrizes visuais v34 / revista-jornal, sem cair em dashboard de vendas

**Paleta:** base branco/off-white, navy profundo, azul original da marca como acento, fotografias editoriais permitidas como principal cor. *Não* adicionar arco-íris de botões por perfil. O jornal domina.

- Logo **arquivo original** horizontal DrivMatch News; marca, idiomas BR/US/ES e rodapé institucional mantidos.
- Barra editorial compacta: Capa, Caminhoneiros, Fretes, Regulamentação, Segurança, Tecnologia e acesso a Clima/Mercado. Categorias usam filtros existentes e seus textos recebem localização.
- Uma manchete principal com fotografia **de arquivo licenciada e corretamente atribuída**, título legível com tratamento navy; quando não há imagem licenciada, cartão **ilustrado sem fingir fotografia real**. Três matérias relacionadas preservadas (v31/v32/v33).
- Cinco manchetes em foco agora com thumbnails reais catalogadas ou fallback ilustrativo honesto, mantendo crédito na janela de matéria. Não adulterar o conteúdo nem publicar manchetes do mockup HD como notícias.
- Clima Ventusky e Mercado em Foco continuam coluna de utilidade; cotações mostram observação, fornecedor e valor somente quando disponível. Sem números fabricados. News ticker/crawler continua sem falsos alertas operacionais ao vivo.
- Divulgação comercial em **um único bloco discreto, explicitamente «Serviços DrivMatch»**, fora do fluxo de texto jornalístico, com duas rotas de acesso ao site principal; os links só conduzem à HOME verificada da plataforma com parâmetros UTM sem PII. *Ainda não* há conversão end-to-end comprovada; links diretos de onboarding requerem verificar as rotas exatas, sistema de analytics e consentimento.
- Não alterar estilos ou DOM funcional do **modal Android compacto** aprovado nem share picker, idiomas, créditos, origem/tradução e fotos.
- Responsividade editorial: hero e relacionadas lado a lado no desktop; no mobile hero primeiro, relacionados abaixo e lista de cinco rolável horizontalmente. Texto e botões legíveis, respeito a `prefers-reduced-motion`.

## 4. Baselines preservados e regressões de não-perda

- **v31:** 1 hero + 3 relacionadas, logo horizontal azul, idiomas.
- **v32:** links da fonte e créditos, miniaturas licenciadas, Ventusky, mercado verificado, partilha social, navegação e modal Android curto sem scroll interno em 360/390 ×680.
- **v33:** setas compactas, bolinhas acessíveis e swipe, 5 manchetes, melhorias tipográficas, coluna Mercado/Clima, release gate aberto, versão manifestada.
- **v34:** layout editorial acima sem recursos comerciais intrusivos.

## 5. Testes e critérios de release

1. `python -m unittest discover -s tests`
2. `node tests/test_client.js`
3. `scripts/update.py` real com validação de fontes e cotações, e pipeline de fotografias e cards sociais (conforme `.github/workflows/deploy.yml`).
4. Playwright `tests/test_browser.cjs` larguras 360, 390, 768, 1440 e checks: header/logo, 1 hero+3, fotos atribuídas, cinco destaques, navegação e links, dados/idiomas, Ventusky, ticker, nenhuma barra horizontal; **modal mobile aprovado sem regressão**.
5. Identificadores `v34` em HTML/manifest, pacote e domínio personalizado, verificações de JPEG/cards e feed News exportado; status e caches observáveis.
6. Gate editorial/legal/comercial/visual sob [issue #18](https://github.com/handsondispatcher/drivmatch-news/issues/18): **permanece ABERTO**. O merge só promove desenvolvimento e avaliação, **não** autoriza campanha ou anúncio de lançamento.

## 6. Trilha econômica e transparência

O plano de negócio / valuation / monetização permanece em [WAR_ROOM_ESTRATEGIA_DRIVMATCH_NEWS_E_RECEITA_2026-10-09.md](WAR_ROOM_ESTRATEGIA_DRIVMATCH_NEWS_E_RECEITA_2026-10-09.md). As faixas de preços e os modelos de recrutamento são **hipóteses**, não contratos confirmados. O valor da empresa, aquisição de clientes, matches pagos, CAC, audiência e métricas de receita só podem ser anunciados após verificação dos sistemas competentes. A v34 **não modifica** a plataforma principal DrivMatch, não adiciona paywall nem cobrança de motorista e não mexe no Matching Engine.

**Decisão do War Room:** jornal primeiro; acesso comercial secundário, discreto e rastreável; integridade > rapidez; v33 intacta para reversão.
