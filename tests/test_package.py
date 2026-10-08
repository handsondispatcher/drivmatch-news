import json
from pathlib import Path
import importlib.util
import unittest
from unittest.mock import patch

BASE=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('dm_updater',BASE/'scripts/update.py')
up=importlib.util.module_from_spec(spec)
spec.loader.exec_module(up)

class DrivMatchSmokeTests(unittest.TestCase):
    def test_v18_visual_preserved(self):
        base=(BASE/'reference/drivmatch_news_v18_aprovada.html').read_text()
        page=(BASE/'site/index.html').read_text()
        self.assertIn('Panorama do Transporte',base)
        self.assertIn('Panorama do Transporte',page)
        self.assertIn('Mercado em Foco',page)
        self.assertIn('DrivMatch News — um produto da Hands On Dispatcher LLC',page)
        self.assertIn('assets/logo-drivmatch-news.png',page)
        self.assertNotIn('<nav class="navbar">',page)

    def test_three_complete_demo_languages(self):
        articles=json.loads((BASE/'content/editorial.json').read_text())
        self.assertGreaterEqual(len(articles),3)
        for a in articles:
            self.assertTrue(a['demo'])
            self.assertEqual(set(a['locales']),{'pt','en','es'})
            for language in ('pt','en','es'):
                self.assertTrue(a['locales'][language]['title'])
                self.assertGreater(len(a['locales'][language]['body']),80)

    def test_ad_default_off(self):
        self.assertFalse(json.loads((BASE/'content/ads.json').read_text())['enabled'])

    def test_frankfurter_usdbrl(self):
        with patch.object(up,'fetch',return_value='{"date":"2026-10-08","rate":5.12345}'):
            quote=up.frankfurter_usdbrl()
        self.assertEqual(quote['value'],5.12345)
        self.assertEqual(quote['observed_at'],'2026-10-08')

    def test_fred_quote_parsing(self):
        fixture='DATE,GASDESW\n2026-09-28,6.382\n2026-10-05,6.199\n'
        with patch.object(up,'fetch',return_value=fixture):
            quote=up.fred_latest('GASDESW','EIA / FRED')
        self.assertEqual(quote['value'],6.199)
        self.assertLess(quote['change_pct'],0)

    def test_content_build_offline_and_no_fake_prices(self):
        with patch.dict('os.environ',{'DRIVMATCH_PUBLICATION_MODE':'demo'}):
            result=up.build(offline=True)
        self.assertEqual(len(result['articles']),5)
        self.assertFalse(result['market']['indicators'])
        self.assertFalse(result['market']['stocks'])
        self.assertTrue((BASE/'site/data/bootstrap.js').exists())

    def test_translation_controls_independent_of_header(self):
        js=(BASE/'site/assets/app.js').read_text()
        self.assertIn('articleLang',js)
        self.assertIn('articleLang=b.dataset.articleLang;renderArticle()',js)
        self.assertNotIn('languageSet(b.dataset.articleLang)',js)
        self.assertIn("setInterval(async()=>",js)

    def test_scheduled_deploy(self):
        workflow=(BASE/'.github/workflows/deploy.yml').read_text()
        self.assertIn("cron: '7,37 * * * *'",workflow)
        self.assertIn('actions/deploy-pages@v4',workflow)

if __name__=='__main__':unittest.main()
