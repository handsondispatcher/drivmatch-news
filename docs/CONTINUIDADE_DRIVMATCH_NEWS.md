# DrivMatch News — CONTINUIDADE CANÔNICA / LEIA PRIMEIRO

**Atualizado:** 09/10/2026. **Projeto:** Jornal DrivMatch News / Hands On Dispatcher LLC.  
**Versão de trabalho:** **v32**, sobre a branch **`main`** do repositório `handsondispatcher/drivmatch-news`. **Estado:** `DEVELOPMENT_PRELAUNCH`, `public_launch_approved=false`.  
**NÃO recomeçar, NÃO regredir à v18, NÃO pedir ao usuário que reconte decisões de chats anteriores.** Documento de continuidade para os chats «01 DrivMatch News», «02 DrivMatch News», «03 DrivMatch News» e suas continuações.

Este arquivo registra decisões recuperadas e resultados verificáveis até a data acima; não é cópia literal nem alegação de ter arquivado todo o texto de todas as conversas. Quando houver divergência, prevalecem decisões mais recentes do usuário e o código/testes reais.

## PRIORIDADE DE 09/10/2026 — REGRESSÃO ANDROID / INSTRUÇÃO EXPRESSA DO USUÁRIO

O usuário confirmou com **novas capturas de tela** que o comportamento de PR #22 («Compartilhar» fixado no rodapé) **NÃO resolveu a necessidade**. **Exigência mais recente, prioritária:** a janela de matéria no mobile deve ser **compacta o suficiente para caber inteira na tela**, **sem precisar rolar**, especialmente com notícia externa. As três opções PT/EN/ES de fonte e os dois botões «Compartilhar» / «Copiar link» devem ter **altura baixa**, caber lado a lado e aparecer já na abertura. **Não simplesmente mover/fixar o rodapé**. Manter acesso legalmente claro à fonte e aos créditos, preservar todas as opções de share. Layout desktop intacto. Quando títulos variáveis forem longos e o dispositivo muito baixo, deve preservar acesso ao conteúdo sem cortar a matéria; a regra básica 360×680 e 390×680 deve passar em testes automatizados de scrollHeight ≤ clientHeight.

A correção para esta última decisão está sendo desenvolvida no PR posterior ao #22 (compact mobile reader); conferir seu merge e CI/deploy ao continuar. **O usuário não precisa reexplicar isso, nem aplicar CSS manual.**

## 1. Autoridade e procedimento ao retomar em outro chat

1. Ler **este arquivo**, `docs/V32_RELEASE.md`, `content/release.json`, o **issue #18** e os últimos workflows de GitHub Actions.
2. Verificar estado real da `main`, PRs abertos, build, deploy, e `https://drivmatch.com/news/` versus `https://handsondispatcher.github.io/drivmatch-news/`.
3. Resolver regressões **diretamente no repositório**, em branch de correção com PR, testes e deploy. NÃO oferecer CSS/paches teóricos para o usuário aplicar; o usuário pediu execução completa.
4. Não declarar pronto para divulgação até homologação expressa: teste técnico não equivale a aprovação editorial, comercial nem jurídica.
5. Toda alteração deve preservar baseline v31/v32, marca, fontes, idiomas, estrutura, URLs sociais, rodapé e recursos posteriores. Nunca sobrescrever `main` com versões velhas.
6. Prestar contas com **fato comprovado** (PR, commit, resultado de CI, resultado pós-deploy, pendências), sem pedir instruções repetidas.

## 2. Linha do tempo e versões

