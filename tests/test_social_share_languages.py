"""Regression coverage for DrivMatch News crawlable social shares in PT/EN/ES."""
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "drivmatch_share_locales", ROOT / "scripts" / "build_share_pages.py"
)
share = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(share)


def example_card(_title, _category, target, story=None, language="pt"):
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(b"fake social image in test only")


class SocialShareLocalesTests(unittest.TestCase):
    def test_legacy_and_localized_pages_keep_existing_news_only(self):
        with tempfile.TemporaryDirectory() as folder:
            site = Path(folder) / "site"
            (site / "data").mkdir(parents=True)
            stories = {
                "articles": [
                    {
                        "id": "already-published-story",
                        "status": "approved", "category": "Fretes",
                        "locales": {
                            "pt": {"title": "Motorista encontra estacionamento", "summary": "Resumo existente"},
                            "en": {"title": "Truck driver finds parking", "summary": "Existing summary"},
                            "es": {"title": "Conductor encuentra estacionamiento", "summary": "Resumen existente"},
                        },
                    },
                    {
                        "id": "portuguese-only", "status": "approved",
                        "locales": {"pt": {"title": "Notícia somente em português"}},
                    },
                    {
                        "id": "demo-story", "demo": True, "status": "approved",
                        "locales": {"pt": {"title": "Demonstração"}},
                    },
                ]
            }
            headlines = {
                "headlines": [
                    {
                        "id": "reported-source", "geo_scope_verified": True,
                        "source_url": "https://www.example.com/story",
                        "source": "Example publisher",
                        "titles": {
                            "pt": "Fonte verificada", "en": "Verified source",
                            "es": "Fuente verificada",
                        },
                    },
                    {
                        "id": "unverified-source", "geo_scope_verified": False,
                        "source_url": "https://www.example.com/unknown",
                        "titles": {"pt": "Não publicar"},
                    },
                ]
            }
            (site / "data" / "content.json").write_text(json.dumps(stories), encoding="utf-8")
            (site / "data" / "source-headlines.json").write_text(json.dumps(headlines), encoding="utf-8")
            with patch.object(share, "SITE", site), patch.object(share, "create_card", example_card):
                total = share.build()
            self.assertEqual(total, 10)  # 4 + 2 + 4
            base = site / "share"
            for code, title, locale in [
                ("pt", "Motorista encontra estacionamento", "pt_BR"),
                ("en", "Truck driver finds parking", "en_US"),
                ("es", "Conductor encuentra estacionamiento", "es_MX"),
            ]:
                html = (base / "already-published-story" / code / "index.html").read_text(encoding="utf-8")
                self.assertIn(title, html)
                self.assertIn('property="og:locale" content="' + locale + '"', html)
                self.assertIn(f"already-published-story/{code}/social.jpg", html)
                self.assertIn("story=already-published-story&amp;lang=" + code, html)
                self.assertTrue((base / "already-published-story" / code / "social.jpg").is_file())
            legacy = (base / "already-published-story" / "index.html").read_text(encoding="utf-8")
            self.assertIn("Motorista encontra estacionamento", legacy)
            self.assertNotIn("lang=", legacy)
            self.assertFalse((base / "portuguese-only" / "en").exists())
            self.assertFalse((base / "demo-story").exists())
            self.assertFalse((base / "unverified-source").exists())
            self.assertTrue((base / "reported-source" / "es" / "index.html").exists())

    def test_bad_language_or_slug_is_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            with patch.object(share, "create_card", example_card):
                self.assertFalse(share._write_page(Path(folder), {}, "../unsafe", "Title", "desc"))
                self.assertFalse(share._write_page(Path(folder), {}, "safe-slug", "Title", "desc", language="xx"))

    def test_frontend_uses_article_language_in_all_share_flows(self):
        javascript = (ROOT / "site" / "assets" / "app.js").read_text(encoding="utf-8")
        self.assertEqual(javascript.count("shareUrlOf(opened,articleLang)"), 4)
        self.assertIn("story.locales?.[requested]?.title", javascript)
        self.assertIn("articleLang)?.title", javascript)


if __name__ == "__main__":
    unittest.main()
