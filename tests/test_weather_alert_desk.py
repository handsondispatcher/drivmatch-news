"""Permanent guard for dedicated National Weather Service alerts desk."""
from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
class WeatherDesk(unittest.TestCase):
 def test_rules_and_ui(self):
  app=(ROOT/'site/assets/app.js').read_text(encoding='utf-8')
  html=(ROOT/'site/index.html').read_text(encoding='utf-8')
  for token in ('weather-alerts-button','weather-alerts-home','weather-alerts-heading','weather-alerts-note'):
   self.assertRegex(html,r'id="'+token+r'"')
  for needle in ("function isWeatherAlertStory(a)","function weatherStories()","function renderClimateStories()","climateMode=true","function eligibleStories()","if(climateMode?!isWeatherAlertStory(a):isWeatherAlertStory(a))return false","ALERTA CLIMÁTICO","WEATHER ALERTS","ALERTA METEOROLÓGICA","National Weather Service","weather\\.gov"):
   self.assertIn(needle,app)
  self.assertIn('assets/app.js?v=weather-alert-desk-20261017-v1',html)
  self.assertNotIn('cloneNode',app[app.index('function weatherStories()'):app.index('function matches(a)')])
 def test_chronology_contract(self):
  app=(ROOT/'site/assets/app.js').read_text(encoding='utf-8')
  self.assertIn("const feed=pageStories().filter(a=>matches(a)&&!reserved.has(a.id))",app)
  self.assertIn(".sort((a,b)=>publicationTime(b)-publicationTime(a)",app)
  self.assertIn("Date.parse(b.published_at||'')",app)
if __name__=='__main__':unittest.main()
