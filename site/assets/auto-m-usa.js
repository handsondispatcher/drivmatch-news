/* AUTO M USA language switching, matching DrivMatch News pt/en/es. */
(()=>{'use strict';
const copy={pt:['PUBLICIDADE · AUTO M USA','Seu próximo carro começa aqui.'],en:['ADVERTISEMENT · AUTO M USA','Your next car starts here.'],es:['PUBLICIDAD · AUTO M USA','Tu próximo auto empieza aquí.']};
function pick(value){return String(value).startsWith('en')?'en':String(value).startsWith('es')?'es':'pt'}
function render(value){
 const lang=pick(value||document.documentElement.lang);
 const label=document.getElementById('autom-usa-label');
 if(!label)return;
 label.textContent=copy[lang][0];
 for(const shape of ['wide','square']){
  const img=document.getElementById('autom-usa-'+shape);
  img.src='assets/ads/auto-m-usa-'+lang+'-'+shape+'.svg';
  img.alt='AUTO M USA · '+copy[lang][1]+' Kissimmee, FL · 2040 E Irlo Bronson Memorial Hwy · +1 (407) 600-4737 · Instagram @autom.usa';
 }
}
document.addEventListener('drivmatch:language',e=>render(e.detail?.language));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>render());else render();
})();
