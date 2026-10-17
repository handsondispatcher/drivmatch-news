#!/usr/bin/env python3
"""Generate three Facebook OG JPEGs using the LOCKED news-site master logo.

Source master: site/assets/logo-drivmatch-news.png, exact git blob SHA1 pinned.
Vehicle photography: Wikimedia Commons files under stated Creative Commons
licenses, credited in docs/facebook-previews-image-credits.md.
Images are snapshots, never fetched at Facebook request-time.
"""
from __future__ import annotations
import hashlib
from io import BytesIO
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageFilter

ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/"site"
ASSETS=SITE/"assets"
LOGO=ASSETS/"logo-drivmatch-news.png"
MASTER_GIT_BLOB_SHA1="23eb7391d35da8ef7aa202bebb94045f2d8b8ba7"
W,H=1200,630
PICS=[
    ("SEMI TRUCK","Freightliner eCascadia 4x2.jpg"),
    ("BOX TRUCK","Ryder Refrigerated Box Truck.jpg"),
    ("CARGO VAN","Ford Transit cargo delivery vans.jpg"),
    ("RAM 3500","Ram 3500 pickup truck Eastern Avenue downtown Saint Johnsbury VT September 2017.jpg"),
]
LOCALES={
    "pt":("NOTÍCIAS DE LOGÍSTICA NOS EUA","Fretes · Vagas · Clima · Câmeras ao vivo","ACESSE AGORA","GRÁTIS • 3 IDIOMAS"),
    "en":("U.S. LOGISTICS & TRUCKING NEWS","Freight · Jobs · Weather · Live Cameras","VISIT NOW","FREE • 3 LANGUAGES"),
    "es":("NOTICIAS DE LOGÍSTICA EN EE. UU.","Cargas · Empleos · Clima · Cámaras en vivo","VISITA AHORA","GRATIS • 3 IDIOMAS"),
}

def font(size,bold=True):
    paths=[
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf",
    ]
    for path in paths:
        if Path(path).is_file():
            return ImageFont.truetype(path,size)
    raise RuntimeError("Required image lettering fonts unavailable")

def master_logo():
    blob=LOGO.read_bytes()
    ident=hashlib.sha1(b"blob "+str(len(blob)).encode()+b"\0"+blob).hexdigest()
    if ident!=MASTER_GIT_BLOB_SHA1:
        raise RuntimeError("CANONICAL_NEWS_LOGO_MISMATCH: refusing to replace the approved master")
    with Image.open(BytesIO(blob)) as src:
        src.load()
        im=src.convert("RGBA")
    if im.width<200 or im.height<50:raise RuntimeError("Approved master too small")
    im.thumbnail((730,102),Image.Resampling.LANCZOS)
    return im

def remote_vehicle(filename):
    # Exact Wikimedia Commons canonical file, NOT a generic placeholder.
    source=filename.replace(" ","_")
    digest=hashlib.md5(source.encode("utf-8")).hexdigest()
    url="https://upload.wikimedia.org/wikipedia/commons/"+digest[0]+"/"+digest[:2]+"/"+quote(source)
    request=Request(url,headers={"User-Agent":"DrivMatchNews/1.0 (https://drivmatch.com/news; approved social preview)"})
    with urlopen(request,timeout=30) as r:
        if not r.headers.get("Content-Type","").lower().startswith("image/"):
            raise RuntimeError("Vehicle photo is not an image: "+filename)
        raw=r.read(8_000_001)
    if len(raw)>8_000_000:raise RuntimeError("Vehicle image too large")
    with Image.open(BytesIO(raw)) as src:
        src.load()
        im=src.convert("RGB")
    if min(im.size)<500:raise RuntimeError("Vehicle photo has insufficient resolution: "+filename)
    return im

def fit(draw,text,xy,max_width,initial=50,min_size=26):
    for size in range(initial,min_size-1,-1):
        f=font(size)
        if draw.textbbox((0,0),text,font=f,stroke_width=0)[2]<=max_width:
            draw.text(xy,text,font=f,fill="#ffffff",stroke_width=1,stroke_fill="#061320")
            return size
    raise RuntimeError("Localized social headline exceeds space")

def make(lang,master,photos):
    title,sub,cta,footer=LOCALES[lang]
    art=Image.new("RGBA",(W,H),(5,18,33,255))
    art.alpha_composite(Image.new("RGBA",(W,145),(3,11,24,255)),(0,0))
    for n,((label,_),pic) in enumerate(zip(PICS,photos)):
        x=n*300
        # Keep each whole vehicle visible in a narrow 1:1 Facebook preview cell.
        # A blurred fill avoids cropping the semi/box truck into a trailer-only shot.
        backdrop=ImageOps.fit(pic,(300,303),Image.Resampling.LANCZOS,
                              centering=(.5,.5)).filter(ImageFilter.GaussianBlur(16)).convert("RGBA")
        art.alpha_composite(backdrop,(x,143))
        full=ImageOps.contain(pic,(296,298),Image.Resampling.LANCZOS).convert("RGBA")
        art.alpha_composite(full,(x+(300-full.width)//2,143+(303-full.height)//2))
        ImageDraw.Draw(art,"RGBA").rectangle((x,143,x+6,495),fill=(4,17,28,230))
        ImageDraw.Draw(art,"RGBA").rectangle((x+7,446,x+297,493),fill=(2,16,29,215))
        ld=ImageDraw.Draw(art)
        f=font(19)
        bb=ld.textbbox((0,0),label,font=f)
        ld.text((x+150-(bb[2]-bb[0])/2,459),label,font=f,fill="#ffffff")
    # Dark header reserved for the REAL approved news logo, not a regenerated logo.
    art.alpha_composite(master,(50,22))
    # Three-language announcement is legible at Facebook card preview size.
    d=ImageDraw.Draw(art,"RGBA")
    d.rounded_rectangle((785,43,1150,104),radius=10,fill=(9,48,80,240),outline=(33,146,238,255),width=2)
    d.text((814,59),"PT  •  EN  •  ES",font=font(28),fill="#edfaff")
    # New full-width navy title band, no overlay on the master identity.
    d.rectangle((0,495,W,H),fill=(4,19,36,255))
    fit(d,title,(46,504),1090,initial=37,min_size=26)
    d.text((47,558),sub,font=font(22,False),fill="#b9d4e9")
    # CTA at bottom right, distinct by language.
    d.rounded_rectangle((849,573,1150,617),radius=8,fill=(230,29,41,255))
    f=font(23)
    length=d.textbbox((0,0),cta,font=f)[2]
    d.text((999-length/2,581),cta,font=f,fill="#ffffff")
    d.text((47,599),"drivmatch.com/news",font=font(19),fill="#78ccff")
    d.text((490,599),footer,font=font(16),fill="#daeaf5")
    out=ASSETS/("facebook-news-"+lang+".jpg")
    art.convert("RGB").save(out,"JPEG",quality=91,optimize=True,progressive=True,subsampling=0)
    with Image.open(out) as check:
        if check.size!=(1200,630) or check.format!="JPEG":raise RuntimeError("Invalid OG image")
    print(lang,out.name,out.stat().st_size,hashlib.sha256(out.read_bytes()).hexdigest())

def main():
    logo=master_logo()
    print("CANONICAL_NEWS_LOGO_VERIFIED",MASTER_GIT_BLOB_SHA1,"size",logo.size)
    photos=[remote_vehicle(filename) for _,filename in PICS]
    for lang in ("pt","en","es"):
        make(lang,logo,photos)
    print("FACEBOOK_TRILINGUAL_PREVIEW_PASS")

if __name__=="__main__":main()
