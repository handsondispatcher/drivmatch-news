"""Hotfix only the already-published USD/BRL quote; preserve all other news assets.

Fail closed unless the authenticated, owner-authorized AwesomeAPI feed returns
a valid USD/BRL spot observation. No other market or article is mutated.
"""
import json
import os
import sys
from pathlib import Path
from datetime import datetime,timezone

from scripts.update import authorized_awesomeapi_usdbrl

BOOTSTRAP_PREFIX="window.DRIVMATCH_BOOTSTRAP="
STAGING=Path("staging")

def patch_usd_quote():
    quote=authorized_awesomeapi_usdbrl()
    if (quote.get("instrument")!="spot" or quote.get("price_type")!="commercial" or
        not quote.get("source","").startswith("AwesomeAPI") or
        quote.get("quote_status") not in ("live_snapshot","last_provider_observation")):
        raise ValueError("Unverified commercial FX quote or missing provider rights")
    if not (4<quote["value"]<8): # sanity only for this pilot, fail on provider anomaly
        raise ValueError("Unexpected USD/BRL rate: manual instrument review required")

    market_path=STAGING/"data/market.json"
    market=json.loads(market_path.read_text(encoding="utf-8"))
    if not isinstance(market.get("indicators"),dict):
        raise ValueError("Baseline missing market indicators")
    market["indicators"]["usdbrl"]=quote
    market["generated_at"]=datetime.now(timezone.utc).isoformat(timespec="seconds")
    market_path.write_text(json.dumps(market,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

    for name in ("bootstrap.js","content.json"):
        path=STAGING/"data"/name
        if not path.is_file():
            raise FileNotFoundError("Existing published site missing "+name)
        raw=path.read_text(encoding="utf-8")
        if name=="bootstrap.js":
            if not raw.startswith(BOOTSTRAP_PREFIX):
                raise ValueError("Unexpected bootstrap encoding")
            payload=json.loads(raw[len(BOOTSTRAP_PREFIX):].strip().removesuffix(";"))
        else:
            payload=json.loads(raw)
        if not isinstance(payload.get("market",{}).get("indicators"),dict):
            raise ValueError("Existing published news has no market payload")
        payload["market"]["indicators"]["usdbrl"]=quote
        payload["market"]["generated_at"]=market["generated_at"]
        if name=="bootstrap.js":
            path.write_text(BOOTSTRAP_PREFIX+json.dumps(payload,ensure_ascii=False,separators=(",",":"))+";\n",encoding="utf-8")
        else:
            path.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

    assert "AWESOMEAPI_API_KEY" not in (STAGING/"data/market.json").read_text()
    print("FX_HOTFIX_READY",quote["instrument"],quote["quote_status"],
          quote["observed_at"],"publisher=AwesomeAPI")
    return quote

if __name__=="__main__":
    try:patch_usd_quote()
    except Exception as exc:
        print("::error title=Licensed FX hotfix rejected::"+type(exc).__name__+": "+str(exc)[:140])
        sys.exit(1)
