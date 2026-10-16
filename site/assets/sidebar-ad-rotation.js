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
 const mq=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 const labels={
  pt:{head:'PUBLICIDADE',pause:'Pausar',play:'Reproduzir',aria:'Anúncios em rotação vertical'},
  es:{head:'PUBLICIDAD',pause:'Pausar',play:'Reanudar',aria:'Anuncios en rotación vertical'},
  en:{head:'ADVERTISEMENT',pause:'Pause',play:'Resume',aria:'Vertical rotating advertisements'}
 };
 const locale=v=>String(v||'').startsWith('en')?'en':String(v||'').startsWith('es')?'es':'pt';
 let lang=locale(document.documentElement.lang), offset=0, prior=0;
 let userPaused=Boolean(mq?.matches), hovered=false, focused=false, touchPaused=false, visible=true, intersectionVisible=true;
 const speed=22; // CSS pixels per second: readable scroll, configurable by governance.
 const paused=()=>userPaused||hovered||focused||touchPaused||!visible||!intersectionVisible;
 function controls(){
  const copy=labels[lang];
  heading.textContent=copy.head;
  viewport.setAttribute('aria-label',copy.aria);
  button.textContent=userPaused?copy.play:copy.pause;
  button.setAttribute('aria-pressed',String(userPaused));
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
 viewport.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'||event.pointerType==='pen'){hovered=true;resetClock();}});
 viewport.addEventListener('pointerleave',()=>{hovered=false;resetClock();});
 viewport.addEventListener('focusin',()=>{focused=true;resetClock();});
 viewport.addEventListener('focusout',event=>{if(!viewport.contains(event.relatedTarget)){focused=false;resetClock();}});
 viewport.addEventListener('touchstart',()=>{touchPaused=true;userPaused=true;controls();resetClock();},{passive:true});
 document.addEventListener('visibilitychange',()=>{visible=!document.hidden;resetClock();});
 document.addEventListener('drivmatch:language',event=>{lang=locale(event.detail?.language);controls();});
 mq?.addEventListener?.('change',event=>{if(event.matches)userPaused=true;controls();resetClock();});
 if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{intersectionVisible=Boolean(entries[0]?.isIntersecting);resetClock();},{threshold:0});
  observer.observe(root);
 }
 controls();
 requestAnimationFrame(tick);
})();
