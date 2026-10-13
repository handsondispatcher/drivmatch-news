/* Runtime smoke test using a tiny DOM stub: no npm installation required. */
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const data={publication_mode:'production',market:{indicators:{},stocks:{}},articles:[{id:'test',status:'approved',demo:false,category:'Combustíveis',source:'Unit test fixture',source_url:'https://example.com',original_lang:'pt',published_at:'2026-10-08T10:00:00Z',locales:{pt:{title:'Como interpretar o preço do diesel',summary:'Teste',body:'O preço do diesel — TEST FIXTURE'},en:{title:'Diesel price test',summary:'Test',body:'TEST FIXTURE'},es:{title:'Precio del diésel',summary:'Prueba',body:'Los precios del diésel — TEST FIXTURE'}}}],ads:{enabled:false}};
const elements={},selectors={};
class Element {
 constructor(id){this.id=id;this.value='';this.innerHTML='';this.textContent='';this.placeholder='';this.dataset={};this.style={};this.disabled=false;this.hidden=false;this._listeners={};this.options=[];}
 addEventListener(event,cb){this._listeners[event]=cb;}
 dispatch(event,arg){if(!this._listeners[event])throw Error('Missing handler '+this.id+'.'+event);this._listeners[event](arg);}
 add(option){this.options.push(option);}
 setAttribute(name,value){this[name]=value;}
 querySelectorAll(){return [];}

 get classList(){return {add(){},remove(){},toggle(){}};}
 focus(){}
 scrollIntoView(){}
}
const ids=['search','age','language','languageFlag','edition-date','category','chips','list','count','pagecount','prev','next','features','featureCount','featurePrev','featureNext','featureDots','highlights','highlights-title','highlights-note','highlightList','newsroom-section-label','newsroom-section-desc','newsroom-cta-eyebrow','newsroom-cta-title','newsroom-cta-desc','newsroom-cta-driver','newsroom-cta-carrier','market','market-note','news-freshness','market-mobile','market-note-mobile','market-title-mobile','ad-slot','news-commercial-banner','market-commercial-banner','modalimg','modalkicker','modaltitle','modalmeta','modalbodytext','modalbrief','article-disclosure','article-source','articleLanguageTitle','articleLanguageButtons','share-whatsapp','share-copy','share-native','share-label','share-section-title','share-feedback','share-options','share-options-close','share-system','share-system-label','share-story','share-story-label','share-whatsapp-copy','share-stories-hint','share-picker-feedback','article-reading','article-impact-actions','article-impact-title','article-impact-note','article-impact-text','newsdesk-impact-shade','newsdesk-impact-close','article-dialog','translation','shade','noticias','footer-publisher','footer-legal','story-preview','story-preview-image','story-preview-download','story-preview-close','story-preview-title','story-preview-hint'];
for(const id of ids)elements[id]=new Element(id);
elements['newsdesk-impact-shade'].hidden=true;
for(const id of ['panorama .heading','noticias .heading','market-title','.demo'])selectors['#'+id]=new Element(id);
selectors['.demo']=new Element('demo');
selectors['.newsroom-nav']=new Element('newsroom-nav');
selectors['.edition']=new Element('edition');selectors['.edition'].childNodes=[{textContent:'EDIÇÃO DIGITAL · '}];
selectors['.weather-top h2']=[new Element('weather-head-1'),new Element('weather-head-2')];selectors['.weather-card']=[new Element('weather-card-1'),new Element('weather-card-2')];
elements.age.value='all';elements.category.options=[new Element('all')];elements.category.options[0].value='Todas';elements.age.options=['all','2','7','30'].map(v=>({value:v,text:''}));
const document={documentElement:{lang:''},getElementById:id=>elements[id]||(()=>{throw Error('Missing id: '+id)})(),
 querySelector:key=>selectors[key]||(()=>{throw Error('Missing selector: '+key)})(),
 querySelectorAll:key=>selectors[key]||[],
 addEventListener(event,cb){if(event==='DOMContentLoaded')this.ready=cb;}};
const window={DRIVMATCH_BOOTSTRAP:data};
const sandbox={document,window,navigator:{userAgent:'Desktop smoke test'},location:{search:'',protocol:'file:'},URLSearchParams,Option:function(t,v){return {text:t,value:v}},
 console,Date,Number,String,Array,Object,Map,Set,Intl,setInterval};
