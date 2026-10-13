"""Keep the original Aileen Souza driver classified immutable.

Presence is an activation gate. Missing image does not corrupt the newspaper;
it is a tracked publication blocker for this individual classified.
"""
import hashlib
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

def verify():
    ads=json.loads((ROOT/'content/ads.json').read_text(encoding='utf-8'))
    drivers=[ad for ad in ads['placements'] if ad.get('slot')=='market-sidebar-driver' and ad.get('enabled')]
    if len(drivers)!=1:raise ValueError('Driver classified placement must be unique')
    ad=drivers[0]
    if ad.get('relationship')!='third_party_classified':raise ValueError('Must be labeled as third-party classified')
    if ad['whatsapp_url']!='https://wa.me/14072852874':raise ValueError('Wrong WhatsApp destination')
    if ad['phone_display']!='(407) 285-2874':raise ValueError('Wrong original contact')
    if ad['image']!='assets/ads/aileen-souza-motorista-disponivel-original.jpg':raise ValueError('Unapproved image path')
    image=ROOT/'site'/ad['image']
    if not image.exists():
        return {'status':'asset_pending','slot':ad['slot'],'asset':ad['image'],'sha256':ad['approved_original_sha256']}
    digest=hashlib.sha256(image.read_bytes()).hexdigest()
    if digest!=ad['approved_original_sha256']:
        raise ValueError('Classified original pixel integrity failed; refuse edited art')
    if not image.read_bytes().startswith(bytes.fromhex('ffd8ff')):
        raise ValueError('Expected original JPEG')
    return {'status':'ready','slot':ad['slot'],'asset':ad['image'],'sha256':digest}

if __name__=='__main__':
    report=verify()
    print('DRIVER CLASSIFIED:',json.dumps(report,ensure_ascii=False))
    if report['status']=='asset_pending':
        print('::warning title=Approved classified awaiting binary upload::Upload the exact 1229x1536 JPEG to '+report['asset'])
