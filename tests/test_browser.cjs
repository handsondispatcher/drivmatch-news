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
  for(const width of [360,390,768,944,1440]) {
   const page=await browser.newPage({viewport:{width,height:width<=390?680:900}});const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   // YouTube content is owned by the creator; do not depend on its network in CI.
   await page.route('https://www.youtube-nocookie.com/**',route=>route.fulfill({status:200,body:'<!doctype html><title>Official player test stub</title>'}));
   // Stub CamStreamer only inside CI; iframe insertion does not certify real-world playback.
   await page.route('https://camstreamer.com/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>CamStreamer native embed test stub</title>'}));
   await page.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});
   assert.equal(await page.locator('.brand img').evaluate(e=>e.naturalWidth>0),true);
   assert.equal(await page.locator('meta[name="drivmatch-news-version"]').getAttribute('content'),'v34.9','public page has v34.9 version');
   assert.equal(await page.locator('#site-version').isVisible(),false,'Internal release must not appear in public masthead');
   assert.equal(await page.locator('#edition-date').isVisible(),false,'Internal edition date is not visible');
   assert.equal((await page.locator('.header').innerText()).includes('EDIÇÃO DIGITAL'),false,'No technical edition text on masthead');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`overflow ${width}`);
   // Immutable editorial composition: search exclusively above institutional footer.
   const layout=await page.evaluate(()=>{
     const q=document.getElementById('pesquisa-noticias');
     const footer=document.querySelector('footer.footer');
     const cta=document.querySelector('.newsroom-partner-cta');
     const flags=[...document.querySelectorAll('.language-shortcuts button')].map(x=>x.getBoundingClientRect());
     return {searchBeforeFooter:q.compareDocumentPosition(footer)&Node.DOCUMENT_POSITION_FOLLOWING,
             ctaBeforeSearch:cta.compareDocumentPosition(q)&Node.DOCUMENT_POSITION_FOLLOWING,
             searchCount:document.querySelectorAll('#search').length,
             inventedTitle:document.body.textContent.includes('NOTÍCIAS DO TRANSPORTE AMERICANO'),
             flagRows:flags.map(r=>Math.round(r.top))};
   });
   assert.ok(layout.searchBeforeFooter&&layout.ctaBeforeSearch&&layout.searchCount===1,'Search must be only above footer');
   assert.equal(layout.inventedTitle,false,'Unapproved editorial heading must never return');
   assert.ok(Math.max(...layout.flagRows)-Math.min(...layout.flagRows)<=3,'Language buttons must remain on one horizontal row');
   const languageFrame=await page.locator('.header .language-picker').evaluate(el=>{
     const css=getComputedStyle(el);
     return {border:css.borderTopWidth,background:css.backgroundColor,shadow:css.boxShadow};
   });
   assert.equal(languageFrame.border,'0px','No second surrounding language border');
   assert.equal(languageFrame.shadow,'none','No second surrounding language shadow');
   assert.equal(await page.locator('.header .language-shortcuts button').count(),3);
   const shadow=await page.locator('.header .language-shortcuts button.selected').evaluate(el=>getComputedStyle(el).boxShadow);
   assert.equal(shadow,'none','Selected language has its own border but no overlaid shadow');
   assert.equal(await page.locator('#search').isVisible(),true);
   // The approved v31 editorial composition must not silently downgrade to v18 cards.
   assert.equal(await page.locator('#features > .hero-wrap article').count(),1,'v31 requires one lead story');
   assert.equal(await page.locator('#features > .related-rail article').count(),3,'v31 requires three related stories');
   assert.equal(await page.locator('.language-shortcuts button[data-site-lang]').count(),3,'v31 language shortcuts must be present');
   // v33 polish: arrows are compact, every dot can navigate directly.
   const dots=page.locator('#featureDots button[data-slide]');
   assert.ok(await dots.count()>=2,'Multiple Panorama pages must expose direct navigation dots');
   if(width>=944){
     const ctr=await page.locator('#panorama .carousel-controls').evaluate(el=>el.getBoundingClientRect());
     const hero=await page.locator('#features > .hero-wrap').evaluate(el=>el.getBoundingClientRect());
     assert.ok(ctr.left>=hero.left-1 && ctr.right<=hero.right+2,
       'Arrows must sit within horizontal footprint of hero, never over Leia Também');
     assert.ok(ctr.bottom<=hero.top+1,'Arrows should sit immediately above hero image');
   }
   assert.equal(await page.locator('#featurePrev').innerText(),'←');
   assert.equal(await page.locator('#featureNext').innerText(),'→');
   assert.equal(await page.locator('#featureDots button[aria-current="page"]').count(),1);
   assert.ok(await page.locator('#featurePrev').evaluate(e=>e.getBoundingClientRect().height)<=38,'Carousel arrows must be compact');
   const originalHeadline=await page.locator('#features > .hero-wrap h3').textContent();
   const relatedBefore=await page.locator('#features > .related-rail article h3').allTextContents();
   const contextBefore=await page.locator('#features > .related-rail p.editorial-context').count();
   assert.equal(contextBefore,3,'Three green-context related cards only');
   assert.equal(await page.locator('#features > .hero-wrap p.editorial-context').count(),0,'No context CTA in lead hero');
   assert.equal(await page.locator('#noticias p.editorial-context').count(),0,'No context CTA in news list');
   await dots.nth(1).click();
   assert.notEqual(await page.locator('#features > .hero-wrap h3').textContent(),originalHeadline,'Dot jumps to selected carousel page');
   assert.deepEqual(await page.locator('#features > .related-rail article h3').allTextContents(),relatedBefore,
     'Leia Também cards must remain unchanged as hero carousel rotates');
   assert.ok((await page.locator('#featureCount').textContent()).trim().startsWith('2 /'));
   await page.locator('#featurePrev').click();
   assert.equal(await page.locator('#features > .hero-wrap h3').textContent(),originalHeadline);
   assert.ok(await page.locator('#highlightList li').count()>=1,'News briefing must reflect the real feed');
   assert.ok(await page.locator('#highlightList li').count()<=5,'Briefing must not fabricate stories');
   // v34 newsroom must be editorial-forward: real licensed thumbnails and tiny
   // commercial bridge; preserve tested compact mobile reading.
   assert.equal(await page.locator('.newsroom-nav').count(),0,'Owner removed redundant top newsroom navigation');
   assert.equal(await page.locator('#chips,.chip').count(),0,'Owner removed public news category chip grid');
   assert.equal(await page.locator('#highlights-note').count(),0,'No editorial selection explanatory sentence');
   assert.equal(await page.locator('#news-commercial-banner .ad-link').count(),1,'A real house banner replaces news chips');
   assert.equal(await page.locator('#market-commercial-banner .ad-link').count(),1,'Side blank must become clearly labeled house banner');
   const topAd=await page.locator('#news-commercial-banner').innerText();
   assert.match(topAd,/DrivMatch/,'No fake third-party paid advertiser');
   assert.equal(await page.locator('#top-city-select').count(),1,'Reader can choose city/state');
   assert.equal(await page.locator('#top-city-select').inputValue(),'auto','Default city selection rotates every 10 minutes');
   assert.equal(await page.locator('#top-city-select option[value="auto"]').count(),1);
   assert.equal(await page.locator('#highlightList .highlight-photo').count(),await page.locator('#highlightList li').count(),'Highlights must carry real source-derived local images or honest illustrated fallback');
   assert.equal(await page.locator('#newsroom-cta-driver').getAttribute('href').then(x=>x.includes('utm_source=drivmatch_news')),true);
   assert.equal(await page.locator('#newsroom-cta-carrier').getAttribute('href').then(x=>x.includes('utm_content=carrier')),true);
   assert.equal(await page.locator('#article-dialog').count(),1,'Never replace original v33 compact mobile reader');
   // Category selection remains available in the footer archive search, not as banners/chips.
   await page.locator('#category').selectOption('Fretes');
   assert.equal(await page.locator('#category').inputValue(),'Fretes','Footer archive filter still works');
   await page.locator('#category').selectOption('Todas');
   assert.equal(await page.locator('#category').inputValue(),'Todas','Footer reset still works');
   const options=await page.locator('#top-city-select option').count();
   if(options>1){
     const city=await page.locator('#top-city-select option').nth(1).getAttribute('value');
     await page.locator('#top-city-select').selectOption(city);
     assert.equal(await page.locator('#top-city-select').inputValue(),city,'Explicit city choice pins weather');
     await page.locator('#top-city-select').selectOption('auto');
     assert.equal(await page.locator('#top-city-select').inputValue(),'auto','Automatic 10-minute rotation can be restored');
   }
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
   assert.equal(await page.locator('#market-title').textContent(),'Cotações e Mercado');
   // No placeholders for prices unavailable to the authorized data pipeline.
   assert.equal(await page.locator('#market .sidegroup').count(),0,'Remove empty transport-stock heading');
   assert.equal(await page.locator('#market').innerText().then(x=>/Class 8|J.B. Hunt|Knight-Swift|FedEx|FDX/.test(x)),false,'Do not show dead tickers');
   assert.ok(await page.locator('#market .market-live-row').count()<=3,'Only three verified indicator categories allowed');
   assert.equal(await page.locator('#market .market-live-row').count()+(await page.locator('#market .market-unavailable').count())>0,true,'Either verified data or one explanation is visible');
   // Road TV sits between visible Ventusky and USD/diesel/Brent on all screens.
   const tv=width>990?'#roadtv-desktop':'#roadtv-mobile';
   const flow=await page.evaluate(width=>{
     const ids=width>990?['clima-desktop','roadtv-desktop','market-title']:
                           ['clima-mobile','roadtv-mobile','market-title-mobile'];
     return ids.map(id=>document.getElementById(id).getBoundingClientRect().top);
   },width);
   assert.ok(flow[0]<flow[1]&&flow[1]<flow[2],`Weather→TV→Market broken: ${flow}`);
   // v34.9: show one direct camera video embed, never a tiny map or links-only tile.
   const tvCard=page.locator(tv);
   assert.equal(await tvCard.locator('h2').count(),0,'No unapproved TV title');
   assert.equal(await tvCard.locator('button,.roadtv-channels,.roadtv-credit,.roadtv-toolbar').count(),0);
   assert.equal(await tvCard.locator('.roadtv-screen').count(),1);
   const camera=tvCard.locator('iframe.roadtv-publisher-camera');
   await camera.waitFor({state:'attached',timeout:11000});
   assert.match(await camera.getAttribute('src'),/^https:\/\/camstreamer\.com\/embed\//,'Player must open an actual camera embed');
   assert.equal(await tvCard.locator('.roadtv-official-map').count(),0,'No embedded map in video area');
   assert.equal(await tvCard.locator('.roadtv-camera-credit a[href^="https://camstreamer.com/live/stream/"]').count(),1,'Publisher credit visible');
   assert.equal(await tvCard.locator('.roadtv-replay').count(),0,'Do not mark an independent live camera as recorded video');
   assert.equal(await page.locator('#mercados').isVisible(),width>990);
   assert.equal(await page.locator('#mobile-market').isVisible(),width<=990);
   assert.equal(await page.locator('#news-freshness').count(),1);
   assert.equal(await page.locator('#news-freshness').isVisible(),false,'Frescor editorial fica na auditoria, nunca no texto público');
   for(const id of ['top-usd-value','top-diesel-value','top-brent-value','top-weather-icon','top-risk']) {
     assert.equal(await page.locator('#'+id).count(),1,'Reference strip item '+id+' missing');
   }
   if(width>=944){
     const layout=await page.locator('.dm-util-inner').evaluate(el=>{
       const columns=getComputedStyle(el).gridTemplateColumns.trim().split(/\s+/).length;
       const rects=[...el.children].map(ch=>ch.getBoundingClientRect());
       const container=el.getBoundingClientRect();
       const overflow=rects.some(r=>r.left<container.left-2||r.right>container.right+2);
       const collision=rects.some((r,i)=>rects.slice(i+1).some(q=>
         r.left<q.right-1&&r.right>q.left+1&&r.top<q.bottom-1&&r.bottom>q.top+1));
       const rowTops=[...new Set(rects.map(r=>Math.round(r.top/5)*5))];
       return {columns,overflow,collision,rows:rowTops.length};
     });
     assert.equal(layout.columns,width===944?3:6,
       'City selector must use 3×2 responsive market strip at 944px and 6-wide on desktop');
     assert.equal(layout.rows,width===944?2:1,'Market/forecast modules should use intentional row layout');
     assert.equal(layout.overflow,false,'No weather/quote module should exceed its container');
     assert.equal(layout.collision,false,'Market/forecast modules must never overlap');
   }
   if(width===1440){
     for(const c of await page.locator('.related-rail p.editorial-context').all()){
       const x=await c.evaluate(el=>({height:el.getBoundingClientRect().height,lineHeight:parseFloat(getComputedStyle(el).lineHeight),text:el.textContent}));
       assert.ok(x.height<=x.lineHeight+1.5,'CTA must fit in a single line: '+x.text);
     }
   }
   if(width<=390){
     const dims=await tvCard.locator('.roadtv-screen').evaluate(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}));
     assert.ok(dims.width>=260&&dims.height>=195,'Road TV player space is usable on mobile');
     const size=await page.evaluate(()=>{
       const e=document.createElement('a');e.className='dm-crawler-link';document.body.appendChild(e);
       const n=parseFloat(getComputedStyle(e).fontSize);e.remove();return n;
     });
     assert.ok(size>=16,'Crawler must be >=16px on mobile');
   }
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
   assert.equal(await page.locator('#footer-legal').innerText(),
     '© 2026 Hands On Dispatcher LLC. Todos os direitos reservados. · v34.9');
   assert.equal(await page.locator('#footer-version').innerText(),'· v34.9');
   await page.locator('[data-site-lang="pt"]').click();
   assert.equal(await page.locator('#footer-version').textContent(),'· v34.9',
     'Release footer must persist when changing language');
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
   assert.equal(await page.locator('#market-title').textContent(),'Quotes & Markets');
   assert.deepEqual(errors,[]);
   if(width===1440){
     // Local fixture tests actual player error auto-rotation; no invented video ships.
     const first='A1b2C3d4E5f',second='B1b2C3d4E5f';
     const candidate=id=>({platform:'youtube',video_id:id,
       video_url:'https://www.youtube.com/watch?v='+id,
       channel_url:'https://www.youtube.com/channel/UCAAAAAAAAAAAAAAAAAAAAAA',
       title:'USA semi truck forward windshield dashcam highway',
       live:true,status:'live',geo_evidence:'publisher metadata',
       camera_evidence:'publisher metadata',verification:'CI fixture'});
     const fixture={schema_version:2,generated_at:new Date().toISOString(),
       live_checked_at:new Date().toISOString(),candidates:[candidate(first),candidate(second)]};
     await page.route('**/data/road-tv.json?ts=*',route=>route.fulfill({
       status:200,contentType:'application/json',body:JSON.stringify(fixture)}));
     await page.route('https://www.youtube.com/embed/**',route=>route.fulfill({status:200,body:'<!doctype html><title>Test only</title>'}));
     await page.addInitScript(()=>{
       window.YT={Player:class {
         constructor(root,options){
           this.options=options;window.__ytOptions=options;
           this.iframe=document.createElement('iframe');
           this.iframe.src='https://www.youtube.com/embed/'+options.videoId;
           root.appendChild(this.iframe);
           setTimeout(()=>options.events.onReady({target:this}),0);
         }
         mute(){}
         playVideo(){this.options.events.onStateChange({data:1})}
         destroy(){this.iframe.remove()}
       }};
     });
     await page.reload({waitUntil:'networkidle'});
     await page.locator('#roadtv-desktop iframe').first().waitFor({state:'attached',timeout:9000});
     assert.ok((await page.locator('#roadtv-desktop iframe').getAttribute('src')).includes(first),'First validated stream plays');
     await page.evaluate(()=>window.__ytOptions.events.onError({data:100}));
     await page.waitForFunction(id=>(document.querySelector('#roadtv-desktop iframe')?.src||'').includes(id),second);
     assert.ok((await page.locator('#roadtv-desktop iframe').getAttribute('src')).includes(second),'Player failure selects alternative');
   }
   await page.screenshot({path:`test-results/${width}.png`,fullPage:true});await page.close();
   console.log(`PASS ${width}px: logo, no overflow, market, weather, article translation`);
  }
 }finally{if(browser)await browser.close();server.kill()}
})().catch(e=>{console.error(e);process.exitCode=1});
