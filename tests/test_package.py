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
 def test_roadtv_owner_pov_discovery_regression(self):
  import sys
  sys.path.insert(0,str(BASE/'scripts'))
  from road_tv import evidence,QUERIES
  self.assertTrue(evidence('LIVE: DriveCam POV Driving from Ohio to Texas #Trucking #ASMR'))
  self.assertTrue(evidence('LIVE Driving POV IRL Denver CO to Schuyler NE trucker ride along'))
  self.assertFalse(evidence('LIVE driving POV France truck'))
  self.assertFalse(evidence('USA trucking POV parked at rest stop'))
  self.assertTrue(any('Trucking Duke' in q for q in QUERIES))
  self.assertTrue(any('Ride Along Gang' in q for q in QUERIES))
  player=(BASE/'site/assets/road-tv-live.js').read_text(encoding='utf-8')
  self.assertIn('CAMERA_ROTATION_MS=5*60*1000',player)

 def test_v34_11_release_contract(self):
  version=json.loads((BASE/'content/release.json').read_text(encoding='utf-8'))
  self.assertEqual(version['version'],'v34.11')
  self.assertEqual(version['previous_release_branch'],'snapshot/v34-10-before-v34-11-city-search-20261010')
  self.assertEqual(version['previous_release_commit'],'bfee2a7f0ab404abd22d737d6ab5210a37113c31')
  self.assertFalse(version['public_launch_approved'])
  self.assertEqual(version['backup_branch'],'backup/v33-approved-2026-10-09')
  self.assertEqual(version['backup_commit'],'fea227dde034e101ace8299357579ddfe98fe256')
  self.assertEqual(version['prior_backups'][0]['version'],'v32')
  self.assertEqual(version['prior_backups'][0]['commit'],'659a146b8f48c342c2a62d86a1330d59760116d4')
  self.assertEqual(version['lifecycle'],'development_prelaunch')
  page=(BASE/'site/index.html').read_text(encoding='utf-8')
  app=(BASE/'site/assets/app.js').read_text(encoding='utf-8')
  update=(BASE/'scripts/update.py').read_text(encoding='utf-8')
  self.assertIn('highlightList',app)
  self.assertIn('aria-current=',app)
  self.assertIn('featureDots',app)
  self.assertNotIn('data-newsroom-cat=',page)
  self.assertIn('newsroom-partner-cta',page)
  self.assertIn('highlight-photo',app)
  self.assertIn('verifiedMarketQuote',app)
  self.assertIn('market-unavailable',app)
  self.assertNotIn("market['stocks']=finnhub_quotes",update)
  self.assertNotIn("market['indicators'].update(class8_quotes",update)
  self.assertIn('newsroomCopy',app)
  self.assertIn('illustrated',app)
  self.assertIn('utm_source=drivmatch_news',page)
  self.assertNotIn('public_launch_approved": true',page)
  self.assertIn('data-site-version="v34.11"',page)
  self.assertIn('name="drivmatch-news-version" content="v34.11"',page)
  self.assertIn('id="site-version" hidden>v34.11',page)
  self.assertIn('DrivMatch News v34.11',app)
  # Clean public player only; dynamic discovery engine retained separately.
  road=(BASE/'scripts/road_tv.py').read_text(encoding='utf-8')
  self.assertIn('YOUTUBE_DATA_API_KEY',road)
  self.assertIn('TWITCH_CLIENT_SECRET',road)
  self.assertNotIn('assets/road-tv.js',page)
  self.assertNotIn('roadtv-channels',page)
  self.assertNotIn('roadtv-disclosure',page)
  self.assertNotIn('roadtv-credit',page)
  self.assertNotIn('roadtv-toolbar',page)
  self.assertNotIn('data-roadtv-badge',page)
  self.assertNotIn('Próximo canal',page)
  self.assertNotIn('Ride Along Gang',page)
  self.assertNotIn('51 Logistics',page)
  self.assertEqual(page.count('youtube-nocookie.com/embed/to8SHIQHyQo'),0,'Dead static railcam must not ship')
  self.assertIn('assets/road-tv-live.js',page)
  tv=(BASE/'site/assets/road-tv-live.js').read_text(encoding='utf-8')
  self.assertIn('onError:',tv)
  self.assertIn('onStateChange:',tv)
  self.assertIn('youtubeApi()',tv)
  self.assertIn('playbackError',tv)
  self.assertIn("data/road-tv.json",tv)
  self.assertNotIn('to8SHIQHyQo',tv)
  # Structural freeze: existing user-approved layout cannot drift silently.
  self.assertEqual(page.count('id="search"'),1)
  self.assertLess(page.index('class="newsroom-partner-cta"'),page.index('id="pesquisa-noticias"'))
  self.assertLess(page.index('id="pesquisa-noticias"'),page.index('<footer class="footer"'))
  self.assertNotIn('NOTÍCIAS DO TRANSPORTE AMERICANO',page)
  self.assertNotIn('NOTÍCIAS DO TRANSPORTE AMERICANO',app)
  self.assertNotIn('fl511.com/Map/EmbeddedMap?layers=Cameras',tv)
  self.assertIn('https://camstreamer.com/embed/',tv)
  self.assertIn('showPublisherCamera()',tv)
  self.assertIn('failPublisher',tv)
  self.assertTrue(version['road_tv_policy']['official_fl511_camera_embed_fallback'])
  self.assertFalse(version['road_tv_policy']['official_camera_map_is_verified_autoplay_stream'])
  # Rights-governed video-source directory; camera site is NOT a guaranteed playing livestream.
  registry=json.loads((BASE/'content/camera-source-network.json').read_text(encoding='utf-8'))
  self.assertEqual(registry['schema_version'],1)
  self.assertEqual(registry['primary_display'],'fl511-i4')
  self.assertEqual(len({c['id'] for c in registry['sources']}),len(registry['sources']))
  self.assertTrue(all(c['verified_playing_live'] is False for c in registry['sources']))
  self.assertEqual(next(x for x in registry['sources'] if x['id']=='milecheck-cameras')['display'],
                   'external_link_only_license_required')
  self.assertEqual(next(x for x in registry['sources'] if x['id']=='buffalo-usaentrance')['display'],
                   'reference_only')
  self.assertEqual(next(x for x in registry['sources'] if x['id']=='weather-lkn')['display'],'not_a_camera_provider')
  self.assertTrue(version['road_tv_policy']['camera_link_is_not_live_certification'])
  self.assertIn('camera-source-network.json',update)
  self.assertIn('camera-source-network.json',update)
  self.assertIn('source_rank',road)
  self.assertIn('USBOUND_BORDER',road)
  # Owner-mandated public reader interface must match frozen 10/10 screenshot.
  self.assertEqual(page.count('>Cotações e Mercado</h2>'),2)
  self.assertNotIn('>Mercado em Foco</h2>',page)
  self.assertIn('top-brent-value',page)
  self.assertIn('top-brent-change',page)
  self.assertIn('top-usd-change',page)
  self.assertIn('top-diesel-change',page)
  self.assertIn('class="dm-util-risk" id="top-risk"',page)
  self.assertIn('id="news-freshness" hidden aria-hidden="true"',page)
  self.assertIn('id="edition-date" hidden',page)
  self.assertNotIn('EDIÇÃO DIGITAL ·',page)
  self.assertIn('class="editorial-context"',app)
  self.assertTrue(version['road_tv_policy']['publisher_direct_camera_embed'])
  self.assertFalse(version['road_tv_policy']['publisher_camera_is_certified_playing_live'])
  self.assertFalse(version['road_tv_policy']['fl511_map_used_as_primary'])
  # Visual and functional freeze from owner's five screenshot corrections.
  self.assertIn('id="footer-version">· v34.11',page)
  self.assertIn('id="footer-version',app)
  self.assertIn('.header .language-picker{border:0!important',page)
  self.assertIn('#panorama .carousel-controls{position:absolute',page)
  self.assertIn('const related=f.slice(1,4)',app)
  self.assertIn('true,false)',app)
  self.assertIn('true,true)',app)
  self.assertIn('showContext?',app)
  self.assertIn("official_bcb_usdbrl()",update)
  self.assertIn("verified_previous_close()",update)
  self.assertEqual(version['reader_cta_policy'],'related_rail_only')
  self.assertTrue(version['carousel_policy']['hero_only'])
  self.assertTrue(version['carousel_policy']['read_also_stable'])
  self.assertTrue(version['market_policy']['no_undated_or_invented_quote'])
  # Six owner-directed visual and automatic-content invariants.
  self.assertNotIn('<nav class="newsroom-nav"',page)
  self.assertNotIn('id="chips"',page)
  self.assertNotIn('id="highlights-note"',page)
  self.assertIn('id="news-commercial-banner"',page)
  self.assertIn('id="market-commercial-banner"',page)
  self.assertIn('id="top-city-query"',page)
  self.assertIn('id="top-city-options"',page)
  self.assertIn('id="top-city-search-form"',page)
  self.assertIn('id="top-city-search"',page)
  self.assertNotIn('id="top-city-auto"',page)
  self.assertNotIn('id="top-city-apply"',page)
  self.assertNotIn('id="top-city-type"',page)
  self.assertIn('id="top-city-select-label"',page)
  self.assertIn("10*1000", (BASE/'site/assets/utility-strip.js').read_text(encoding='utf-8'))
  self.assertIn('drivmatch_weather_city_v1',(BASE/'site/assets/utility-strip.js').read_text(encoding='utf-8'))
  self.assertEqual(version['brand_policy']['approved_logo'],'unchanged_official_blue_gradient')
  self.assertEqual(version['brand_policy']['header_bg'],'#020408')
  self.assertTrue(version['reader_ui']['no_article_count'])
  self.assertIn('id="count" hidden aria-hidden="true"',page)
  self.assertNotIn('Publicidade · DrivMatch',app)
  self.assertIn('assets/app.js?v=v34-10-',page)
  self.assertIn('assets/utility-strip.js?v=v34-11-',page)
  self.assertIn('function searchCity()', (BASE/'site/assets/utility-strip.js').read_text(encoding='utf-8'))
  self.assertIn('function officialForecast(', (BASE/'site/assets/utility-strip.js').read_text(encoding='utf-8'))
  self.assertIn('data/us-places.json', (BASE/'site/assets/utility-strip.js').read_text(encoding='utf-8'))
  self.assertEqual(version['weather_policy']['city_search'],'one_field_one_search_action')
  self.assertEqual(version['weather_policy']['location_index'],'U.S. Census Bureau 2025 National Places')
  self.assertIn('news-candidates-cache.json',(BASE/'scripts/collect_sources.py').read_text(encoding='utf-8'))
  self.assertIn('original-language headlines remain readable'.lower(),app.lower())
  self.assertNotIn("$('chips').innerHTML",app)
  self.assertNotIn("document.querySelector('.newsroom-nav').addEventListener",app)
  ads=json.loads((BASE/'content/ads.json').read_text(encoding='utf-8'))
  self.assertTrue(ads['enabled'])
  self.assertEqual({p['slot'] for p in ads['placements']},{'news-top','market-sidebar'})
  self.assertTrue(all(p['relationship']=='house' and p['enabled'] for p in ads['placements']))
  self.assertEqual(version['weather_policy']['rotation_seconds'],10)
  self.assertEqual(version['editorial_policy']['cache_ttl_hours'],48)
  self.assertIn('news-freshness',page)
  self.assertIn('sourceCheckedAt',app)
  self.assertIn('fresh_6h',update)
  self.assertIn('fresh_12h',update)
  self.assertIn('.dm-crawler-link{font-size:16px!important',page)
  self.assertEqual(page.count('<h2>ROAD TV</h2>'),0)
  self.assertEqual(version['road_tv_policy']['roadtv_ui'],'verified_platform_livestream_or_specific_preopened_publisher_camera_no_map')
  self.assertLess(page.index('id="clima-desktop"'),page.index('id="roadtv-desktop"'))
  self.assertLess(page.index('id="roadtv-desktop"'),page.index('id="market-title"'))
  self.assertLess(page.index('id="clima-mobile"'),page.index('id="roadtv-mobile"'))
  self.assertLess(page.index('id="roadtv-mobile"'),page.index('id="market-title-mobile"'))
  self.assertEqual(page.count('class="roadtv-card"'),2)
  self.assertIn("site_version':release['version']",update)
  self.assertIn("path/'release.json'",update)
  self.assertIn('class="hero-wrap"',app)
  self.assertIn('class="related-rail"',app)
  self.assertIn('shareDestinations',app)
  workflow=(BASE/'.github/workflows/deploy.yml').read_text(encoding='utf-8')
  self.assertIn('CUSTOM DOMAIN V34.11 PASS',workflow)
  self.assertIn('CUSTOM DOMAIN V34.11 MISMATCH',workflow)
  self.assertIn('drivmatch.com/news/data/release.json',workflow)

  self.assertIn('DrivMatch News — um produto da Hands On Dispatcher LLC',page)
 def test_census_national_city_index_and_duplicate_city_disambiguation(self):
  import io,zipfile
  from build_us_places import parse_gazetteer,validate_cache,SOURCE_URL
  rows=['USPS\tNAME\tINTPTLAT\tINTPTLONG']
  rows.extend(['MO\tSt. Charles city\t38.78400\t-90.48100',
               'IL\tSt. Charles city\t41.91400\t-88.30800'])
  rows.extend(f'TX\tDemoTown{i:05d} city\t31.00000\t-97.00000' for i in range(20000))
  b=io.BytesIO()
  with zipfile.ZipFile(b,'w',compression=zipfile.ZIP_DEFLATED) as z:
   z.writestr('2025_Gaz_place_national.txt','\n'.join(rows))
  places=parse_gazetteer(b.getvalue())
  self.assertEqual(len(places),20002)
  self.assertEqual({p[1] for p in places if p[0]=='St. Charles'},{'MO','IL'})
  self.assertEqual(len({(p[0].casefold(),p[1]) for p in places}),len(places))
  doc={'schema_version':1,'source_url':SOURCE_URL,'places':places}
  self.assertIs(validate_cache(doc),doc)
  with self.assertRaises(ValueError):
   validate_cache({**doc,'places':places[:100]})

 def test_census_index_build_is_wired_to_publication_workflow(self):
  workflow=(BASE/'.github/workflows/deploy.yml').read_text(encoding='utf-8')
  self.assertIn('python scripts/build_us_places.py',workflow)
  self.assertIn('census-places-2025-v1',workflow)
  self.assertIn('data/us-places.json',(BASE/'site/assets/utility-strip.js').read_text(encoding='utf-8'))

 def test_48h_source_cache_keeps_original_dates_and_rejects_foreign_or_stale(self):
  from collect_sources import merge_verified_candidate_history
  from tempfile import TemporaryDirectory
  source={'id':'primary','url':'https://freightwaves.com/','name':'FreightWaves',
          'access':'rss','category':'Fretes','original_lang':'en'}
  now=datetime(2026,10,10,12,tzinfo=timezone.utc)
  good={'source_url':'https://freightwaves.com/news/trucking-today','title':'US trucking carriers',
        'origin_type':'publisher-feed','status':'pending_review','source':'FreightWaves',
        'published_at':'2026-10-09T20:00:00+00:00'}
  bad={**good,'source_url':'https://evil.example/news'}
  stale={**good,'source_url':'https://freightwaves.com/news/old',
         'published_at':'2026-10-07T01:00:00+00:00'}
  with TemporaryDirectory() as tmp:
   p=Path(tmp)/'news-candidates-cache.json'
   p.write_text(json.dumps([good,bad,stale]),encoding='utf-8')
   current={}
   saved=merge_verified_candidate_history(current,[source],now=now,path=p)
  self.assertEqual(saved,1)
  self.assertEqual(list(current),[good['source_url']])
  self.assertEqual(current[good['source_url']]['published_at'],good['published_at'])

 def test_rss_transport_retries_only_transient_status_and_preserves_truth(self):
  from urllib.error import HTTPError
  from collect_sources import fetch_rss_with_retry, safe_feed_error
  from io import BytesIO
  class Response:
   def __init__(self,data):self.data=data
   def __enter__(self):return BytesIO(self.data)
   def __exit__(self,*a):return False
  calls=[]
  def transient(req,timeout):
   calls.append(1)
   if len(calls)==1:raise HTTPError(req.full_url,503,'temporary',{},None)
   return Response(b'<rss><channel/></rss>')
  with patch('collect_sources.urlopen',side_effect=transient),patch('collect_sources.sleep',return_value=None) as wait:
   data,attempts=fetch_rss_with_retry('https://www.ttnews.com/rss.xml')
  self.assertEqual(data,b'<rss><channel/></rss>')
  self.assertEqual(attempts,2)
  self.assertEqual(wait.call_count,1)
  forbidden=[]
  def blocked(req,timeout):
   forbidden.append(1)
   raise HTTPError(req.full_url,403,'blocked',{},None)
  with patch('collect_sources.urlopen',side_effect=blocked),patch('collect_sources.sleep',return_value=None) as wait:
   with self.assertRaises(HTTPError) as e:fetch_rss_with_retry('https://example.com/feed')
  self.assertEqual(len(forbidden),1)
  self.assertEqual(wait.call_count,0)
  self.assertEqual(safe_feed_error(e.exception),'HTTP_403')

 def test_fresh_primary_publisher_feeds_are_auditable_not_auto_editorials(self):
  from editorial_gate import eligible
  sources=json.loads((BASE/'content/sources.json').read_text(encoding='utf-8'))['sources']
  ids=[x['id'] for x in sources]
  self.assertEqual(len(set(ids)),len(ids),'No duplicated editorial source identities')
  for ident,feed in [('supply-chain-dive','https://www.supplychaindive.com/feeds/news/'),
                     ('automotive-fleet','https://www.automotive-fleet.com/rss/')]:
   entry=next(x for x in sources if x['id']==ident)
   self.assertEqual(entry['feed_url'],feed)
   self.assertEqual(entry['access'],'rss')
   self.assertEqual(entry['publication'],'review-required')
  source=next(x for x in sources if x['id']=='supply-chain-dive')
  now=datetime(2026,10,10,11,0,tzinfo=timezone.utc)
  xml=b'<rss><channel><item><title>Texas truck carriers expand freight hauling</title><link>https://www.supplychaindive.com/news/test-truck-freight/</link><pubDate>Sat, 10 Oct 2026 10:30:00 GMT</pubDate></item></channel></rss>'
  rows=parse_feed(xml,source,now=now)
  self.assertEqual(len(rows),1)
  self.assertEqual(rows[0]['status'],'pending_review')
  self.assertIn('approve-editorially',rows[0]['publication_blockers'])
  self.assertTrue(eligible(rows[0]))
  foreign=b'<rss><channel><item><title>UK ocean freight port expansion</title><link>https://www.supplychaindive.com/news/test-ocean/</link><pubDate>Sat, 10 Oct 2026 10:30:00 GMT</pubDate></item></channel></rss>'
  self.assertFalse(eligible(parse_feed(foreign,source,now=now)[0]))
  stale=b'<rss><channel><item><title>US trucking</title><link>https://www.supplychaindive.com/news/test-old/</link><pubDate>Mon, 05 Oct 2026 10:30:00 GMT</pubDate></item></channel></rss>'
  self.assertEqual(parse_feed(stale,source,now=now),[])
 def test_visual_and_weather(self):
  page=(BASE/'site/index.html').read_text()
  for text in ['Panorama do Transporte','assets/logo-drivmatch-news.png','DrivMatch News — um produto da Hands On Dispatcher LLC','weather-mobile','weather-desktop','id="market-title"']:self.assertIn(text,page)
  self.assertLess(page.index('id="clima-desktop"'),page.index('id="roadtv-desktop"'))
  self.assertLess(page.index('id="roadtv-desktop"'),page.index('id="market-title"'))
  self.assertLess(page.index('id="clima-mobile"'),page.index('id="roadtv-mobile"'))
  self.assertLess(page.index('id="roadtv-mobile"'),page.index('id="market-title-mobile"'))
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
 def test_curated_fresh_publisher_link_expires_without_relabeling_build_date(self):
  link=json.loads((BASE/'content/verified-external-links.json').read_text(encoding='utf-8'))['verified_external_links'][0]
  self.assertEqual(link['source'],'Transport Topics')
  self.assertEqual(link['published_at'],'2026-10-10T11:00:00+00:00')
  self.assertTrue(link['link_only'])
  self.assertFalse(link['editorial_body_written'])
  self.assertIn('ttnews.com/articles/',link['source_url'])
  with patch.object(up,'NOW',return_value=datetime(2026,10,10,13,tzinfo=timezone.utc)):
   data=up.verified_external_source_links()
   self.assertEqual(len(data),1)
   self.assertEqual(data[0]['origin_type'],'publisher-curated')
   self.assertEqual(data[0]['titles']['en'],link['title'])
  with patch.object(up,'NOW',return_value=datetime(2026,10,13,13,tzinfo=timezone.utc)):
   self.assertEqual(up.verified_external_source_links(),[])
  self.assertEqual(up.verified_external_source_links(offline=True),[])

 def test_09_oct_2026_commercial_close_is_correct_and_date_bounded(self):
  quote=json.loads((BASE/'content/usdbrl_last_close.json').read_text(encoding='utf-8'))
  self.assertEqual(quote['close_date'],'2026-10-09')
  self.assertEqual(quote['close_value'],4.985)
  self.assertEqual(quote['change_pct'],-0.79)
  self.assertIn('/2026/10/09/',quote['source_url'])
  with patch.object(up,'NOW',return_value=datetime(2026,10,10,12,tzinfo=timezone.utc)):
   q=up.verified_previous_close()
   self.assertEqual(q['value'],4.985)
   self.assertEqual(q['quote_status'],'last_verified_close')
   self.assertEqual(q['instrument'],'spot')
  with patch.object(up,'NOW',return_value=datetime(2026,10,16,12,tzinfo=timezone.utc)):
   with self.assertRaises(ValueError):up.verified_previous_close()

 def test_bcb_ptax_is_dated_separate_instrument_not_fake_commercial_spot(self):
  fixture=json.dumps([{'data':'08/10/2026','valor':'5.0119'},
                      {'data':'09/10/2026','valor':'4.9892'}])
  with patch.object(up,'NOW',return_value=datetime(2026,10,10,12,tzinfo=timezone.utc)):
   with patch.object(up,'fetch',return_value=fixture):
    q=up.official_bcb_usdbrl()
   self.assertEqual(q['value'],4.9892)
   self.assertEqual(q['observed_at'],'2026-10-09')
   self.assertEqual(q['instrument'],'ptax_reference')
   self.assertEqual(q['price_type'],'ptax_venda')
   self.assertEqual(q['quote_status'],'official_bcb_ptax_last')
   self.assertLess(q['change_pct'],0)
  with patch.object(up,'NOW',return_value=datetime(2026,10,20,12,tzinfo=timezone.utc)):
   with patch.object(up,'fetch',return_value=fixture):
    with self.assertRaises(ValueError):up.official_bcb_usdbrl()

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
  self.assertIn("Português · tradução automática",app)
  self.assertIn("Español · traducción automática",app)
  self.assertIn("English · original",app)
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
 def test_live_feed_freshness_access_and_no_fake_urgency(self):
  from live_feed import make_live_feed
  now=datetime(2026,10,9,15,tzinfo=timezone.utc)
  def row(ident,source,published,pt='Caminhoneiros dos EUA enfrentam nova regra'):
   return {'id':ident,'source_url':source,'published_at':published,'status':'approved','titles':{'pt':pt,'en':'US truckers face new rule','es':'Camioneros de EE. UU. afrontan nueva regla'},'category':'Transporte'}
  fresh=now.isoformat()
  old=datetime(2026,10,1,tzinfo=timezone.utc).isoformat()
  items=[
   row('fresh','https://www.freightwaves.com/news/new-rule',fresh),
   row('blocked','https://www.thetrucker.com/news/rule',fresh),
   row('stale','https://www.ttnews.com/articles/old',old),
   row('duplicate','https://www.ttnews.com/articles/new',fresh),
  ]
  feed=make_live_feed([],items,now)
  self.assertEqual([x['id'] for x in feed['items']],['fresh'])
  self.assertFalse(feed['operational_alerts_integrated'])
  self.assertFalse(feed['items'][0]['is_active_incident'])
  self.assertIsNone(feed['items'][0]['severity'])
  self.assertIn('/news/?story=fresh',feed['items'][0]['url'])
  self.assertIn("live-feed.json",(BASE/'scripts/update.py').read_text())
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
 def test_licensed_photo_catalog_and_unique_selection(self):
  from build_news_photos import choose_photos
  library=json.loads((BASE/'content/photo-library.json').read_text(encoding='utf-8'))
  self.assertGreaterEqual(len(library['photos']),8)
  self.assertEqual(len({p['id'] for p in library['photos']}),len(library['photos']))
  for p in library['photos']:
   self.assertTrue(p['source_url'].startswith('https://commons.wikimedia.org/wiki/File:'))
   self.assertTrue(p['credit'] and p['license'] and p['keywords'])
  sample=[{'id':'news-autonomy','title':'FMCSA autonomous trucks regulation','category':'Caminhoneiros'},
          {'id':'news-warehouse','title':'Walmart warehouse logistics distribution','category':'Fretes'}]
  available=[{'index':i,'keywords':entry['keywords'],'meta':{
              'image':'assets/news-photos/'+entry['id']+'.jpg','image_credit':entry['credit'],
              'image_license':entry['license'],'image_source_url':entry['source_url'],
              'source_library_id':entry['id']}} for i,entry in enumerate(library['photos'])]
  selected=choose_photos(sample,available)
  self.assertEqual(set(selected),{'news-autonomy','news-warehouse'})
  self.assertEqual(len({x['image'] for x in selected.values()}),2)
  app=(BASE/'site/assets/app.js').read_text(encoding='utf-8')
  self.assertIn('data/news-images.json?ts=',app)
  self.assertIn('safeNewsPhotoUrl',app)
  self.assertIn('licensedPhotoOf',app)
  self.assertIn('Foto ilustrativa de arquivo',app)
  self.assertNotIn("img:not([src^=",app)

 def test_topic_images_and_no_duplicate_refresh(self):
  js=(BASE/'site/assets/app.js').read_text()
  self.assertIn('storyVisuals()',js)
  self.assertIn('used.add(unique)',js)
  self.assertIn('storyGraphic(a)',js)
  self.assertNotIn('images.unsplash.com',js)
  self.assertIn('a.image_license&&a.image_credit',js)
  self.assertIn('unique||storyGraphic(a)',js)
  self.assertIn('translated_langs',js)
  self.assertIn('Título original em ',js)
  self.assertEqual(js.count('setInterval(refreshNews,60000)'),1)
  self.assertNotIn("fetch('data/content.json'+stamp",js)
 def test_ticker_respects_selected_language(self):
  ticker=(BASE/'site/assets/news-crawler.js').read_text()
  self.assertIn("a.titles?.[l]||a.title",ticker)
  self.assertIn('TECNOLOGIA E TRANSPORTE',ticker)
  self.assertIn('DIESEL E COMBUSTÍVEIS',ticker)
  self.assertIn('k.textContent=(category[',ticker)
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
  self.assertIn("k.textContent=(category[",ticker)
  self.assertNotIn("showRadar()",ticker)
  self.assertIn("seen.has(a.source_url)",ticker)
  self.assertIn("fresh(sourceCheckedAt,MAX_SNAPSHOT_AGE_MS)",ticker)
  self.assertIn("fresh(a.published_at,MAX_HEADLINE_AGE_MS)",ticker)
  self.assertIn("MAX_SNAPSHOT_AGE_MS=30*60*1000",ticker)
  self.assertIn("MAX_HEADLINE_AGE_MS=48*60*60*1000",ticker)
  app=(BASE/'site/assets/app.js').read_text()
  page=(BASE/'site/index.html').read_text()
  self.assertIn('featureSize = 4',app)
  self.assertIn('class="hero-wrap"',app)
  self.assertIn('class="related-rail"',app)
  self.assertIn('/* v31 restored from PR #7',page)
  self.assertIn('data-site-lang="es"',page)
  self.assertNotIn('id="radar-fontes"',(BASE/'site/index.html').read_text())
  sources=json.loads((BASE/'content/sources.json').read_text())['sources']
  self.assertGreaterEqual(sum(bool(x.get('feed_url')) for x in sources),25)
  self.assertTrue({'US','CA','MX'}.issubset({x.get('region') for x in sources}))
if __name__=='__main__':unittest.main()
