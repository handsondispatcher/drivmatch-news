/* Scheduled camera health: browser-observed provider error text, not iframe.onload.
   Fail open on probe/network failures: unknown is not certified live. */
const {chromium}=require('playwright');
const fs=require('fs');
(async()=>{
 const source=fs.readFileSync('site/assets/road-tv-live.js','utf8');
 const match=source.match(/const directCameras=\[([\s\S]*?)\n \];/);
 if(!match)throw Error('Camera catalog not found');
 const cameras=[...match[1].matchAll(/\{id:'([^']+)',name:'[^']+',embed:'([^']+)',page:'[^']+'\}/g)]
   .map(m=>({id:m[1],url:m[2]}));
 const unavailable_ids=[],details=[];
 const browser=await chromium.launch({headless:true});
 for(const camera of cameras){
  const page=await browser.newPage({viewport:{width:900,height:600}});
  let result='unknown';
  try{
   await page.goto(camera.url,{waitUntil:'domcontentloaded',timeout:16000});
   await page.waitForTimeout(4500);
   const contents=await Promise.all(page.frames().map(async f=>{try{return await f.locator('body').innerText({timeout:3000})}catch{return ''}}));
   const body=contents.join(' ').toLowerCase();
   if(/stream isn't live now|stream is not live now|video unavailable|vídeo indisponível|recording of this live stream is not available|gravação dessa transmissão ao vivo não está disponível|stream offline|camera is offline|this video is unavailable|live stream is offline/i.test(body)){
    result='explicit_offline';unavailable_ids.push(camera.id);
   }else result='not_confirmed_offline';
  }catch(e){result='probe_unknown'}
  details.push({id:camera.id,status:result});
  await page.close();
 }
 await browser.close();
 fs.mkdirSync('site/data',{recursive:true});
 fs.writeFileSync('site/data/camera-health.json',JSON.stringify({
   schema_version:1,checked_at:new Date().toISOString(),unavailable_ids,details,
   note:'Only explicit player failures are excluded; unknown does not prove live playback.'
 },null,2)+'\n');
 console.log('Camera health probe:',details);
})().catch(e=>{console.error('Camera health probe:',e.message);process.exitCode=1});
