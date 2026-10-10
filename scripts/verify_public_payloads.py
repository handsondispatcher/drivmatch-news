#!/usr/bin/env python3
"""Prove DrivMatch public content parity after GitHub Pages deployment.

Version badges are not content freshness. Check the real content endpoints,
using cache-busting queries, without requiring a new story or inventing a LIVE.
"""
import datetime as dt
import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.request
from urllib.parse import urlencode

PAGES = "https://handsondispatcher.github.io/drivmatch-news/"
CUSTOM = "https://drivmatch.com/news/"
FEEDS = ("content.json", "source-headlines.json", "road-tv.json")
UTC = dt.timezone.utc


def parse_date(value):
    try:
        when = dt.datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        return when.astimezone(UTC) if when.tzinfo else None
    except (ValueError, TypeError):
        return None


def fingerprint(document):
    return hashlib.sha256(json.dumps(document, sort_keys=True,
                                     separators=(",", ":"), ensure_ascii=False
                                     ).encode("utf-8")).hexdigest()


def check_pair(feed, pages, custom, now, max_age_minutes=45):
    """Return facts, or fail closed if either origin is stale or different."""
    if not isinstance(pages, dict) or not isinstance(custom, dict):
        raise ValueError(feed + ": expected JSON objects from both origins")
    for label, document in (("pages", pages), ("custom", custom)):
        if document.get("schema_version") not in (1, 2):
            raise ValueError(feed + ": invalid " + label + " schema")
        generated = parse_date(document.get("generated_at"))
        if generated is None:
            raise ValueError(feed + ": missing " + label + " generated_at")
        age = (now - generated).total_seconds() / 60
        if age < -2 or age > max_age_minutes:
            raise ValueError("%s: %s payload age %.1f minutes" %
                             (feed, label, age))
    if fingerprint(pages) != fingerprint(custom):
        raise ValueError(feed + ": custom domain differs from GitHub Pages")
    if feed == "road-tv.json":
        candidates = custom.get("candidates")
        if not isinstance(candidates, list):
            raise ValueError(feed + ": missing candidates list")
        if custom.get("current_live") and not any(
                x.get("live") is True for x in candidates):
            raise ValueError(feed + ": current_live not in verified catalog")
        status = custom.get("live_status")
        if status == "verified_live" and not any(
                x.get("live") is True for x in candidates):
            raise ValueError(feed + ": false verified_live with zero live candidates")
        return {"video_candidates": len(candidates), "live_status": status}
    if feed == "source-headlines.json":
        headlines = custom.get("headlines")
        if not isinstance(headlines, list):
            raise ValueError(feed + ": missing headlines list")
        return {"headlines": len(headlines),
                "latest_original": custom.get("latest_headline_at")}
    articles = custom.get("articles")
    if not isinstance(articles, list):
        raise ValueError(feed + ": missing articles list")
    return {"editorial_articles": len(articles)}


def fetch_document(base, feed, nonce):
    url = base + "data/" + feed + "?" + urlencode({"__deploy_proof": nonce})
    req = urllib.request.Request(url, headers={
        "Accept": "application/json", "Cache-Control": "no-cache",
        "User-Agent": "DrivMatchNews-DeployProof/1.0"})
    with urllib.request.urlopen(req, timeout=12) as response:
        if response.status != 200:
            raise ValueError(feed + ": HTTP " + str(response.status))
        return json.loads(response.read(3_000_000).decode("utf-8"))


def verify_once(now, max_age_minutes=45):
    nonce = str(int(time.time() * 1000))
    results = {}
    for feed in FEEDS:
        page_doc = fetch_document(PAGES, feed, nonce)
        domain_doc = fetch_document(CUSTOM, feed, nonce)
        results[feed] = check_pair(feed, page_doc, domain_doc, now,
                                   max_age_minutes=max_age_minutes)
    return results


def main():
    max_age = int(os.environ.get("DRIVMATCH_MAX_PAYLOAD_AGE_MINUTES", "45"))
    for attempt in range(1, 5):
        now = dt.datetime.now(UTC)
        try:
            results = verify_once(now, max_age_minutes=max_age)
            print("PUBLIC CONTENT PARITY PASS: actual JSON on both origins")
            for name, info in results.items():
                print(name + ": " + json.dumps(info, ensure_ascii=False))
            print("NOTE: matching deployments do not prove new journalism or a live driver.")
            return 0
        except (ValueError, OSError, TimeoutError, json.JSONDecodeError) as exc:
            print("::warning title=Public content proof attempt %d::%s" %
                  (attempt, str(exc)), flush=True)
            if attempt < 4:
                time.sleep(10)
    print("::error title=Custom-domain data stale or inconsistent::"
          "drivmatch.com/news did not serve fresh matching content/road-tv/news"
          " payloads. GitHub Pages deployment alone is insufficient.", flush=True)
    return 1


if __name__ == "__main__":
    sys.exit(main())
