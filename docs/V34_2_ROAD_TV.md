# DrivMatch News v34.2 — ROAD TV | Comando e governança editorial

**Data:** 09/10/2026. **Status:** `development_prelaunch` / `public_launch_approved=false`. **Escopo:** adicionar a Road TV imediatamente abaixo do Ventusky e ANTES do dólar/diesel/Brent, sem alteração da logomarca, das notícias, do modal Android ou do Matching Engine.

## Comando editorial canônico — automatizado no pipeline

> A cada publicação da DrivMatch News, procurar pelo YouTube Data API e Twitch Helix **transmissões ativas de viagem nos EUA declaradamente filmadas com visão frontal a partir da cabine de semi truck, box truck, pickup de carga/hotshot ou cargo van**. Não limitar a lista aos quatro canais originalmente mencionados. Aplicar evidências de metadados para Estados Unidos, veículo de carga e câmera frontal; excluir lives cujo título/tags indiquem descanso, banho, parada, sono ou encerramento. Verificar que transmissão está realmente ativa e publicamente incorporável. **Nunca afirmar que metadados provam posição real do veículo, movimento ou câmera; isso requer visão do vídeo ou moderação adicional.**
>
> Priorizar **AO VIVO** com verificação recente de plataforma. Se nenhuma live qualificada estiver disponível, buscar gravação de uma **transmissão efetiva** terminada hoje ou ontem (fuso de referência do Pacífico americano), com hora original de início/fim, duração autenticada e relógio de gravação próximo do horário atual (janela máxima ±120 minutos). O vídeo gravado será sempre identificado como **REPLAY**, jamais AO VIVO. Não reproduzir vídeos antigos, gravações sem hora de captação ou cenas que não correspondam aos critérios apenas para preencher o player.
>
> Atualizar catálogo em cada execução do publicador, hoje com agendamento a cada 10 minutos. Para economizar cota da YouTube Data API, alternar **três buscas a cada hora** entre live e replay e armazenar candidatos no cache do workflow; verificar novamente o status das lives no ciclo de publicação. Na página, consultar o catálogo a cada 2 minutos. Se a transmissão terminar, for removida ou uma nova live for validada enquanto um replay estiver no ar, priorizar a live. Dar opção de trocar manualmente; com mais de uma live elegível, alternar automaticamente após 12 minutos de exibição ativa como precaução. **Não alegar ter detector confiável de veículo parado sem análise de vídeo**. Se nada for confirmado, exibir mensagem de indisponibilidade, não vídeo fabricado.
>
> Reproduzir SOMENTE por **iframe oficial do YouTube ou Twitch**, carregado depois de clique explícito do visitante, com nome e link do criador. Não baixar, capturar, remultiplexar ou retransmitir fluxo por servidores DrivMatch. Não encobrir controles, anúncios, créditos ou player; patrocinadores só em espaços claramente separados do vídeo.

## Infraestrutura

- Código: `scripts/road_tv.py` cria `site/data/road-tv.json` (schema_version=2), usando `content/road-tv-curated.json` apenas como lista de canais a investigar, não como licença nem garantia de LIVE.
- Origem autorizada da informação: YouTube Data API v3 `search.list` (somente live e completed) + `videos.list` (liveBroadcastContent / actualStartTime / actualEndTime / status.embeddable). Twitch Helix `search/channels`, `streams` e token da aplicação.
- Segredos do GitHub Actions (NÃO incluir no frontend ou neste documento): `YOUTUBE_DATA_API_KEY`, `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`. **Na ausência das credenciais, o recurso mostra indisponibilidade honesta e os canais de referência; NÃO apresenta livestream real.** A conexão de produção depende de credenciais configuradas na infraestrutura.
- Cache de busca entre publicações: GitHub Actions `build/roadtv-discovery.json`, por hora UTC. Busca e replays são *descoberta*, não prova de câmera/movimento. Verificação de estado é realizada com consultas específicas.
- Player YouTube privacy-enhanced `youtube-nocookie.com` (somente após clique); Twitch `player.twitch.tv` requer `parent=drivmatch.com`/host válido e HTTPS. Os canais indicados pelo usuário ainda não constituem inventário autenticado de creators/patrocínios.
- YouTube/Twitch podem impedir embed individual; respeitar restrição e oferecer acesso ao canal na plataforma original sem fingir que há transmissão.

