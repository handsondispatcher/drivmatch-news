const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const code=fs.readFileSync('site/assets/audience-analytics.js','utf8');

function scene(id,path='/news/'){
  const children=[],head=[],store=new Map(),scripts=[];
  const document={
    readyState:'complete',
    createElement(tag){
      const el={tagName:tag,style:{},attributes:{},children:[],
        setAttribute(k,v){this.attributes[k]=v},
        appendChild(child){this.children.push(child)},
        remove(){children.splice(children.indexOf(this),1)},
        onclick:null};
      return el;
    },
    body:{appendChild(el){children.push(el)}},
    head:{appendChild(el){head.push(el);scripts.push(el.src)}},
  };
  const window={DRIVMATCH_ANALYTICS_CONFIG:{ga4_id:id}};
  const context={window,document,location:{pathname:path},localStorage:{
    getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)
  },Date,encodeURIComponent};
  vm.runInNewContext(code,context);
  return {window,children,head,store,scripts};
}
const s=scene('G-ABCDEF1234');
assert.equal(s.children.length,1,'consent dialog expected');
s.window.DrivMatchAnalytics.track('news_article_open',{article_id:'report-01'});
assert.equal(s.window.dataLayer,undefined,'no data before consent');
s.children[0].children[1].children[0].onclick();
assert.equal(s.store.get('drivmatch-news-analytics-consent-v1'),'yes');
assert.equal(s.head.length,1,'GA script loaded only after consent');
assert.ok(s.window.dataLayer.some(x=>x[0]==='event'&&x[1]==='news_article_open'));
s.window.DrivMatchAnalytics.track('roadtv_player_started',{video_platform:'youtube',video_status:'live'});
assert.ok(s.window.dataLayer.some(x=>x[0]==='event'&&x[1]==='roadtv_player_started'));
const deny=scene('G-ABCDEF1234');deny.children[0].children[1].children[1].onclick();
assert.equal(deny.head.length,0,'refusal must not load GA4');
const invalid=scene('');assert.equal(invalid.children.length,0);
const other=scene('G-ABCDEF1234','/');assert.equal(other.children.length,0);
console.log('AUDIENCE ANALYTICS TESTS PASS: consent, anonymous event queue, rejection, /news scope');
