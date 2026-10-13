import os
import unittest
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'site/assets/ads'

class UCRNativeWideCreativeQA(unittest.TestCase):
 def test_three_languages_exact_1774_by_394_no_letterboxing(self):
  files=[OUT/f'ucr-2027-{lang}-wide-1774x394.png' for lang in ('pt','en','es')]
  if not all(p.exists() for p in files):
   if os.getenv('UCR_WIDE_REQUIRED')=='1':
    self.fail('UCR creative generation missing from production build')
   self.skipTest('Generated UCR assets are built during CI')
  self.assertEqual(len(set(p.read_bytes() for p in files)),3,'Each language must have its own artwork')
  for lang,p in zip(('pt','en','es'),files):
   with self.subTest(lang=lang):
    im=Image.open(p).convert('RGB')
    self.assertEqual(im.size,(1774,394),'Exact native ratio; no CSS stretch or side bars')
    self.assertGreater(p.stat().st_size,100_000)
    # Native image fills entire width; corners are branded navy, never white letterbox.
    for x,y in ((0,200),(1773,200),(500,0),(1773,393)):
     self.assertLess(sum(im.getpixel((x,y))),650,'Unexpected blank white band')
    # Native WhatsApp and Instagram regions are visibly green/purple.
    r,g,b=im.getpixel((300,370));self.assertGreater(g,r)
    r,g,b=im.getpixel((1000,370));self.assertGreater(r,b//2)
 def test_build_script_source_integrity_guard(self):
  script=(ROOT/'scripts/build_ucr_exact_wide.py').read_text()
  self.assertIn('MASTER_PIXEL_SHA256',script)
  self.assertIn('1774,394',script)
  self.assertIn("for lang in TEXT",script)
