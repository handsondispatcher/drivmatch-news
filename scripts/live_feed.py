"""Safe, fresh, source-attributed news feed for future DrivMatch Live integration.

This is NOT a real-time traffic incident feed. Never label these headlines
as urgent, critical, active road closures or verified operational alerts.
"""
from datetime import datetime, timedelta, timezone
from urllib.parse import quote, urlparse
from editorial_text import same_event

MAX_AGE = timedelta(hours=24)
BLOCKED = {'thetrucker.com', 'news.google.com'}

def make_live_feed(articles, headlines, now=None):
    now = now or datetime.now(timezone.utc)
    items = []
    for row in list(headlines) + list(articles):
        url = str(row.get('source_url') or '')
        host = (urlparse(url).hostname or '').lower().removeprefix('www.')
        if not url.startswith('https://') or any(host == h or host.endswith('.'+h) for h in BLOCKED):
            continue
        if row.get('demo') or row.get('origin_type') == 'aggregator-discovery':
            continue
        if row.get('status') != 'approved' and row.get('geo_scope_verified') is not True:
            continue
        try:
            published = datetime.fromisoformat(str(row['published_at']).replace('Z', '+00:00'))
            if published.tzinfo is None or not timedelta(0) <= now-published <= MAX_AGE:
                continue
        except (ValueError, TypeError, KeyError):
            continue
        titles = row.get('titles') or {l: (row.get('locales', {}).get(l) or {}).get('title') for l in ('pt','en','es')}
        if not titles.get('pt') or not titles.get('en') or not titles.get('es'):
            continue
        ident = str(row.get('id') or '').strip()
        if not ident:
            continue
        title = str(titles['pt']).strip()
        if any(same_event(title, x['titles']['pt']) for x in items):
            continue
        items.append({
            'id': ident, 'kind': 'news', 'severity': None, 'is_active_incident': False,
            'category': row.get('category') or 'Transporte',
            'titles': {lang: str(titles[lang]).strip() for lang in ('pt','en','es')},
            'published_at': published.isoformat(),
            'expires_at': (published+MAX_AGE).isoformat(),
            'source': row.get('source') or 'Fonte identificada',
            'source_url': url,
            'url': 'https://drivmatch.com/news/?story='+quote(ident, safe=''),
            'verification': 'headline_and_source_only',
        })
        if len(items) >= 50:
            break
    return {
        'schema_version': 1,
        'generated_at': now.isoformat(),
        'max_age_hours': 24,
        'kind': 'news_updates_not_traffic_alerts',
        'operational_alerts_integrated': False,
        'items': items,
    }
