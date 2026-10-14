"""Private, read-only AwesomeAPI credential check; NEVER publishes market quotes.

Runs inside GitHub Actions where AWESOMEAPI_API_KEY is an encrypted secret.
Does not reveal the token, bid/ask, or raw provider response in public logs.
An authenticated, valid response proves access, NOT redistribution rights.
"""
import json
import os
import sys
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ENDPOINT="https://economia.awesomeapi.com.br/json/last/USD-BRL"

def main():
    token=os.getenv("AWESOMEAPI_API_KEY","").strip()
    if not token:
        print("AWESOMEAPI_AUTH_CHECK=FAIL: GitHub secret AWESOMEAPI_API_KEY is empty or unavailable")
        return 1
    req=Request(ENDPOINT, headers={
        "x-api-key":token,
        "Accept":"application/json",
        "User-Agent":"DrivMatchNews-CredentialVerification/1.0",
    })
    try:
        with urlopen(req,timeout=18) as response:
            status=response.status
            payload=response.read(100_000)
    except HTTPError as err:
        # Never print provider response body: it might echo details.
        print("AWESOMEAPI_AUTH_CHECK=FAIL HTTP_STATUS="+str(err.code))
        return 1
    except (URLError,TimeoutError,OSError) as err:
        print("AWESOMEAPI_AUTH_CHECK=FAIL CONNECTION="+type(err).__name__)
        return 1
    if status!=200:
        print("AWESOMEAPI_AUTH_CHECK=FAIL HTTP_STATUS="+str(status))
        return 1
    try:
        row=json.loads(payload)["USDBRL"]
        if row["code"]!="USD" or row["codein"]!="BRL":
            raise ValueError("unexpected currency pair")
        ask=Decimal(str(row["ask"]))
        bid=Decimal(str(row["bid"]))
        if not Decimal("0")<bid<=ask<Decimal("50"):
            raise ValueError("invalid quote range")
        observed=datetime.fromtimestamp(int(row["timestamp"]),timezone.utc)
        if observed>datetime.now(timezone.utc):
            raise ValueError("future quote timestamp")
        age=int((datetime.now(timezone.utc)-observed).total_seconds()/60)
    except (KeyError,IndexError,TypeError,ValueError,InvalidOperation,OverflowError) as err:
        print("AWESOMEAPI_AUTH_CHECK=FAIL PAYLOAD_VALIDATION="+type(err).__name__)
        return 1
    # The timestamp is informational, including nights and public holidays.
    # A stale timestamp at night does not indicate authentication failure.
    print("AWESOMEAPI_AUTH_CHECK=PASS")
    print("INSTRUMENT=USD-BRL")
    print("FEED_AGE_MINUTES="+str(age))
    print("DATA_STATUS="+("RECENT" if age<=5 else "LAST_OBSERVED_NOT_LIVE"))
    print("PUBLIC_REDISTRIBUTION_PERMISSION=NOT_TESTED")
    print("QUOTE_PUBLICATION=NOT_PERFORMED")
    return 0

if __name__=="__main__":
    sys.exit(main())
