/* DrivMatch News • GitHub/Ricardo installation candidate • v18 visual baseline */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const source = window.DRIVMATCH_BOOTSTRAP || { articles: [], market: { indicators:{},stocks:{} }, ads:{ enabled:false }};
  let externalHeadlines = [], data = source, lang = 'pt', articleLang = 'pt', selected = 'Todas', page = 0, featurePage = 0, opened = null;
  const pageSize = 6, featureSize = 3;
  const CATS = ['Transporte','Combustíveis','Acidentes','Clima','Rodovias','Fiscalização','Tecnologia','Fretes','Empregos','Caminhões','Mecânica','Caminhoneiros','Socorro','Negócios','Governo','Imigração','Segurança'];
  const labels = {
    pt: { panorama:'Panorama do Transporte',news:'Notícias',market:'Mercado em Foco',all:'Todas',prev:'← Anterior',next:'Próximas →',search:'Pesquisar manchetes, temas ou fontes...',filters:'Todas as editorias',allDates:'Todo o arquivo',d2:'Hoje e ontem',d7:'Últimos 7 dias',d30:'Últimos 30 dias',articleTitle:'Ler em outro idioma',demo:'DEMONSTRAÇÃO',source:'Fonte original',unavailable:'—',disclaimerDemo:'Exemplo editorial para testar a interface. Não representa uma notícia real, frete ou vaga disponível.',published:'Publicado',updated:'Verificado',ad:'Publicidade',dataMissing:'Aguardando dados verificados. Sem cotações fictícias.',showing:'matéria(s)', noResults:'Nenhuma matéria encontrada.', archive:'Arquivo de demonstração'},
    en: { panorama:'Transportation Overview',news:'News',market:'Market Focus',all:'All',prev:'← Previous',next:'Next →',search:'Search headlines, topics or sources...',filters:'All sections',allDates:'Entire archive',d2:'Today and yesterday',d7:'Last 7 days',d30:'Last 30 days',articleTitle:'Read in another language',demo:'DEMONSTRATION',source:'Original source',unavailable:'—',disclaimerDemo:'Editorial demo to test the interface. It is not a real news report or available load/job.',published:'Published',updated:'Verified',ad:'Advertisement',dataMissing:'Waiting for verified data. No invented quotes.',showing:'story/stories',noResults:'No matching stories.', archive:'Demonstration archive'},
    es: { panorama:'Panorama del Transporte',news:'Noticias',market:'Mercado en Foco',all:'Todas',prev:'← Anterior',next:'Siguientes →',search:'Buscar titulares, temas o fuentes...',filters:'Todas las secciones',allDates:'Todo el archivo',d2:'Hoy y ayer',d7:'Últimos 7 días',d30:'Últimos 30 días',articleTitle:'Leer en otro idioma',demo:'DEMOSTRACIÓN',source:'Fuente original',unavailable:'—',disclaimerDemo:'Ejemplo editorial para probar la interfaz. No representa una noticia real ni una carga o empleo disponible.',published:'Publicado',updated:'Verificado',ad:'Publicidad',dataMissing:'A la espera de datos verificados. Sin cotizaciones inventadas.',showing:'noticia(s)',noResults:'No se encontraron noticias.', archive:'Archivo de demostración'}
  };
  const catLabels = {
    'Transporte':['Transporte','Transportation','Transporte'],'Combustíveis':['Combustíveis','Fuel','Combustibles'],'Acidentes':['Acidentes','Accidents','Accidentes'],'Clima':['Clima','Weather','Clima'],'Rodovias':['Rodovias','Highways','Carreteras'],'Fiscalização':['Fiscalização','Enforcement','Fiscalización'],'Tecnologia':['Tecnologia','Technology','Tecnología'],'Fretes':['Fretes','Freight','Cargas'],'Empregos':['Empregos','Jobs','Empleos'],'Caminhões':['Caminhões','Trucks','Camiones'],'Mecânica':['Mecânica','Mechanics','Mecánica'],'Caminhoneiros':['Caminhoneiros','Drivers','Camioneros'],'Socorro':['Socorro','Roadside Assistance','Auxilio'],'Negócios':['Negócios','Business','Negocios'],'Governo':['Governo','Government','Gobierno'],'Imigração':['Imigração','Immigration','Inmigración'],'Segurança':['Segurança','Security','Seguridad']
  };
  const langs=['pt','en','es'], indices={pt:0,en:1,es:2};
  const texts = {pt:'🇧🇷 Ler em Português',en:'🇺🇸 Read in English',es:'🇪🇸 Leer en Español'};
  const flags={pt:'assets/flag-br.svg',en:'assets/flag-us.svg',es:'assets/flag-es.svg'};
  const listed=[['JBHT','J.B. Hunt','Nasdaq'],['KNX','Knight-Swift','NYSE'],['SNDR','Schneider National','NYSE'],['WERN','Werner Enterprises','Nasdaq'],['ODFL','Old Dominion','Nasdaq'],['XPO','XPO','NYSE'],['LSTR','Landstar','Nasdaq'],['CHRW','C.H. Robinson','Nasdaq'],['FDX','FedEx','NYSE']];
  const indexSet=new Map();
  const escapeHTML = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeUrl = url => /^https:\/\//i.test(String(url||'')) ? String(url) : '';
  const localizedCategory=c=>catLabels[c]?.[indices[lang]]||c;
  function localeOf(article, chosen=lang){return article.locales?.[chosen] || article.locales?.[article.original_lang] || null}
  // Curated Unsplash licensed illustrations, never passed off as photographs of an incident.
  const topicPhotos={
    Clima:['photo-1534274988757-a28bf1a57c17','photo-1500530855697-b586d89ba3ee','photo-1534088568595-a066f410bcda'],
    Rodovias:['photo-1500534623283-312aade485b7','photo-1449965408869-eaa3f722e40d'],
    Acidentes:['photo-1449965408869-eaa3f722e40d'],
    Combustíveis:['photo-1519608487953-e999c86e7455'],
    Tecnologia:['photo-1518770660439-4636190af475'],
    Negócios:['photo-1486406146926-c627a92ad1ab'],
    Fretes:['photo-1494412519320-aa613dfb7738'],
    Transporte:['photo-1494412519320-aa613dfb7738'],
    Caminhões:['photo-1494412519320-aa613dfb7738'],
    Caminhoneiros:['photo-1494412519320-aa613dfb7738']
  };
  function imageOf(a){
    const supplied=safeUrl(a.image);if(supplied)return supplied;
    if(a.kind!=='external_link')return 'assets/fallback.svg';
    const choices=topicPhotos[a.category]||topicPhotos.Transporte;
    const seed=Array.from(String(a.source_url||a.title||'')).reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,0);
    return 'https://images.unsplash.com/'+choices[seed%choices.length]+'?auto=format&fit=crop&w=900&q=75';
  }
  function imageHTML(a, suffix=''){
    const illustrative=a.kind==='external_link'&&!safeUrl(a.image);
    const alt=illustrative?(lang==='pt'?'Foto ilustrativa, não é registro do evento':lang==='es'?'Fotografía ilustrativa, no representa el evento':'Illustrative photo, not a photograph of the event'):(a.image_alt||localeOf(a)?.title||'Imagem relacionada');
    return `<img loading="lazy" src="${escapeHTML(imageOf(a))}" alt="${escapeHTML(alt)}" title="${illustrative?'Imagem ilustrativa / Unsplash':''}" onerror="this.onerror=null;this.src='assets/fallback.svg'" ${suffix}>`;
  }
  function pageStories(){return [...(data.articles||[]),...externalHeadlines].filter(s=>(s.status==='approved' || (s.kind==='external_link' && s.status==='external_source')) && !s.demo && (s.kind==='external_link' || ['pt','en','es'].every(l=>s.locales?.[l]?.title && s.locales?.[l]?.body))).sort((a,b)=>{
    const score=x=> x.demo?0:(x.kind==='opportunity' && x.consent_publication && (Date.now()-new Date(x.published_at).getTime())<86400000 ? 3 : 1);
    return score(b)-score(a) || (Date.parse(b.published_at||'2000-01-01')-Date.parse(a.published_at||'2000-01-01'));
  });}
  function matches(a){
    const q=$('search').value.toLocaleLowerCase(lang).trim(), age=$('age').value;
    if(selected!=='Todas' && a.category!==selected)return false;
    if(age!=='all' && !a.demo && a.published_at){const ms=Date.now()-Date.parse(a.published_at);if(ms>Number(age)*86400000)return false;}
    const t=Object.values(a.locales).flatMap(v=>[v.title,v.summary,v.body]).join(' ') + ' '+a.category+' '+a.source;
    return !q||t.toLocaleLowerCase(lang).includes(q);
  }
  function articlesFiltered(){return pageStories().filter(matches)}
  function daysLabel(a){if(a.demo)return `<span class="demo-ribbon">${labels[lang].demo}</span>`;
    if(!a.published_at)return '';
    return `${labels[lang].published}: ${escapeHTML(new Date(a.published_at).toLocaleString(lang==='pt'?'pt-BR':lang==='es'?'es-US':'en-US',{dateStyle:'short',timeStyle:'short'}))}`;
  }
  function storyCard(a,i,featured=false){const txt=localeOf(a);const cat=escapeHTML(localizedCategory(a.category));
    if(a.kind==='external_link'){
      const title=escapeHTML(txt?.title||''), url=escapeHTML(safeUrl(a.source_url)||'#'), attribution=escapeHTML(a.source||'');
      const note=lang==='pt'?'Manchete da fonte · Abrir original ↗':lang==='es'?'Titular de la fuente · Abrir original ↗':'Source headline · Open original ↗';
      const body=`<div class="kicker">${cat} · ${escapeHTML(a.region||'')}</div><h3>${title}</h3><div class="byline">${daysLabel(a)} · ${attribution}</div><p>${note}</p>`;
      return featured?`<article class="story" tabindex="0" role="link" data-external-url="${url}">${imageHTML(a)}<div class="info">${body}</div></article>`:`<article class="item" tabindex="0" role="link" data-external-url="${url}"><div>${body}</div><div class="thumb">${imageHTML(a)}</div></article>`;
    }
    const kicker= a.kind==='opportunity' ? `${cat} · ${lang==='en'?'Opportunity':lang==='es'?'Oportunidad':'Oportunidade'}`:cat;
    if(featured)return `<article class="story" tabindex="0" role="button" data-story="${i}">${imageHTML(a)}<div class="info"><div class="kicker">${kicker}</div><h3>${escapeHTML(txt.title)}</h3><div class="byline">${daysLabel(a)} · ${escapeHTML(a.source||'')}</div></div></article>`;
    return `<article class="item" tabindex="0" role="button" data-story="${i}"><div><span class="tag">${cat}</span> ${a.kind==='opportunity'?'<span class="origin-pill">DrivMatch</span>':''}<h3>${escapeHTML(txt.title)}</h3><p>${escapeHTML(txt.summary||'')}</p><div class="byline">${daysLabel(a)} · ${escapeHTML(a.source||'')}</div></div><div class="thumb">${imageHTML(a)}<span class="label">${cat}</span></div></article>`;
  }
  function renderStories(){const f=articlesFiltered();const pages=Math.max(1,Math.ceil(f.length/pageSize));page=Math.min(page,pages-1);
    const all=pageStories(); indexSet.clear();all.forEach((a,i)=>indexSet.set(a.id,i));
    $('list').innerHTML=f.length?f.slice(page*pageSize,(page+1)*pageSize).map(a=>storyCard(a,indexSet.get(a.id))).join(''):`<div class="empty">${labels[lang].noResults}</div>`;
    $('count').textContent=`${f.length} ${labels[lang].showing}`;
    $('pagecount').textContent=`${page+1} / ${pages}`;
    $('prev').disabled=page===0; $('next').disabled=page===pages-1;
    const n=Math.max(1,Math.ceil(f.length/featureSize));featurePage=Math.min(featurePage,n-1);const pane=f.slice(featurePage*featureSize,(featurePage+1)*featureSize);
    $('features').innerHTML=pane.length?pane.map(a=>storyCard(a,indexSet.get(a.id),true)).join(''):`<div class="empty">${labels[lang].noResults}</div>`;
    $('featureCount').textContent=`${featurePage+1} / ${n}`;
    $('featurePrev').disabled=featurePage===0; $('featureNext').disabled=featurePage===n-1;
    $('featureDots').innerHTML=Array.from({length:n},(_,i)=>`<button type="button" class="carousel-dot ${i===featurePage?'active':''}" data-slide="${i}" aria-label="${i+1}"></button>`).join('');
  }
  function percentBadge(v){if(!Number.isFinite(v))return '';
    const cls=v>0?'market-up':v<0?'market-down':'market-flat';const arrow=v>0?'▲':v<0?'▼':'—';const n=(v>0?'+':'')+v.toLocaleString(lang==='pt'?'pt-BR':'en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
    return `<span class="${cls}">${arrow} ${n}%</span>`;
  }
  function marketValue(v,key){if(v==null||!Number.isFinite(Number(v.value)))return `<span class="market-flat">—</span>`;
    const age=Date.now()-Date.parse(v.observed_at);
    if(key==='usdbrl'&&(!Number.isFinite(age)||age< -30000||age>432000000))return '<span class="market-flat">—</span>';
    const status=key==='usdbrl'?(age>60000?'cotação com atraso':'snapshot do fornecedor'):(v.quote_status||'última observação disponível');
    const n=Number(v.value).toLocaleString(lang==='pt'?'pt-BR':'en-US',{minimumFractionDigits:2,maximumFractionDigits:key==='usdbrl'?4:3});
    return `<b>${key==='usdbrl'?'R$':key.startsWith('class8')?'unidades':'US$'} ${n}</b>${percentBadge(Number(v.change_pct))}<small class="market-asof">${escapeHTML(v.observed_at||'')} · ${escapeHTML(v.source||'')} · ${escapeHTML(status)}</small>`;}
  function mrow(name,ticker,v,key){return `<div class="sideitem"><div><strong>${escapeHTML(name)}</strong><small>${escapeHTML(ticker)}</small></div><div class="value">${marketValue(v,key)}</div></div>`;}
  function renderMarket(){const market=data.market||{}, inds=market.indicators||{}, stocks=market.stocks||{};
    let body=mrow(lang==='pt'?'Dólar comercial':'USD / BRL','USD/BRL',inds.usdbrl,'usdbrl')+
      mrow(lang==='en'?'US Diesel':lang==='es'?'Diésel en EE. UU.':'Diesel nos EUA','EIA · US$/gal',inds.diesel,'diesel')+
      mrow(lang==='en'?'Brent crude':lang==='es'?'Petróleo Brent':'Petróleo Brent','BRENT · US$/bbl',inds.brent,'brent');
    const ready=listed.filter(([sym])=>stocks[sym]&&Number.isFinite(Number(stocks[sym].value)));
    body+=mrow('Class 8 · pedidos líquidos','ACT / FTR · mensal',inds.class8_orders,'class8_orders');
    body+=mrow('Class 8 · vendas','ACT / FTR · mensal',inds.class8_sales,'class8_sales');
    body+=`<div class="sidegroup">${lang==='pt'?'Ações do setor':lang==='en'?'Transportation stocks':'Acciones del transporte'}</div>`+listed.map(([sym,name,exchange])=>mrow(name,`${sym} · ${exchange}`,stocks[sym],sym)).join('');
    $('market').innerHTML=body;
    $('market-note').textContent=(market.generated_at?`Verificado pelo sistema: ${market.generated_at}. `:'')+(ready.length?'':labels[lang].dataMissing);
  }
  function renderAds(){let ad=(data.ads?.enabled && data.ads.placements||[]).find(x=>x.enabled && x.slot==='below_panorama' && safeUrl(x.url));
    $('ad-slot').hidden=!ad;if(!ad)return;
    $('ad-slot').innerHTML=`<span class="ad-label">${labels[lang].ad}</span><a href="${escapeHTML(ad.url)}" target="_blank" rel="noopener noreferrer sponsored">${escapeHTML(ad.title||'')}</a><p>${escapeHTML(ad.text||'')}</p>`;
  }
  // This is the live GitHub Pages share host; custom-domain /news/share routing is not yet verified.
  const shareUrlOf = a => 'https://handsondispatcher.github.io/drivmatch-news/share/'+encodeURIComponent(a.id)+'/';
  function openSharedStory(){
    try {
      const id=new URLSearchParams(location.search).get('story');
      const story=id&&pageStories().find(a=>a.id===id);
      if(story){opened=story;articleLang=lang;renderArticle();$('article-dialog').scrollTop=0;}
    }catch(_){}
  }
  function renderArticle(){if(!opened)return;const txt=localeOf(opened,articleLang), cat=catLabels[opened.category]?.[indices[articleLang]]||opened.category;const al=labels[articleLang];
    $('modalimg').src=imageOf(opened);$('modalimg').alt=opened.image_alt||txt.title;$('modalkicker').textContent=cat+(opened.kind==='opportunity'?' · DrivMatch':'');
    $('modaltitle').textContent=txt.title;$('modalmeta').textContent=opened.demo?al.demo:opened.published_at?`${al.published}: ${opened.published_at}`:'';
    $('modalbodytext').textContent=txt.body||txt.summary;
    $('article-disclosure').textContent=opened.demo?al.disclaimerDemo:
      opened.kind==='opportunity'?'Oportunidade do ecossistema DrivMatch. Verifique requisitos e validade na publicação original.':'';
    const src=safeUrl(opened.source_url);
    const translatedSource=src?langs.map(l=>{
      const url='https://translate.google.com/translate?sl=auto&tl='+encodeURIComponent(l)+'&u='+encodeURIComponent(src);
      const label=l==='pt'?'Matéria completa em Português':l==='en'?'Full article in English':'Artículo completo en Español';
      return `<a class="article-source-button ${l==='pt'?'primary':''}" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer" hreflang="${l}"><img src="${flags[l]}" width="28" height="19" alt=""><span>${label} ↗</span></a>`;
    }).join(''):'';
    const fullHeading=lang==='en'?'Read the full report at the publisher':lang==='es'?'Leer el reportaje completo en la fuente':'LEIA A REPORTAGEM COMPLETA NA FONTE';
    const sourceOriginal=lang==='en'?'Original article without translation':lang==='es'?'Artículo original sin traducción':'Abrir fonte original sem tradução';
    $('article-source').innerHTML=src?`<div class="full-article-heading">${fullHeading}</div><div class="source-translations">${translatedSource}</div><a class="source-original" href="${escapeHTML(src)}" target="_blank" rel="noopener noreferrer">${sourceOriginal} ↗</a>`:escapeHTML(opened.source||'');
    const photoCredit=opened.image_source_url && safeUrl(opened.image_source_url)
      ? `<p class="image-credit">Foto ilustrativa: <a href="${escapeHTML(opened.image_source_url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(opened.image_credit||'Wikimedia Commons')}</a> · ${escapeHTML(opened.image_license||'Licença na fonte')}</p>`:'';
    $('article-source').innerHTML+=photoCredit;
    $('articleLanguageTitle').textContent=lang==='en'?'Article language':lang==='es'?'Idioma de la noticia':'Idioma da notícia';
    $('articleLanguageButtons').innerHTML=langs.filter(l=>opened.locales?.[l]).map(l=>`<button data-article-lang="${l}" type="button" aria-pressed="${l===articleLang}" class="${l===articleLang?'active':''}"><img src="${flags[l]}" width="17" height="12" alt=""> ${l==='pt'?'Português':l==='en'?'English':'Español'}</button>`).join('');
    $('translation').textContent=opened.demo?al.disclaimerDemo:'';
    $('share-feedback').textContent='';
    $('shade').classList.add('open');
  }
  function languageSet(next,rerender=true){if(!langs.includes(next))return;lang=next;document.documentElement.lang=next==='pt'?'pt-BR':next==='es'?'es-419':'en-US';
    $('language').value=next;$('languageFlag').src=flags[next];$('languageFlag').alt=next==='pt'?'Bandeira do Brasil':next==='en'?'US flag':'Bandera de España';
    $('share-label').textContent=next==='en'?'Share':next==='es'?'Compartir':'Compartilhar';
    $('share-section-title').textContent=next==='en'?'Share this story':next==='es'?'Comparte esta noticia':'Compartilhe esta notícia';
    $('share-copy').textContent=next==='en'?'Copy link':next==='es'?'Copiar enlace':'Copiar link';
    const trans=labels[next];document.querySelector('#panorama .heading').textContent=trans.panorama;document.querySelector('#noticias .heading').textContent=trans.news;
    document.querySelector('#market-title').textContent=trans.market;
    $('search').placeholder=trans.search;$('category').options[0].text=trans.filters;
    const ages=$('age').options;[trans.allDates,trans.d2,trans.d7,trans.d30].forEach((t,i)=>{if(ages[i])ages[i].text=t});
    $('featurePrev').textContent=$('prev').textContent=trans.prev;$('featureNext').textContent=$('next').textContent=trans.next;
    $('chips').innerHTML=['Todas',...CATS].map(c=>`<button class="chip ${selected===c?'active':''}" data-cat="${c}">${c==='Todas'?trans.all:escapeHTML(localizedCategory(c))}</button>`).join('');
    [...$('category').options].slice(1).forEach(o=>o.textContent=localizedCategory(o.value));
    if(rerender){renderStories();renderMarket();renderAds();if(opened)renderArticle();}
  }
  async function refreshNews(){
    try{
      const [editorial,external]=await Promise.all([
        fetch('data/content.json?ts='+Date.now(),{cache:'no-store'}),
        fetch('data/source-headlines.json?ts='+Date.now(),{cache:'no-store'})
      ]);
      if(editorial.ok){const next=await editorial.json();if(Array.isArray(next.articles))data={...data,...next};}
      if(external.ok){
        const next=await external.json();
        if(Array.isArray(next.headlines)){
          const approved=new Set((data.articles||[]).map(x=>x.source_url));
          const seen=new Set();
          externalHeadlines=next.headlines.filter(x=>x.title&&safeUrl(x.source_url)&&!approved.has(x.source_url)&&!seen.has(x.source_url)&&seen.add(x.source_url)).slice(0,90).map(x=>({
            id:'source-'+String(x.source_url).slice(-80),kind:'external_link',status:'external_source',demo:false,
            category:CATS.includes(x.category)?x.category:'Transporte',region:x.region||'US',source:x.source,
            source_url:x.source_url,published_at:x.published_at,original_lang:x.original_lang|| (x.region==='MX'?'es':'en'),image:x.image||'',
            locales:Object.fromEntries(langs.map(l=>[l,{title:x.title,summary:'',body:''}]))
          }));
        }
      }
      if(!opened)renderStories();
    }catch(e){/* Keep last successfully loaded issue when offline. */}
  }
  function install(){if(location.protocol.startsWith('http')){refreshNews();setInterval(refreshNews,60000);}CATS.forEach(c=>$('category').add(new Option(c,c)));
    $('edition-date').textContent=new Date().toLocaleDateString('pt-BR');
    // No public-facing development banner; sources remain in editorial metadata.
    $('language').addEventListener('change',e=>languageSet(e.target.value));
    $('search').addEventListener('input',()=>{page=featurePage=0;renderStories();});
    $('category').addEventListener('change',e=>{selected=e.target.value;page=featurePage=0;languageSet(lang);});
    $('age').addEventListener('change',()=>{page=featurePage=0;renderStories();});
    $('chips').addEventListener('click',e=>{const b=e.target.closest('[data-cat]');if(!b)return;selected=b.dataset.cat;$('category').value=selected;page=featurePage=0;languageSet(lang);});
    $('prev').addEventListener('click',()=>{page--;renderStories();$('noticias').scrollIntoView({behavior:'smooth'});});
    $('next').addEventListener('click',()=>{page++;renderStories();$('noticias').scrollIntoView({behavior:'smooth'});});
    $('featurePrev').addEventListener('click',()=>{featurePage--;renderStories();});
    $('featureNext').addEventListener('click',()=>{featurePage++;renderStories();});
    $('featureDots').addEventListener('click',e=>{const el=e.target.closest('[data-slide]');if(!el)return;featurePage=Number(el.dataset.slide);renderStories();});
    const clickArticle=e=>{const item=e.target.closest('[data-story]');if(item){opened=pageStories()[Number(item.dataset.story)];articleLang=lang;if(opened){renderArticle();$('article-dialog').scrollTop=0;}return;}const external=e.target.closest('[data-external-url]');if(external&&typeof window.open==='function')window.open(external.dataset.externalUrl,'_blank','noopener,noreferrer');};
    const shareText=()=>opened?((localeOf(opened,lang)?.title||'DrivMatch News')+' — DrivMatch News'):'DrivMatch News';
    $('share-native').addEventListener('click',async()=>{
      if(!opened)return;
      const title=shareText(),url=shareUrlOf(opened);
      if(typeof navigator!=='undefined' && typeof navigator.share==='function'){
        try{await navigator.share({title,url});return;}catch(e){if(e?.name==='AbortError')return;}
      }
      // Desktop and browsers without Web Share: always provide a working destination.
      const whatsapp='https://wa.me/?text='+encodeURIComponent(title+'\n'+url);
      if(typeof window.open==='function')window.open(whatsapp,'_blank','noopener,noreferrer');
      else $('share-feedback').textContent=url;
    });
    $('share-copy').addEventListener('click',async()=>{
      if(!opened)return;
      const url=shareUrlOf(opened);
      try{
        if(typeof navigator!=='undefined' && navigator.clipboard?.writeText){
          await navigator.clipboard.writeText(url);
        }else{
          const helper=document.createElement('textarea');
          helper.value=url;helper.setAttribute('readonly','');helper.style.position='fixed';helper.style.opacity='0';
          document.body.appendChild(helper);helper.select();
          const copied=document.execCommand('copy');helper.remove();
          if(!copied)throw Error('clipboard unavailable');
        }
        $('share-feedback').textContent=lang==='en'?'Link copied!':lang==='es'?'¡Enlace copiado!':'Link copiado!';
      }catch(_){$('share-feedback').textContent=(lang==='en'?'Copy the link: ':lang==='es'?'Copia el enlace: ':'Copie o link: ')+url;}
    });
    $('list').addEventListener('click',clickArticle);$('features').addEventListener('click',clickArticle);
    const keyArticle=e=>{if(e.key==='Enter'||e.key===' '){const item=e.target.closest('[data-story]');if(item){e.preventDefault();clickArticle({target:item});}}};
    $('list').addEventListener('keydown',keyArticle);$('features').addEventListener('keydown',keyArticle);
    $('articleLanguageButtons').addEventListener('click',e=>{const b=e.target.closest('[data-article-lang]');if(!b)return;articleLang=b.dataset.articleLang;renderArticle();});
    $('shade').addEventListener('click',e=>{if(e.target===$('shade'))closeModal();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
    // v18 uses onclick="closeModal()" on dialog close button.
    const closeModal=()=>{$('shade').classList.remove('open');opened=null;};window.closeModal=closeModal;
    window.translateTo=l=>{articleLang=l;renderArticle();};
    languageSet('pt');
    openSharedStory();
    // Optional credential-free public proxy; provider secrets never enter the browser.
    if(location.protocol.startsWith('http')) {
      fetch('data/runtime.json',{cache:'no-store'}).then(r=>r.json()).then(config=>{
        if(!safeUrl(config.spot_url))return;
        const refreshSpot=async()=>{
          try {
            const res=await fetch(config.spot_url,{cache:'no-store'});if(!res.ok)return;
            const q=await res.json();const age=Date.now()-Date.parse(q.observed_at);
            if(q.symbol!=='USD/BRL'||q.instrument!=='spot'||q.price_type!=='commercial'||
              !Number.isFinite(q.value)||q.value<=0||!Number.isFinite(age)||age< -30000||age>432000000||!q.source||!safeUrl(q.source_url))return;
            data.market.indicators.usdbrl=q;renderMarket();
          }catch(e){console.warn('Spot snapshot unavailable');}
        };
        refreshSpot();setInterval(refreshSpot,15000);
      }).catch(()=>{});
    }
    // refreshNews() is the single coordinated poll for editorial and external source data.
  }
  document.addEventListener('DOMContentLoaded',install);
})();
