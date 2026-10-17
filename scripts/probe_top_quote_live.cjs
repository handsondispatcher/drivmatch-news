const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const origin='https://drivmatch.com/news/';
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
  const response=await page.goto(origin+'?qaQuote='+Date.now(),{waitUntil:'domcontentloaded',timeout:40000});
  console.log('LIVE_PAGE',response.status(),page.url());
  assert.equal(response.status(),200);
  const box=page.locator('#top-quote-ad-slot'),art=page.locator('#top-quote-ad-image');
  await box.waitFor({state:'visible',timeout:16000});
  await page.waitForFunction(()=>document.getElementById('top-quote-ad-image')?.naturalWidth===1254,null,{timeout:16000});
  const rect=await box.boundingBox();
  console.log('SQUARE_DIMENSIONS',JSON.stringify(rect));
  assert.ok(rect&&Math.abs(rect.width-rect.height)<2&&rect.width>=100);
  let assets=0;
  for(const lang of ['pt','es','en'])for(const n of [1,2,3]){
   const res=await page.request.get(origin+'assets/ads/top-square/'+lang+'-'+n+'.png',{timeout:25000});
   console.log('LIVE_IMAGE',lang,n,res.status());
   assert.equal(res.status(),200);assets++;
  }
  await page.mouse.move(0,0);
  assert.equal(await box.getAttribute('data-active-language'),'pt');
  await page.waitForFunction(()=>document.querySelector('#top-quote-ad-slot')?.dataset.model==='2',null,{timeout:6500});
  console.log('MODEL_AFTER_4_SECONDS',await art.getAttribute('src'));
  await page.locator('[data-site-lang="en"]').click();
  await page.waitForFunction(()=>document.querySelector('#top-quote-ad-slot')?.dataset.activeLanguage==='en',null,{timeout:4000});
  assert.ok((await art.getAttribute('src')).includes('en-1.png'));
  await page.locator('[data-site-lang="es"]').click();
  await page.waitForFunction(()=>document.querySelector('#top-quote-ad-slot')?.dataset.activeLanguage==='es',null,{timeout:4000});
  assert.ok((await art.getAttribute('src')).includes('es-1.png'));
  assert.ok((await page.locator('#top-quote-ad-sms').getAttribute('href')).startsWith('sms:+19082913386'));
  assert.ok((await page.locator('#top-quote-ad-whatsapp').getAttribute('href')).startsWith('https://wa.me/19082913386'));
  await box.hover();await page.waitForTimeout(200);
  const m=await box.getAttribute('data-model');
  await page.waitForTimeout(4200);
  assert.equal(await box.getAttribute('data-model'),m);
  console.log('PUBLIC TOP QUOTE ROTATION VERIFIED: original 9 images, 4s, languages, links, pause, fit');
 }finally{await browser.close();}
})().catch(e=>{console.error('LIVE TOP QUOTE FAILED',e.stack);process.exit(1);});
