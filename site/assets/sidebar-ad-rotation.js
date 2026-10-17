/* DrivMatch News: single-source continuous, infinite upward ad rotation.
 * Move original live nodes (never clone advertisers or duplicate IDs).
 * Mouse hover, keyboard focus, touch, pause control, document visibility and
 * reduced-motion preference all suspend movement without losing the position.
 */
(()=>{
 'use strict';
 const root=document.getElementById('dm-ad-rotation');
 if(!root)return;
 const viewport=document.getElementById('dm-ad-rotation-viewport');
 const track=document.getElementById('dm-ad-rotation-track');
 const button=document.getElementById('dm-ad-rotation-toggle');
 const heading=document.getElementById('dm-ad-rotation-title');
 const status=document.getElementById('dm-ad-rotation-status');
 const mq=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 const mobileLayout=window.matchMedia?.('(max-width: 990px)');
 const labels={
  pt:{head:'PUBLICIDADE',pause:'Pausar',play:'Reproduzir',moving:'SUBINDO ↑',stopped:'PAUSADO',aria:'Anúncios em rotação vertical',all:'3 PATROCINADORES · VISÃO COMPLETA'},
  es:{head:'PUBLICIDAD',pause:'Pausar',play:'Reanudar',moving:'SUBIENDO ↑',stopped:'EN PAUSA',aria:'Anuncios en rotación vertical',all:'3 PATROCINADORES · VISTA COMPLETA'},
  en:{head:'ADVERTISEMENT',pause:'Pause',play:'Resume',moving:'MOVING UP ↑',stopped:'PAUSED',aria:'Vertical rotating advertisements',all:'THREE SPONSORS · FULL VIEW'}
 };
 const locale=v=>String(v||'').startsWith('en')?'en':String(v||'').startsWith('es')?'es':'pt';
 let lang=locale(document.documentElement.lang), offset=0, prior=0;
 let userPaused=Boolean(mq?.matches), hovered=false, focused=false, touchPaused=false, visible=true, intersectionVisible=true;
 const speed=56; // visibly moving ticker (px/s), interaction still pauses.
 const allSponsors=()=>Boolean(mobileLayout?.matches);
 const paused=()=>allSponsors()||userPaused||hovered||focused||touchPaused||!visible||!intersectionVisible;
 const canonicalOrder=['ucr-2027','driver-available','auto-m-usa'];
 function normalizeForMobile(){
  if(!allSponsors())return;
  for(const campaign of canonicalOrder){
   const item=Array.from(track.children).find(el=>el.dataset.adCampaign===campaign);
   if(item)track.appendChild(item); // Move, NEVER clone originals.
  }
  offset=0;track.style.transform='translate3d(0,0,0)';resetClock();
 }
 function controls(){
  const copy=labels[lang];
  const complete=allSponsors();
  root.dataset.displayMode=complete?'canonical-full-mobile':'desktop-infinite-rotation';
  button.hidden=complete;
  heading.textContent=copy.head;
  viewport.setAttribute('aria-label',copy.aria);
  button.textContent=userPaused?copy.play:copy.pause;
  button.setAttribute('aria-pressed',String(userPaused));
  const stopped=paused();
  if(status)status.textContent=complete?copy.all:(stopped?copy.stopped:copy.moving);
  root.dataset.rotationState=stopped?'paused':'moving';
 }
 function resetClock(){prior=0;}
 function tick(now){
  const delta=prior?Math.min(now-prior,60):0;
  prior=now;
  if(!paused()&&delta>0&&track.children.length>1){
   offset+=speed*delta/1000;
   const gap=parseFloat(getComputedStyle(track).rowGap)||0;
   // Recycling whole original cards gives seamless infinite flow and preserves links.
   for(let i=0;i<track.children.length;i++){
    const first=track.firstElementChild;
    if(!first)break;
    const distance=first.getBoundingClientRect().height+gap;
    if(!Number.isFinite(distance)||distance<=0.5)break;
    if(offset<distance)break;
    offset-=distance;
    track.appendChild(first);
   }
   track.style.transform='translate3d(0,'+(-offset).toFixed(3)+'px,0)';
  }
  requestAnimationFrame(tick);
 }
 button.addEventListener('click',()=>{userPaused=!userPaused;touchPaused=false;controls();resetClock();});
 viewport.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'||event.pointerType==='pen'){hovered=true;resetClock();controls();}});
 viewport.addEventListener('pointerleave',()=>{hovered=false;resetClock();controls();});
 viewport.addEventListener('focusin',()=>{focused=true;resetClock();controls();});
 viewport.addEventListener('focusout',event=>{if(!viewport.contains(event.relatedTarget)){focused=false;resetClock();controls();}});
 viewport.addEventListener('touchstart',()=>{touchPaused=true;userPaused=true;controls();resetClock();},{passive:true});
 document.addEventListener('visibilitychange',()=>{visible=!document.hidden;resetClock();controls();});
 document.addEventListener('drivmatch:language',event=>{lang=locale(event.detail?.language);controls();});
 function onResponsiveLayout(){
  normalizeForMobile();
  if(!allSponsors()){offset=0;track.style.transform='translate3d(0,0,0)';}
  resetClock();controls();
 }
 mobileLayout?.addEventListener?.('change',onResponsiveLayout);
 mq?.addEventListener?.('change',event=>{if(event.matches)userPaused=true;controls();resetClock();});
 if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{intersectionVisible=Boolean(entries[0]?.isIntersecting);resetClock();controls();},{threshold:0});
  observer.observe(root);
 }
 onResponsiveLayout();
 requestAnimationFrame(tick);
})();
