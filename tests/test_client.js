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

 get classList(){return {add(){},remove(){}};}
 scrollIntoView(){}
}
const ids=['search','age','language','languageFlag','edition-date','category','chips','list','count','pagecount','prev','next','features','featureCount','featurePrev','featureNext','featureDots','market','market-note','ad-slot','modalimg','modalkicker','modaltitle','modalmeta','modalbodytext','modalbrief','article-disclosure','article-source','articleLanguageTitle','articleLanguageButtons','share-whatsapp','share-copy','share-native','share-label','share-section-title','share-feedback','share-options','share-options-close','share-system','share-system-label','share-story','share-story-label','share-whatsapp-copy','share-stories-hint','share-picker-feedback','article-reading','article-dialog','translation','shade','noticias','footer-publisher','footer-legal','story-preview','story-preview-image','story-preview-download','story-preview-close','story-preview-title','story-preview-hint'];
for(const id of ids)elements[id]=new Element(id);
for(const id of ['panorama .heading','noticias .heading','market-title','.demo'])selectors['#'+id]=new Element(id);
selectors['.demo']=new Element('demo');
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
assert(elements.market.innerHTML.includes('Dólar comercial'));
assert(elements.market.innerHTML.includes('FDX'));
assert(elements.market.innerHTML.includes('Class 8'));
assert(!elements.market.innerHTML.includes('SIMULAÇÃO'));
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
console.log('CLIENT SMOKE PASS: panorama/list/market/modal/Spanish full text; global language unchanged');