vm.runInNewContext(fs.readFileSync(path.join(root,'site/assets/app.js'),'utf8'),sandbox,{timeout:1000});
document.ready();
assert(elements.features.innerHTML.includes('Como interpretar o preço do diesel'));
assert(!elements.list.innerHTML.includes('Como interpretar o preço do diesel'),'Hero cannot repeat in news feed');
assert(!elements.highlightList.innerHTML.includes('Como interpretar o preço do diesel'),'Hero cannot repeat in headlines');
assert.strictEqual(elements['newsroom-cta-title'].textContent,'Oportunidades no transporte');
assert(!elements.market.innerHTML.includes('FDX'),'Do not render unavailable securities');
assert(!elements.market.innerHTML.includes('Class 8'),'Do not render unavailable Class 8 statistics');
assert(!elements.market.innerHTML.includes('SIMULAÇÃO'));
assert(elements.market.innerHTML.includes('Sem indicadores recentes e verificados'),'Empty market should have one honest message instead of blank rows');
assert.strictEqual(elements['market-note'].textContent,'');
assert.strictEqual(elements['market-mobile'].innerHTML,elements.market.innerHTML,'Mobile market must mirror same valid quotes below Road TV');
data.market.indicators.diesel={value:3.72,observed_at:new Date().toISOString(),source:'EIA / FRED (semanal)',quote_status:'última observação disponível',change_pct:null};
// Market data is consumed from the bootstrapped object: assert the renderer's
// real-data branch through language render, which re-renders Market Focus.
elements.language.value='en';elements.language.dispatch('change',{target:{value:'en'}});
assert(elements.market.innerHTML.includes('3.72'),'Dated verified fuel value should be displayed');
assert(!elements.market.innerHTML.includes('FDX'));
assert.strictEqual(elements['market-mobile'].innerHTML,elements.market.innerHTML);
elements.language.value='pt';elements.language.dispatch('change',{target:{value:'pt'}});
const sample=0;
elements.features.dispatch('click',{target:{closest:key=>({dataset:{story:String(sample)}})}});
assert(elements.modalbodytext.textContent.includes('O preço do diesel'));
assert(elements.articleLanguageButtons.innerHTML.includes('data-article-lang="es"'));
assert(elements.articleLanguageButtons.innerHTML.includes('data-article-lang="en"'));
assert.strictEqual(elements.articleLanguageTitle.textContent,'Idioma da notícia');
assert.strictEqual(elements['share-section-title'].textContent,'Compartilhe esta notícia');
assert.strictEqual(elements['article-dialog'].scrollTop,0);
// translating article should NOT change the top-of-page language selector
elements.articleLanguageButtons.dispatch('click',{target:{closest:key=>({dataset:{articleLang:'es'}})}});
assert(elements.modaltitle.textContent.includes('diésel'));
assert.strictEqual(elements.language.value,'pt');
assert(elements.modalbodytext.textContent.includes('Los precios del diésel'));
// Production-like collision: five freshly issued NWS alerts and other
// documented transportation stories must not produce five alerts in a row.
const makeSource=(id,title,category,source,published,type)=>({
  id,kind:'external_link',status:'external_source',demo:false,
  category,source,source_url:'https://example.com/'+id,published_at:published,
  original_lang:'pt',editorial_type:type,
  locales:Object.fromEntries(['pt','en','es'].map(l=>[l,{title,summary:'',body:''}]))
});
const nw=Array.from({length:5},(_,i)=>makeSource('weather-'+i,
  'NWS Weather Alert '+i,'Clima','National Weather Service (NWS)',
  new Date(Date.UTC(2026,9,10,22,10-i)).toISOString(),'operational_bulletin'));
const other=[
  ['Driver rule update','Fiscalização','FMCSA'],
  ['Trucking load prices','Fretes','FreightWaves'],
  ['Truck stop infrastructure','Rodovias','Transport Topics'],
  ['CDL driver hiring','Caminhoneiros','CDLLife'],
  ['Semi trucking technology','Tecnologia','FleetOwner'],
  ['US trucking carriers','Transporte','Transport Topics'],
  ['Freight broker security','Segurança','Land Line']
].map(([title,cat,origin],i)=>makeSource('publisher-'+i,title,cat,origin,
  new Date(Date.UTC(2026,9,10,12-i)).toISOString(),'publisher_headline'));
