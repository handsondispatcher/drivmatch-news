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
 scrollIntoView(){}
}
const ids=['search','age','language','languageFlag','edition-date','category','chips','list','count','pagecount','prev','next','features','featureCount','featurePrev','featureNext','featureDots','highlights','highlights-title','highlights-note','highlightList','newsroom-section-label','newsroom-section-desc','newsroom-cta-eyebrow','newsroom-cta-title','newsroom-cta-desc','newsroom-cta-driver','newsroom-cta-carrier','market','market-note','news-freshness','market-mobile','market-note-mobile','market-title-mobile','ad-slot','news-commercial-banner','market-commercial-banner','modalimg','modalkicker','modaltitle','modalmeta','modalbodytext','modalbrief','article-disclosure','article-source','articleLanguageTitle','articleLanguageButtons','share-whatsapp','share-copy','share-native','share-label','share-section-title','share-feedback','share-options','share-options-close','share-system','share-system-label','share-story','share-story-label','share-whatsapp-copy','share-stories-hint','share-picker-feedback','article-reading','article-dialog','translation','shade','noticias','footer-publisher','footer-legal','story-preview','story-preview-image','story-preview-download','story-preview-close','story-preview-title','story-preview-hint'];
for(const id of ids)elements[id]=new Element(id);
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
assert(elements.list.innerHTML.includes('Como interpretar o preço do diesel'));
assert(elements.highlightList.innerHTML.includes('highlight-photo'),'v34 newsroom brief photo elements are rendered');
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
elements.list.dispatch('click',{target:{closest:key=>({dataset:{story:String(sample)}})}});
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
  original_lang:'en',editorial_type:type,
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
assert.equal(orderedTitles.length,6);
assert.equal(orderedTitles.slice(0,3).filter(s=>s.includes('NWS Weather Alert')).length,1,
  'Only one NWS bulletin in the first three news cards');
assert.ok(orderedTitles.some(x=>x.includes('Freight')||x.includes('Driver')||x.includes('Truck')),
  'Operational bulletins must be interleaved with independently sourced journalism');
assert.ok(elements.list.innerHTML.includes('não é fotografia do fenômeno'),
  'NWS cards must use an explicit non-photographic bulletin marker');
assert.ok(elements.list.innerHTML.includes('data:image/svg'), 'NWS card should use safe graphic marker');
console.log('EDITORIAL MIX PASS: no five consecutive NWS alerts; semantic NWS graphic; transport headlines interleaved');
console.log('CLIENT SMOKE PASS: panorama/list/mirrored mobile market/modal/Spanish full text; global language unchanged');
