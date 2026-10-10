"""Newsroom hyperlocal source discovery and social provenance regressions."""
from pathlib import Path
import json
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from claim_integrity import social_origin_ready_for_publication


class NewsIntelligenceTests(unittest.TestCase):
    def setUp(self):
        self.sources = json.loads((ROOT / "content/sources.json").read_text(encoding="utf-8"))["sources"]
        self.policy = json.loads((ROOT / "content/news-intelligence-policy.json").read_text(encoding="utf-8"))

    def sample(self):
        return {
            "origin_type": "social-post",
            "status": "approved",
            "usage_rights": "owned",
            "source_url": "https://www.chp.ca.gov/",
            "verification_state": "PRIMARY_FACT_CONFIRMED",
            "social_evidence": {
                "permalink": "https://x.com/highway_patrol_test/status/123",
                "source_identity_verified": True,
                "original_post_verified": True,
                "event_time_verified": True,
                "location_verified": True,
                "facts_confirmed": True,
                "rights_verified": True,
                "human_editor_approved": True,
                "original_post_at": "2026-10-09T12:00:00Z",
                "event_at": "2026-10-09T11:45:00Z",
                "reviewed_at": "2026-10-09T13:00:00Z",
                "high_risk": False
            }
        }

    def test_registration_expanded_and_unique(self):
        ids = [s["id"] for s in self.sources]
        self.assertEqual(len(ids), len(set(ids)))
        self.assertGreaterEqual(len(ids), 170)
        self.assertEqual(self.policy["scope"]["us_states"], 50)
        self.assertIn("county", self.policy["scope"]["jurisdiction_layers"])

    def test_social_directory_does_not_claim_api_or_automated_publication(self):
        for id_ in ("x-public", "facebook-public", "instagram-public"):
            source = next(s for s in self.sources if s["id"] == id_)
            self.assertIsNone(source["feed_url"])
            self.assertEqual(source["publication"], "external-discovery-only")
        self.assertIn("NOT_CONNECTED", self.policy["connectors"]["x"])
        self.assertIn("NOT_CONNECTED", self.policy["connectors"]["facebook"])

    def test_new_radar_is_discovery_not_editorial(self):
        for id_ in ("radar-police-fire-rescue", "radar-ice-cdl-english",
                    "radar-autonomous-drone", "radar-coldchain-agri", "radar-hazmat-fire"):
            source = next(s for s in self.sources if s["id"] == id_)
            self.assertEqual(source["access"], "discovery-rss")
            self.assertEqual(source["publication"], "external-discovery-only")
            self.assertTrue(source["feed_url"].startswith("https://news.google.com/rss/search?"))

    def test_verified_social_origin_can_pass_editorial_gate(self):
        self.assertTrue(social_origin_ready_for_publication(self.sample()))

    def test_unverified_social_post_fails_closed(self):
        article = self.sample()
        article["social_evidence"]["source_identity_verified"] = False
        self.assertFalse(social_origin_ready_for_publication(article))
        article = self.sample()
        article["social_evidence"]["facts_confirmed"] = "true"
        self.assertFalse(social_origin_ready_for_publication(article))
        article = self.sample()
        article["social_evidence"]["permalink"] = "https://fake-screenshot.invalid/"
        self.assertFalse(social_origin_ready_for_publication(article))

    def test_deepfake_or_recycled_video_blocks_even_with_account_identity(self):
        for key in ("manipulated_media_unresolved", "recycled_media_unresolved",
                    "identity_impersonation_suspected", "fabricated_event_suspected",
                    "material_contradiction_unresolved", "source_retracted"):
            article = self.sample()
            article["social_evidence"][key] = True
            self.assertFalse(social_origin_ready_for_publication(article), key)

    def test_disputed_or_unapproved_fails(self):
        article = self.sample()
        article["verification_state"] = "DISPUTED"
        self.assertFalse(social_origin_ready_for_publication(article))
        article = self.sample()
        article["status"] = "pending_review"
        self.assertFalse(social_origin_ready_for_publication(article))

    def test_high_risk_requires_corroboration_and_specialist(self):
        article = self.sample()
        article["social_evidence"]["high_risk"] = True
        self.assertFalse(social_origin_ready_for_publication(article))
        article["social_evidence"]["specialist_review_approved"] = True
        article["social_evidence"]["independent_confirmation_urls"] = [
            "https://www.fmcsa.dot.gov/newsroom"]
        article["verification_state"] = "CORROBORATED"
        self.assertTrue(social_origin_ready_for_publication(article))

    def test_publish_hook_preserves_other_article_pipeline(self):
        source = (ROOT / "scripts/update.py").read_text(encoding="utf-8")
        self.assertIn("social_origin_ready_for_publication(article)", source)
        self.assertIn("if article.get('origin_type')=='social-post'", source)
        self.assertIn("public_launch_approved') is not False", source)

    def test_source_origin_disclosure(self):
        self.assertFalse(self.policy["publication_policy"]["social_is_confirmation"])
        self.assertFalse(self.policy["publication_policy"]["ai_detection_alone_decides"])
        self.assertFalse(self.policy["publication_policy"]["aggregator_auto_publication"])
        self.assertIn("RETRACTED", self.policy["verification_states"])


if __name__ == "__main__":
    unittest.main()
