# DrivMatch News — regra oficial de rotação vertical de publicidade (v1.0)

**Data:** 2026-10-16  
**Status:** VIGENTE — implementada no código-fonte, sujeita à validação pública por implantação.  
**Escopo:** coluna direita do site DrivMatch News; somente área de publicidade abaixo do bloco de cotações, sem modificar hierarquia editorial nem ocultar notícias.

## Regra permanente

1. Os anúncios aprovados da barra lateral direita formam **um único carrossel vertical**, com movimento contínuo **de baixo para cima** e repetição **infinita**, sem saltos, flash, espaços vazios ou banners repetidos como cópias estáticas.
2. Toda campanha ativa alcançará periodicamente o **topo da janela publicitária da coluna direita** (não o topo do jornal), mediante reciclagem circular dos elementos originais.
3. **Mouse em cima** pausa imediatamente a rotação, mantendo a posição atual. A saída do mouse retoma apenas se não houver outra condição de pausa.
4. **Foco por teclado** pausa a rotação até a saída do foco. **Primeiro toque** em dispositivo touch pausa a rotação; botão explícito retoma. A ação deve permitir acesso real a todos os links e preservar foco, rótulos e semântica.
5. **Preferência por movimento reduzido** pausa por padrão; ativação exige gesto explícito do usuário. Alternância de aba, invisibilidade da região e suspensão operacional não devem avançar o deslocamento e causar saltos.
6. O seletor **PT / ES / EN do topo** determina a edição linguística de cada anúncio. AUTO M USA apresenta somente a arte original aprovada para o idioma corrente, sem redesenho ou distorção; outras peças preservam as regras próprias de idioma e disclosures.
7. **Anúncios iniciais:** UCR 2027, classificado Motorista Disponível (Aileen Souza), AUTO M USA. Os arquivos originais aprovados, informações de contato, WhatsApp e Instagram e regras de patrocínio não podem ser modificados pela rotação.
8. A movimentação é apenas de apresentação: sem duplicar IDs, duplicar anúncios comerciais semanticamente, alterar provas/licenças da arte, misturar anúncios com jornalismo ou inferir métricas falsas.
9. **Velocidade baseline v1.0:** 22 CSS pixels por segundo. Mudanças de velocidade, tamanho, ordem, entrada de novas campanhas ou regras de clique são sujeitas a revisão e teste de responsividade, acessibilidade, foco, idioma e carregamento.
10. **Sinalização:** publicidade identificada em PT/ES/EN. O botão pausar/reproduzir deve ser rotulado no idioma corrente e controlável sem mouse.

## Fluxo de implementação
As três peças aprovadas e já existentes são agrupadas dentro de `#dm-ad-rotation`, com um viewport de altura limitada. O JavaScript move **os próprios nós originais do DOM** da primeira para a última posição quando saem completamente pelo topo; não clona links, IDs ou pixels, e por isso preserva as campanhas e conteúdo re-renderizado por `renderAds()`.

**Testes obrigatórios:** integridade dos três slots, controle de idioma, pause-on-hover, pause-on-focus, controle de toque, reduced motion, loop sem duplicação, links, visualização desktop/móvel e pipeline de publicação.

**Nota operacional:** GitHub Pages pode publicar pelo pipeline `.github/workflows/deploy.yml`, mas `drivmatch.com/news` precisa de verificação independente para confirmar atualização do domínio personalizado.
