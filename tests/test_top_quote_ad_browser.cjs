/* Real browser smoke: nine fixed-square images, language matching, 4s rotation. */
const { chromium }=require('playwright');
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
(async()=>{
 const server=spawn('python',['-m','http.server','8769','--directory','site'],{stdio:'ignore'});
 let browser;
 try{
  await new Promise(resolve=>setTimeout(resolve,1100));
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
  await page.goto('http://127.0.0.1:8769/',{waitUntil:'domcontentloaded',timeout:30000});
  const slot=page.locator('#top-quote-ad-slot'),image=page.locator('#top-quote-ad-image');
  await image.waitFor({state:'visible'});
  await page.waitForFunction(()=>document.getElementById('top-quote-ad-image')?.complete&&document.getElementById('top-quote-ad-image')?.naturalWidth===1254,{timeout:16000});
  const rect=await slot.boundingBox();
  assert.ok(rect && rect.width>=100 && Math.abs(rect.width-rect.height)<1.5,'quote ad must fit one square in utility strip');
  assert.equal(await slot.getAttribute('data-active-language'),'pt');
  await page.mouse.move(0,0);
  await page.waitForFunction(()=>document.querySelector('#top-quote-ad-slot')?.dataset.model==='2',{timeout:6000});
  assert.ok((await image.getAttribute('src')).includes('pt-2.png'));
  await page.locator('[data-site-lang="en"]').click();
  await page.waitForFunction(()=>document.querySelector('#top-quote-ad-slot')?.dataset.activeLanguage==='en',{timeout:3000});
  assert.ok((await image.getAttribute('src')).includes('en-1.png'));
  await page.locator('[data-site-lang="es"]').click();
  await page.waitForFunction(()=>document.querySelector('#top-quote-ad-slot')?.dataset.activeLanguage==='es',{timeout:3000});
  assert.ok((await image.getAttribute('src')).includes('es-1.png'));
  assert.ok((await page.locator('#top-quote-ad-sms').getAttribute('href')).startsWith('sms:+19082913386'));
  assert.ok((await page.locator('#top-quote-ad-whatsapp').getAttribute('href')).startsWith('https://wa.me/19082913386'));
  await slot.hover();
  await page.waitForTimeout(350);
  const still=await slot.getAttribute('data-model');
  await page.waitForTimeout(4300);
  assert.equal(await slot.getAttribute('data-model'),still,'hover must pause');
  console.log('NINE QUOTE ADS PASS: original files, 4s rotation, language, SMS, WhatsApp, square sizing, hover pause');
 }finally{if(browser)await browser.close();server.kill();}
})().catch(e=>{console.error('TOP QUOTE AD BROWSER ERROR',e.stack);process.exit(1);});
