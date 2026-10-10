(() => {
'use strict';
const el=id=>document.getElementById(id);
const fixed=[['Orlando','FL'],['Houston','TX'],['New York City','NY'],['Newark','NJ'],['San Francisco','CA'],['Atlanta','GA'],['El Paso','TX'],['Buffalo','NY'],['Salt Lake City','UT'],['Las Vegas','NV'],['Chattanooga','TN'],['Nashville','TN'],['Chicago','IL'],['Los Angeles','CA'],['Dallas','TX'],['Miami','FL'],['Tampa','FL'],['Jacksonville','FL'],['Memphis','TN'],['Indianapolis','IN'],['Columbus','OH'],['Cincinnati','OH'],['Louisville','KY'],['Kansas City','MO'],['St. Louis','MO'],['Denver','CO'],['Phoenix','AZ'],['Albuquerque','NM'],['Seattle','WA'],['Portland','OR'],['Detroit','MI'],['Laredo','TX'],['San Diego','CA'],['Charlotte','NC'],['Birmingham','AL'],['Oklahoma City','OK'],['Harrisburg','PA'],['Sacramento','CA'],['Cleveland','OH'],['Boston','MA'],['McAllen','TX'],['Ontario','CA'],['Savannah','GA'],['Reno','NV'],['Philadelphia','PA'],['Fresno','CA'],['Austin','TX'],['Washington','DC'],['Fort Lauderdale','FL'],['Kissimmee','FL'],['Boca Raton','FL'],['Pompano Beach','FL'],['Framingham','MA'],['Worcester','MA'],['Danbury','CT'],['Edison','NJ'],['San Antonio','TX'],['Norfolk','VA'],['Tacoma','WA'],['Bellingham','WA'],['Spokane','WA'],['Eugene','OR'],['Medford','OR'],['Redding','CA'],['Stockton','CA'],['Bakersfield','CA'],['San Bernardino','CA'],['Barstow','CA'],['Long Beach','CA'],['Oakland','CA'],['Tucson','AZ'],['Nogales','AZ'],['Flagstaff','AZ'],['Yuma','AZ'],['Kingman','AZ'],['Las Cruces','NM'],['Amarillo','TX'],['Waco','TX'],['Fort Worth','TX'],['Beaumont','TX'],['Lubbock','TX'],['Eagle Pass','TX'],['Brownsville','TX'],['Midland','TX'],['Corpus Christi','TX'],['Tulsa','OK'],['Wichita','KS'],['Topeka','KS'],['Salina','KS'],['Lincoln','NE'],['Omaha','NE'],['North Platte','NE'],['Cheyenne','WY'],['Rock Springs','WY'],['Ogden','UT'],['St. George','UT'],['Colorado Springs','CO'],['Grand Junction','CO'],['Des Moines','IA'],['Cedar Rapids','IA'],['Minneapolis','MN'],['Duluth','MN'],['Fargo','ND'],['Pembina','ND'],['Sioux Falls','SD'],['Little Rock','AR'],['Jackson','MS'],['Baton Rouge','LA'],['New Orleans','LA'],['Lafayette','LA'],['Shreveport','LA'],['Mobile','AL'],['Montgomery','AL'],['Huntsville','AL'],['Pensacola','FL'],['Tallahassee','FL'],['Ocala','FL'],['Gainesville','FL'],['Valdosta','GA'],['Macon','GA'],['Augusta','GA'],['Charleston','SC'],['Columbia','SC'],['Greenville','SC'],['Florence','SC'],['Fayetteville','NC'],['Greensboro','NC'],['Raleigh','NC'],['Asheville','NC'],['Richmond','VA'],['Fredericksburg','VA'],['Roanoke','VA'],['Winchester','VA'],['Lexington','KY'],['Bowling Green','KY'],['Knoxville','TN'],['Jackson','TN'],['Gary','IN'],['South Bend','IN'],['Toledo','OH'],['Dayton','OH'],['Youngstown','OH'],['Pittsburgh','PA'],['Carlisle','PA'],['Allentown','PA'],['Scranton','PA'],['Baltimore','MD'],['Hagerstown','MD'],['Wilmington','DE'],['Trenton','NJ'],['Elizabeth','NJ'],['New Haven','CT'],['Hartford','CT'],['Providence','RI'],['Portland','ME'],['Albany','NY'],['Syracuse','NY'],['Binghamton','NY'],['Rochester','NY'],['Niagara Falls','NY'],['Port Huron','MI'],['Grand Rapids','MI'],['Milwaukee','WI'],['Madison','WI'],['Green Bay','WI'],['Joliet','IL'],['Rockford','IL'],['Springfield','IL']];
// Deterministic NWS-backed city rotation is requested at 10-second intervals. No 10-second external API polling.
let cities=fixed.map(([city,state])=>({city,state,status:'unavailable'})),market={},spot=null;
let weatherSelection='auto',weatherRotateIndex=0;
try{const stored=localStorage.getItem('drivmatch_weather_city_v1');if(stored&&/^.{1,80}\|[A-Z]{2}$/.test(stored))weatherSelection=stored;}catch(_){};
const lang=()=>el('language')?.value||'pt';
function number(v,d){return Number(v).toLocaleString(lang()==='pt'?'pt-BR':lang()==='es'?'es-ES':'en-US',{minimumFractionDigits:d,maximumFractionDigits:d})}
// v34.7: identical reader-facing quote composition to the approved screenshot.
 // Only represent real verified observations; no sample values or invented arrows.
function showMarket(){
 const l=lang();
 el('top-usd-label').textContent=l==='en'?'USD / BRL':l==='es'?'Dólar':'Dólar';
 el('top-diesel-label').textContent=l==='en'?'US Diesel':l==='es'?'Diésel EE. UU.':'Diesel EUA';
 el('top-brent-label').textContent=l==='en'?'Brent Oil':l==='es'?'Petróleo Brent':'Petróleo Brent';
 const usd=spot||market.usdbrl;
 el('top-usd-label').textContent=usd?.instrument==='ptax_reference'
     ?(l==='en'?'USD PTAX':l==='es'?'Dólar PTAX':'Dólar PTAX')
     :(l==='en'?'USD / BRL':l==='es'?'Dólar':'Dólar');
 const values=[
  {id:'usd',data:usd,decimals:4,prefix:'R$ ',suffix:''},
  {id:'diesel',data:market.diesel,decimals:3,prefix:'US$ ',suffix:'/gal'},
  {id:'brent',data:market.brent,decimals:2,prefix:'US$ ',suffix:'/barril'}
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
function validCities(){const now=Date.now();return cities.filter(c=>c.status==='forecast'&&typeof c.condition_en==='string'&&c.condition_en.trim()&&
 Number.isFinite(c.max_f)&&Number.isFinite(c.min_f)&&Number.isFinite(Date.parse(c.forecast_updated_at||''))&&now-Date.parse(c.forecast_updated_at)>=0&&now-Date.parse(c.forecast_updated_at)<36*3600000);}
function showCity(){
 const good=validCities(),panel=document.querySelector('.dm-util-city');
 if(!good.length){panel.hidden=true;return;}
 panel.hidden=false;
 const avail=new Map(good.map(c=>[c.city+'|'+c.state,c]));
 const ordered=[avail.get('Tampa|FL'),...good.filter(c=>c.city!=='Tampa'||c.state!=='FL')].filter(Boolean);
 // Explicit reader preference pins one verified city; otherwise rotate every ten seconds.
 const picked=weatherSelection==='auto'?ordered[weatherRotateIndex%ordered.length]:
              avail.get(weatherSelection);
 if(!picked){
   // Pinned cities must not quietly switch to a different place when NWS is unavailable.
   panel.hidden=true;
   if(weatherSelection!=='auto')cityFeedback('Previsão da cidade temporariamente indisponível.',
       'Weather unavailable for the selected city.','Pronóstico de la ciudad no disponible.');
   return;
 }
 el('top-city').textContent=picked.city+', '+picked.state;
 el('top-weather-icon').textContent=icon(picked.condition_en);
 el('top-condition').textContent=localizedCondition(picked.condition_en);
 const d=picked.condition_en.toLowerCase();
 const risk=/blizzard|heavy snow/.test(d)?['Neve intensa','Heavy snow','Nieve intensa']:
   /thunder|severe storm/.test(d)?['⚡ Risco de tempestade','⚡ Storm risk','⚡ Riesgo de tormenta']:
   /heavy rain|flood/.test(d)?['Chuva intensa','Heavy rain','Lluvia intensa']:
   /dense fog/.test(d)?['Visibilidade reduzida','Low visibility','Visibilidad reducida']:null;
 const riskEl=el('top-risk');riskEl.hidden=!risk;riskEl.textContent=risk?risk[{pt:0,en:1,es:2}[lang()]||0]:'';
 const fhi=Math.round(picked.max_f),flo=Math.round(picked.min_f);
 el('top-range-f').textContent='Máx. '+fhi+'°F · Mín. '+flo+'°F';
 el('top-range-c').textContent='Máx. '+Math.round((fhi-32)*5/9)+'°C · Mín. '+Math.round((flo-32)*5/9)+'°C';
 el('top-condition').title='';
}

function cityFeedback(pt,en,es){
 const node=el('top-city-feedback');if(node)node.textContent=({pt,en,es}[lang()]||pt)||'';
}
function cleanCityName(t){return String(t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();}
function chosenText(k){
 const city=validCities().find(c=>c.city+'|'+c.state===k);
 return city?city.city+', '+city.state:String(k||'').replace('|',', ');
}
function populateWeatherChoices(){
 const query=el('top-city-query'),list=el('top-city-options');
 if(!query||!list)return;
 const l=lang(),lab=el('top-city-select-label');
 if(lab)lab.textContent=l==='en'?'City / State':l==='es'?'Ciudad / Estado':'Cidade / Estado';
 const placeholder=l==='en'?'City, ST':l==='es'?'Ciudad, EE':'Cidade, UF';
 query.placeholder=placeholder;
 list.replaceChildren();
 for(const c of validCities())list.appendChild(new Option(c.city+', '+c.state,c.city+', '+c.state));
 if(document.activeElement!==query)query.value=weatherSelection==='auto'?'':chosenText(weatherSelection);
 const button=el('top-city-auto');
 if(button){button.disabled=weatherSelection==='auto';button.title=l==='en'?'Automatic: next city every 10 seconds':l==='es'?'Automático: cambia cada 10 segundos':'Automático: alterna a cada 10 segundos';}
}
function applyCityQuery(){
 const query=el('top-city-query');if(!query)return;
 const raw=query.value.trim();
 if(!raw){resetCityAuto();return;}
 const m=/^(.{2,60}?)\s*(?:,|\s)\s*([A-Za-z]{2})$/.exec(raw);
 if(!m){cityFeedback('Digite Cidade, UF. Ex.: Tampa, FL',
                     'Enter City, ST, e.g. Tampa, FL',
                     'Escribe Ciudad, EE, p. ej. Tampa, FL');return;}
 const match=validCities().find(c=>c.state.toUpperCase()===m[2].toUpperCase()&&
                   cleanCityName(c.city)===cleanCityName(m[1]));
 if(!match){
   cityFeedback('Cidade ainda sem previsão disponível. Use uma sugestão da lista.',
     'City forecast unavailable. Choose a suggestion.',
     'Pronóstico no disponible. Elige una sugerencia.');
   return;
 }
 weatherSelection=match.city+'|'+match.state;
 weatherRotateIndex=0;
 try{localStorage.setItem('drivmatch_weather_city_v1',weatherSelection)}catch(_){}
 cityFeedback('','','');populateWeatherChoices();showCity();
}
function resetCityAuto(){
 weatherSelection='auto';weatherRotateIndex=0;
 try{localStorage.removeItem('drivmatch_weather_city_v1')}catch(_){}
 cityFeedback('','','');populateWeatherChoices();showCity();
}
async function weather(){
 try{
  const r=await fetch('data/weather.json?d='+Date.now(),{cache:'no-store'});if(!r.ok)return;
  const j=await r.json();if(!Array.isArray(j.cities))return;
  const m=new Map(j.cities.map(c=>[c.city+'|'+c.state,c]));
  cities=fixed.map(([city,state])=>Object.assign({city,state,status:'unavailable'},m.get(city+'|'+state)||{}));populateWeatherChoices();showCity();
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
 showMarket();showCity();
 if(location.protocol.startsWith('http')){weather();quotes();live();setInterval(weather,15*60000);setInterval(quotes,5*60000);setInterval(live,15000);}
 setInterval(()=>{if(weatherSelection==='auto'&&validCities().length){weatherRotateIndex++;showCity()}},10*1000);
 el('top-city-apply')?.addEventListener('click',applyCityQuery);
 el('top-city-query')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();applyCityQuery();}});
 el('top-city-auto')?.addEventListener('click',resetCityAuto);
 el('language')?.addEventListener('change',()=>{showMarket();populateWeatherChoices();showCity()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();