## Posição exata e responsividade

- **Desktop:** Coluna `#mercados`: Ventusky `#clima-desktop` → Road TV `#roadtv-desktop` → `#market-title` + dólar/diesel/Brent; nada de Class 8/ações sem cotação.
- **Mobile:** Área `.weather-mobile` antes do Panorama: Ventusky `#clima-mobile` → Road TV `#roadtv-mobile` → `#market-title-mobile` + `#market-mobile` (mesmos números validados na versão desktop). `#mercados` desktop fica oculto no mobile para não duplicar cotações.
- Sem autoplay inicial, iframe com 16:9 aproximado e Twitch ≥300px de altura, mensagens PT/EN/ES, botão de próximo canal, acesso ao canal original e controles de autor.
- **Não mudar:** notícia hero + 3 relacionadas, foto atribuída, filtros, ticker, leads, preço e status de mercado, modal Android compacto/share picker, logos/cores, idiomas, rodapé legal, XML/JSON existente, funcionalidades DrivMatch externas.

## Segurança, direitos e factualidade

- A DrivMatch **incorpora** o player, não é emissora dona do conteúdo. Direitos musicais, anúncios e chat seguem plataforma/criador. Não anunciar Creator Partnerships sem contrato.
- O requisito **somente EUA/câmera frontal** só pode ser inferido a partir de declarações em metadados da fonte; nenhuma API prova a cena no vídeo. **Para transformar em garantia editorial, implantar verificação humana/visionamento autorizado, regras de bloqueio e exclusão e validação de consentimento**. Não registrar geolocalização precisa, placa, carga, posicionamento instantâneo nem dados pessoais dos motoristas.
- Descanso/parada: o filtro metadata `STOP` bloqueia lives explicitamente marcadas como paradas. O rodízio preventivo de 12 minutos evita uma única câmera fixa por tempo indefinido quando há alternativas; **não detecta movimento frame a frame**.
- Transmissões recentes com informação de hora original confirmada podem iniciar em offset que aproxima a hora do dia do Pacífico; isso não significa transmissão síncrona em tempo real e exige rótulo REPLAY.
- Nenhuma audiência/receita/valuation, parceria com criador ou frequência de lives garantida. O módulo é um teste de experiência e aquisição.

## Pontos de restauração

- v34.1 original íntegra: `backup/v34-1-approved-2026-10-09`, SHA `77b6d50fa159a0b18a9619a2fcf6db4b652646cd` (snapshot antes de qualquer mudança Road TV).
- v34 inicial: `backup/v34-initial-2026-10-09`, SHA `3ea738b87f1efd482d5dac95b536c241b9cae9de`.
- v33: `backup/v33-approved-2026-10-09`, SHA `fea227dde034e101ace8299357579ddfe98fe256`.
- v32: `backup/v32-approved-2026-10-09`, SHA `659a146b8f48c342c2a62d86a1330d59760116d4`.
- Recuperar via PR regular e testes, sem deletar branches ou force-push.

## Critérios e entregas

1. Testes unitários com plataformas simuladas **somente em CI**, incluindo live validado, live em descanso excluído, replay hoje/ontem com hora original, gravados antigos rejeitados, sinal EUA/câmera/veículo exigido, sem keys fail-closed, Twitch Helix e credenciais fora do HTML.
2. Testes JS e browser em 360/390/768/1440: ordem Ventusky → Road TV → mercado, zero overflow, imagens/logos originais, cotação não inventada, player ausente antes do clique, mobile modal e compartilhar não afetados.
3. Build e deploy GitHub Pages seguidos de smoke versão `v34.2` em HTML e release manifest no domínio `drivmatch.com/news/`, com thumbnails, OG, feed e release prelaunch.
4. Validação humana posterior de câmera, movimento e EUA, links reais, player cross-browser com keys de produção e disponibilidade em diferentes horários. **Issue #18 permanece aberta**; `public_launch_approved=false` não é dispensado por teste verde.

**Importante:** este documento especifica e implementa a infraestrutura Road TV, mas autenticação da YouTube/Twitch API e auditoria dos vídeos reais são dependências externas explícitas. Não confundir player pronto com garantia de live 24×7.
