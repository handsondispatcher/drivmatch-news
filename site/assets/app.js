/* DrivMatch News v34.11 — Road TV after Ventusky; mobile market follows TV; earlier baselines preserved. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const source = window.DRIVMATCH_BOOTSTRAP || { articles: [], market: { indicators:{},stocks:{} }, ads:{ enabled:false }};
  let externalHeadlines = [], photoByStory = {}, photoLibrary = [], data = source, lang = 'pt', articleLang = 'pt', selected = 'Todas', page = 0, featurePage = 0, opened = null;
  let brentRealtime=null;
  let sourceCheckedAt=source.source_monitor?.checked_at||'', newestSourceAt=source.source_monitor?.latest_original_published_at||'', currentSourceCount=(source.articles||[]).filter(x=>x.kind==='external_link').length;
  const pageSize = 6, featureSize = 4;
  const CATS = ['Transporte','Combustíveis','Acidentes','Clima','Rodovias','Fiscalização','Tecnologia','Fretes','Empregos','Caminhões','Mecânica','Caminhoneiros','Socorro','Negócios','Governo','Imigração','Segurança'];
  const labels = {
    pt: { panorama:'Destaque',news:'Notícias',market:'Cotações e Mercado',all:'Todas',prev:'← Anterior',next:'Próximas →',search:'Pesquisar manchetes, temas ou fontes...',filters:'Todas as editorias',allDates:'Todo o arquivo',d2:'Hoje e ontem',d7:'Últimos 7 dias',d30:'Últimos 30 dias',articleTitle:'Ler em outro idioma',demo:'DEMONSTRAÇÃO',source:'Fonte original',unavailable:'—',disclaimerDemo:'Exemplo editorial para testar a interface. Não representa uma notícia real, frete ou vaga disponível.',published:'Publicado',updated:'Verificado',ad:'Publicidade',dataMissing:'Aguardando dados verificados. Sem cotações fictícias.',showing:'matéria(s)', noResults:'Nenhuma matéria encontrada.', archive:'Arquivo de demonstração'},
    en: { panorama:'Featured',news:'News',market:'Quotes & Markets',all:'All',prev:'← Previous',next:'Next →',search:'Search headlines, topics or sources...',filters:'All sections',allDates:'Entire archive',d2:'Today and yesterday',d7:'Last 7 days',d30:'Last 30 days',articleTitle:'Read in another language',demo:'DEMONSTRATION',source:'Original source',unavailable:'—',disclaimerDemo:'Editorial demo to test the interface. It is not a real news report or available load/job.',published:'Published',updated:'Verified',ad:'Advertisement',dataMissing:'Waiting for verified data. No invented quotes.',showing:'story/stories',noResults:'No matching stories.', archive:'Demonstration archive'},
    es: { panorama:'Destacadas',news:'Noticias',market:'Cotizaciones y Mercado',all:'Todas',prev:'← Anterior',next:'Siguientes →',search:'Buscar titulares, temas o fuentes...',filters:'Todas las secciones',allDates:'Todo el archivo',d2:'Hoy y ayer',d7:'Últimos 7 días',d30:'Últimos 30 días',articleTitle:'Leer en otro idioma',demo:'DEMOSTRACIÓN',source:'Fuente original',unavailable:'—',disclaimerDemo:'Ejemplo editorial para probar la interfaz. No representa una noticia real ni una carga o empleo disponible.',published:'Publicado',updated:'Verificado',ad:'Publicidad',dataMissing:'A la espera de datos verificados. Sin cotizaciones inventadas.',showing:'noticia(s)',noResults:'No se encontraron noticias.', archive:'Archivo de demostración'}
  };
  const catLabels = {
    'Transporte':['Transporte','Transportation','Transporte'],'Combustíveis':['Combustíveis','Fuel','Combustibles'],'Acidentes':['Acidentes','Accidents','Accidentes'],'Clima':['Clima','Weather','Clima'],'Rodovias':['Rodovias','Highways','Carreteras'],'Fiscalização':['Fiscalização','Enforcement','Fiscalización'],'Tecnologia':['Tecnologia','Technology','Tecnología'],'Fretes':['Fretes','Freight','Cargas'],'Empregos':['Empregos','Jobs','Empleos'],'Caminhões':['Caminhões','Trucks','Camiones'],'Mecânica':['Mecânica','Mechanics','Mecánica'],'Caminhoneiros':['Caminhoneiros','Drivers','Camioneros'],'Socorro':['Socorro','Roadside Assistance','Auxilio'],'Negócios':['Negócios','Business','Negocios'],'Governo':['Governo','Government','Gobierno'],'Imigração':['Imigração','Immigration','Inmigración'],'Segurança':['Segurança','Security','Seguridad']
  };
  const langs=['pt','en','es'], indices={pt:0,en:1,es:2};
  // Display variants are regional; internal content keys stay pt/en/es.
  const readerLocales={pt:'pt-BR',en:'en-US',es:'es-419'};
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
  // Editorial archive rule: only attributed local licensed photos; never
  // present an illustrative archive image as a verified scene of an incident.
  // A photo may recur, but NEVER within the preceding 20 cards.
  const validArchivePhoto=p=>p&&safeNewsPhotoUrl(p.image)&&
    safeUrl(p.image_source_url)&&Boolean(p.image_credit&&p.image_license);
  const photoTopics={
    Rodovias:'road highway rodovia interstate caminhão truck parking',
    Caminhoneiros:'truck trucking caminhoneiro motorista driver cdl',
    Fretes:'freight shipping cargo container port truck logistics',
    Fiscalização:'fmcsa inspection highway safety truck cdl',
    Segurança:'road highway truck safety rodovia',
    Clima:'road highway interstate rodovia estrada',
    Empregos:'driver truck cdl training caminhoneiro',
    Caminhões:'truck class 8 caminhão diesel',
    Tecnologia:'autonomous technology truck transport',
    Transporte:'transport truck trucking highway',
    Combustíveis:'diesel fuel truck',
    Acidentes:'road highway truck rodovia estrada',
    Negócios:'freight warehouse logistics cargo truck'
  };
  const normPhotoText=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function storyGraphic(a){
    if(a.editorial_type==='operational_bulletin'){
      // Visual identification, never a simulated event photo, official NWS logo,
      // radar map, actual road closure or invented weather observation.
      const enTitle=String(localeOf(a,'en')?.title||localeOf(a)?.title||'');
      const title=cleanHeadline(localeOf(a)?.title||'');
      const place=(title.split('—').slice(1).join('—').trim()||title).slice(0,39);
      const category=/tornado/i.test(enTitle)?'TORNADO':
        /blizzard|winter storm|ice storm|snow|snowstorm/i.test(enTitle)?'NEVE E GELO':
        /flood|storm surge/i.test(enTitle)?'INUNDAÇÃO':
        /wind|hurricane|tropical storm/i.test(enTitle)?'VENTOS FORTES':'CLIMA';
      const xml=t=>String(t||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
      const cloud='<path d="M-91 28h173c28 0 50-22 50-49s-20-46-43-49c-10-41-46-70-89-70-45 0-83 34-91 76-27-3-51 18-51 46 0 26 22 46 51 46Z" fill="#f8fcff" stroke="#5088a9" stroke-width="13"/>';
      const eventSymbol=category==='NEVE E GELO'
        ?'<path d="M-50 69v70m-32-35h64m-54-23 44 46m0-46-44 46" stroke="#2784c0" stroke-width="9" stroke-linecap="round"/>'
        :category==='TORNADO'
        ?'<path d="M-69 69h130m-105 18h83m-58 18h37m-20 18h11" stroke="#2784c0" stroke-width="10" stroke-linecap="round"/>'
        :'<path d="M-68 83l-19 42m91-42-19 42m92-42-19 42" stroke="#2784c0" stroke-width="11" stroke-linecap="round"/>';
      const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540" role="img">'+
        '<desc>'+xml(String(a.id||'')+' · '+title+' · ilustração editorial, não foto do evento')+'</desc>'+
        '<rect width="960" height="540" rx="18" fill="#eaf5fb"/>'+
        '<rect x="0" y="0" width="960" height="10" fill="#1174b2"/>'+
        '<rect x="45" y="53" width="292" height="45" rx="9" fill="#d6eafb"/>'+
        '<text x="61" y="83" font-size="22" font-weight="700" font-family="Arial,sans-serif" fill="#17628f">NWS  ·  BOLETIM OFICIAL</text>'+
        '<text x="48" y="189" font-size="48" font-weight="700" font-family="Arial,sans-serif" fill="#113f62">'+xml(category)+'</text>'+
        '<path d="M48 218h462" stroke="#9cc4da" stroke-width="3"/>'+
        '<text x="48" y="289" font-size="35" font-family="Arial,sans-serif" fill="#174963">'+xml(place)+'</text>'+
        '<text x="48" y="353" font-size="21" font-family="Arial,sans-serif" fill="#5c7a8d">Aviso meteorológico · fonte original NWS</text>'+
        '<g transform="translate(749 250)">'+cloud+eventSymbol+'</g>'+
        '<path d="M48 450H912" stroke="#bdd8e8" stroke-width="3"/>'+
        '<text x="48" y="498" font-size="23" font-family="Arial,sans-serif" fill="#2c6285">CONDIÇÕES REAIS DA RODOVIA: VERIFIQUE DOT / 511</text>'+
        '</svg>';
      return 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg);
    }
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
  const PHOTO_REUSE_GAP=20;
  let visualCacheKey='',visualCache=new Map();
  function storyVisuals(){
    // Assign archive photos in the ACTUAL DOM card order, not publication order.
    // Hero + related render first, followed by latest-news feed, then focus list.
    // The previous assignment followed pageStories() but the feed is separately
    // chronological; that allowed photo reuse inside 20 visibly adjacent cards.
    const all=pageStories(),featured=articlesFiltered();
    const hero=featured[featurePage*featureSize]||featured[0];
    const related=featured.slice(featurePage*featureSize+1,featurePage*featureSize+4);
    const reserved=new Set([hero,...related].filter(Boolean).map(a=>a.id));
    const shortlist=featured.filter(a=>!reserved.has(a.id)).slice(0,5);
    shortlist.forEach(a=>reserved.add(a.id));
    const time=a=>{const t=Date.parse(a.published_at||'');return Number.isFinite(t)?t:Number.NEGATIVE_INFINITY;};
    const feed=all.filter(a=>matches(a)&&!reserved.has(a.id)).sort((a,b)=>time(b)-time(a)||String(a.id||a.source_url||'').localeCompare(String(b.id||b.source_url||'')));
    const pageIndex=Math.min(page,Math.max(0,Math.ceil(feed.length/pageSize)-1));
    const visible=[hero,...related,...feed.slice(pageIndex*pageSize,(pageIndex+1)*pageSize),...shortlist].filter(Boolean);
    const visibleIds=new Set(visible.map(a=>a.id));
    const stories=[...visible,...all.filter(a=>!visibleIds.has(a.id))];
    const key=stories.map(a=>(a.id||a.source_url)+'|'+(licensedPhotoOf(a)?.image||a.image||'')).join('~')+'#'+photoLibrary.length+'#'+lang;
    if(key===visualCacheKey)return visualCache;
    const recent=new Map(),map=new Map();
    const curated=photoLibrary.filter(validArchivePhoto);
    for(const [index,a] of stories.entries()){
      const direct=licensedPhotoOf(a);
      const credited=a.kind!=='external_link'&&a.image_license&&a.image_credit&&
        (safeNewsPhotoUrl(a.image)||safeUrl(a.image))&&safeUrl(a.image_source_url||a.image);
      const primary=direct||(credited?{
        image:a.image,image_credit:a.image_credit,image_license:a.image_license,
        image_source_url:a.image_source_url||a.image,image_alt:a.image_alt||'Fotografia ilustrativa de arquivo'
      }:null);
      const allowed=p=>validArchivePhoto(p)&&
        (recent.get(p.image)===undefined||index-recent.get(p.image)>PHOTO_REUSE_GAP);
      let chosen=allowed(primary)?primary:null;
      if(!chosen){
        const candidates=a.editorial_type==='operational_bulletin'
          ?curated.filter(p=>(p.keywords||[]).some(k=>/road|highway|interstate|rodovia|estrada/i.test(k)))
          :curated;
        const title=normPhotoText(
          (photoTopics[a.category]||photoTopics.Transporte)+' '+
          (localeOf(a,'pt')?.title||localeOf(a)?.title||''));
        const ranked=candidates.filter(allowed).map((p,i)=>{
          const keywords=(p.keywords||[]).filter(k=>normPhotoText(k).length>2);
          const relevance=keywords.reduce((n,k)=>n+(title.includes(normPhotoText(k))?1:0),0);
          return {p,relevance,i};
        }).sort((x,y)=>y.relevance-x.relevance||x.i-y.i);
        chosen=ranked[0]?.p||null;
      }
      if(chosen)recent.set(chosen.image,index);
      map.set(a.id,chosen);
    }
    visualCacheKey=key;visualCache=map;return map;
  }
  function displayedPhotoOf(a){return storyVisuals().get(a.id)||null;}
  function imageOf(a){return displayedPhotoOf(a)?.image||storyGraphic(a);}
  function imageHTML(a,suffix=''){
    const url=imageOf(a),fallback=storyGraphic(a),graphic=url.startsWith('data:image/svg');
    const photo=displayedPhotoOf(a),illustrative=Boolean(photo)||graphic||a.image_context==='illustrative_archive';
    const alt=a.editorial_type==='operational_bulletin'&&!graphic
      ?(lang==='pt'?'Fotografia ilustrativa de rodovia; não retrata o evento meteorológico informado':lang==='es'?'Fotografía ilustrativa de carretera; no representa el evento meteorológico':'Illustrative road archive photograph; not a photo of the reported weather event')
      :graphic?(a.editorial_type==='operational_bulletin'?(lang==='pt'?'Ilustração editorial de rodovia; não retrata o evento meteorológico informado':lang==='es'?'Ilustración de carretera; no representa el evento meteorológico':'Illustrative road graphic; not a depiction of the reported weather event'):(lang==='pt'?'Ilustração editorial desta manchete':lang==='es'?'Ilustración editorial de esta noticia':'Editorial illustration')):
      illustrative?(lang==='pt'?'Fotografia de arquivo ilustrativa; não retrata necessariamente o acontecimento':lang==='es'?'Fotografía de archivo ilustrativa; no representa necesariamente el acontecimiento':'Illustrative archive photograph; not necessarily the reported event'):(a.image_alt||localeOf(a)?.title||'Imagem');
    return '<img loading="lazy" decoding="async" src="'+escapeHTML(url)+'" data-fallback="'+escapeHTML(fallback)+'" alt="'+escapeHTML(alt)+'" title="'+(a.editorial_type==='operational_bulletin'?'Foto ilustrativa de rodovia, não imagem do evento meteorológico':illustrative?'Foto ilustrativa de arquivo':'Imagem licenciada')+'" '+(a.editorial_type==='operational_bulletin'?'data-bulletin="true" ':'')+'onerror="this.onerror=null;this.src=this.dataset.fallback" '+suffix+'>';
  }
  function pageStories(){const pool=[...(data.articles||[]),...externalHeadlines].filter(s=>(s.kind!=='external_link'||s.original_lang===lang||(s.translated_langs?.includes(lang)&&eventFingerprint(s.locales?.[lang]?.title)!==eventFingerprint(s.locales?.[s.original_lang]?.title))) && (s.status==='approved' || (s.kind==='external_link' && s.status==='external_source')) && !s.demo && !blockedPublisher(s.source_url) && (s.kind==='external_link' || ['pt','en','es'].every(l=>s.locales?.[l]?.title && s.locales?.[l]?.body))).sort((a,b)=>{
    const score=x=> x.demo?0:(x.kind==='opportunity' && x.consent_publication && (Date.now()-new Date(x.published_at).getTime())<86400000 ? 3 : 1);
    return score(b)-score(a) || (Date.parse(b.published_at||'2000-01-01')-Date.parse(a.published_at||'2000-01-01'));
  }).filter(a=>a.origin_type!=='aggregator-discovery');
    const unique=[];const seenUrls=new Set(),seenIds=new Set();
    for(const article of pool){
      const title=localeOf(article)?.title||article.locales?.en?.title||'';
      const url=String(article.source_url||'').split('#')[0].replace(/\/$/,'').toLowerCase();
      if((article.id&&seenIds.has(article.id))||(url&&seenUrls.has(url)))continue;
      if(unique.some(previous=>duplicateEvent(title,localeOf(previous)?.title||previous.locales?.en?.title||'')))continue;
      unique.push(article);if(article.id)seenIds.add(article.id);if(url)seenUrls.add(url);
    }
    return unique;
  }
  function matches(a){
    const q=$('search').value.toLocaleLowerCase(lang).trim(), age=$('age').value;
    if(selected!=='Todas' && a.category!==selected)return false;
    if(age!=='all' && !a.demo && a.published_at){const ms=Date.now()-Date.parse(a.published_at);if(ms>Number(age)*86400000)return false;}
    const t=Object.values(a.locales).flatMap(v=>[v.title,v.summary,v.body]).join(' ') + ' '+a.category+' '+a.source;
    return !q||t.toLocaleLowerCase(lang).includes(q);
  }
  function articlesFiltered(){
    // Show only verified locale headlines; untranslated source headlines stay off this edition.
    const pool=pageStories().filter(a=>matches(a));
    // Prefer recent verified publisher reporting over old feature stories.
    // Dates remain intact; only display order changes.
    const nowTime=Date.now();
    const recent=a=>a.kind==='external_link'&&a.editorial_type!=='operational_bulletin'&&
      Number.isFinite(Date.parse(a.published_at))&&nowTime-Date.parse(a.published_at)<24*3600000;
    // Keep up to the newest verified publisher items visible together,
    // rather than burying a second real report behind older editorials.
    pool.sort((a,b)=>Number(recent(b))-Number(recent(a)));
    const lead=pool.findIndex(recent);
    if(lead>0)pool.unshift(pool.splice(lead,1)[0]);
    // The original publication time remains intact and is used within each
    // editorial category. But a cluster of government alerts must not swallow
    // the newspaper's lead stories merely by being issued minutes apart.
    const isBulletin=a=>a.editorial_type==='operational_bulletin';
    // Weather notices remain in the ticker, list and related rail. The main
    // newspaper feature opens with an independently sourced transport story
    // when at least one is eligible for the current reader filters.
    const firstJournalism=pool.findIndex(a=>!isBulletin(a));
    if(firstJournalism>0)pool.unshift(pool.splice(firstJournalism,1)[0]);
    const result=[],remaining=pool.slice();
    while(remaining.length){
      const last=result[result.length-1];
      const previousTwo=result.slice(-2);
      const mustSeparateBulletins=previousTwo.some(isBulletin)&&remaining.some(a=>!isBulletin(a));
      let idx=remaining.findIndex(a=>
        (!mustSeparateBulletins||!isBulletin(a)) &&
        (!last||a.category!==last.category) &&
        (!last||a.source!==last.source));
      if(idx<0)idx=remaining.findIndex(a=>
        (!mustSeparateBulletins||!isBulletin(a))&&
        (!last||a.category!==last.category));
      if(idx<0)idx=remaining.findIndex(a=>!mustSeparateBulletins||!isBulletin(a));
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
  function renderStories(){const f=articlesFiltered();
    const all=pageStories(); indexSet.clear();all.forEach((a,i)=>indexSet.set(a.id,i));
    // The arrow/dot carousel changes the hero image/headline only.
    // The three "Leia Também" stories remain fixed across hero navigation.
    const n=Math.max(1,Math.min(5,Math.ceil(f.length/featureSize)));
    featurePage=Math.min(featurePage,n-1);
    const hero=f[featurePage*featureSize]||f[0];
    const related=f.slice(featurePage*featureSize+1,featurePage*featureSize+4);
    const relatedTitle=lang==='pt'?'Leia também':lang==='es'?'Lea también':'Read also';
    $('features').innerHTML=hero
      ? `<div class="hero-wrap">${storyCard(hero,indexSet.get(hero.id),true,false)}</div>${related.length
        ? `<div class="related-rail" aria-label="${relatedTitle}"><div class="related-head">${relatedTitle}</div>${related.map(a=>storyCard(a,indexSet.get(a.id),true,true)).join('')}</div>` : ''}`
      :`<div class="empty">${labels[lang].noResults}</div>`;
    $('featureCount').textContent=`${featurePage+1} / ${n}`;
    $('featurePrev').disabled=featurePage===0; $('featureNext').disabled=featurePage===n-1;
    const slideLabel=lang==='pt'?'Ir para página':lang==='es'?'Ir a la página':'Go to page';
    // A bounded window keeps the control clickable with 11+ story pages.
    const visibleDots=Math.min(n,7);
    const firstDot=Math.max(0,Math.min(featurePage-Math.floor(visibleDots/2),n-visibleDots));
    $('featureDots').innerHTML=Array.from({length:visibleDots},(_,i)=>{
      const target=firstDot+i;
      return `<button type="button" class="carousel-dot ${target===featurePage?'active':''}" data-slide="${target}" aria-label="${slideLabel} ${target+1} / ${n}" aria-pressed="${target===featurePage}" ${target===featurePage?'aria-current="page"':''}></button>`;
    }).join('');
    // A story appears in exactly one currently visible section.
    // Recompute on every carousel movement: older stories stay below until
    // they are promoted to the visible lead or Read More rail.
    const reserved=new Set([hero,...related].filter(Boolean).map(a=>a.id));
    const shortlist=f.filter(a=>!reserved.has(a.id)).slice(0,5);
    shortlist.forEach(a=>reserved.add(a.id));
    // REGRA EDITORIAL CANÔNICA: a lista Últimas Notícias é estritamente
    // cronológica. Curadoria, diversidade de editorias/fontes e alertas
    // só podem ordenar as seções de Destaques/Em foco.
    // Uma matéria já exibida nessas seções não deve ser repetida na lista.
    const publicationTime=a=>{
      const timestamp=Date.parse(a.published_at||'');
      return Number.isFinite(timestamp)?timestamp:Number.NEGATIVE_INFINITY;
    };
    const feed=pageStories().filter(a=>matches(a)&&!reserved.has(a.id))
      .sort((a,b)=>publicationTime(b)-publicationTime(a)||
        String(a.id||a.source_url||'').localeCompare(String(b.id||b.source_url||'')));
    const pages=Math.max(1,Math.ceil(feed.length/pageSize));page=Math.min(page,pages-1);
    $('list').innerHTML=feed.length?feed.slice(page*pageSize,(page+1)*pageSize).map(a=>storyCard(a,indexSet.get(a.id))).join(''):`<div class="empty">${labels[lang].noResults}</div>`;
    $('count').textContent='';
    $('pagecount').textContent=`${page+1} / ${pages}`;
    $('prev').disabled=page===0; $('next').disabled=page===pages-1;
    $('highlights-title').textContent=lang==='pt'?'Em foco':lang==='es'?'En foco':'In focus';
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
    const historical=key==='brent'&&v.instrument==='brent_eia_reference'&&
      v.session_status==='historical_reference'&&v.quote_status==='historical_reference';
    const maxAge=(historical?21:{usdbrl:5,diesel:12,brent:5}[key])*86400000;
    return age>=-5*60000 && age<=(v.session_status==='open'?5*60000:maxAge);
  }
// MARKET_QUOTE_UI_RELEASE: compact-prices-only-20261013
  function marketValue(v,key){
    const n=Number(v.value).toLocaleString(lang==='pt'?'pt-BR':lang==='es'?'es-US':'en-US',{
      minimumFractionDigits:2,maximumFractionDigits:key==='usdbrl'?4:3});
    const unit=key==='usdbrl'?'R$':'US$';
    const pct=v.change_pct===null||v.change_pct===undefined||v.change_pct===''||!Number.isFinite(Number(v.change_pct))
      ?'':percentBadge(Number(v.change_pct));
    return '<b>'+unit+' '+n+'</b>'+pct;
  }
  function mrow(name,ticker,v,key){
    // Keep all three compact rows, without misleading historical prices.
    const valid=verifiedMarketQuote(v,key)&&!(
      key==='brent'&&v?.quote_status==='historical_reference');
    const detail=valid?
      String(v.source||'')+' · '+String(v.observed_at||'')+' · '+String(v.quote_status||v.session_status||''):
      (lang==='pt'?'Cotação atual não disponível':lang==='es'?'Cotización actual no disponible':'Current quote unavailable');
    const value=valid?marketValue(v,key):'<b>—</b>';
    return '<div class="sideitem market-live-row" data-market-key="'+key+
      '" title="'+escapeHTML(detail)+'"><div><strong>'+escapeHTML(name)+
      '</strong><small>'+escapeHTML(ticker)+'</small></div><div class="value">'+value+
      '<small class="market-asof">'+escapeHTML(detail)+'</small></div></div>';
  }
  function renderMarket(){
    const market=data.market||{},inds={...(market.indicators||{})};
    if(brentRealtime?.instrument==='brent_spot'&&verifiedMarketQuote(brentRealtime,'brent'))
      inds.brent=brentRealtime;
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
    // Provider audit runs behind the UI. Keep the public panel compact.
    $('market-note').textContent='';
    $('market-note-mobile').textContent='';
  }
  document.addEventListener('drivmatch:brent-spot',event=>{
    const quote=event.detail;
    brentRealtime=quote?.instrument==='brent_spot'?quote:null;
    if($('market')&&$('market-mobile'))renderMarket();
  });
  function renderAds(){
    const placements=(data.ads?.enabled&&Array.isArray(data.ads.placements))?data.ads.placements:[];
    const unused=$('ad-slot');if(unused){unused.hidden=true;unused.innerHTML='';}
    const adIdentity=a=>String(a?.campaign_id||data.ads?.campaign_id||
      a?.creative_id||a?.whatsapp_url||a?.url||'').trim().toLowerCase();
    const top=placements.find(a=>a.enabled===true&&a.slot==='news-top');
    const topIdentity=top&&adIdentity(top);
    const translations={
      pt:{label:'PUBLICIDADE · SERVIÇO PRIVADO UCR 2027',wa:'Abrir conversa no WhatsApp',ig:'Enviar mensagem no Instagram',note:'Serviço privado, sem vínculo com o UCR Plan. A partir de US$ 110: confirme taxas oficiais, escopo e condições.',message:'Olá, gostaria de informações sobre o serviço UCR 2027.'},
      en:{label:'ADVERTISEMENT · PRIVATE UCR 2027 SERVICE',wa:'Message us on WhatsApp',ig:'Send an Instagram message',note:'Private service, not affiliated with the UCR Plan. From US$110: verify official fees, scope and terms.',message:"Hello, I'd like information about the UCR 2027 service."},
      es:{label:'PUBLICIDAD · SERVICIO PRIVADO UCR 2027',wa:'Enviar mensaje por WhatsApp',ig:'Enviar mensaje por Instagram',note:'Servicio privado, no afiliado al UCR Plan. Desde US$110: confirme tarifas oficiales, alcance y condiciones.',message:'Hola, quisiera información sobre el servicio UCR 2027.'}
    };
    const copy=translations[lang]||translations.pt;
    // Exact crop windows of the advertiser-approved six-panel master. All
    // language editions share the SAME photo, round UCR seal and artwork.
    const crops={
      pt:{horizontal:{ratio:'681 / 342',size:'317.5% auto',pos:'0% 0%'},square:{size:'454.202% auto',pos:'15.48% 100%'}},
      en:{horizontal:{ratio:'675 / 342',size:'320.3% auto',pos:'46.3% 0%'},square:{size:'454.202% auto',pos:'50.30% 100%'}},
      es:{horizontal:{ratio:'791 / 342',size:'273.3% auto',pos:'100% 0%'},square:{size:'454.202% auto',pos:'85.11% 100%'}}
    };
    for(const [slot,id] of [['news-top','news-commercial-banner'],['market-sidebar','market-commercial-banner'],['article-inline','article-commercial-banner'],['mobile-inline','mobile-commercial-banner'],['news-carhauler','news-carhauler-banner']]){
      const box=$(id);if(!box)continue;
      const ad=placements.find(a=>a.enabled===true&&a.slot===slot&&a.relationship==='owner_promotion');
      if(ad?.creative_type==='ucr-2027-official'){
        const approved=/^https:\/\/cdn\.openart\.ai\/openart-uploads\/production\/attachment-transfers\/[a-f0-9]+\.png$/i.test(ad.master_image||'');
        const dm=ad.url==='https://ig.me/m/fabriciodispatcher';
        const contact=/^https:\/\/wa\.me\/19082913386(?:\?|$)/.test(ad.whatsapp_url||'');
        box.hidden=!(approved&&dm&&contact);
        if(box.hidden){box.innerHTML='';continue;}
        const isWide=slot==='news-top'||slot==='news-carhauler';
        const crop=(crops[lang]||crops.pt)[isWide?'horizontal':'square'];
        const source=escapeHTML(ad.master_image);
        const bg="background-image:url('"+source+"');background-size:"+crop.size+";background-position:"+crop.pos+";";
        const href=escapeHTML('https://wa.me/19082913386?text='+encodeURIComponent(copy.message));
        const ig='https://ig.me/m/fabriciodispatcher';
        // 2026-10-13 owner-requested correction: native 1774x394 images.
        // No letterboxing, CSS stretching or 2:1 crop in the 4.5:1 placement.
        // The right-sidebar square remains the exact original approved master.
        if(slot==='news-carhauler'){
          const edition=lang==='en'?'en':lang==='es'?'es':'pt';
          const img='assets/ads/ucr-2027-'+edition+'-wide-1774x394.webp';
          box.innerHTML='<div class="ucr-ad ucr-native-edition">'+
            '<div class="ucr-ad-disclosure">'+escapeHTML(copy.label)+'</div>'+
            '<div class="ucr-native-banner" data-native-ratio="1774/394">'+
              '<img src="'+img+'" width="1774" height="394" loading="eager" decoding="async" alt="'+escapeHTML('UCR 2027. '+copy.note)+'">'+
              '<a class="ucr-native-hit ucr-native-wa" href="'+href+'" target="_blank" rel="noopener noreferrer sponsored" aria-label="'+escapeHTML(copy.wa)+'"></a>'+
              '<a class="ucr-native-hit ucr-native-ig" href="'+ig+'" target="_blank" rel="noopener noreferrer sponsored" aria-label="'+escapeHTML(copy.ig)+'"></a>'+
            '</div>'+
            '<div class="ucr-native-mobile-actions">'+
              '<a href="'+href+'" target="_blank" rel="noopener noreferrer sponsored">'+escapeHTML(copy.wa)+'</a>'+
              '<a href="'+ig+'" target="_blank" rel="noopener noreferrer sponsored">'+escapeHTML(copy.ig)+'</a>'+
            '</div>'+
            '<p class="ucr-ad-note">'+escapeHTML(copy.note)+'</p></div>';
          continue;
        }
        box.innerHTML='<div class="ucr-ad"><div class="ucr-ad-disclosure">'+escapeHTML(copy.label)+'</div>'+
          '<div class="ucr-frame '+(isWide?'ucr-frame-horizontal':'ucr-frame-square')+'"'+(isWide?' style="aspect-ratio:'+crop.ratio+'"':'')+'>'+
          '<div class="ucr-visual" role="group" aria-label="'+escapeHTML('UCR 2027 — '+copy.note)+'" style="'+bg+'">'+
          '<a class="ucr-hit ucr-wa" href="'+href+'" target="_blank" rel="noopener noreferrer sponsored" aria-label="'+escapeHTML(copy.wa)+'"></a>'+
          '<a class="ucr-hit ucr-ig" href="'+ig+'" target="_blank" rel="noopener noreferrer sponsored" aria-label="'+escapeHTML(copy.ig)+'"></a>'+
          '</div></div><p class="ucr-ad-note">'+escapeHTML(copy.note)+'</p></div>';
        continue;
      }
      // PHOTO 1 — IMMUTABLE, advertiser-approved master. These are literal
      // coordinate windows into the original 1774×887 image, not re-creations.
      if(ad?.creative_type==='carhauler-approved-photo1'){
        const expected='https://cdn.openart.ai/openart-uploads/production/attachment-transfers/9d0e786f0c9e07c6d708a1759af5b9ea1734fb4a210330efaacc9dc317f2437a.png';
        const valid=ad.approved_master===expected&&
          ad.approved_master_sha256==='1bb40335eb3f058eaeae14a011e42f51e8c00194822b942e5c5628c19a88622d'&&
          /^https:\/\/instagram\.com\/fabriciodispatcher\/?$/i.test(ad.url||'')&&
          /^https:\/\/wa\.me\/19082913386(?:\?|$)/.test(ad.whatsapp_url||'');
        box.hidden=!valid;
        if(!valid){box.innerHTML='';continue;}
        // Outside-image localization only. Original English raster pixels stay
        // untouched until the owner approves PT and ES localized new artwork.
        const carLabels={
          pt:{disclosure:'PUBLICIDADE · FRETE DISPONÍVEL PARA TRANSPORTE DE VEÍCULOS',visual:'Arte aprovada: transporte de 3 veículos de Kissimmee, FL, para Miami, FL',wa:'Contato pelo WhatsApp ou mensagem de texto (908) 291-3386'},
          en:{disclosure:'ADVERTISEMENT · AVAILABLE LOAD FOR CAR HAULERS',visual:'Approved artwork: 3 vehicles for transport from Kissimmee, FL, to Miami, FL',wa:'Contact via WhatsApp or text (908) 291-3386'},
          es:{disclosure:'PUBLICIDAD · CARGA DISPONIBLE PARA TRANSPORTISTAS DE VEHÍCULOS',visual:'Arte aprobada: transporte de 3 vehículos de Kissimmee, FL, a Miami, FL',wa:'Contacto por WhatsApp o mensaje de texto (908) 291-3386'}
        };
        const carCopy=carLabels[lang]||carLabels.pt;
        const cuts={
          horizontal:{ratio:'1774 / 394',size:'100% auto',pos:'0% 0%',wa:'left:49.5%;top:79%;width:26.5%;height:20%',ig:'left:76%;top:79%;width:24%;height:20%'},
          rectangle:{ratio:'1009 / 361',size:'175.82% auto',pos:'87.32% 85.36%',wa:'left:46%;top:78%;width:29%;height:22%',ig:'left:75%;top:78%;width:25%;height:22%'},
          square:{ratio:'540 / 376',size:'328.52% auto',pos:'4.46% 87.08%',wa:'left:2%;top:86%;width:57%;height:14%',ig:'left:60%;top:86%;width:40%;height:14%'}
        };
        const renderCut=fmt=>{
          const v=cuts[fmt];
          // Use only owner-approved raster files from our own origin.
          // Never substitute a generated asset unless the build verified its SHA-256.
          const loc=data.ads?.approved_localized_creatives?.[lang];
          const localized=fmt==='horizontal'&&slot==='news-top'&&
            (lang==='pt'||lang==='es')&&loc?.status==='published_locked'&&
            loc.asset==='assets/ads/carhauler-photo1-'+lang+'-approved-20261013.png';
          const localArt=localized?loc.asset:'assets/ads/carhauler-photo1-'+fmt+'.png';
          const ratio=localized?'3 / 1':v.ratio;
          const style="background-image:url('"+escapeHTML(localArt)+"');background-size:100% 100%;background-position:0 0;";
          return '<div class="car-official-frame car-official-'+fmt+(localized?' car-official-localized':'')+'" style="aspect-ratio:'+ratio+'" data-art-locale="'+(localized?lang:'en')+'">'+
            '<div class="car-official-visual" role="group" aria-label="'+escapeHTML(carCopy.visual)+'" style="'+style+'">'+
            '<a class="car-official-hit car-official-wa" href="'+escapeHTML(ad.whatsapp_url)+'" target="_blank" rel="noopener noreferrer sponsored" style="'+v.wa+'" aria-label="'+escapeHTML(carCopy.wa)+'"></a>'+
            '<a class="car-official-hit car-official-ig" href="'+escapeHTML(ad.url)+'" target="_blank" rel="noopener noreferrer sponsored" style="'+v.ig+'" aria-label="Instagram @fabriciodispatcher"></a>'+
            '</div></div>';
        };
        const fmt=slot==='article-inline'?'rectangle':'horizontal';
        box.innerHTML='<div class="car-official-ad" data-approved-photo1-sha256="'+ad.approved_master_sha256+'">'+
          '<div class="car-official-disclosure">'+escapeHTML(carCopy.disclosure)+'</div>'+
          renderCut(fmt)+renderCut('square')+'</div>';
        continue;
      }
      box.hidden=true;box.innerHTML='';

    }
    // CLASSIFIED LOCK: new ad belongs AFTER the UCR square, not inside or
    // in place of the approved UCR/car-hauler creatives.
    const driverBox=$('market-driver-availability-banner');
    if(driverBox){
      driverBox.hidden=true;driverBox.innerHTML='';
      const driver=(data.ads?.placements||[]).find(p=>
        p.slot==='market-sidebar-driver'&&p.enabled===true&&
        p.relationship==='third_party_classified'&&
        p.creative_type==='approved-driver-poster-original');
      const art='assets/ads/aileen-souza-motorista-disponivel-original.jpg';
      const wa='https://wa.me/14072852874';
      const valid=driver&&driver.image===art&&
        driver.approved_original_sha256==='191ab228dd8bf894e8ab4ff3585fd372eca9fff83c38cb8901a754afa66d1bc5'&&
        driver.whatsapp_url===wa&&driver.phone_display==='(407) 285-2874';
      if(valid){
        const label=lang==='en'?'ADVERTISEMENT · DRIVER AVAILABLE':
          lang==='es'?'PUBLICIDAD · CONDUCTORA DISPONIBLE':'PUBLICIDADE · MOTORISTA DISPONÍVEL';
        driverBox.innerHTML='<div class="dm-driver-ad-label">'+escapeHTML(label)+'</div>'+
          '<div class="dm-driver-visual">'+
            '<a class="dm-driver-poster-open" href="'+art+'" target="_blank" rel="noopener noreferrer sponsored" aria-label="Ampliar anúncio original de Aileen Souza">'+
              '<img src="'+art+'" width="1229" height="1536" alt="Anúncio original enviado por Aileen Souza: motorista disponível, início imediato, informações profissionais e contato WhatsApp (407) 285-2874." decoding="async">'+
            '</a>'+
            '<a class="dm-driver-whatsapp-hotspot" href="'+wa+'" target="_blank" rel="noopener noreferrer sponsored" aria-label="Conversar com Aileen Souza no WhatsApp: (407) 285-2874" title="WhatsApp: (407) 285-2874"></a>'+
          '</div>';
        const img=driverBox.querySelector('.dm-driver-poster-open img');
        if(img){
          const check=()=>{if(img.isConnected)driverBox.hidden=!(img.naturalWidth>0&&img.naturalHeight>0);};
          img.addEventListener('load',check,{once:true});
          img.addEventListener('error',()=>{if(img.isConnected){driverBox.hidden=true;driverBox.innerHTML='';}},{once:true});
          if(img.complete)check();
        }
      }
    }
  }
  // This is the live GitHub Pages share host; custom-domain /news/share routing is not yet verified.
  // Social platforms require our own crawlable Open Graph page, never an RSS redirect.
  const shareUrlOf = a => 'https://handsondispatcher.github.io/drivmatch-news/share/'+encodeURIComponent(a.id)+'/?v=og-photo-top-no-cta-20261013-r4';
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
  // Headline-only publishers have not provided a licensed, verified full-text translation.
  // Provide a useful FIRST-PARTY brief in the chosen language without inventing facts.
  // Dispatch Desk reader perspectives: structured editorial analysis takes
  // precedence; otherwise show clearly labeled professional checkpoints.
  let impactAudience='driver';
  const impactPrompts={
    pt:{driver:{Clima:'Consulte NWS e DOT antes de definir saída, parada ou desvio.',Rodovias:'Confirme restrições e condições oficiais da rota antes de dirigir.',Fiscalização:'Confira regras aplicáveis, CDL, documentos e datas oficiais.',Combustíveis:'Compare o custo real de combustível da viagem; não presuma uma tarifa.',Acidentes:'Cheque interdições e alternativas nas autoridades de tráfego.',Mecânica:'Avalie inspeções e manutenção com profissional qualificado.',Fretes:'Verifique se a mudança afeta a disponibilidade da sua viagem ou equipamento.'},dispatcher:{Clima:'Verifique risco climático, ETA, avisos ao broker e alternativas com o motorista.',Rodovias:'Confirme restrições de rota, ETA, comunicação com broker e shipper.',Fiscalização:'Confira impacto em documentação, compliance e elegibilidade da operação.',Combustíveis:'Reavalie cotação e margem usando valores atuais, sem supor aumento de preço.',Acidentes:'Valide eventuais bloqueios e atualize ETA somente com informação confirmada.',Mecânica:'Considere disponibilidade do equipamento, atendimento, ETA e comunicação.',Fretes:'Compare capacidade, taxas e disponibilidade por lane/equipamento antes de negociar.'}},
    en:{driver:{Clima:'Verify NWS and state DOT advisories before departure or detours.',Rodovias:'Check official route conditions and restrictions before driving.',Fiscalização:'Verify applicable rules, CDL, documents and effective dates.',Combustíveis:'Check your actual trip fuel cost; do not assume a rate change.',Acidentes:'Check official closures and alternate routes.',Mecânica:'Confirm inspections and maintenance with qualified professionals.',Fretes:'Check whether this may affect your lane or equipment availability.'},dispatcher:{Clima:'Check weather exposure, ETA and broker/driver communications.',Rodovias:'Confirm route restrictions, ETA and shipper/broker updates.',Fiscalização:'Check documentation, compliance and carrier eligibility.',Combustíveis:'Review current cost and margins before repricing.',Acidentes:'Verify closures before changing ETA or commitments.',Mecânica:'Review equipment availability, assistance, ETA and communication.',Fretes:'Compare lane rates and capacity with current verified data.'}},
    es:{driver:{Clima:'Consulte NWS y DOT antes de salir o desviarse.',Rodovias:'Confirme rutas y restricciones oficiales.',Fiscalização:'Compruebe normas, CDL y documentos vigentes.',Combustíveis:'Calcule los costos reales de combustible.',Acidentes:'Consulte cierres y desvíos oficiales.',Mecânica:'Verifique el mantenimiento con técnicos cualificados.',Fretes:'Compruebe condiciones de la ruta y disponibilidad del equipo.'},dispatcher:{Clima:'Revise clima, ETA y comunicación con broker y conductor.',Rodovias:'Confirme restricciones, ETA y avisos al broker.',Fiscalização:'Compruebe documentos y cumplimiento normativo.',Combustíveis:'Revise márgenes con cifras verificadas.',Acidentes:'Confirme cierres antes de cambiar ETA.',Mecânica:'Revise disponibilidad, asistencia y ETA.',Fretes:'Compare tarifas y capacidad verificadas por ruta.'}}
  };
  function renderImpact(){
    if(!opened)return;
    const language=articleLang,persona=impactAudience;
    const headline=cleanHeadline(localeOf(opened,language)?.title||'');
    const byLanguage=opened.professional_impact?.[persona];
    const verifiedText=typeof byLanguage==='string'?byLanguage:byLanguage?.[language];
    const isExternal=opened.kind==='external_link';
    const road=['Acidentes','Rodovias','Clima'].includes(opened.category);
    const body=String(localeOf(opened,language)?.summary||localeOf(opened,language)?.body||'').trim().slice(0,380);
    const headlineLead=language==='en'?'Story: “'+headline+'”.':language==='es'?'Noticia: «'+headline+'».':'Notícia: “'+headline+'”.';
    const professional=impactPrompts[language]?.[persona]?.[opened.category]||'';
    const roadCheck=language==='en'
      ?(persona==='driver'?'If your trip includes the location named in the report, check the relevant state DOT/511 for current route advisories before leaving or detouring.':'If a dispatched load uses the location named, verify official road status before changing ETA or advising the driver or broker.')
      :language==='es'
      ?(persona==='driver'?'Si pasa por el lugar mencionado, consulte las alertas oficiales del DOT/511 antes de salir o desviarse.':'Si una carga pasa por esa zona, verifique las alertas oficiales del DOT/511 antes de cambiar el ETA o avisar al broker.')
      :(persona==='driver'?'Se a sua viagem passa pelo local citado, consulte o DOT/511 estadual para verificar a situação atual antes de sair ou desviar.':'Se uma carga passa pelo local citado, consulte o DOT/511 antes de alterar o ETA ou orientar motorista e broker.');
    const uncertainty=language==='en'
      ?'The source headline alone does not establish any road closure, diversion or delay.'
      :language==='es'
      ?'El titular no confirma un cierre, desvío o retraso de la carretera.'
      :'A manchete não confirma interdição, desvio ou atraso na rodovia.';
    const lack=language==='en'?'No article-specific professional analysis has been verified.':language==='es'?'No se ha verificado un análisis profesional específico de esta noticia.':'Não há análise profissional específica desta notícia verificada pela redação; a manchete não confirma impacto específico.';
    const verifiedIntro=language==='en'?'Verified editorial perspective:':language==='es'?'Perspectiva editorial revisada:':'Análise editorial vinculada à matéria:';
    const sourceIntro=language==='en'?'Context limited to the source headline; not a confirmed operational alert.':language==='es'?'Contexto basado solo en el titular; no es una alerta operacional confirmada.':'Contexto limitado à manchete da fonte; não é alerta operacional confirmado.';
    $('article-impact-title').textContent=language==='en'?'Professional perspective':language==='es'?'Impacto profesional':'Impacto na profissão';
    $('article-impact-note').textContent=verifiedText?verifiedIntro:isExternal?sourceIntro:lack;
    const paragraphs=[headlineLead];
    if(!isExternal&&body)paragraphs.push(body);
    paragraphs.push(road?roadCheck:(professional||lack));
    if(road)paragraphs.push(uncertainty);
    if(isExternal)paragraphs.push(lack);
    $('article-impact-text').textContent=verifiedText||paragraphs.filter(Boolean).join('\n\n');
  }
  function renderArticle(){if(!opened)return;const txt=localeOf(opened,articleLang), cat=catLabels[opened.category]?.[indices[articleLang]]||opened.category;const al=labels[articleLang];
    const storyPhoto=displayedPhotoOf(opened);
    $('modalimg').src=imageOf(opened);$('modalimg').onerror=()=>{$('modalimg').onerror=null;$('modalimg').src=storyGraphic(opened);};$('modalimg').alt=storyPhoto?.image_alt||opened.image_alt||txt.title;$('modalkicker').textContent=cat+(opened.kind==='opportunity'?' · DrivMatch':'');
    $('modaltitle').textContent=cleanHeadline(txt.title);
    $('modaltitle').classList.remove('headline-expanded');
    $('modaltitle').setAttribute('title',cleanHeadline(txt.title));
    $('modaltitle').setAttribute('tabindex','0');
    $('modaltitle').setAttribute('aria-label',cleanHeadline(txt.title)+
      (articleLang==='pt'?'. Toque para ler o título completo.':articleLang==='es'?'. Toca para expandir el título.':'. Tap to expand the headline.'));
    const publishTime=Date.parse(opened.published_at||'');
    const shownDate=Number.isFinite(publishTime)
      ? new Date(publishTime).toLocaleString(lang==='pt'?'pt-BR':lang==='es'?'es-MX':'en-US',{dateStyle:'short',timeStyle:'short'})
      : String(opened.published_at||'');
    $('modalmeta').textContent=opened.demo?al.demo:opened.published_at?`${al.published}: ${shownDate}`:'';
    const isExternal=opened.kind==='external_link';
    if(isExternal)$('article-dialog').classList.add('external-article');
    else $('article-dialog').classList.remove('external-article');
    // Third-party headline links are not DrivMatch-authored article bodies.
    // Do not fabricate a summary, and never show a headline echo as article text.
    $('modalbodytext').textContent=isExternal?'':(txt.body||txt.summary||'');
    $('modalbrief').textContent='';
    $('article-disclosure').textContent=opened.demo?al.disclaimerDemo:
      opened.kind==='opportunity'?'Oportunidade do ecossistema DrivMatch. Verifique requisitos e validade na publicação original.':'';
    const src=safeUrl(opened.source_url);
    // Publisher source-language links are distinct from the article headline
    // selector. Website translation is best-effort: publishers may prohibit proxy
    // access; never present a Google News RSS redirect as the original report.
    const originalSourceLang=langs.includes(opened.original_lang)?opened.original_lang:'en';
    const publisherIsAggregator=/^https:\/\/(?:news\.google\.com|www\.google\.com)\//i.test(src)||
      opened.origin_type==='aggregator-discovery';
    const targetLocale={pt:'pt',en:'en',es:'es'};
    const interfaceLocale={pt:'pt-BR',en:'en-US',es:'es-419'};
    const translatedUrl=target=>{
      if(!src)return '';
      if(target===originalSourceLang||publisherIsAggregator)return src;
      return 'https://translate.google.com/translate?sl='+encodeURIComponent(originalSourceLang)+
        '&tl='+encodeURIComponent(targetLocale[target])+
        '&hl='+encodeURIComponent(interfaceLocale[target])+'&u='+encodeURIComponent(src);
    };
    const sourceLink=(target,primary=false)=>{
      const text={pt:'Português',en:'English',es:'Español'}[target];
      const url=translatedUrl(target);
      const title=target===originalSourceLang?'Abrir texto original':
        publisherIsAggregator?'Abrir fonte no navegador para usar a tradução integrada':
          'Solicitar tradução da página ao serviço externo; disponibilidade depende do veículo';
      return '<a class="article-source-button '+(primary?'primary':'secondary')+
        '" href="'+escapeHTML(url)+'" target="_blank" rel="noopener noreferrer" lang="'+interfaceLocale[target]+
        '" aria-label="'+escapeHTML(text+'. '+title)+'"><img src="'+flags[target]+
        '" alt="" width="17" height="12"><span class="source-label-full">'+text+
        '</span><span class="source-label-mobile">'+text+'</span></a>';
    };
    const heading=articleLang==='pt'?'REPORTAGEM COMPLETA NA FONTE':
      articleLang==='es'?'REPORTAJE COMPLETO EN LA FUENTE':'COMPLETE REPORT AT THE SOURCE';
    const sourceNote=articleLang==='pt'
      ?'Se o veículo bloquear a tradução, abra o original no Chrome e use ⋮ → Traduzir.'
      :articleLang==='es'?'Si la traducción falla, abra el original en Chrome y use ⋮ → Traducir.'
      :'If the publisher blocks translation, open the original in Chrome and use ⋮ → Translate.';
    const originalLink=src?'<a class="article-original-link" href="'+escapeHTML(src)+
      '" target="_blank" rel="noopener noreferrer">'+
      (articleLang==='pt'?'Fonte original ↗':articleLang==='es'?'Fuente original ↗':'Original source ↗')+'</a>':'';
    $('article-source').innerHTML=src?'<div class="full-article-heading">'+heading+
      '</div><div class="source-translations">'+langs.map(l=>sourceLink(l,l===articleLang)).join('')+
      '</div><p class="source-access-warning">'+sourceNote+
      '</p><p class="source-access-short">'+sourceNote+'</p>'+originalLink:
      escapeHTML(opened.source||'');
    const attribution=storyPhoto||opened;
    const photoCredit=attribution.image_source_url && safeUrl(attribution.image_source_url)
      ? `<p class="image-credit"><span class="photo-credit-label">${articleLang==='en'?'Illustrative archive photo':articleLang==='es'?'Foto ilustrativa de archivo':'Foto ilustrativa de arquivo'} (não é imagem do acontecimento): </span><a href="${escapeHTML(attribution.image_source_url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(attribution.image_credit||'Wikimedia Commons')}</a> · ${escapeHTML(attribution.image_license||'Licença na fonte')} <span class="photo-transform-note">· corte/redimensionamento</span></p>`:'';
    $('article-source').innerHTML+=photoCredit;
    $('articleLanguageTitle').textContent=lang==='en'?'Article language':lang==='es'?'Idioma de la noticia':'Idioma da notícia';
    $('articleLanguageButtons').innerHTML=langs.filter(l=>opened.locales?.[l]&&(opened.kind!=='external_link'||opened.translated_langs?.includes(l))).map(l=>`<button data-article-lang="${l}" type="button" aria-pressed="${l===articleLang}" class="${l===articleLang?'active':''}"><img src="${flags[l]}" width="17" height="12" alt=""> ${l==='pt'?'Português':l==='en'?'English':'Español'}</button>`).join('');
    $('article-reading').hidden=opened.kind==='external_link'&&(!opened.translated_langs||opened.translated_langs.length<2);
    $('translation').textContent=opened.demo?al.disclaimerDemo:'';
    renderImpact();
    $('share-feedback').textContent='';
    $('share-options').hidden=true;
    $('share-picker-feedback').textContent='';
    $('share-native').setAttribute('aria-expanded','false');
    $('shade').classList.add('open');
  }
  function languageSet(next,rerender=true){if(!langs.includes(next))return;lang=next;document.documentElement.lang=next==='pt'?'pt-BR':next==='es'?'es-419':'en-US';
    document.querySelectorAll('[data-site-lang]').forEach(b=>{b.classList.toggle('selected',b.dataset.siteLang===next);b.setAttribute('aria-pressed',String(b.dataset.siteLang===next));});
    $('language').value=next;$('languageFlag').src=flags[next];$('languageFlag').alt=next==='pt'?'Bandeira do Brasil':next==='en'?'US flag':'Idioma espanhol latino-americano';
    // Flag-button clicks do not fire change on the hidden select automatically.
    // Tell independently initialized quote/weather/video modules to translate too.
    if(typeof CustomEvent==='function')document.dispatchEvent(new CustomEvent('drivmatch:language',{detail:{language:next}}));
    $('share-label').textContent=next==='en'?'Share':next==='es'?'Compartir':'Compartilhar';
    $('share-section-title').textContent=next==='en'?'Share this story':next==='es'?'Comparte esta noticia':'Compartilhe esta notícia';
    $('share-copy').textContent=next==='en'?'Copy link':next==='es'?'Copiar enlace':'Copiar link';
    $('share-whatsapp-copy').textContent=next==='en'?'WhatsApp open? Copy preview link':next==='es'?'¿Ya tienes WhatsApp abierto? Copia el enlace':'WhatsApp aberto? Copiar link com foto';
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
          externalHeadlines=next.headlines.filter(x=>x.geo_scope_verified===true&&x.title&&(x.origin_type!=='aggregator-discovery'||(x.editorial_type==='discovery_link'&&x.source?.startsWith('Google News · ')))&&!/\b(tanzania|tanz[aâ]nia|vietnam|vietnamese|da nang|hanoi)\b/i.test(x.title+' '+Object.values(x.titles||{}).join(' '))&&!/^https:\/\/(?:[a-z0-9-]+\.)*thetrucker\.com(?:[\/:?#]|$)/i.test(x.source_url||'')&&safeUrl(x.source_url)&&!approved.has(x.source_url)&&!seen.has(x.source_url)&&seen.add(x.source_url)).filter((x,i,rows)=>!rows.slice(0,i).some(y=>duplicateEvent(x.titles?.pt||x.title,y.titles?.pt||y.title))&&!data.articles.some(y=>Object.values(y.locales||{}).some(loc=>duplicateEvent(x.titles?.pt||x.title,loc.title)))).slice(0,90).map(x=>({
            id:x.id,kind:'external_link',status:'external_source',demo:false,
            editorial_type:x.editorial_type||'publisher_headline',
            origin_type:x.origin_type||'publisher-feed',
            category:CATS.includes(x.category)?x.category:'Transporte',region:x.region||'US',source:x.source,
            source_url:x.source_url,published_at:x.published_at,original_lang:x.original_lang|| (x.region==='MX'?'es':'en'),image:x.image||'',
            locales:Object.fromEntries(langs.map(l=>[l,{title:cleanHeadline(x.titles?.[l]||x.title),summary:'',body:''}])),translated_langs:Object.keys(x.titles||{})
          }));
        }
      }
      if(photographs.ok){
        const gallery=await photographs.json();
        if(gallery.schema_version===1&&gallery.license_policy==='curated_commons'&&gallery.images&&typeof gallery.images==='object'){
          photoByStory=gallery.images; photoLibrary=Array.isArray(gallery.library)?gallery.library:[]; visualCacheKey='';
        }
      }
      renderStories();
      renderAds(); // Refresh owner-approved banners after content.json updates.
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
    const track=(name,fields)=>window.DrivMatchAnalytics?.track?.(name,fields);
    const storyInfo=story=>({article_id:story?.id,article_category:story?.category,article_source:story?.source});
    const clickArticle=e=>{const item=e.target.closest('[data-story]');if(item){opened=pageStories()[Number(item.dataset.story)];articleLang=lang;if(opened){track('news_article_open',storyInfo(opened));renderArticle();$('article-dialog').scrollTop=0;}return;}const external=e.target.closest('[data-external-url]');if(external&&typeof window.open==='function'){track('news_source_click',storyInfo(opened));window.open(external.dataset.externalUrl,'_blank','noopener,noreferrer');}};
    const shareText=()=>opened?cleanHeadline(localeOf(opened,lang)?.title||'DrivMatch News'):'DrivMatch News';
    // WhatsApp rich cards require a SINGLE, complete HTTPS URL in the message.
    // The crawler builds the photo/headline card from og:image and og:title.
    // Do not prepend a headline, copy a relative route or depend on an app
    // interpreting an extra text fragment before it recognizes the link.
    const whatsappMessage=(_title,url)=>{
      const valid=/^https:\/\/handsondispatcher\.github\.io\/drivmatch-news\/share\/[a-zA-Z0-9-]+\/\?v=[a-zA-Z0-9-]+$/;
      if(!valid.test(url))throw new Error('Invalid absolute WhatsApp preview URL');
      return url;
    };
    const shareOptions=$('share-options');
    const shareDestinations=(title,url)=>({
      whatsapp:(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent||'')?'https://wa.me/?text=':'https://web.whatsapp.com/send?text=')+encodeURIComponent(whatsappMessage(title,url)),
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
      const urls=shareDestinations(shareText(),shareUrlOf(opened));
      shareOptions.querySelectorAll('[data-share-platform]').forEach(a=>{a.href=urls[a.dataset.sharePlatform]||'#';});
    });
    $('share-options-close').addEventListener('click',()=>{shareOptions.hidden=true;$('share-native').setAttribute('aria-expanded','false');$('share-native').focus();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!shareOptions.hidden){shareOptions.hidden=true;$('share-native').setAttribute('aria-expanded','false');e.stopPropagation();}});
    const shareMessage=()=>whatsappMessage(shareText(),shareUrlOf(opened));
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
      try{await copyToClipboard(shareMessage());pickerFeedback.textContent=lang==='en'?'Full HTTPS link copied. Paste it into WhatsApp to display the photo preview.':lang==='es'?'Enlace HTTPS copiado. Pégalo en WhatsApp para mostrar la foto.':'Link HTTPS completo copiado. Cole no WhatsApp para exibir a prévia com foto.';}
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
        try{await navigator.share({url});}catch(e){if(e?.name!=='AbortError')$('share-feedback').textContent=lang==='pt'?'Use uma das opções acima ou copie o link.':'Choose a destination above or copy the link.';}
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
    $('article-source').addEventListener('click',e=>{
      const sourceLink=e.target.closest('a.article-source-button, a.article-original-link');
      if(sourceLink)track('news_source_click',{...storyInfo(opened),
        source_language:sourceLink.lang||opened?.original_lang||'en',
        original:sourceLink.classList.contains('article-original-link')});
    });
    $('share-options').addEventListener('click',e=>{const a=e.target.closest('[data-share-platform]');if(a)track('news_share_click',{...storyInfo(opened),share_platform:a.dataset.sharePlatform});});
    $('list').addEventListener('click',clickArticle);$('features').addEventListener('click',clickArticle);$('highlightList').addEventListener('click',clickArticle);
    const keyArticle=e=>{if(e.key==='Enter'||e.key===' '){const item=e.target.closest('[data-story]');if(item){e.preventDefault();clickArticle({target:item});}}};
    $('list').addEventListener('keydown',keyArticle);$('features').addEventListener('keydown',keyArticle);$('highlightList').addEventListener('keydown',keyArticle);
    const dismissImpact=()=>{$('newsdesk-impact-shade').hidden=true;$('article-impact-actions').querySelector('[data-impact-role="'+impactAudience+'"]')?.focus();};
    $('article-impact-actions').addEventListener('click',e=>{const button=e.target.closest('[data-impact-role]');if(!button)return;impactAudience=button.dataset.impactRole;renderImpact();$('newsdesk-impact-shade').hidden=false;$('newsdesk-impact-close').focus();track('news_impact_view',{...storyInfo(opened),audience:impactAudience});});
    $('newsdesk-impact-close').addEventListener('click',dismissImpact);
    $('newsdesk-impact-shade').addEventListener('click',e=>{if(e.target===$('newsdesk-impact-shade'))dismissImpact();});
    // Long source RSS headlines can be expanded on demand without pushing
    // the translation/share/role actions below the Android viewport.
    const expandHeadline=()=>{
      const title=$('modaltitle');
      title.classList.toggle('headline-expanded');
      title.setAttribute('aria-expanded',String(title.classList.contains('headline-expanded')));
    };
    $('modaltitle').addEventListener('click',expandHeadline);
    $('modaltitle').addEventListener('keydown',e=>{
      if(e.key==='Enter'||e.key===' '){e.preventDefault();expandHeadline();}
    });
    $('articleLanguageButtons').addEventListener('click',e=>{const b=e.target.closest('[data-article-lang]');if(!b)return;articleLang=b.dataset.articleLang;renderArticle();});
    $('shade').addEventListener('click',e=>{if(e.target===$('shade'))closeModal();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('newsdesk-impact-shade').hidden)dismissImpact();else closeModal();}else if(e.key==='Tab'&&!$('newsdesk-impact-shade').hidden){e.preventDefault();$('newsdesk-impact-close').focus();}});
    // v18 uses onclick="closeModal()" on dialog close button.
    const closeModal=()=>{$('newsdesk-impact-shade').hidden=true;$('shade').classList.remove('open');opened=null;};window.closeModal=closeModal;
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
