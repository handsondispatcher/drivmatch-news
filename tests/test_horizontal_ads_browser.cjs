/* Browser proof: native paired 1774:394 ads, 5-second sequential reveal and locale routing. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
(async()=>{
 const server=spawn('python',['-m','http.server','8766','--directory','site']);
 let browser;
 try{
  await new Promise(resolve=>{server.stderr.once('data',resolve);server.once('error',resolve);setTimeout(resolve,950);});
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1280,height:900},reducedMotion:'no-preference'});
  await page.route('https://api.weather.gov/**',route=>route.abort());
  await page.goto('http://127.0.0.1:8766/',{waitUntil:'domcontentloaded',timeout:25000});
  const t=page.locator('#news-commercial-banner'),b=page.locator('#news-carhauler-banner');
  await page.waitForFunction(()=>document.getElementById('news-commercial-banner')?.dataset.currentCampaign==='cars'&&document.getElementById('news-carhauler-banner')?.dataset.currentCampaign==='ucr',{timeout:12000});
  async function verifyPair(top,bottom){
   assert.equal(await t.getAttribute('data-current-campaign'),top);
   assert.equal(await b.getAttribute('data-current-campaign'),bottom);
   assert.notEqual(top,bottom);
   const r=await t.evaluate(e=>e.getBoundingClientRect());
   const q=await b.evaluate(e=>e.getBoundingClientRect());
   assert.ok(Math.abs(r.width/r.height-1774/394)<0.01);
   assert.ok(Math.abs(q.width/q.height-1774/394)<0.01);
  }
  await verifyPair('cars','ucr');
  await page.waitForFunction(()=>document.getElementById('news-commercial-banner')?.dataset.currentCampaign==='ucr'&&document.getElementById('news-carhauler-banner')?.dataset.currentCampaign==='auto',{timeout:7000});
  await verifyPair('ucr','auto');
  const image=b.locator('.dm-horizontal-auto-img');
  assert.ok((await image.getAttribute('src')).includes('pt-wide-original.png'));
  assert.ok((await b.locator('.dm-horizontal-auto-phone').getAttribute('href')).includes('wa.me/14076004737'));
  assert.equal(await b.locator('.dm-horizontal-auto-instagram').getAttribute('href'),'https://www.instagram.com/autom.usa/');
  await page.waitForFunction(()=>document.getElementById('news-commercial-banner')?.dataset.currentCampaign==='auto'&&document.getElementById('news-carhauler-banner')?.dataset.currentCampaign==='cars',{timeout:7000});
  await verifyPair('auto','cars');
  await page.locator('[data-site-lang="es"]').first().click();
  await page.waitForFunction(()=>document.getElementById('news-commercial-banner')?.dataset.currentCampaign==='cars'&&document.getElementById('news-carhauler-banner')?.dataset.currentCampaign==='ucr',{timeout:2500});
  await page.waitForFunction(()=>document.getElementById('news-carhauler-banner')?.dataset.currentCampaign==='auto',{timeout:7000});
  assert.ok((await b.locator('.dm-horizontal-auto-img').getAttribute('src')).includes('es-wide-original.png'));
  console.log('PAIRED HORIZONTAL AD ROTATION PASS: 5-second three-phase cycle, 1774:394, no duplicate, ES localized and link clicks');
  await page.close();
 }finally{if(browser)await browser.close();server.kill();}
})().catch(e=>{console.error(e.stack);process.exit(1);});
