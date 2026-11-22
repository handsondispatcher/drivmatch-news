# DrivMatch TV particular — na mesma hospedagem do DrivMatch News

**Decisão do proprietário (2026-11-22):** manter a TV **na mesma hospedagem** de `drivmatch.com/news`: GitHub Pages em `handsondispatcher/drivmatch-news`, com Cloudflare roteando `drivmatch.com/TV`. A TV continua pessoal, separada editorial/operacionalmente do News e de DrivMatch TV broadcasting.

## Arquitetura da candidata (NÃO IMPLANTADA)
- `site/index.html` continua DrivMatch News, sem modificação.
- `site/TV/index.html`, `tv.css`, `app.js`, `config.js` são uma página autônoma de controle remoto, grade de canais e player nativo/HLS dentro do próprio endereço.
- O pipeline **já existente** do News faz `actions/upload-pages-artifact` com `path: site` e `actions/deploy-pages`; portanto, quando a branch for aprovada/mesclada e o job passar, `site/TV` será incluída no **mesmo GitHub Pages**. Origem pretendida: `https://handsondispatcher.github.io/drivmatch-news/TV/`.
- O arquivo **proposto, não implantado** `integrations/private-tv-route-worker.js` mapeia exclusivamente `drivmatch.com/TV*` para a origem `.../drivmatch-news/TV/`. Deve ser um Worker/rota **independente** e nunca substituir `drivmatch-news-proxy` ou interceptar `/news*`.
- O frontend consulta playlist IPTV-org por países BR/ES/PT/JP/CN/US e categoria mundial News. No Brasil permite candidatos esportivos que não estejam identificados como canais premium; a seleção não redireciona a usuário para páginas externas. Links M3U **não garantem origem autorizada, disponibilidade nem compatibilidade HLS/CORS**.

## Privacidade: dois gates, não uma senha visual
1. **Gate de aplicação**: a página só expõe catálogo e player após sessão Supabase existente no mesmo domínio e resposta `allowed: true` de `private-tv-access`, que confere UID do proprietário no servidor. A função está preparada em `DrivMatch/drivmatch` Draft PR #198 mas ainda **não foi implantada**, nem existe owner UUID configurado nesta execução.
2. **Gate de borda recomendado**: política Cloudflare Access restrita ao proprietário para `drivmatch.com/TV*`. Isso não basta isoladamente, pois GitHub Pages tem origem HTML pública. O app bloqueia mesmo a origem direta por ausência de credenciais/checagem server-side.

**IMPORTANTE:** o HTML e JavaScript são acessíveis no GitHub Pages público. Protegemos o conteúdo funcional pelo gate Supabase; não afirmar que os bytes do código são privados.

### Configuração pública do navegador
- No GitHub `handsondispatcher/drivmatch-news`, em **Settings → Secrets and variables → Actions**, configurar `TV_SUPABASE_URL` (URL pública do projeto Supabase correto) e `TV_SUPABASE_PUBLISHABLE_KEY` (**apenas** publishable/anon, jamais service_role). O workflow `deploy.yml` cria `site/TV/config.js` com essas informações públicas.
- Se essas duas variáveis estiverem ausentes, a TV **falha fechada**: página informa que o acesso não está configurado e não baixa listas nem reproduz canais. Não divulgar senhas, OTP, service_role ou owner UUID no chat.
- No **Supabase Edge Function secrets**, `PRIVATE_TV_OWNER_USER_ID` deve ser definido ao UUID autenticado e conhecido do proprietário; nunca adicionar à pasta pública ou a variáveis frontend.
- Depois de login normal em `https://drivmatch.com/login`, a sessão Supabase é acessível em `drivmatch.com/TV` desde que a origem e sessão pertençam ao mesmo domínio. A origem GitHub Pages direta não compartilha o storage desse domínio; nela o app deverá negar acesso.

## Riscos e dependências de produção (RELEASE BLOCKED)
- Cloudflare ainda não foi conectado para alterações nesta sessão. Não foi criada a rota `/TV*` nem aplicada política Access.
- Supabase ainda não foi conectado para implantar e validar `private-tv-access`/UUID; nenhuma credencial foi alterada.
- Não foi executado teste físico de reprodução no Samsung Tizen, codecs ou conexão real de cada emissora. E2E mockado comprova somente UX e gates simulados.
- Não autorizar retransmissão, proxy de mídia protegido, captura/gravação ou contorno de DRM/geo-blocks. Cada emissora precisa permitir a forma de uso.
- O fluxo do News é sensível e tem agendamentos frequentes. A PR altera apenas **a pasta nova TV, dois arquivos de integração/CI e um pequeno step de renderização de configuração no deploy.yml**. Não modificar feed, editorial, Road TV, News player, horários, rotas ou dados do jornal.

## Provas obrigatórias de release
1. CI da branch: sintaxe JS, teste do gateway negado, acesso simulado, seletor video interno e pipeline de config fail-closed.
2. Supabase owner allow true com JWT válido; visitante e outra conta false; refresh expirado tratado.
3. Merge apenas após autorização específica para publicação e teste do workflow News intacto.
4. Deploy da origem Pages com URL `.../TV/` verificado.
5. Cloudflare `drivmatch.com/TV` encaminha para a mesma origem sem alterar `/news`; acesso limitado ao Owner.
6. Vídeo/áudio de canais reais legalmente autorizados reproduzidos **dentro da página**, testados no navegador da Samsung, com CORS, erros e recuperação.
7. Resposta HTTP/visual real dos dois URLs, `/news` preservado e `/TV` funcional, antes de declarar DONE.

**Status: Draft / NOT DEPLOYED.** A intenção de usar o mesmo GitHub Pages está implementada estruturalmente, mas `drivmatch.com/TV` ainda não está liberado.
