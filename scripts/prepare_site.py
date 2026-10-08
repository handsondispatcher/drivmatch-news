from pathlib import Path
import re
r=Path(__file__).resolve().parents[1]
html=(r/'reference/drivmatch_news_v18_aprovada.html').read_text(encoding='utf-8')
html=re.sub(r'<title>.*?</title>', '<title>DrivMatch News — Transporte e logística nos EUA</title>',html,count=1)
# v18 layout / styles are preserved; asset and runtime moved to separate files for maintainability.
html=re.sub(r'(<img alt="Logomarca oficial DrivMatch News" src=")data:image/png;base64,[A-Za-z0-9+/=]+(")',r'\1assets/logo-drivmatch-news.png\2',html,count=1)
html=re.sub(r'<script>.*?</script>','<script src="data/bootstrap.js"></script>\n<script src="assets/app.js" defer></script>',html,flags=re.S)
html=html.replace('PRÉVIA DE DESIGN • Manchetes demonstrativas, sem publicação jornalística ou cotações ao vivo', 'DRIVMATCH NEWS • Ambiente de testes — conteúdos demonstrativos identificados')
# preserve v18 approved institutional footer only
html=html.replace('Protótipo editorial navegável — não constitui publicação de notícias reais nem sistema de alertas ativos.', 'Cobertura editorial independente • Notícias e indicadores identificados por fonte e data.')
# remove v18 pseudo market simulation: fetched market data + optional clearly labeled test mode via ?demo=1
html=re.sub(r'<div class="simulation">.*?</div>\s*<p class="micro" id="market-note">.*?</p>', '<p class="micro" id="market-note" role="status"></p>',html,flags=re.S,count=1)
html=html.replace('<div id="market"></div>','<div id="market"></div>')
# consent-based ad area: disabled entirely unless approved creative provided
html=html.replace('</section>\n<section id="noticias"', '</section>\n<div id="ad-slot" aria-label="Publicidade" hidden></div>\n<section id="noticias"',1)
# Article modal disclaimer can reflect actual content type and source; translations on own news summary only
html=html.replace('<p class="disclosure">CONTEÚDO DEMONSTRATIVO: este texto descreve como uma notícia seria exibida, não relata um acontecimento verificado. Na produção, incluir fonte original, URL, data da publicação e última verificação.</p>', '<p class="disclosure" id="article-disclosure"></p><p id="article-source"></p>')
html=html.replace('EDIÇÃO DIGITAL · 08/10/2026', 'EDIÇÃO DIGITAL · <span id="edition-date">—</span>')
html=html.replace('<link rel="', '<link rel="')
html=html.replace('</style>', '''\n/* Runtime: keep the approved v18 geometry while adding status indicators */
.market-up{display:block;background:#093e32;color:#1ad87d;border-radius:4px;padding:3px 6px;font-size:10px;margin-top:4px}
.market-down{display:block;background:#4d1f2b;color:#ff717a;border-radius:4px;padding:3px 6px;font-size:10px;margin-top:4px}
.market-flat{display:block;color:#b4c6d7;border-radius:4px;font-size:10px;margin-top:4px}
.market-asof{display:block;font-size:9px;color:#8ca5bc;white-space:normal;max-width:138px}
.origin-pill{font-size:10px;color:#5d6d7b}
.demo-ribbon{display:inline-block;font-size:10px;font-weight:bold;color:#854d10;background:#fff1cf;padding:2px 6px;border-radius:2px}
#ad-slot{background:#fff;border:1px solid var(--line);padding:14px;margin:16px 0;text-align:center}
#ad-slot .ad-label{display:block;color:#697686;letter-spacing:.9px;font-size:10px;font-weight:bold}
#ad-slot a{display:inline-block;color:#0773ba;font-weight:bold;margin:5px;text-decoration:underline}
#article-source a{color:#0879be;text-decoration:underline}
.modalbody p#modalbodytext{white-space:pre-line;line-height:1.7}
.article-language-buttons{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
article[role=button]{outline-offset:2px}
.brand img{max-width:min(375px,100%)}
</style>''',1)
(r/'site/index.html').write_text(html,encoding='utf-8')
print('prepared',r/'site/index.html',len(html))
