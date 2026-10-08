# DrivMatch News — pacote de instalação e homologação

**Referência visual aprovada:** DrivMatch News v18, sem redesenhar a logomarca. Arquivo preservado em `reference/drivmatch_news_v18_aprovada.html`.

Este repositório permite **testar no GitHub Pages** e fornece uma **base estática instalável pelo Ricardo** em `https://drivmatch.com/news/`. A edição demonstrativa não publica fatos, fretes ou empregos reais.

## 1. Teste local no computador

1. Extraia o arquivo ZIP inteiro.
2. Abra `site/index.html` para uma prévia sem servidor. Os dados demonstrativos estão incorporados em `site/data/bootstrap.js`.
3. Melhor teste: na raiz do pacote, execute `python -m http.server 8000 --directory site` e acesse `http://localhost:8000`.
4. Clique numa matéria. O rodapé alterna **o texto integral da matéria** entre Português, English e Español, independentemente do seletor geral do cabeçalho. A tradução das cinco matérias de exemplo foi revisada no arquivo de demonstração.
5. Para testar a cor das cotações sem dados reais, abra `http://localhost:8000/?demo=1`. Valores ficam **inequivocamente marcados como fictícios**; na tela normal não aparecem valores inventados.
6. A seção Publicidade permanece oculta porque o arquivo `content/ads.json` está desativado.

## 2. GitHub Pages: testar online

1. Crie no GitHub um **repositório novo** chamado, por exemplo, `drivmatch-news-test` com branch padrão `main`.
2. Extraia o ZIP e envie seu **conteúdo (pastas e arquivos)** ao repositório, **incluindo `.github/workflows/deploy.yml`**. GitHub não extrai ZIP automaticamente ao enviá-lo como um único arquivo. Pelo terminal, a forma mais simples é: `git init`, `git add .`, `git commit -m "DrivMatch News teste"`, `git branch -M main`, `git remote add origin <URL>`, `git push -u origin main`.
3. No GitHub, abra **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. Em **Actions**, localize **Publicar DrivMatch News** e clique **Run workflow**. O workflow também roda no push ao `main`.
5. Abra o endereço publicado pelo GitHub Pages, em formato aproximado `https://USUARIO.github.io/drivmatch-news-test/`.
6. Teste: manchetes com foto, Panorama Anterior/Próximas, notícia completa em três idiomas, filtros, paginação, botão da matéria, idioma geral, Mercado em Foco e `?demo=1`.
7. Revise os logs de Actions para saber quais fontes responderam e quais precisaram de configuração. Uma chamada a cada 30 minutos não implica dado novo a cada 30 minutos.

**Agendamento já incluso:** `.github/workflows/deploy.yml` usa `7,37 * * * *` (duas tentativas por hora, UTC), e publica o diretório `site/` no GitHub Pages. GitHub Actions pode atrasar/pular execuções e desativar schedules por inatividade, conforme documentação oficial. O navegador também consulta `data/content.json` aproximadamente a cada 30 min enquanto a página estiver aberta. Recarregar manualmente é permitido.

## 3. Ações para o Ricardo instalar em drivmatch.com/news

- Copiar **o conteúdo da pasta `site/`** para a rota `/news/` na hospedagem DrivMatch, ou configurar o roteamento/reverse proxy equivalente. O site usa caminhos relativos, sem depender do domínio GitHub.
- Implementar deploy automático dos arquivos gerados em `site/data/` para a infraestrutura DrivMatch. **O workflow incluído publica somente no GitHub Pages, não no servidor DrivMatch.** Será necessário um pipeline adicional na hospedagem ou um mecanismo de sincronização autenticado. Não colocar credenciais no front-end.
- Registrar fontes oficiais, alterações, política de retenção, feedback editorial e proteção contra links e dados maliciosos.
- Criar uma API pública controlada para oportunidades: somente registros **publicados**, com `consent_publication=true`, URL pública de origem, data, expiração e conteúdo permitido para divulgação. Jamais divulgar automaticamente dados privados de motoristas cadastrados.
- Configurar `DRIVMATCH_PUBLIC_OPPORTUNITIES_URL` como variável de Actions e `DRIVMATCH_PUBLIC_FEED_TOKEN` como secret (se necessário).
- Para a entrada em produção, configurar variável `DRIVMATCH_PUBLICATION_MODE=production`: o sistema **deixa de publicar os exemplos demonstrativos**. Se nenhuma notícia real aprovada existir, a lista fica vazia em vez de inventar conteúdo.

## 4. Tradução de notícias

**Funcional para teste hoje:** cinco matérias demonstrativas com título, resumo e corpo completos nos idiomas pt, en e es. Os botões do rodapé de cada matéria funcionam independentemente do seletor de idioma do cabeçalho.

**Automação opcional:** o script `scripts/update.py` pode criar traduções ausentes usando `GOOGLE_TRANSLATE_API_KEY` armazenada no GitHub Actions Secrets. Nunca inserir a chave no JavaScript. A variante desejada é português brasileiro / inglês americano / espanhol latino-americano; como a tradução automática genérica não garante a variante ou precisão técnica/jurídica, revise conteúdo crítico antes da publicação. O código não inventa uma tradução quando a API não está configurada: não mostra aquele botão até existir texto.

