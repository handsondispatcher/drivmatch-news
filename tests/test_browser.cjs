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
   // The approved v31 editorial composition must not silently downgrade to v18 cards.
   assert.equal(await page.locator('#features > .hero-wrap article').count(),1,'v31 requires one lead story');
   assert.equal(await page.locator('#features > .related-rail article').count(),3,'v31 requires three related stories');
   assert.equal(await page.locator('.language-shortcuts button[data-site-lang]').count(),3,'v31 language shortcuts must be present');
   assert.equal(await page.locator('.language-shortcuts button[data-site-lang="pt"]').isVisible(),true);
   if(width===1440){
    const og=await page.request.get('http://127.0.0.1:8765/share/kodiak-charger-dallas-laredo-20261008/');
    assert.equal(og.status(),200,'Approved Kodiak story must have its own OG page');
    const html=await og.text();
    assert.match(html,/property="og:image" content="https:\/\/handsondispatcher\.github\.io\/drivmatch-news\/share\/kodiak-/);
    assert.match(html,/og:image:width" content="1200"/);
    const image=await page.request.get('http://127.0.0.1:8765/share/kodiak-charger-dallas-laredo-20261008/social.jpg');
    assert.equal(image.status(),200,'OG photo must be served');
    assert.match(image.headers()['content-type'],/image\/jpeg/);
   }
   assert.equal(await page.locator('#market-title').textContent(),'Mercado em Foco');
   assert.equal(await page.locator('#mercados').innerText().then(x=>x.includes('FDX')),true);
   const card=width>990?'#clima-desktop':'#clima-mobile';
   assert.equal(await page.locator('#dm-crawler-track a[href*="thetrucker.com"]').count(),0,'Known geo-blocked publisher must not appear in ticker');
   // Approved layout: Ventusky is visible immediately, without a toggle.
   assert.match(await page.locator(card+' iframe').getAttribute('src'),/^https:\/\/embed\.ventusky\.com/);
   assert.equal(await page.locator(card+' iframe').isVisible(),true);
   assert.equal(await page.locator(card+' .weather-open').count(),1);
   // External source cards may fill page one; locate an approved editorial card through pagination.
   const openEditorial=async()=>{
    for(let attempt=0;attempt<25;attempt++){
     if(await page.locator('#list article[data-story][data-external="false"]').count()){
      await page.locator('#list article[data-story][data-external="false"]').first().click();return;
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
   const sourceLinks=await page.locator('#article-source .article-source-button').evaluateAll(nodes=>nodes.map(n=>n.href));
   assert.equal(sourceLinks.length,3,'Portuguese English and Spanish original-source buttons must remain available');
   assert.ok(sourceLinks.some(url=>!url.includes('translate.google.com')&&!url.includes('.translate.goog')),'Direct original publisher must always remain available');
   assert.equal(await page.locator('#article-source .article-source-button img').count(),3,'Each language source button must display its flag');
   assert.match(await page.locator('#article-source .source-access-warning').innerText(),/navegador/);
   // Switching the entire site to English must translate weather and publisher footer.
   await page.locator('#article-dialog .x').click();
   await page.locator('#language').selectOption('en');
   assert.equal(await page.locator('#clima-desktop .weather-top h2').textContent(),'Weather');
   assert.equal(await page.locator('#footer-publisher').innerText(),'DrivMatch News — um produto da Hands On Dispatcher LLC');
   assert.equal(await page.locator('#footer-legal').innerText(),'© 2026 Hands On Dispatcher LLC. Todos os direitos reservados.');
   await page.locator('#language').selectOption('pt');
   assert.match(await page.locator('#footer-publisher').innerText(),/um produto da Hands On Dispatcher LLC/);
   await openEditorial();
   assert.equal(await page.locator('#share-native').count(),1);
   assert.equal(await page.locator('#share-copy').count(),1);
   await page.locator('#share-native').click();
   assert.equal(await page.locator('#share-options').isVisible(),true);
   for(const platform of ['whatsapp','facebook','threads','x','linkedin','telegram','reddit','pinterest','email']){
    assert.equal(await page.locator('[data-share-platform="'+platform+'"]').count(),1);
    assert.ok((await page.locator('[data-share-platform="'+platform+'"]').getAttribute('href')).length>10);
   }
   assert.match(await page.locator('[data-share-platform="whatsapp"]').getAttribute('href'),/^https:\/\/web\.whatsapp\.com\/send\?text=/);
   assert.equal(await page.locator('#share-whatsapp-copy').isVisible(),true);
   const images=await page.locator('#panorama article img, #list article img').evaluateAll(nodes=>nodes.map(n=>({url:n.getAttribute('src'),story:n.closest('[data-story]')?.getAttribute('data-story')})).filter(x=>x.url));
   const distinct=new Map(images.map(x=>[x.story,x.url]));
   assert.equal(new Set(distinct.values()).size,distinct.size,'No two different news stories can use the same photo');
   assert.equal(await page.locator('#list article[data-external="true"] img:not([src^="data:image/svg+xml"])').count(),0,'Unlicensed external images must be distinct editorial graphics');
   assert.equal(await page.locator('#footer-description').count(),0,'Institutional footer has exactly two lines');
   assert.equal(await page.locator('footer.footer > div').count(),2,'Footer must have exactly two institutional lines');
   assert.equal(await page.locator('#article-dialog #modalbodytext').evaluate(e=>getComputedStyle(e).maxHeight),'none','Article text must never be clipped');
   assert.equal(await page.locator('#share-story').isVisible(),true);
   const shareLink=await page.locator('[data-share-platform="whatsapp"]').getAttribute('href');
   assert.match(decodeURIComponent(shareLink),/handsondispatcher.github.io\/drivmatch-news\/share\//);
   assert.ok(!decodeURIComponent(shareLink).includes('news.google.com/rss/'));
   if(width===1440){
    await page.locator('#share-story').click();
    await page.locator('#story-preview').waitFor({state:'visible',timeout:15000});
    assert.equal(await page.locator('#story-preview').isVisible(),true);
    const size=await page.locator('#story-preview-image').evaluate(async img=>{
      if(!img.complete)await new Promise(resolve=>{img.onload=resolve;img.onerror=resolve;});
      return [img.naturalWidth,img.naturalHeight];
    });
    assert.deepEqual(size,[1080,1920]);
    await page.locator('#story-preview-image').screenshot({path:'test-results/story-card.png'});
    const storyDownload=page.waitForEvent('download',{timeout:12000});
    await page.locator('#story-preview-download').click();
    const download=await storyDownload;
    assert.equal(download.suggestedFilename(),'drivmatch-news-story.png');
    await page.locator('#story-preview-close').click();
    assert.equal(await page.locator('#story-preview').isVisible(),false);
   }
   await page.locator('#share-native').click();
   assert.equal(await page.locator('#share-options').isVisible(),false);
   assert.equal(await page.locator('#article-reading [data-article-lang]').count(),3);
   const langGrid=await page.locator('.source-translations').evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length);
   assert.equal(langGrid,width>650?3:1);
   assert.equal(await page.locator('#article-disclosure').isVisible(),false);
   const ptTitle=await page.locator('#modaltitle').textContent();
   await page.locator('[data-article-lang="es"]').click();
   assert.equal(await page.locator('#language').inputValue(),'pt');
   assert.notEqual(await page.locator('#modaltitle').textContent(),ptTitle);
   assert.ok((await page.locator('#modalbodytext').textContent()).length>80);
   await page.locator('#article-dialog').evaluate(e=>e.scrollTop=e.scrollHeight);
   await page.keyboard.press('Escape');
   await page.locator('#list article[data-story][data-external="false"]').first().click();
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
