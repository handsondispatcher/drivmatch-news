#!/usr/bin/env python3
"""Create PUBLIC browser configuration for the personal TV Pages app.

Only public Supabase URL and publishable/anon key may be embedded in a static
GitHub Pages asset. The owner's UUID and service-role key remain server-side.
Missing values leave an intentionally inaccessible TV instead of guessing.
"""
import json
import os
from pathlib import Path
from urllib.parse import urlparse

output = Path("site/TV/config.js")
url = os.environ.get("TV_SUPABASE_URL", "").strip().rstrip("/")
key = os.environ.get("TV_SUPABASE_PUBLISHABLE_KEY", "").strip()

if url or key:
    host = urlparse(url).hostname or ""
    if (urlparse(url).scheme != "https" or not host.endswith(".supabase.co")
        or not key or key.startswith("sb_secret_")
        or "service_role" in key.lower()):
        raise SystemExit("TV config ERROR: invalid public Supabase values (no secret printed)")
else:
    print("TV config: public values absent; viewer remains closed to all accounts")

payload = json.dumps({"supabaseUrl": url, "supabaseAnonKey": key}, ensure_ascii=False)
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(
    "// Public browser config only; private owner authorization is server-side.\n"
    "window.DRIVMATCH_PRIVATE_TV_CONFIG = Object.freeze(" + payload + ");\n",
    encoding="utf-8",
)
print("TV public config generated (fail-closed if unset)")
