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
    def test_discovery_is_not_original_news(self):
        sources=json.loads((ROOT/'content/sources.json').read_text(encoding='utf-8'))['sources']
        for source in sources:
            if source.get('access')=='discovery-rss':
                self.assertEqual(source.get('publication'),'external-discovery-only')
