/* DrivMatch News: distinct source-headline monitor, not automatic editorial approval. */
(()=>{'use strict';
const byId=id=>document.getElementById(id);
let entries=[],sourceHeadlines=[];
const clean=s=>String(s||'').replace(/[\u0000-\u001f]/g,'').trim();
function display(){
 const bar=byId('dm-news-crawler'),track=byId('dm-crawler-track');if(!bar||!track)return;
 const l=byId('language')?.value||'pt';
 const validStories=entries.filter(a=>a.status==='approved'&&!a.demo&&a.locales?.[l]?.title&&a.source_url?.startsWith('https://'));
 const links=[],seen=new Set();
 for(const a of sourceHeadlines){
   if(!a.source_url?.startsWith('https://')||!a.title||seen.has(a.source_url))continue;
   seen.add(a.source_url);
   links.push({title:a.title,source:a.source||'External source',url:a.source_url,external:true,region:a.region||'US',date:a.published_at||''});
 }
 // Supplement with approved stories not already included in the source monitor.
 for(const a of validStories){
   if(seen.has(a.source_url))continue;seen.add(a.source_url);
   links.push({title:a.locales[l].title,source:a.source||'DrivMatch News',url:a.source_url,external:false,region:'US',date:a.published_at||''});
 }
 if(!links.length){bar.hidden=true;return;}
 const els=links.slice(0,65).map(a=>{
   const link=document.createElement('a');link.className='dm-crawler-link';link.href=a.url;link.target='_blank';link.rel='noopener noreferrer';
   const k=document.createElement('span');k.className='dm-crawler-label';k.textContent=(a.external?'FONTE · ':'')+clean(a.region)+' · '+clean(a.source);
   const t=document.createElement('span');t.textContent=clean(a.title);
   link.append(k,t);return link;
 });
 track.replaceChildren(...els,...els.map(e=>e.cloneNode(true)));
 bar.hidden=false;track.style.animationDuration=Math.max(70,els.length*9)+'s';
}
async function setup(){
 entries=window.DRIVMATCH_BOOTSTRAP?.articles||[];
 display();
 byId('language')?.addEventListener('change',display);
 if(location.protocol.startsWith('http')){
   const fetchFeed=async()=>{
     try{
       const [editorial,external]=await Promise.all([
         fetch('data/content.json?ts='+Date.now(),{cache:'no-store'}),
         fetch('data/source-headlines.json?ts='+Date.now(),{cache:'no-store'})
       ]);
       if(editorial.ok){const d=await editorial.json();if(Array.isArray(d.articles))entries=d.articles;}
       if(external.ok){const d=await external.json();if(Array.isArray(d.headlines))sourceHeadlines=d.headlines;}
       display();
     }catch(e){display();}
   };
   await fetchFeed();setInterval(fetchFeed,60000);
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();