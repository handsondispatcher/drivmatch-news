"""Fail-closed geographic and professional editorial gate for external RSS headlines.

The feed's search region is NOT the event's location. This gate only admits
US trucking operations or documented US<->Canada/Mexico road freight crossings.
"""
import re
from urllib.parse import urlparse

US_STATE_RE = re.compile(r'\b(?:' + '|'.join(re.escape(x) for x in sorted([
    'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia',
    'Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland',
    'Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada',
    'New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio',
    'Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee',
    'Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'
],key=len,reverse=True)) + r')\b',re.I)
US_ABBREV = re.compile(r'\b(?:AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b')
US_LOCATION = re.compile(r'\b(?:united states|u\.?s\.?a?\.?|american|fmcsa|usdot|u\.s\. customs|cbp|'
    r'interstate\s*(?:\d+|highway)|i-\d{2,3}|port of entry|border patrol|'
    r'laredo|el paso|nogales|san diego|detroit|buffalo|seattle|los angeles|chicago|'
    r'houston|dallas|atlanta|sacramento|phoenix|denver|memphis|nashville|'
    r'california|texas|florida|new york)\b',re.I)
FOREIGN = re.compile(r'\b(?:tanzania|tanzanian|dar es salaam|kenya|kenyan|uganda|nigeria|'
    r'south africa|zambia|zimbabwe|ghana|ethiopia|vietnam|vietnamese|da nang|hanoi|'
    r'india|indian|pakistan|bangladesh|china|chinese|beijing|japan|japanese|'
    r'korea|indonesia|philippines|malaysia|thailand|australia|new zealand|'
    r'ukraine|russia|germany|france|spain|italy|united kingdom|britain|'
    r'iran|iraq|israel|gaza|brazil|argentina|colombia|peru|europe|africa|asia)\b',re.I)
US_TRUCK_PUBLISHERS = (
    'freightwaves.com','ttnews.com','landline.media','thetrucker.com','overdriveonline.com',
    'fleetowner.com','ccjdigital.com','truckersnews.com','cdllife.com','truckstop.com'
)
CROSS = re.compile(r'\b(?:border|cross.border|crossing|customs|cbp|usmca|nafta|'
    r'port of entry|laredo|el paso|nogales|tijuana|ciudad juarez|nuevo laredo|'
    r'canada[- /]u\.?s\.?|u\.?s\.?[- /]canada|mexico[- /]u\.?s\.?|'
    r'u\.?s\.?[- /]mexico|american border|us border|u\.s\. bound|'
    r'bound for the u\.?s\.?|to the united states|from the united states|'
    r'cross.border freight|cross.border trucking)\b',re.I)
TRUCK = re.compile(r'\b(?:trucks?|truckers?|trucking|truck drivers?|'
    r'box trucks?|cargo vans?|sprinter vans?|hot[ -]?shots?|pickup trucks?|'
    r'flatbeds?|dry vans?|reefers?|trailers?|semi[- ]trucks?|18[- ]wheelers?|'
    r'commercial vehicles?|cdl|fmcsa|dot inspections?|weigh stations?|'
    r'freight|cargo|loads?|load boards?|dispatchers?|freight brokers?|'
    r'double brokering|carriers?|shipping|shippers?|shipments?|'
    r'diesel|fuel prices?|truck stops?|truck parking|hours.of.service|'
    r'elds?|sleeper berths?|roadside inspections?|roadside assistance|'
    r'trailer maintenance|fleet maintenance|truck repair|truck tires?|'
    r'commercial driver|immigrant drivers?|english proficiency|'
    r'border checkpoints?|immigration checkpoints?|'
    r'irps?|iftas?|drayage|intermodal|logistics|supply chain|'
    r'port congestion|container freight)\b',re.I)