data.articles=[...nw,...other];
elements.language.value='pt';
elements.language.dispatch('change',{target:{value:'pt'}});
const orderedTitles=[...elements.list.innerHTML.matchAll(/<h3>([^<]*)<\/h3>/g)].map(m=>m[1]);
assert.equal(orderedTitles.length,3,'Feed contains remaining stories, not copies of hero/rail/highlights');
assert.equal(new Set([...elements.features.innerHTML.matchAll(/data-story="(\d+)"/g),...elements.highlightList.innerHTML.matchAll(/data-story="(\d+)"/g),...elements.list.innerHTML.matchAll(/data-story="(\d+)"/g)].map(m=>m[1])).size,12,'Every fixture story must appear in one homepage slot');
assert.ok(orderedTitles.some(x=>x.includes('Freight')||x.includes('Driver')||x.includes('Truck')||x.includes('NWS')),'Remaining feed must contain real unique stories');
assert.ok(elements.list.innerHTML.includes('não é fotografia do fenômeno')||
          elements.list.innerHTML.includes('não retrata o evento meteorológico')||
          elements.list.innerHTML.includes('Ilustração editorial'),
  'NWS synthetic fixture with no licensed photo cannot pretend to show an actual weather event');
assert.ok(elements.list.innerHTML.includes('data-bulletin="true"'),
  'NWS photographic card must retain identification of official bulletin');
assert.ok(elements.features.innerHTML.includes('Driver rule update'),
  'Transport journalism must lead Panorama when non-bulletin reporting exists');
assert.ok(!elements.features.innerHTML.split('related-rail')[0].includes('NWS Weather Alert'),
  'NWS alert must not dominate the main feature while transport news exists');
console.log('EDITORIAL MIX PASS: exclusive homepage slots, transport lead and no duplicate fixtures');
// Reproduce the reported bug: source is English but reader selects Português.
data.articles=[{
 id:'translation-test',kind:'external_link',status:'external_source',demo:false,
 category:'Fretes',source:'Fixture publisher',source_url:'https://example.org/trucking-story',
 original_lang:'en',translated_langs:['pt','en','es'],
 published_at:'2026-10-12T12:00:00Z',
 locales:{
  pt:{title:'Transporte americano tem novidades',summary:'',body:''},
  en:{title:'American trucking has new developments',summary:'',body:''},
  es:{title:'El transporte estadounidense presenta novedades',summary:'',body:''}
 }
}];
elements.language.value='pt';
elements.language.dispatch('change',{target:{value:'pt'}});
elements.features.dispatch('click',{target:{closest:key=>({dataset:{story:'0'}})}});
const publisherLinks=elements['article-source'].innerHTML;
assert(publisherLinks.includes('data-source-lang="pt"')&&publisherLinks.includes('data-source-lang="es"'),
 'Every reader language must switch in-app instead of opening Google Translate');
assert(!publisherLinks.includes('translate.google.com')&&!publisherLinks.includes('.translate.goog'),
 'Do not open broken Google Translate proxy pages');
assert(publisherLinks.includes('href="https://example.org/trucking-story"'),
 'The original reporting must remain available as a direct outbound link');
assert(elements.modalbodytext.textContent.includes('Transporte americano tem novidades'),
 'The reader must display a Portuguese headline-based brief locally');
assert(elements.modalbodytext.textContent.includes('não a tradução integral'),
 'An external headline must not masquerade as the full publisher report');
elements['article-source'].dispatch('click',{target:{closest:key=>key==='[data-source-lang]'?{dataset:{sourceLang:'es'}}:null}});
assert(elements.modaltitle.textContent.includes('estadounidense'),
 'Spanish-LatAm reader must update the visible article in DrivMatch News');
assert(elements.modalbodytext.textContent.includes('El transporte estadounidense'),
 'Spanish-LatAm reader must update the local brief too');
assert.strictEqual(elements.language.value,'pt','Source language must not change the whole-site edition');
elements['article-source'].dispatch('click',{target:{closest:key=>key==='[data-source-lang]'?{dataset:{sourceLang:'pt'}}:null}});
elements['article-impact-actions'].dispatch('click',{target:{closest:key=>({dataset:{impactRole:'driver'}})}});
assert(elements['article-impact-text'].textContent.includes('Transporte americano tem novidades'),
 'Professional impact must mention the exact article, not a generic category-only warning');
assert(elements['article-impact-note'].textContent.includes('manchete'),
 'Professional impact must say when only headline evidence is available');
console.log('NATIVE READER PASS: local pt-BR/es-419, direct original source, contextual and disclosed professional impact');
console.log('CLIENT SMOKE PASS: panorama/mirrored mobile market/modal/Spanish full text; global language unchanged');
