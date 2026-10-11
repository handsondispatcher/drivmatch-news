"""Official NWS bulletin cards require attributed unique road photography."""
import sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from build_news_photos import choose_photos

class NewsImageSafetyTests(unittest.TestCase):
 def test_weather_bulletins_use_distinct_licensed_road_photos(self):
  available=[]
  for i in range(3):
   available.append({'index':i,'meta':{
       'source_library_id':'highway-'+str(i),
       'image':'assets/news-photos/highway-'+str(i)+'.jpg',
       'image_credit':'Commons contributor','image_license':'CC BY-SA',
       'image_source_url':'https://commons.wikimedia.org/wiki/File:Road'+str(i)+'.jpg'},
       'keywords':['highway','road','rodovia','freight']})
  alerts=[{'id':'nws-'+str(i),'category':'Clima',
            'title':'NWS: Blizzard Warning','editorial_type':'operational_bulletin'} for i in range(2)]
  assigned=choose_photos(alerts,available)
  self.assertEqual(len(assigned),2)
  self.assertNotEqual(assigned['nws-0']['image'],assigned['nws-1']['image'])
  self.assertTrue(all(x['image_credit'] for x in assigned.values()))
 def test_weather_refuses_unrelated_images(self):
  row={'id':'nws-2','title':'NWS Tornado Warning','category':'Clima',
       'origin_type':'official-operational-alert'}
  self.assertEqual(choose_photos([row],[{'meta':{'source_library_id':'portrait'},'index':0,'keywords':['portrait']}]),{})
if __name__=='__main__':unittest.main()
