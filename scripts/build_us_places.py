"""Publish a searchable US Census city/place index for reader-selected weather.

A static public gazetteer avoids sending readers' typed locations to a
third-party geocoder and avoids the commercial/rate-limit problems of free APIs.
Forecasts remain sourced separately from the official National Weather Service.
"""
from __future__ import annotations
import csv
import io
import json
import re
import zipfile
from datetime import datetime,timezone
from pathlib import Path
from urllib.request import Request,urlopen

ROOT=Path(__file__).resolve().parents[1]
SOURCE_URL="https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2025_Gazetteer/2025_Gaz_place_national.zip"
CACHE=ROOT/"build/us-places-cache.json"
OUTPUT=ROOT/"site/data/us-places.json"
STATE_CODES=set("AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY PR".split())
NAME_SUFFIX=re.compile(r"\s+(?:city|town|village|borough|municipality|CDP|census designated place|urban community)$",re.IGNORECASE)

def parse_gazetteer(blob:bytes):
    if len(blob)>4_000_000:raise ValueError("Census archive exceeds expected size")
    with zipfile.ZipFile(io.BytesIO(blob)) as archive:
        files=[n for n in archive.namelist() if n.endswith(".txt") and "/" not in n]
        if len(files)!=1:raise ValueError("Unexpected National Places archive")
        info=archive.getinfo(files[0])
        if info.file_size>12_000_000:raise ValueError("Census TSV too large")
        raw=archive.read(files[0])
    text=raw.decode("utf-8-sig")
    rows=csv.DictReader(io.StringIO(text),delimiter="\t")
    required={"USPS","NAME","INTPTLAT","INTPTLONG"}
    if not rows.fieldnames or not required.issubset({n.strip() for n in rows.fieldnames}):
        raise ValueError("Census National Places columns unexpected")
    found={}
    for row in rows:
        state=(row.get("USPS") or "").strip().upper()
        if state not in STATE_CODES:continue
        name=NAME_SUFFIX.sub("",(row.get("NAME") or "").strip()).strip()
        if not name or len(name)>80:continue
        try:
            lat=round(float(row["INTPTLAT"]),5)
            lon=round(float(row["INTPTLONG"]),5)
        except (ValueError,TypeError,KeyError):continue
        if not (17.0<=lat<=72.0 and -180<=lon<=-64):continue
        key=(name.casefold(),state)
        found[key]=[name,state,lat,lon]
    places=sorted(found.values(),key=lambda p:(p[0].casefold(),p[1]))
    if len(places)<20_000:raise ValueError(f"Census place coverage unexpectedly low: {len(places)}")
    if not any(p[0]=="St. Charles" and p[1]=="MO" for p in places):
        raise ValueError("Missing St. Charles, MO from national places")
    if not any(p[0]=="St. Charles" and p[1]=="IL" for p in places):
        raise ValueError("Missing St. Charles, IL from national places")
    return places

def validate_cache(payload):
    if payload.get("schema_version")!=1 or payload.get("source_url")!=SOURCE_URL:
        raise ValueError("Untrusted Census index version")
    places=payload.get("places")
    if not isinstance(places,list) or len(places)<20_000:
        raise ValueError("No valid national place index")
    if not all(any(p[:2]==["St. Charles",state] for p in places) for state in ("IL","MO")):
        raise ValueError("Missing duplicate-city regression fixtures")
    return payload

def build(fetch=None):
    if CACHE.exists():
        try:
            doc=validate_cache(json.loads(CACHE.read_text(encoding="utf-8")))
            OUTPUT.parent.mkdir(parents=True,exist_ok=True)
            OUTPUT.write_text(json.dumps(doc,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
            print("CENSUS PLACE INDEX PASS (cached):",len(doc["places"]))
            return doc
        except (OSError,ValueError,TypeError,KeyError):
            pass
    if fetch is None:
        def fetch(url):
            request=Request(url,headers={"User-Agent":"DrivMatchNews/1.0 (https://drivmatch.com/news)","Accept":"application/zip"})
            with urlopen(request,timeout=28) as res:
                return res.read(4_000_001)
    places=parse_gazetteer(fetch(SOURCE_URL))
    doc={"schema_version":1,"source":"U.S. Census Bureau — 2025 National Places Gazetteer",
         "source_url":SOURCE_URL,
         "generated_at":datetime.now(timezone.utc).isoformat(timespec="seconds"),
         "places":places}
    validate_cache(doc)
    CACHE.parent.mkdir(parents=True,exist_ok=True)
    CACHE.write_text(json.dumps(doc,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
    OUTPUT.parent.mkdir(parents=True,exist_ok=True)
    OUTPUT.write_text(json.dumps(doc,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
    print("CENSUS PLACE INDEX PASS (downloaded):",len(places),
          "St. Charles states:",[p[1] for p in places if p[0]=="St. Charles"])

if __name__=="__main__":
    build()
