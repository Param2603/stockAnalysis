import csv
import requests

OPTION_SYMBOLS = {"NIFTY": "^NSEI", "BANKNIFTY": "^NSEBANK"}  # NSE symbol -> Yahoo price ticker
OPTION_SOURCE = "https://www.nseindia.com/option-chain"
NSE_HOME = "https://www.nseindia.com"
OC_PAGE = f"{NSE_HOME}/option-chain"
OC_API = NSE_HOME + "/api/option-chain-indices?symbol={symbol}"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Referer": OC_PAGE,
}


def fetch_nse_chain(symbol):
    s = requests.Session()
    s.headers.update(HEADERS)
    s.get(NSE_HOME, timeout=10)
    s.get(OC_PAGE, timeout=10)
    r = s.get(OC_API.format(symbol=symbol), timeout=10)
    r.raise_for_status()
    j = r.json()
    rows = []
    for item in j["filtered"]["data"]:
        ce = item.get("CE") or {}
        pe = item.get("PE") or {}
        rows.append({
            "strike": float(item["strikePrice"]),
            "ce_oi": int(ce.get("openInterest") or 0),
            "pe_oi": int(pe.get("openInterest") or 0),
            "ce_ltp": ce.get("lastPrice"),
            "pe_ltp": pe.get("lastPrice"),
        })
    if not rows:
        raise ValueError("NSE returned an empty option chain")
    first = j["filtered"]["data"][0]
    return {
        "rows": rows,
        "expiry": first.get("expiryDate"),
        "underlying": j["records"]["underlyingValue"],
    }


def _num(v):
    try:
        return float(v) if v not in (None, "") else None
    except ValueError:
        return None


def load_option_manual(path):
    rows = []
    with path.open(newline="", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            if not r.get("strike"):
                continue
            rows.append({
                "strike": float(r["strike"]),
                "ce_oi": int(float(r.get("ce_oi") or 0)),
                "pe_oi": int(float(r.get("pe_oi") or 0)),
                "ce_ltp": _num(r.get("ce_ltp")),
                "pe_ltp": _num(r.get("pe_ltp")),
            })
    return {"rows": rows, "expiry": None, "underlying": None} if rows else None


def analyse_chain(rows, spot=None, expiry=None):
    rows = sorted(rows, key=lambda r: r["strike"])
    ce_total = sum(r["ce_oi"] for r in rows)
    pe_total = sum(r["pe_oi"] for r in rows)

    def pain(k):
        # Total amount option sellers would owe if the index closes at strike k on expiry
        return sum(max(0, k - r["strike"]) * r["ce_oi"] + max(0, r["strike"] - k) * r["pe_oi"]
                   for r in rows)

    max_pain = min(rows, key=lambda r: pain(r["strike"]))["strike"]
    resistance = max(rows, key=lambda r: r["ce_oi"])["strike"]  # biggest call OI wall
    support = max(rows, key=lambda r: r["pe_oi"])["strike"]     # biggest put OI wall

    near = rows
    if spot:
        filtered = [r for r in rows if abs(r["strike"] - spot) / spot <= 0.05]
        near = filtered if filtered else rows

    return {
        "spot": spot,
        "expiry": expiry,
        "pcr": round(pe_total / ce_total, 2) if ce_total else None,
        "max_pain": max_pain,
        "resistance": resistance,
        "support": support,
        "total_ce_oi": ce_total,
        "total_pe_oi": pe_total,
        "rows": near,
    }