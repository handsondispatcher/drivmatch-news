#!/usr/bin/env python3
"""Compose UCR 2027 1774x394 native wide banners in PT, EN and ES.

Owner-requested 2026-10-13 corrective edition. Reuses only the exact approved
UCR six-panel image for the truck photograph and circular UCR badge; typography,
background and CTA blocks are recreated at the actual publishing dimensions.
The existing square sidebar creative is never changed by this generator.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance, ImageOps
import io, urllib.request, hashlib, argparse

W,H=1774,394
MASTER_URL='https://cdn.openart.ai/openart-uploads/production/attachment-transfers/4b041d683a7a9321c7264a6a45db2ab572285dfcb901699caf3c363086f75174.png'
MASTER_PIXEL_SHA256='0721e8bfc5afe7d871508f648238c128f50bc27b79abaae5dbd77c75a0e53df8'
FONT_BLACK='/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed-Bold.ttf'
FONT_BOLD=FONT_BLACK
FONT_ITALIC='/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed-BoldOblique.ttf'
TEXT={
 'pt':dict(head='REGULARIZE SUA EMPRESA',intro='SERVIÇO PRIVADO A PARTIR DE',price='US$ 110,00',warning='EVITE MULTAS E PENALIDADES',insta='ENVIAR MENSAGEM',disclaimer=('Serviço privado independente.','Confirme taxas oficiais e condições.')),
 'en':dict(head='GET YOUR UCR 2027 REGISTRATION',intro='PRIVATE SERVICE STARTING AT',price='US$ 110.00',warning='AVOID FINES AND PENALTIES',insta='SEND A MESSAGE',disclaimer=('Independent private service.','Check official fees and terms.')),
 'es':dict(head='REGULARIZA TU EMPRESA',intro='SERVICIO PRIVADO DESDE',price='US$ 110,00',warning='EVITA MULTAS Y SANCIONES',insta='ENVIAR MENSAJE',disclaimer=('Servicio privado independiente.','Consulta tasas oficiales y condiciones.')),
}
def font(path,size):return ImageFont.truetype(path,size)
def fit_font(draw,text,path,max_size,max_width,min_size=15):
 for size in range(max_size,min_size-1,-1):
  f=font(path,size)
  if draw.textbbox((0,0),text,font=f,stroke_width=0)[2]<=max_width:return f
 return font(path,min_size)
def shadow_text(d,xy,text,f,fill,shadow=(0,0,0,230),offset=3):
 x,y=xy
 d.text((x+offset,y+offset),text,font=f,fill=shadow)
 d.text((x,y),text,font=f,fill=fill)
def rounded_gradient(im,box,c1,c2,r=14):
 x0,y0,x1,y1=box;w=x1-x0;h=y1-y0
 layer=Image.new('RGBA',(w,h));px=layer.load()
 for y in range(h):
  t=y/max(1,h-1)
  for x in range(w):px[x,y]=tuple(int(c1[i]*(1-t)+c2[i]*t) for i in range(3))+(255,)
 mask=Image.new('L',(w,h),0);ImageDraw.Draw(mask).rounded_rectangle((0,0,w-1,h-1),radius=r,fill=255)
 im.paste(layer,(x0,y0),mask)
def draw_icon(d,kind,cx,cy):
 if kind=='wa':
  d.ellipse((cx-24,cy-24,cx+24,cy+24),outline='white',width=5)
  d.polygon([(cx-20,cy+16),(cx-23,cy+27),(cx-7,cy+20)],fill='white')
  d.arc((cx-10,cy-12,cx+12,cy+10),35,150,fill='white',width=6)
  d.line([(cx-7,cy+3),(cx+5,cy+13)],fill='white',width=5)
 else:
  d.rounded_rectangle((cx-23,cy-23,cx+23,cy+23),radius=12,outline='white',width=5)
  d.ellipse((cx-10,cy-10,cx+10,cy+10),outline='white',width=4)
  d.ellipse((cx+11,cy-14,cx+16,cy-9),fill='white')
def draw_banner(src,lang):
 im=Image.new('RGBA',(W,H),(4,19,38,255))
 d=ImageDraw.Draw(im)
 d.rectangle((0,0,W,314),fill=(3,19,38))
 for j in range(5):
  y=15+j*60
  d.polygon([(0,y),(315,y+25),(315,y+52),(0,y+24)],fill=(24,42,71) if j%2 else (88,20,36))
 for y in (16,48,80,112,144,176,208,240,272):
  for x in (10,50,90,130,170,210,250,290):
   if (x//40+y//32)%2==0:d.text((x,y),'★',font=font(FONT_BOLD,13),fill=(104,136,166))
 # The exact approved source supplies the photographic truck, not a new AI approximation.
 truck=ImageOps.fit(src.crop((1905,105,2160,275)),(620,315),method=Image.Resampling.LANCZOS,centering=(0.53,0.50))
 truck=ImageEnhance.Contrast(truck).enhance(1.10).convert('RGBA')
 im.paste(truck,(1154,0))
 fade=Image.new('RGBA',(W,H),(0,0,0,0));p=fade.load()
 for x in range(1154,1440):
  a=255 if x<=1310 else int(255*(1440-x)/130)
  for y in range(315):p[x,y]=(2,12,28,a)
 im=Image.alpha_composite(im,fade)
 d=ImageDraw.Draw(im)
 shadow_text(d,(26,11),'DrivMatch',font(FONT_ITALIC,38),'white',offset=2)
 shadow_text(d,(248,11),'News',font(FONT_ITALIC,38),(255,49,53,255),offset=2)
 d.line((28,55,348,55),fill=(242,39,44),width=4)
 # Badge is a geometric circular cutout of the advertiser-approved master.
 badge=src.crop((25,63,197,232)).resize((223,223),Image.Resampling.LANCZOS).convert('RGBA')
 bm=Image.new('L',(223,223),0);ImageDraw.Draw(bm).ellipse((3,3,220,220),fill=255)
 bm=bm.filter(ImageFilter.GaussianBlur(1.1));im.paste(badge,(56,70),bm)
 d=ImageDraw.Draw(im)
 f=font(FONT_BLACK,104)
 shadow_text(d,(326,45),'UCR',f,(255,255,255,255),offset=4)
 year_x=326+d.textbbox((0,0),'UCR',font=f)[2]+10
 shadow_text(d,(year_x,45),'2027',f,(246,39,45,255),offset=4)
 d.rounded_rectangle((325,151,1175,201),radius=6,fill=(190,15,29,247))
 d.polygon([(1155,151),(1185,151),(1168,201),(1138,201)],fill=(242,47,45))
 t=TEXT[lang]
 f=fit_font(d,t['head'],FONT_ITALIC,43,815,25)
 shadow_text(d,(344,155),t['head'],f,'white',offset=2)
 intro=fit_font(d,t['intro'],FONT_BOLD,24,650,19)
 shadow_text(d,(340,201),t['intro'],intro,(241,245,255,255),offset=2)
 price=fit_font(d,t['price'],FONT_BLACK,62,640,50)
 shadow_text(d,(337,221),t['price'],price,(255,222,39,255),offset=3)
 d.polygon([(323,282),(1106,282),(1086,312),(310,312)],fill=(192,15,31,255))
 d.polygon([(334,289),(348,289),(342,303),(328,303)],fill=(255,237,237))
 f=fit_font(d,t['warning'],FONT_ITALIC,28,720,20)
 shadow_text(d,(361,281),t['warning'],f,(255,255,255,255),offset=2)
 d.rectangle((0,314,W,H),fill=(1,19,39,255))
 d.line((0,314,W,314),fill=(34,109,159),width=2)
 rounded_gradient(im,(23,324,610,385),(22,174,79),(1,105,47),r=13)
 rounded_gradient(im,(629,324,1206,385),(87,43,214),(229,28,119),r=13)
 d=ImageDraw.Draw(im)
 draw_icon(d,'wa',60,354);draw_icon(d,'ig',669,354)
 shadow_text(d,(96,325),'WHATSAPP',font(FONT_BOLD,17),'white',offset=1)
 shadow_text(d,(95,342),'(908) 291-3386',font(FONT_BLACK,33),'white',offset=1)
 shadow_text(d,(705,325),t['insta'],font(FONT_BOLD,17),'white',offset=1)
 shadow_text(d,(703,344),'@fabriciodispatcher',fit_font(d,'@fabriciodispatcher',FONT_BLACK,28,450,21),'white',offset=1)
 d.line((1221,329,1221,381),fill=(102,157,197),width=2)
 for i,line in enumerate(t['disclaimer']):
  ff=fit_font(d,line,FONT_BOLD,19,510,15)
  d.text((1241,332+i*25),line,font=ff,fill=(230,239,250))
 return im.convert('RGB')
def main():
 ap=argparse.ArgumentParser()
 ap.add_argument('--source',default='build/ucr-master-six-panel.png')
 ap.add_argument('--out',default='site/assets/ads')
 a=ap.parse_args()
 if a.source and Path(a.source).exists():
  raw=Path(a.source).read_bytes()
 else:
  with urllib.request.urlopen(urllib.request.Request(MASTER_URL,headers={'User-Agent':'DrivMatchNews-CreativeBuilder/1.0'}),timeout=40) as r:raw=r.read()
  if a.source:
   Path(a.source).parent.mkdir(parents=True,exist_ok=True)
   Path(a.source).write_bytes(raw)
 src=Image.open(io.BytesIO(raw)).convert('RGB')
 assert src.size==(2162,727),f'UCR master unexpectedly changed dimensions: {src.size}'
 assert hashlib.sha256(src.tobytes()).hexdigest()==MASTER_PIXEL_SHA256,'UCR approved source pixel SHA256 changed'
 out=Path(a.out);out.mkdir(parents=True,exist_ok=True)
 for lang in TEXT:
  im=draw_banner(src,lang)
  p=out/f'ucr-2027-{lang}-wide-1774x394.png'
  im.save(p,optimize=True)
  assert Image.open(p).size==(W,H)
  print(f'UCR EXACT WIDE {lang}: {p} {p.stat().st_size} bytes')
if __name__=='__main__':main()
