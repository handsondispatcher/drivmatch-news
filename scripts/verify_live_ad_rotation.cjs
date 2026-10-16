/* Independent production check for the CUSTOM DOMAIN, not localhost / GitHub Pages. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const origins=['https://drivmatch.com/news/','https://handsondispatcher.github.io/drivmatch-news/'];
 const browser=await chromium.launch({headless:true});
 try {
 for(const base of origins){
  const page=await browser.newPage({viewport:{width:1440,height:920},reducedMotion:'no-preference'});
  const fail=[];
  page.on('pageerror',e=>fail.push('PAGE_ERROR '+e.message));
  page.on('requestfailed',r=>{if(r.url().includes('sidebar-ad-rotation'))fail.push('SCRIPT_REQUEST_FAILED '+r.failure()?.errorText);});
  const url=base+'?rotation-probe='+Date.now();
  const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:35000});
  console.log('PROBE',url,'STATUS',response.status(),'FINAL',page.url());
  const html=await page.content();
  console.log('HTML_MARKERS',html.includes('id="dm-ad-rotation"'),html.includes('sidebar-ad-rotation.js?v='));
  const script=await page.evaluate(()=>fetch('assets/sidebar-ad-rotation.js?verify='+Date.now(),{cache:'no-store'}).then(async r=>({status:r.status,type:r.headers.get('content-type'),text:(await r.text()).slice(0,150)})).catch(e=>({error:String(e)})));
  console.log('SCRIPT',JSON.stringify(script));
  const visible=await page.locator('#dm-ad-rotation-viewport').isVisible().catch(()=>false);
  console.log('VIEWPORT_VISIBLE',visible);
  if(visible){
    await page.locator('#dm-ad-rotation-viewport').scrollIntoViewIfNeeded();
    await page.mouse.move(0,0);
    await page.waitForTimeout(350);
    const starting=await page.locator('#dm-ad-rotation-track').evaluate(e=>getComputedStyle(e).transform);
    await page.waitForTimeout(1300);
    const ending=await page.locator('#dm-ad-rotation-track').evaluate(e=>getComputedStyle(e).transform);
    const state=await page.locator('#dm-ad-rotation').evaluate(e=>({
     top:e.getBoundingClientRect().top,width:e.getBoundingClientRect().width,
     html:document.documentElement.lang,ariaPressed:document.getElementById('dm-ad-rotation-toggle')?.getAttribute('aria-pressed'),
     css:getComputedStyle(e.querySelector('.dm-ad-rotation-viewport')).height,
     items:[...e.querySelectorAll('.dm-ad-rotation-item')].map(x=>({id:x.dataset.adCampaign,height:x.getBoundingClientRect().height}))
    }));
    console.log('STATE',JSON.stringify(state));console.log('TRANSFORM_START',starting,'TRANSFORM_END',ending);
    if(starting===ending)fail.push('CAROUSEL_NOT_MOVING');
  }else fail.push('CAROUSEL_NOT_VISIBLE_OR_MISSING');
  console.log('PROBE_DIAGNOSTICS',base,JSON.stringify(fail));
  if(fail.length)throw new Error(base+': '+fail.join(','));
  await page.close();
 }
 }finally{await browser.close();}
})().catch(e=>{console.error('LIVE_CAROUSEL_FAILED',e.stack);process.exit(1);});
