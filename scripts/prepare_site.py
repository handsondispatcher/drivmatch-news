"""Validate maintained v18-derived site; never overwrite weather/runtime changes."""
from pathlib import Path
r=Path(__file__).resolve().parents[1]
page=(r/'site/index.html').read_text()
for token in ['assets/logo-drivmatch-news.png','assets/app.js','assets/clima-spot.js','id="market-title"','clima-mobile','clima-desktop']:
    if token not in page:raise ValueError('Missing maintained site component: '+token)
print('Maintained v18-derived site validated')
