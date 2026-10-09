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
    Clima:['photo-1534274988757-a28bf1a57c17','photo-1500530855697-b586d89ba3ee','photo-1534088568595-a066f410bcda','photo-1500673922987-e212871fec22','photo-1473448912268-2022ce9509d8','photo-1490750967868-88aa4486c946','photo-1507525428034-b723cf961d3e','photo-1519681393784-d120267933ba','photo-1464822759023-fed622ff2c3b'],
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
    const seed=Array.from(String((a.source_url||'')+'|'+(a.locales?.en?.title||a.locales?.pt?.title||''))).reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,0);
    const categoryIndex=pageStories().filter(story=>story.kind==='external_link'&&story.category===a.category).findIndex(story=>story.id===a.id);
    const photoIndex=categoryIndex>=0?categoryIndex%choices.length:seed%choices.length;
    return 'https://images.unsplash.com/'+choices[photoIndex]+'?auto=format&fit=crop&w=900&q=75';
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
  function articlesFiltered(){
    const pool=pageStories().filter(a=>(a.kind!=='external_link'||(a.translated_langs?.includes(lang)&&a.locales?.[lang]?.title))&&matches(a));
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
  function storyCard(a,i,featured=false){const txt=localeOf(a);const cat=escapeHTML(localizedCategory(a.category));
    if(a.kind==='external_link'){
      const title=escapeHTML(txt?.title||''), url=escapeHTML(safeUrl(a.source_url)||'#'), attribution=escapeHTML(a.source||'');
      const translated=a.translated_langs?.includes(lang);const languageNotice=translated?'':(lang==='pt'?' · Título original sem tradução':lang==='es'?' · Titular original sin traducir':' · Original headline (not translated)');
      const note=(lang==='pt'?'Manchete da fonte · Abrir original ↗':lang==='es'?'Titular de la fuente · Abrir original ↗':'Source headline · Open original ↗')+languageNotice;
      const body=`<div class="kicker">${cat}</div><h3>${title}</h3><div class="byline">${daysLabel(a)} · ${attribution}</div><p>${note}</p>`;
      return featured?`<article class="story" tabindex="0" role="button" data-story="${i}">${imageHTML(a)}<div class="info">${body}</div></article>`:`<article class="item" tabindex="0" role="button" data-story="${i}"><div>${body}</div><div class="thumb">${imageHTML(a)}</div></article>`;
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
  const shareUrlOf = a => a.kind==='external_link' ? safeUrl(a.source_url) : 'https://handsondispatcher.github.io/drivmatch-news/share/'+encodeURIComponent(a.id)+'/';
  function openSharedStory(){
    try {
      const id=new URLSearchParams(location.search).get('story');
      const story=id&&pageStories().find(a=>a.id===id);
      if(story){opened=story;articleLang=lang;renderArticle();$('article-dialog').scrollTop=0;}
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
    $('modalimg').src=imageOf(opened);$('modalimg').alt=opened.image_alt||txt.title;$('modalkicker').textContent=cat+(opened.kind==='opportunity'?' · DrivMatch':'');
    $('modaltitle').textContent=txt.title;$('modalmeta').textContent=opened.demo?al.demo:opened.published_at?`${al.published}: ${opened.published_at}`:'';
    $('modalbodytext').textContent=opened.kind==='external_link'?sourceBrief(opened,articleLang):(txt.body||txt.summary||'');
    $('article-disclosure').textContent=opened.demo?al.disclaimerDemo:
      opened.kind==='opportunity'?'Oportunidade do ecossistema DrivMatch. Verifique requisitos e validade na publicação original.':'';
    const src=safeUrl(opened.source_url);
    // Use the publisher's direct URL as the primary path: Google Translate proxies
    // are frequently blocked by Cloudflare (including The Trucker).
    const googleNews=!!src&&/^https:\/\/news\.google\.com(?:\/|$)/i.test(src);
    const translatedSource=src?langs.map(l=>{
      const label=l==='en'?'Open original article':l==='pt'?'Abrir original • traduzir no navegador':'Abrir original • traducir en navegador';
      return `<a class="article-source-button ${l===lang?'primary':''}" href="${escapeHTML(src)}" target="_blank" rel="noopener noreferrer"><img src="${flags[l]}" width="28" height="19" alt=""><span>${label} ↗</span></a>`;
    }).join(''):'';
    const fullHeading=lang==='en'?'Read the report at the publisher':lang==='es'?'Leer la noticia en el sitio de origen':'CONSULTE A REPORTAGEM NA FONTE';
    const sourceOriginal=lang==='en'?'Original publisher link':lang==='es'?'Enlace original del medio':'Link original da publicação';
    const accessWarning=lang==='en'?'The article opens directly at the publisher. To translate it, use your browser’s Translate page feature. Some publishers block access from certain regions. DrivMatch News cannot mirror full third-party articles without permission.':lang==='es'?'El artículo abre directamente en el sitio original. Para traducirlo, usa Traducir página en tu navegador. Algunos medios bloquean regiones. No republicamos artículos completos sin permiso.':'A notícia abre diretamente no site original. Para ler em português, use Traduzir página no menu do navegador. Alguns veículos bloqueiam regiões; o DrivMatch News não pode copiar matérias integrais sem autorização.';
    const optionalTranslate=src&&!googleNews?'<a class="source-translate-link" href="'+escapeHTML('https://translate.google.com/translate?sl=auto&tl='+encodeURIComponent(lang)+'&u='+encodeURIComponent(src))+'" target="_blank" rel="noopener noreferrer">'+(lang==='pt'?'Tentar Google Tradutor (pode ser bloqueado)':lang==='es'?'Probar Google Traductor (puede bloquearse)':'Try Google Translate (may be blocked)')+' ↗</a>':'';
    $('article-source').innerHTML=src?`<div class="full-article-heading">${fullHeading}</div><div class="source-translations">${translatedSource}</div><p class="source-access-warning">${accessWarning}</p><a class="source-original" href="${escapeHTML(src)}" target="_blank" rel="noopener noreferrer">${sourceOriginal} ↗</a> ${optionalTranslate}`:escapeHTML(opened.source||'');
    const photoCredit=opened.image_source_url && safeUrl(opened.image_source_url)
      ? `<p class="image-credit">Foto ilustrativa: <a href="${escapeHTML(opened.image_source_url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(opened.image_credit||'Wikimedia Commons')}</a> · ${escapeHTML(opened.image_license||'Licença na fonte')}</p>`:'';
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
    $('language').value=next;$('languageFlag').src=flags[next];$('languageFlag').alt=next==='pt'?'Bandeira do Brasil':next==='en'?'US flag':'Bandera de España';
    $('share-label').textContent=next==='en'?'Share':next==='es'?'Compartir':'Compartilhar';
    $('share-section-title').textContent=next==='en'?'Share this story':next==='es'?'Comparte esta noticia':'Compartilhe esta notícia';
    $('share-copy').textContent=next==='en'?'Copy link':next==='es'?'Copiar enlace':'Copiar link';
    $('share-whatsapp-copy').textContent=next==='en'?'WhatsApp Web already open? Copy message to paste in your chat':next==='es'?'¿Ya tienes WhatsApp Web abierto? Copia el mensaje':'Já está no WhatsApp Web? Copiar mensagem para colar na conversa';
    $('share-story-label').textContent=next==='en'?'Story image':next==='es'?'Imagen Story':'Card Stories';
    $('share-system-label').textContent=next==='en'?'Other apps':next==='es'?'Otras apps':'Outros apps';
    $('share-stories-hint').textContent=next==='en'?'Stories: save the image and publish it in your app. Not an automatic post.':next==='es'?'Historias: guarda la imagen y publícala en tu app. No se publica automáticamente.':'Stories: salve a imagem e publique no seu aplicativo. Não há publicação automática em Stories.';
    document.querySelectorAll('.weather-top h2').forEach(h=>h.textContent=next==='en'?'Weather':next==='es'?'Clima':'Clima');
    document.querySelectorAll('.weather-card').forEach(el=>el.setAttribute('aria-label',next==='en'?'Weather':next==='es'?'Clima':'Clima'));
    document.querySelector('.edition').childNodes[0].textContent=(next==='en'?'DIGITAL EDITION':next==='es'?'EDICIÓN DIGITAL':'EDIÇÃO DIGITAL')+' · ';
    $('edition-date').textContent=new Date().toLocaleDateString(next==='en'?'en-US':next==='es'?'es-MX':'pt-BR');
    $('footer-publisher').textContent=next==='en'?'DrivMatch News — A publication of Hands On Dispatcher LLC':next==='es'?'DrivMatch News — Una publicación de Hands On Dispatcher LLC':'DrivMatch News — uma publicação da Hands On Dispatcher LLC';
    $('footer-description').textContent=next==='en'?'US trucking news and US–Canada / US–Mexico freight corridors. Sources and publication dates identified.':next==='es'?'Noticias del transporte por carretera en EE. UU. y corredores de carga con Canadá y México. Fuentes y fechas identificadas.':'Notícias de transporte rodoviário dos EUA e corredores de frete com Canadá e México. Fontes e datas identificadas.';
    $('footer-legal').textContent=next==='en'?'© 2026 Hands On Dispatcher LLC. All rights reserved.':next==='es'?'© 2026 Hands On Dispatcher LLC. Todos los derechos reservados.':'© 2026 Hands On Dispatcher LLC. Todos os direitos reservados.';
    $('story-preview-title').textContent=next==='en'?'Story preview':next==='es'?'Vista previa de Story':'Prévia do Story';
    $('story-preview-download').textContent=next==='en'?'Save PNG image':next==='es'?'Guardar imagen PNG':'Salvar imagem PNG';
    $('story-preview-hint').textContent=next==='en'?'Review the card, then post it to Instagram, TikTok or WhatsApp Status.':next==='es'?'Revisa la imagen y luego publícala en Instagram, TikTok o el estado de WhatsApp.':'Revise o card e depois publique no Instagram, TikTok ou Status do WhatsApp.';
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
          externalHeadlines=next.headlines.filter(x=>x.geo_scope_verified===true&&x.title&&!/\b(tanzania|tanz[aâ]nia|vietnam|vietnamese|da nang|hanoi)\b/i.test(x.title+' '+Object.values(x.titles||{}).join(' '))&&safeUrl(x.source_url)&&!approved.has(x.source_url)&&!seen.has(x.source_url)&&seen.add(x.source_url)).slice(0,90).map(x=>({
            id:'source-'+String(x.source_url).slice(-80),kind:'external_link',status:'external_source',demo:false,
            category:CATS.includes(x.category)?x.category:'Transporte',region:x.region||'US',source:x.source,
            source_url:x.source_url,published_at:x.published_at,original_lang:x.original_lang|| (x.region==='MX'?'es':'en'),image:x.image||'',
            locales:Object.fromEntries(langs.map(l=>[l,{title:x.titles?.[l]||x.title,summary:'',body:''}])),translated_langs:Object.keys(x.titles||{})
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
    const shareOptions=$('share-options');
    const shareDestinations=(title,url)=>({
      whatsapp:(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent||'')?'https://wa.me/?text=':'https://web.whatsapp.com/send?text=')+encodeURIComponent(title+'\n'+url),
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
    const shareMessage=()=>shareText()+'\n'+shareUrlOf(opened);
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
