(() => {
'use strict';
const el=id=>document.getElementById(id);
const fixed=[['Orlando','FL'],['Houston','TX'],['New York City','NY'],['Newark','NJ'],['San Francisco','CA'],['Atlanta','GA'],['El Paso','TX'],['Buffalo','NY'],['Salt Lake City','UT'],['Las Vegas','NV'],['Chattanooga','TN'],['Nashville','TN'],['Chicago','IL'],['Los Angeles','CA'],['Dallas','TX'],['Miami','FL'],['Tampa','FL'],['Jacksonville','FL'],['Memphis','TN'],['Indianapolis','IN'],['Columbus','OH'],['Cincinnati','OH'],['Louisville','KY'],['Kansas City','MO'],['St. Louis','MO'],['Denver','CO'],['Phoenix','AZ'],['Albuquerque','NM'],['Seattle','WA'],['Portland','OR'],['Detroit','MI'],['Laredo','TX'],['San Diego','CA'],['Charlotte','NC'],['Birmingham','AL'],['Oklahoma City','OK'],['Harrisburg','PA'],['Sacramento','CA'],['Cleveland','OH'],['Boston','MA'],['McAllen','TX'],['Ontario','CA'],['Savannah','GA'],['Reno','NV'],['Philadelphia','PA'],['Fresno','CA'],['Austin','TX'],['Washington','DC'],['Fort Lauderdale','FL'],['Kissimmee','FL'],['Boca Raton','FL'],['Pompano Beach','FL'],['Framingham','MA'],['Worcester','MA'],['Danbury','CT'],['Edison','NJ'],['San Antonio','TX'],['Norfolk','VA'],['Tacoma','WA'],['Bellingham','WA'],['Spokane','WA'],['Eugene','OR'],['Medford','OR'],['Redding','CA'],['Stockton','CA'],['Bakersfield','CA'],['San Bernardino','CA'],['Barstow','CA'],['Long Beach','CA'],['Oakland','CA'],['Tucson','AZ'],['Nogales','AZ'],['Flagstaff','AZ'],['Yuma','AZ'],['Kingman','AZ'],['Las Cruces','NM'],['Amarillo','TX'],['Waco','TX'],['Fort Worth','TX'],['Beaumont','TX'],['Lubbock','TX'],['Eagle Pass','TX'],['Brownsville','TX'],['Midland','TX'],['Corpus Christi','TX'],['Tulsa','OK'],['Wichita','KS'],['Topeka','KS'],['Salina','KS'],['Lincoln','NE'],['Omaha','NE'],['North Platte','NE'],['Cheyenne','WY'],['Rock Springs','WY'],['Ogden','UT'],['St. George','UT'],['Colorado Springs','CO'],['Grand Junction','CO'],['Des Moines','IA'],['Cedar Rapids','IA'],['Minneapolis','MN'],['Duluth','MN'],['Fargo','ND'],['Pembina','ND'],['Sioux Falls','SD'],['Little Rock','AR'],['Jackson','MS'],['Baton Rouge','LA'],['New Orleans','LA'],['Lafayette','LA'],['Shreveport','LA'],['Mobile','AL'],['Montgomery','AL'],['Huntsville','AL'],['Pensacola','FL'],['Tallahassee','FL'],['Ocala','FL'],['Gainesville','FL'],['Valdosta','GA'],['Macon','GA'],['Augusta','GA'],['Charleston','SC'],['Columbia','SC'],['Greenville','SC'],['Florence','SC'],['Fayetteville','NC'],['Greensboro','NC'],['Raleigh','NC'],['Asheville','NC'],['Richmond','VA'],['Fredericksburg','VA'],['Roanoke','VA'],['Winchester','VA'],['Lexington','KY'],['Bowling Green','KY'],['Knoxville','TN'],['Jackson','TN'],['Gary','IN'],['South Bend','IN'],['Toledo','OH'],['Dayton','OH'],['Youngstown','OH'],['Pittsburgh','PA'],['Carlisle','PA'],['Allentown','PA'],['Scranton','PA'],['Baltimore','MD'],['Hagerstown','MD'],['Wilmington','DE'],['Trenton','NJ'],['Elizabeth','NJ'],['New Haven','CT'],['Hartford','CT'],['Providence','RI'],['Portland','ME'],['Albany','NY'],['Syracuse','NY'],['Binghamton','NY'],['Rochester','NY'],['Niagara Falls','NY'],['Port Huron','MI'],['Grand Rapids','MI'],['Milwaukee','WI'],['Madison','WI'],['Green Bay','WI'],['Joliet','IL'],['Rockford','IL'],['Springfield','IL']];
const shuffle = list => {const a=[...list];for(let j=a.length-1;j>0;j--){const k=Math.floor(Math.random()*(j+1));[a[j],a[k]]=[a[k],a[j]];}return a;};
let order=shuffle(fixed.map(([city,state])=>city+'|'+state));
let cities=fixed.map(([city,state])=>({city,state,status:'unavailable'})),i=0,market={},spot=null;
const lang=()=>el('language')?.value||'pt';
function number(v,d){return Number(v).toLocaleString(lang()==='pt'?'pt-BR':lang()==='es'?'es-ES':'en-US',{minimumFractionDigits:d,maximumFractionDigits:d})}
function showMarket(){
 el('top-usd-label').textContent=lang()==='en'?'USD/BRL':'Dólar';
 el('top-diesel-label').textContent=lang()==='en'?'US Diesel':lang()==='es'?'Diésel EE. UU.':'Diesel EUA';
 const usd=spot||market.usdbrl, diesel=market.diesel;
 el('top-usd-value').textContent=usd&&Number(usd.value)>0?'R$ '+number(usd.value,4):'—';
 el('top-usd-date').textContent=usd?.observed_at?(usd.source||'USD/BRL')+' · '+usd.observed_at:'Sem cotação';
 el('top-diesel-value').textContent=diesel&&Number(diesel.value)>0?'US$ '+number(diesel.value,3)+'/gal':'—';
 el('top-diesel-date').textContent=diesel?.observed_at?'EIA · '+diesel.observed_at:'EIA · semanal';
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
function showCity(){
 if(i>=order.length){order=shuffle(order);i=0;}
 const [name,state]=order[i++].split('|');const c=cities.find(x=>x.city===name&&x.state===state)||{city:name,state,status:'unavailable'};el('top-city').textContent=c.city+', '+c.state;
 const age=Date.now()-Date.parse(c.forecast_updated_at||'');
 const good=c.status==='forecast'&&Number.isFinite(age)&&age>=0&&age<36*3600000;
 el('top-weather-icon').textContent=good?icon(c.condition_en):'☁️';
 const condition=String(c.condition_en||'').toLowerCase();
 const risk=good?(/blizzard|winter storm|heavy snow/.test(condition)?'❄️ Snow risk':/thunderstorm|severe storm/.test(condition)?'⚡ Storm risk':/heavy rain|flood/.test(condition)?'🌧️ Heavy rain':/dense fog/.test(condition)?'🌫️ Low visibility':''):'';
 el('top-condition').textContent=good?(risk||c.condition_en):(lang()==='en'?'Forecast unavailable':lang()==='es'?'Pronóstico no disponible':'Previsão indisponível');
 const hi=good&&Number.isFinite(Number(c.max_f))&&c.max_f!==null?Math.round(c.max_f)+'°F':'—';
 const lo=good&&Number.isFinite(Number(c.min_f))&&c.min_f!==null?Math.round(c.min_f)+'°F':'—';
 const celsius = f => Math.round((f-32)*5/9);const cHi=hi==='—'?'—':celsius(Number(c.max_f))+'°C';const cLo=lo==='—'?'—':celsius(Number(c.min_f))+'°C';
 el('top-range-f').textContent='Máx. '+hi+' · Mín. '+lo;
 el('top-range-c').textContent='Máx. '+cHi+' · Mín. '+cLo;
 el('top-condition').title=good?'NWS · '+c.forecast_updated_at:'';
}
async function weather(){
 try{
  const r=await fetch('data/weather.json?d='+Date.now(),{cache:'no-store'});if(!r.ok)return;
  const j=await r.json();if(!Array.isArray(j.cities))return;
  const m=new Map(j.cities.map(c=>[c.city+'|'+c.state,c]));
  cities=fixed.map(([city,state])=>Object.assign({city,state,status:'unavailable'},m.get(city+'|'+state)||{}));
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
 setInterval(showCity,60000);el('language')?.addEventListener('change',()=>{showMarket();i=Math.max(0,i-1);showCity()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();