/* DrivMatch News — two fixed-width horizontal ad slots, synchronized every 5 s.
 * NO vertical carousel: each static viewport closes then opens the next advertiser.
 * Top: cars -> UCR -> AUTO M; bottom: UCR -> AUTO M -> cars.
 * Phase offset 1 prevents the same advertiser appearing in both slots.
 * Approved car and UCR markups come from the existing renderAds() implementation.
 */
(()=>{'use strict';
 const top=document.getElementById('news-commercial-banner');
 const bottom=document.getElementById('news-carhauler-banner');
 if(!top||!bottom)return;
 const order=['cars','ucr','auto'];
 const contact='https://wa.me/14076004737?text=Ol%C3%A1%21%20Vim%20pelo%20an%C3%BAncio%20da%20DrivMatch%20News.';
 const insta='https://www.instagram.com/autom.usa/';
 const mapsUrl='https://www.google.com/maps/search/?api=1&query=2040%20E%20Irlo%20Bronson%20Memorial%20Hwy%2C%20Kissimmee%2C%20FL%2034744';
 const mapsButtonCopy={
  pt:{text:'VER NO GOOGLE MAPS',aria:'Ver AUTO M USA no Google Maps, 2040 E Irlo Bronson Memorial Hwy, Kissimmee, FL 34744'},
  es:{text:'VER EN GOOGLE MAPS',aria:'Ver AUTO M USA en Google Maps, 2040 E Irlo Bronson Memorial Hwy, Kissimmee, FL 34744'},
  en:{text:'VIEW ON GOOGLE MAPS',aria:'View AUTO M USA on Google Maps, 2040 E Irlo Bronson Memorial Hwy, Kissimmee, FL 34744'}
 };
 const autoFiles={
   pt:'assets/ads/auto-m-usa-pt-wide-original.png',
   es:'assets/ads/auto-m-usa-es-wide-original.png',
   en:'assets/ads/auto-m-usa-en-wide-original.png'
 };
 const autoFallback={"pt":"https://cdn.openart.ai/openart-uploads/production/attachment-transfers/214e0067e9af6df5fb9ce1357ec0da3d005d0ae37eca4871e3b149ecdebf620f.png","es":"https://cdn.openart.ai/openart-uploads/production/attachment-transfers/3062cb8be74cf32f3edb50de3922bca9d8ef312efe610b4c15c5ada95d803606.png","en":"https://cdn.openart.ai/openart-uploads/production/attachment-transfers/af62b66f6bc7d55e3ae29d67a36b6a580ee1b1a8b0741bdfcef524e93fdb517d.png"};
 const autoCopy={pt:'Seu próximo carro começa aqui.',es:'Tu próximo auto empieza aquí.',en:'Your next car starts here.'};
 const normalize=value=>String(value||'').startsWith('en')?'en':String(value||'').startsWith('es')?'es':'pt';
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 let templates=null,phase=0,interval=null,moving=false,inside=false,keyboard=false,manualFreeze=Boolean(reduced?.matches);
 function creative(id,language){
   if(id!=='auto')return templates?.[id]||'';
   const locale=normalize(language);
   const file=autoFiles[locale],fallback=autoFallback[locale];
   return '<div class="dm-horizontal-auto-art">'+
    '<img class="dm-horizontal-auto-img" src="'+file+'" width="1774" height="394" loading="eager" decoding="async" data-fallback="'+fallback+'" alt="AUTO M USA. '+autoCopy[locale]+' Kissimmee, FL. +1 (407) 600-4737. @autom.usa" />'+
    // Live link visually replaces the printed address cell of the unchanged original PNG.
    '<a class="dm-horizontal-auto-maps" href="'+mapsUrl+'" target="_blank" rel="noopener noreferrer sponsored" aria-label="'+mapsButtonCopy[locale].aria+'" title="'+mapsButtonCopy[locale].aria+'">'+
      '<span class="dm-horizontal-auto-map-pin" aria-hidden="true">📍</span>'+
      '<span class="dm-horizontal-auto-map-copy"><strong>'+mapsButtonCopy[locale].text+'</strong><small>Kissimmee, FL · 2040 E Irlo Bronson Memorial Hwy</small></span>'+
    '</a>'+
    '<a class="dm-horizontal-auto-phone" href="'+contact+'" target="_blank" rel="noopener noreferrer sponsored" aria-label="AUTO M USA: WhatsApp +1 (407) 600-4737. Vim pelo anúncio da DrivMatch News."></a>'+
    '<a class="dm-horizontal-auto-instagram" href="'+insta+'" target="_blank" rel="noopener noreferrer sponsored" aria-label="Instagram AUTO M USA @autom.usa"></a>'+
    '</div>';
 }
 function setSlot(slot,campaign){
   const stage=slot.querySelector('.dm-horizontal-stage');
   if(!stage||!templates)return;
   stage.innerHTML=creative(campaign,document.documentElement.lang);
   slot.dataset.currentCampaign=campaign;
   const img=stage.querySelector('.dm-horizontal-auto-img');
   if(img)img.addEventListener('error',function(){if(this.dataset.fallback){this.src=this.dataset.fallback;delete this.dataset.fallback;}},{once:true});
 }
 function paint(animate){
   if(!templates)return;
   const pair=[order[phase],order[(phase+1)%3]];
   const slots=[top,bottom];
   slots.forEach((slot,i)=>{
     const stage=slot.querySelector('.dm-horizontal-stage');
     if(!stage)return;
     if(!animate||reduced?.matches){setSlot(slot,pair[i]);return;}
     stage.classList.remove('dm-horizontal-open');
     stage.classList.add('dm-horizontal-close');
     window.setTimeout(()=>{
       setSlot(slot,pair[i]);
       stage.classList.remove('dm-horizontal-close');
       stage.classList.add('dm-horizontal-open');
       window.setTimeout(()=>stage.classList.remove('dm-horizontal-open'),360);
     },260);
   });
   if(animate&&!reduced?.matches)window.setTimeout(()=>{moving=false;},680);
   else moving=false;
 }
 function advance(){
   if(!templates||moving||inside||keyboard||manualFreeze||document.hidden)return;
   moving=true;phase=(phase+1)%3;paint(true);
 }
 function capture(){
   // Only trust the approved advertiser markup just rendered by app.js, not
   // our own previous stage. Never clone duplicate IDs or replace link owners.
   const originalCars=top.querySelector(':scope > .car-official-ad');
   const originalUCR=bottom.querySelector(':scope > .ucr-ad');
   if(!originalCars||!originalUCR)return;
   templates={cars:originalCars.outerHTML,ucr:originalUCR.outerHTML};
   for(const slot of [top,bottom]){
     slot.hidden=false;
     slot.classList.add('dm-horizontal-slot');
     slot.replaceChildren();
     const stage=document.createElement('div');
     stage.className='dm-horizontal-stage';
     slot.appendChild(stage);
   }
   phase=0;moving=false;paint(false);
   if(interval)window.clearInterval(interval);
   interval=window.setInterval(advance,5000);
 }
 function isInsideEvent(event){return event.target===top||event.target===bottom||top.contains(event.target)||bottom.contains(event.target);}
 for(const slot of [top,bottom]){
  slot.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'||e.pointerType==='pen')inside=true;});
  slot.addEventListener('pointerleave',()=>{inside=false;});
  slot.addEventListener('focusin',()=>{keyboard=true;});
  slot.addEventListener('focusout',e=>{if(!top.contains(e.relatedTarget)&&!bottom.contains(e.relatedTarget))keyboard=false;});
  slot.addEventListener('touchstart',()=>{manualFreeze=true;},{passive:true});
 }
 document.addEventListener('drivmatch:horizontal-ads-rendered',capture);
 reduced?.addEventListener?.('change',e=>{manualFreeze=Boolean(e.matches);});
 // Install order: app.js registers DOMContentLoaded before this deferred file,
 // so schedule fallback only after app's initial render has completed.
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{if(!templates)capture();},50));
 else setTimeout(()=>{if(!templates)capture();},50);
})();
