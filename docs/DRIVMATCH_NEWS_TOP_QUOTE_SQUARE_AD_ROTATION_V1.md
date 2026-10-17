# DrivMatch News — Rotação de anúncios quadrados nas cotações v1.0
Data: 2026-10-16 / 17. **Regra aprovada pelo proprietário**.

- Localização: último espaço da barra de cotações, à direita da previsão do tempo; 1 quadrado 1:1 responsivo.
- Nove arquivos PNG originais: 3 para português brasileiro, 3 para inglês americano, 3 para espanhol latino-americano. Cores dos três modelos preservadas; preto, branco, amarelo e verde.
- Seleção de idioma do cabeçalho PT / EN / ES controla imediatamente as três imagens usadas. Nunca misturar idiomas.
- Trocar o modelo exibido **a cada 4 segundos**, em ciclo 1 → 2 → 3 → 1 com transição fechar/revelar como a publicidade horizontal, sem scrolling vertical.
- A parte superior clicável encaminha ao SMS `+1 (908) 291-3386`; a inferior ao WhatsApp `+1 (908) 291-3386`, com referência à DrivMatch News no texto inicial. Manter acessibilidade por teclado e rótulos traduzidos.
- Pausar enquanto mouse/foco/touch estiver interagindo. Respeitar a preferência por movimento reduzido.
- Não distorcer: usar aspect-ratio 1 e `object-fit:contain`; nunca aumentar a barra de cotações além do necessário nem deslocar a navegação por cima.
- Verificar os nove PNGs via tamanho e hash SHA-256 antes de cada publicação; o deploy deve testá-los em navegador no idioma selecionado.
- Não alterar os anúncios horizontais, o carrossel lateral, cotações nem fontes editoriais.

## Responsividade — v1.0.1

Em 851–1280px, manter o anúncio na terceira linha, coluna direita, separadamente das cotações (primeira linha) e da previsão / avisos de risco (segunda linha). Não sobrepor ou esconder os avisos meteorológicos. Em desktop largo, manter o quadrado na última coluna da faixa; em telas móveis, adaptar ao grid de duas colunas. A lógica de troca de 4 segundos e os nove arquivos originais permanecem intactos.
