/* DrivMatch News v34.11 — Road TV after Ventusky; mobile market follows TV; earlier baselines preserved. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const source = window.DRIVMATCH_BOOTSTRAP || { articles: [], market: { indicators:{},stocks:{} }, ads:{ enabled:false }};
  let externalHeadlines = [], photoByStory = {}, data = source, lang = 'pt', articleLang = 'pt', selected = 'Todas', page = 0, featurePage = 0, opened = null;
  let sourceCheckedAt=source.source_monitor?.checked_at||'', newestSourceAt=source.source_monitor?.latest_original_published_at||'', currentSourceCount=(source.articles||[]).filter(x=>x.kind==='external_link').length;
  const pageSize = 6, featureSize = 4;
  const CATS = ['Transporte','Combustíveis','Acidentes','Clima','Rodovias','Fiscalização','Tecnologia','Fretes','Empregos','Caminhões','Mecânica','Caminhoneiros','Socorro','Negócios','Governo','Imigração','Segurança'];
  const labels = {
    pt: { panorama:'Panorama do Transporte',news:'Notícias',market:'Cotações e Mercado',all:'Todas',prev:'← Anterior',next:'Próximas →',search:'Pesquisar manchetes, temas ou fontes...',filters:'Todas as editorias',allDates:'Todo o arquivo',d2:'Hoje e ontem',d7:'Últimos 7 dias',d30:'Últimos 30 dias',articleTitle:'Ler em outro idioma',demo:'DEMONSTRAÇÃO',source:'Fonte original',unavailable:'—',disclaimerDemo:'Exemplo editorial para testar a interface. Não representa uma notícia real, frete ou vaga disponível.',published:'Publicado',updated:'Verificado',ad:'Publicidade',dataMissing:'Aguardando dados verificados. Sem cotações fictícias.',showing:'matéria(s)', noResults:'Nenhuma matéria encontrada.', archive:'Arquivo de demonstração'},
    en: { panorama:'Transportation Overview',news:'News',market:'Quotes & Markets',all:'All',prev:'← Previous',next:'Next →',search:'Search headlines, topics or sources...',filters:'All sections',allDates:'Entire archive',d2:'Today and yesterday',d7:'Last 7 days',d30:'Last 30 days',articleTitle:'Read in another language',demo:'DEMONSTRATION',source:'Original source',unavailable:'—',disclaimerDemo:'Editorial demo to test the interface. It is not a real news report or available load/job.',published:'Published',updated:'Verified',ad:'Advertisement',dataMissing:'Waiting for verified data. No invented quotes.',showing:'story/stories',noResults:'No matching stories.', archive:'Demonstration archive'},
    es: { panorama:'Panorama del Transporte',news:'Noticias',market:'Cotizaciones y Mercado',all:'Todas',prev:'← Anterior',next:'Siguientes →',search:'Buscar titulares, temas o fuentes...',filters:'Todas las secciones',allDates:'Todo el archivo',d2:'Hoy y ayer',d7:'Últimos 7 días',d30:'Últimos 30 días',articleTitle:'Leer en otro idioma',demo:'DEMOSTRACIÓN',source:'Fuente original',unavailable:'—',disclaimerDemo:'Ejemplo editorial para probar la interfaz. No representa una noticia real ni una carga o empleo disponible.',published:'Publicado',updated:'Verificado',ad:'Publicidad',dataMissing:'A la espera de datos verificados. Sin cotizaciones inventadas.',showing:'noticia(s)',noResults:'No se encontraron noticias.', archive:'Archivo de demostración'}
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
  const blockedPublisher=url=>/^https:\/\/(?:[a-z0-9-]+\.)*thetrucker\.com(?:[\/:?#]|$)/i.test(String(url||''));
  // A separate build fetches licensed archive photographs, verifies JPEGs and hosts
  // them locally; browser never scrapes or hotlinks third-party publisher artwork.
  const safeNewsPhotoUrl=url=>/^assets\/news-photos\/[a-z0-9-]+\.jpg$/.test(String(url||''))?String(url):'';
  const licensedPhotoOf=a=>{
    const image=photoByStory[a.id];
    return image&&safeNewsPhotoUrl(image.image)&&safeUrl(image.image_source_url)&&image.image_credit&&image.image_license?image:null;
  };
  const localizedCategory=c=>catLabels[c]?.[indices[lang]]||c;
  function localeOf(article, chosen=lang){return article.locales?.[chosen] || article.locales?.[article.original_lang] || null}
  // Editorial image gate: no two distinct stories may reuse the same photograph.
  // Exhausted/unavailable images get a UNIQUE story-specific illustrated card.
  // Only licensed, credited, story-specific photography; no generic stock repetition.
  function storyGraphic(a){
    const title=cleanHeadline(localeOf(a)?.title||'NOTÍCIAS DO TRANSPORTE');
    const seed=[...String(a.id||a.source_url||title)].reduce((v,c)=>(v*33+c.charCodeAt(0))>>>0,5381);
    const hue=195+(seed%27);
    const esc=t=>String(t||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
    const words=title.split(/\s+/),lines=[];let line='';
    for(const word of words){if((line+' '+word).length>30&&line){lines.push(line);line=word;}else line=(line?line+' ':'')+word;if(lines.length>=3)break;}
    if(lines.length<3&&line)lines.push(line);
    const text=lines.slice(0,3).map((t,i)=>'<text x="45" y="'+(265+i*60)+'" font-family="Georgia,serif" font-size="41" font-weight="bold" fill="#fff">'+esc(t)+'</text>').join('');
    const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 520"><rect width="900" height="520" fill="hsl('+hue+',65%,20%)"/><path d="M0 490L900 180M0 510L900 230" stroke="#65c4f5" stroke-width="7" opacity=".2"/><path d="M670 370h130v-60h-35l-35-50h-60v110h-90v-140h90" stroke="#c9efff" stroke-width="12" fill="none"/><circle cx="625" cy="380" r="22" fill="#c9efff"/><circle cx="765" cy="380" r="22" fill="#c9efff"/><rect x="45" y="40" width="170" height="6" fill="#39baff"/><text x="45" y="92" font-family="Arial,sans-serif" font-weight="bold" font-size="23" fill="#a2ddff">DRIVMATCH NEWS</text>'+text+'<text x="45" y="490" font-family="Arial,sans-serif" font-size="17" fill="#d4eaff">ILUSTRAÇÃO EDITORIAL · '+esc(a.category||'TRANSPORTE')+'</text></svg>';
    return 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg);
  }
  let visualCacheKey='',visualCache=new Map();
  function storyVisuals(){
    const stories=pageStories(),key=stories.map(a=>(a.id||a.source_url)+'|'+(licensedPhotoOf(a)?.image||a.image||'')).join('~');
    if(key===visualCacheKey)return visualCache;
    const used=new Set(),map=new Map();
    for(const a of stories){
      const cached=licensedPhotoOf(a);
      const credited=a.kind!=='external_link'&&a.image_license&&a.image_credit;
      const supplied=cached?safeNewsPhotoUrl(cached.image):(credited?safeUrl(a.image):'');
      const unique=supplied&&!used.has(supplied)?supplied:'';
      if(unique)used.add(unique);
      map.set(a.id,unique||storyGraphic(a));
    }
    visualCacheKey=key;visualCache=map;return map;
  }
  function imageOf(a){return storyVisuals().get(a.id)||storyGraphic(a);}
  function imageHTML(a,suffix=''){
    const url=imageOf(a),fallback=storyGraphic(a),graphic=url.startsWith('data:image/svg');
    const photo=licensedPhotoOf(a),illustrative=Boolean(photo)||graphic||a.image_context==='illustrative_archive';
    const alt=graphic?(lang==='pt'?'Ilustração editorial desta manchete':'Editorial illustration'):
      illustrative?(lang==='pt'?'Fotografia de arquivo ilustrativa; não retrata necessariamente o acontecimento':lang==='es'?'Fotografía de archivo ilustrativa; no representa necesariamente el acontecimiento':'Illustrative archive photograph; not necessarily the reported event'):(a.image_alt||localeOf(a)?.title||'Imagem');
    return '<img loading="lazy" decoding="async" src="'+escapeHTML(url)+'" data-fallback="'+escapeHTML(fallback)+'" alt="'+escapeHTML(alt)+'" title="'+(illustrative?'Foto ilustrativa de arquivo':'Imagem licenciada')+'" onerror="this.onerror=null;this.src=this.dataset.fallback" '+suffix+'>';
  }
  function pageStories(){return [...(data.articles||[]),...externalHeadlines].filter(s=>(s.status==='approved' || (s.kind==='external_link' && s.status==='external_source')) && !s.demo && !blockedPublisher(s.source_url) && (s.kind==='external_link' || ['pt','en','es'].every(l=>s.locales?.[l]?.title && s.locales?.[l]?.body))).sort((a,b)=>{
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
  function articlesFiltered(){
    const pool=pageStories().filter(a=>matches(a)); // Original-language headlines remain readable when optional translation is unavailable.
    // Editorial sequencing: keep recency while avoiding consecutive stories about the same event.
    const result=[],remaining=pool.slice();
    const topicKey=a=>{
      const t=(a.locales?.en?.title||a.locales?.pt?.title||'').toLowerCase();
      if(/isaias|hurricane|furac[aã]o/.test(t))return 'isaias';
      if(/iran|diesel price|pre[cç]o.*diesel/.test(t))return 'diesel-prices';
      return a.category+':'+t.split(/\\W+/).filter(w=>w.length>4).slice(0,3).join('-');
    };
    while(remaining.length){
      const previous=result.slice(-2).map(topicKey);
      const idx=remaining.findIndex(a=>!previous.includes(topicKey(a)));
      result.push(remaining.splice(idx<0?0:idx,1)[0]);
    }
    return result;
  }
  function daysLabel(a){if(a.demo)return `<span class="demo-ribbon">${labels[lang].demo}</span>`;
    if(!a.published_at)return '';
    return `${labels[lang].published}: ${escapeHTML(new Date(a.published_at).toLocaleString(lang==='pt'?'pt-BR':lang==='es'?'es-US':'en-US',{dateStyle:'short',timeStyle:'short'}))}`;
  }
  // Publisher names are metadata, not part of editorial headlines.
  function cleanHeadline(title){
    return String(title||'').replace(/\s*(?:[-–—|])\s*(?:thetrucker(?:\.com)?|the trucker|freightwaves|transport topics|truck news|trucknews(?:\.com)?|land line|overdrive(?:online)?|fleetowner|cdllife|[\w-]+\.(?:com|net|org))\s*$/i,'').trim();
  }
  function eventFingerprint(title){
    return cleanHeadline(title).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  }
  function duplicateEvent(a,b){
    const x=eventFingerprint(a),y=eventFingerprint(b);
    if(!x||!y)return false;
    if(x===y)return true;
    const one=new Set(x.split(' ')),two=new Set(y.split(' '));
    if(Math.min(one.size,two.size)<6)return false;
    const overlap=[...one].filter(t=>two.has(t)).length;
    return overlap/Math.max(1,one.size+two.size-overlap)>=.84;
  }
  function storyCard(a,i,featured=false,showContext=false){const txt=localeOf(a);const cat=escapeHTML(localizedCategory(a.category));
    if(a.kind==='external_link'){
      const title=escapeHTML(cleanHeadline(txt?.title||'')), url=escapeHTML(safeUrl(a.source_url)||'#'), attribution=escapeHTML(a.source||'');
      const translated=a.translated_langs?.includes(lang);const languageNotice=translated?'':(lang==='pt'?' · Título original em '+(a.original_lang==='es'?'espanhol':'inglês'):lang==='es'?' · Titular original en '+(a.original_lang==='es'?'español':'inglés'):' · Original-language headline');
      const official=a.editorial_type==='operational_bulletin';
      const officialMark=official?(lang==='pt'?' · BOLETIM OFICIAL':lang==='es'?' · BOLETÍN OFICIAL':' · OFFICIAL BULLETIN'):'';
      const note=official
        ?(lang==='pt'?'Alerta meteorológico do NWS; verifique restrições de estrada no DOT/511.':
          lang==='es'?'Alerta meteorológica del NWS; verifique restricciones viales en DOT/511.':
          'NWS weather bulletin; verify actual road restrictions with DOT/511.')
        :(lang==='pt'?'Leia o contexto no DrivMatch News':lang==='es'?'Lee el contexto en DrivMatch News':'Read the context on DrivMatch News');
      const translationNote=languageNotice?`<small class="editorial-context-translation">${escapeHTML(languageNotice.trim())}</small>`:'';
      const body=`<div class="kicker">${cat}${officialMark}</div><h3>${title}</h3><div class="byline">${daysLabel(a)} · ${attribution}</div>${showContext?`<p class="editorial-context">${escapeHTML(note)}</p>`:""}${translationNote}`;
      return featured?`<article class="story ${imageOf(a).startsWith('data:image/svg')?'illustrated':''}" tabindex="0" role="button" data-external="true" data-story="${i}">${imageHTML(a)}<div class="info">${body}</div></article>`:`<article class="item" tabindex="0" role="button" data-external="true" data-story="${i}"><div>${body}</div><div class="thumb">${imageHTML(a)}</div></article>`;
    }
    const kicker= a.kind==='opportunity' ? `${cat} · ${lang==='en'?'Opportunity':lang==='es'?'Oportunidad':'Oportunidade'}`:cat;
    if(featured)return `<article class="story ${imageOf(a).startsWith('data:image/svg')?'illustrated':''}" tabindex="0" role="button" data-external="false" data-story="${i}">${imageHTML(a)}<div class="info"><div class="kicker">${kicker}</div><h3>${escapeHTML(txt.title)}</h3><p class="feature-summary">${escapeHTML(txt.summary||'')}</p><div class="byline">${daysLabel(a)} · ${escapeHTML(a.source||'')}</div></div></article>`;
    return `<article class="item" tabindex="0" role="button" data-external="false" data-story="${i}"><div><span class="tag">${cat}</span> ${a.kind==='opportunity'?'<span class="origin-pill">DrivMatch</span>':''}<h3>${escapeHTML(txt.title)}</h3><p>${escapeHTML(txt.summary||'')}</p><div class="byline">${daysLabel(a)} · ${escapeHTML(a.source||'')}</div></div><div class="thumb">${imageHTML(a)}<span class="label">${cat}</span></div></article>`;
  }
  // A new publication build is not proof of a newly published article.
  // Display separate source-check time and actual newest story time.
  function renderFreshness(){
    const el=$('news-freshness');if(!el)return;
    const checked=Date.parse(sourceCheckedAt||''),latest=Date.parse(newestSourceAt||'');
    const checkedValid=Number.isFinite(checked)&&Date.now()-checked>=-60000&&Date.now()-checked<90*60000;
    const newestValid=Number.isFinite(latest)&&Date.now()-latest>=-120000;
    const freshnessAge=newestValid?(Date.now()-latest)/3600000:Infinity;
    el.classList.toggle('is-stale',freshnessAge>8);
    const format=timestamp=>new Date(timestamp).toLocaleString(lang==='pt'?'pt-BR':lang==='es'?'es-US':'en-US',{dateStyle:'short',timeStyle:'short'});
    const check=checkedValid?format(checked):null,story=newestValid?format(latest):null;
    const pt=check?`Fontes verificadas em ${check}. `:'Fontes aguardando atualização. ';
    const en=check?`Sources checked ${check}. `:'Source check unavailable. ';
    const es=check?`Fuentes consultadas ${check}. `:'Verificación de fuentes pendiente. ';
    el.textContent=lang==='pt'
      ?pt+(story?`Notícia mais recente identificada: ${story}.`:'Nenhuma manchete recente identificada.')
      :lang==='en'?en+(story?`Newest identified story: ${story}.`:'No recent source headline identified.')
      :es+(story?`Noticia más reciente identificada: ${story}.`:'No se identificaron titulares recientes.');
  }
  function renderStories(){const f=articlesFiltered();const pages=Math.max(1,Math.ceil(f.length/pageSize));page=Math.min(page,pages-1);
    const all=pageStories(); indexSet.clear();all.forEach((a,i)=>indexSet.set(a.id,i));
    $('list').innerHTML=f.length?f.slice(page*pageSize,(page+1)*pageSize).map(a=>storyCard(a,indexSet.get(a.id))).join(''):`<div class="empty">${labels[lang].noResults}</div>`;
    $('count').textContent=''; // Editorial article counts are internal, not reader-facing.
    $('pagecount').textContent=`${page+1} / ${pages}`;
    $('prev').disabled=page===0; $('next').disabled=page===pages-1;
    // The arrow/dot carousel changes the hero image/headline only.
    // The three "Leia Também" stories remain fixed across hero navigation.
    const n=Math.max(1,Math.ceil(f.length/featureSize));
    featurePage=Math.min(featurePage,n-1);
    const hero=f[featurePage*featureSize]||f[0];
    const related=f.slice(1,4);
    const relatedTitle=lang==='pt'?'Leia também':lang==='es'?'Lea también':'Read also';
    $('features').innerHTML=hero
      ? `<div class="hero-wrap">${storyCard(hero,indexSet.get(hero.id),true,false)}</div>${related.length
        ? `<div class="related-rail" aria-label="${relatedTitle}"><div class="related-head">${relatedTitle}</div>${related.map(a=>storyCard(a,indexSet.get(a.id),true,true)).join('')}</div>` : ''}`
      :`<div class="empty">${labels[lang].noResults}</div>`;
    $('featureCount').textContent=`${featurePage+1} / ${n}`;
    $('featurePrev').disabled=featurePage===0; $('featureNext').disabled=featurePage===n-1;
    const slideLabel=lang==='pt'?'Ir para página':lang==='es'?'Ir a la página':'Go to page';
    $('featureDots').innerHTML=Array.from({length:n},(_,i)=>`<button type="button" class="carousel-dot ${i===featurePage?'active':''}" data-slide="${i}" aria-label="${slideLabel} ${i+1} / ${n}" aria-pressed="${i===featurePage}" ${i===featurePage?'aria-current="page"':''}></button>`).join('');
    const shortlist=f.slice(0,5);
    $('highlights-title').textContent=lang==='pt'?'5 manchetes em foco':lang==='es'?'5 titulares destacados':'5 headlines in focus';
    $('highlightList').innerHTML=shortlist.map(a=>{
      const i=indexSet.get(a.id),title=cleanHeadline(localeOf(a)?.title||'');
      return `<li><button type="button" data-story="${i}" aria-label="${escapeHTML(title)}">${imageHTML(a,'class="highlight-photo"')}<span class="highlight-category">${escapeHTML(localizedCategory(a.category))}</span><span class="highlight-headline">${escapeHTML(title)}</span><span class="highlight-source">${escapeHTML(a.source||'')}</span></button></li>`;
    }).join('');
    $('highlights').hidden=!shortlist.length;
    renderFreshness();
  }
  function percentBadge(v){if(!Number.isFinite(v))return '';
    const cls=v>0?'market-up':v<0?'market-down':'market-flat';const arrow=v>0?'▲':v<0?'▼':'—';const n=(v>0?'+':'')+v.toLocaleString(lang==='pt'?'pt-BR':'en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
    return `<span class="${cls}">${arrow} ${n}%</span>`;
  }
  // V34.1 market contract: if we cannot provide a real, dated, attributed
  // number, we do not display a dead ticker row or a fabricated zero.
  function verifiedMarketQuote(v,key){
    if(!v || typeof v!=='object' || v.value===null || v.value===undefined || v.value==='')return false;
    const value=Number(v.value),observed=Date.parse(v.observed_at||'');
    if(!Number.isFinite(value)||value<=0||!Number.isFinite(observed)||!String(v.source||'').trim())return false;
    const age=Date.now()-observed;
    const maxAge={usdbrl:5,diesel:35,brent:14}[key]*86400000;
    return age>=-86400000 && age<=maxAge;
  }
  function marketValue(v,key){
    const status=key==='usdbrl'
      ?(v.instrument==='ptax_reference'
         ?(lang==='pt'?'Última PTAX oficial de venda':lang==='es'?'Última PTAX oficial de venta':'Last official BCB PTAX sell reference')
         :(lang==='pt'?'Último fechamento comercial verificado':lang==='es'?'Último cierre comercial verificado':'Last verified commercial close'))
      : (v.quote_status||({pt:'Último dado disponível',es:'Último dato disponible',en:'Last available observation'}[lang]));
    const n=Number(v.value).toLocaleString(lang==='pt'?'pt-BR':lang==='es'?'es-US':'en-US',{minimumFractionDigits:2,maximumFractionDigits:key==='usdbrl'?4:3});
    const unit=key==='usdbrl'?'R$': 'US$';
    const observed=String(v.observed_at||'').slice(0,16).replace('T',' ');
    const change=v.change_pct===null||v.change_pct===undefined||v.change_pct===''?'':percentBadge(Number(v.change_pct));
    return `<b>${unit} ${n}</b>${change}<small class="market-asof">${escapeHTML(observed)} · ${escapeHTML(v.source||'')} · ${escapeHTML(status)}</small>`;
  }
  function mrow(name,ticker,v,key){
    if(!verifiedMarketQuote(v,key))return '';
    return `<div class="sideitem market-live-row" data-market-key="${key}"><div><strong>${escapeHTML(name)}</strong><small>${escapeHTML(ticker)}</small></div><div class="value">${marketValue(v,key)}</div></div>`;
  }
  function renderMarket(){
    const market=data.market||{},inds=market.indicators||{};
    const body=[
      mrow(inds.usdbrl?.instrument==='ptax_reference'?(lang==='en'?'USD PTAX (BCB)':lang==='es'?'Dólar PTAX (BCB)':'Dólar PTAX (BCB)'):
        (lang==='pt'?'Dólar comercial':lang==='es'?'Dólar comercial':'USD / BRL'),'USD/BRL',inds.usdbrl,'usdbrl'),
      mrow(lang==='en'?'US Diesel':lang==='es'?'Diésel en EE. UU.':'Diesel nos EUA','EIA · US$/gal',inds.diesel,'diesel'),
      mrow(lang==='en'?'Brent crude':lang==='es'?'Petróleo Brent':'Petróleo Brent','BRENT · US$/bbl',inds.brent,'brent')
    ].filter(Boolean);
    // Securities and Class 8 data were never reliably available on the public
    // News site. They are deliberately not shown, even as placeholders.
    // Keep original provider contracts documented for future, licensed use.
    const empty=lang==='pt'?'Sem indicadores recentes e verificados nesta atualização. Não exibimos cotações fictícias.':
      lang==='es'?'No hay indicadores recientes y verificados. No mostramos cotizaciones ficticias.':
      'No recent verified market indicators are available. No invented quotes.';
    const marketHTML=body.length?body.join(''):`<p class="market-unavailable">${empty}</p>`;
    $('market').innerHTML=marketHTML;
    $('market-mobile').innerHTML=marketHTML;
    const note=lang==='pt'?'Dados de referência, não cotações em tempo real.':
      lang==='es'?'Datos de referencia, no cotizaciones en tiempo real.':
      'Reference data, not real-time prices.';
    $('market-note').textContent=body.length?note:'';
    $('market-note-mobile').textContent=body.length?note:'';
  }
  function renderAds(){
    const placements=(data.ads?.enabled&&Array.isArray(data.ads.placements))?data.ads.placements:[];
    const text={
      pt:{action:'Conheça a plataforma ↗',
          'news-top':['Conecte seu negócio ao transporte americano','Motoristas, frotas e empresas em movimento. Conheça o ecossistema DrivMatch.'],
          'market-sidebar':['O transporte move oportunidades','Uma vitrine para empresas e profissionais que fazem a logística acontecer.']},
      en:{action:'Explore the platform ↗',
          'news-top':['Connect your business to American trucking','Drivers, fleets and businesses in motion. Explore the DrivMatch ecosystem.'],
          'market-sidebar':['Trucking moves opportunities','Connecting carriers and professionals in American logistics.']},
      es:{action:'Conoce la plataforma ↗',
          'news-top':['Conecta tu empresa con el transporte de EE. UU.','Conductores, flotas y empresas en movimiento. Descubre el ecosistema DrivMatch.'],
          'market-sidebar':['El transporte mueve oportunidades','Una vitrina para empresas y profesionales de la logística.']}
    }[lang];
    const previous=$('ad-slot');if(previous){previous.hidden=true;previous.innerHTML='';}
    for(const [slot,id] of [['news-top','news-commercial-banner'],['market-sidebar','market-commercial-banner']]){
      const container=$(id);if(!container)continue;
      const ad=placements.find(x=>x.enabled===true&&x.relationship==='house'&&x.slot===slot
             &&/^https:\/\/drivmatch\.com\//i.test(x.url||''));
      container.hidden=!ad;if(!ad){container.innerHTML='';continue;}
      const [title,description]=text[slot];
      container.innerHTML=`<div class="ad-copy"><h3>${escapeHTML(title)}</h3><p>${escapeHTML(description)}</p></div>
        <a class="ad-link" href="${escapeHTML(ad.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(text.action)}</a>`;
    }
  }
  // This is the live GitHub Pages share host; custom-domain /news/share routing is not yet verified.
  // Social platforms require our own crawlable Open Graph page, never an RSS redirect.
  const shareUrlOf = a => 'https://handsondispatcher.github.io/drivmatch-news/share/'+encodeURIComponent(a.id)+'/';
  let sharedStoryConsumed=false;
  function openSharedStory(){
    if(sharedStoryConsumed)return;
    try {
      const id=new URLSearchParams(location.search).get('story');
      const story=id&&pageStories().find(a=>a.id===id);
      if(story){sharedStoryConsumed=true;opened=story;articleLang=lang;renderArticle();$('article-dialog').scrollTop=0;}
    }catch(_){}
  }
  // Headline-based context is written by DrivMatch News, not a copy of a third-party article.
  // Never infer unreported details or call this a full translation.
  const editorialContext={
    pt:{Clima:'Para planejar uma viagem, consulte também os alertas oficiais do NWS e do DOT estadual. A manchete não confirma, por si só, o fechamento de uma rodovia.',Rodovias:'Motoristas devem verificar restrições, condições de tráfego e comunicados do DOT antes de modificar a rota.',Segurança:'Transportadoras, motoristas e brokers devem conferir identidade, documentação e procedimentos de prevenção a fraudes.',Fiscalização:'Confirme a regra aplicável, a jurisdição e a data de vigência nos órgãos oficiais antes de tomar decisões de compliance.',Combustíveis:'Custos de diesel podem afetar a margem do frete; verifique preços e referências oficiais antes de recalcular a operação.',Imigração:'Regras migratórias e de habilitação exigem verificação junto às autoridades competentes; não tome a manchete como orientação jurídica.',Acidentes:'Verifique informações de segurança e eventuais restrições de tráfego com autoridades rodoviárias antes de passar pelo local.',Mecânica:'Inspeção preventiva do veículo de tração e do trailer é essencial; confirme recomendações técnicas com profissionais habilitados.'},
    en:{Clima:'Check official NWS and state DOT alerts before planning a trip. The headline alone does not establish a road closure.',Rodovias:'Verify route restrictions and traffic advisories with the relevant state DOT before changing your route.',Segurança:'Carriers, drivers and brokers should verify identities, documents and fraud-prevention procedures.',Fiscalização:'Verify the applicable regulation, jurisdiction and effective date with official agencies.',Combustíveis:'Diesel costs may affect freight margins; verify actual prices before adjusting operating plans.',Imigração:'Check immigration and CDL requirements with the competent authorities; a headline is not legal advice.',Acidentes:'Check road safety notices and traffic restrictions with the relevant authorities.',Mecânica:'Preventive maintenance of the power unit and trailer matters; confirm technical advice with qualified professionals.'},
    es:{Clima:'Antes de viajar, consulte las alertas oficiales del NWS y del DOT estatal. El titular no confirma por sí solo un cierre de carretera.',Rodovias:'Verifique restricciones de rutas y avisos de tráfico del DOT antes de cambiar el trayecto.',Segurança:'Transportistas, conductores y brokers deben verificar identidades, documentos y controles antifraude.',Fiscalização:'Compruebe las reglas, la jurisdicción y la fecha de vigencia ante las autoridades.',Combustíveis:'Los costos del diésel pueden afectar el margen del flete; confirme los precios reales.',Imigração:'Verifique los requisitos migratorios y de CDL ante las autoridades; un titular no es asesoramiento legal.',Acidentes:'Consulte las alertas de seguridad vial y las restricciones de tráfico oficiales.',Mecânica:'El mantenimiento preventivo del camión y del remolque es importante; consulte a profesionales cualificados.'}
  };
  function sourceBrief(a,chosen){
    const headline=localeOf(a,chosen)?.title||a.locales?.en?.title||'';
    const sourceName=a.source||'a fonte';
    const generic={pt:'O assunto pode ser relevante para motoristas, dispatchers, transportadoras e brokers que operam nos EUA e nos corredores internacionais autorizados.',en:'This topic may matter to drivers, dispatchers, carriers and brokers operating in the US and its permitted cross-border corridors.',es:'El tema puede interesar a conductores, dispatchers, transportistas y brokers que operan en EE. UU. y sus corredores fronterizos autorizados.'};
    const context=editorialContext[chosen]?.[a.category]||generic[chosen];
    if(chosen==='en')return `DRIVMATCH NEWS • HEADLINE BRIEF\n\n${sourceName} reports: “${headline}”.\n\nWhy it matters: ${context}\n\nThis original context note is based on the publisher's headline and metadata only. It is not the full article or an independent verification of the event.`;
    if(chosen==='es')return `DRIVMATCH NEWS • RESUMEN DE TITULAR\n\n${sourceName} publicó: «${headline}».\n\nPor qué importa: ${context}\n\nEste texto de contexto es original y se basa únicamente en el titular y los metadatos de la fuente. No es el artículo completo ni una verificación independiente.`;
    return `DRIVMATCH NEWS • LEITURA RÁPIDA\n\nO veículo ${sourceName} publicou a manchete: “${headline}”.\n\nPor que importa: ${context}\n\nEste texto de contextualização é original e se baseia somente na manchete e nos metadados disponíveis. Não é a reportagem integral nem uma confirmação independente do acontecimento.`;
  }
  function renderArticle(){if(!opened)return;const txt=localeOf(opened,articleLang), cat=catLabels[opened.category]?.[indices[articleLang]]||opened.category;const al=labels[articleLang];
    const storyPhoto=licensedPhotoOf(opened);
    $('modalimg').src=imageOf(opened);$('modalimg').onerror=()=>{$('modalimg').onerror=null;$('modalimg').src=storyGraphic(opened);};$('modalimg').alt=storyPhoto?.image_alt||opened.image_alt||txt.title;$('modalkicker').textContent=cat+(opened.kind==='opportunity'?' · DrivMatch':'');
    $('modaltitle').textContent=cleanHeadline(txt.title);
    const publishTime=Date.parse(opened.published_at||'');
    const shownDate=Number.isFinite(publishTime)
      ? new Date(publishTime).toLocaleString(lang==='pt'?'pt-BR':lang==='es'?'es-MX':'en-US',{dateStyle:'short',timeStyle:'short'})
      : String(opened.published_at||'');
    $('modalmeta').textContent=opened.demo?al.demo:opened.published_at?`${al.published}: ${shownDate}`:'';
    const isExternal=opened.kind==='external_link';
    if(isExternal)$('article-dialog').classList.add('external-article');
    else $('article-dialog').classList.remove('external-article');
    $('modalbodytext').textContent=isExternal
      ?(lang==='pt'?'Leia a reportagem completa na fonte pelos botões abaixo. O texto integral pertence ao veículo de origem; não apresentamos um resumo genérico como se fosse a matéria.':lang==='es'?'Lea el reportaje completo en la fuente con los enlaces de abajo.':'Read the full original report using the links below.')
      :(txt.body||txt.summary||'');
    $('modalbrief').textContent=isExternal
      ? (articleLang==='pt'?'Leia a reportagem completa no veículo original pelos links abaixo.':articleLang==='es'?'Lea el reportaje en el medio original mediante los enlaces.':'Read the complete report at the original publisher via the links.')
      : '';
    $('article-disclosure').textContent=opened.demo?al.disclaimerDemo:
      opened.kind==='opportunity'?'Oportunidade do ecossistema DrivMatch. Verifique requisitos e validade na publicação original.':'';
    const src=safeUrl(opened.source_url);
    // Original remains first-party. Translation happens in browser or Google Translate,
    // not by reproducing a publisher's copyrighted full text.
    const isFreightWaves=src&&/^https:\/\/(?:www\.)?freightwaves\.com\//i.test(src);
    const translatedUrl=target=>isFreightWaves
      ?'https://translate.google.com/translate?sl=en&tl='+encodeURIComponent(target)+'&u='+encodeURIComponent(src)
      :src;
    const sourceLink=(url,label,flag,primary=false)=>{
      // Compact mobile labels keep all three source actions on one row.
      // Full translation/attribution wording remains visible on desktop.
      const concise=flag==='en'?'English · original':flag==='pt'?'Português':'Español';
      return '<a class="article-source-button '+(primary?'primary':'secondary')+'" href="'+escapeHTML(url)+'" target="_blank" rel="noopener noreferrer"><img src="'+flags[flag]+'" alt="" width="19" height="13"><span class="source-label-full">'+escapeHTML(label)+'</span><span class="source-label-mobile">'+escapeHTML(concise)+'</span><span class="source-link-arrow" aria-hidden="true">↗</span></a>';
    };
    const ptButton=src?sourceLink(translatedUrl('pt'),isFreightWaves?'Português · tradução automática':'Português · traduzir no navegador','pt',articleLang==='pt'):'';
    const enButton=src?sourceLink(src,'English · original','en',articleLang==='en'):'';
    const esButton=src?sourceLink(translatedUrl('es'),isFreightWaves?'Español · traducción automática':'Español · traducir en navegador','es',articleLang==='es'):'';
    const heading=articleLang==='pt'?'REPORTAGEM COMPLETA NA FONTE':articleLang==='es'?'REPORTAJE COMPLETO EN LA FUENTE':'COMPLETE ORIGINAL REPORT';
    const tip=articleLang==='pt'?'Para português ou espanhol, a tradução automática abre pelo Google Tradutor quando disponível. Nos demais veículos, abra a fonte e use “Traduzir página” no navegador. O acesso depende do veículo.':articleLang==='es'?'La traducción automática depende del navegador o del editor.':'The full report belongs to the publisher. Automatic translation may depend on the browser.';
    const shortTip=articleLang==='pt'?'Português e espanhol: tradução pelo navegador, quando disponível.':articleLang==='es'?'Traducción mediante el navegador, cuando esté disponible.':'Translation through the browser, when available.';
    $('article-source').innerHTML=src?'<div class="full-article-heading">'+heading+'</div><div class="source-translations">'+ptButton+enButton+esButton+'</div><p class="source-access-warning">'+tip+'</p><p class="source-access-short">'+shortTip+'</p>':escapeHTML(opened.source||'');
    const attribution=storyPhoto||opened;
    const photoCredit=attribution.image_source_url && safeUrl(attribution.image_source_url)
      ? `<p class="image-credit"><span class="photo-credit-label">${articleLang==='en'?'Illustrative archive photo':articleLang==='es'?'Foto ilustrativa de archivo':'Foto ilustrativa de arquivo'} (não é imagem do acontecimento): </span><a href="${escapeHTML(attribution.image_source_url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(attribution.image_credit||'Wikimedia Commons')}</a> · ${escapeHTML(attribution.image_license||'Licença na fonte')} <span class="photo-transform-note">· corte/redimensionamento</span></p>`:'';
    $('article-source').innerHTML+=photoCredit;
    $('articleLanguageTitle').textContent=lang==='en'?'Article language':lang==='es'?'Idioma de la noticia':'Idioma da notícia';
    $('articleLanguageButtons').innerHTML=langs.filter(l=>opened.locales?.[l]&&(opened.kind!=='external_link'||opened.translated_langs?.includes(l))).map(l=>`<button data-article-lang="${l}" type="button" aria-pressed="${l===articleLang}" class="${l===articleLang?'active':''}"><img src="${flags[l]}" width="17" height="12" alt=""> ${l==='pt'?'Português':l==='en'?'English':'Español'}</button>`).join('');
    $('article-reading').hidden=opened.kind==='external_link'&&(!opened.translated_langs||opened.translated_langs.length<2);
    $('translation').textContent=opened.demo?al.disclaimerDemo:'';
    $('share-feedback').textContent='';
    $('share-options').hidden=true;
    $('share-picker-feedback').textContent='';
    $('share-native').setAttribute('aria-expanded','false');
    $('shade').classList.add('open');
  }
  function languageSet(next,rerender=true){if(!langs.includes(next))return;lang=next;document.documentElement.lang=next==='pt'?'pt-BR':next==='es'?'es-419':'en-US';
    document.querySelectorAll('[data-site-lang]').forEach(b=>{b.classList.toggle('selected',b.dataset.siteLang===next);b.setAttribute('aria-pressed',String(b.dataset.siteLang===next));});
    $('language').value=next;$('languageFlag').src=flags[next];$('languageFlag').alt=next==='pt'?'Bandeira do Brasil':next==='en'?'US flag':'Bandera de España';
    // Flag-button clicks do not fire change on the hidden select automatically.
    // Tell independently initialized quote/weather/video modules to translate too.
    if(typeof CustomEvent==='function')document.dispatchEvent(new CustomEvent('drivmatch:language',{detail:{language:next}}));
    $('share-label').textContent=next==='en'?'Share':next==='es'?'Compartir':'Compartilhar';
    $('share-section-title').textContent=next==='en'?'Share this story':next==='es'?'Comparte esta noticia':'Compartilhe esta notícia';
    $('share-copy').textContent=next==='en'?'Copy link':next==='es'?'Copiar enlace':'Copiar link';
    $('share-whatsapp-copy').textContent=next==='en'?'WhatsApp Web already open? Copy message to paste in your chat':next==='es'?'¿Ya tienes WhatsApp Web abierto? Copia el mensaje':'Já está no WhatsApp Web? Copiar mensagem para colar na conversa';
    $('share-story-label').textContent=next==='en'?'Story image':next==='es'?'Imagen Story':'Card Stories';
    $('share-system-label').textContent=next==='en'?'Other apps':next==='es'?'Otras apps':'Outros apps';
    $('share-stories-hint').textContent=next==='en'?'Stories: save the image and publish it in your app. Not an automatic post.':next==='es'?'Historias: guarda la imagen y publícala en tu app. No se publica automáticamente.':'Stories: salve a imagem e publique no seu aplicativo. Não há publicação automática em Stories.';
    document.querySelectorAll('.weather-top h2').forEach(h=>h.textContent=next==='en'?'Weather':next==='es'?'Clima':'Clima');
    document.querySelectorAll('.weather-card').forEach(el=>el.setAttribute('aria-label',next==='en'?'Weather':next==='es'?'Clima':'Clima'));
    // v34.7: release and edition metadata are internal only; no text in public masthead.
    // Edition navigation and commercial bridge: newspaper first, service links second.
    const newsroomCopy={
      pt:{section:'',sub:'Informação, mercado e contexto para quem vive o transporte nos EUA.',home:'Capa',drivers:'Caminhoneiros',freight:'Fretes',regulation:'Regulamentação',safety:'Segurança',technology:'Tecnologia',weather:'Clima & Mercado',eye:'SERVIÇOS DRIVMATCH · ACESSO EXTERNO AO JORNAL',title:'Oportunidades no transporte',desc:'A DrivMatch conecta profissionais e empresas. O cadastro e os matches acontecem na plataforma principal.',driver:'Sou motorista ↗',carrier:'Sou transportadora ↗'},
      en:{section:'',sub:'News, markets and context for US transport professionals.',home:'Front page',drivers:'Truck drivers',freight:'Freight',regulation:'Regulation',safety:'Safety',technology:'Technology',weather:'Weather & Markets',eye:'DRIVMATCH SERVICES · OUTSIDE THE NEWSROOM',title:'Opportunities in transportation',desc:'DrivMatch connects professionals and companies. Registration and matching take place on the main platform.',driver:'I am a driver ↗',carrier:'I am a carrier ↗'},
      es:{section:'',sub:'Información y mercados para profesionales del transporte en Estados Unidos.',home:'Portada',drivers:'Camioneros',freight:'Fletes',regulation:'Regulación',safety:'Seguridad',technology:'Tecnología',weather:'Clima y mercados',eye:'SERVICIOS DRIVMATCH · FUERA DE LAS NOTICIAS',title:'Oportunidades en el transporte',desc:'DrivMatch conecta profesionales y empresas. El registro y matching están en la plataforma principal.',driver:'Soy conductor ↗',carrier:'Soy transportista ↗'}
    }[next];
    // v34.5: unapproved editorial section title removed; never inject it again.
    document.querySelectorAll('[data-newsroom-label]').forEach(a=>{a.textContent=newsroomCopy[a.dataset.newsroomLabel]||a.textContent});
    $('newsroom-cta-eyebrow').textContent=newsroomCopy.eye;
    $('newsroom-cta-title').textContent=newsroomCopy.title;
    $('newsroom-cta-desc').textContent=newsroomCopy.desc;
    $('newsroom-cta-driver').textContent=newsroomCopy.driver;
    $('newsroom-cta-carrier').textContent=newsroomCopy.carrier;
    $('footer-publisher').textContent='DrivMatch News — um produto da Hands On Dispatcher LLC';
    $('footer-legal').innerHTML='© 2026 Hands On Dispatcher LLC. Todos os direitos reservados. <span class="footer-version" id="footer-version">· v34.11</span>';
    $('story-preview-title').textContent=next==='en'?'Story preview':next==='es'?'Vista previa de Story':'Prévia do Story';
    $('story-preview-download').textContent=next==='en'?'Save PNG image':next==='es'?'Guardar imagen PNG':'Salvar imagem PNG';
    $('story-preview-hint').textContent=next==='en'?'Review the card, then post it to Instagram, TikTok or WhatsApp Status.':next==='es'?'Revisa la imagen y luego publícala en Instagram, TikTok o el estado de WhatsApp.':'Revise o card e depois publique no Instagram, TikTok ou Status do WhatsApp.';
    const trans=labels[next];document.querySelector('#panorama .heading').textContent=trans.panorama;document.querySelector('#noticias .heading').textContent=trans.news;
    document.querySelector('#market-title').textContent=trans.market;
    $('market-title-mobile').textContent=trans.market;
    $('search').placeholder=trans.search;$('category').options[0].text=trans.filters;
    const ages=$('age').options;[trans.allDates,trans.d2,trans.d7,trans.d30].forEach((t,i)=>{if(ages[i])ages[i].text=t});
    $('prev').textContent=trans.prev;$('next').textContent=trans.next;
    $('featurePrev').textContent='←';$('featureNext').textContent='→';
    $('featurePrev').setAttribute('aria-label',trans.prev.replace(/[←→]/g,'').trim());
    $('featureNext').setAttribute('aria-label',trans.next.replace(/[←→]/g,'').trim());
    [...$('category').options].slice(1).forEach(o=>o.textContent=localizedCategory(o.value));
    if(rerender){renderStories();renderMarket();renderAds();if(opened)renderArticle();}
  }
  async function refreshNews(){
    try{
      const [editorial,external,photographs]=await Promise.all([
        fetch('data/content.json?ts='+Date.now(),{cache:'no-store'}),
        fetch('data/source-headlines.json?ts='+Date.now(),{cache:'no-store'}),
        fetch('data/news-images.json?ts='+Date.now(),{cache:'no-store'})
      ]);
      if(editorial.ok){const next=await editorial.json();if(Array.isArray(next.articles))data={...data,...next};}
      if(external.ok){
        const next=await external.json();
        if(Array.isArray(next.headlines)){
          sourceCheckedAt=next.generated_at||'';
          newestSourceAt=next.latest_headline_at||'';
          currentSourceCount=next.headlines.length;
          const approved=new Set((data.articles||[]).map(x=>x.source_url));
          const seen=new Set();
          externalHeadlines=next.headlines.filter(x=>x.geo_scope_verified===true&&x.title&&x.origin_type!=='aggregator-discovery'&&!/news\.google\.com/i.test(x.source_url||'')&&!/\b(tanzania|tanz[aâ]nia|vietnam|vietnamese|da nang|hanoi)\b/i.test(x.title+' '+Object.values(x.titles||{}).join(' '))&&!/^https:\/\/(?:[a-z0-9-]+\.)*thetrucker\.com(?:[\/:?#]|$)/i.test(x.source_url||'')&&safeUrl(x.source_url)&&!approved.has(x.source_url)&&!seen.has(x.source_url)&&seen.add(x.source_url)).filter((x,i,rows)=>!rows.slice(0,i).some(y=>duplicateEvent(x.titles?.pt||x.title,y.titles?.pt||y.title))&&!data.articles.some(y=>Object.values(y.locales||{}).some(loc=>duplicateEvent(x.titles?.pt||x.title,loc.title)))).slice(0,90).map(x=>({
            id:x.id,kind:'external_link',status:'external_source',demo:false,
            category:CATS.includes(x.category)?x.category:'Transporte',region:x.region||'US',source:x.source,
            source_url:x.source_url,published_at:x.published_at,original_lang:x.original_lang|| (x.region==='MX'?'es':'en'),image:x.image||'',
            locales:Object.fromEntries(langs.map(l=>[l,{title:cleanHeadline(x.titles?.[l]||x.title),summary:'',body:''}])),translated_langs:Object.keys(x.titles||{})
          }));
        }
      }
      if(photographs.ok){
        const gallery=await photographs.json();
        if(gallery.schema_version===1&&gallery.license_policy==='curated_commons'&&gallery.images&&typeof gallery.images==='object'){
          photoByStory=gallery.images; visualCacheKey='';
        }
      }
      renderStories();
      if(opened)renderArticle();
      openSharedStory();
    }catch(e){/* Keep last successfully loaded issue when offline. */}
  }
  function install(){if(location.protocol.startsWith('http')){refreshNews();setInterval(refreshNews,60000);}CATS.forEach(c=>$('category').add(new Option(c,c)));
    $('edition-date').textContent=new Date().toLocaleDateString('pt-BR');
    // No public-facing development banner; sources remain in editorial metadata.
    $('language').addEventListener('change',e=>languageSet(e.target.value));
    document.querySelectorAll('.language-shortcuts').forEach(el=>el.addEventListener('click',e=>{const b=e.target.closest('[data-site-lang]');if(b)languageSet(b.dataset.siteLang);}));
    $('search').addEventListener('input',()=>{page=featurePage=0;renderStories();});
    $('category').addEventListener('change',e=>{selected=e.target.value;page=featurePage=0;languageSet(lang);});
    $('age').addEventListener('change',()=>{page=featurePage=0;renderStories();});
    $('prev').addEventListener('click',()=>{page--;renderStories();$('noticias').scrollIntoView({behavior:'smooth'});});
    $('next').addEventListener('click',()=>{page++;renderStories();$('noticias').scrollIntoView({behavior:'smooth'});});
    $('featurePrev').addEventListener('click',()=>{featurePage--;renderStories();});
    $('featureNext').addEventListener('click',()=>{featurePage++;renderStories();});
    $('featureDots').addEventListener('click',e=>{const el=e.target.closest('[data-slide]');if(!el)return;featurePage=Number(el.dataset.slide);renderStories();});
    // Native horizontal gesture on the main Panorama; vertical page scrolling remains free.
    let panoramaTouch=null;
    $('features').addEventListener('touchstart',e=>{
      if(e.touches.length!==1)return;
      panoramaTouch={x:e.touches[0].clientX,y:e.touches[0].clientY};
    },{passive:true});
    $('features').addEventListener('touchend',e=>{
      if(!panoramaTouch||!e.changedTouches.length)return;
      const dx=e.changedTouches[0].clientX-panoramaTouch.x;
      const dy=e.changedTouches[0].clientY-panoramaTouch.y;
      panoramaTouch=null;
      if(Math.abs(dx)<60||Math.abs(dx)<=Math.abs(dy)*1.4)return;
      const max=Math.max(0,Math.ceil(articlesFiltered().length/featureSize)-1);
      const nextPage=Math.min(max,Math.max(0,featurePage+(dx<0?1:-1)));
      if(nextPage!==featurePage){featurePage=nextPage;renderStories();}
    },{passive:true});
    const clickArticle=e=>{const item=e.target.closest('[data-story]');if(item){opened=pageStories()[Number(item.dataset.story)];articleLang=lang;if(opened){renderArticle();$('article-dialog').scrollTop=0;}return;}const external=e.target.closest('[data-external-url]');if(external&&typeof window.open==='function')window.open(external.dataset.externalUrl,'_blank','noopener,noreferrer');};
    const shareText=()=>opened?cleanHeadline(localeOf(opened,lang)?.title||'DrivMatch News'):'DrivMatch News';
    const shareSummary=()=>opened?(opened.kind==='external_link'
      ?(lang==='en'?'Headline and context from DrivMatch News.':lang==='es'?'Titular y contexto en DrivMatch News.':'Manchete e contexto no DrivMatch News.')
      :String(localeOf(opened,lang)?.summary||'').trim()):'';
    const shareOptions=$('share-options');
    const shareDestinations=(title,url,summary='')=>({
      whatsapp:(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent||'')?'https://wa.me/?text=':'https://web.whatsapp.com/send?text=')+encodeURIComponent([title,summary,url].filter(Boolean).join('\n\n')),
      facebook:'https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(url),
      threads:'https://www.threads.net/intent/post?text='+encodeURIComponent(title+' '+url),
      x:'https://twitter.com/intent/tweet?text='+encodeURIComponent(title)+'&url='+encodeURIComponent(url),
      linkedin:'https://www.linkedin.com/sharing/share-offsite/?url='+encodeURIComponent(url),
      telegram:'https://t.me/share/url?url='+encodeURIComponent(url)+'&text='+encodeURIComponent(title),
      reddit:'https://www.reddit.com/submit?url='+encodeURIComponent(url)+'&title='+encodeURIComponent(title),
      pinterest:'https://pinterest.com/pin/create/button/?url='+encodeURIComponent(url)+'&description='+encodeURIComponent(title),
      email:'mailto:?subject='+encodeURIComponent(title)+'&body='+encodeURIComponent(url)
    });
    $('share-native').addEventListener('click',()=>{
      if(!opened)return;
      const expanded=shareOptions.hidden;
      shareOptions.hidden=!expanded;
      pickerFeedback.textContent='';
      $('share-native').setAttribute('aria-expanded',String(expanded));
      if(!expanded)return;
      const urls=shareDestinations(shareText(),shareUrlOf(opened),shareSummary());
      shareOptions.querySelectorAll('[data-share-platform]').forEach(a=>{a.href=urls[a.dataset.sharePlatform]||'#';});
    });
    $('share-options-close').addEventListener('click',()=>{shareOptions.hidden=true;$('share-native').setAttribute('aria-expanded','false');$('share-native').focus();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!shareOptions.hidden){shareOptions.hidden=true;$('share-native').setAttribute('aria-expanded','false');e.stopPropagation();}});
    const shareMessage=()=>[shareText(),shareSummary(),shareUrlOf(opened)].filter(Boolean).join('\n\n');
    const pickerFeedback=$('share-picker-feedback');
    const shareSystem=$('share-system');
    shareSystem.hidden=typeof navigator.share!=='function';
    const copyToClipboard=async(value)=>{
      if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(value);return;}
      const helper=document.createElement('textarea');helper.value=value;helper.setAttribute('readonly','');
      helper.style.position='fixed';helper.style.opacity='0';document.body.appendChild(helper);helper.select();
      const ok=document.execCommand('copy');helper.remove();if(!ok)throw Error('Clipboard unavailable');
    };
    $('share-whatsapp-copy').addEventListener('click',async()=>{
      if(!opened)return;
      try{await copyToClipboard(shareMessage());pickerFeedback.textContent=lang==='en'?'Message copied. Paste it in your open WhatsApp Web chat.':lang==='es'?'Mensaje copiado. Pégalo en tu conversación abierta de WhatsApp Web.':'Mensagem copiada. Cole na conversa que já está aberta no WhatsApp Web.';}
      catch(_){pickerFeedback.textContent=lang==='en'?'Copy the headline and link manually.':lang==='es'?'Copia el titular y el enlace manualmente.':'Não foi possível copiar automaticamente. Use Copiar link.';}
    });
    let storyPreviewBlobUrl=null;
    const closeStoryPreview=()=>{
      $('story-preview').hidden=true;
      if(storyPreviewBlobUrl){URL.revokeObjectURL(storyPreviewBlobUrl);storyPreviewBlobUrl=null;}
      $('story-preview-image').removeAttribute('src');
    };
    $('story-preview-close').addEventListener('click',closeStoryPreview);
    $('story-preview').addEventListener('click',e=>{if(e.target===$('story-preview'))closeStoryPreview();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('story-preview').hidden){closeStoryPreview();e.stopPropagation();}});
    $('share-story').addEventListener('click',async()=>{
      if(!opened)return;
      const story=opened,title=localeOf(story,lang)?.title||shareText();
      const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;
      const ctx=canvas.getContext('2d');
      if(!ctx){pickerFeedback.textContent='Não foi possível criar a imagem neste navegador.';return;}
      const bg=ctx.createLinearGradient(0,0,1080,1920);
      bg.addColorStop(0,'#071522');bg.addColorStop(.54,'#0a2d4b');bg.addColorStop(1,'#061320');
      ctx.fillStyle=bg;ctx.fillRect(0,0,1080,1920);
      ctx.fillStyle='#00b9f5';ctx.fillRect(70,322,940,7);
      ctx.fillStyle='#75b7e1';ctx.font='700 29px Arial, sans-serif';
      ctx.fillText((lang==='en'?'US TRUCKING NEWS':lang==='es'?'NOTICIAS DE TRANSPORTE':'NOTÍCIAS DO TRANSPORTE'),76,391);
      ctx.fillStyle='#e8f5ff';ctx.font='700 29px Arial, sans-serif';
      ctx.fillText(String((catLabels[story.category]?.[indices[lang]]||story.category)).toUpperCase(),76,448);
      // Fit the entire headline in a bounded block, rather than a tiny text line.
      let fontSize=73,lines=[];
      const words=String(title).split(/\s+/);
      const wrap=()=>{
        ctx.font='700 '+fontSize+'px Georgia, serif';lines=[];let line='';
        for(const word of words){
          const candidate=line?line+' '+word:word;
          if(ctx.measureText(candidate).width>920&&line){lines.push(line);line=word;}else line=candidate;
        }
        if(line)lines.push(line);
      };
      do{wrap();if(lines.length<=9)break;fontSize-=4;}while(fontSize>42);
      ctx.fillStyle='#fff';ctx.font='700 '+fontSize+'px Georgia, serif';
      const lineHeight=fontSize*1.23;
      lines.slice(0,9).forEach((line,i)=>ctx.fillText(line,75,548+i*lineHeight,930));
      const bottomTitle=548+Math.min(lines.length,9)*lineHeight;
      // A road/truck illustration is intentionally generic; not a claimed photo of the event.
      const illustrationY=Math.max(1100,Math.min(1320,bottomTitle+80));
      // Add the publisher-attributed editorial synopsis when there is room.
      // The summary is owned text for approved stories, or transparent context for links.
      const synopsis=String(story.kind==='external_link'
        ?(editorialContext[lang]?.[story.category]||'')
        :(localeOf(story,lang)?.summary||localeOf(story,lang)?.body||''))
        .replace(/\s+/g,' ').trim().slice(0,270);
      if(synopsis&&illustrationY-bottomTitle>205){
        ctx.fillStyle='#64c6f4';ctx.font='700 27px Arial, sans-serif';
        ctx.fillText(lang==='en'?'IN BRIEF':lang==='es'?'EN RESUMEN':'EM RESUMO',77,bottomTitle+35);
        ctx.fillStyle='#d8ebf8';ctx.font='32px Arial, sans-serif';
        const words=synopsis.split(/\s+/),synopsisLines=[];let row='';
        for(const word of words){const trial=row?row+' '+word:word;
          if(ctx.measureText(trial).width>920&&row){synopsisLines.push(row);row=word;}else row=trial;
        }
        if(row)synopsisLines.push(row);
        const maxLines=Math.min(5,Math.floor((illustrationY-bottomTitle-105)/46));
        synopsisLines.slice(0,maxLines).forEach((line,i)=>ctx.fillText(line,77,bottomTitle+91+i*46,920));
      }
      ctx.fillStyle='#0f456b';ctx.fillRect(0,illustrationY,1080,275);
      ctx.fillStyle='#113957';ctx.beginPath();ctx.moveTo(0,illustrationY+275);ctx.lineTo(1080,illustrationY+275);ctx.lineTo(920,illustrationY+150);ctx.lineTo(165,illustrationY+150);ctx.closePath();ctx.fill();
      ctx.fillStyle='#0b1a2b';ctx.fillRect(130,illustrationY+106,600,102);
      ctx.fillStyle='#0b1a2b';ctx.fillRect(735,illustrationY+137,155,71);
      ctx.fillStyle='#2d9bd1';ctx.fillRect(746,illustrationY+145,91,35);
      ctx.fillStyle='#d4eaff';ctx.fillRect(856,illustrationY+175,25,10);
      for(const x of [260,690,811]){ctx.fillStyle='#07111c';ctx.beginPath();ctx.arc(x,illustrationY+210,38,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#91a9b9';ctx.lineWidth=9;ctx.stroke();}
      ctx.fillStyle='#00b9f5';ctx.fillRect(76,1606,928,4);
      ctx.fillStyle='#e7f5ff';ctx.font='700 33px Arial, sans-serif';
      const sourceName=String(story.source||'DrivMatch News').slice(0,43);
      ctx.fillText((lang==='en'?'SOURCE: ':lang==='es'?'FUENTE: ':'FONTE: ')+sourceName,76,1673,920);
      ctx.font='700 38px Arial, sans-serif';ctx.fillStyle='#fff';
      ctx.fillText('drivmatch.com/news',76,1755);
      ctx.font='27px Arial, sans-serif';ctx.fillStyle='#b8d4e7';
      ctx.fillText(lang==='en'?'Read the summary and verify the original source.':lang==='es'?'Lee el resumen y consulta la fuente original.':'Leia o resumo e confira a fonte original.',76,1805,920);
      try{
        const logo=new Image();logo.src='assets/logo-drivmatch-news.png';
        await new Promise((resolve,reject)=>{if(logo.complete&&logo.naturalWidth)return resolve();logo.onload=resolve;logo.onerror=reject;});
        const ratio=Math.min(870/logo.naturalWidth,205/logo.naturalHeight);
        ctx.drawImage(logo,74,70,logo.naturalWidth*ratio,logo.naturalHeight*ratio);
      }catch(_){ctx.fillStyle='#fff';ctx.font='700 58px Arial, sans-serif';ctx.fillText('DrivMatch News',76,185);}
      try{
        const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
        if(!blob)throw Error('Image export failed');
        if(storyPreviewBlobUrl)URL.revokeObjectURL(storyPreviewBlobUrl);
        storyPreviewBlobUrl=URL.createObjectURL(blob);
        $('story-preview-image').src=storyPreviewBlobUrl;
        $('story-preview-download').href=storyPreviewBlobUrl;
        $('story-preview').hidden=false;
        $('story-preview-close').focus();
        pickerFeedback.textContent=lang==='en'?'Story ready for review.':lang==='es'?'Story listo para revisar.':'Story pronto para revisar.';
      }catch(_){pickerFeedback.textContent=lang==='en'?'Could not prepare the Story image.':lang==='es'?'No se pudo preparar la imagen.':'Não foi possível preparar a imagem do Story.';}
    });
    $('share-system').addEventListener('click',async()=>{
      if(!opened)return;
      const title=shareText(),url=shareUrlOf(opened);
      if(typeof navigator.share==='function'){
        try{await navigator.share({title,url});}catch(e){if(e?.name!=='AbortError')$('share-feedback').textContent=lang==='pt'?'Use uma das opções acima ou copie o link.':'Choose a destination above or copy the link.';}
      }else $('share-feedback').textContent=lang==='pt'?'Escolha uma rede acima ou copie o link.':'Choose a network above or copy the link.';
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
    $('list').addEventListener('click',clickArticle);$('features').addEventListener('click',clickArticle);$('highlightList').addEventListener('click',clickArticle);
    const keyArticle=e=>{if(e.key==='Enter'||e.key===' '){const item=e.target.closest('[data-story]');if(item){e.preventDefault();clickArticle({target:item});}}};
    $('list').addEventListener('keydown',keyArticle);$('features').addEventListener('keydown',keyArticle);$('highlightList').addEventListener('keydown',keyArticle);
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
