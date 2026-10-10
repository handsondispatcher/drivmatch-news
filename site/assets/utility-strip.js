(() => {
'use strict';
const el=id=>document.getElementById(id);
const fixed=[['Orlando','FL'],['Houston','TX'],['New York City','NY'],['Newark','NJ'],['San Francisco','CA'],['Atlanta','GA'],['El Paso','TX'],['Buffalo','NY'],['Salt Lake City','UT'],['Las Vegas','NV'],['Chattanooga','TN'],['Nashville','TN'],['Chicago','IL'],['Los Angeles','CA'],['Dallas','TX'],['Miami','FL'],['Tampa','FL'],['Jacksonville','FL'],['Memphis','TN'],['Indianapolis','IN'],['Columbus','OH'],['Cincinnati','OH'],['Louisville','KY'],['Kansas City','MO'],['St. Louis','MO'],['Denver','CO'],['Phoenix','AZ'],['Albuquerque','NM'],['Seattle','WA'],['Portland','OR'],['Detroit','MI'],['Laredo','TX'],['San Diego','CA'],['Charlotte','NC'],['Birmingham','AL'],['Oklahoma City','OK'],['Harrisburg','PA'],['Sacramento','CA'],['Cleveland','OH'],['Boston','MA'],['McAllen','TX'],['Ontario','CA'],['Savannah','GA'],['Reno','NV'],['Philadelphia','PA'],['Fresno','CA'],['Austin','TX'],['Washington','DC'],['Fort Lauderdale','FL'],['Kissimmee','FL'],['Boca Raton','FL'],['Pompano Beach','FL'],['Framingham','MA'],['Worcester','MA'],['Danbury','CT'],['Edison','NJ'],['San Antonio','TX'],['Norfolk','VA'],['Tacoma','WA'],['Bellingham','WA'],['Spokane','WA'],['Eugene','OR'],['Medford','OR'],['Redding','CA'],['Stockton','CA'],['Bakersfield','CA'],['San Bernardino','CA'],['Barstow','CA'],['Long Beach','CA'],['Oakland','CA'],['Tucson','AZ'],['Nogales','AZ'],['Flagstaff','AZ'],['Yuma','AZ'],['Kingman','AZ'],['Las Cruces','NM'],['Amarillo','TX'],['Waco','TX'],['Fort Worth','TX'],['Beaumont','TX'],['Lubbock','TX'],['Eagle Pass','TX'],['Brownsville','TX'],['Midland','TX'],['Corpus Christi','TX'],['Tulsa','OK'],['Wichita','KS'],['Topeka','KS'],['Salina','KS'],['Lincoln','NE'],['Omaha','NE'],['North Platte','NE'],['Cheyenne','WY'],['Rock Springs','WY'],['Ogden','UT'],['St. George','UT'],['Colorado Springs','CO'],['Grand Junction','CO'],['Des Moines','IA'],['Cedar Rapids','IA'],['Minneapolis','MN'],['Duluth','MN'],['Fargo','ND'],['Pembina','ND'],['Sioux Falls','SD'],['Little Rock','AR'],['Jackson','MS'],['Baton Rouge','LA'],['New Orleans','LA'],['Lafayette','LA'],['Shreveport','LA'],['Mobile','AL'],['Montgomery','AL'],['Huntsville','AL'],['Pensacola','FL'],['Tallahassee','FL'],['Ocala','FL'],['Gainesville','FL'],['Valdosta','GA'],['Macon','GA'],['Augusta','GA'],['Charleston','SC'],['Columbia','SC'],['Greenville','SC'],['Florence','SC'],['Fayetteville','NC'],['Greensboro','NC'],['Raleigh','NC'],['Asheville','NC'],['Richmond','VA'],['Fredericksburg','VA'],['Roanoke','VA'],['Winchester','VA'],['Lexington','KY'],['Bowling Green','KY'],['Knoxville','TN'],['Jackson','TN'],['Gary','IN'],['South Bend','IN'],['Toledo','OH'],['Dayton','OH'],['Youngstown','OH'],['Pittsburgh','PA'],['Carlisle','PA'],['Allentown','PA'],['Scranton','PA'],['Baltimore','MD'],['Hagerstown','MD'],['Wilmington','DE'],['Trenton','NJ'],['Elizabeth','NJ'],['New Haven','CT'],['Hartford','CT'],['Providence','RI'],['Portland','ME'],['Albany','NY'],['Syracuse','NY'],['Binghamton','NY'],['Rochester','NY'],['Niagara Falls','NY'],['Port Huron','MI'],['Grand Rapids','MI'],['Milwaukee','WI'],['Madison','WI'],['Green Bay','WI'],['Joliet','IL'],['Rockford','IL'],['Springfield','IL']];
// Deterministic NWS-backed city rotation is requested at 10-second intervals. No 10-second external API polling.
let cities=fixed.map(([city,state])=>({city,state,status:'unavailable'})),market={},spot=null;
let weatherSelection='auto',weatherRotateIndex=0,userForecast=null,places=[],placesReady=false,placesError=false,weatherRequestId=0;
let localForecastCache=new Map(),suggestionTimer=null;
try{const stored=localStorage.getItem('drivmatch_weather_city_v1');if(stored&&/^.{1,80}\|[A-Z]{2}$/.test(stored))weatherSelection=stored;}catch(_){}
const lang=()=>el('language')?.value||'pt';
function number(v,d){return Number(v).toLocaleString(lang()==='pt'?'pt-BR':lang()==='es'?'es-ES':'en-US',{minimumFractionDigits:d,maximumFractionDigits:d})}
// v34.7: identical reader-facing quote composition to the approved screenshot.
 // Only represent real verified observations; no sample values or invented arrows.
function showMarket(){
 const l=lang();
 el('top-usd-label').textContent=l==='en'?'USD / BRL':l==='es'?'Dólar':'Dólar';
 el('top-diesel-label').textContent='US Diesel';
 el('top-brent-label').textContent=l==='en'?'Brent Crude Oil':l==='es'?'Petróleo Brent':'Petróleo Brent';
 const usd=spot||market.usdbrl;
 el('top-usd-label').textContent=usd?.instrument==='ptax_reference'
     ?(l==='en'?'USD PTAX':l==='es'?'Dólar PTAX':'Dólar PTAX')
     :(l==='en'?'USD / BRL':l==='es'?'Dólar':'Dólar');
 const values=[
  {id:'usd',data:usd,decimals:4,prefix:'R$ ',suffix:''},
  {id:'diesel',data:market.diesel,decimals:3,prefix:'US$ ',suffix:'/gal'},
  {id:'brent',data:market.brent,decimals:2,prefix:'US$ ',suffix:l==='en'?'/barrel':'/barril'}
 ];
 for(const item of values){
   const v=item.data;
   const fresh=!!v&&Number.isFinite(Number(v.value))&&Number(v.value)>0
      &&Number.isFinite(Date.parse(v.observed_at||''))
      &&Date.now()-Date.parse(v.observed_at)>=-24*3600000
      &&Date.now()-Date.parse(v.observed_at)<10*86400000;
   const value=el('top-'+item.id+'-value'),chg=el('top-'+item.id+'-change'),meta=el('top-'+item.id+'-date');
   value.textContent=fresh?item.prefix+number(v.value,item.decimals)+item.suffix:'—';
   const pct=fresh&&Number.isFinite(Number(v.change_pct))&&v.change_pct!==null?Number(v.change_pct):null;
   chg.hidden=pct===null;
   chg.classList.toggle('negative',pct!==null&&pct<0);
   chg.textContent=pct===null?'':(pct>0?'+':'')+number(pct,2)+'%';
   const closeLabel=fresh&&v.instrument==='spot'&&v.session_status==='closed'
     ?'Fechamento comercial ':fresh&&v.instrument==='ptax_reference'
     ?'Taxa de referência PTAX venda ':'';
   const source=fresh?closeLabel+(v.source||'')+' · '+v.observed_at
      :'Cotação não verificada';
   meta.textContent=source;value.title=source;
 }
}
function icon(d){
 d=String(d||'').toLowerCase();
 if(/snow|sleet|blizzard|flurr/.test(d))return '❄️';
 if(/thunder|storm/.test(d))return '⛈️';
 if(/rain|shower|drizzle/.test(d))return '🌧️';
 if(/fog|haze|smoke/.test(d))return '🌫️';
 if(/cloud|overcast/.test(d))return '☁️';
 if(/sun|clear|fair/.test(d))return '☀️';
 if(/wind/.test(d))return '💨';
 return '🌤️';
}
function localizedCondition(desc){const d=String(desc||'').toLowerCase(),l=lang();
 const cases=[[/blizzard|heavy snow|snow|sleet|flurr/,['Neve','Snow','Nieve']],[/thunder|storm/,['Tempestades','Thunderstorms','Tormentas']],[/heavy rain|rain|showers|drizzle/,['Chuva','Rain','Lluvia']],[/gust|wind/,['Rajadas de vento','Wind gusts','Ráfagas de viento']],[/fog|haze/,['Neblina','Fog','Niebla']],[/partly cloudy|partly sunny/,['Parcialmente nublado','Partly cloudy','Parcialmente nublado']],[/cloud|overcast/,['Nublado','Cloudy','Nublado']],[/clear|sun|fair/,['Céu limpo','Clear skies','Cielo despejado']]];
 const c=cases.find(([re])=>re.test(d));return c?c[1][{pt:0,en:1,es:2}[l]||0]:String(desc||'').slice(0,60);
}
function validCities(){
 const now=Date.now();return cities.filter(c=>c.status==='forecast'&&typeof c.condition_en==='string'&&c.condition_en.trim()&&
 Number.isFinite(c.max_f)&&Number.isFinite(c.min_f)&&Number.isFinite(Date.parse(c.forecast_updated_at||''))&&
 now-Date.parse(c.forecast_updated_at)>=0&&now-Date.parse(c.forecast_updated_at)<36*3600000);
}
function cleanCityName(t){
 return String(t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
   .replace(/\bsaint\b/g,'st').replace(/[^\p{L}\p{N} ]/gu,' ').replace(/\s+/g,' ').trim();
}
function displayCity(key){
 const parts=String(key||'').split('|');
 return parts.length===2?parts[0]+', '+parts[1]:key;
}
function feedback(kind,pt,en,es,location){
 const e=el('top-city-feedback');if(!e)return;
 const l=lang();e.dataset.state=kind||'';
 e.textContent=({pt,en,es}[l]||pt)||'';
 if(location){
   const link=document.createElement('a');
   link.href='https://forecast.weather.gov/MapClick.php?lat='+location[2]+'&lon='+location[3];
   link.target='_blank';link.rel='noopener noreferrer';
   link.textContent=l==='en'?' · Official forecast ↗':l==='es'?' · Pronóstico oficial ↗':' · Previsão oficial ↗';
   e.appendChild(link);
 }
}
function showCity(){
 const good=validCities(),panel=document.querySelector('.dm-util-city');
 const byKey=new Map(good.map(c=>[c.city+'|'+c.state,c]));
 const automatic=[byKey.get('Tampa|FL'),...good.filter(c=>c.city!=='Tampa'||c.state!=='FL')].filter(Boolean);
 const picked=weatherSelection==='auto'?
   (automatic.length?automatic[weatherRotateIndex%automatic.length]:null):
   (userForecast&&(userForecast.city+'|'+userForecast.state)===weatherSelection?userForecast:byKey.get(weatherSelection));
 if(!picked){if(panel)panel.hidden=true;return;}
 if(panel)panel.hidden=false;
 el('top-city').textContent=picked.city+', '+picked.state;
 el('top-weather-icon').textContent=icon(picked.condition_en);
 el('top-condition').textContent=localizedCondition(picked.condition_en);
 const d=picked.condition_en.toLowerCase();
 const risk=/blizzard|heavy snow/.test(d)?['Neve intensa','Heavy snow','Nieve intensa']:
   /thunder|severe storm/.test(d)?['⚡ Risco de tempestade','⚡ Storm risk','⚡ Riesgo de tormenta']:
   /heavy rain|flood/.test(d)?['Chuva intensa','Heavy rain','Lluvia intensa']:
   /dense fog/.test(d)?['Visibilidade reduzida','Low visibility','Visibilidad reducida']:null;
 const riskEl=el('top-risk');riskEl.hidden=!risk;
 riskEl.textContent=risk?risk[{pt:0,en:1,es:2}[lang()]||0]:'';
 const hi=Math.round(picked.max_f),lo=Math.round(picked.min_f),l=lang();
 const max=l==='en'?'High':l==='es'?'Máx.':'Máx.',min=l==='en'?'Low':l==='es'?'Mín.':'Mín.';
 el('top-range-f').textContent=max+' '+hi+'°F · '+min+' '+lo+'°F';
 el('top-range-c').textContent=max+' '+Math.round((hi-32)*5/9)+'°C · '+min+' '+Math.round((lo-32)*5/9)+'°C';
 el('top-condition').title=picked.source||'NOAA / NWS forecast';
}
function setSearchLocale(){
 const l=lang(),q=el('top-city-query'),label=el('top-city-select-label'),button=el('top-city-search');
 if(label)label.textContent=l==='en'?'Weather forecast':l==='es'?'Pronóstico del tiempo':'Previsão do tempo';
 if(q){
   q.placeholder=l==='en'?'City, state':l==='es'?'Ciudad, estado':'Cidade, estado';
   q.setAttribute('aria-label',l==='en'?'Search weather by US city and state':
     l==='es'?'Buscar el pronóstico por ciudad y estado':'Buscar previsão por cidade e estado');
 }
 if(button)button.title=button.getAttribute('aria-label')=
   l==='en'?'Search forecast':l==='es'?'Buscar pronóstico':'Buscar previsão';
 if(weatherSelection!=='auto'&&q&&document.activeElement!==q)q.value=displayCity(weatherSelection);
}
function searchMatches(raw,limit=10){
 const text=String(raw||'').trim();
 if(!text||text.length<2||!places.length)return [];
 // Support comma, "St Charles MO", and direct datalist values.
 const comma=text.lastIndexOf(',');
 const endState=text.match(/^(.*?)\s+([A-Za-z]{2})$/);
 let city=text,state='';
 if(comma>=0){city=text.slice(0,comma);state=text.slice(comma+1).trim().toUpperCase();}
 else if(endState&&endState[1].trim().length>=2){city=endState[1];state=endState[2].toUpperCase();}
 const needle=cleanCityName(city);
 if(!needle||state&&!/^[A-Z]{1,2}$/.test(state))return [];
 const hits=[];
 for(const p of places){
   if(state&&!p[1].startsWith(state))continue;
   const name=cleanCityName(p[0]);
   if(name===needle||name.startsWith(needle)||(!state&&name.includes(' '+needle))){
     hits.push({place:p,rank:name===needle?0:name.startsWith(needle)?1:2});
   }
 }
 hits.sort((a,b)=>a.rank-b.rank||a.place[0].length-b.place[0].length||
   a.place[0].localeCompare(b.place[0])||a.place[1].localeCompare(b.place[1]));
 return hits.slice(0,limit).map(v=>v.place);
}
function showSuggestions(){
 const q=el('top-city-query'),list=el('top-city-options');if(!q||!list)return;
 list.replaceChildren();
 for(const p of searchMatches(q.value,12)){
   const option=document.createElement('option');option.value=p[0]+', '+p[1];
   list.appendChild(option);
 }
}
async function loadPlaces(){
 try{
   const r=await fetch('data/us-places.json',{cache:'force-cache'});
   if(!r.ok)throw Error('Census index unavailable');
   const data=await r.json();
   if(data.schema_version!==1||data.source_url!=='https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2025_Gazetteer/2025_Gaz_place_national.zip'
      ||!Array.isArray(data.places)||data.places.length<20000)throw Error('Unexpected city index');
   places=data.places.filter(p=>Array.isArray(p)&&p.length===4&&typeof p[0]==='string'&&
     /^[A-Z]{2}$/.test(p[1])&&Number.isFinite(p[2])&&Number.isFinite(p[3]));
   if(places.length<20000)throw Error('Insufficient city coverage');
   placesReady=true;placesError=false;
   showSuggestions();
   if(weatherSelection!=='auto'){
     const p=places.find(p=>p[0]+'|'+p[1]===weatherSelection);
     if(p)await choosePlace(p,true);
     else {weatherSelection='auto';try{localStorage.removeItem('drivmatch_weather_city_v1');}catch(_){}}
   }
 }catch(_){placesError=true;placesReady=false;
   feedback('error','Busca nacional temporariamente indisponível.','Nationwide city search temporarily unavailable.',
     'Búsqueda nacional temporalmente no disponible.');
 }
}
function nwsForecastFromJSON(place,payload){
 const props=payload&&payload.properties||{},periods=props.periods;
 if(!Array.isArray(periods)||!periods.length)throw Error('No forecast periods');
 const first=periods[0];
 if(typeof first.shortForecast!=='string'||!first.shortForecast.trim())throw Error('Missing weather condition');
 const d=periods.slice(0,6).find(x=>x.isDaytime===true&&x.temperatureUnit==='F'&&Number.isFinite(x.temperature));
 const n=periods.slice(0,6).find(x=>x.isDaytime===false&&x.temperatureUnit==='F'&&Number.isFinite(x.temperature));
 const updated=props.updated||props.generatedAt;
 const age=Date.now()-Date.parse(updated);
 if(!d||!n||!Number.isFinite(age)||age< -2*3600000||age>36*3600000)throw Error('Incomplete or stale forecast');
 return {city:place[0],state:place[1],condition_en:first.shortForecast.trim().slice(0,120),
   max_f:d.temperature,min_f:n.temperature,forecast_updated_at:updated,
   source:'NOAA / National Weather Service',status:'forecast'};
}
async function officialForecast(place){
 const key=place[0]+'|'+place[1],cached=localForecastCache.get(key);
 if(cached&&Date.now()-cached.checked<15*60000)return cached.forecast;
 const lat=Number(place[2]),lon=Number(place[3]);
 if(!Number.isFinite(lat)||!Number.isFinite(lon)||lat<17||lat>72||lon< -180||lon> -64)
   throw Error('Invalid locality coordinates');
 const coords=lat.toFixed(5)+','+lon.toFixed(5);
 const response=await fetch('https://api.weather.gov/points/'+coords,{
   headers:{'Accept':'application/geo+json'},mode:'cors'});
 if(!response.ok)throw Error('NOAA location metadata unavailable');
 const doc=await response.json();
 const url=doc&&doc.properties&&doc.properties.forecast;
 const validated=new URL(url);
 if(validated.protocol!=='https:'||validated.hostname!=='api.weather.gov')
   throw Error('Untrusted NOAA forecast endpoint');
 const r=await fetch(validated.href,{headers:{'Accept':'application/geo+json'},mode:'cors'});
 if(!r.ok)throw Error('NOAA forecast unavailable');
 const weather=nwsForecastFromJSON(place,await r.json());
 localForecastCache.set(key,{checked:Date.now(),forecast:weather});
 return weather;
}
async function choosePlace(place,restoring=false){
 const req=++weatherRequestId,q=el('top-city-query'),button=el('top-city-search');
 const key=place[0]+'|'+place[1];
 if(q)q.value=place[0]+', '+place[1];
 if(button)button.disabled=true;
 feedback('loading','Consultando previsão oficial…','Loading official forecast…','Consultando pronóstico oficial…');
 try{
   const weather=await officialForecast(place);
   if(req!==weatherRequestId)return;
   weatherSelection=key;userForecast=weather;weatherRotateIndex=0;
   try{localStorage.setItem('drivmatch_weather_city_v1',key);}catch(_){}
   showCity();setSearchLocale();
   feedback('success','Previsão de '+place[0]+', '+place[1],
     'Forecast: '+place[0]+', '+place[1],
     'Pronóstico: '+place[0]+', '+place[1]);
 }catch(_){
   if(req!==weatherRequestId)return;
   if(restoring){
     weatherSelection='auto';userForecast=null;
     try{localStorage.removeItem('drivmatch_weather_city_v1');}catch(_){}
     showCity();
   }
   feedback('error','Previsão temporariamente indisponível para '+place[0]+', '+place[1]+'.',
     'Forecast temporarily unavailable for '+place[0]+', '+place[1]+'.',
     'Pronóstico no disponible para '+place[0]+', '+place[1]+'.',place);
 }finally{if(req===weatherRequestId&&button)button.disabled=false;}
}
async function searchCity(){
 const q=el('top-city-query');if(!q)return;
 const raw=q.value.trim();
 if(!raw){resetToRotation();return;}
 if(!placesReady){
   feedback('error','Aguarde o carregamento do catálogo de cidades.',
     'Please wait for the city directory.','Espera el catálogo de ciudades.');
   return;
 }
 const hits=searchMatches(raw,30),matched=hits.filter(p=>
   cleanCityName(p[0])===cleanCityName(raw.replace(/,\s*[a-z]{1,2}$/i,'')
     .replace(/\s+[a-z]{2}$/i,'')));
 let choice=matched.length===1?matched[0]:null;
 if(!choice&&hits.length===1)choice=hits[0];
 if(!choice){
   const l=lang();
   if(matched.length>1||hits.length>1){
     const names=(matched.length?matched:hits).slice(0,4).map(p=>p[0]+', '+p[1]).join(' · ');
     feedback('error', 'Especifique o estado: '+names,
       'Specify the state: '+names,'Indica el estado: '+names);
   }else{
     feedback('error','Cidade não encontrada. Digite cidade e sigla do estado.',
       'City not found. Enter city and state.','Ciudad no encontrada. Escribe ciudad y estado.');
   }
   showSuggestions();return;
 }
 await choosePlace(choice);
}
function resetToRotation(){
 ++weatherRequestId;weatherSelection='auto';weatherRotateIndex=0;userForecast=null;
 try{localStorage.removeItem('drivmatch_weather_city_v1');}catch(_){}
 const q=el('top-city-query');if(q)q.value='';
 feedback('','','','');showCity();
}
async function weather(){
 try{
  const r=await fetch('data/weather.json?d='+Date.now(),{cache:'no-store'});if(!r.ok)return;
  const j=await r.json();if(!Array.isArray(j.cities))return;
  const map=new Map(j.cities.map(c=>[c.city+'|'+c.state,c]));
  cities=fixed.map(([city,state])=>Object.assign({city,state,status:'unavailable'},map.get(city+'|'+state)||{}));
  showCity();
 }catch(_){}
}
async function quotes(){
 try{const r=await fetch('data/market.json?d='+Date.now(),{cache:'no-store'});if(!r.ok)return;
  market=(await r.json()).indicators||{};showMarket();}catch(_){}
}
async function live(){
 try{const c=await(await fetch('data/runtime.json',{cache:'no-store'})).json();
  if(!/^https:\/\//.test(c.spot_url||''))return;
  const q=await(await fetch(c.spot_url,{cache:'no-store'})).json();
  const a=Date.now()-Date.parse(q.observed_at);
  if(q.symbol!=='USD/BRL'||q.instrument!=='spot'||q.price_type!=='commercial'||!Number.isFinite(Number(q.value))||Number(q.value)<=0||!Number.isFinite(a)||a< -30000||a>300000||!q.source)return;
  spot=q;showMarket();}catch(_){}
}
function init(){
 if(!el('top-city'))return;
 showMarket();showCity();setSearchLocale();
 el('top-city-search-form')?.addEventListener('submit',e=>{e.preventDefault();searchCity();});
 el('top-city-query')?.addEventListener('input',()=>{
   if(suggestionTimer)clearTimeout(suggestionTimer);
   suggestionTimer=setTimeout(showSuggestions,120);
   feedback('','','','');
 });
 el('top-city-query')?.addEventListener('search',()=>{if(!el('top-city-query')?.value)resetToRotation();});
 el('language')?.addEventListener('change',()=>{showMarket();showCity();setSearchLocale()});
 document.addEventListener('drivmatch:language',()=>{showMarket();showCity();setSearchLocale()});
 if(location.protocol.startsWith('http')){
   weather();quotes();live();loadPlaces();
   setInterval(weather,15*60000);setInterval(quotes,5*60000);setInterval(live,15000);
 }
 setInterval(()=>{if(weatherSelection==='auto'&&validCities().length){weatherRotateIndex++;showCity()}},10*1000);
 setInterval(()=>{
   if(weatherSelection!=='auto'&&placesReady){
     const p=places.find(p=>p[0]+'|'+p[1]===weatherSelection);
     if(p)choosePlace(p,true);
   }
 },20*60000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();