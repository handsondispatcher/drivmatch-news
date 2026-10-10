# Auditoria v34.4 — Road TV, ticker Android, notícias

**Evidência:** 10/10/2026, screenshots reais do usuário no DrivMatch News v34.3. Problemas: (1) câmera ferroviária fixa Virtual Railfan exibindo “Vídeo indisponível” — já não era uma live disponível; (2) ticker no Android 12px, difícil leitura; (3) matérias visíveis de muitas horas atrás, sem distinção entre novo deploy e fonte noticiosa de fato atualizada. (4) no layout legível das notícias preservar fotografias e links originais, sem inventar factos.

## Diagnóstico causal

1. **TV:** v34.3 tinha embed estático `to8SHIQHyQo`, sem API de estado, sem rodada, sem validação de player. Em v34.2 havia busca automática no backend `scripts/road_tv.py` mas, quando nenhum provedor autorizado é configurado, `data/road-tv.json` informa ausência de live e não pode criar vídeo real. Corrigir só o ID voltaria a falhar.
2. **Ticker:** CSS mobile `.dm-crawler-link {font-size:12px}`, `label` 11px. Fonte de leitura em movimento é pequena.
3. **Atualização:** coleta das fontes ocorre em cada GitHub Action; execução #38036088169 consultou **82 fontes e obteve 531 candidatos, 10 conectores falhos**, com 8 artigos próprios já aprovados; isso não demonstra nova manchete elegível/confirmada. Versão da página e hora do build eram confundidas com hora real das notícias.

## Contrato v34.4

- **TV — frontend:** manter **somente ROAD TV e a janela de player**, sem lista de criadores, botões personalizados ou notas extensas. Remover vídeo ferroviário fixo que o YouTube declarou indisponível; ler `data/road-tv.json` gerado pelo backend. Usar **YouTube IFrame Player API** (`onError`, `onStateChange`); ao encerrar ou falhar (2,5,100,101,150,153), colocar fonte indisponível em quarentena temporária, buscar próxima live validada, e não reciclar eternamente o mesmo ID. Twitch pelo embed oficial quando credenciais e streams forem validados. Revalidar catálogo a cada 2min, revalidar via backend em toda publicação (intervalo configurado pelo Actions), rodízio preventivo aos 12min quando houver alternativa. **Não fazer CDN/restream/rehost**; preservar controles, anúncios e direitos originais.
- **Limite operacional:** o trabalho automático só pode exibir live se uma plataforma confirmou transmissão ativa e permissão; a YouTube Data API/Twitch Helix exige credenciais de aplicação **no GitHub Actions secrets**. Se não houver candidatos reais, mostrar uma frase discreta **dentro do player**, não uma falsa live. Gravações hoje/ontem, sincronizadas pelo horário real, devem conter um discreto rótulo `GRAVADO` dentro do player, nunca `AO VIVO`. A API não comprova câmera/frente nem movimento: estes sinais provêm dos metadados, com auditoria humana para certificação. Não alegar vídeo real funcionando sem verificar.
- **Ticker:** texto das manchetes **≥16px no Android** e categorias **≥13px**, altura/contraste de leitura maior, movimento respeitando `prefers-reduced-motion`.
- **Matérias:** `source-headlines.json` passa a trazer métricas `fresh_6h`, `fresh_12h`, `newest_headline_age_hours`. Na seção Notícias, diferenciar **hora da consulta à fonte** de **hora da notícia mais recente efetivamente captada**. Se última manchete elegível tiver mais de 8h, emitir aviso identificável no log CI (não fabricar notícia “atual” nem bloquear toda publicação; menos notícias pode ocorrer durante a madrugada de sábado). Newsletter/archive preservados; nenhum conteúdo criado por IA para preencher lacunas. Seguir 82 fontes, detectar conectores falhos e revisar cobertura com base em evidência.
- **Governança/release:** `public_launch_approved=false`, issue #18 segue ABERTA. `main` só recebe a v34.4 após testes completos Python/JS e browser 360/390/768/1440. Deploy precisa verificar release do custom domain, imagens, crawler, catálogo TV, recência de fontes. Site continua sendo jornal, sem mexer em DrivMatch Matching, preços, licenças, marca, Ventusky ou modal Android compacto.

## Rollback documentado

- **v34.3 preservada antes da auditoria:** `backup/v34-3-mobile-audit-2026-10-10`, commit `578a713ce3e3a3e90402d2026319756754dca911`.
- v34.2: `backup/v34-2-2026-10-09`; v34.1: `backup/v34-1-approved-2026-10-09`; v34, v33 e v32 também preservadas.

## Testes e lacunas explicitamente não homologados

A UI pode testar tratamento de erro com fixture local, mas isso **não substitui** uma transmissão real de YouTube/Twitch funcionando no domínio, com direitos confirmados e identidade/câmera/movimento verificados. Se não houver keys oficiais, status final do componente real: **BLOCKED BY PROVIDER API ACCESS / NO VERIFIED LIVE INVENTORY**. Nunca anunciar que Road TV opera 24×7 antes de testes físicos em horários diferentes.
