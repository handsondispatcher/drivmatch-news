"""NWS forecast collector for DrivMatch News compact city weather rotation.

Weather is forecast, not an observed road condition. Missing/unavailable data
stays unavailable; do not synthesize temperatures or weather conditions.
"""
from __future__ import annotations

import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from urllib.parse import urlparse

SOURCE = "NOAA / National Weather Service"
# Major population centers plus US trucking corridors, ports and border crossings.
# Coordinates identify city centers; they are NOT road-level weather stations.
CITIES = [
    ("Orlando", "FL", 28.5383, -81.3792),
    ("Houston", "TX", 29.7604, -95.3698),
    ("New York City", "NY", 40.7128, -74.0060),
    ("Newark", "NJ", 40.7357, -74.1724),
    ("San Francisco", "CA", 37.7749, -122.4194),
    ("Atlanta", "GA", 33.7490, -84.3880),
    ("El Paso", "TX", 31.7619, -106.4850),
    ("Buffalo", "NY", 42.8864, -78.8784),
    ("Salt Lake City", "UT", 40.7608, -111.8910),
    ("Las Vegas", "NV", 36.1699, -115.1398),
    ("Chattanooga", "TN", 35.0456, -85.3097),
    ("Nashville", "TN", 36.1627, -86.7816),
    ("Chicago", "IL", 41.8781, -87.6298),
    ("Los Angeles", "CA", 34.0522, -118.2437),
    ("Dallas", "TX", 32.7767, -96.7970),
    ("Miami", "FL", 25.7617, -80.1918),
    ("Tampa", "FL", 27.9506, -82.4572),
    ("Jacksonville", "FL", 30.3322, -81.6557),
    ("Memphis", "TN", 35.1495, -90.0490),
    ("Indianapolis", "IN", 39.7684, -86.1581),
    ("Columbus", "OH", 39.9612, -82.9988),
    ("Cincinnati", "OH", 39.1031, -84.5120),
    ("Louisville", "KY", 38.2527, -85.7585),
    ("Kansas City", "MO", 39.0997, -94.5786),
    ("St. Louis", "MO", 38.6270, -90.1994),
    ("Denver", "CO", 39.7392, -104.9903),
    ("Phoenix", "AZ", 33.4484, -112.0740),
    ("Albuquerque", "NM", 35.0844, -106.6504),
    ("Seattle", "WA", 47.6062, -122.3321),
    ("Portland", "OR", 45.5152, -122.6784),
    ("Detroit", "MI", 42.3314, -83.0458),
    ("Laredo", "TX", 27.5306, -99.4803),
    ("San Diego", "CA", 32.7157, -117.1611),
    ("Charlotte", "NC", 35.2271, -80.8431),
    ("Birmingham", "AL", 33.5186, -86.8104),
    ("Oklahoma City", "OK", 35.4676, -97.5164),
    ("Harrisburg", "PA", 40.2732, -76.8867),
    ("Sacramento", "CA", 38.5816, -121.4944),
    ("Cleveland", "OH", 41.4993, -81.6944),
    ("Boston", "MA", 42.3601, -71.0589),
    ("McAllen", "TX", 26.2034, -98.2300),
    ("Ontario", "CA", 34.0633, -117.6509),
    ("Savannah", "GA", 32.0809, -81.0912),
    ("Reno", "NV", 39.5296, -119.8138),
    ("Philadelphia", "PA", 39.9526, -75.1636),
    ("Fresno", "CA", 36.7378, -119.7871),
    ("Austin", "TX", 30.2672, -97.7431),
    ("Washington", "DC", 38.9072, -77.0369),
    ("Fort Lauderdale", "FL", 26.1224, -80.1373),
    ("Kissimmee", "FL", 28.2919, -81.4076),
    ("Boca Raton", "FL", 26.3587, -80.0831),
    ("Pompano Beach", "FL", 26.2379, -80.1248),
    ("Framingham", "MA", 42.2793, -71.4162),
    ("Worcester", "MA", 42.2626, -71.8023),
    ("Danbury", "CT", 41.3948, -73.4540),
    ("Edison", "NJ", 40.5187, -74.4121),
    ("San Antonio", "TX", 29.4241, -98.4936),
    ("Norfolk", "VA", 36.8508, -76.2859),
]

def extract_periods(payload):
    """Return upcoming forecast high/low (F), narrative and update time."""
    props = payload.get("properties") or {}
    periods = props.get("periods") or []
    if not periods:
        raise ValueError("NWS forecast has no periods")
    first = periods[0]
    short = first.get("shortForecast") or ""
    if not isinstance(short, str) or not short.strip():
        raise ValueError("Forecast condition missing")
    day = next((x for x in periods[:5] if x.get("isDaytime") is True and isinstance(x.get("temperature"), (float, int))), None)
    night = next((x for x in periods[:5] if x.get("isDaytime") is False and isinstance(x.get("temperature"), (float, int))), None)
    return {
        "condition_en": short.strip()[:120],
        "max_f": day["temperature"] if day and day.get("temperatureUnit") == "F" else None,
        "min_f": night["temperature"] if night and night.get("temperatureUnit") == "F" else None,
        "forecast_period": first.get("name", ""),
        "forecast_start": first.get("startTime"),
        "forecast_updated_at": props.get("updated") or props.get("generatedAt"),
    }

def fetch_city(fetch, city):
    name, state, lat, lon = city
    entry = {"city":name, "state":state, "status":"unavailable",
             "source":SOURCE, "source_url":f"https://forecast.weather.gov/MapClick.php?lat={lat}&lon={lon}"}
    headers = {"Accept":"application/geo+json", "User-Agent":"DrivMatchNews/1.0 (+https://drivmatch.com/news)"}
    try:
        geo = json.loads(fetch(f"https://api.weather.gov/points/{lat},{lon}", headers=headers, timeout=8))
        forecast_url = (geo.get("properties") or {}).get("forecast")
        if not isinstance(forecast_url, str) or urlparse(forecast_url).scheme != "https" or urlparse(forecast_url).hostname != "api.weather.gov":
            raise ValueError("Invalid forecast host")
        forecast = json.loads(fetch(forecast_url, headers=headers, timeout=8))
        entry.update(extract_periods(forecast))
        entry["status"] = "forecast"
    except Exception:
        # Unavailable means unavailable, never substitute a fake forecast.
        pass
    return entry

def collect_weather(fetch=None, offline=False, cities=CITIES):
    collected = []
    if offline:
        collected = [{"city":n,"state":s,"status":"unavailable","source":SOURCE}
                     for n,s,*_ in cities]
    else:
        if fetch is None:
            raise ValueError("Collector requires an HTTP fetch adapter")
        with ThreadPoolExecutor(max_workers=8) as pool:
            jobs = {pool.submit(fetch_city, fetch, city): idx for idx,city in enumerate(cities)}
            ordered = [None] * len(cities)
            for job in as_completed(jobs):
                ordered[jobs[job]] = job.result()
            collected = ordered
    return {"schema_version":1,"source":SOURCE,"generated_at":datetime.now(timezone.utc).isoformat(),
            "rotation_seconds":60,"kind":"forecast_not_live_observation",
            "cities":collected}
