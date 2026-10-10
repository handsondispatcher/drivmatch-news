"""Fail-closed, idempotent GitHub Issues monitor for DrivMatch News.

The GitHub Pages deploy may succeed while news or videos remain stale.
This monitor does not fabricate stories or mark embeds as actually playing.
One issue per unresolved operational problem; auto-close only on recovery.
"""
from __future__ import annotations
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

MARKER = '<!-- drivmatch-autopilot-managed -->'
ROOT = Path(__file__).resolve().parents[1]
INCIDENTS = {
    'video': '[Ops] Road TV sem transmissões verificadas',
    'news': '[Ops] DrivMatch News sem manchetes recentes',
}

def load(path):
    try:
        return json.loads((ROOT / path).read_text(encoding='utf-8'))
    except (OSError, ValueError, TypeError):
        return {}

def assess(news, video):
    """Returns unresolved incidents. Catalog validity != playback success."""
    out = {}
    count = len(video.get('candidates') or [])
    if count == 0:
        warnings = video.get('warnings') or []
        missing = any('credentials' in str(w) for w in warnings)
        out['video'] = (
            'Nenhuma transmissão de motorista foi verificada pela plataforma. '
            'A câmera rodoviária do fornecedor continua como fallback sem certificação de movimento.\n\n'
            + ('**Ação única necessária:** configurar `YOUTUBE_DATA_API_KEY` em '
               'GitHub → Settings → Secrets and variables → Actions. '
               'Opcional: `TWITCH_CLIENT_ID` e `TWITCH_CLIENT_SECRET`. '
               if missing else 'Verificar cotas da API, metadados, permissão de incorporação e disponibilidade. ')
            + 'O sistema pesquisa automaticamente depois disso. '
            'Não adicionar tokens ao código ou a issues.'
        )
    try:
        age = int(news.get('latest_original_age_minutes'))
    except (ValueError, TypeError):
        age = 999999
    if age > 360:
        stats = news.get('source_metrics') or {}
        out['news'] = (
            f'Última manchete elegível há {age} minutos (ou sem data verificável). '
            f'Fontes operantes: {stats.get("working","?")}; falhas: {stats.get("failed","?")}. '
            f'Candidatos originais recentes: {news.get("publisher_candidates_last_180_minutes","?")}; '
            f'elegíveis: {news.get("eligible_publisher_candidates_last_180_minutes","?")}.\n\n'
            'Revisar feeds primários, rejeições geográficas/editoriais e datas originais. '
            'Não publicar notícias fictícias nem transformar horário do build em horário da reportagem.'
        )
    return out

def github_request(path, token, method='GET', data=None):
    url = 'https://api.github.com' + path
    payload = None if data is None else json.dumps(data).encode('utf-8')
    req = urllib.request.Request(url, data=payload, method=method, headers={
        'Authorization': 'Bearer ' + token,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'DrivMatchNews-OperationalWatch/1.0',
        'Content-Type': 'application/json',
    })
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode('utf-8'))

def sync(repo, token, unresolved):
    # One managed issue per incident. Never touch unrelated human-authored issues.
    open_issues = github_request(f'/repos/{repo}/issues?state=open&per_page=100', token)
    managed = {issue['title']: issue for issue in open_issues
               if 'pull_request' not in issue and MARKER in (issue.get('body') or '')}
    for kind, title in INCIDENTS.items():
        existing = managed.get(title)
        if kind in unresolved:
            if existing:
                print(f'OPEN INCIDENT #{existing["number"]}: {title}')
            else:
                body = MARKER + '\n' + unresolved[kind] + (
                    '\n\nMonitor automático do GitHub Actions; o problema permanece aberto '
                    'até uma execução comprovar recuperação de metadados.')
                result = github_request(f'/repos/{repo}/issues', token, 'POST',
                                        {'title': title, 'body': body})
                print(f'CREATED INCIDENT #{result["number"]}: {title}')
        elif existing:
            github_request(f'/repos/{repo}/issues/{existing["number"]}', token, 'PATCH',
                           {'state': 'closed', 'state_reason': 'completed'})
            print(f'CLOSED RECOVERED INCIDENT #{existing["number"]}: {title}')
        else:
            print(f'HEALTHY: {title}')

def main():
    news = load('build/newsroom-health.json')
    video = load('site/data/road-tv.json')
    unresolved = assess(news, video)
    for kind in INCIDENTS:
        print(('ALERT' if kind in unresolved else 'OK') + ': ' + INCIDENTS[kind])
    token, repo = os.getenv('GH_TOKEN', ''), os.getenv('GITHUB_REPOSITORY', '')
    if not token or not repo:
        print('Issue sync skipped (no GitHub Actions token/repository).')
        return 0
    try:
        sync(repo, token, unresolved)
    except (urllib.error.URLError, ValueError, KeyError, TypeError) as exc:
        print('::warning title=Ops incident sync unavailable::' + type(exc).__name__)
        return 0  # Never block the public site because issue tracking is unavailable.
    return 0

if __name__ == '__main__':
    sys.exit(main())
