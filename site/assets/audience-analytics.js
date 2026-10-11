/* DrivMatch News analytics v1. Public GA4 measurement ID is provisioned at build.
 * No tracking before consent. Never send names, emails, IPs or article bodies.
 * "player_started" is emitted ONLY on YouTube PLAYER_STATE_PLAYING, not iframe load.
 */
(()=>{
'use strict';
const id=String(window.DRIVMATCH_ANALYTICS_CONFIG?.ga4_id||'').trim();
const valid=/^G-[A-Z0-9]{6,20}$/.test(id);
const key='drivmatch-news-analytics-consent-v1';
const onNews=location.pathname.replace(/\/+$/,'').endsWith('/news')||
  location.pathname.replace(/\/+$/,'').endsWith('/news/index.html');
let enabled=false,queue=[];
const allowedEvents=new Set(['news_article_open','news_source_click','news_share_click',
 'roadtv_player_started','roadtv_player_paused','roadtv_player_error',
 'roadtv_camera_selected','roadtv_camera_rotated','roadtv_video_selected']);
const safe=x=>String(x||'').replace(/[^\w\-]/g,'').slice(0,75);
function send(name,fields={}){
 if(!valid||!onNews||!allowedEvents.has(name))return;
 const payload={};
 for(const key of ['article_id','article_category','article_source','video_platform','video_status','player_kind','share_platform','source_language']){
   if(Object.prototype.hasOwnProperty.call(fields,key))payload[key]=safe(fields[key]);
 }
 if(enabled&&typeof window.gtag==='function')window.gtag('event',name,payload);
 else if(queue.length<30)queue.push([name,payload]);
}
function activate(){
 if(!valid||enabled)return;
 enabled=true;
 window.dataLayer=window.dataLayer||[];
 window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};
 window.gtag('js',new Date());
 window.gtag('config',id,{send_page_view:true,anonymize_ip:true,
   page_path:'/news',allow_google_signals:false,allow_ad_personalization_signals:false});
 const script=document.createElement('script');
 script.async=true;
 script.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(id);
 document.head.appendChild(script);
 queue.splice(0).forEach(([name,fields])=>window.gtag('event',name,fields));
}
function choice(value,notice){
 try{localStorage.setItem(key,value)}catch{}
 notice.remove();
 if(value==='yes')activate();
}
function showConsent(){
 if(!valid||!onNews)return;
 let stored=null;
 try{stored=localStorage.getItem(key)}catch{}
 if(stored==='yes'){activate();return}
 if(stored==='no')return;
 const notice=document.createElement('section');
 notice.id='dm-analytics-choice';
 notice.setAttribute('role','region');
 notice.setAttribute('aria-label','Preferências de analytics');
 notice.style.cssText='position:fixed;bottom:12px;left:12px;right:12px;max-width:580px;z-index:9999;padding:14px;background:#09243d;color:white;border-radius:7px;box-shadow:0 3px 16px #0007;font:13px/1.5 Arial,sans-serif';
 const label=document.createElement('span');
 label.textContent='Podemos medir audiência e interações do DrivMatch News para melhorar o jornal? Somente após sua autorização.';
 notice.appendChild(label);
 const actions=document.createElement('div');actions.style.cssText='display:flex;gap:10px;margin-top:9px';
 [['Aceitar','yes'],['Recusar','no']].forEach(([title,val])=>{
   const btn=document.createElement('button');btn.type='button';btn.textContent=title;
   btn.style.cssText='padding:7px 13px;border:1px solid #9dbbd3;border-radius:4px;cursor:pointer';
   btn.onclick=()=>choice(val,notice);actions.appendChild(btn);
 });
 notice.appendChild(actions);document.body.appendChild(notice);
}
window.DrivMatchAnalytics={track:send,enabled:()=>enabled,configured:valid};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',showConsent,{once:true});
else showConsent();
})();