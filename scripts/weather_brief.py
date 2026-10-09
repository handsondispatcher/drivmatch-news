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
    ("Tacoma", "WA", 47.2529, -122.4443),
    ("Bellingham", "WA", 48.7519, -122.4787),
    ("Spokane", "WA", 47.6588, -117.426),
    ("Eugene", "OR", 44.0521, -123.0868),
    ("Medford", "OR", 42.3265, -122.8756),
    ("Redding", "CA", 40.5865, -122.3917),
    ("Stockton", "CA", 37.9577, -121.2908),
    ("Bakersfield", "CA", 35.3733, -119.0187),
    ("San Bernardino", "CA", 34.1083, -117.2898),
    ("Barstow", "CA", 34.8958, -117.0173),
    ("Long Beach", "CA", 33.7701, -118.1937),
    ("Oakland", "CA", 37.8044, -122.2712),
    ("Tucson", "AZ", 32.2226, -110.9747),
    ("Nogales", "AZ", 31.3404, -110.9343),
    ("Flagstaff", "AZ", 35.1983, -111.6513),
    ("Yuma", "AZ", 32.6927, -114.6277),
    ("Kingman", "AZ", 35.1894, -114.053),
    ("Las Cruces", "NM", 32.3199, -106.7637),
    ("Amarillo", "TX", 35.222, -101.8313),
    ("Waco", "TX", 31.5493, -97.1467),
    ("Fort Worth", "TX", 32.7555, -97.3308),
    ("Beaumont", "TX", 30.0802, -94.1266),
    ("Lubbock", "TX", 33.5779, -101.8552),
    ("Eagle Pass", "TX", 28.708, -100.4995),
    ("Brownsville", "TX", 25.9017, -97.4975),
    ("Midland", "TX", 31.9973, -102.0779),
    ("Corpus Christi", "TX", 27.8006, -97.3964),
    ("Tulsa", "OK", 36.154, -95.9928),
    ("Wichita", "KS", 37.6872, -97.3301),
    ("Topeka", "KS", 39.0473, -95.6752),
    ("Salina", "KS", 38.8403, -97.6114),
    ("Lincoln", "NE", 40.8136, -96.7026),
    ("Omaha", "NE", 41.2565, -95.9345),
    ("North Platte", "NE", 41.1403, -100.7601),
    ("Cheyenne", "WY", 41.14, -104.8202),
    ("Rock Springs", "WY", 41.5875, -109.2029),
    ("Ogden", "UT", 41.223, -111.9738),
    ("St. George", "UT", 37.0965, -113.5684),
    ("Colorado Springs", "CO", 38.8339, -104.8214),
    ("Grand Junction", "CO", 39.0639, -108.5506),
    ("Des Moines", "IA", 41.5868, -93.625),
    ("Cedar Rapids", "IA", 41.9779, -91.6656),
    ("Minneapolis", "MN", 44.9778, -93.265),
    ("Duluth", "MN", 46.7867, -92.1005),
    ("Fargo", "ND", 46.8772, -96.7898),
    ("Pembina", "ND", 48.9664, -97.2437),
    ("Sioux Falls", "SD", 43.546, -96.7313),
    ("Little Rock", "AR", 34.7465, -92.2896),
    ("Jackson", "MS", 32.2988, -90.1848),
    ("Baton Rouge", "LA", 30.4515, -91.1871),
    ("New Orleans", "LA", 29.9511, -90.0715),
    ("Lafayette", "LA", 30.2241, -92.0198),
    ("Shreveport", "LA", 32.5252, -93.7502),
    ("Mobile", "AL", 30.6954, -88.0399),
    ("Montgomery", "AL", 32.3792, -86.3077),
    ("Huntsville", "AL", 34.7304, -86.5861),
    ("Pensacola", "FL", 30.4213, -87.2169),
    ("Tallahassee", "FL", 30.4383, -84.2807),
    ("Ocala", "FL", 29.1872, -82.1401),
    ("Gainesville", "FL", 29.6516, -82.3248),
    ("Valdosta", "GA", 30.8327, -83.2785),
    ("Macon", "GA", 32.8407, -83.6324),
    ("Augusta", "GA", 33.4735, -82.0105),
    ("Charleston", "SC", 32.7765, -79.9311),
    ("Columbia", "SC", 34.0007, -81.0348),
    ("Greenville", "SC", 34.8526, -82.394),
    ("Florence", "SC", 34.1954, -79.7626),
    ("Fayetteville", "NC", 35.0527, -78.8784),
    ("Greensboro", "NC", 36.0726, -79.792),
    ("Raleigh", "NC", 35.7796, -78.6382),
    ("Asheville", "NC", 35.5951, -82.5515),
    ("Richmond", "VA", 37.5407, -77.436),
    ("Fredericksburg", "VA", 38.3032, -77.4605),
    ("Roanoke", "VA", 37.271, -79.9414),
    ("Winchester", "VA", 39.1857, -78.1633),
    ("Lexington", "KY", 38.0406, -84.5037),
    ("Bowling Green", "KY", 36.9685, -86.4808),
    ("Knoxville", "TN", 35.9606, -83.9207),
    ("Jackson", "TN", 35.6145, -88.8139),
    ("Gary", "IN", 41.5934, -87.3464),
    ("South Bend", "IN", 41.6764, -86.252),
    ("Toledo", "OH", 41.6528, -83.5379),
    ("Dayton", "OH", 39.7589, -84.1916),
    ("Youngstown", "OH", 41.0998, -80.6495),
    ("Pittsburgh", "PA", 40.4406, -79.9959),
    ("Carlisle", "PA", 40.201, -77.1889),
    ("Allentown", "PA", 40.6023, -75.4714),
    ("Scranton", "PA", 41.409, -75.6624),
    ("Baltimore", "MD", 39.2904, -76.6122),
    ("Hagerstown", "MD", 39.6418, -77.72),
    ("Wilmington", "DE", 39.7447, -75.5484),
    ("Trenton", "NJ", 40.2171, -74.7429),
    ("Elizabeth", "NJ", 40.6639, -74.2107),
    ("New Haven", "CT", 41.3083, -72.9279),
    ("Hartford", "CT", 41.7658, -72.6734),
    ("Providence", "RI", 41.824, -71.4128),
    ("Portland", "ME", 43.6591, -70.2568),
    ("Albany", "NY", 42.6526, -73.7562),
    ("Syracuse", "NY", 43.0481, -76.1474),
    ("Binghamton", "NY", 42.0987, -75.918),
    ("Rochester", "NY", 43.1566, -77.6088),
    ("Niagara Falls", "NY", 43.0962, -79.0377),
    ("Port Huron", "MI", 42.9709, -82.4249),
    ("Grand Rapids", "MI", 42.9634, -85.6681),
    ("Milwaukee", "WI", 43.0389, -87.9065),
    ("Madison", "WI", 43.0731, -89.4012),
    ("Green Bay", "WI", 44.5133, -88.0133),
    ("Joliet", "IL", 41.525, -88.0817),
    ("Rockford", "IL", 42.2711, -89.0937),
    ("Springfield", "IL", 39.7817, -89.6501),
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
