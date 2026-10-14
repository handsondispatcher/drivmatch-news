"""Revalidate published market quotes immediately before the GitHub Pages artifact.

The complete editorial/browser build often lasts longer than the five-minute FX
live-tick TTL. Keep that build, but refresh the quote just before packaging.
Never publish provider secrets, invented quotes or unlicensed Brent prices.
"""
from __future__ import annotations
import json
import os
from pathlib import Path
from update import (
    ROOT, NOW, authorized_fx_market_quote, authorized_brent_spot,
)

def refresh():
    target = ROOT / 'site' / 'data' / 'market.json'
    data = json.loads(target.read_text(encoding='utf-8'))
    indicators = data.get('indicators')
    if not isinstance(indicators, dict):
        raise ValueError('Missing market indicators in generated publication')
    try:
        quote = authorized_fx_market_quote()
        indicators['usdbrl'] = quote
        print('FX PUBLICATION REFRESH:', quote.get('source'), quote.get('observed_at'),
              quote.get('session_status'))
    except Exception as exc:
        # Keep the already-validated observation from the normal build. Its own
        # timestamp is not changed, and the browser applies a bounded age limit.
        print('::warning title=FX final refresh unavailable::', type(exc).__name__)
    if (os.getenv('BRENT_REDISTRIBUTION_AUTHORIZED') == 'true'
            and os.getenv('BRENT_SPOT_URL', '').startswith('https://')):
        try:
            quote = authorized_brent_spot()
            indicators['brent'] = quote
            print('BRENT PUBLICATION REFRESH:', quote.get('source'),
                  quote.get('observed_at'), quote.get('session_status'))
        except Exception as exc:
            print('::warning title=Brent final refresh unavailable::', type(exc).__name__)
    data['publication_revalidated_at'] = NOW().isoformat(timespec='seconds')
    temp = target.with_suffix('.json.tmp')
    temp.write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    temp.replace(target)

if __name__ == '__main__':
    refresh()
