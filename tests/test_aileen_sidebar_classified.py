"""Classified: exact owner-provided art, after UCR, correct WhatsApp hotspot."""
import hashlib
import json
import unittest
from pathlib import Path
from scripts.verify_aileen_driver_classified import verify

ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'site/index.html').read_text(encoding='utf-8')
JS=(ROOT/'site/assets/app.js').read_text(encoding='utf-8')

class AileenSidebarClassified(unittest.TestCase):
    def test_ucr_is_above_driver_ad_with_no_replacement(self):
        self.assertIn('id="market-commercial-banner"',HTML)
        self.assertIn('id="market-driver-availability-banner"',HTML)
        self.assertLess(HTML.index('id="market-commercial-banner"'),HTML.index('id="market-driver-availability-banner"'))
        ads=json.loads((ROOT/'content/ads.json').read_text(encoding='utf-8'))
        main=next(x for x in ads['placements'] if x['slot']=='market-sidebar')
        self.assertEqual(main['creative_type'],'ucr-2027-official')
        driver=next(x for x in ads['placements'] if x['slot']=='market-sidebar-driver')
        self.assertEqual(driver['relationship'],'third_party_classified')
        self.assertEqual(driver['whatsapp_url'],'https://wa.me/14072852874')
        self.assertEqual(driver['phone_display'],'(407) 285-2874')

    def test_original_image_is_proportional_not_rewritten(self):
        self.assertIn('aspect-ratio:1229/1536',HTML)
        self.assertIn('object-fit:contain',HTML)
        self.assertIn('width:100%;max-width:100%',HTML)
        self.assertIn('dm-driver-whatsapp-hotspot',HTML)
        self.assertIn('left:23.5%;top:85%;width:75.5%;height:12.5%',HTML)
        self.assertIn('href="https://wa.me/14072852874"',HTML)
        self.assertIn('src="assets/ads/aileen-souza-motorista-disponivel-original.jpg"',HTML)
        self.assertIn('width="1229" height="1536"',HTML)
        self.assertIn("img.onerror=()=>{driverBox.hidden=true;}",JS)
        self.assertNotIn("driverBox.hidden=true;driverBox.innerHTML='';",JS)
        self.assertNotIn("const driver=(data.ads?.placements||[]).find",JS)
        self.assertNotIn('aria-label="Classificado: motorista disponível" hidden',HTML)

    def test_no_unapproved_binary_will_be_published(self):
        report=verify()
        self.assertIn(report['status'],('asset_pending','ready'))
        self.assertEqual(report['sha256'],'191ab228dd8bf894e8ab4ff3585fd372eca9fff83c38cb8901a754afa66d1bc5')
        if report['status']=='ready':
            binary=(ROOT/'site'/report['asset']).read_bytes()
            self.assertEqual(hashlib.sha256(binary).hexdigest(),report['sha256'])

if __name__=='__main__':
    unittest.main()
