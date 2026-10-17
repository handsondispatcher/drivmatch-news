/* Gracie Barra Burlington — approved six originals; one language per card.
   Both calls-to-action are real links rather than buttons baked into art. */
(()=>{'use strict';
 const track=document.getElementById('dm-ad-rotation-track');if(!track)return;
 if(track.querySelector('[data-ad-campaign="gracie-barra"]'))return;
 const files={pt:'assets/ads/gracie-barra-pt-square.png',en:'assets/ads/gracie-barra-en-square.png',es:'assets/ads/gracie-barra-es-square.png'};
 const fallback={"en":"https://cdn.openart.ai/openart-uploads/production/attachment-transfers/0803b00bffc1e738fce27c62b37923feda1b54a8ca12612e53de415fe4e0c33f.png","pt":"https://cdn.openart.ai/openart-uploads/production/attachment-transfers/2c9470bbe89e5a64bea08d3c03cfe159ffa734919f450c10ec179422f11b5ecd.png","es":"https://cdn.openart.ai/openart-uploads/production/attachment-transfers/d34e1a10b1d8cd6c3c68346d95ccdd250f9a5bd8395721959e18e92e46c56f0d.png"};
 const texts={
  pt:{label:'PUBLICIDADE · GRACIE BARRA BURLINGTON',site:'Abrir site da Gracie Barra Burlington',maps:'Abrir no Google Maps: 207 Cambridge Street, Burlington, MA 01803',alt:'Gracie Barra Burlington: jiu-jítsu em breve. Crianças e adultos, todos os níveis. Matrículas de fundadores disponíveis.'},
  en:{label:'ADVERTISEMENT · GRACIE BARRA BURLINGTON',site:'Open Gracie Barra Burlington website',maps:'Open Google Maps: 207 Cambridge Street, Burlington, MA 01803',alt:'Gracie Barra Burlington: jiu-jitsu coming soon. Kids and adults, all skill levels, founding memberships.'},
  es:{label:'PUBLICIDAD · GRACIE BARRA BURLINGTON',site:'Abrir sitio de Gracie Barra Burlington',maps:'Abrir Google Maps: 207 Cambridge Street, Burlington, MA 01803',alt:'Gracie Barra Burlington: jiu-jitsu próximamente. Niños y adultos, todos los niveles y membresías de fundadores.'}
 };
 const normalize=v=>String(v||'').startsWith('en')?'en':String(v||'').startsWith('es')?'es':'pt';
 const item=document.createElement('div');
 item.className='dm-ad-rotation-item';item.dataset.adCampaign='gracie-barra';
 item.innerHTML='<section class="dm-gracie-square" aria-label="Publicidade Gracie Barra Burlington">'+
  '<div class="dm-gracie-square-label"></div><div class="dm-gracie-square-art">'+
  '<img class="dm-gracie-square-img" width="1254" height="1254" loading="lazy" decoding="async" alt="">'+
  '<a class="dm-gracie-square-site" href="https://graciebarraburlington.com/" target="_blank" rel="noopener noreferrer sponsored"></a>'+
  '<a class="dm-gracie-square-maps" href="https://www.google.com/maps/search/?api=1&query=207+Cambridge+Street+Burlington+MA+01803" target="_blank" rel="noopener noreferrer sponsored"></a>'+
  '</div></section>';
 track.appendChild(item);
 const image=item.querySelector('img'), label=item.querySelector('.dm-gracie-square-label');
 const site=item.querySelector('.dm-gracie-square-site'),maps=item.querySelector('.dm-gracie-square-maps');
 function update(value){
  const lang=normalize(value||document.documentElement.lang);
  label.textContent=texts[lang].label;
  site.setAttribute('aria-label',texts[lang].site);
  site.title=texts[lang].site;
  maps.setAttribute('aria-label',texts[lang].maps);
  maps.title=texts[lang].maps;
  image.alt=texts[lang].alt;
  image.onerror=()=>{image.onerror=null;image.src=fallback[lang];};
  image.src=files[lang];
  item.dataset.lang=lang;
 }
 document.addEventListener('drivmatch:language',e=>update(e.detail?.language));
 update(document.documentElement.lang);
})();