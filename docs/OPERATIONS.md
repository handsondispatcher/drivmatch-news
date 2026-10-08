# Operação DrivMatch News

## Auditoria em 08/10/2026

Branch examinada: drivmatch-weather-b3-v22 bac4b2e; main ffa90d9. Pages respondeu 200 e mostrou 5 demonstrações, referência diária Frankfurter sob Dólar comercial. drivmatch.com/news respondeu com Jornal do Fabricio | Edição Exclusiva: rota incorreta para DrivMatch News. Marca oficial PNG e referência v18 preservadas. prepare_site.py agora valida sem sobrescrever alterações.

## Rede e publicação

content/sources.json contém 55 fontes permanentes; seis têm conector RSS e 49 exigem revisão manual. Inclui imprensa, FMCSA/CVSA, NOAA/NWS/NHC, fronteiras, USDA, índices, tecnologia, fabricantes, truck stops, brokers e Investor Relations. FHWA fornece diretório DOT/511: conectores individuais dos 50 estados ainda precisam de implementação.

Coletor RSS/Atom: timeout, limite de tamanho, domínio de origem, publicação recente, deduplicação por URL. Primeira coleta: 81 candidatos; cinco feeds responderam, The Trucker falhou. Estado público em site/data/source-health.json. Fila em build/news-candidates.json, preservada como artifact editorial-review no Actions; nunca é publicada como notícias. RSS não concede licença de texto/foto.

content/editorial.json: uma notícia real (FreightWaves, estudo FMCSA sleeper berth, 08/10), resumo próprio nos três idiomas; fonte/data verificadas na página original. Sem foto licenciada, placeholder neutro. Novas matérias requerem status approved, demo false, usage_rights owned/licensed, source e source_url HTTPS, published_at e verified_at ISO com fuso, verification_note e locales pt/en/es completos. Datas futuras e material incompleto não publicam. GOOGLE_TRANSLATE_API_KEY habilita tradução de lacunas; revisar linguagem. A aprovação editorial não é automatizada.

## Clima e dados

Ventusky oficial acima do mercado no desktop; celular carrega ao tocar. Links externos NWS, FHWA/511 e Ventusky disponíveis se iframe falhar. Confirmar condições comerciais do Ventusky para monetização. Testes validam URL/visibilidade, não todas as camadas internas cross-origin.

Mercado exclusivo: comercial spot USD/BRL; diesel EIA semanal e Brent EIA diário via FRED; Class 8 mensal; JBHT, KNX, SNDR, WERN, ODFL, XPO, LSTR, CHRW, FDX. Referência diária Frankfurter removida; nenhum futuro/outra moeda/preço fictício. Corrigido CSV FRED observation_date. Dados sempre têm data observada; indisponíveis mostram —.

### Integrações pendentes

- USDBRL_SPOT_URL HTTPS, secret USDBRL_SPOT_TOKEN, USDBRL_REDISTRIBUTION_AUTHORIZED=true: fornecedor autorizado deve retornar symbol USD/BRL, instrument spot, price_type commercial, value numérico positivo, observed_at ISO com fuso, source e source_url HTTPS. Ainda exige contrato/licença e adapter específico do fornecedor.
- integrations/spot-worker.js: proxy Cloudflare funcional para upstream normalizado. Publicar separadamente com secret PROVIDER_TOKEN e vars PROVIDER_URL e REDISTRIBUTION_AUTHORIZED=true. Configurar USDBRL_PUBLIC_URL no GitHub. Cliente consulta 15s; cache proxy 15s. Timestamp >60s identificado como atrasado, >5 dias ocultado. Snapshot não é stream ao vivo. Nenhum token na URL pública.
- FINNHUB_API_KEY + FINNHUB_REDISTRIBUTION_AUTHORIZED=true: licença de redistribuição correspondente ao plano, não apenas chave grátis.
- CLASS8_DATA_URL + CLASS8_REDISTRIBUTION_AUTHORIZED=true: autorização ACT/FTR. Endpoint retorna class8_orders e class8_sales com value, unit vehicles, observed_at ISO com fuso, source, source_url.
- GOOGLE_TRANSLATE_API_KEY: tradução automática opcional. Matéria incluída já possui três idiomas.

Sem esses serviços, nenhum preço é inventado. Diesel/Brent não requerem secret neste adapter e mantêm atribuição EIA/FRED.

## Testes e deploy

Executar python -m unittest discover -s tests; node tests/test_client.js; python scripts/prepare_site.py; npm ci; npx playwright install --with-deps chromium; npm run test:browser.

Testes Python e smoke JS passaram localmente. GitHub Actions 37859727092 e 37859738040 passaram também em navegador nas quatro larguras. Após o primeiro deploy, a inspeção pública detectou mistura de HTML novo com JS/bootstrap antigos em cache; script de build agora usa hashes de conteúdo em todos os scripts para evitar essa mistura. Teste real preparado em 360/390/768/1440px: overflow, marca, mercado, mapa, nove tickers e tradução de artigo sem alterar idioma global. Screenshots em artifact browser-screenshots.

Push da branch/PR testa sem deploy. Somente main publica após testes; cron minutos 7/37 (~30min, sem SLA). Cliente recarrega JSON a cada minuto e proxy spot a cada 15s se configurado. Conferir CI e screenshots antes do merge; depois conferir deploy e HTML/JSON público. Revert do merge permite rollback.

## drivmatch.com/news

GitHub Pages não configura sozinho subcaminho em outro domínio. Não adicionar CNAME para raiz drivmatch.com. Ricardo precisa corrigir rota na hospedagem/Cloudflare: /news redireciona /news/; /news/* encaminha https://handsondispatcher.github.io/drivmatch-news/* preservando assets/ e data/; manter raiz DrivMatch, cache curto dos JSON e invalidar Jornal do Fabricio. Testar /news/, /news/assets/logo-drivmatch-news.png e /news/data/content.json. Sem acesso Cloudflare, rota e proxy spot não foram publicados nesta sessão.