**Direitos editoriais:** não fazer cópia e tradução integral de artigos da BBC, jornais ou revistas sem direitos. A cobertura adequada pode ser um **resumo próprio** com fonte/link para o original, traduzido nos três idiomas. O pipeline só aceita conteúdo autoral/licenciado marcado `usage_rights=owned` ou `licensed` para notícias reais próprias. Para importar RSS e texto de terceiros, Ricardo deve criar um processo separado com controle de licença, deduplicação, verificação e QA.

## 5. Mercado em Foco: fontes e frequências

A coluna mantém **USD/BRL, Diesel EUA, Brent** nas três primeiras posições. Ações só entram com preço numérico obtido e data/fonte:

| Indicador | Fonte prevista | Cadência original | Precisa de chave? |
|---|---|---|---|
| USD/BRL | `api.frankfurter.dev/v2/rate/usd/brl` | Diária, **não cotação intradia** | Não |
| Diesel EUA | EIA via FRED `GASDESW` | Semanal (US$/gal) | Não para exportação CSV pública |
| Brent | EIA via FRED `DCOILBRENTEU` | Diária de mercado (US$/barril), **não futuro em tempo real** | Não para CSV pública |
| JBHT, KNX, SNDR, WERN, ODFL, XPO, LSTR, CHRW, FDX | Finnhub Quote API | Conforme provedor/plano/horário da bolsa | **Sim: `FINNHUB_API_KEY`** |

Variáveis e secrets ficam em **Settings → Secrets and variables → Actions**. Antes de monetizar cotações, Ricardo deve confirmar licenças de redistribuição e eventuais atrasos de mercado. O processo oculta dados indisponíveis; não substitui com números fictícios. As empresas privadas TQL, Echo, Worldwide Express, Truckstop e DAT permanecem na pauta jornalística, não como ativos negociáveis. A simulação `?demo=1` mostra explicitamente apenas exemplos de cor de alta e baixa.

## 6. Monetizar com anúncios próprios ou de terceiros

`content/ads.json` controla um primeiro espaço **abaixo do Panorama**. Está **desligado por padrão**. Quando houver publicidade aprovada, edite anúncio (`title`, `text`, URL `https://...`, `slot="below_panorama"`, `enabled:true`) e habilite o grupo `enabled:true`.

O anúncio terá a identificação **Publicidade / Advertisement / Publicidad** no idioma ativo. Para banners de rede de terceiros (ex.: anúncios programáticos), Ricardo precisará verificar os termos da rede, aprovações, política de privacidade, consentimento/cookies quando aplicável, limites por sessão e conformidade publicitária. O sistema não possui uma conta de anúncios conectada e não processa pagamentos de anunciantes.

**Distinção essencial:** notícia não pode ser comprada nem parecer uma reportagem independente quando patrocinada. Oportunidades públicas da DrivMatch podem ser notícia relevante quando verificadas, mas precisam informar sua origem e deixar a relação comercial clara ao leitor.

## 7. O que já está pronto vs. o que depende de integração

**Pronto no ZIP:** site v18 como base, logomarca oficial, navegação do Panorama, fotos/fallback, filtro e busca, paginação, modal com texto completo em três idiomas, leitura independente de idioma, feed demonstrativo, Mercado em Foco com conectores e opção visual fictícia explicitamente rotulada, slot publicitário desativado, deploy GitHub Pages e agendamento, testes automatizados básicos.

**Ainda exige configuração ou desenvolvimento:** notícias **reais** de terceiros e apuração, direitos das fotografias/integração com fontes, conteúdo de oportunidades em banco DrivMatch, API de tradução com chave e revisão editorial, preços financeiros com conectividade/chaves/plano, deploy contínuo ao servidor Ricardo, analytics/SEO e infraestrutura de publicidade de terceiros.

## 8. Arquivos mais importantes

- `site/index.html`: HTML público baseado na v18.
- `site/assets/app.js`: interações, tradução de matérias, mercados e publicidade.
- `site/data/content.json` e `site/data/bootstrap.js`: dados gerados no processamento.
- `content/editorial.json`: originais e traduções das matérias de exemplo.
- `content/ads.json`: inventário de anúncios (começa desativado).
- `scripts/update.py`: prepara feeds/indicadores/traduções e gera os arquivos públicos.
- `.github/workflows/deploy.yml`: atualiza e publica o site no GitHub Pages.
- `reference/drivmatch_news_v18_aprovada.html`: baseline visual congelada, para comparação.
- `tests/test_package.py`: verificações automatizadas.

**Validação local:** `python -m unittest discover -s tests -v` e `node --check site/assets/app.js`.

## Fontes técnicas

- GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- Agendamentos: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
- Frankfurter: https://frankfurter.dev/
- EIA Diesel: https://www.eia.gov/dnav/pet/PET_PRI_GND_A_EPD2D_PTE_DPGAL_W.htm
- EIA Brent/FRED: https://fred.stlouisfed.org/series/DCOILBRENTEU
- Diesel/FRED: https://fred.stlouisfed.org/series/GASDESW
- Google Translation API: https://docs.cloud.google.com/translate/docs/reference/rest/v2/translate
- Finnhub: https://finnhub.io/docs/api/quote
- Publicidade: https://www.ftc.gov/business-guidance/resources/native-advertising-guide-businesses
