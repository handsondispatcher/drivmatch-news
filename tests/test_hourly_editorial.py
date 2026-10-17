import json
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

class HourlyEditorialDiscoveryTests(unittest.TestCase):
    def test_automated_weekend_coverage_and_source_breadth(self):
        workflow=(ROOT/'.github/workflows/deploy.yml').read_text(encoding='utf-8')
        self.assertIn("7,17,27,37,47,57 * * * *",workflow)
        sources=json.loads((ROOT/'content/sources.json').read_text(encoding='utf-8'))['sources']
        ids={source['id'] for source in sources}
        self.assertGreaterEqual(len([s for s in sources if s.get('feed_url')]),75)
        for sector in ('local-tv-truck-crashes','state-dot-511','universities-freight',
                       'container-drayage','refrigerated-freight','specialty-freight',
                       'car-hauler-towing','broker-news','truck-oem-launches',
                       'fuel-networks','m-and-a-logistics','linkedin-trucking',
                       'x-emergency-trucking'):
            self.assertIn('hourly-'+sector,ids)
        brief=(ROOT/'content/HOURLY_EDITORIAL_DISCOVERY_BRIEF.md').read_text(encoding='utf-8')
        self.assertIn('Saturdays, Sundays',brief)
        self.assertIn('No synthetic reports',brief)
    def test_all_registered_sources_have_feed_urls(self):
        sources=json.loads((ROOT/'content/sources.json').read_text(encoding='utf-8'))['sources']
        self.assertGreaterEqual(len(sources),203)
        self.assertTrue(all(s.get('enabled') is not False and str(s.get('feed_url','')).startswith('https://') for s in sources))
        scoped=[s for s in sources if s.get('feed_kind')=='domain-scoped-aggregator']
        self.assertEqual(len(scoped),122)
        self.assertTrue(all(s['access']=='discovery-rss' and s['publication']=='external-discovery-only' for s in scoped))
        self.assertTrue(all('site%3A' in s['feed_url'] for s in scoped))
        collector=(ROOT/'scripts/collect_sources.py').read_text(encoding='utf-8')
        self.assertIn("allowed_host='news.google.com' if is_discovery",collector)

    def test_discovery_is_not_original_news(self):
        sources=json.loads((ROOT/'content/sources.json').read_text(encoding='utf-8'))['sources']
        for source in sources:
            if source.get('access')=='discovery-rss':
                self.assertEqual(source.get('publication'),'external-discovery-only')

    def test_every_registered_source_is_scanned(self):
        registry=json.loads((ROOT/'content/sources.json').read_text(encoding='utf-8'))['sources']
        collector=(ROOT/'scripts/collect_sources.py').read_text(encoding='utf-8')
        self.assertGreaterEqual(len(registry),203)
        self.assertIn('discover_feed_urls(source)',collector)
        self.assertIn("status='no_valid_rss'",collector)
        self.assertIn('ET.fromstring(raw)',collector)
        for name in ('hourly-food-gig-last-mile','hourly-amazon-flex-blocks','hourly-amazon-relay',
                     'hourly-parcel-fedex-ups-dhl','hourly-curri-gig-courier','hourly-medical-courier',
                     'hourly-agricultural-harvest','hourly-livestock-hauling','hourly-immigration-ice-logistics',
                     'hourly-sean-duffy-transport','hourly-trump-transport-policy','hourly-logistics-investment-terminals'):
            self.assertIn(name,{s['id'] for s in registry})
