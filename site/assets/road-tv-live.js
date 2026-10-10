/* DrivMatch News v34.6: Road TV integrity monitor.
 * Official YouTube/Twitch player only. Never publish a hard-coded dead stream.
 * Live first, source-verified; recorded fallback allowed only when labeled.
 * Swap on playback errors, ended streams, verified-source expiry and rotation.
 * No channel chips, promotional text or public-facing diagnostic paragraphs.
 */
(()=>{
 'use strict';
 const cards=[...document.querySelectorAll('.roadtv-card')];
 if(!cards.length)return;
 const safeHost=new Set(['drivmatch.com','www.drivmatch.com','handsondispatcher.github.io','localhost','127.0.0.1']);
 const liveSource='data/road-tv.json';
 const cameraSourceRegistry='data/camera-source-network.json';
 let externalCameraLinks=[];
 const videoId=/^[A-Za-z0-9_-]{11}$/;
 const twitchLogin=/^[a-z0-9_]{3,25}$/;
 const labels={
  pt:{waiting:'Buscando transmissão disponível…',empty:'Nenhuma transmissão verificada agora.',replay:'GRAVADO',error:'Transmissão indisponível. Buscando outra…'},
  en:{waiting:'Checking available broadcasts…',empty:'No verified broadcast available right now.',replay:'RECORDED',error:'Broadcast unavailable. Looking for another…'},
  es:{waiting:'Buscando transmisión disponible…',empty:'No hay transmisiones verificadas en este momento.',replay:'GRABADO',error:'Transmisión no disponible. Buscando otra…'}
 };
 const lang=()=>labels[document.getElementById('language')?.value]?document.getElementById('language').value:'pt';
 let videos=[],active=null,activeCard=null,player=null,started=0,playing=false,attemptingAt=0;
 let catalogAt=0,refreshing=false,lastVisible=null,epoch=0,apiLoading=null;
 const failed=new Map();
 const now=()=>Date.now();
 const visible=()=>cards.find(c=>c.getBoundingClientRect().width>0&&getComputedStyle(c).display!=='none'&&c.getClientRects().length)||cards[0];
 const playbackArea=card=>card.querySelector('.roadtv-screen');
 const key=v=>v?.platform==='youtube'?'y:'+v.video_id:'t:'+v?.channel_login;
 const safeUri=u=>{try{const x=new URL(u);return x.protocol==='https:'&&['www.youtube.com','youtube.com','m.youtube.com','www.twitch.tv','twitch.tv'].includes(x.hostname);}catch{return false}};
 const valid=(v,checkedAt)=>{
  if(!v||typeof v!=='object'||!safeUri(v.video_url)||!safeUri(v.channel_url)||!v.geo_evidence||!v.camera_evidence||!v.verification)return false;
  if(v.platform==='youtube'&&!videoId.test(v.video_id||''))return false;
  if(v.platform==='twitch'&&!twitchLogin.test(v.channel_login||''))return false;
  if(!['youtube','twitch'].includes(v.platform))return false;
  if(v.live===true)return v.status==='live'&&now()-checkedAt>=-60000&&now()-checkedAt<=20*60000;
  if(v.live===false&&v.status==='replay'&&v.platform==='youtube'){
   const ended=Date.parse(v.ended_at||'');
   return Number.isFinite(ended)&&ended<=now()&&now()-ended<=36*3600000
      &&Number.isInteger(v.start_seconds)&&v.start_seconds>=0;
  }
  return false;
 };
 // Official FL511 permits embedding its traffic-camera map (including streaming-video cameras).
 // It is a usable road-camera directory, NOT a certified autoplaying live broadcast.
 const floridaCameras='https://fl511.com/Map/EmbeddedMap?layers=Cameras&region=ALL&size=0';
 const fallbackLinks=[{id:'fl511-i4',label:'I-4 / FL511',source_url:'https://fl511.com/region/Central'}];
 const approvedHosts={'fl511-i4':'fl511.com','peacebridge-usbound':'www.peacebridge.com',
                      'nvroads-nevada':'www.nvroads.com','milecheck-cameras':'milecheckapp.com'};
 function safeOfficialLink(source){
   if(!source||typeof source!=='object'||!approvedHosts[source.id])return false;
   try{
     const url=new URL(source.source_url);
     return url.protocol==='https:'&&url.hostname===approvedHosts[source.id]
       &&['approved_official_embed','external_link_only','external_link_only_license_required'].includes(source.display)
       &&source.verified_playing_live===false;
   }catch{return false}
 }
 function directoryLinks(){return externalCameraLinks.length?externalCameraLinks:fallbackLinks;}
 function renderCameraHelp(area){
   area.querySelector('.roadtv-map-help')?.remove();
   const helper=document.createElement('div');helper.className='roadtv-map-help';
   const label=document.createElement('span');label.className='roadtv-help-label';
   label.textContent=lang()==='en'?'Official road cameras — select to view':lang()==='es'?'Cámaras de carretera — seleccione':'Câmeras rodoviárias — escolha a fonte';
   const links=document.createElement('span');links.className='roadtv-source-links';
   for(const source of directoryLinks()){
     const anchor=document.createElement('a');
     anchor.href=source.source_url;anchor.target='_blank';anchor.rel='noopener noreferrer';
     anchor.textContent=source.label;anchor.title=source.name||source.label;
     anchor.dataset.cameraSourceId=source.id;
     links.appendChild(anchor);
   }
   helper.append(label,links);area.appendChild(helper);
 }
 async function loadCameraDirectory(){
   if(!location.protocol.startsWith('http'))return;
   try{
     const response=await fetch(cameraSourceRegistry+'?ts='+now(),{cache:'no-store'});
     if(!response.ok)throw Error('camera_sources_unavailable');
     const data=await response.json();
     if(data.schema_version!==1||!Array.isArray(data.sources)||data.all_camera_streams_verified!==false)
       throw Error('camera_sources_not_safe');
     externalCameraLinks=data.sources.filter(safeOfficialLink).slice(0,4);
   }catch{externalCameraLinks=[]}
   cards.forEach(card=>{
     const area=playbackArea(card);
     if(area?.querySelector('.roadtv-official-map'))renderCameraHelp(area);
   });
 }
 function status(message){
   const fallback=message===labels[lang()].empty||message===labels[lang()].error;
   for(const card of cards){
     const area=playbackArea(card);if(!area)return;
     if(area.querySelector('.roadtv-official-map')){if(fallback)renderCameraHelp(area);continue}
     if(area.querySelector('iframe'))continue;
     area.replaceChildren();
     if(fallback){
       const iframe=document.createElement('iframe');
       iframe.className='roadtv-official-map';
       iframe.title='FL511: câmeras oficiais de rodovias da Flórida; selecione a I-4 e uma câmera de vídeo';
       iframe.loading='lazy';
       iframe.referrerPolicy='strict-origin-when-cross-origin';
       iframe.src=floridaCameras;
       area.appendChild(iframe);
       renderCameraHelp(area);
     }else{
       const p=document.createElement('span');
       p.className='roadtv-status';p.setAttribute('role','status');p.textContent=message;
       area.appendChild(p);
     }
   }
 }
 function clear(){
   epoch+=1;
   if(player?.destroy)try{player.destroy()}catch{}
   player=null;playing=false;active=null;activeCard=null;started=0;attemptingAt=0;
   cards.forEach(card=>{const area=playbackArea(card);area?.replaceChildren();area?.classList.remove('is-twitch')});
 }
 function candidates(json){
   const updated=Date.parse(json?.generated_at||''),checked=Date.parse(json?.live_checked_at||'');
   // A deployed site cannot truthfully claim LIVE from a stale pipeline.
   if(!Number.isFinite(updated)||now()-updated>25*60000||now()-updated < -60000)return [];
   const unique=new Set();
   return (Array.isArray(json.candidates)?json.candidates:[])
     .filter(v=>valid(v,checked))
     .filter(v=>{const id=key(v);if(unique.has(id))return false;unique.add(id);return true})
     .sort((a,b)=>Number(b.live)-Number(a.live)||(Number(a.source_rank??99)-Number(b.source_rank??99))).slice(0,12);
 }
 function markedBad(v){return failed.has(key(v))&&now()-failed.get(key(v))<15*60000}
 function nextVideo(exclude){
   return videos.find(v=>!markedBad(v)&&key(v)!==exclude)||null;
 }
 function youtubeApi(){
   if(window.YT?.Player)return Promise.resolve(window.YT);
   if(apiLoading)return apiLoading;
   apiLoading=new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src='https://www.youtube.com/iframe_api';
      script.async=true;
      const prev=window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady=()=>{if(typeof prev==='function')prev();resolve(window.YT)};
      script.onerror=()=>reject(new Error('youtube_api_unavailable'));
      document.head.appendChild(script);
   }).catch(e=>{apiLoading=null;throw e});
   return apiLoading;
 }
 function makeReplayBadge(area){
   const badge=document.createElement('span');
   badge.className='roadtv-replay';badge.textContent=labels[lang()].replay;
   area.appendChild(badge);
 }
 function playbackError(video,currentEpoch){
   if(currentEpoch!==epoch||key(video)!==key(active))return;
   failed.set(key(video),now());
   const alternative=nextVideo(key(video));
   if(alternative)start(alternative);
   else{
     clear();
     status(labels[lang()].error);
     // May be a newly started broadcaster already in a fresh catalog.
     refresh();
   }
 }
 async function start(video){
   if(!video||!safeHost.has(location.hostname))return;
   clear();active=video;activeCard=visible();lastVisible=activeCard;
   started=now();attemptingAt=started;const seq=epoch;
   const area=playbackArea(activeCard);
   if(video.platform==='youtube'){
     try{
       const YT=await youtubeApi();
       if(seq!==epoch)return;
       area.replaceChildren();
       const root=document.createElement('div');root.className='roadtv-player';
       area.appendChild(root);
       if(!video.live)makeReplayBadge(area);
       player=new YT.Player(root,{
         host:'https://www.youtube.com',width:'100%',height:'100%',
         videoId:video.video_id,
         playerVars:{autoplay:1,mute:1,playsinline:1,controls:1,rel:0,origin:location.origin,
           ...(video.live?{}:{start:Number(video.start_seconds||0)})},
         events:{
           onReady:e=>{if(seq!==epoch)return;
             try{e.target.mute();e.target.playVideo()}catch{}},
           onStateChange:e=>{
             if(seq!==epoch)return;
             if(e.data===1){playing=true;attemptingAt=0}
             if(e.data===0)playbackError(video,seq);
           },
           onAutoplayBlocked:()=>{attemptingAt=0;/* The native player play control remains available. */},
           onError:()=>playbackError(video,seq)
         }
       });
     }catch{playbackError(video,seq)}
   }else{
     area.replaceChildren();area.classList.add('is-twitch');
     const f=document.createElement('iframe');
     f.title='Road TV — Twitch';f.referrerPolicy='strict-origin-when-cross-origin';
     f.allow='autoplay; fullscreen; picture-in-picture';f.setAttribute('allowfullscreen','');
     f.src='https://player.twitch.tv/?channel='+encodeURIComponent(video.channel_login)
       +'&parent='+encodeURIComponent(location.hostname)+'&autoplay=true&muted=true';
     f.onload=()=>{if(seq===epoch){playing=true;attemptingAt=0}}; // loaded != scene verified
     f.onerror=()=>playbackError(video,seq);
     area.appendChild(f);
   }
 }
 async function refresh(){
   if(refreshing||!location.protocol.startsWith('http'))return;
   refreshing=true;
   try{
     const response=await fetch(liveSource+'?ts='+now(),{cache:'no-store'});
     if(!response.ok)throw Error('roadtv_manifest_unavailable');
     const json=await response.json();
     if(json.schema_version!==2)throw Error('roadtv_manifest_invalid');
     catalogAt=Date.parse(json.generated_at||'')||0;
     videos=candidates(json);
     const old=active&&key(active);
     // Keep playing only while the broadcast remains in the verified catalog.
     const matched=videos.find(v=>key(v)===old);
     if(old&&!matched){const target=nextVideo(old);if(target)start(target);else{clear();status(labels[lang()].empty)}}
     else if(!old){
       const target=nextVideo('');
       if(target)start(target);else status(labels[lang()].empty);
     }else if(!matched.live&&videos.some(x=>x.live)){
       // A real LIVE takes priority over a replay.
       const target=videos.find(x=>x.live&&!markedBad(x));if(target)start(target);
     }
   }catch{
     if(!active)status(labels[lang()].empty);
     if(catalogAt&&now()-catalogAt>25*60000){clear();videos=[];status(labels[lang()].empty)}
   }finally{refreshing=false}
 }
 function rotate(){
   const target=nextVideo(active&&key(active));
   if(target)start(target);
   else if(active&&now()-started>18*60000)refresh();
 }
 // Only a verified live or qualifying same-day replay may be used.
 // No hard-coded video ID, no dead Virtual Railfan train camera.
 cards.forEach(c=>playbackArea(c)?.replaceChildren());
 status(labels[lang()].waiting);
 loadCameraDirectory();
 document.getElementById('language')?.addEventListener('change',()=>{
   if(!active)status(labels[lang()].empty);
   else if(!active.live)cards.forEach(c=>{const b=c.querySelector('.roadtv-replay');if(b)b.textContent=labels[lang()].replay});
 });
 window.addEventListener('resize',()=>{
   const selected=visible();
   if(active&&selected!==lastVisible)start(active); // avoids off-screen video/duplicate audio
 });
 setInterval(()=>{
   if(active&&active.platform==='youtube'&&!playing&&attemptingAt&&now()-attemptingAt>35000){
     playbackError(active,epoch);return;
   }
   if(active&&now()-started>12*60000&&videos.length>1)rotate();
 },15000);
 setInterval(refresh,120000);
 if(document.visibilityState==='visible')refresh();
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh()});
})();
