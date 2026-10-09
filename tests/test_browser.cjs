// Real browser checks; no test articles enter the production build.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
(async()=>{
 const server=spawn('python',['-m','http.server','8765','--directory','site']);
 let browser;
 try {
  await new Promise((resolve,reject)=>{server.stdout.on('data',resolve);server.stderr.on('data',resolve);server.on('error',reject);setTimeout(resolve,1000)});
  browser=await chromium.launch({headless:true});
  for(const width of [360,390,768,1440]) {
   const page=await browser.newPage({viewport:{width,height:900}});const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});
   assert.equal(await page.locator('.brand img').evaluate(e=>e.naturalWidth>0),true);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`overflow ${width}`);
   assert.equal(await page.locator('#market-title').textContent(),'Mercado em Foco');
   assert.equal(await page.locator('#mercados').innerText().then(x=>x.includes('FDX')),true);
   const card=width>990?'#clima-desktop':'#clima-mobile';
   // Approved layout: Ventusky is visible immediately, without a toggle.
   assert.match(await page.locator(card+' iframe').getAttribute('src'),/^https:\/\/embed\.ventusky\.com/);
   assert.equal(await page.locator(card+' iframe').isVisible(),true);
   assert.equal(await page.locator(card+' .weather-open').count(),1);
   // External source cards may fill page one; locate an approved editorial card through pagination.
   const openEditorial=async()=>{
    for(let attempt=0;attempt<25;attempt++){
     if(await page.locator('#list article[data-story]').count()){
      await page.locator('#list article[data-story]').first().click();return;
     }
     if(await page.locator('#next').isDisabled())break;
     await page.locator('#next').click();
    }
    throw new Error('No approved editorial article reachable through news pagination');
   };
   await openEditorial();
   // Reader flows top to bottom; the language selector must not hide in the footer.
   const order=await page.evaluate(()=>Object.fromEntries(['modaltitle','modalmeta','article-reading','modalbodytext','article-original','article-share-footer'].map(id=>[id,document.getElementById(id).getBoundingClientRect().top])));
   assert.ok(order.modaltitle<order['article-reading'] && order['article-reading']<order.modalbodytext && order.modalbodytext<order['article-original'] && order['article-original']<order['article-share-footer'],`article flow ${JSON.stringify(order)}`);
   assert.equal(await page.locator('#share-native').count(),1);
   assert.equal(await page.locator('#share-copy').count(),1);
   assert.equal(await page.locator('#article-reading [data-article-lang]').count(),3);
   const langGrid=await page.locator('.source-translations').evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length);
   assert.equal(langGrid,width>650?3:1);
   assert.equal(await page.locator('#article-disclosure').isVisible(),false);
   await page.locator('[data-article-lang="es"]').click();
   assert.equal(await page.locator('#language').inputValue(),'pt');
   assert.equal(await page.locator('#modaltitle').innerText().then(x=>x.includes('descanso')),true);
   await page.locator('#article-dialog').evaluate(e=>e.scrollTop=e.scrollHeight);
   await page.keyboard.press('Escape');
   await page.locator('#list article[data-story]').first().click();
   assert.equal(await page.locator('#article-dialog').evaluate(e=>e.scrollTop),0);
   await page.keyboard.press('Escape');
   await page.locator('#language').selectOption('en');
   assert.equal(await page.locator('#market-title').textContent(),'Market Focus');
   assert.deepEqual(errors,[]);
   await page.screenshot({path:`test-results/${width}.png`,fullPage:true});await page.close();
   console.log(`PASS ${width}px: logo, no overflow, market, weather, article translation`);
  }
 }finally{if(browser)await browser.close();server.kill()}
})().catch(e=>{console.error(e);process.exitCode=1});
