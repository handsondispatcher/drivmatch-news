/* DrivMatch News v34.10: Video integrity and direct traffic camera rotation.
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
 // Camera source registry remains governed in the backend; publisher embed is distinct.
 const videoId=/^[A-Za-z0-9_-]{11}$/;
 const twitchLogin=/^[a-z0-9_]{3,25}$/;
 const labels={
  pt:{waiting:'Buscando transmissão disponível…',empty:'Nenhuma transmissão verificada agora.',replay:'GRAVADO',error:'Transmissão indisponível. Buscando outra…'},
  en:{waiting:'Checking available broadcasts…',empty:'No verified broadcast available right now.',replay:'RECORDED',error:'Broadcast unavailable. Looking for another…'},
  es:{waiting:'Buscando transmisión disponible…',empty:'No hay transmisiones verificadas en este momento.',replay:'GRABADO',error:'Transmisión no disponible. Buscando otra…'}
 };
 const lang=()=>labels[document.getElementById('language')?.value]?document.getElementById('language').value:'pt';
 let videos=[],active=null,activeCard=null,player=null,started=0,playing=false,attemptingAt=0;
 const track=(event,video,kind)=>window.DrivMatchAnalytics?.track?.(event,{
   video_platform:video?.platform||'camera',video_status:video?.live?'live':video?.status||'camera',
   player_kind:kind||video?.view_type||'road'
 });
 let catalogAt=0,refreshing=false,lastVisible=null,epoch=0,apiLoading=null;
 const failed=new Map();
 const now=()=>Date.now();
 const visible=()=>cards.find(c=>c.getBoundingClientRect().width>0&&getComputedStyle(c).display!=='none'&&c.getClientRects().length)||cards[0];
 const playbackArea=card=>card.querySelector('.roadtv-screen');
 const key=v=>v?.platform==='youtube'?'y:'+v.video_id:'t:'+v?.channel_login;
 // Owner's immutable programming hierarchy: driving POV LIVE > driving POV
 // recorded with verified original broadcast clock > live highway camera.
 const priority=v=>v.view_type==='cargo_cab'?(v.live?0:1):(v.live?2:3);
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
 // Direct source-player embeds offered explicitly by the publishers.
 // These are actual camera-player iframes, not miniature maps or still photos.
 // CamStreamer publishes the embed code; playback is still subject to provider uptime.
 const directCameras=[
{id:'ambassador-us-bound',name:'Ambassador Bridge · Windsor → Detroit, EUA',
   embed:'https://ambassador.solutionspal.com/cams/cam2.html',
   page:'https://www.ambassadorbridge.com/into-the-united-states/'},
  // Provider-published native iframe for a US interstate bridge — vehicles on a trucking route.
  // An iframe alone still cannot certify actual continuous motion.
  {id:'us-i74-bridge',name:'I-74 · Bettendorf, IA — tráfego interestadual',
   embed:'https://camstreamer.com/embed/oAXcPbxV4EmwG1z4IErIYVFUeJmjrQAyda99F4LS?rel=0',
   page:'https://camstreamer.com/live/stream/145163831'},
  {id:'fl-bridge-lions',name:'Bridge of Lions · St. Augustine, FL',
   embed:'https://camstreamer.com/embed/oEfmCvt05RxNKi3KsM8QLw5molD3ifp3ppWj6fJu?rel=0',
   page:'https://camstreamer.com/live/stream/110525310'},
  // Mid-Bay Bridge removed from playable lineup: provider reports unavailable recording.
  {id:'peace-canada',name:'Peace Bridge · direção Canadá',
   embed:'https://camstreamer.com/embed/7WIJom0FTmLGWRea1khwrohdqLpKwHOa2DU5Wjqq?rel=0',
   page:'https://camstreamer.com/live/stream/159142974-peace-bridge-canada-bound'},
  {id:'i35-waco',name:'I-35 · Waco, TX',embed:'https://camstreamer.com/embed/5F3i85dwyqAQrOFWrMENFpy9qWqFZT6rWt5RxhB8?rel=0',page:'https://camstreamer.com/live/stream/682515671-i-35-s-18th-street-waco'},
  {id:'i29-tea',name:'I-29 · Tea / Sioux Falls, SD',embed:'https://camstreamer.com/embed/TYmozgKiGvkVCfm4QAHMuc4DAqwQVypR0zfz7ln8?rel=0',page:'https://camstreamer.com/live/stream/696756350-digit-all-i-29-tea-exit-livestream'},
  {id:'oh741-lytle',name:'SR 741 · Springboro, OH',embed:'https://camstreamer.com/embed/fpjlgw9Y5Ht4rUi96v7cjpLDVYWavc7URaPyTWbZ?rel=0',page:'https://camstreamer.com/live/stream/721675885'},
  // Grand Avenue Bridge excluded: provider shows unavailable recording.
  {id:'paso-norte',name:'Paso del Norte · Ciudad Juárez / El Paso',embed:'https://camstreamer.com/embed/RmKKjLTyispBGGbIfFYnNMasTH45jhRs2Wo9Z1nZ?rel=0',page:'https://camstreamer.com/live/stream/101176577'},
  // Lock 19 excluded: provider reports stream offline.
  // Original bridge operator publishes this frame under its Into the United
  // States page. Do not claim continuous playback solely from iframe.onload.

 ];

 // Stable, unique camera identities. Owner policy is also stored in content/road-tv-policy.json.
 const cameraCatalog=directCameras.slice();
 const fallbackCameraOrder=['i35-waco','ambassador-us-bound','us-i74-bridge','fl-bridge-lions','peace-canada','i29-tea','oh741-lytle','paso-norte'];
 function applyCameraOrder(ids){
   const ordered=[...new Set(ids)].map(id=>cameraCatalog.find(c=>c.id===id)).filter(Boolean);
   ordered.push(...cameraCatalog.filter(c=>!ordered.some(x=>x.id===c.id)));
   directCameras.splice(0,directCameras.length,...ordered);
   const current=directCameras.findIndex(c=>c.id===selectedCameraId);
   publisherIndex=current>=0?current:0;
   tvRefresh();
 }
 let selectedCameraId=null;
 async function loadOwnerPolicy(){
   try{
     const response=await fetch('data/road-tv-policy.json?ts='+now(),{cache:'no-store'});
     if(!response.ok)return;
     const policy=await response.json();
     if(policy.schema_version===1&&Array.isArray(policy.camera_priority_ids))
       applyCameraOrder(policy.camera_priority_ids);
   }catch{}
 }
 const unavailableCamera=c=>cameraUnavailable.has(c.sourceId||c.id);
 let autoSwitch=true,userChannel=false,viewSize='small';
 let cameraUnavailable=new Set();
 const tvChannels=()=>[...videos.filter(v=>v.live&&v.view_type==='cargo_cab'&&!markedBad(v)).map(v=>({kind:'stream',ref:v,id:key(v),name:v.channel_name||v.title||'Transmissão ao vivo'})),...videos.filter(v=>v.live&&v.view_type!=='cargo_cab'&&!markedBad(v)).map(v=>({kind:'stream',ref:v,id:key(v),name:v.channel_name||v.title||'Transmissão ao vivo'})),...directCameras.filter(v=>!publisherFailures.has(v.id)&&!unavailableCamera(v)).map(v=>({kind:'camera',ref:v,id:v.id,name:v.name})),...videos.filter(v=>!v.live&&!markedBad(v)).map(v=>({kind:'stream',ref:v,id:key(v),name:v.channel_name||v.title||'Gravação'}))];
 const tvCurrent=()=>active?key(active):directCameras[publisherIndex]?.id;
 function tvRefresh(){
   cards.forEach(card=>{
     const bar=card.querySelector('.tv-controls');if(!bar)return;
     const channels=tvChannels(),idx=channels.findIndex(c=>c.id===tvCurrent());
     bar.querySelector('.tv-name').textContent='CH '+String(Math.max(0,idx)+1).padStart(2,'0')+'/'+channels.length+' · '+(channels[idx]?.name||'Câmera');
     const dots=bar.querySelector('.tv-dots');dots.replaceChildren();
     channels.forEach((c,i)=>{const b=document.createElement('button');b.type='button';b.title=c.name;b.setAttribute('aria-label',c.name);b.className=i===idx?'selected':'';b.onclick=()=>tvSelect(i);dots.appendChild(b)});
     bar.querySelector('.tv-auto input').checked=autoSwitch;
     card.classList.toggle('tv-medium',viewSize==='medium'&&card===visible());
     bar.querySelectorAll('[data-size]').forEach(b=>b.classList.toggle('selected',b.dataset.size===viewSize));
   });
 }
 function tvSelect(i){
   const c=tvChannels()[i];if(!c)return;
   userChannel=true;autoSwitch=false;
   saveCameraState();
   if(c.kind==='stream')start(c.ref);
   else{if(active)clear();publisherIndex=directCameras.findIndex(v=>v.id===c.id);showPublisherCamera(true)}
   tvRefresh();
 }
 function tvMove(d){
   const list=tvChannels();if(!list.length)return;
   const i=list.findIndex(v=>v.id===tvCurrent());tvSelect((i+d+list.length)%list.length);
 }
 async function tvSize(mode){
   if(mode==='full'){
     try{await visible().requestFullscreen();viewSize='full'}catch{viewSize='medium'}
   }else{
     if(document.fullscreenElement)await document.exitFullscreen().catch(()=>{});
     viewSize=mode;
   }
   tvRefresh();
 }
 document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&viewSize==='full')viewSize='small';tvRefresh()});
 function tvInstall(){
   const style=document.createElement('style');style.textContent='.roadtv-card{padding:7px!important;margin-bottom:10px!important}.roadtv-card h2{display:none!important}.tv-controls{font:600 11px Arial,sans-serif;color:#eff7ff;margin-top:3px}.tv-line,.tv-options{display:flex;align-items:center;gap:4px;min-width:0}.tv-line{min-height:26px}.tv-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:20px}.tv-controls button{color:#edf8ff;background:#173950;border:1px solid #43627a;border-radius:4px;padding:4px 6px;cursor:pointer;font:inherit;white-space:nowrap}.tv-controls button.selected{background:#1475b6}.tv-dots{display:flex;gap:3px;max-width:118px;overflow-x:auto;align-items:center}.tv-dots button{min-width:8px;width:8px;height:8px;padding:0;border-radius:50%;background:#6b8695;border:0;flex:none}.tv-dots button.selected{background:#30a7f8}.tv-options{margin-top:3px;flex-wrap:wrap;justify-content:space-between}.tv-sizes{display:flex;gap:2px}.tv-options button{font-size:10px;padding:4px 5px}.tv-auto{white-space:nowrap;display:flex;align-items:center;gap:3px;font-size:10px}.tv-auto input{margin:0;accent-color:#189cda}.roadtv-card.tv-medium{position:fixed!important;z-index:9999;left:50%;top:50%;transform:translate(-50%,-50%);width:min(92vw,780px);max-height:95dvh;box-sizing:border-box;box-shadow:0 0 0 100vmax rgba(0,0,0,.78)}.roadtv-card:fullscreen{background:#0b2337;padding:10px!important;display:flex;flex-direction:column;justify-content:center}.roadtv-card:fullscreen .roadtv-screen{min-height:0;max-height:calc(100dvh - 80px);flex:1}.roadtv-card:fullscreen .tv-controls{flex:none}@media(max-width:600px){.tv-controls{font-size:10px}.tv-dots{max-width:90px}.roadtv-card.tv-medium{width:96vw}}@media(orientation:landscape) and (max-height:500px){.roadtv-card:fullscreen .roadtv-screen{max-height:calc(100dvh - 65px)}}';document.head.appendChild(style);
   cards.forEach(card=>{
     const bar=document.createElement('div');bar.className='tv-controls';
     bar.innerHTML='<div class="tv-line"><button type="button" data-move="-1" aria-label="Canal anterior">‹ CH−</button><span class="tv-name"></span><span class="tv-dots"></span><button type="button" data-move="1" aria-label="Próximo canal">CH+ ›</button></div><div class="tv-options"><span class="tv-sizes"><button data-size="small">Pequena</button><button data-size="medium">Média</button><button data-size="full">⛶ Tela cheia</button></span><label class="tv-auto"><input type="checkbox" checked>Auto 10 min</label></div>';
     card.appendChild(bar);
     bar.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>tvMove(Number(b.dataset.move)));
     bar.querySelectorAll('[data-size]').forEach(b=>b.onclick=()=>tvSize(b.dataset.size));
     bar.querySelector('.tv-auto input').onchange=e=>{autoSwitch=e.target.checked;userChannel=!autoSwitch;publisherSince=now();started=now();saveCameraState();tvRefresh()};
   });
   tvRefresh();
 }

 const CAMERA_ROTATION_MS=10*60*1000; // Owner-approved 10-minute rotation of available publisher camera embeds.
 let publisherIndex=0,publisherFrame=null,publisherFailures=new Set(),publisherSince=0;
 // Save rotation position across soft reloads, so an automatic site refresh
 // never pins the first interstate camera indefinitely.
 try{
   const seen=JSON.parse(sessionStorage.getItem('dm-roadtv-cameras')||'{}');
   if(seen.camera_id){selectedCameraId=seen.camera_id;const stable=directCameras.findIndex(c=>c.id===seen.camera_id);if(stable>=0)publisherIndex=stable;}
   if(typeof seen.auto==='boolean'){autoSwitch=seen.auto;userChannel=!autoSwitch;}
   if(Number.isInteger(seen.index)&&seen.index>=0&&seen.index<directCameras.length){
     if(!seen.camera_id)publisherIndex=seen.index;
     if(Number.isFinite(seen.at)&&now()-seen.at>=CAMERA_ROTATION_MS)
       publisherIndex=(publisherIndex+1)%directCameras.length;
   }
 }catch{}
 function saveCameraState(){
   try{sessionStorage.setItem('dm-roadtv-cameras',JSON.stringify({index:publisherIndex,camera_id:selectedCameraId||directCameras[publisherIndex]?.id,auto:autoSwitch,at:now()}))}catch{}
 }

 function publisherUnavailable(area){
   area.replaceChildren();
   const notice=document.createElement('div');notice.className='roadtv-camera-unavailable';
   notice.textContent=lang()==='en'?'Camera temporarily unavailable. Open the official source.':
     lang()==='es'?'Cámara temporalmente no disponible. Abra la fuente.':
     'Câmera temporariamente indisponível. Abra a fonte.';
   const link=document.createElement('a');
   link.href='https://fl511.com/region/Central';link.target='_blank';
   link.rel='noopener noreferrer';link.textContent='FL511 ↗';
   notice.appendChild(link);area.appendChild(notice);
 }
 function showPublisherCamera(force=false){
   // A camera iframe can load without displaying moving video.
   // Track selection only; never emit a proven player_started event.
   track('roadtv_camera_selected',null,'external_iframe');
   if(active)return;
   const card=visible(),area=playbackArea(card);if(!area)return;
   if(!force&&area.querySelector('.roadtv-publisher-camera'))return;
   cards.forEach(c=>{if(c!==card)playbackArea(c)?.replaceChildren();});
   area.replaceChildren();publisherFrame=null;
   if(unavailableCamera(directCameras[publisherIndex]||{})){const idx=directCameras.findIndex(c=>!unavailableCamera(c)&&!publisherFailures.has(c.id));if(idx>=0)publisherIndex=idx;}
   const source=directCameras[publisherIndex];
   if(!source||unavailableCamera(source)||publisherFailures.size+cameraUnavailable.size>=directCameras.length){publisherUnavailable(area);return;}
   const frame=document.createElement('iframe');
   frame.className='roadtv-publisher-camera';
   frame.title=source.name+' — câmera rodoviária da fonte';
   frame.loading='eager';
   frame.referrerPolicy='strict-origin-when-cross-origin';
   frame.allow='autoplay; fullscreen; picture-in-picture';
   frame.setAttribute('allowfullscreen','');
   frame.src=source.embed;
   let loaded=false;
   const guard=setTimeout(()=>{
     if(!loaded&&publisherFrame===frame)failPublisher(source.id);
   },16000);
   frame.onload=()=>{loaded=true;clearTimeout(guard)};
   frame.onerror=()=>{clearTimeout(guard);failPublisher(source.id)};
   area.appendChild(frame);publisherFrame=frame;lastVisible=card;publisherSince=now();tvRefresh();
   selectedCameraId=source.id;
   saveCameraState();
   const caption=document.createElement('div');caption.className='roadtv-camera-credit';
   const name=document.createElement('span');name.textContent=source.name;
   const link=document.createElement('a');link.href=source.page;link.target='_blank';
   link.rel='noopener noreferrer';
   link.textContent=lang()==='en'?'Source ↗':lang()==='es'?'Fuente ↗':'Fonte ↗';
   caption.append(name,link);area.appendChild(caption);
 }
 function failPublisher(id){
   const card=visible(),area=playbackArea(card);
   publisherFailures.add(id);
   if(publisherFailures.size>=directCameras.length){if(area)publisherUnavailable(area);return;}
   for(let n=0;n<directCameras.length;n++){
     publisherIndex=(publisherIndex+1)%directCameras.length;
     if(!publisherFailures.has(directCameras[publisherIndex].id)&&!unavailableCamera(directCameras[publisherIndex]))break;
   }
   showPublisherCamera(true);tvRefresh();
 }
 function rotatePublisherCamera(){
   // A stalled cross-origin iframe can't be inspected for motion. Rotate among
   // distinct SOURCE PROVIDED camera players; don't repeat one all afternoon.
   if(active||!autoSwitch||!publisherSince||now()-publisherSince<CAMERA_ROTATION_MS)return;
   // The wall clock decides rotation, not the browser's tab-visibility state.
   // Failures are transient; allow retries on another cycle rather than pinning a
   // broken camera forever, but never mark a loaded iframe as certified live.
   if(publisherFailures.size>=directCameras.length){publisherFailures.clear();}
   const original=publisherIndex;
   for(let i=1;i<=directCameras.length;i++){
     const idx=(original+i)%directCameras.length;
     if(!publisherFailures.has(directCameras[idx].id)&&!unavailableCamera(directCameras[idx])){
       publisherIndex=idx;break;
     }
   }
   if(publisherIndex!==original)showPublisherCamera(true);
 }
 function status(message){
   // Only a platform-verified driver/road/border livestream supersedes this
   // independent publisher camera. A map is never used as a substitute for video.
   if(!active){showPublisherCamera();return;}
 }
 function clear(){
   epoch+=1;
   if(player?.destroy)try{player.destroy()}catch{}
   player=null;playing=false;active=null;activeCard=null;started=0;attemptingAt=0;
   publisherFrame=null;publisherSince=0;
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
     .sort((a,b)=>priority(a)-priority(b)||(Number(a.source_rank??99)-Number(b.source_rank??99))).slice(0,12);
 }
 function markedBad(v){return failed.has(key(v))&&now()-failed.get(key(v))<15*60000}
 function nextVideo(exclude){
   return videos.find(v=>v.live&&!markedBad(v)&&key(v)!==exclude)||null;
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
   track('roadtv_player_error',video,'youtube');
   if(currentEpoch!==epoch||key(video)!==key(active))return;
   failed.set(key(video),now());
   const alternative=nextVideo(key(video));
   if(alternative)start(alternative);
   else{
     clear();
     showPublisherCamera(true);
     // A newly started verified driver may return in the next manifest.
     refresh();
   }
 }
 async function start(video){
   if(!video||!safeHost.has(location.hostname))return;
   clear();active=video;activeCard=visible();lastVisible=activeCard;
   started=now();attemptingAt=started;const seq=epoch;tvRefresh();
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
             if(e.data===1){if(!playing)track('roadtv_player_started',video,'youtube');playing=true;attemptingAt=0}
             if(e.data===2){playing=false;track('roadtv_player_paused',video,'youtube')}
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
     videos=candidates(json);tvRefresh();
     const old=active&&key(active);
     // Keep playing only while the broadcast remains in the verified catalog.
     const matched=videos.find(v=>key(v)===old);
     if(old&&!matched){const target=nextVideo(old);if(target)start(target);else{clear();showPublisherCamera(true)}}
     else if(!old&&!userChannel){
       const target=nextVideo('');
       if(target)start(target);else if(!publisherFrame)showPublisherCamera(true);
     }else if(!userChannel&&matched&&videos.some(x=>x.live&&priority(x)<priority(matched)&&!markedBad(x))){
       // Switch only to a higher-ranked verified source, not a generic camera.
       const target=videos.find(x=>x.live&&priority(x)<priority(matched)&&!markedBad(x));if(target)start(target);
     }
   }catch{
     if(!active&&!publisherFrame)showPublisherCamera(true);
     if(catalogAt&&now()-catalogAt>25*60000){clear();videos=[];showPublisherCamera(true)}
   }finally{refreshing=false}
 }
 function rotate(){
   // Only rotate WITHIN the active priority tier. A live driver must never
   // be replaced by a lower-ranked generic highway camera just to rotate.
   const target=autoSwitch&&active&&videos.find(v=>priority(v)===priority(active)&&
     key(v)!==key(active)&&!markedBad(v));
   if(target)start(target);
   else if(active&&now()-started>18*60000)refresh();
 }
 // Only a verified live or qualifying same-day replay may be used.
 // No hard-coded video ID, no dead Virtual Railfan train camera.
 cards.forEach(c=>playbackArea(c)?.replaceChildren());
 // Health status comes from automated scheduled browser probes; unknown does not imply live.
 async function loadCameraHealth(){try{const response=await fetch('data/camera-health.json?ts='+now(),{cache:'no-store'});if(!response.ok)return;const j=await response.json();const checked=Date.parse(j.checked_at||'');if(!Number.isFinite(checked)||now()-checked>35*60000||now()-checked< -60000)return;cameraUnavailable=new Set((j.unavailable_ids||[]).filter(id=>directCameras.some(c=>(c.sourceId||c.id)===id)));if(cameraUnavailable.has(directCameras[publisherIndex]?.id)&&!active){const next=directCameras.findIndex(c=>!cameraUnavailable.has(c.id));if(next>=0){publisherIndex=next;showPublisherCamera(true)}}tvRefresh()}catch{}}
 // Compact viewer controls are provided by the channel-control enhancement.
 // Show a specific camera immediately; never require reader to navigate a map.
 tvInstall();applyCameraOrder(fallbackCameraOrder);
 Promise.allSettled([loadOwnerPolicy(),loadCameraHealth()]).finally(()=>showPublisherCamera());
 document.getElementById('language')?.addEventListener('change',()=>{
   if(!active){
     const label=visible().querySelector('.roadtv-camera-credit a');
     if(label)label.textContent=lang()==='en'?'Source ↗':lang()==='es'?'Fuente ↗':'Fonte ↗';
   }else if(!active.live)cards.forEach(c=>{const b=c.querySelector('.roadtv-replay');if(b)b.textContent=labels[lang()].replay});
 });
 window.addEventListener('resize',()=>{
   const selected=visible();
   if(active&&selected!==lastVisible)start(active); // avoids off-screen video/duplicate audio
   else if(!active&&selected!==lastVisible)showPublisherCamera(true);
 });
 setInterval(()=>{
   if(active&&active.platform==='youtube'&&!playing&&attemptingAt&&now()-attemptingAt>35000){
     playbackError(active,epoch);return;
   }
   // Ten-minute rotation applies to available verified streams within their tier;
   // driver POV broadcasts remain on screen longer unless they fail.
   if(autoSwitch&&active&&videos.length>1&&now()-started>=
       CAMERA_ROTATION_MS)rotate();
 },15000);
 // Browser-side heartbeat every 60 s: detect missing/detached frame, expired
 // camera time window and refresh publisher source. A third-party blank stream
 // may still be opaque to the browser: rotate preventively after ten minutes.
 setInterval(()=>{
   if(active)return;
   if(publisherFrame&&!publisherFrame.isConnected){
     publisherFailures.add(directCameras[publisherIndex].id);
     failPublisher(directCameras[publisherIndex].id);
     return;
   }
   if(!publisherFrame){showPublisherCamera(true);return}
   rotatePublisherCamera();
 },60000);
 setInterval(refresh,120000);
 setInterval(loadCameraHealth,120000);
 if(document.visibilityState==='visible')refresh();
 document.addEventListener('visibilitychange',()=>{
   if(document.visibilityState==='visible'){rotatePublisherCamera();refresh();}
 });
})();
