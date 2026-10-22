import requests

NSE_HOME = "https://www.nseindia.com"
FII_URL = f"{NSE_HOME}/api/fiidiiTradeReact"
FII_SOURCE = f"{NSE_HOME}/reports/fii-dii"
FII_INSTRUCTIONS = (
    "Open the NSE FII/DII report page and copy the latest rows into data/manual/fii_dii.json "
    "using the same fields: date, category, buyValue, sellValue, netValue (values in ₹ crore). "
    "Then refresh this page."
)
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Referer": FII_SOURCE,
}


def fetch_fii_dii_live():
    s = requests.Session()
    s.headers.update(HEADERS)
    s.get(NSE_HOME, timeout=10)  # NSE sets required cookies on the homepage
    r = s.get(FII_URL, timeout=10)
    r.raise_for_status()
    rows = r.json()
    if not isinstance(rows, list) or not rows:
        raise ValueError("NSE returned no FII/DII rows")
    return rows