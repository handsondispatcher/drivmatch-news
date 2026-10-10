"""Current NWS high-impact alerts as attributed *official bulletins*, never authored news.

Does NOT assert road closures, mandatory detours, or truck-specific restrictions.
NWS issued-at time is preserved; the content build timestamp is not news time.
"""
from __future__ import annotations
import hashlib
import json
from datetime import datetime, timezone, timedelta
from urllib.parse import urlparse
from urllib.request import Request, urlopen

API_URL = "https://api.weather.gov/alerts/active?limit=150"
EVENT_NAMES = {
    "Hurricane Warning": ("Alerta de furacão", "Alerta de huracán"),
    "Hurricane Watch": ("Vigilância de furacão", "Vigilancia de huracán"),
    "Tropical Storm Warning": ("Alerta de tempestade tropical", "Alerta de tormenta tropical"),
    "Storm Surge Warning": ("Alerta de maré de tempestade", "Alerta de marejada ciclónica"),
    "Flash Flood Warning": ("Alerta de inundação repentina", "Alerta de inundación repentina"),
    "Flood Warning": ("Alerta de inundação", "Alerta de inundación"),
    "Blizzard Warning": ("Alerta de nevasca", "Alerta de ventisca"),
    "Winter Storm Warning": ("Alerta de tempestade de inverno", "Alerta de tormenta invernal"),
    "Ice Storm Warning": ("Alerta de tempestade de gelo", "Alerta de tormenta de hielo"),
    "High Wind Warning": ("Alerta de ventos fortes", "Alerta de vientos fuertes"),
    "Extreme Wind Warning": ("Alerta de vento extremo", "Alerta de viento extremo"),
    "Dust Storm Warning": ("Alerta de tempestade de poeira", "Alerta de tormenta de polvo"),
    "Tornado Warning": ("Alerta de tornado", "Alerta de tornado"),
}
UTC = timezone.utc


def as_utc(value):
    if not isinstance(value,str):return None
    try:
        dt=datetime.fromisoformat(value.replace("Z","+00:00"))
        return dt.astimezone(UTC) if dt.tzinfo else None
    except ValueError:
        return None


def parse_alerts(document, now=None, limit=5):
    now=(now or datetime.now(UTC)).astimezone(UTC)
    if not isinstance(document,dict) or not isinstance(document.get("features"),list):
        raise ValueError("NWS response did not include GeoJSON features")
    results=[]
    unique_events=set()
    for alert in document["features"][:1000]:
        if not isinstance(alert,dict):continue
        p=alert.get("properties") or {}
        if not isinstance(p,dict):continue
        event=p.get("event")
        if event not in EVENT_NAMES:continue
        if str(p.get("status","Actual")).lower() != "actual":continue
        if p.get("messageType") not in ("Alert","Update",None):continue
        if p.get("severity") not in ("Severe","Extreme"):continue
        issued=as_utc(p.get("sent"))
        expires=as_utc(p.get("expires"))
        if not issued or not expires:continue
        if not timedelta(minutes=-5)<=now-issued<=timedelta(hours=30):continue
        if expires<=now:continue
        url=str(alert.get("id") or p.get("@id") or "")
        parsed=urlparse(url)
        if parsed.scheme!="https" or parsed.hostname not in ("api.weather.gov","alerts.weather.gov"):
            continue
        area=str(p.get("areaDesc") or "").split(";")[0].strip()[:80]
        if not area or len(area)<4:continue
        # NWS jurisdiction + areaDesc are origin data; no claim of actual road closure.
        dedup=(event,area.casefold())
        if dedup in unique_events:continue
        unique_events.add(dedup)
        en=f"NWS: {event} — {area}"
        pt=f"NWS: {EVENT_NAMES[event][0]} — {area}"
        es=f"NWS: {EVENT_NAMES[event][1]} — {area}"
        results.append({
            "id":"nws-"+hashlib.sha256(url.encode()).hexdigest()[:20],
            "title":en,"titles":{"pt":pt,"en":en,"es":es},
            "source":"National Weather Service (NWS)",
            "source_url":url,"published_at":issued.isoformat(),
            "category":"Clima","region":"US","original_lang":"en",
            "origin_type":"official-operational-alert","geo_scope_verified":True,
            "curated_verified_headline":True,"link_only":True,
            "editorial_type":"operational_bulletin",
            "verification_note":"NWS API: issued alert, severe/extreme, still active. Not a verified highway closure."
        })
    results.sort(key=lambda x:x["published_at"],reverse=True)
    return results[:limit]


def fetch_nws_json():
    req=Request(API_URL,headers={
        "User-Agent":"DrivMatchNews/1.0 (https://drivmatch.com/news; official weather bulletins)",
        "Accept":"application/geo+json",
    })
    with urlopen(req,timeout=11) as resp:
        payload=resp.read(6_000_001)
    if len(payload)>6_000_000:
        raise ValueError("NWS alert response too large")
    return json.loads(payload)


def collect_nws_alerts(now=None, fetcher=None):
    return parse_alerts((fetcher or fetch_nws_json)(),now=now)
