/* Offline browser smoke of DrivMatch /TV. All feeds/auth are simulated.
 * This DOES NOT claim any broadcaster stream works in production.
 */
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '../site/TV');
const origin = 'http://127.0.0.1:18764';
const paths = {'/TV/':'index.html','/TV/index.html':'index.html','/TV/app.js':'app.js','/TV/tv.css':'tv.css'};
const m3uES = ['#EXTM3U','#EXTINF:-1 group-title="News",24 Horas (720p)',
  'https://mock.example/24horas.m3u8'].join('\n');
const m3uGlobal = ['#EXTM3U','#EXTINF:-1 tvg-id="NHKWorldJapan.jp@HD" group-title="Culture;News",NHK World-Japan',
  'https://mock.example/nhk.m3u8'].join('\n');

async function main(){
  const server=http.createServer((req,res)=>{
    if(req.url==='/TV/config.js'){
      res.writeHead(200, {'Content-Type':'text/javascript'});
      res.end('window.DRIVMATCH_PRIVATE_TV_CONFIG={supabaseUrl:"https://tenant.supabase.co",supabaseAnonKey:"sb_publishable_public_test_fixture_123456"};');
      return;
    }
    const file=paths[req.url];
    if(!file){res.writeHead(404);res.end();return;}
    res.writeHead(200,{'Content-Type':file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':'text/javascript'});
    fs.createReadStream(path.join(ROOT,file)).pipe(res);
  });
  await new Promise(resolve=>server.listen(18764,'127.0.0.1',resolve));
  let browser;
  try{
    browser=await chromium.launch({headless:true});
    const setup=async(allowed,session)=>{
      const context=await browser.newContext();
      if(session)await context.addInitScript(()=>{
        localStorage.setItem('sb-tenant-auth-token',JSON.stringify({access_token:'test-bearer-token-over-twenty-characters',expires_at:Math.floor(Date.now()/1000)+1800}));
      });
      await context.route('https://tenant.supabase.co/**',route=>{
        route.fulfill({status:allowed?200:403,contentType:'application/json',
          headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify({allowed})});
      });
      await context.route('https://iptv-org.github.io/**',route=>{
        const u=route.request().url();
        route.fulfill({status:200,contentType:'audio/x-mpegurl',headers:{'Access-Control-Allow-Origin':'*'},
          body:u.endsWith('/es.m3u')?m3uES:u.endsWith('/news.m3u')?m3uGlobal:'#EXTM3U'});
      });
      await context.route('https://mock.example/**',route=>route.abort());
      return context;
    };
    // Anonymous: the player and playlists must be inaccessible.
    {
      const context=await setup(false,false);
      const page=await context.newPage();
      await page.goto(origin+'/TV/');
      await page.getByText('Entre primeiro na sua conta autorizada do DrivMatch.').waitFor();
      assert.equal(await page.locator('#tv').isVisible(),false);
      await context.close();
    }
    // Unapproved account: server denies access even with an existing session.
    {
      const context=await setup(false,true);
      const page=await context.newPage();
      await page.goto(origin+'/TV/');
      await page.getByText(/Acesso negado ou indisponível/).waitFor();
      assert.equal(await page.locator('#tv').isVisible(),false);
      await context.close();
    }
    // Approved account: world news appears; selecting a stream stays in the page.
    {
      const context=await setup(true,true);
      const page=await context.newPage();
      await page.goto(origin+'/TV/');
      await page.getByText('NHK World-Japan').first().waitFor();
      await page.getByText('24 Horas (720p)').first().click();
      await page.locator('video[src="https://mock.example/24horas.m3u8"]').waitFor();
      assert.equal(await page.locator('a[target="_blank"]').count(),0);
      assert.equal(await page.locator('#current-channel').textContent(),'24 Horas (720p)');
      await context.close();
    }
    process.stdout.write('Private TV offline browser smoke: anonymous DENY; non-owner DENY; owner in-page video selector PASS.\n');
  }finally{
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(err=>{console.error(err);process.exit(1);});
