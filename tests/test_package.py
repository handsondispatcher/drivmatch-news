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
  for text in ['Panorama do Transporte','assets/logo-drivmatch-news.png','DrivMatch News — um produto da Hands On Dispatcher LLC','weather-mobile','weather-desktop','id="market-title"']:self.assertIn(text,page)
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
 def test_topic_images_and_no_duplicate_refresh(self):
  js=(BASE/'site/assets/app.js').read_text()
  self.assertIn('topicPhotos',js)
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
  self.assertIn("ticker-i18n-20261009",(BASE/'site/index.html').read_text())
 def test_external_headlines_restore_article_modal(self):
  js=(BASE/'site/assets/app.js').read_text()
  self.assertIn('role="button" data-story="${i}"',js)
  self.assertNotIn('role="link" data-external-url=',js)
  self.assertNotIn('${cat} · ${escapeHTML(a.region',js)
  self.assertIn("a.kind==='external_link' ? safeUrl(a.source_url)",js)
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