- **v18:** arquivo visual histórico `reference/drivmatch_news_v18_aprovada.html`. **NÃO é a versão atual**.
- **v22 e anteriores:** desenvolvimento de clima, mercado e publicação, sujeitos a decisões posteriores.
- **v31:** direção visual/editorial estabelecida pelo usuário; manchete de destaque com foto + **três notícias relacionadas**, idiomas em atalhos com bandeiras e hierarquia jornalística; PR histórico #3. Funcionalidades restantes de antigo PR #7 foram integradas sobre código posterior via **PR #17**, não via rollback.
- **Depois da v31:** melhorias reais em compartilhamento WhatsApp, Facebook, Threads, X, LinkedIn, Telegram, Reddit, Pinterest, e-mail, copiar link, prévias Open Graph 1200×630, imagens verticais para Stories, traduções e fonte original, filtros/frescor/limites da coleta, feed seguro de notícias para o DrivMatch Live, e checagens de clima/mercados. PR #16 corrigiu atualização/rodapé. Antigos PRs #7/#9 foram encerrados como substituídos (sem merge destrutivo).
- **09/10/2026 v32:** PR **#19**, merge commit `13fd19dc3255334c347151f19c4fa744e7ad5436`, consolidou v31 + pós-v31, indicou versão no HTML/manifests e documentação. Deploy verificado. Não equivale a lançamento.
- **09/10/2026 correção de miniaturas v32:** PR **#20**, merge `f50b2a0049119a01bde559e31558bc162f6239ab`, substituiu cards SVG repetidos por fotografias ilustrativas de arquivo com licenças/créditos, `content/photo-library.json`, `scripts/build_news_photos.py`, `site/data/news-images.json`, JPEGs locais gerados, e cards sociais compatíveis. PR **#21**, merge `b1ad6d86bf4af03f0ab8ac0cd2263ba3875eb11c`, consertou teste pós-deploy. Workflow **#37960066468** passou no build **e no deploy**, com verificação pública de JPEG, cards OG, versão v32, news feed e rodapé. Build produziu **31 fotos válidas em 35 catalogadas**, cobrindo **31 de 34 matérias** e **23 de 26 manchetes externas** naquele snapshot (valores mudam por atualização).
- **09/10/2026 regressão relatada em screenshots do Android:** modal de notícia ficou longo, controles **«Compartilhar» e «Copiar link»** abaixo da área inicial, e menu de redes escondido ao rolar. Correção requerida: dock de compartilhamento **sempre visível no mobile**, sem cobrir conteúdos, versão v32 intacta. **Não oferecer patch ao usuário para instalar**. Testar mobile de verdade (360px, 390px, viewport com teclado/rolagem, modal com notícia externa, abrir picker, clicar/copiar). Esta tarefa motivou o PR desta atualização de continuidade.

## 3. Baselines que não podem regredir

### Design
- Logo oficial horizontal azul-gradiente «DrivMatch News» sobre fundo escuro, `site/assets/logo-drivmatch-news.png`. Não redesenhar/trocar.
- **Panorama do Transporte**: um principal/hero com imagem e título + **três relacionadas**; miniaturas fotográficas licenciadas e distintas, com fallback ilustrativo honesto, além da lista de notícias.
- Navegação e busca, filtros, responsividade sem overflow horizontal. O seletor mostra **Português**, **English**, **Español** com bandeiras BR/US/ES; idiomas internos PT-BR, EN-US, espanhol latino-americano.
- Rodapé institucional: **«DrivMatch News — um produto da Hands On Dispatcher LLC»**. Direitos e texto institucional preservados.
- Janela/modal da notícia: foto, título e data legíveis, idiomas, texto/resumo próprio quando legalmente possível, link da reportagem original/tradução assistida claramente rotulados, fonte e créditos, e compartilhamento **visível, acessível e com dois botões em par**. Botão **Compartilhar** à esquerda com ícone e texto branco no azul; **Copiar link** à direita. WhatsApp é destino interno do menu de compartilhar, **não um terceiro botão principal**. O menu também contempla opções de rede e imagem para Stories.

### Clima e dados
- Título de seção **«Clima»**, com Ventusky animado sem botão de ativação/descritivos intrusivos no desktop, área de mapa ampla, link «Ventusky ↗». Chuva/precipitação março–novembro; neve dezembro–fevereiro. **Em inglês, manter o Ventusky em português**, conforme decisão do usuário.
- Tarja superior profissional: preços/dados **reais com data e fonte**, dólar comercial USD/BRL (nunca dólar futuro, sem fabricar spot), diesel e outros indicadores autorizados, meteorologia rotativa de cidades/corredores relevantes (ex.: Orlando, Houston, NYC/Newark, San Francisco, Atlanta, El Paso, Buffalo).
- «Mercado em Foco»: dados verificados EIA/FRED quando disponíveis; Class 8 e ações de transportadoras somente com fornecedores/direitos. Preservar nove símbolos: JBHT, KNX, SNDR, WERN, ODFL, XPO, LSTR, CHRW, FDX. Se indisponível: «—»/sem cotação, não inventar.
- Cobertura visa comunidade ampla de transporte/logística: motoristas, dispatchers, transportadoras, brokers e interessados; NÃO excluir leitores de perfis diferentes.

