// Browser: official NWS weather alerts are isolated and retain separate counties.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
(async()=>{
 const server=spawn('python',['-m','http.server','8774','--directory','site']);
 let browser;
 try{
  await new Promise(resolve=>{server.stderr.once('data',resolve);setTimeout(resolve,1000);});
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1280,height:850}});
  const notice=(id,place,date,source='National Weather Service (NWS)',category='Clima')=>({
    id,title:'NWS: Flood Warning — '+place,original_lang:'en',category,source,
    source_url:'https://api.weather.gov/alerts/'+id,published_at:date,
    geo_scope_verified:true,origin_type:'official-alert',editorial_type:'operational_bulletin',
    region:'US',titles:{pt:'NWS: Alerta de inundação — '+place,en:'NWS: Flood Warning — '+place,es:'NWS: Alerta de inundación — '+place}
  });
  const records=[
   notice('brewer','Brewster, TX','2026-10-16T22:16:00Z'),
   notice('valverde','Val Verde, TX','2026-10-16T22:13:00Z'),
   notice('payne','Payne, OK','2026-10-16T22:08:00Z'),
   {...notice('private-weather','Storm market', '2026-10-16T21:00:00Z','Local Weather Desk','Clima'), editorial_type:'publisher_headline',source_url:'https://example.org/weather/test'},
  ];
  await page.route('**/data/source-headlines.json?**',route=>route.fulfill({
   status:200,contentType:'application/json',
   body:JSON.stringify({headlines:records,generated_at:new Date().toISOString(),latest_headline_at:records[0].published_at})
  }));
  await page.goto('http://127.0.0.1:8774/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.getElementById('weather-alerts-count')?.textContent==='4',{timeout:12000});
  assert.equal(await page.locator('#list .dm-climate-item').count(),0,'Normal news must not display climate-only cards');
  const headlines=await page.locator('#list article h3, #features h3, #highlightList .highlight-headline').allTextContents();
  assert.equal(headlines.some(t=>/Brewster|Val Verde|Payne/.test(t)),false,'NWS alerts must leave regular main homepage');
  await page.locator('#weather-alerts-button').click();
  assert.equal(await page.locator('#weather-alerts-button').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#panorama').isVisible(),false);
  assert.equal(await page.locator('#list .dm-climate-item').count(),4,'All separate counties and weather reports retained');
  const titles=await page.locator('#list .dm-climate-item h3').allTextContents();
  assert.match(titles[0],/Brewster/);assert.match(titles[1],/Val Verde/);assert.match(titles[2],/Payne/);
  await page.locator('[data-site-lang="es"]').click();
  assert.match(await page.locator('#weather-alerts-button').innerText(),/ALERTA METEOROLÓGICA/);
  assert.match((await page.locator('#list .dm-climate-item h3').first().textContent()),/Alerta de inundación/);
  await page.locator('[data-site-lang="en"]').click();
  assert.match(await page.locator('#weather-alerts-button').innerText(),/WEATHER ALERTS/);
  await page.locator('#search').fill('Brewster');
  assert.equal(await page.locator('#list .dm-climate-item').count(),1,'Search must filter weather desk');
  await page.locator('#weather-alerts-home').click();
  assert.equal(await page.locator('#weather-alerts-button').getAttribute('aria-pressed'),'false');
  assert.equal(await page.locator('#panorama').isVisible(),true);
  assert.equal(await page.locator('#search').inputValue(),'');
  await page.locator('#category').selectOption('Clima');
  assert.equal(await page.locator('#list .dm-climate-item').count(),4,'Category Clima also routes to weather desk');
  console.log('WEATHER ALERT DESK PASS: separate NWS county alerts, standard-news exclusion, PT/ES/EN, search, back, category');
 }finally{if(browser)await browser.close();server.kill();}
})().catch(e=>{console.error(e.stack);process.exit(1)});
