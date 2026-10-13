"""Locked car-hauler translations: approval, exact image bytes and safe fallback."""
import hashlib
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ADS = json.loads((ROOT / 'content/ads.json').read_text(encoding='utf-8'))
APP = (ROOT / 'site/assets/app.js').read_text(encoding='utf-8')
BUILD = (ROOT / 'scripts/update.py').read_text(encoding='utf-8')

class ApprovedLocalizedAds(unittest.TestCase):
    def test_approval_and_immutability(self):
        c = ADS['approved_localized_creatives']
        self.assertEqual(c['en']['status'], 'published_locked')
        expected = {
            'pt': '949727deb1c5d37cb4e4b68c8162973fbde6362112937fca73eecb724fcd5dc0',
            'es': 'f2e7c2b7527286d29ac0620df98ab2d61ba92ff8d030f66cf66a6a43ccad5806',
        }
        for lang, sha in expected.items():
            self.assertEqual(c[lang]['sha256'], sha)
            self.assertEqual(c[lang]['source_dimensions'], [2172,724])
            self.assertIn(c[lang]['status'], ('owner_approved_asset_pending_repo','published_locked'))
            file = ROOT / 'site' / c[lang]['asset']
            if file.exists():
                self.assertEqual(hashlib.sha256(file.read_bytes()).hexdigest(),sha)
            else:
                self.assertEqual(c[lang]['status'],'owner_approved_asset_pending_repo')

    def test_deployment_gate_and_fallback(self):
        self.assertIn("digest=hashlib.sha256(target.read_bytes()).hexdigest()", BUILD)
        self.assertIn("if digest!=approved['sha256']", BUILD)
        self.assertIn("approved['status']='published_locked'", BUILD)
        self.assertIn("loc?.status==='published_locked'", APP)
        self.assertIn("const localArt=localized?loc.asset:'assets/ads/carhauler-photo1-'+fmt+'.png'", APP)
        self.assertIn("const ratio=localized?'3 / 1':v.ratio", APP)

    def test_old_creatives_and_placements_remain(self):
        enabled={p['slot']:p for p in ADS['placements'] if p['enabled']}
        self.assertEqual(enabled['news-top']['creative_type'], 'carhauler-approved-photo1')
        self.assertEqual(enabled['market-sidebar']['creative_type'], 'ucr-2027-official')
        self.assertEqual(enabled['news-carhauler']['creative_type'], 'ucr-2027-official')
        self.assertEqual(enabled['news-top']['approved_master_sha256'], '1bb40335eb3f058eaeae14a011e42f51e8c00194822b942e5c5628c19a88622d')

if __name__=='__main__':
    unittest.main()
