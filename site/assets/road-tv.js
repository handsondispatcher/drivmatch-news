/* DrivMatch News Road TV v34.2
 * Official YouTube player, click-to-load; never restream or invent LIVE state.
 * Both renderers read one verified catalog; no third-party requests before click. */
(()=>{
 'use strict';
 const cards=[...document.querySelectorAll('[data-roadtv]')];
 if(!cards.length)return;
 const official='https://www.youtube.com/';
 const channels=[
  {name:'Ride Along Gang',channel_url:official+'@Ridealonggang'},
  {name:'51 Logistics',channel_url:official+'@51logistics'},
  {name:'Freight Relocators Live',channel_url:official+'@freightrelocatorslive'},
  {name:'Johnny Trucker USA',channel_url:official+'@JohnnyTruckerUSA'}
 ];
 const recorded={
  video_id:'OyrSHX18bQk',channel_name:'Johnny Trucker USA',
  channel_url:official+'@JohnnyTruckerUSA',
  video_url:official+'watch?v=OyrSHX18bQk',
  title:'Vermont to Upstate New York · POV truck ride (4K, recorded)',
  live:false
 };
 const t={
  pt:{sub:'NA ESTRADA · VIAGENS E TRANSMISSÕES',live:'AO VIVO',recorded:'GRAVADO',
   title:'Vermont e Nova York · viagem de caminhão gravada',play:'▶ Abrir player do YouTube',
   watch:'Ver vídeo original ↗',
   intro:'Conteúdo de criadores independentes · YouTube',
   infoLive:'Transmissão ao vivo confirmada pelo YouTube. O player é carregado somente após seu clique.',
   infoRec:'Gravação identificada, não é transmissão ao vivo. O YouTube é carregado apenas após seu clique; disponibilidade depende do criador.',
   channels:'Visitar outros canais de caminhoneiros no YouTube:'},
  en:{sub:'ON THE ROAD · LIVE AND RECORDED',live:'LIVE',recorded:'RECORDED',
   title:'Vermont to New York · recorded trucking ride',play:'▶ Open YouTube player',
   watch:'Original on YouTube ↗',
   intro:'Independent creators · YouTube',
   infoLive:'Livestream verified by YouTube. The player loads only after you click.',
   infoRec:'This is a recording, not a live broadcast. YouTube loads only after you click; embedding depends on the creator.',
   channels:'Explore other trucking channels on YouTube:'},
  es:{sub:'EN LA RUTA · DIRECTOS Y GRABACIONES',live:'EN VIVO',recorded:'GRABADO',
   title:'Vermont a Nueva York · viaje grabado en camión',play:'▶ Abrir reproductor de YouTube',
   watch:'Ver original en YouTube ↗',
   intro:'Creadores independientes · YouTube',
   infoLive:'Transmisión en vivo verificada por YouTube. El reproductor se carga al pulsar.',
   infoRec:'Es una grabación, no una transmisión en vivo. YouTube se carga solo al pulsar; depende del creador.',
   channels:'Otros canales de camioneros en YouTube:'}
 };
 const safeVideoId=id=>typeof id==='string'&&/^[A-Za-z0-9_-]{11}$/.test(id);
 function safeYouTubeURL(url){
  try{const u=new URL(url);
   return u.protocol==='https:'&&['www.youtube.com','youtube.com','m.youtube.com'].includes(u.hostname)?u.href:'';
  }catch{return ''}
 }
 const lang=()=>['pt','en','es'].includes(document.getElementById('language')?.value)?document.getElementById('language').value:'pt';
 let catalog={current_live:null,live_checked_at:null,featured_recording:recorded,channels};
 let selected=null;
 function currentVideo(){
  const live=catalog.current_live,at=Date.parse(catalog.live_checked_at||'');
  const fresh=Number.isFinite(at)&&Date.now()-at>=-60000&&Date.now()-at<20*60*1000;
  if(fresh&&live?.live===true&&safeVideoId(live.video_id)&&safeYouTubeURL(live.video_url)&&safeYouTubeURL(live.channel_url))return live;
  const fallback=catalog.featured_recording;
  if(fallback&&safeVideoId(fallback.video_id)&&safeYouTubeURL(fallback.video_url)&&safeYouTubeURL(fallback.channel_url))return {...fallback,live:false};
  return recorded;
 }
 function newLink(url,label,className){
  const a=document.createElement('a');a.href=safeYouTubeURL(url)||recorded.channel_url;
  a.target='_blank';a.rel='noopener noreferrer';a.textContent=label;
  if(className)a.className=className;
  return a;
 }
 function renderCard(card,video){
  const copy=t[lang()];const isLive=video.live===true;
  card.querySelector('[data-roadtv-subheading]').textContent=copy.sub;
  const badge=card.querySelector('[data-roadtv-badge]');
  badge.textContent=isLive?copy.live:copy.recorded;
  badge.classList.toggle('is-live',isLive);
  card.querySelector('[data-roadtv-credit]').textContent=copy.intro+' · '+String(video.channel_name||'');
  const orig=card.querySelector('[data-roadtv-original]');
  orig.href=safeYouTubeURL(video.video_url)||recorded.video_url;
  orig.textContent=copy.watch;
  const screen=card.querySelector('[data-roadtv-screen]');
  const existing=screen.querySelector('iframe[data-roadtv-frame]');
  if(existing&&existing.dataset.videoId!==video.video_id){existing.remove()}
  const stage=card.querySelector('[data-roadtv-stage]');
  stage.querySelector('[data-roadtv-stage-title]').textContent=isLive?String(video.title||video.channel_name||'YouTube'):copy.title;
  const btn=stage.querySelector('[data-roadtv-play]');btn.textContent=copy.play;
  stage.hidden=!!screen.querySelector('iframe');
  card.querySelector('[data-roadtv-disclosure]').textContent=isLive?copy.infoLive:copy.infoRec;
  const list=card.querySelector('[data-roadtv-channels]');list.replaceChildren();
  list.setAttribute('aria-label',copy.channels);
  (Array.isArray(catalog.channels)?catalog.channels:channels).forEach(ch=>{
   const link=safeYouTubeURL(ch.channel_url);
   if(link)list.appendChild(newLink(link,String(ch.name||'Canal')));
  });
 }
 function render(){
  selected=currentVideo();
  cards.forEach(card=>renderCard(card,selected));
 }
 function loadVideo(card){
  const video=selected||currentVideo();if(!safeVideoId(video.video_id))return;
  // A hidden mobile/desktop duplicate must not continue playing.
  cards.forEach(c=>{if(c!==card){
   c.querySelectorAll('iframe[data-roadtv-frame]').forEach(el=>el.remove());
   c.querySelector('[data-roadtv-stage]').hidden=false;
  }});
  const screen=card.querySelector('[data-roadtv-screen]');
  if(screen.querySelector('iframe[data-roadtv-frame]'))return;
  const iframe=document.createElement('iframe');
  iframe.dataset.roadtvFrame='true';iframe.dataset.videoId=video.video_id;
  iframe.title='YouTube — '+String(video.channel_name||'Trucking');
  iframe.src='https://www.youtube-nocookie.com/embed/'+video.video_id+'?playsinline=1&rel=0';
  iframe.referrerPolicy='strict-origin-when-cross-origin';
  iframe.setAttribute('allow','encrypted-media; picture-in-picture; fullscreen; web-share');
  iframe.setAttribute('allowfullscreen','');
  iframe.loading='lazy';
  screen.appendChild(iframe);
  card.querySelector('[data-roadtv-stage]').hidden=true;
  // No URL includes personal data; external video platform has its own tracking.
  card.dispatchEvent(new CustomEvent('roadtv:player-opened',{bubbles:true,detail:{source:'youtube',status:video.live?'live':'recorded'}}));
 }
 cards.forEach(card=>card.addEventListener('click',e=>{
  if(e.target.closest('[data-roadtv-play]'))loadVideo(card);
 }));
 document.getElementById('language')?.addEventListener('change',render);
 document.querySelectorAll('[data-site-lang]').forEach(el=>el.addEventListener('click',()=>setTimeout(render,0)));
 render();
 if(location.protocol==='http:'||location.protocol==='https:'){
  fetch('data/road-tv.json?ts='+Date.now(),{cache:'no-store'}).then(async res=>{
   if(!res.ok)throw Error('Road TV catalog temporarily unavailable');
   const data=await res.json();
   if(data.schema_version!==1||!Array.isArray(data.channels))return;
   // Creator links are explicitly allowlisted to YouTube; live is always
   // checked against its timestamp and never inferred from a name/title.
   catalog=data;render();
  }).catch(()=>{/* Identified recorded video and owner links remain available. */});
 }
})();
