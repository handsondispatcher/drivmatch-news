"""Discover additional verifiably licensed photographs from Wikimedia Commons.

Never scrape publisher photos. Image license/credit/source must be present in
Commons file metadata; unknown licensing is rejected. Automated discovery may
fall short of the 350-photo catalog target when Commons is unavailable.
"""
from __future__ import annotations
from html.parser import HTMLParser
from urllib.parse import urlencode,urlsplit
from urllib.request import Request,urlopen
import hashlib,json,re,time

ENDPOINT="https://commons.wikimedia.org/w/api.php"
TOPICS={
    "semi truck":"truck trucking class 8 highway caminhão transporte",
    "tractor trailer":"truck freight highway caminhão carretas",
    "american truck highway":"truck highway interstate estrada rodovia",
    "truck parking":"truck parking rest area truck stop estacionamento",
    "freight container truck":"freight container port transport trucking",
    "warehouse loading dock":"warehouse distribution cargo logistics",
    "delivery trucks":"delivery driver freight courier trucks",
    "port shipping container":"port container shipping freight terminal",
    "highway road USA":"road highway interstate rodovia estrada",
    "truck transportation":"truck driver transport freight",
    "commercial vehicles highway":"commercial truck road highway",
    "diesel powered trucks":"diesel truck fleet caminhões",
    "logistics freight truck":"logistics cargo trucking transport",
    "interstate truck rest area":"truck parking road highway",
    "truck driver cabin":"driver truck cdl sleeper transport",
    "semi trailer":"truck trailer freight transport",
    "truck logistics warehouse":"freight warehouse transport",
    "road cargo transport":"truck highway shipping freight",
    "freight terminal trucks":"terminal trucks cargo port",
    "container port crane":"container crane port shipping",
    "freight transportation USA":"freight truck highway logistics",
    "box trucks freight":"freight box truck delivery",
    "truck inspection":"inspection safety cdl truck",
    "highway overpass truck":"highway road truck interstate",
    "heavy duty trucks":"heavy truck transport fleet",
}
BANNED=re.compile(r"(?:logo|icon|diagram|graph|map|poster|drawing|painting|illustration|"
                  r"banner|advertisement|certificate|stamp|toy|model kit|"
                  r"accident|fatal crash|collision|memorial|flag)",re.I)
ALLOWED=re.compile(r"^(?:CC0(?: 1\.0)?|Public domain|CC BY(?:-SA)? [234]\.0)$",re.I)

class _Text(HTMLParser):
    def __init__(self):
        super().__init__()
        self.data=[]
    def handle_data(self,data):
        self.data.append(data)

def clean_credit(html):
    parser=_Text()
    parser.feed(str(html or ""))
    txt=" ".join(" ".join(parser.data).split())
    # Never publish arbitrary HTML/script as attribution.
    return txt[:180]

def _json(url):
    req=Request(url,headers={
        "User-Agent":"DrivMatchNews/1.0 (editorial licensing; contact via drivmatch.com/news)",
        "Accept":"application/json",
    })
    with urlopen(req,timeout=15) as response:
        return json.load(response)

def discover(existing,goal=350):
    """Return candidate metadata, not an entitlement to publication.

    Every discovered candidate is subsequently downloaded, JPEG-decoded,
    validated and credited by build_news_photos.py before it can be used.
    """
    existing_names={str(x.get("file","")).lower() for x in existing}
    seen=set(existing_names)
    result=[]
    for phrase,tags in TOPICS.items():
        if len(result)+len(existing)>=goal:
            break
        params={
            "action":"query","format":"json","formatversion":"2",
            "generator":"search","gsrnamespace":"6","gsrsearch":phrase,
            "gsrlimit":"50","prop":"imageinfo",
            "iiprop":"url|size|mime|extmetadata","iiurlwidth":"960",
            "maxlag":"5"
        }
        for turn in range(3):
            try:
                obj=_json(ENDPOINT+"?"+urlencode(params))
                break
            except Exception as exc:
                if turn==2:
                    print("PHOTO DISCOVERY SEARCH UNAVAILABLE:",phrase,type(exc).__name__)
                    obj={}
                else:
                    time.sleep(turn+1)
        for item in obj.get("query",{}).get("pages",[]):
            title=str(item.get("title") or "")
            if not title.startswith("File:"):continue
            filename=title[5:]
            if not re.search(r"\.jpe?g$",filename,re.I):continue
            if BANNED.search(filename) or filename.lower() in seen:continue
            info=(item.get("imageinfo") or [{}])[0]
            if info.get("mime")!="image/jpeg" or info.get("width",0)<640 or info.get("height",0)<360:
                continue
            md=info.get("extmetadata") or {}
            license_=str((md.get("LicenseShortName") or {}).get("value") or "").strip()
            if not ALLOWED.fullmatch(license_):continue
            source=str(info.get("descriptionurl") or "")
            image=str(info.get("thumburl") or info.get("url") or "")
            if (urlsplit(source).hostname!="commons.wikimedia.org" or
                not source.startswith("https://commons.wikimedia.org/wiki/File:") or
                urlsplit(image).hostname not in {"upload.wikimedia.org","thumb.wikimedia.org"}):
                continue
            credit=clean_credit((md.get("Artist") or {}).get("value") or "")
            if not credit or len(credit)>180:continue
            ident="commons-"+hashlib.sha1(filename.encode("utf-8")).hexdigest()[:16]
            result.append({
                "id":ident,"file":filename,"download":image,
                "credit":credit,"license":license_,
                "source_url":source,
                "description":"Fotografia de arquivo licenciada do Wikimedia Commons; não representa necessariamente a notícia",
                "keywords":tags.split(),
                "origin":"commons_api_verified_metadata"
            })
            seen.add(filename.lower())
            if len(result)+len(existing)>=goal:break
    print(f"PHOTO DISCOVERY: {len(result)} newly licensed Commons candidates, target {goal} total")
    return result
