/* DrivMatch Minha TV • private viewer candidate • no offsite redirects or retransmission */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const countries = [
    {code:"ALL",name:"Todos",flag:"🌐"},
    {code:"BR",name:"Brasil",flag:"🇧🇷"},
    {code:"ES",name:"Espanha",flag:"🇪🇸"},
    {code:"PT",name:"Portugal",flag:"🇵🇹"},
    {code:"JP",name:"Japão",flag:"🇯🇵"},
    {code:"CN",name:"China",flag:"🇨🇳"},
    {code:"US",name:"EUA",flag:"🇺🇸"}
  ];
  const NEWS = /news|not[ií]cias|noticiero|informaci[oó]n|actualidad|jornalismo|journalism/i;
  const SPORTS = /sport|esport|deport|futebol|football|soccer/i;
  const PAID = /\b(espn|spor\s*tv|premiere|combate|band\s*sports|fox\s*sports|tnt\s*sports)\b/i;
  const store = "drivmatch-private-tv-favorites-v2";
  const state = { country:"ALL", category:"all", favoritesOnly:false, search:"", channels:[], selected:null, favorites:[], hls:null, authorised:false };
  const config = window.DRIVMATCH_PRIVATE_TV_CONFIG || {};
  const video = $("video");
  let hlsPromise = null;

  function setGate(message, login=false) {
    $("gate").hidden = false;
    $("tv").hidden = true;
    $("gate-message").textContent = message;
    $("login-link").hidden = !login;
    state.authorised = false;
    stopPlayer();
  }

  function validConfig() {
    try {
      const u = new URL(config.supabaseUrl);
      return u.protocol === "https:" && /\.supabase\.co$/.test(u.hostname)
        && typeof config.supabaseAnonKey === "string"
        && config.supabaseAnonKey.length > 20
        && !config.supabaseAnonKey.startsWith("sb_secret_");
    } catch { return false; }
  }

  function readSession() {
    try {
      const project = new URL(config.supabaseUrl).hostname.split(".")[0];
      const raw = localStorage.getItem("sb-" + project + "-auth-token");
      if (!raw) return null;
      const session = JSON.parse(raw);
      if (!session || typeof session.access_token !== "string" || session.access_token.length < 20) return null;
      if (session.expires_at && session.expires_at <= Date.now()/1000 + 15) return null;
      return session.access_token;
    } catch { return null; }
  }

  async function verifyOwner() {
    if (!validConfig()) {
      setGate("A configuração de acesso privado ainda não foi concluída.");
      return false;
    }
    const token = readSession();
    if (!token) {
      setGate("Entre primeiro na sua conta autorizada do DrivMatch.", true);
      return false;
    }
    try {
      const u = new URL(config.supabaseUrl);
      const res = await fetch(u.origin + "/functions/v1/private-tv-access", {
        method:"GET", cache:"no-store", headers:{
          "Authorization":"Bearer " + token,
          "apikey":config.supabaseAnonKey,
          "Accept":"application/json"
        }
      });
      if (!res.ok) throw Error("access");
      const body = await res.json();
      if (body.allowed !== true) throw Error("access");
      state.authorised = true;
      $("gate").hidden = true;
      $("tv").hidden = false;
      return true;
    } catch {
      setGate("Acesso negado ou indisponível. A autorização do proprietário precisa ser ativada no servidor.",true);
      return false;
    }
  }

  function parsePlaylist(content, country, fromGlobal=false) {
    let ext="";
    const list=[];
    for (const raw of content.split(/\r?\n/)) {
      const line=raw.trim();
      if (line.startsWith("#EXTINF:")) { ext=line;continue; }
      if (!ext || !line || line.startsWith("#")) continue;
      let code=country;
      if (fromGlobal) {
        const match=/tvg-id="[^"]*?\.(br|es|pt|jp|cn|us)@/i.exec(ext);
        code=match?.[1]?.toUpperCase();
      }
      const name=ext.slice(ext.lastIndexOf(",")+1).trim();
      const group=/group-title="([^"]*)"/i.exec(ext)?.[1] || "";
      const category=code==="BR"&&SPORTS.test(name+" "+group)?"sports":NEWS.test(name+" "+group)?"news":null;
      try {
        const u=new URL(line);
        if (!countries.some(c=>c.code===code) || code==="ALL" || !category
          || !name || /\[Geo-blocked\]/i.test(name)
          || category==="sports"&&PAID.test(name)
          || u.protocol!=="https:" || u.username || u.password
          || !u.href.includes(".m3u8")) {ext="";continue;}
        list.push({code,name,category,url:u.href,id:code+":"+name+":"+u.href});
      } catch { /* Invalid URL is not a playable channel. */ }
      ext="";
    }
    return list;
  }

  async function loadChannels() {
    if (!state.authorised) return;
    $("catalog-status").textContent="Buscando transmissões…";
    const sources=countries.filter(c=>c.code!=="ALL").map(c=>({
      url:"https://iptv-org.github.io/iptv/countries/"+c.code.toLowerCase()+".m3u",code:c.code,global:false
    }));
    sources.push({url:"https://iptv-org.github.io/iptv/categories/news.m3u",code:null,global:true});
    const results=await Promise.allSettled(sources.map(async s=>{
      const res=await fetch(s.url,{cache:"no-store"});
      if (!res.ok) throw Error("source");
      return parsePlaylist(await res.text(),s.code,s.global);
    }));
    if (!state.authorised) return;
    const unique=new Map();
    results.forEach(r=>{
      if (r.status!=="fulfilled") return;
      r.value.forEach(c=>{if(!unique.has(c.id)) unique.set(c.id,c);});
    });
    state.channels=[...unique.values()].slice(0,1500);
    const failures=results.filter(r=>r.status==="rejected").length;
    $("catalog-status").textContent=state.channels.length+" opções não verificadas"
      +(failures?" • "+failures+" fontes indisponíveis":"")
      +" • Reprodução sujeita a bloqueios";
    render();
  }

  function favoriteKey(c){return c.code+":"+c.name;}
  function readFavorites(){
    try {const a=JSON.parse(localStorage.getItem(store)||"[]");return Array.isArray(a)?a.filter(x=>typeof x==="string"):[];}
    catch{return [];}
  }
  function storeFavorites(){
    try {localStorage.setItem(store,JSON.stringify(state.favorites));}
    catch{/* Keep preferences in memory if storage is unavailable. */}
  }
  function render(){
    const norm=s=>s.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    const matches=state.channels.filter(c=>
      (state.country==="ALL"||c.code===state.country)
      && (state.category==="all"||c.category===state.category)
      && (!state.favoritesOnly||state.favorites.includes(favoriteKey(c)))
      && norm(c.name).includes(norm(state.search))
    );
    const area=$("channels");
    area.replaceChildren();
    const fragment=document.createDocumentFragment();
    for(const c of matches){
      const row=document.createElement("div");
      row.className="channel"+(state.selected?.id===c.id?" active":"");
      const pick=document.createElement("button");
      pick.type="button";pick.className="pick";
      const title=document.createElement("strong");title.textContent=c.name;
      const meta=document.createElement("small");
      meta.textContent=(countries.find(x=>x.code===c.code)?.flag||"")+" "
        +(c.category==="sports"?"Esportes BR":"Notícias")+" • Sinal não verificado";
      pick.append(title,meta);
      pick.addEventListener("click",()=>void selectChannel(c));
      const fav=document.createElement("button");fav.type="button";
      const marked=state.favorites.includes(favoriteKey(c));
      fav.className="fav"+(marked?" marked":"");
      fav.textContent=marked?"★":"☆";fav.title=(marked?"Remover favorito: ":"Favoritar: ")+c.name;
      fav.setAttribute("aria-label",fav.title);
      fav.addEventListener("click",()=>{
        const k=favoriteKey(c);
        state.favorites=marked?state.favorites.filter(x=>x!==k):[...state.favorites,k];
        storeFavorites();render();
      });
      row.append(pick,fav);fragment.appendChild(row);
    }
    area.appendChild(fragment);
    if(!matches.length){const empty=document.createElement("p");empty.className="status";empty.textContent="Nenhum canal encontrado neste filtro.";area.appendChild(empty);}
  }

  function error(message) {$("player-error").textContent=message;$("player-error").hidden=false;}
  function stopPlayer(){
    try {video.pause();} catch{}
    if(state.hls){state.hls.destroy();state.hls=null;}
    video.removeAttribute("src");
    try{video.load();}catch{}
    video.hidden=true;
    $("full-screen").disabled=true;
  }

  function ensureHls(){
    if(window.Hls)return Promise.resolve(window.Hls);
    if(!hlsPromise)hlsPromise=new Promise((resolve,reject)=>{
      const script=document.createElement("script");
      script.src="https://cdn.jsdelivr.net/npm/hls.js@1.6.15/dist/hls.min.js";
      script.crossOrigin="anonymous";script.async=true;
      script.onload=()=>window.Hls?resolve(window.Hls):reject(Error("HLS"));
      script.onerror=()=>reject(Error("HLS network"));
      document.head.appendChild(script);
    }).catch(e=>{hlsPromise=null;throw e;});
    return hlsPromise;
  }

  async function selectChannel(c){
    if(!state.authorised)return;
    stopPlayer();
    state.selected=c;
    $("player-error").hidden=true;
    $("current-channel").textContent=c.name;
    $("current-country").textContent=countries.find(x=>x.code===c.code)?.name||"";
    $("screen-message").hidden=true;
    video.hidden=false;
    $("full-screen").disabled=false;
    render();
    try{
      if(video.canPlayType("application/vnd.apple.mpegurl") || video.canPlayType("application/x-mpegURL")){
        video.src=c.url;
      } else {
        const Hls=await ensureHls();
        if(state.selected!==c||!state.authorised)return;
        if(Hls.isSupported()){
          state.hls=new Hls();
          state.hls.on(Hls.Events.ERROR,(_event,details)=>{
            if(details.fatal&&state.selected===c)error("A origem bloqueou ou encerrou este sinal. Selecione outro canal.");
          });
          state.hls.loadSource(c.url);
          state.hls.attachMedia(video);
        } else {
          // Some Samsung browsers play HLS natively despite an empty canPlayType result.
          video.src=c.url;
        }
      }
      const p=video.play();
      if(p&&typeof p.catch==="function")p.catch(()=>{if(state.selected===c)error("Pressione Play no vídeo para iniciar, se o sinal permitir.");});
    }catch {if(state.selected===c)error("Este navegador não conseguiu reproduzir o sinal. Escolha outro canal.");}
  }

  function initializeFilters(){
    for(const c of countries){
      const b=document.createElement("button");b.type="button";b.textContent=c.flag+" "+c.name;
      b.dataset.country=c.code;if(c.code==="ALL")b.className="chosen";
      b.addEventListener("click",()=>{
        state.country=c.code;
        for(const el of $("countries").querySelectorAll("button"))el.classList.toggle("chosen",el.dataset.country===c.code);
        render();
      });
      $("countries").appendChild(b);
    }
    $("categories").querySelectorAll("[data-category]").forEach(b=>b.addEventListener("click",()=>{
      state.category=b.dataset.category;
      $("categories").querySelectorAll("[data-category]").forEach(x=>x.classList.toggle("chosen",x===b));
      render();
    }));
    $("favorites-only").addEventListener("click",e=>{
      state.favoritesOnly=!state.favoritesOnly;
      e.currentTarget.classList.toggle("chosen",state.favoritesOnly);render();
    });
    $("search").addEventListener("input",e=>{state.search=e.target.value;render();});
    $("full-screen").addEventListener("click",()=>{const p=$("screen").requestFullscreen?.();p?.catch(()=>{});});
    video.addEventListener("error",()=>{if(state.selected)error("Falha no sinal. O servidor pode exigir permissões, bloquear CORS ou estar indisponível.");});
  }

  async function init(){
    initializeFilters();
    if(!await verifyOwner())return;
    state.favorites=readFavorites();
    await loadChannels();
    setInterval(async()=>{if(state.authorised)await verifyOwner();},300000);
  }
  void init();
})();
