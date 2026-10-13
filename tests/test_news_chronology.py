"""Regression guard for strict chronology in the latest-news list."""
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP = (ROOT / 'site/assets/app.js').read_text(encoding='utf-8')

class NewsChronologyContract(unittest.TestCase):
    def test_main_list_uses_timestamp_order_after_feature_exclusions(self):
        anchor = 'const feed=pageStories().filter(a=>matches(a)&&!reserved.has(a.id))'
        self.assertIn(anchor, APP)
        self.assertIn('.sort((a,b)=>publicationTime(b)-publicationTime(a)', APP)
        self.assertIn("Date.parse(a.published_at||'')", APP)
        self.assertIn('Number.NEGATIVE_INFINITY', APP)
        self.assertIn("String(a.id||a.source_url||'').localeCompare", APP)

    def test_feed_not_built_from_editorially_reordered_pool(self):
        self.assertNotIn('const feed=f.filter(a=>!reserved.has(a.id))', APP)

    def test_real_world_timestamp_example(self):
        from datetime import datetime
        def timestamp(iso):
            return datetime.fromisoformat(iso.replace('Z','+00:00')).timestamp()
        dates = ['2026-10-12T15:18:00-03:00','2026-10-13T00:33:00-03:00']
        self.assertEqual(sorted(dates,key=timestamp,reverse=True)[0],dates[1])

if __name__ == '__main__':
    unittest.main()
