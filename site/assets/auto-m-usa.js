/* AUTO M USA — exact advertiser-supplied images, synced with the upper site language selector. */
(()=>{'use strict';
const artworks={"en":{"url":"https://cdn.openart.ai/openart-uploads/production/attachment-transfers/d768f613505254571a3491999b0f765b8745218fce79e7bd93ba6e00ad615ed5.png","filename":"assets/ads/auto-m-usa-en-original.png","description":"Your next car starts here."},"es":{"url":"https://cdn.openart.ai/openart-uploads/production/attachment-transfers/37907c30e22cded948606c26b781159e29c738d4861fe7d4b009517b03cae77f.png","filename":"assets/ads/auto-m-usa-es-original.png","description":"Tu próximo auto empieza aquí."},"pt":{"url":"https://cdn.openart.ai/openart-uploads/production/attachment-transfers/f36f5790c3be8b1f982c6e0bb65473c4f1896c2c66fbe572b75b2d0b2c10fb7d.png","filename":"assets/ads/auto-m-usa-pt-original.png","description":"Seu próximo carro começa aqui."}};
const captions={pt:'PUBLICIDADE · AUTO M USA',es:'PUBLICIDAD · AUTO M USA',en:'ADVERTISEMENT · AUTO M USA'};
function normalize(v){const x=String(v||'').toLowerCase();return x.startsWith('en')?'en':x.startsWith('es')?'es':'pt';}
function update(language){
 const img=document.getElementById('autom-usa-image');
 const label=document.getElementById('autom-usa-label');
 if(!img||!label)return;
 const locale=normalize(language||document.documentElement.lang),a=artworks[locale];
 label.textContent=captions[locale];
 img.alt='AUTO M USA · '+a.description+' 2040 E Irlo Bronson Memorial Hwy, Kissimmee, FL 34744 · +1 (407) 600-4737 · @autom.usa';
 // Verified self-hosted original is preferred. The same original CDN file is a fallback.
 img.onerror=()=>{
  img.onerror=null;
  img.src=a.url;
 };
 img.src=a.filename+'?v=20261016-approved-originals';
}
document.addEventListener('drivmatch:language',event=>update(event.detail?.language));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>update());
else update();
})();
