# DrivMatch News — WAR ROOM v34.5 / CONTRATO DE ESTABILIDADE VISUAL E FUNCIONAL
Data: 2026-10-10. Autoridade: decisões explícitas do proprietário sobre screenshot consolidado. Este documento é um gate de revisão; **não** autoriza lançamento público nem afirma que uma câmera esteja tocando vídeo ao vivo.

## Elementos congelados (FROZEN)
- Logomarca horizontal **oficial** DrivMatch News, preservada sem redesenho.
- Cabeçalho, navegação editorial, panorama fotográfico/rail relacionado, notícias, Ventusky, mercado, rodapé institucional; preservar comportamentos existentes de idiomas, artigo e compartilhamento.
- Pesquisa única **somente imediatamente antes do rodapé institucional** (depois da área comercial), com mesmo input, filtros de editoria e período. Não recolocar no topo.
- Não adicionar a expressão "NOTÍCIAS DO TRANSPORTE AMERICANO" ou substitutos de título editorial não aprovados. As editorias aprovadas permanecem.
- Seletor de 3 idiomas em grupo horizontal proporcional ao cabeçalho, nunca um bloco vertical alto.
- Bloco de câmeras sem título público "ROAD TV", sem botões de canal ou texto promocional arbitrário. Colocação original Ventusky → vídeo/câmeras → Mercado em Foco (mobile e desktop).
- Ticker móvel ≥16 px (categoria ≥13 px), consulta de fontes ≠ reportagem nova.
- Rodapé único institucional: "DrivMatch News — um produto da Hands On Dispatcher LLC".

## Variáveis operacionais (DYNAMIC) — não alteram o layout
- Manchetes, data de publicação e consulta efetiva às fontes, imagens atribuídas, alertas meteorológicos e preços verificados.
- Catálogo de transmissões aceitas e estado do player; ao vivo somente se plataforma e vídeo realmente verificáveis.
- Reserva de segurança sem stream certificado: **mapa oficial incorporável FL511** com câmeras e opção Streaming Video. O mapa/catálogo **não é** transmissão certificada reproduzindo; não marcar "AO VIVO" nem prometer autoplay. Link direto permite acesso caso o iframe não abra.
- Prioridade na descoberta: (1) caminhão/logística em atividade nos EUA, (2) câmeras de rodovias com tráfego de caminhões, **I-4 na Flórida primeiro**, (3) replay de hoje/ontem com horário original auditável e rótulo GRAVADO.

## Change Control obrigatório
1. Solicitação explícita do responsável e imagem de referência, se aplicável.
2. Criar branch/snapshot da versão aprovada antes de mudanças.
3. Diff limitado ao pedido; mudança de CSS/DOM fora de escopo é REVIEW_REQUIRED.
4. Gates: Python unit/integration, Node client, Playwright em 360/390/768/1440, publicação editorial, snapshot de backup.
5. Gate externo separado para vídeo real: reproduzir fonte no domínio público, confirmar permissão de embed, status da live e substituição após erro. Iframe de mapa não comprova esse gate.
6. Gate externo separado para notícias: confirmar idade da manchete mais recente e justificar horas sem matéria nova; execução concluída não comprova notícia nova.
7. Merge e deploy só depois dos gates; nunca declarar homologação baseada em mocks ou screenshot sintético.

## Auditoria v34.5 — estado honesto
- Implementado em branch de correção: mudança estrutural do campo de busca, título removido, idioma compactado, câmera FL511 como opção ao faltar live autorizada, regressões.
- **Pendente até evidência:** autoplay de streaming de rodovia, credenciais do provedor de vídeos e fluxo editorial com publicação nova no domínio real.
- URL de mapa oficial: https://fl511.com/Map/EmbeddedMap?layers=Cameras&region=ALL&size=0
- Snapshot imutável: commit v34.4 `829169282718c3bf546fdb74d5ae692ff0943bb6`, branch `snapshot/v34-4-pre-war-room-2026-10-10`.
