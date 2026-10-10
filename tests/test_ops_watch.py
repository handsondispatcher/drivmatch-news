"""Operational incident automation must not create duplicates or mislabel stale content."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from ops_watch import assess, INCIDENTS, MARKER

class OperationsWatchTests(unittest.TestCase):
    def test_missing_credentials_and_stale_news_open_both_incidents(self):
        result = assess(
            {'latest_original_age_minutes': 440, 'source_metrics': {'working': 25, 'failed': 10},
             'publisher_candidates_last_180_minutes': 0, 'eligible_publisher_candidates_last_180_minutes': 0},
            {'candidates': [], 'warnings': ['youtube_and_twitch_api_credentials_not_configured']})
        self.assertEqual(set(result), {'video', 'news'})
        self.assertIn('YOUTUBE_DATA_API_KEY', result['video'])
        self.assertIn('440 minutos', result['news'])
    def test_recent_news_and_verified_video_metadata_clear_incidents(self):
        self.assertEqual(assess({'latest_original_age_minutes': 120},
                                {'candidates': [{'video_id': 'A1b2C3d4E5f'}]}), {})
    def test_no_video_not_silently_healthy_if_news_is_fresh(self):
        self.assertEqual(set(assess({'latest_original_age_minutes': 12},
                                    {'candidates': [], 'warnings': []})), {'video'})
    def test_managed_issue_titles_are_stable(self):
        self.assertEqual(len(INCIDENTS), 2)
        self.assertTrue(MARKER.startswith('<!-- drivmatch-'))

if __name__ == '__main__':
    unittest.main()
