"""The public proof rejects stale or mismatched content without fabricating freshness."""
import datetime as dt
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from verify_public_payloads import check_pair

NOW = dt.datetime(2026, 10, 10, 18, 30, tzinfo=dt.timezone.utc)
TS = "2026-10-10T18:24:00+00:00"


class PublicPayloadProofTests(unittest.TestCase):
    def doc(self, feed):
        core = {"schema_version": 1 if feed != "road-tv.json" else 2,
                "generated_at": TS}
        if feed == "content.json":
            core["articles"] = [{"id": "1", "published_at": "2026-10-08T12:00:00Z"}]
        elif feed == "source-headlines.json":
            core.update({"headlines": [], "latest_headline_at": ""})
        else:
            core.update({"candidates": [], "current_live": None,
                         "live_status": "unverified"})
        return core

    def test_equal_recent_payloads_pass_without_fake_new_stories_or_live(self):
        for feed in ("content.json", "source-headlines.json", "road-tv.json"):
            with self.subTest(feed=feed):
                original = self.doc(feed)
                result = check_pair(feed, original, dict(original), NOW)
                self.assertIsInstance(result, dict)

    def test_custom_domain_payload_different_fails_even_same_version(self):
        feed = "source-headlines.json"
        first = self.doc(feed)
        other = dict(first, headlines=[{"title": "not served on Pages"}])
        with self.assertRaisesRegex(ValueError, "differs"):
            check_pair(feed, first, other, NOW)

    def test_stale_payload_fails_even_both_origins_identical(self):
        doc = self.doc("content.json")
        doc["generated_at"] = "2026-10-09T00:00:00Z"
        with self.assertRaisesRegex(ValueError, "payload age"):
            check_pair("content.json", doc, doc, NOW)

    def test_false_live_claim_is_blocked(self):
        doc = self.doc("road-tv.json")
        doc["live_status"] = "verified_live"
        with self.assertRaisesRegex(ValueError, "false verified_live"):
            check_pair("road-tv.json", doc, doc, NOW)

    def test_no_generation_date_fails_closed(self):
        doc = self.doc("road-tv.json")
        doc.pop("generated_at")
        with self.assertRaisesRegex(ValueError, "missing"):
            check_pair("road-tv.json", doc, doc, NOW)


if __name__ == "__main__":
    unittest.main()
