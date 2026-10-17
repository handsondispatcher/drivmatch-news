# DrivMatch News — ALERTA CLIMÁTICO (regra oficial v1.0)
**Data:** 2026-10-17  
**Estado:** implementado no repositório; publicação e validação de domínio realizadas pelo workflow de produção.

A interface apresenta um botão **ALERTA CLIMÁTICO** ao lado das notícias da capa (English: WEATHER ALERTS; Español: ALERTA METEOROLÓGICA). O botão abre a seção de notícias meteorológicas; uma ação "VOLTAR ÀS NOTÍCIAS" permite regressar à capa. A opção **Clima** no seletor editorial direciona à mesma seção.

## Regra editorial determinística
- Classificar no Weather Desk toda matéria aprovada cuja `category=Clima`, cuja proveniência identifica diretamente **National Weather Service / NWS** ou URL de `weather.gov`, e boletins oficiais meteorológicos identificados com o prefixo NWS. Não utilizar coincidências vagas de palavras em outras notícias.
- Itens do Weather Desk são retirados da capa jornalística para evitar inundar as manchetes regulares. Isso não elimina a fonte nem o conteúdo, somente altera o destino de apresentação.
- A seção lista todas as publicações **elegíveis e distintas que estiverem no catálogo disponibilizado ao navegador**, em ordem cronológica de `published_at`, mantendo municípios/condados diferentes mesmo quando o fenômeno é igual. Não desativar os gates de identidade, tradução, autorização, geografia, proveniência ou publicação. Duplicatas exatas de ID/URL não aparecem duas vezes.
- O sistema **não deve chamar um alerta arquivado de "ativo"**. As notícias mostram a data e a fonte original; o leitor é orientado a verificar alertas atuais no NWS e bloqueios rodoviários no DOT/511.
- O feed é paginado, buscável e respeita o idioma escolhido no topo, sem inventar traduções; o botão apresenta contagem de publicações elegíveis carregadas.
- A fonte de ingestão oficial existente mantém suas regras de atualidade e risco. Não criar alertas falsos nem ampliar cobertura declarada além do catálogo obtido. Um aviso não comprova fechamento de estrada.
- Preservar publicidade, mercado, TV, banners e informações jornalísticas; modificar somente a organização dos cards e controles da seção.
- Critérios de QA: classificação NWS por fonte e Clima por editoria; municípios distintos preservados na seção; ausência de NWS na capa; ordem cronológica; troca PT/ES/EN; busca e retorno; nenhuma regressão de paginação da capa.
