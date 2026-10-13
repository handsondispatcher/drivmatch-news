"""Market publication QA: verify cadence, provenance and expiry without inventing prices."""
from __future__ import annotations
import json
from datetime import datetime, timezone, timedelta
from pathlib import Path

BASE=Path(__file__).resolve().parents[1]
UTC=timezone.utc
MAX_DAYS={'usdbrl':5,'diesel':12,'brent':5}

from zoneinfo import ZoneInfo

EASTERN=ZoneInfo('America/New_York')
BRAZIL=ZoneInfo('America/Sao_Paulo')
# EIA's published 2026 holiday schedule (release date is for MONDAY'S price).
# This is maintained from eia.gov/petroleum/gasdiesel/schedule.php.
EIA_DIESEL_HOLIDAY_RELEASES={
    '2026-01-19':'2026-01-21',
    '2026-02-16':'2026-02-18',
    '2026-05-25':'2026-05-27',
    '2026-09-07':'2026-09-09',
    '2026-10-12':'2026-10-14',
}

def diesel_expected_observation(now):
    """Latest Monday whose EIA release is expected to have appeared.

    Allow 2 hours for vendor delivery / EIA-to-FRED propagation; Saturday
    and Sunday are not extra daily diesel observations.
    """
    et=now.astimezone(EASTERN)
    monday=et.date()-timedelta(days=et.weekday())
    release_override=EIA_DIESEL_HOLIDAY_RELEASES.get(monday.isoformat())
    release_day=(datetime.fromisoformat(release_override).date() if release_override
                 else monday+timedelta(days=1))
    release_at=datetime.combine(release_day,datetime.min.time().replace(hour=10),tzinfo=EASTERN)
    if et < release_at+timedelta(hours=2):
        return monday-timedelta(days=7),release_at.isoformat()
    return monday,release_at.isoformat()


# Brazilian national FX-market holidays (2026); no same-day PTAX is expected.
# The BCB calendar may also have banking-specific closure days; these are
# monitored by observation age rather than invented PTAX rates.
BCB_2026_CLOSED_DAYS={
    '2026-01-01','2026-04-03','2026-04-21','2026-05-01',
    '2026-09-07','2026-10-12','2026-11-02','2026-11-20','2026-12-25'
}

def fx_expected_observation(now):
    """Calendar-level check; holidays can delay PTAX without faking rates."""
    sao=now.astimezone(BRAZIL)
    target=sao.date()
    # PTAX has four daily observations; expect some bulletin by ~15:30 BRT.
    if sao.hour<15 or (sao.hour==15 and sao.minute<30):
        target-=timedelta(days=1)
    while target.weekday()>=5 or target.isoformat() in BCB_2026_CLOSED_DAYS:
        target-=timedelta(days=1)
    return target


def source_schedule_warnings(indicators,now):
    warnings=[]
    diesel=indicators.get('diesel')
    expected,scheduled=diesel_expected_observation(now)
    if diesel:
        try:
            day=datetime.fromisoformat(diesel['observed_at'][:10]).date()
            if day<expected:
                warnings.append('diesel:official_release_due_since_'+scheduled)
        except (ValueError,TypeError,KeyError):
            warnings.append('diesel:missing_observation_date')
    usd=indicators.get('usdbrl')
    if usd and usd.get('instrument')=='ptax_reference':
        try:
            day=datetime.fromisoformat(usd['observed_at'][:10]).date()
            if day<fx_expected_observation(now):
                warnings.append('usdbrl:ptax_older_than_expected_bulletin_check_BCB_holiday_calendar')
        except (ValueError,TypeError,KeyError):
            warnings.append('usdbrl:invalid_ptax_date')
    brent=indicators.get('brent')
    if brent and brent.get('quote_status')=='historical_reference':
        warnings.append('brent:latest_EIA_publication_is_historical_licensed_market_feed_needed')
    return warnings


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
            historical=(key=='brent' and q.get('session_status')=='historical_reference'
                        and q.get('quote_status')=='historical_reference'
                        and q.get('instrument')=='brent_eia_reference')
            limit=timedelta(minutes=5) if q.get('session_status')=='open' else timedelta(days=21 if historical else MAX_DAYS[key])
            if not timedelta(minutes=-5)<=age<=limit:
                raise ValueError('expired observation')
            if key=='usdbrl' and q.get('instrument') not in ('spot','ptax_reference'):
                raise ValueError('unknown USD/BRL instrument')
            if key=='brent' and q.get('instrument') not in ('brent_spot','brent_eia_reference'):
                raise ValueError('unlabeled Brent instrument')
            if key=='diesel' and q.get('instrument')!='diesel_eia_reference':
                raise ValueError('diesel not verified official weekly reference')
            report['indicators'][key]={'status':q.get('session_status','reference'),'observed_at':q['observed_at'],'source':q['source']}
            if historical:
                report['warnings'].append('brent:EIA_reference_is_historical_not_current_market')
        except (ValueError,KeyError,TypeError) as exc:
            report['indicators'][key]='invalid'
            report['errors'].append(key+':'+str(exc))
    report['warnings'].extend(source_schedule_warnings(indicators,now))
    report['source_failures']=data.get('errors',[])
    report['next_expected_diesel']={'monday_observation':diesel_expected_observation(now)[0].isoformat(),
                                    'release_et':diesel_expected_observation(now)[1]}
    report['source_registry']={'usdbrl':'Commercial licensed / BCB PTAX',
                               'diesel':'EIA weekly (FRED backup)',
                               'brent':'EIA daily spot reference / licensed Brent spot'}
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
