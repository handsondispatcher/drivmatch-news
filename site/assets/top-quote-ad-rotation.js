/* Nine owner-supplied square ad models, 3 per top language, rotated every 4s.
 * Static 1:1 viewport in quotes strip. Entire creative clicks to WhatsApp;
 * the former SMS anchor stays inert for legacy DOM compatibility.
 */
(()=>{'use strict';
 const root=document.getElementById('top-quote-ad-slot');
 const art=document.getElementById('top-quote-ad-art');
 const img=document.getElementById('top-quote-ad-image');
 const sms=document.getElementById('top-quote-ad-sms');
 const whatsapp=document.getElementById('top-quote-ad-whatsapp');
 if(!root||!art||!img||!sms||!whatsapp)return;
 const models={
  pt:['pt-1.png','pt-2.png','pt-3.png'],
  en:['en-1.png','en-2.png','en-3.png'],
  es:['es-1.png','es-2.png','es-3.png']
 };
 const labels={
  pt:{alt:'Anuncie aqui · 908 291 3386 · SMS ou WhatsApp',sms:'Enviar mensagem de texto para anunciar no DrivMatch News',wa:'Anuncie pelo WhatsApp'},
  en:{alt:'Advertise here · 908 291 3386 · SMS or WhatsApp',sms:'Send a text message to advertise on DrivMatch News',wa:'Advertise through WhatsApp'},
  es:{alt:'Anúnciate aquí · 908 291 3386 · SMS o WhatsApp',sms:'Enviar mensaje de texto para anunciar en DrivMatch News',wa:'Anúnciate por WhatsApp'}
 };
 const msg={
  pt:'Olá! Vim pelo DrivMatch News e quero anunciar.',
  en:'Hello! I found your ad on DrivMatch News and would like to advertise.',
  es:'¡Hola! Vi su anuncio en DrivMatch News y quiero anunciarme.'
 };
 const locale=v=>String(v||'').toLowerCase().startsWith('en')?'en':String(v||'').toLowerCase().startsWith('es')?'es':'pt';
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 let language=locale(document.documentElement.lang);
 let model=0,timer=0,closeTimer=0,openTimer=0,hovered=false,focused=false,touchPaused=false,transitioning=false;
 const paused=()=>hovered||focused||touchPaused||document.hidden||Boolean(reduced?.matches);
 function src(){return 'assets/ads/top-square/'+models[language][model];}
 function render(){
   img.src=src();
   img.alt=labels[language].alt;
   root.dataset.model=String(model+1);root.dataset.activeLanguage=language;
   sms.removeAttribute('href');
   sms.setAttribute('aria-hidden','true');
   sms.tabIndex=-1;
   whatsapp.href='https://wa.me/19082913386?text='+encodeURIComponent(msg[language]);
   sms.setAttribute('aria-label',labels[language].sms);
   whatsapp.setAttribute('aria-label',labels[language].wa);
 }
 function change(next,animate){
   if(transitioning)return;
   if(!animate||reduced?.matches){model=next;render();return;}
   transitioning=true;
   art.classList.add('dm-quote-close');
   closeTimer=window.setTimeout(()=>{
     model=next;render();
     art.classList.remove('dm-quote-close');
     art.classList.add('dm-quote-open');
     openTimer=window.setTimeout(()=>{art.classList.remove('dm-quote-open');transitioning=false;},320);
   },220);
 }
 function advance(){if(!paused()&&!transitioning)change((model+1)%3,true);}
 function restart(){if(timer)clearInterval(timer);timer=window.setInterval(advance,4000);}
 function setLanguage(value){
   language=locale(value);clearTimeout(closeTimer);clearTimeout(openTimer);
   art.classList.remove('dm-quote-close','dm-quote-open');transitioning=false;model=0;render();restart();
 }
 root.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'||e.pointerType==='pen')hovered=true;});
 root.addEventListener('pointerleave',()=>{hovered=false;});
 root.addEventListener('focusin',()=>{focused=true;});
 root.addEventListener('focusout',e=>{if(!root.contains(e.relatedTarget))focused=false;});
 root.addEventListener('touchstart',()=>{touchPaused=true;},{passive:true});
 root.addEventListener('touchend',()=>{touchPaused=false;},{passive:true});
 document.addEventListener('drivmatch:language',e=>setLanguage(e.detail?.language));
 reduced?.addEventListener?.('change',()=>{});
 setLanguage(language);
})();
