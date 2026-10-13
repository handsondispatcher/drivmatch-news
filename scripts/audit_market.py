"""Market publication QA: verify cadence, provenance and expiry without inventing prices."""
from __future__ import annotations
import json
from datetime import datetime, timezone, timedelta
from pathlib import Path

BASE=Path(__file__).resolve().parents[1]
UTC=timezone.utc
MAX_DAYS={'usdbrl':5,'diesel':12,'brent':5}

def validate(data, now=None):
    now=now or datetime.now(UTC)
    indicators=data.get('indicators') or {}
    report={'checked_at':now.isoformat(),'status':'ok','indicators':{},'warnings':[],'errors':[]}
    for key in ('usdbrl','diesel','brent'):
        q=indicators.get(key)
        if not q:
            report['indicators'][key]='unavailable'
            report['warnings'].append(key+':no_current_verified_quote')
            continue
        try:
            price=float(q['value'])
            if not 0<price<100000:raise ValueError('invalid value')
            if not str(q.get('source_url','')).startswith('https://'):raise ValueError('unattributed source')
            if not q.get('source'):raise ValueError('missing source')
            instant=datetime.fromisoformat(q['observed_at'].replace('Z','+00:00'))
            if instant.tzinfo is None:instant=instant.replace(tzinfo=UTC)
            age=now-instant.astimezone(UTC)
            limit=timedelta(minutes=5) if q.get('session_status')=='open' else timedelta(days=MAX_DAYS[key])
            if not timedelta(days=-1)<=age<=limit:
                raise ValueError('expired observation')
            if key=='usdbrl' and q.get('instrument') not in ('spot','ptax_reference'):
                raise ValueError('unknown USD/BRL instrument')
            if key=='brent' and q.get('instrument') not in ('brent_spot','brent_eia_reference'):
                raise ValueError('unlabeled Brent instrument')
            if key=='diesel' and q.get('instrument')!='diesel_eia_reference':
                raise ValueError('diesel not verified official weekly reference')
            report['indicators'][key]={'status':q.get('session_status','reference'),'observed_at':q['observed_at'],'source':q['source']}
        except (ValueError,KeyError,TypeError) as exc:
            report['indicators'][key]='invalid'
            report['errors'].append(key+':'+str(exc))
    report['status']='invalid' if report['errors'] else 'partial' if report['warnings'] else 'ok'
    return report

def main():
    data=json.loads((BASE/'site/data/market.json').read_text(encoding='utf-8'))
    result=validate(data)
    target=BASE/'build/market-health.json'
    target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    for msg in result['warnings']:
        print('::warning title=Market source unavailable::'+msg)
    for msg in result['errors']:
        print('::error title=Market data contract violated::'+msg)
    print('MARKET AUDIT:',result['status'],result['indicators'])
    if result['errors']:
        raise SystemExit('Invalid market quote: publication blocked to prevent false prices')

if __name__=='__main__':
    main()
