const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
(async()=>{
 const server=spawn('python',['-m','http.server','8767','--directory','site']);
 let browser;
 try{
  await new Promise(resolve=>setTimeout(resolve,1100));
  browser=await chromium.launch({headless:true});
  for(const width of [360,390,768]){
   const page=await browser.newPage({viewport:{width,height:800}});
   await page.goto('http://127.0.0.1:8767/',{waitUntil:'domcontentloaded',timeout:15000});
   await page.waitForTimeout(1200);
   const result=await page.evaluate(()=>{
    const viewport=innerWidth,scrollWidth=document.documentElement.scrollWidth;
    const offenders=[...document.querySelectorAll('body *')].map(el=>{
     const r=el.getBoundingClientRect();
     return {tag:el.tagName,id:el.id,cls:String(el.className||'').slice(0,100),left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width),text:(el.textContent||'').trim().slice(0,30)};
    }).filter(x=>x.right>viewport+1&&x.width>0).sort((a,b)=>b.right-a.right).slice(0,25);
    return {viewport,scrollWidth,offenders};
   });
   console.log('MOBILE_OVERFLOW_DIAGNOSIS '+JSON.stringify(result));
   await page.close();
  }
 }finally{if(browser)await browser.close();server.kill('SIGTERM')}
})().catch(e=>{console.error(e);process.exit(1)});
