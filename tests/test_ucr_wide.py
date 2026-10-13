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
    # Sample CTA backgrounds away from the intentionally white phone text.
    r,g,b=im.getpixel((500,330));self.assertGreater(g,r)
    r,g,b=im.getpixel((1100,330));self.assertGreater(b,g);self.assertGreater(r,g)

 def test_published_cinematic_webp_is_exact_ratio_and_pixel_locked(self):
  import hashlib
  expected={"pt":"7b2886382cee3ca22800ab6fd03893349499c9de3fbb20f12d9967c67cbbeeeb","en":"96882fa480f3cd2ef8fd9856f490329d4e468aa6f0e7f79caea3bb043afb9d20","es":"8a0ad1c4b6e7cd4ac8b50a13bef59874a471c592324ee7225d43ea3213325ca1"}
  self.assertEqual(len(expected),3)
  for lang,sha in expected.items():
   with self.subTest(language=lang):
    p=OUT/f'ucr-2027-{lang}-wide-1774x394.webp'
    self.assertTrue(p.exists(),'Owner-requested native artwork missing from published site')
    self.assertEqual(hashlib.sha256(p.read_bytes()).hexdigest(),sha,'Artwork changed without QA approval')
    im=Image.open(p).convert('RGB')
    self.assertEqual(im.size,(1774,394),'Wrong native ratio; would letterbox or crop')
    for x,y in ((0,140),(1773,140),(0,330),(1773,330)):
     self.assertLess(sum(im.getpixel((x,y))),670,'White side bars or blank gutters')
    r,g,b=im.getpixel((500,340))
    self.assertGreater(g,r,'WhatsApp CTA must be visibly green')
    r,g,b=im.getpixel((1100,340))
    self.assertGreater(r,g,'Instagram CTA must be visibly magenta')
 def test_build_script_source_integrity_guard(self):
  script=(ROOT/'scripts/build_ucr_exact_wide.py').read_text()
  self.assertIn('MASTER_PIXEL_SHA256',script)
  self.assertIn('1774,394',script)
  self.assertIn("for lang in TEXT",script)
