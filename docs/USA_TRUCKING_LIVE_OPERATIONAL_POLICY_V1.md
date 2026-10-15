# USA Trucking Live — operational discovery and publication policy v1.0

**Owner approval:** 2026-10-14. **Scope:** DrivMatch News / Road TV only. **Publication state:** governed policy; no claim that a valid livestream is currently available. The separate DrivMatch TV product is out of scope.

## Permanent invariants
1. Discover active US trucking broadcasts automatically, including search phrases `usa truck live`, `usa trucking live`, `truck driver POV live USA`, `trucking live driving USA` and `truck dashcam live usa`. Continue low-cost monitoring of owner-suggested creator channels; unresolved handles must never be treated as confirmed channels.
2. Prioritize a genuinely active, public, embeddable **forward-facing POV from a moving cargo vehicle in the United States**, with owner-curated monitored drivers first, then other eligible US streams. Relevant formats: semi-truck, box truck, pickup used for cargo work, cargo van. Publisher metadata indicates but does not independently prove position, movement or camera angle.
3. Verify candidate identities and active status through authorized provider APIs before claiming LIVE. Never manufacture a video identifier, country, LIVE status or active motion. Require embedding allowed and respect intellectual property and platform terms. Fail closed when API credentials, quota, connection or validation are unavailable.
4. When no eligible driver live is available, retain the existing approved Road TV fallback/rotation policy: permitted US highway/traffic cameras and eligible recent recordings. Replays must be clearly labeled **REPLAY / GRAVADO**, limited to today/yesterday and matched to the actual original broadcast clock when verified. A recorded video must never be called LIVE. Respect existing camera ordering and `recorded_streams_after_cameras` until separately approved.
5. Preserve existing operator manual selection, do not display duplicate channels, avoid idle/offline embeds, recover gracefully when video ends or embed fails, and preserve existing UI/layout.
6. Use the repository's scheduled GitHub Actions pipeline (target ten-minute build) and existing rate-limited discovery/cache strategy. Schedules are best effort, not a guarantee of publication to the minute. Display freshness/availability honestly.
7. Publish only successfully checked content. No misleading claims that a YouTube API key is provisioned, live streams are found, viewer playback is validated or production rollout is approved until logs and deployed player have been tested.
8. Maintain the separation between `handsondispatcher/drivmatch-news` and `DrivMatch/drivmatch-tv`. Do not trigger or authorize a public DrivMatch TV broadcast through Road TV changes.

## Required production acceptance evidence
- Secret `YOUTUBE_DATA_API_KEY` present in GitHub Actions (never print or expose value), with authorized requests succeeding.
- Scheduled discovery logs prove a fresh request, candidate evaluation and rejection reasons; quotas within budget.
- At least one eligible public, embeddable, currently LIVE US driver POV is selected **when objectively available**; otherwise fallback is honest.
- Browser test at `https://drivmatch.com/news` verifies player playback, switching, manual-choice preservation, mobile presentation and fallback.
- Tests pass; deploy job succeeds; resulting generated `site/data/road-tv.json` reports source/status accurately.
- For sustained failures: open an issue with diagnostics and stop labeling recordings as live.

## Verification
A successful workflow run alone establishes only build/deployment health, **not** a verified live video. Claims about operational status must cite actual content, API status and user-facing playback checks.
