/* Deploy separately as a Cloudflare Worker AFTER vendor redistribution approval.
 * Upstream must return the normalized commercial spot contract in docs/OPERATIONS.md.
 * Credentials stay in Worker secrets. This does not enable a vendor subscription.
 */
export default {
 async fetch(request,env) {
  const origin=request.headers.get('Origin');
  const allowed=new Set(['https://drivmatch.com','https://handsondispatcher.github.io']);
  const headers={'Content-Type':'application/json','Cache-Control':'public, max-age=15','Vary':'Origin'};
  if(allowed.has(origin))headers['Access-Control-Allow-Origin']=origin;
  if(request.method!=='GET')return new Response('',{status:405,headers});
  if(env.REDISTRIBUTION_AUTHORIZED!=='true'||!env.PROVIDER_URL?.startsWith('https://'))
   return new Response(JSON.stringify({status:'unavailable'}),{status:503,headers});
  try {
   const cacheKey=new Request(request.url,{method:'GET'});
   const cached=await caches.default.match(cacheKey);if(cached)return cached;
   const response=await fetch(env.PROVIDER_URL,{headers:{Authorization:'Bearer '+env.PROVIDER_TOKEN},signal:AbortSignal.timeout(8000)});
   if(!response.ok)throw Error('provider');
   const d=await response.json();const age=Date.now()-Date.parse(d.observed_at);
   if(d.symbol!=='USD/BRL'||d.instrument!=='spot'||d.price_type!=='commercial'||!Number.isFinite(d.value)||d.value<=0||!Number.isFinite(age)||age< -30000||age>432000000||!d.source||!d.source_url?.startsWith('https://'))throw Error('contract');
   const safe={symbol:'USD/BRL',instrument:'spot',price_type:'commercial',value:d.value,source:d.source,source_url:d.source_url,observed_at:d.observed_at,quote_status:age>60000?'delayed':'snapshot'};
   const result=new Response(JSON.stringify(safe),{headers});await caches.default.put(cacheKey,result.clone());return result;
  }catch{return new Response(JSON.stringify({status:'unavailable'}),{status:503,headers})}
 }
};
