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
   assert.equal(await page.locator('meta[name="drivmatch-news-version"]').getAttribute('content'),'v34.1','public page has v34.1 version');
   assert.equal(await page.locator('#site-version').innerText(),'v34.1','public masthead identifies v34.1');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`overflow ${width}`);
   // The approved v31 editorial composition must not silently downgrade to v18 cards.
   assert.equal(await page.locator('#features > .hero-wrap article').count(),1,'v31 requires one lead story');
   assert.equal(await page.locator('#features > .related-rail article').count(),3,'v31 requires three related stories');
   assert.equal(await page.locator('.language-shortcuts button[data-site-lang]').count(),3,'v31 language shortcuts must be present');
   // v33 polish: arrows are compact, every dot can navigate directly.
   const dots=page.locator('#featureDots button[data-slide]');
   assert.ok(await dots.count()>=2,'Multiple Panorama pages must expose direct navigation dots');
   assert.equal(await page.locator('#featurePrev').innerText(),'←');
   assert.equal(await page.locator('#featureNext').innerText(),'→');
   assert.equal(await page.locator('#featureDots button[aria-current="page"]').count(),1);
   assert.ok(await page.locator('#featurePrev').evaluate(e=>e.getBoundingClientRect().height)<=38,'Carousel arrows must be compact');
   const originalHeadline=await page.locator('#features > .hero-wrap h3').textContent();
   await dots.nth(1).click();
   assert.notEqual(await page.locator('#features > .hero-wrap h3').textContent(),originalHeadline,'Dot jumps to selected carousel page');
   assert.ok((await page.locator('#featureCount').textContent()).trim().startsWith('2 /'));
   await page.locator('#featurePrev').click();
   assert.equal(await page.locator('#features > .hero-wrap h3').textContent(),originalHeadline);
   assert.ok(await page.locator('#highlightList li').count()>=1,'News briefing must reflect the real feed');
   assert.ok(await page.locator('#highlightList li').count()<=5,'Briefing must not fabricate stories');
   // v34 newsroom must be editorial-forward: real licensed thumbnails and tiny
   // commercial bridge; preserve tested compact mobile reading.
   assert.equal(await page.locator('.newsroom-nav a[data-newsroom-cat]').count(),5);
   assert.equal(await page.locator('#highlightList .highlight-photo').count(),await page.locator('#highlightList li').count(),'Highlights must carry real source-derived local images or honest illustrated fallback');
   assert.equal(await page.locator('#newsroom-cta-driver').getAttribute('href').then(x=>x.includes('utm_source=drivmatch_news')),true);
   assert.equal(await page.locator('#newsroom-cta-carrier').getAttribute('href').then(x=>x.includes('utm_content=carrier')),true);
   assert.equal(await page.locator('#article-dialog').count(),1,'Never replace original v33 compact mobile reader');
   const nav=page.locator('.newsroom-nav a[data-newsroom-cat="Fretes"]');
   await nav.click();
   assert.equal(await page.locator('#category').inputValue(),'Fretes','Newsroom nav uses existing category filter');
   await page.locator('.newsroom-nav a[data-newsroom-label="home"]').click();
   assert.equal(await page.locator('#category').inputValue(),'Todas','Front page resets existing filter');
   if(width===1440) {
     const hero=await page.locator('#features .hero-wrap article').evaluate(el=>({position:getComputedStyle(el).position,visible:el.getBoundingClientRect().width>0}));
     assert.ok(hero.visible,'Newsroom has a visible hero headline');
   }


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
   // No placeholders for prices unavailable to the authorized data pipeline.
   assert.equal(await page.locator('#market .sidegroup').count(),0,'Remove empty transport-stock heading');
   assert.equal(await page.locator('#market').innerText().then(x=>/Class 8|J.B. Hunt|Knight-Swift|FedEx|FDX/.test(x)),false,'Do not show dead tickers');
   assert.ok(await page.locator('#market .market-live-row').count()<=3,'Only three verified indicator categories allowed');
   assert.equal(await page.locator('#market .market-live-row').count()+(await page.locator('#market .market-unavailable').count())>0,true,'Either verified data or one explanation is visible');
   const card=width>990?'#clima-desktop':'#clima-mobile';
   assert.equal(await page.locator('#dm-crawler-track a[href*="thetrucker.com"]').count(),0,'Known geo-blocked publisher must not appear in ticker');
   // Approved layout: Ventusky is visible immediately, without a toggle.
   assert.match(await page.locator(card+' iframe').getAttribute('src'),/^https:\/\/embed\.ventusky\.com/);
   assert.equal(await page.locator(card+' iframe').isVisible(),true);
   assert.equal(await page.locator(card+' .weather-open').count(),1);
   if(width<=390){
    // Real RSS headlines have longer titles; test source buttons and share for an actual external story.
    const ext=page.locator('#features article[data-external="true"]').first();
    assert.ok(await ext.count()>0,'At least one live external source story should appear');
    await ext.click();
    const actual=await page.evaluate(()=>{
      const dialog=document.getElementById('article-dialog');
      const bottom=document.getElementById('share-copy').getBoundingClientRect().bottom;
      return {scroll:dialog.scrollHeight,client:dialog.clientHeight,bottom,visible:innerHeight};
    });
    assert.ok(actual.scroll<=actual.client+2,`Live external story should not need vertical scroll: ${JSON.stringify(actual)}`);
    assert.ok(actual.bottom<=actual.visible,'Share must be visible on actual external story');
    await page.screenshot({path:`test-results/mobile-live-headline-${width}.png`});
    await page.locator('#article-dialog .x').click();
   }
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
   // On mobile, sharing must fit in the article, not need a fixed overlay or scrollbar.
   const order=await page.evaluate(()=>Object.fromEntries(['modaltitle','modalmeta','article-reading','article-original','article-share-footer'].map(id=>[id,document.getElementById(id).getBoundingClientRect().top])));
   assert.ok(order.modaltitle<order['article-reading'] && order['article-reading']<order['article-original'] && order['article-original']<order['article-share-footer'],`semantic reading flow ${JSON.stringify(order)}`);
   if(width<=390){
    const fit=await page.evaluate(()=>{
     const dialog=document.getElementById('article-dialog');
     const share=document.getElementById('share-native').getBoundingClientRect();
     const copy=document.getElementById('share-copy').getBoundingClientRect();
     return {scrollHeight:dialog.scrollHeight,clientHeight:dialog.clientHeight,
       position:getComputedStyle(document.getElementById('article-share-footer')).position,
       share:{top:share.top,bottom:share.bottom,left:share.left,right:share.right,height:share.height},
       copy:{top:copy.top,bottom:copy.bottom,left:copy.left,right:copy.right,height:copy.height},
       viewportWidth:innerWidth,viewportHeight:innerHeight};
    });
    assert.equal(fit.position,'relative','Share controls must follow the article in normal flow; the picker anchors above them');
    assert.ok(fit.share.top>=0&&fit.share.bottom<=fit.viewportHeight,`Share visible without scroll ${JSON.stringify(fit)}`);
    assert.ok(fit.copy.top>=0&&fit.copy.bottom<=fit.viewportHeight,'Copy visible without scroll');
    assert.ok(fit.share.right<fit.copy.left,'Share and copy must be side by side');
    assert.ok(fit.share.height<=38&&fit.copy.height<=38,'Primary share buttons must be short');
    assert.ok(fit.scrollHeight<=fit.clientHeight+2,`Article must fit without internal scroll at ${width}px: ${JSON.stringify(fit)}`);
    await page.screenshot({path:`test-results/mobile-compact-reader-${width}.png`});
   }
   const sourceLinks=await page.locator('#article-source .article-source-button').evaluateAll(nodes=>nodes.map(n=>n.href));
   assert.equal(sourceLinks.length,3,'Portuguese English and Spanish original-source buttons must remain available');
   assert.ok(sourceLinks.some(url=>!url.includes('translate.google.com')&&!url.includes('.translate.goog')),'Direct original publisher must always remain available');
   assert.equal(await page.locator('#article-source .article-source-button img').count(),3,'Each language source button must display its flag');
   if(width<=390){
    assert.match(await page.locator('#article-source .source-access-short').innerText(),/navegador/);
    const sources=await page.locator('#article-source .article-source-button').evaluateAll(a=>a.map(e=>({height:e.getBoundingClientRect().height,top:e.getBoundingClientRect().top})));
    assert.ok(sources.every(x=>x.height<=38),'Source language buttons must be 35px, not tall stacked cards');
    assert.ok(Math.max(...sources.map(x=>x.top))-Math.min(...sources.map(x=>x.top))<=2,'Three source language buttons must fit on one row');
   }else{
    assert.match(await page.locator('#article-source .source-access-warning').innerText(),/navegador/);
   }
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
   assert.equal(langGrid,3,'The source links must stay on a single row, also at 768px');
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