### Editorial e integração
- Imprensa norte-americana especializada; autoridades FMCSA, CVSA, DOT/511 dos Estados, NWS/NOAA/NHC, associações, comunicação de transportadoras, brokers, fabricantes, índices de fretes, acidentes, fraudes, segurança, fronteiras US–Canada e US–Mexico. Rede `content/sources.json`, coletor RSS/Atom, gate de relevância e geografia, deduplicação, título/horário auditáveis, separação de discovery vs aprovação editorial.
- Não publicar matéria completa copiada sem licença/autorização. Notícias externas: crédito + link à fonte e explicação clara de tradução de navegador; fotos de Commons são **ilustrativas de arquivo, não fotos do evento**, com crédito, licença e link. X/Twitter serve à descoberta, não confirmação automática.
- Compartilhar: URLs rastreáveis das matérias, OG social cards 1200×630, WhatsApp e demais destinos; testar URLs públicas, mobile e visual. Stories produzem PNG, não publicam automaticamente.
- `site/data/live-feed.json` é **feed de notícias** exportado para app separado DrivMatch Live; não equivale a alertas operacionais ativos. `drivmatch.com/live`, ticker da home e integração ao site principal são dependências de outro repositório/implantação. NÃO declarar integrados automaticamente.

## 4. Fontes de verdade e comandos de teste

- Branch `main`, PRs e workflows: https://github.com/handsondispatcher/drivmatch-news
- URL público principal: https://drivmatch.com/news/
- GitHub Pages verificado: https://handsondispatcher.github.io/drivmatch-news/
- Release gate aberto (pré-lançamento): https://github.com/handsondispatcher/drivmatch-news/issues/18
- Detalhes da release: `docs/V32_RELEASE.md`.
- Status de versão: `content/release.json` e `site/data/release.json`: `v32`, `development_prelaunch`, `public_launch_approved=false`.
- Scripts/testes: `.github/workflows/deploy.yml`, `scripts/update.py`, `scripts/build_news_photos.py`, `scripts/build_share_pages.py`, `tests/test_package.py`, `tests/test_browser.cjs`, `tests/test_client.js`.

```sh
python -m unittest discover -s tests
node tests/test_client.js
python scripts/update.py --offline
python scripts/build_news_photos.py --ci
python scripts/build_share_pages.py
npm ci
npx playwright install --with-deps chromium
npm run test:browser
```

O GitHub Actions testa PRs, publica só a `main` e depois faz smoke pós-publicação. Para fotos, exigir JPEGs válidos com créditos e cobertura mínima. Para compartilhamento, validar ações sem scroll do modal em celular e picker dentro do viewport. Se falhar, não dizer «resolvido».

## 5. Pendências reais / limitações explícitas

- Homologação final de aparência, conteúdo, direitos e comportamento mobile antes de anúncio: **issue #18 continua ABERTO**.
- Fonte de cotação USD/BRL comercial spot, licenças Class 8 e equities, conectores RSS com falha, verificação de direitos/comercial do Ventusky e de fotos.
- Proxy `drivmatch.com/news/share/*` em domínio personalizado requer validação de roteamento específica; GitHub Pages/social cards têm smoke separado.
- Integração no aplicativo separado DrivMatch Live/ticker home/alertas operacionais não implementada dentro deste repositório.
- As taxas de cobertura de fotos são de um snapshot de 09/10; novas notícias podem precisar de mais imagens atribuídas.
- **Regressão do modal Android** deve ser tratada como bug prioritário, não exigência nova de design. O usuário já definiu layout e pediu execução. Provar fix com viewport e screenshot de teste, mais publicação em `main`.

## 6. Regra para continuidade com poucos tokens

Ao iniciar novo chat, basta a frase: **«Continue o DrivMatch News v32 conforme docs/CONTINUIDADE_DRIVMATCH_NEWS.md; confira o issue #18 e o último deploy; resolva o próximo bug sem me pedir tudo de novo.»** O assistente deve procurar o arquivo no GitHub, seguir o estado e não exigir transcrição de histórico.

**Princípio de trabalho:** preservar todo avanço, comunicar sem prometer o que não foi executado, corrigir diretamente, testar e seguir. Não impor ao usuário o custo de repetir instruções ou aplicar patches.