CORE_ROAD = re.compile(r'\b(?:trucks?|truckers?|trucking|semi[- ]trucks?|18[- ]wheelers?|'
    r'cdl|fmcsa|usdot|freight brokers?|dispatchers?|box trucks?|cargo vans?|'
    r'sprinter vans?|hot[ -]?shots?|flatbeds?|dry vans?|reefers?|trailers?|'
    r'commercial vehicles?|truck stops?|truck parking|truckload|drayage|'
    r'haulage|haulers?|carriers?|tractor[- ]trailers?|weigh stations?|'
    r'elds?|sleeper berths?|hours.of.service|immigrant drivers?|'
    r'english proficiency|roadside inspections?|truck repair|truck tires?)\b',re.I)
CONSUMER_FUEL = re.compile(r'\b(?:diesel|fuel prices?|gas prices?)\b',re.I)
NON_ROAD_FREIGHT = re.compile(r'\b(?:ocean freight|air freight|air cargo|'
    r'rail freight|railcar|trans.pacific|container ship|vessel|'
    r'maritime|natural gas shipments|lng shipments)\b',re.I)
WEATHER = re.compile(r'\b(?:hurricane|tropical storm|blizzard|snowstorm|'
    r'winter storm|ice storm|flood(?:ing|s)?|wildfire|tornado)\b',re.I)
ROAD_IMPACT = re.compile(r'\b(?:road|highway|interstate|i-\d+|closure|'
    r'evacuation|port|freight|shipping|trucking|truck|transport|'
    r'chain restrictions?|travel ban|roadwork|traffic|flood warning)\b',re.I)
OFF_TOPIC = re.compile(r'\b(?:poverty|youth|celebrity|streaming|episode|'
    r'how to watch|sports betting|fashion|concert|building permits|'
    r'obituaries|entertainment|soccer|cricket|ocean freight|air freight|air cargo)\b',re.I)


def eligible(item):
    """Return true only if title + source substantiate the permitted corridor."""
    title=str(item.get('title') or '').strip()
    if not title:return False
    region=str(item.get('region') or '').upper()
    if region not in ('US','USA','CA','CAN','MX','MEX'):return False
    hostname=(urlparse(str(item.get('source_url') or '')).hostname or '').lower().removeprefix('www.')
    if not hostname:return False
    # Brazilian reader-access gate: this publisher currently blocks Brazil.
    if hostname=='thetrucker.com' or hostname.endswith('.thetrucker.com'):return False
    has_us=bool(US_LOCATION.search(title) or US_STATE_RE.search(title) or US_ABBREV.search(title))
    has_cross=bool(CROSS.search(title))
    core=bool(CORE_ROAD.search(title))
    trade_publisher=any(hostname==d or hostname.endswith('.'+d) for d in US_TRUCK_PUBLISHERS)
    # Foreign nationalities can be relevant to US immigrant/CDL driver rules;
    # an accident or local transport event overseas is not.
    if FOREIGN.search(title) and not (has_us and core and re.search(r'\b(?:immigran|immigration|foreign.born|english proficiency|cdl|fmcsa)\w*\b',title,re.I)):
        return False
    if re.search(r'\bfood trucks?\b',title,re.I) and not re.search(r'\b(?:freight|cargo|trucking|cdl)\b',title,re.I):
        return False
    if NON_ROAD_FREIGHT.search(title) and not core:return False
    if CONSUMER_FUEL.search(title) and not (core or trade_publisher):return False
    if OFF_TOPIC.search(title) and not core:return False
    is_ca_mx=region in ('CA','CAN','MX','MEX')
    canadian_domain=hostname.endswith('.ca') or hostname.endswith('.mx') or hostname.endswith('.com.mx')
    # US/Canada and US/Mexico: domestic Canadian/Mexican coverage is NOT allowed.
    if is_ca_mx or canadian_domain:
        if not (has_us and has_cross):return False
    elif not has_us:
        # Search-feed geography is a query setting, not evidence of article geography.
        if not trade_publisher:
            return False
    # Weather must have an explicit US route impact, or originate at NHC (US storms).
    if item.get('category')=='Clima':
        return bool((WEATHER.search(title) and (ROAD_IMPACT.search(title) or
            (hostname.endswith('noaa.gov') and has_us))) or (TRUCK.search(title) and ROAD_IMPACT.search(title)))
    return bool((TRUCK.search(title) and (core or trade_publisher or has_us)) or (has_cross and has_us and core))
