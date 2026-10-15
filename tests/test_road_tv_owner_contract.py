"""Road TV owner rules: fail closed on accidental channel-priority regressions."""
import json
import unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

class RoadTvOwnerContract(unittest.TestCase):
    def test_single_source_of_truth(self):
        policy=json.loads((ROOT/'content/road-tv-policy.json').read_text(encoding='utf-8'))
        self.assertTrue(policy['driver_live_first'])
        self.assertTrue(policy['truck_lives_occupy_channels_first'])
        self.assertTrue(policy['non_truck_sources_after_truck_lives'])
        self.assertEqual(policy['driver_priority_channels'][:2],['Ride Along Gang','Trucking Duke'])
        self.assertEqual(policy['camera_priority_ids'][0],'i35-waco')
        self.assertEqual(policy['rotation_seconds'],600)
        self.assertEqual(len(policy['camera_priority_ids']),len(set(policy['camera_priority_ids'])))
        self.assertTrue(policy['manual_selection_preserved'])
        self.assertTrue(policy['no_duplicate_channels'])
    def test_publish_durable_policy(self):
        updater=(ROOT/'scripts/update.py').read_text(encoding='utf-8')
        self.assertIn("read_json(ROOT/'content/road-tv-policy.json')",updater)
        self.assertIn("(path/'road-tv-policy.json').write_text",updater)
    def test_player_loads_owner_policy_and_stable_ids(self):
        player=(ROOT/'site/assets/road-tv-live.js').read_text(encoding='utf-8')
        self.assertIn("async function loadOwnerPolicy()",player)
        self.assertIn("Promise.allSettled([loadOwnerPolicy(),loadCameraHealth()])",player)
        self.assertIn("camera_id:selectedCameraId||directCameras[publisherIndex]?.id",player)
        self.assertIn("videos.filter(v=>v.live",player)
        self.assertIn("return videos.find(v=>v.live",player)
        self.assertNotIn('newChannelSourcePositions',player)
        self.assertNotIn('next.onclick=',player)
        self.assertLess(player.index('let publisherIndex=0'),player.index('tvInstall();applyCameraOrder(fallbackCameraOrder);'))
    def test_verified_creator_refresh_rotates_both(self):
        engine=(ROOT/'scripts/road_tv.py').read_text(encoding='utf-8')
        self.assertIn("targeted_hour=(now.hour if not fresh_cache else None)",engine)
        self.assertIn("preferred_channels.get",engine)
        self.assertIn("Minden",engine)
