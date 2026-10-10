# War Room — Camera Source Network v34.6 (10/10/2026)

## Escopo e autoridade
Complemento aprovado pelo usuário: explorar MileCheck, NOAA/NWS Elko, iOS USA Traffic Cameras, Nevada 511, I-4 da Flórida e travessias Canadá→EUA, priorizando a **entrada nos EUA**. É extensão funcional restrita à fonte do vídeo, NÃO redesenha o jornal nem libera alterações ao layout congelado da v34.5.

## Fontes e decisões
| Fonte | Evidência pública | Integração permitida agora | Limite |
| --- | --- | --- | --- |
| FL511/FDOT — I-4 | https://fl511.com/Map/EmbeddedMapSetup | **Mapa oficial embutido** e link oficial I-4 | Usuário seleciona câmera; mapa não garante stream em reprodução; não declarar AO VIVO do iframe |
| Peace Bridge Authority, USA Inspection Plaza | https://www.peacebridge.com/media-room/traffic-cameras/ | Link externo oficial prioritário para US-bound | Página com câmeras e imagens; não demonstrado embed autônomo permitido |
| BuffaloWebcam, Peace Bridge USA Entrance | https://buffalowebcam.com/live-webcams/peace-bridge-usa-entrance/ | Referência de descoberta YouTube | Player do publisher não é prova de transmissão YouTube atual, embeddable nem licença de republicação |
| Nevada DOT/511 | https://www.nvroads.com/ ; https://www.dot.nv.gov/travel-info/road-conditions/traffic-cameras | Link externo | Site oficial oferece câmeras de vídeo e mapa; endpoint individual e direitos de embed desconhecidos |
| MileCheck | https://milecheckapp.com/cameras/ ; https://milecheckapp.com/corridors/i-4/ | Link externo para exploração | Empresa exige contato/licença para incorporação comercial de mapas e dados: info@milecheckapp.com |
| weather.gov/lkn | https://www.weather.gov/lkn/ | **Não integrar ao vídeo**; manter como contexto de meteorologia | Página de previsão NWS Elko, sem transmissão rodoviária comprovada |
| USA Traffic Cameras iOS | https://apps.apple.com/br/app/usa-traffic-cameras/id1529408199 | Referência de pesquisa, não player | Listagem App Store não oferece endpoint web incorporável |

## Algoritmo de seleção — fonte deve ser verificada pelo YouTube/Twitch
1. Caminhoneiro / veículo de carga com câmera frontal, geografia EUA e vídeo realmente ativo/embeddable.
2. Rodovia americana, preferencialmente I-4 da Flórida, com vídeo real e metadados geográficos + visualização de trânsito.
3. Fronteira **Canadá→EUA**, preferencialmente Peace Bridge USA Entrance/US Inspection Plaza, quando vídeo ativo e embeddable puder ser provado.
4. Replay de hoje/ontem com metadados horários originais, explicitamente GRAVADO.
5. Sem transmissão aprovada: mapa oficial FL511, com links de origem para fontes complementares. Links e imagens atualizadas **não são vídeo ao vivo**.

Prioridade editorial não dispensa direitos de transmissão, política de embed, autorização de plataforma, certificação de câmera/veículos ou verificação física. A pesquisa YouTube inclui novas consultas rotativas sobre I-4 e entrada americana no Peace Bridge; API key não configurada implica **SEM LIVE VERIFICADA**. Não colher IDs de vídeo/stream por scraping sem licença.

## Congelamento e QA
O layout da v34.5 continua imutável: logomarca, editorias, barra de pesquisa acima do rodapé, ausência do título inventado e bloco de câmera sem título "Road TV". Única extensão permitida: pequenos links para as fontes **dentro da faixa inferior do player existente**, sem novos painéis ou botões de canal. Nomes/links derivados do catálogo de fontes só podem ser incluídos se host HTTPS corresponder a lista autorizada, e nenhum link pode gerar `verified_playing_live=true`. Imagens de câmeras não podem ser representadas como streaming contínuo. Rodar testes Python/Node/browser (360,390,768,1440) e smoke do domínio antes de publicação.

### Gate separado (não dispensado por testes de fixture)
Certificar vídeo em movimento real ao longo de diferentes horários com player nativo; validar seleção I-4 e vista para US Inspection, error/ended/geo/rights, e autorização para embedding. Somente aí declarar vídeo ao vivo operacional.

Snapshot anterior: `snapshot/v34-5-pre-camera-network-2026-10-10` (commit `946aaf215dcfe1e73c1fcabdbd5916f05e88e18d`).
