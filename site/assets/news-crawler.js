/* v31: headline crawler uses only already-approved articles. */
(()=>{'use strict';
const byId=id=>document.getElementById(id);
let entries=[];
function clean(s){return String(s||'').replace(/[\u0000-\u001f]/g,'').trim()}
function display(){
 const bar=byId('dm-news-crawler'),track=byId('dm-crawler-track');if(!bar||!track)return;
 const l=byId('language')?.value||'pt';
 const good=entries.filter(a=>a.status==='approved'&&!a.demo&&a.locales?.[l]?.title&&a.source_url?.startsWith('https://'));
 if(!good.length){bar.hidden=true;return;}
 const els=good.slice(0,15).map(a=>{
  const link=document.createElement('a');link.className='dm-crawler-link';link.href=a.source_url;link.target='_blank';link.rel='noopener noreferrer';
  const k=document.createElement('span');k.className='dm-crawler-label';k.textContent=clean(a.category)||'Notícias';
  const t=document.createElement('span');t.textContent=clean(a.locales[l].title);
  link.append(k,t);return link;
 });
 track.replaceChildren(...els,...els.map(e=>e.cloneNode(true)));
 bar.hidden=false;track.style.animationDuration=Math.max(35,els.length*9)+'s';
}
async function setup(){
 entries=window.DRIVMATCH_BOOTSTRAP?.articles||[];
 display();
 byId('language')?.addEventListener('change',display);
 if(location.protocol.startsWith('http')){
  const fetchFeed=async()=>{try{const r=await fetch('data/content.json?ts='+Date.now(),{cache:'no-store'});if(!r.ok)return;const d=await r.json();if(!Array.isArray(d.articles))return;entries=d.articles;display();}catch(_e){}};
  await fetchFeed();setInterval(fetchFeed,60000);
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();