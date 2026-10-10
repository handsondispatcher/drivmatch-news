// Production visitor audit. Unlike the existing visual tests, no vendor streams are mocked.
// No fake driver, no test feed, and no inference that iframe load means moving video.
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const OUT=path.join('test-results','live-site-visitor-audit');
const targets=[
 {name:'custom',url:'https://drivmatch.com/news/'},
 {name:'pages',url:'https://handsondispatcher.github.io/drivmatch-news/'}
];
const viewports=[{name:'desktop',width:1440,height:900},
 {name:'mobile',width:390,height:844}];
const sleep=ms=>new Promise(done=>setTimeout(done,ms));
async function audit(){
 fs.mkdirSync(OUT,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--disable-cache']});
 const all=[];
 try{
  for(const site of targets){
   for(const view of viewports){
    const row={origin:site.name,viewport:view.name,visited_at:new Date().toISOString(),url:site.url,
      errors:[],failedRequests:[],consoleErrors:[],responses:[],data:{},rendered:{}};
    const context=await browser.newContext({viewport:{width:view.width,height:view.height},
      ignoreHTTPSErrors:false,serviceWorkers:'block'});
    const page=await context.newPage();
    page.on('pageerror',e=>row.errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')row.consoleErrors.push(m.text().slice(0,360))});
    page.on('requestfailed',r=>{if(row.failedRequests.length<25)row.failedRequests.push({
      url:r.url().slice(0,180),failure:r.failure()?.errorText})});
    page.on('response',r=>{if(/(\/data\/|\/assets\/app\.js|road-tv-live\.js|bootstrap\.js)/.test(r.url())&&
         row.responses.length<25)row.responses.push({status:r.status(),url:r.url().slice(0,180)})});
    try{
      const resp=await page.goto(site.url+'?__real_user_audit='+Date.now(),
                   {waitUntil:'domcontentloaded',timeout:45000});
      row.html_status=resp?.status()??null;
      try{await page.locator('#features .hero-wrap h3').waitFor({state:'visible',timeout:15000})}
      catch(e){row.errors.push('hero_not_visible:'+e.message.slice(0,170))}
      await sleep(4800);
      row.rendered=await page.evaluate(()=>{
        const text=s=>[...document.querySelectorAll(s)].map(e=>e.textContent?.trim()).filter(Boolean);
        const sel=s=>document.querySelector(s);
        const roads=['#roadtv-desktop','#roadtv-mobile'].map(q=>{
          const el=sel(q),frame=el?.querySelector('iframe');
          return {selector:q,visible:!!el&&el.getBoundingClientRect().width>0,
            frame:frame?.src||null,frame_title:frame?.title||null,
            text:el?.innerText?.slice(0,180)||'',frame_count:el?.querySelectorAll('iframe').length||0};
        });
        const boot=window.DRIVMATCH_BOOTSTRAP||{};
        return {
          version:sel('meta[name="drivmatch-news-version"]')?.content||null,
          headline:text('#features .hero-wrap h3')[0]||null,
          related:text('#features .related-rail h3').slice(0,3),
          list:text('#list article h3').slice(0,6),
          article_cards:document.querySelectorAll('#list article').length,
          total_bootstrap:boot.articles?.length??null,
          bootstrap_external:boot.articles?.filter(x=>x.kind==='external_link').length??null,
          latest_bootstrap_story:boot.articles?.map(a=>a.published_at).filter(Boolean).sort().reverse()[0]||null,
          freshness_text:sel('#news-freshness')?.innerText||null,
          freshness_hidden:!!sel('#news-freshness')?.hidden,
          error_banner:text('.roadtv-camera-unavailable').slice(0,2),
          roads,
          body_horizontal_overflow:document.documentElement.scrollWidth>innerWidth,
          status:document.readyState,
          script_sources:[...document.scripts].filter(s=>s.src).map(s=>s.src).filter(s=>/app\.js|bootstrap\.js|road-tv-live\.js/.test(s))
        };
      });
      for(const [name,endpoint] of [['content','data/content.json'],['sources','data/source-headlines.json'],['roadtv','data/road-tv.json']]){
        try{
          const response=await context.request.get(site.url+endpoint+'?audit='+Date.now(),
              {headers:{'Cache-Control':'no-cache'},timeout:20000});
          const d=await response.json();
          row.data[name]=name==='content'?
            {http:response.status(),generation:d.generated_at,total:d.articles?.length,
              external:d.articles?.filter(x=>x.kind==='external_link').length,
              latest:d.articles?.map(a=>a.published_at).filter(Boolean).sort().reverse()[0]}:
            name==='sources'?
            {http:response.status(),generation:d.generated_at,
              headlines:d.headlines?.length,latest:d.latest_headline_at,fresh6h:d.fresh_6h}:
            {http:response.status(),generation:d.generated_at,status:d.live_status,
              live_checked_at:d.live_checked_at,candidates:d.candidates?.length,warnings:d.warnings};
        }catch(e){row.errors.push(endpoint+':'+String(e).slice(0,200))}
      }
      const filename=site.name+'-'+view.name+'.png';
      await page.screenshot({path:path.join(OUT,filename),fullPage:true,timeout:20000});
      row.screenshot=filename;
    }catch(e){row.errors.push('page_audit_failed:'+e.message.slice(0,500))}
    await context.close();
    all.push(row);
    console.log('VISITOR_AUDIT '+JSON.stringify(row));
   }
  }
 }finally{await browser.close()}
 fs.writeFileSync(path.join(OUT,'audit.json'),JSON.stringify(all,null,2));
 // This diagnostic never claims that a loaded iframe is actual moving video.
 const failures=all.filter(x=>x.html_status!==200||!x.rendered.headline);
 const mismatch=all.filter(x=>x.data.content?.total!=null&&
   x.rendered.total_bootstrap!=null&&x.data.content.total!==x.rendered.total_bootstrap);
 console.log('VISITOR_AUDIT_SUMMARY '+JSON.stringify({
    pagesChecked:all.length,unrendered:failures.length,contentMismatches:mismatch.length,
    liveCandidates:all[0]?.data.roadtv?.candidates,headlinesLast6h:all[0]?.data.sources?.fresh6h
 }));
 if(failures.length||mismatch.length)process.exitCode=1;
}
audit().catch(e=>{console.error('VISITOR_AUDIT_FATAL',e);process.exitCode=1});
