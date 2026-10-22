from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from analysis import UNIVERSE, fetch_overview, get_analysis, get_fundamentals, screener
from fii_dii import FII_INSTRUCTIONS, FII_SOURCE, fetch_fii_dii_live
from news import fetch_news
from options import OPTION_SOURCE, OPTION_SYMBOLS, analyse_chain, fetch_nse_chain, load_option_manual
from paper import get_price, paper_view, place_order, reset_account
from status import DATA, MANUAL_DIR, load_json_list, resolve

IST = ZoneInfo("Asia/Kolkata")
POLICY_FILE = DATA / "govt_policy.json"
POLICY_INSTRUCTIONS = (
    "Add new budget, RBI, SEBI and PIB decisions to backend/data/govt_policy.json "
    "(date, title, category, sectors, source). Check the links below every week."
)
POLICY_SOURCES = [
    {"name": "Union Budget documents", "url": "https://www.indiabudget.gov.in"},
    {"name": "PIB press releases (government decisions)", "url": "https://pib.gov.in"},
    {"name": "SEBI circulars (F&O rules, margins, lot sizes)", "url": "https://www.sebi.gov.in"},
    {"name": "RBI press releases (interest rates, liquidity)", "url": "https://www.rbi.org.in"},
    {"name": "NSE circulars (contract changes, expiry rules)", "url": "https://www.nseindia.com"},
]

app = FastAPI(title="Market Dashboard")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/market-status")
def market_status():
    now = datetime.now(IST)
    minutes = now.hour * 60 + now.minute
    is_open = now.weekday() < 5 and 555 <= minutes <= 930  # 09:15 to 15:30 IST
    return {
        "time_ist": now.strftime("%d %b %Y, %H:%M:%S IST"),
        "nse_open": is_open,
        "note": "Public holidays are not checked yet.",
    }


@app.get("/api/overview")
def overview():
    return fetch_overview()


@app.get("/api/screener")
def get_screener(market: str = "india"):
    if market not in ("india", "global"):
        raise HTTPException(400, "market must be 'india' or 'global'")
    return screener(market)


@app.get("/api/analyze/{ticker}")
def analyze(ticker: str):
    a = get_analysis(ticker, ticker)
    if not a:
        raise HTTPException(404, "No data for this ticker")
    return {**a, "fundamentals": get_fundamentals(ticker)}


@app.get("/api/fii-dii")
def fii_dii():
    return resolve(
        name="fii_dii",
        source_url=FII_SOURCE,
        instructions=FII_INSTRUCTIONS,
        max_age_hours=24,
        fetch=fetch_fii_dii_live,
        manual_loader=load_json_list,
        manual_path=MANUAL_DIR / "fii_dii.json",
    )


@app.get("/api/options/{symbol}")
def options(symbol: str):
    symbol = symbol.upper()
    if symbol not in OPTION_SYMBOLS:
        raise HTTPException(400, "symbol must be NIFTY or BANKNIFTY")
    res = resolve(
        name=f"option_{symbol}",
        source_url=OPTION_SOURCE,
        instructions=(
            f"Open the NSE option chain page, choose {symbol}, and copy strike, call OI, put OI, "
            f"call LTP and put LTP for each row into backend/data/manual/option_chain_{symbol}.csv. "
            "Header: strike,ce_oi,pe_oi,ce_ltp,pe_ltp. Do not use commas inside numbers. Then refresh."
        ),
        max_age_hours=1,
        fetch=lambda: fetch_nse_chain(symbol),
        manual_loader=load_option_manual,
        manual_path=MANUAL_DIR / f"option_chain_{symbol}.csv",
    )
    if res["data"]:
        raw = res["data"]
        spot = raw.get("underlying") or get_price(OPTION_SYMBOLS[symbol])
        res["data"] = analyse_chain(raw["rows"], spot, raw.get("expiry"))
    return res


@app.get("/api/news")
def news():
    return fetch_news()


@app.get("/api/policy")
def policy():
    entries = load_json_list(POLICY_FILE) if POLICY_FILE.exists() else None
    updated = None
    if not entries:
        status = "manual_update_needed"
    else:
        updated = datetime.fromtimestamp(POLICY_FILE.stat().st_mtime, IST).isoformat()
        age = datetime.now(IST) - datetime.fromisoformat(updated)
        status = "stale" if age > timedelta(days=30) else "manual"
    return {
        "status": status,
        "data": entries,
        "updated_at": updated,
        "source_url": None,
        "instructions": POLICY_INSTRUCTIONS,
        "error": None,
        "links": POLICY_SOURCES,
    }


class Order(BaseModel):
    ticker: str
    side: str  # "BUY" or "SELL"
    qty: int


@app.get("/api/paper")
def paper():
    return paper_view()


@app.post("/api/paper/order")
def paper_order(o: Order):
    try:
        return place_order(o.ticker.strip().upper(), o.side.upper(), o.qty)
    except ValueError as e:
        raise HTTPException(400, str(e))


@app.post("/api/paper/reset")
def paper_reset():
    reset_account()
    return {"ok": True}