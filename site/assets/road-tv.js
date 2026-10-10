/* DrivMatch Road TV v34.2 | YouTube + Twitch official embeds only.
 * No iframe before a viewer's click; no restreaming; no fabricated LIVE label.
 * A 10-minute news build checks metadata. Browser refreshes the status every
 * 2 minutes; switches on broadcaster STOP metadata or after 12 minutes if
 * another eligible active stream is available (not a motion detector). */
(()=>{
'use strict';
const cards=[...document.querySelectorAll('[data-roadtv]')];
if(!cards.length)return;
const VERIFIED_HOSTS=new Set(['drivmatch.com','www.drivmatch.com','handsondispatcher.github.io','localhost','127.0.0.1']);
const aliases={
 pt:{sub:'ESTRADA DOS EUA · SEMI / BOX / PICKUP / VAN',live:'AO VIVO',replay:'REPLAY',missing:'SEM LIVE',
  awaiting:'Verificando transmissões…',none:'Nenhuma live ou gravação elegível confirmada agora.',
  play:'▶ Assistir pelo player oficial',next:'Próximo canal ↻',source:'Abrir na plataforma ↗',
  note:'Filmagem a partir da cabine e operação nos EUA: sinais declarados no título/descrição do criador, não verificados quadro a quadro.',
  recorded:'Reprodução de transmissão encerrada hoje/ontem; horário aproximado da gravação alinhado ao horário atual. Não é ao vivo.',
  online:'Transmissão ativa confirmada pela plataforma. Cena e movimento não podem ser certificados automaticamente.',
  search:'Continue explorando os canais; nenhum conteúdo é reproduzido sem sua ação.',
  wait:'Aguardando nova verificação.',channels:'Fontes indicadas para investigação (não necessariamente ao vivo).',
  switch:'Troca automática quando outra transmissão validada estiver disponível.',
  manual:'Escolha outro canal verificado'},
 en:{sub:'U.S. ROADS · SEMI / BOX / PICKUP / VAN',live:'LIVE',replay:'REPLAY',missing:'NO LIVE',
  awaiting:'Checking live feeds…',none:'No verified live stream or eligible recent replay right now.',
  play:'▶ Watch in official player',next:'Next channel ↻',source:'Open on platform ↗',
  note:'US location and forward-facing cab camera are declared by the creator, not verified frame by frame.',
  recorded:'A completed broadcast from today/yesterday, roughly matched to the local time of day. Not live.',
  online:'Live status verified by platform. Movement and camera view cannot be certified automatically.',
  search:'Explore the channels; no third-party content plays until you click.',
  wait:'Awaiting another verification.',channels:'Discovery leads (not necessarily live).',
  switch:'Automatic channel rotation when another eligible broadcast exists.',
  manual:'Select another verified channel'},
 es:{sub:'CARRETERAS DE EE. UU. · CAMIONES Y FURGONETAS',live:'EN VIVO',replay:'REPETICIÓN',missing:'SIN DIRECTO',
  awaiting:'Buscando transmisiones…',none:'No hay directos ni repeticiones recientes verificadas en este momento.',
  play:'▶ Ver con reproductor oficial',next:'Siguiente canal ↻',source:'Abrir en la plataforma ↗',
  note:'EE. UU. y cámara frontal declarados por el creador; no se verifican fotogramas.',
  recorded:'Transmisión terminada hoy/ayer, seleccionada por hora aproximada. No es en vivo.',
  online:'Directo confirmado por la plataforma. Movimiento y cámara no se certifican automáticamente.',
  search:'Explore los canales; no se reproduce contenido sin pulsar.',
  wait:'Esperando nueva verificación.',channels:'Canales para investigar (no necesariamente en vivo).',
  switch:'Cambio automático cuando exista otro directo elegible.',
  manual:'Seleccione otro canal verificado'}
};
const lang=()=>aliases[document.getElementById('language')?.value]?document.getElementById('language').value:'pt';
const goodURL=u=>{try{const x=new URL(u);return x.protocol==='https:'&&
  ['www.youtube.com','youtube.com','m.youtube.com','www.twitch.tv','twitch.tv'].includes(x.hostname)?x.href:null;}catch{return null}};
const validVideo=v=>v&&(
  v.platform==='youtube'&&/^[A-Za-z0-9_-]{11}$/.test(v.video_id||'') ||
  v.platform==='twitch'&&/^[a-z0-9_]{3,25}$/.test(v.channel_login||'')
)&&goodURL(v.video_url)&&goodURL(v.channel_url)
  &&v.geo_evidence&&v.camera_evidence&&v.verification
  &&(v.live===true&&v.status==='live'||v.live===false&&v.status==='replay');
const id=v=>String(v.platform)+':'+String(v.video_id||v.channel_login||'');
let data={schema_version:2,live_status:'unverified',candidates:[],channels:[]};
let catalog=[],index=0,activeCard=null,activated=false,startedAt=0,activeId='';
let waitingRefresh=false;
function clearFrame(card){card.querySelector('[data-roadtv-screen] iframe')?.remove();card.querySelector('[data-roadtv-stage]').hidden=false}
function stopFrames(){cards.forEach(clearFrame);activeCard=null;activeId=''}
function safeCandidates(d){
 const generated=Date.parse(d?.generated_at||'');
 if(!Number.isFinite(generated)||Math.abs(Date.now()-generated)>25*60000)return [];
 // Even when a cached catalog says LIVE, no player may claim that label after
 // 20 minutes without an updated authorized API verification.
 const checked=Date.parse(d?.live_checked_at||'');
 const liveFresh=Number.isFinite(checked)&&Date.now()-checked>=-60000&&Date.now()-checked<20*60000;
 const uniq=new Set();
 return (Array.isArray(d?.candidates)?d.candidates:[]).filter(v=>{
  if(!validVideo(v)||v.live===true&&!liveFresh)return false;
  // Replays only from the trusted backend selection of today/yesterday;
  // invalidated cached replay entries should not persist in client forever.
  if(v.live===false){
   const at=Date.parse(v.ended_at||'');
   if(!Number.isFinite(at)||Date.now()-at>48*3600000||Date.now()<at)return false;
  }
  if(uniq.has(id(v)))return false;uniq.add(id(v));return true;
 }).slice(0,12).sort((a,b)=>Number(b.live)-Number(a.live));
}
function current(){return catalog[index]||null}
function link(u,label){
 const a=document.createElement('a');a.textContent=label;a.href=goodURL(u)||'https://www.youtube.com/';
 a.target='_blank';a.rel='noopener noreferrer';return a;
}
function updateCard(card){
 const c=aliases[lang()],v=current(),live=!!v?.live;
 const badge=card.querySelector('[data-roadtv-badge]');
 badge.textContent=v?(live?c.live:c.replay):c.missing;
 badge.classList.toggle('is-live',live);
 badge.classList.toggle('is-pending',!v);
 card.querySelector('[data-roadtv-subheading]').textContent=c.sub;
 card.querySelector('[data-roadtv-stage-title]').textContent=v?String(v.title||v.channel_name).slice(0,155):c.none;
 const play=card.querySelector('[data-roadtv-play]');play.hidden=!v;play.textContent=c.play;
 card.querySelector('[data-roadtv-credit]').textContent=v?String(v.channel_name||'')+' · '+(v.platform==='youtube'?'YouTube':'Twitch'):'Road TV · YouTube / Twitch';
 const original=card.querySelector('[data-roadtv-original]');original.hidden=!v;
 if(v)original.href=goodURL(v.video_url);
 original.textContent=c.source;
 const next=card.querySelector('[data-roadtv-next]');next.textContent=c.next;next.disabled=catalog.length<=1;
 const status=card.querySelector('[data-roadtv-status]');status.textContent=v?((index+1)+' / '+catalog.length+' · '+c.switch):c.wait;
 const message=card.querySelector('[data-roadtv-disclosure]');
 message.textContent=(v?(live?c.online:c.recorded):c.search)+' '+c.note;
 const list=card.querySelector('[data-roadtv-channels]');list.replaceChildren();
 list.setAttribute('aria-label',c.channels);
 // Additional creators are discovered through authorized APIs. Catalog
 // "channels" are suggestions to explore, never impersonated as LIVE.
 for(const ch of (Array.isArray(data.channels)?data.channels:[])){
  if(goodURL(ch.channel_url))list.appendChild(link(ch.channel_url,String(ch.name||'Criador')));
 }
 const stage=card.querySelector('[data-roadtv-stage]');
 stage.hidden=!!card.querySelector('iframe');
}
function render(){cards.forEach(updateCard)}
function choose(n,auto=false){
 const v=catalog[n];if(!v)return;
 const previousCard=activeCard;
 stopFrames();index=n;startedAt=Date.now();render();
 // Autoplay may be blocked by the browser. A user click was already required
 // for the first play. On auto rotation, muted playback is attempted safely.
 if(auto&&activated&&previousCard)embed(previousCard,true);
}
function embed(card,auto=false){
 const v=current();
 if(!v||!VERIFIED_HOSTS.has(location.hostname))return;
 stopFrames();
 let src;
 if(v.platform==='youtube'){
  src='https://www.youtube-nocookie.com/embed/'+encodeURIComponent(v.video_id)+'?playsinline=1&rel=0'+(auto?'&autoplay=1&mute=1':'');
  if(!v.live&&Number.isInteger(v.start_seconds)&&v.start_seconds>0)
   src+='&start='+Math.min(v.start_seconds,86400);
 }else{
  src='https://player.twitch.tv/?channel='+encodeURIComponent(v.channel_login)
    +'&parent='+encodeURIComponent(location.hostname)+'&autoplay='+(auto?'true':'false')+'&muted=true';
 }
 const frame=document.createElement('iframe');
 frame.title=(v.live?'AO VIVO':'REPLAY')+' · '+(v.channel_name||v.platform);
 frame.src=src;frame.loading='lazy';
 frame.referrerPolicy='strict-origin-when-cross-origin';
 frame.setAttribute('allow','autoplay; encrypted-media; picture-in-picture; fullscreen');
 frame.setAttribute('allowfullscreen','');
 frame.setAttribute('data-roadtv-frame','true');
 card.querySelector('[data-roadtv-screen]').classList.toggle('is-twitch',v.platform==='twitch');
 card.querySelector('[data-roadtv-screen]').appendChild(frame);
 card.querySelector('[data-roadtv-stage]').hidden=true;
 activeCard=card;activeId=id(v);activated=true;startedAt=Date.now();
 card.dispatchEvent(new CustomEvent('roadtv:player-opened',
  {bubbles:true,detail:{platform:v.platform,live:v.live,regionClaim:'USA'}}));
}
function reconcile(next){
 const old=current(),previous=old&&id(old),playing=activeId;
 data=next;catalog=safeCandidates(next);
 const match=catalog.findIndex(c=>id(c)===previous);
 index=match>=0?match:0;
 const changed=playing&&!catalog.some(v=>id(v)===playing);
 const newLive=!!(playing&&catalog[index]&&!catalog[index].live&&catalog.some(v=>v.live));
 if(changed||newLive){
   const previousCard=activeCard;
   stopFrames();
   if(newLive)index=catalog.findIndex(c=>c.live);
   render();
   if(previousCard&&catalog.length&&activated)embed(previousCard,true);
   return;
 }
 if(!playing&&catalog.some(c=>c.live)&&catalog[index]&&!catalog[index].live)
  index=catalog.findIndex(c=>c.live);
 render();
}
async function refresh(){
 if(waitingRefresh)return;
 waitingRefresh=true;
 try{
  const response=await fetch('data/road-tv.json?probe='+Date.now(),{cache:'no-store'});
  if(!response.ok)throw Error('catalog_unavailable');
  const obj=await response.json();
  if(obj.schema_version!==2||!Array.isArray(obj.candidates))throw Error('invalid_schema');
  reconcile(obj);
 }catch{
  // If verification stops, stale LIVE must not remain labeled as active.
  if(data.generated_at&&Date.now()-Date.parse(data.generated_at)>25*60000)
   reconcile({...data,generated_at:null,candidates:[]});
 }finally{waitingRefresh=false}
}
cards.forEach(card=>{
 card.addEventListener('click',e=>{
  if(e.target.closest('[data-roadtv-play]'))embed(card);
  if(e.target.closest('[data-roadtv-next]')&&catalog.length>1)
   choose((index+1)%catalog.length);
 });
});
document.getElementById('language')?.addEventListener('change',render);
document.querySelectorAll('[data-site-lang]').forEach(x=>x.addEventListener('click',()=>setTimeout(render,0)));
setInterval(refresh,120000);
setInterval(()=>{
 if(catalog.length<2||!activated||!activeId||Date.now()-startedAt<12*60000)return;
 const next=catalog.findIndex((v,i)=>i!==index&&v.live);
 if(next>=0)choose(next,true);
},60000);
render();
refresh();
})();
