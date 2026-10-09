# DrivMatch Live — integration handoff / fail-closed

**Status:** DrivMatch News feed is produced automatically. The separate `drivmatch.com/live` application has NOT been changed: its source repository/deployment is not connected here. The home-page footer ticker is also part of that separate application.

## Feed available after successful News deployment

`https://drivmatch.com/news/data/live-feed.json`

- Updated by the News GitHub Actions schedule (nominally every 10 minutes, not guaranteed).
- Only news headlines with verified source URL, Portuguese/English/Spanish titles and publication timestamps within the last 24 hours.
- No The Trucker links, Google News redirect URLs, stale entries or synthetic "urgent" status.
- Each item has `published_at`, `expires_at`, `titles`, `source_url`, `url` (DrivMatch News context), `kind: news`, `is_active_incident: false`.
- `operational_alerts_integrated: false` explicitly means **NOT a live road closure / NWS warning / state 511 feed**.

## Required work in the DrivMatch main website repository (Ricardo or maintainer)

1. Locate the source component for the home-page bottom ticker and the `/live` alerts list. Remove the static sample alerts, including seven-month-old accidents, storms, bridge closures and "Testando".
2. Fetch the JSON endpoint above using `cache: 'no-store'` at page load and at most once per 60 seconds. Abort / retry with backoff on failure; do not claim "just now" if the fetch fails.
3. Render news items under **All / News**, never as Critical / Weather / Traffic incidents without a separately verified live alert source.
4. Filter `Date.now() < Date.parse(item.expires_at)`; if `generated_at` is older than 30 minutes, mark the source **stale** and show an explicit status, not "Live / just now".
5. Use `titles.pt`, `titles.en`, or `titles.es` according to the site language. Link the ticker to `item.url`, not to a publisher that may geo-block readers.
6. Integrate official, active, time-bounded NWS / state DOT 511 feeds in a separate operational-alert pipeline before displaying **Critical**, **Urgent**, **Traffic** or **Weather** alerts. Require incident identifiers, location, source, effective time, expiration and status. Never fabricate events or persist expired alerts as active.
7. Add end-to-end tests for freshness, empty feed, failed fetch, stale data, deduplication, Brazilian accessibility and multilingual rendering.
8. Deploy the main website separately and verify both `https://drivmatch.com/` and `https://drivmatch.com/live` with an uncached browser session.

**Access dependency:** Grant the GitHub connector access to the repository that serves `drivmatch.com` (not only `drivmatch-news`), or have Ricardo apply the integration. A news-repository commit alone cannot update the Live React app or home ticker.
