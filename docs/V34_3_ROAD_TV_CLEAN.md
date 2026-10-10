# DrivMatch News v34.3 — ROAD TV, primeira integração visual limpa

**Solicitação expressa (09/10/2026):** o usuário enviou screenshot real da v34.2, solicitando deixar **somente “ROAD TV” e vídeo**, sem os textos externos `Road TV · YouTube / Twitch`, sem `Próximo canal`, sem `Ride Along Gang`, `51 Logistics`, `Freight Relocators Live`, `Johnny Trucker USA`, sem textos de regras, status ou instruções. Pediu **uma câmera de trem divulgada como live** para testar no site real, com deploy normal.

**Implementação v34.3:** iframe oficial `www.youtube-nocookie.com/embed/to8SHIQHyQo`, conteúdo do Virtual Railfan — câmera da linha BNSF em Oklahoma City, OK. Foi localizada uma página oficial do canal intitulada *LIVE RAILCAM: Oklahoma City, Oklahoma, USA* com esse ID, mas **isso não prova que a live está ativa a cada minuto ou que a incorporação é permitida a todo momento**; o player oficial do YouTube apresenta seus controles/direitos e pode recusar incorporação. Não rotular a interface como `AO VIVO` pela DrivMatch sem estado verificado e não alegar relação comercial com Virtual Railfan. Conteúdo de trem é **teste temporário**, não o objetivo de longo prazo de câmera frontal de veículo de carga.

## Contrato visual
- Em celular e desktop a ordem mantém **Ventusky → ROAD TV → Mercado em Foco (USD/BRL, diesel, Brent)**.
- Cada bloco Road TV contém **somente** título `ROAD TV` + um iframe do vídeo em aspect ratio 16:9; zero botões/listas/rodapés publicitários próprios. O player oficial preserva a identificação do autor, os controles e os anúncios da plataforma.
- O vídeo não é hospedado nem capturado pela DrivMatch. Usa link/embed da fonte, com autoplay silenciado quando o navegador permitir e play manual padrão do YouTube.
- Script anterior `assets/road-tv.js` permanece versionado para possível futura validação da descoberta automática, **mas não é carregado nesta edição**, evitando que reintroduza textos ou opções. `scripts/road_tv.py` segue disponível sem alterar esta janela; o teste tem prioridade visual temporária.
- Nenhuma alegação editorial falsa ou obrigação regulatória publicável. `public_launch_approved=false` continua valendo para o lançamento comercial do jornal; alteração do site prelaunch é publicada normalmente.

## Backups e release
- **v34.2 congelada antes da alteração:** `backup/v34-2-2026-10-09`, SHA `c5bcc13ea8ed61677a85f7ee8807ea34d48229c9`.
- v34.1: `backup/v34-1-approved-2026-10-09` SHA `77b6d50fa159a0b18a9619a2fcf6db4b652646cd`.
- v34, v33, v32 também preservadas nos respectivos pontos versionados.
- Não alterar brand assets, Venstusky, clima, moedas, modal mobile, compartilhamento, manchetes, links das fontes, analytics/Matching Engine ou preços.

## Critério de aceitação
- HTML cliente identifica `v34.3` e contém somente `ROAD TV` + iframe em cada variante responsiva.
- Browser checks 360/390/768/1440: posição após Ventusky antes de cotações, zero links/chips/botões adicionais, iframe oficial válido na DOM, no overflow horizontal, recursos editoriais intactos.
- CI build/test e smoke remoto em `https://drivmatch.com/news/` HTML + manifesto = `v34.3`, certificado de publicação técnica; a reprodução efetiva de um vídeo real depende do YouTube e do navegador do leitor e exige confirmação manual. Se o iframe estiver bloqueado pelo proprietário, respeitar a restrição, não criar retransmissão privada.
