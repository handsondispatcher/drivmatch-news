/* DrivMatch News: distinct source-headline monitor, not automatic editorial approval. */
(()=>{'use strict';
const byId=id=>document.getElementById(id);
let entries=[],sourceHeadlines=[],sourceCheckedAt='';
const clean=s=>String(s||'').replace(/[\u0000-\u001f]/g,'').trim();
const headline=s=>clean(s).replace(/https?:\/\/\S+/gi,'').replace(/\s+-\s+[^-]{2,75}$/,'').replace(/\s*\[original\]\s*/gi,'').trim();
// Reader-access gate: never send visitors to a known geo-blocked publisher.
const blockedPublisher=url=>/^https:\/\/(?:[a-z0-9-]+\.)*thetrucker\.com(?:[\/:?#]|$)/i.test(String(url||''));
/* The crawler is a latest-headlines ticker, not the historical article archive.
   Fail closed when GitHub's scheduled source snapshot stops updating. */
const MAX_HEADLINE_AGE_MS=48*60*60*1000;
const MAX_SNAPSHOT_AGE_MS=30*60*1000;
const FUTURE_SKEW_MS=2*60*1000;
const fresh=(timestamp,limit)=>{
 const t=Date.parse(String(timestamp||'')),age=Date.now()-t;
 return Number.isFinite(t)&&age>=-FUTURE_SKEW_MS&&age<=limit;
};
function display(){
 const bar=byId('dm-news-crawler'),track=byId('dm-crawler-track');if(!bar||!track)return;
 const l=byId('language')?.value||'pt';
 const validStories=entries.filter(a=>a.status==='approved'&&!a.demo&&fresh(a.published_at,MAX_HEADLINE_AGE_MS)&&a.locales?.[l]?.title&&a.source_url?.startsWith('https://')&&!blockedPublisher(a.source_url)&&(l==='en'||a.locales[l].title!==a.locales?.en?.title));
 const links=[],seen=new Set(),seenTitles=new Set();
 const cleanTitle=t=>String(t||'').replace(/\s*(?:[-–—|])\s*(?:thetrucker(?:\.com)?|the trucker|freightwaves|transport topics|truck news|[\w-]+\.(?:com|net|org))\s*$/i,'').trim();
 const fingerprint=t=>cleanTitle(t).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 for(const a of sourceHeadlines){
   if(!fresh(sourceCheckedAt,MAX_SNAPSHOT_AGE_MS)||!fresh(a.published_at,MAX_HEADLINE_AGE_MS))continue;
   if(blockedPublisher(a.source_url)||a.geo_scope_verified!==true||a.origin_type==='aggregator-discovery'||/news\.google\.com/i.test(a.source_url||'')||!a.source_url?.startsWith('https://')||!a.title||seen.has(a.source_url))continue;
   // A valid recent source headline is not discarded just because its translation is pending.
   const title=cleanTitle(a.titles?.[l]||a.title);
   if(seenTitles.has(fingerprint(title)))continue;
   seenTitles.add(fingerprint(title));seen.add(a.source_url);
   const untranslated=!a.titles?.[l] ||
     (l!==(a.original_lang||'en') && clean(a.titles?.[l]).toLowerCase()===clean(a.title).toLowerCase());
   links.push({title,untranslated,source:a.source||'External source',url:a.source_url,external:true,region:a.region||'US',date:a.published_at||'',category:a.category||'Transporte'});
 }
 // Supplement with approved stories not already included in the source monitor.
 for(const a of validStories){
   if(seen.has(a.source_url)||seenTitles.has(fingerprint(a.locales[l].title)))continue;seen.add(a.source_url);seenTitles.add(fingerprint(a.locales[l].title));
   links.push({title:a.locales[l].title,source:a.source||'DrivMatch News',url:a.source_url,external:false,region:'US',date:a.published_at||'',category:a.category||'Transporte'});
 }
 if(!links.length){bar.hidden=true;return;}
 const els=links.slice(0,65).map(a=>{
   const link=document.createElement('a');link.className='dm-crawler-link';link.href=a.url;link.target='_blank';link.rel='noopener noreferrer';
   const k=document.createElement('span');k.className='dm-crawler-label';const categories={Clima:['CLIMA','WEATHER','CLIMA'],Rodovias:['RODOVIAS','ROADS','CARRETERAS'],Acidentes:['ACIDENTE','ACCIDENT','ACCIDENTE'],Combustíveis:['DIESEL E COMBUSTÍVEIS','DIESEL AND FUEL','DIÉSEL Y COMBUSTIBLES'],Tecnologia:['TECNOLOGIA E TRANSPORTE','TRANSPORT TECHNOLOGY','TECNOLOGÍA Y TRANSPORTE'],Imigração:['IMIGRAÇÃO','IMMIGRATION','INMIGRACIÓN'],Segurança:['SEGURANÇA','SAFETY','SEGURIDAD'],Energia:['ENERGIA','ENERGY','ENERGÍA'],Transporte:['TRANSPORTE','TRANSPORT','TRANSPORTE'],Fretes:['FRETES','FREIGHT','FLETES'],Negócios:['NEGÓCIOS','BUSINESS','NEGOCIOS'],Fiscalização:['FISCALIZAÇÃO','ENFORCEMENT','FISCALIZACIÓN'],Caminhoneiros:['CAMINHONEIROS','TRUCK DRIVERS','CAMIONEROS']};
   const category=categories[a.category]||[clean(a.category||'TRANSPORTE')];
   k.textContent=(category[['pt','en','es'].indexOf(l)]||category[0])+
     (a.untranslated?' · '+(l==='pt'?'ORIGINAL':l==='es'?'ORIGINAL':'ORIGINAL'):'');
   const t=document.createElement('span');t.textContent=headline(a.title);
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
       if(external.ok){const d=await external.json();if(Array.isArray(d.headlines)){sourceHeadlines=d.headlines;sourceCheckedAt=d.generated_at||'';}}
       display();
     }catch(e){display();}
   };
   await fetchFeed();setInterval(fetchFeed,60000);
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();