"""DrivMatch articles keep distinct accessible role-based impact views."""
import unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
class ProfessionalPerspectiveContract(unittest.TestCase):
    def test_two_buttons_and_panel(self):
        html=(ROOT/'site/index.html').read_text(encoding='utf-8')
        self.assertEqual(html.count('data-impact-role="driver"'),1)
        self.assertEqual(html.count('data-impact-role="dispatcher"'),1)
        self.assertIn('id="article-impact-text"',html)
        self.assertIn('aria-live="polite"',html)
    def test_verified_analysis_and_safe_fallback(self):
        app=(ROOT/'site/assets/app.js').read_text(encoding='utf-8')
        self.assertIn('opened.professional_impact?.[persona]',app)
        self.assertIn("renderImpact();",app)
        self.assertIn("news_impact_view",app)
        self.assertIn('a manchete não confirma impacto específico',app)
