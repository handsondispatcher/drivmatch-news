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
   const page=await browser.newPage({viewport:{width,height:width<=390?680:900}});const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});
   assert.equal(await page.locator('.brand img').evaluate(e=>e.naturalWidth>0),true);
   assert.equal(await page.locator('meta[name="drivmatch-news-version"]').getAttribute('content'),'v32','public page has v32 version');
   assert.equal(await page.locator('#site-version').innerText(),'v32','public masthead identifies v32');
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
   // Semantic reading order is preserved; mobile share controls are viewport fixed.
   const order=await page.evaluate(()=>Object.fromEntries(['modaltitle','modalmeta','article-reading','modalbodytext','article-original','article-share-footer'].map(id=>[id,document.getElementById(id).getBoundingClientRect().top])));
   assert.ok(order.modaltitle<order['article-reading'] && order['article-reading']<order.modalbodytext && order.modalbodytext<order['article-original'],`article reading flow ${JSON.stringify(order)}`);
   assert.equal(await page.evaluate(()=>Boolean(document.getElementById('article-original').compareDocumentPosition(document.getElementById('article-share-footer')) & Node.DOCUMENT_POSITION_FOLLOWING)),true,'Original source precedes sharing in semantic order');
   if(width<=390) {
    const dock=await page.evaluate(()=>{
     const footer=document.getElementById('article-share-footer');
     const box=footer.getBoundingClientRect(),share=document.getElementById('share-native').getBoundingClientRect(),copy=document.getElementById('share-copy').getBoundingClientRect();
     return {position:getComputedStyle(footer).position,box:{top:box.top,bottom:box.bottom,left:box.left,right:box.right},share:{top:share.top,bottom:share.bottom,left:share.left,right:share.right},copy:{top:copy.top,bottom:copy.bottom,left:copy.left,right:copy.right},height:innerHeight,width:innerWidth};
    });
    assert.equal(dock.position,'fixed','Mobile sharing must be viewport-fixed');
    assert.ok(dock.share.top>=-1&&dock.share.bottom<=dock.height+1,`Share must show without scrolling: ${JSON.stringify(dock)}`);
    assert.ok(dock.copy.top>=-1&&dock.copy.bottom<=dock.height+1,'Copy link must show without scrolling');
    assert.ok(dock.share.right<dock.copy.left,'Share left, Copy link right');
    assert.ok(dock.box.left>=-1&&dock.box.right<=dock.width+1,'Dock never overflows horizontally');
    await page.locator('#article-dialog').evaluate(el=>el.scrollTop=el.scrollHeight);
    const afterScroll=await page.locator('#share-native').boundingBox();
    assert.ok(afterScroll&&afterScroll.y>=0&&afterScroll.y+afterScroll.height<=680,'Share remains visible after scrolling');
    await page.locator('#article-dialog').evaluate(el=>el.scrollTop=0);
    await page.screenshot({path:`test-results/reader-share-dock-${width}.png`});
   }
   const sourceLinks=await page.locator('#article-source .article-source-button').evaluateAll(nodes=>nodes.map(n=>n.href));
   assert.equal(sourceLinks.length,3,'Portuguese English and Spanish original-source buttons must remain available');
   assert.ok(sourceLinks.some(url=>!url.includes('translate.google.com')&&!url.includes('.translate.goog')),'Direct original publisher must always remain available');
   assert.equal(await page.locator('#article-source .article-source-button img').count(),3,'Each language source button must display its flag');
   assert.match(await page.locator('#article-source .source-access-warning').innerText(),/navegador/);
   // Switching the entire site to English must translate weather and publisher footer.
   await page.locator('#article-dialog .x').click();
   await page.locator('[data-site-lang="en"]').click();
   assert.equal(await page.locator('[data-site-lang="en"]').getAttribute('aria-pressed'),'true');
   assert.equal(await page.locator('#clima-desktop .weather-top h2').textContent(),'Weather');
   assert.equal(await page.locator('#footer-publisher').innerText(),'DrivMatch News — um produto da Hands On Dispatcher LLC');
   assert.equal(await page.locator('#footer-legal').innerText(),'© 2026 Hands On Dispatcher LLC. Todos os direitos reservados.');
   await page.locator('[data-site-lang="pt"]').click();
   assert.equal(await page.locator('[data-site-lang="pt"]').getAttribute('aria-pressed'),'true');
   assert.match(await page.locator('#footer-publisher').innerText(),/um produto da Hands On Dispatcher LLC/);
   await openEditorial();
   assert.equal(await page.locator('#share-native').count(),1);
   assert.equal(await page.locator('#share-copy').count(),1);
   await page.locator('#share-native').click();
   assert.equal(await page.locator('#share-options').isVisible(),true);
   if(width<=390) {
    const picker=await page.evaluate(()=>{
     const rect=document.getElementById('share-options').getBoundingClientRect();
     return {top:rect.top,bottom:rect.bottom,left:rect.left,right:rect.right,viewportWidth:innerWidth,viewportHeight:innerHeight};
    });
    assert.ok(picker.top>=-1&&picker.bottom<=picker.viewportHeight+1,`Share chooser must fit mobile viewport: ${JSON.stringify(picker)}`);
    assert.ok(picker.left>=-1&&picker.right<=picker.viewportWidth+1,'Share chooser must not crop horizontally');
    await page.screenshot({path:`test-results/reader-share-picker-${width}.png`});
   }
   for(const platform of ['whatsapp','facebook','threads','x','linkedin','telegram','reddit','pinterest','email']){
    assert.equal(await page.locator('[data-share-platform="'+platform+'"]').count(),1);
    assert.ok((await page.locator('[data-share-platform="'+platform+'"]').getAttribute('href')).length>10);
   }
   assert.match(await page.locator('[data-share-platform="whatsapp"]').getAttribute('href'),/^https:\/\/web\.whatsapp\.com\/send\?text=/);
   assert.equal(await page.locator('#share-whatsapp-copy').isVisible(),true);
   const images=await page.locator('#panorama article img, #list article img').evaluateAll(nodes=>nodes.map(n=>({url:n.getAttribute('src'),story:n.closest('[data-story]')?.getAttribute('data-story')})).filter(x=>x.url));
   const distinct=new Map(images.map(x=>[x.story,x.url]));
   assert.equal(new Set(distinct.values()).size,distinct.size,'No two different news stories can use the same photo');
   const photoNodes=page.locator('#features article[data-external="true"] img[src^="assets/news-photos/"], #list article[data-external="true"] img[src^="assets/news-photos/"]');
   assert.ok(await photoNodes.count()>=1,'External news stories must show real locally served photo thumbnails');
   const photos=await photoNodes.evaluateAll(els=>els.map(im=>({complete:im.complete,width:im.naturalWidth,height:im.naturalHeight,alt:im.alt})));
   assert.ok(photos.every(p=>p.complete&&p.width>=340&&p.height>=180),'Real news thumbnail JPEGs must load successfully');
   assert.ok(photos.every(p=>/arquivo ilustrativa|archive photograph|archivo ilustrativa/i.test(p.alt)),'Archive photographs must not be represented as event photos');
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
   await page.locator('[data-site-lang="en"]').click();
   assert.equal(await page.locator('#market-title').textContent(),'Market Focus');
   assert.deepEqual(errors,[]);
   await page.screenshot({path:`test-results/${width}.png`,fullPage:true});await page.close();
   console.log(`PASS ${width}px: logo, no overflow, market, weather, article translation`);
  }
 }finally{if(browser)await browser.close();server.kill()}
})().catch(e=>{console.error(e);process.exitCode=1});
