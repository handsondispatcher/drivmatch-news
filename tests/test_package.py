from pathlib import Path
import importlib.util
import json
import sys
import unittest
from unittest.mock import patch
from datetime import datetime,timezone
BASE=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(BASE/'scripts'))
import update as up
from collect_sources import parse_feed
class PublicationTests(unittest.TestCase):
 def test_visual_and_weather(self):
  page=(BASE/'site/index.html').read_text()
  for text in ['Panorama do Transporte','assets/logo-drivmatch-news.png','DrivMatch News — uma publicação da Hands On Dispatcher LLC','weather-mobile','weather-desktop','id="market-title"']:self.assertIn(text,page)
  self.assertLess(page.index('id="clima-desktop"'),page.index('id="market-title"'))
 def test_no_demo_default(self):
  self.assertTrue(all(up.publication_valid(a) for a in json.loads((BASE/'content/editorial.json').read_text())))
  self.assertFalse(up.publication_valid({'demo':True}))
  self.assertFalse(up.publication_valid({'status':'approved','published_at':'yesterday'}))
 def test_reject_daily_and_futures_as_spot(self):
  for instrument in ['daily_reference','future']:
   with patch.dict('os.environ',{'USDBRL_SPOT_URL':'https://vendor.example/feed','USDBRL_REDISTRIBUTION_AUTHORIZED':'true'}),patch.object(up,'fetch',return_value=json.dumps({'symbol':'USD/BRL','instrument':instrument,'price_type':'commercial'})):
    with self.assertRaises(ValueError):up.authorized_spot()
 def test_authorized_spot(self):
  d={'symbol':'USD/BRL','instrument':'spot','price_type':'commercial','session_status':'open','source':'test fixture','source_url':'https://vendor.example','value':5.1,'observed_at':datetime.now(timezone.utc).isoformat()}
  with patch.dict('os.environ',{'USDBRL_SPOT_URL':'https://vendor.example/feed','USDBRL_REDISTRIBUTION_AUTHORIZED':'true'}),patch.object(up,'fetch',return_value=json.dumps(d)):
   self.assertEqual(up.authorized_spot()['instrument'],'spot')
 def test_fred_real_header(self):
  with patch.object(up,'fetch',return_value='observation_date,GASDESW\n2026-09-28,6.382\n2026-10-05,6.199\n'):
   self.assertEqual(up.fred_latest('GASDESW','EIA')['value'],6.199)
 def test_feed_date_host_and_dedup_input(self):
  feed='<rss><channel><item><title>Transport event</title><link>https://example.com/news/1</link><pubDate>Thu, 08 Oct 2026 10:00:00 GMT</pubDate></item><item><title>Bad date</title><link>https://example.com/2</link></item><item><title>Wrong host</title><link>https://evil.example/1</link><pubDate>Thu, 08 Oct 2026 10:00:00 GMT</pubDate></item></channel></rss>'
  rows=parse_feed(feed,{'url':'https://example.com','name':'Fixture','category':'Transporte','original_lang':'en'},datetime(2026,10,8,23,tzinfo=timezone.utc))
  self.assertEqual(len(rows),1);self.assertEqual(rows[0]['status'],'pending_review')
 def test_publisher_branding_and_story_preview(self):
  page=(BASE/'site/index.html').read_text()
  app=(BASE/'site/assets/app.js').read_text()
  self.assertIn('href="https://drivmatch.com/"',page)
  self.assertIn('id="footer-publisher"',page)
  self.assertIn('id="footer-legal"',page)
  self.assertNotIn('id="footer-description"',page)
  self.assertIn("'.weather-top h2'",app)
  self.assertIn("Ler reportagem completa em português",app)
  self.assertNotIn("sourceBrief(opened,articleLang)",app)
  self.assertIn('id="story-preview-download"',page)
  self.assertIn("$('story-preview').hidden=false",app)
  self.assertNotIn("a.download='drivmatch-news-story.png'",app)
 def test_no_duplicate_events_or_publisher_suffix(self):
  from editorial_text import clean_title, same_event, deduplicate_external
  title="Motorista 'desatento' bate na traseira de um caminhão no Missouri"
  self.assertEqual(clean_title(title+" - TheTrucker.com"),title)
  self.assertTrue(same_event(title,title+" - TheTrucker.com"))
  a={'title':title,'source':'The Trucker','source_url':'https://www.thetrucker.com/a','titles':{'pt':title}}
  b={'title':title+' - TheTrucker.com','source':'TheTrucker.com','source_url':'https://www.thetrucker.com/b','titles':{'pt':title+' - TheTrucker.com'}}
  self.assertEqual(len(deduplicate_external([a,b])),1)
  self.assertEqual(len(deduplicate_external([a], [{'source_url':'https://another.com','locales':{'pt':{'title':title}}}])),0)
  self.assertFalse(same_event('Motorista bate em caminhão no Missouri','Motorista bate em caminhão no Texas'))
 def test_external_share_pages_have_social_photo_metadata(self):
  import tempfile
  from unittest.mock import patch
  from build_share_pages import _write_page
  with tempfile.TemporaryDirectory() as temp:
   with patch('build_share_pages.create_card'):
    self.assertTrue(_write_page(Path(temp),{'category':'Transporte'},'source-0123456789abcdef','Notícia sobre caminhões','Resumo próprio'))
   html=(Path(temp)/'source-0123456789abcdef'/'index.html').read_text()
   self.assertIn('property="og:image"',html)
   self.assertIn('property="og:image:width" content="1200"',html)
   self.assertIn('handsondispatcher.github.io/drivmatch-news/share/source-',html)
   self.assertIn('drivmatch.com/news/?story=source-',html)
   self.assertIn('twitter:card" content="summary_large_image"',html)
 def test_verified_kodiak_original_summary(self):
  stories=json.loads((BASE/'content/editorial.json').read_text())
  kodiak=next(x for x in stories if x['id']=='kodiak-charger-dallas-laredo-20261008')
  self.assertIn('435 milhas',kodiak['locales']['pt']['body'])
  self.assertIn('motorista de segurança',kodiak['locales']['pt']['body'])
  self.assertTrue(kodiak['verification_note'])
 def test_source_headline_translation_and_language_fallback(self):
  fixture={'title':'Snow closes Montana highway','source':'Fixture','source_url':'https://example.com/snow','published_at':'2026-10-09T09:00:00+00:00','category':'Clima','region':'US','origin_type':'rss'}
  def translate(title,source,target):
   return {'pt':'Neve fecha rodovia em Montana','es':'Nieve cierra carretera en Montana'}[target]
  with patch.object(up,'translate_source_headline',side_effect=translate):
   result=up.localize_source_headlines([fixture],[],False)[0]
  self.assertEqual(result['titles']['pt'],'Neve fecha rodovia em Montana')
  self.assertEqual(result['titles']['en'],fixture['title'])
  self.assertEqual(result['titles']['es'],'Nieve cierra carretera en Montana')
  with patch.object(up,'translate_source_headline',side_effect=TimeoutError):
   errors=[]
   result=up.localize_source_headlines([fixture],errors,False)[0]
  self.assertEqual(result['titles'],{'en':fixture['title']})
  self.assertTrue(any('headline_translation_incomplete' in x for x in errors))
 def test_geographic_editorial_gate_blocks_foreign_and_domestic_canada(self):
  from editorial_gate import eligible
  def article(title,region='US',url='https://news.google.com/rss/articles/example',category='Transporte'):
   return {'title':title,'region':region,'source_url':url,'category':category}
  self.assertFalse(eligible(article('Bus and truck crash in Tanzania kills 28')))
  self.assertFalse(eligible(article('Diesel prices down, regular fuel up slightly',url='https://yoursaintjohn.ca/diesel-prices-down-regular-fuel-up-slightly/')))
  self.assertFalse(eligible(article('Da Nang bans trucks from National Highway 14D')))
  self.assertFalse(eligible(article('Poverty rates take troubling toll on youth')))
  self.assertFalse(eligible(article('Rising diesel prices strain Minnesota school district budgets',category='Combustíveis')))
  self.assertFalse(eligible(article('Diesel prices put a dent in profits for Colorado food trucks',category='Combustíveis')))
  self.assertFalse(eligible(article('High diesel prices squeeze Montana farmers',category='Combustíveis')))
  self.assertFalse(eligible(article('Rising ocean freight rates impact regional rice exports',url='https://freightwaves.com/ocean')))
  self.assertFalse(eligible(article('Kinder Morgan restores natural gas shipments to Mexico',url='https://ttnews.com/gas')))
  self.assertTrue(eligible(article('Indian immigrant CDL drivers in Texas face English proficiency checks')))
  self.assertTrue(eligible(article('Truckers face diesel costs in Minnesota',category='Combustíveis')))

  self.assertFalse(eligible(article('Canada truckers face new provincial rules','CA',url='https://trucknews.com/article')))
  self.assertTrue(eligible(article('FMCSA tightens CDL English proficiency inspections in Texas')))
  self.assertTrue(eligible(article('Cargo van drivers face new interstate freight rules in California')))
  self.assertTrue(eligible(article('Hot shot trailer maintenance costs climb for Texas carriers')))
  self.assertTrue(eligible(article('US Mexico border freight trucks face delays in Laredo','MX',url='https://example.mx/crossing')))
  self.assertTrue(eligible(article('Canada US border crossing truck inspections delayed at Detroit','CA',url='https://trucknews.com/cross-border')))
  self.assertFalse(eligible(article('Truck crash in Tanzania prompts US commentary',url='https://thetrucker.com/world')))
  self.assertFalse(eligible(article('Freight capacity changes',url='https://news.google.com/rss/articles/ambiguous')))
  self.assertFalse(eligible(article('Trucking insurance premiums increase',url='https://www.thetrucker.com/news/insurance')))
  self.assertTrue(eligible(article('Trucking insurance premiums increase',url='https://www.freightwaves.com/news/insurance')))
 def test_brazil_reader_access_gate(self):
  from editorial_gate import eligible
  example={'title':'FMCSA rules change for Texas truckers','source_url':'https://www.thetrucker.com/news/fmcsa','region':'US','category':'Transporte'}
  self.assertFalse(eligible(example))
  self.assertTrue(eligible({**example,'source_url':'https://www.freightwaves.com/news/fmcsa'}))
  app=(BASE/'site/assets/app.js').read_text()
  ticker=(BASE/'site/assets/news-crawler.js').read_text()
  self.assertIn('thetrucker\\.com',app)
  self.assertIn('blockedPublisher(a.source_url)',ticker)
  self.assertIn('!blockedPublisher(a.source_url)',ticker)
 def test_geo_scope_is_required_by_frontend_and_ticker(self):
  self.assertIn('x.geo_scope_verified===true',(BASE/'site/assets/app.js').read_text())
  self.assertIn('a.geo_scope_verified!==true',(BASE/'site/assets/news-crawler.js').read_text())
  self.assertIn("'geo_scope_verified':True",(BASE/'scripts/update.py').read_text())
 def test_topic_images_and_no_duplicate_refresh(self):
  js=(BASE/'site/assets/app.js').read_text()
  self.assertIn('topicPhotos',js)
  self.assertIn('storyVisuals()',js)
  self.assertIn('used.add(next)',js)
  self.assertIn('storyGraphic(a)',js)
  self.assertIn('images.unsplash.com',js)
  self.assertIn('translated_langs',js)
  self.assertIn('Título original sem tradução',js)
  self.assertEqual(js.count('setInterval(refreshNews,60000)'),1)
  self.assertNotIn("fetch('data/content.json'+stamp",js)
 def test_ticker_respects_selected_language(self):
  ticker=(BASE/'site/assets/news-crawler.js').read_text()
  self.assertIn("a.titles?.[l]||a.title",ticker)
  self.assertIn('TECNOLOGIA E TRANSPORTE',ticker)
  self.assertIn('DIESEL E COMBUSTÍVEIS',ticker)
  self.assertIn('k.textContent=category[',ticker)
  self.assertIn("untranslated",ticker)
  self.assertIn('assets/news-crawler.js?v=',(BASE/'site/index.html').read_text())
 def test_external_headlines_restore_article_modal(self):
  js=(BASE/'site/assets/app.js').read_text()
  self.assertIn('role="button" data-external="false" data-story="${i}"',js)
  self.assertNotIn('role="link" data-external-url=',js)
  self.assertNotIn('${cat} · ${escapeHTML(a.region',js)
  self.assertIn("const shareUrlOf = a => 'https://handsondispatcher.github.io/drivmatch-news/share/'",js)
  self.assertIn("opened.kind==='external_link'",js)
  self.assertIn("article-source",js)
  self.assertIn("share-native",js)
 def test_cache_consistency(self):
  import hashlib,re
  page=(BASE/'site/index.html').read_text()
  for asset in ('data/bootstrap.js','assets/app.js','assets/clima-spot.js'):
   actual=hashlib.sha256((BASE/'site'/asset).read_bytes()).hexdigest()[:16]
   self.assertRegex(page,asset.replace('.','\\.')+r'(?:\\?v=[0-9a-f]{16})?')
 def test_sources_and_tickers(self):
  self.assertGreaterEqual(len(json.loads((BASE/'content/sources.json').read_text())['sources']),75)
  self.assertEqual(up.STOCKS,['JBHT','KNX','SNDR','WERN','ODFL','XPO','LSTR','CHRW','FDX'])
 def test_safety_deploy(self):
  s=(BASE/'.github/workflows/deploy.yml').read_text()
  self.assertIn("if: github.ref == 'refs/heads/main'",s)
  self.assertIn('python -m unittest discover',s)
  self.assertIn("cron: '7,17,27,37,47,57 * * * *'",s)
 def test_source_headline_monitor_keeps_editorial_approval(self):
  source=(BASE/'scripts/update.py').read_text()
  ticker=(BASE/'site/assets/news-crawler.js').read_text()
  self.assertIn("external_feed_links_not_editorially_approved",source)
  self.assertIn("source-headlines.json",source)
  self.assertIn("k.textContent=category[",ticker)
  self.assertNotIn("showRadar()",ticker)
  self.assertIn("seen.has(a.source_url)",ticker)
  self.assertNotIn('id="radar-fontes"',(BASE/'site/index.html').read_text())
  sources=json.loads((BASE/'content/sources.json').read_text())['sources']
  self.assertGreaterEqual(sum(bool(x.get('feed_url')) for x in sources),25)
  self.assertTrue({'US','CA','MX'}.issubset({x.get('region') for x in sources}))
if __name__=='__main__':unittest.main()
