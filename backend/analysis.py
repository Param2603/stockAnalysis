import json
from pathlib import Path
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
import numpy as np
import pandas as pd
import yfinance as yf

UNIVERSE = {
    "indices": {
        "Nifty 50": "^NSEI", "Sensex": "^BSESN", "Bank Nifty": "^NSEBANK",
        "S&P 500": "^GSPC", "Nasdaq": "^IXIC", "Nikkei 225": "^N225",
        "Hang Seng": "^HSI", "FTSE 100": "^FTSE", "USD/INR": "INR=X",
    },
    "commodities": {
        "Gold": "GC=F", "Silver": "SI=F", "WTI Crude": "CL=F",
        "Brent Crude": "BZ=F", "Natural Gas": "NG=F", "Copper": "HG=F",
    },
    "crypto": {
        "Bitcoin": "BTC-USD", "Ethereum": "ETH-USD", "Solana": "SOL-USD",
        "BNB": "BNB-USD", "XRP": "XRP-USD", "Cardano": "ADA-USD",
        "Dogecoin": "DOGE-USD", "Avalanche": "AVAX-USD", "Shiba Inu": "SHIB-USD",
        "Sui": "SUI-USD", "Pepe": "PEPE-USD", "Chainlink": "LINK-USD",
        "Polkadot": "DOT-USD", "NEAR Protocol": "NEAR-USD", "Aptos": "APT-USD",
        "Litecoin": "LTC-USD", "Toncoin": "TON-USD", "Uniswap": "UNI-USD",
        "Polygon": "POL-USD", "Render": "RENDER-USD", "Bittensor": "TAO-USD",
        "Injective": "INJ-USD", "Aave": "AAVE-USD", "Monero": "XMR-USD",
    },
    "indian_stocks": {
        "Reliance": "RELIANCE.NS", "TCS": "TCS.NS", "HDFC Bank": "HDFCBANK.NS",
        "Infosys": "INFY.NS", "ICICI Bank": "ICICIBANK.NS", "SBI": "SBIN.NS",
        "Bharti Airtel": "BHARTIARTL.NS", "ITC": "ITC.NS", "L&T": "LT.NS",
        "Kotak Bank": "KOTAKBANK.NS", "Tata Motors": "TATAMOTORS.NS", "Axis Bank": "AXISBANK.NS",
        "Sun Pharma": "SUNPHARMA.NS", "Titan": "TITAN.NS", "Maruti": "MARUTI.NS",
        "Bajaj Finance": "BAJFINANCE.NS", "Adani Ent": "ADANIENT.NS", "NTPC": "NTPC.NS",
        "Tata Steel": "TATASTEEL.NS", "Power Grid": "POWERGRID.NS", "Zomato": "ZOMATO.NS",
        "Hindustan Unilever": "HINDUNILVR.NS", "Trent": "TRENT.NS", "HAL": "HAL.NS",
    },
    "global_stocks": {
        "Apple": "AAPL", "Microsoft": "MSFT", "Nvidia": "NVDA", "Alphabet": "GOOGL",
        "Amazon": "AMZN", "Meta": "META", "Tesla": "TSLA", "Berkshire": "BRK-B",
        "TSMC": "TSM", "Broadcom": "AVGO", "Eli Lilly": "LLY", "JPMorgan": "JPM",
        "AMD": "AMD", "Netflix": "NFLX", "Palantir": "PLTR", "Coinbase": "COIN",
        "Toyota (Japan)": "7203.T", "Tencent (Hong Kong)": "0700.HK",
        "SAP (Germany)": "SAP.DE", "ASML": "ASML",
    },
}

DATA_DIR = Path(__file__).parent / "data"
CACHE_DIR = DATA_DIR / "cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

_cache = {}
TTL = 300  # 5 minutes


def _f(x):
    if x is None or pd.isna(x):
        return None
    return round(float(x), 2)


def fetch_history(ticker):
    try:
        df = yf.download(ticker, period="2y", interval="1d", auto_adjust=True, progress=False)
        if df is None or df.empty:
            return None
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)
        return df.dropna(subset=["Close"])
    except Exception:
        return None


def add_indicators(df):
    close = df["Close"]
    df["SMA20"] = close.rolling(20, min_periods=5).mean()
    df["SMA50"] = close.rolling(50, min_periods=10).mean()
    df["SMA200"] = close.rolling(200, min_periods=20).mean()

    delta = close.diff()
    gain = delta.clip(lower=0).ewm(alpha=1 / 14, min_periods=5, adjust=False).mean()
    loss = (-delta.clip(upper=0)).ewm(alpha=1 / 14, min_periods=5, adjust=False).mean()
    rs = gain / loss.replace(0, np.nan)
    df["RSI"] = 100 - 100 / (1 + rs)

    macd = close.ewm(span=12, adjust=False).mean() - close.ewm(span=26, adjust=False).mean()
    df["MACD"] = macd
    df["MACD_signal"] = macd.ewm(span=9, adjust=False).mean()

    df["Return"] = close.pct_change()
    return df


def build_analysis(ticker, name):
    df = fetch_history(ticker)
    if df is None or len(df) < 15:
        return None
    df = add_indicators(df)

    close = df["Close"]
    last = float(close.iloc[-1])
    last_row = df.iloc[-1]

    def ret(n):
        return _f((last / float(close.iloc[-n - 1]) - 1) * 100) if len(close) > n else None

    sma50, sma200, rsi = last_row.get("SMA50"), last_row.get("SMA200"), last_row.get("RSI")
    above_sma50 = bool(pd.notna(sma50) and last > sma50)
    sma50_above_sma200 = bool(pd.notna(sma50) and pd.notna(sma200) and sma50 > sma200)

    signals = []
    if above_sma50:
        signals.append("Price is above its 50-day average (short-term momentum)")
    elif pd.notna(sma50):
        signals.append("Price is below its 50-day average")

    if pd.notna(sma50) and pd.notna(sma200):
        signals.append("50-day average is above 200-day average (golden cross / long-term uptrend)"
                       if sma50_above_sma200 else
                       "50-day average is below 200-day average (long-term downtrend)")

    if pd.notna(rsi):
        if rsi > 70:
            signals.append(f"RSI {round(rsi, 1)}: Overbought zone, possible cooling off")
        elif rsi < 30:
            signals.append(f"RSI {round(rsi, 1)}: Oversold territory, potential technical bounce")
        else:
            signals.append(f"RSI {round(rsi, 1)}: Healthy neutral momentum")

    if pd.notna(last_row.get("MACD")) and pd.notna(last_row.get("MACD_signal")):
        signals.append("MACD is above signal line (bullish divergence)"
                       if last_row["MACD"] > last_row["MACD_signal"] else
                       "MACD is below signal line (bearish consolidation)")

    # 52-week High/Low and Day High/Low
    high_52w = _f(close.tail(252).max()) if len(close) > 0 else _f(last)
    low_52w = _f(close.tail(252).min()) if len(close) > 0 else _f(last)

    day_high = _f(float(df["High"].iloc[-1])) if "High" in df.columns and pd.notna(df["High"].iloc[-1]) else _f(last)
    day_low = _f(float(df["Low"].iloc[-1])) if "Low" in df.columns and pd.notna(df["Low"].iloc[-1]) else _f(last)
    volume = int(df["Volume"].iloc[-1]) if "Volume" in df.columns and pd.notna(df["Volume"].iloc[-1]) else None

    # Currency and asset classification
    is_inr = ticker.endswith(".NS") or ticker.endswith(".BO") or ticker in ("^NSEI", "^BSESN", "^NSEBANK", "INR=X")
    currency = "₹" if is_inr else "$"
    asset_type = "crypto" if "-USD" in ticker else ("index" if ticker.startswith("^") else "stock")

    # Resolve display name
    clean_name = name
    if not clean_name or clean_name == ticker:
        clean_name = ticker.replace("-USD", "").replace(".NS", "").replace(".BO", "")

    summary = {
        "name": clean_name,
        "ticker": ticker,
        "price": _f(last),
        "currency": currency,
        "asset_type": asset_type,
        "ret_1d": ret(1),
        "ret_1w": ret(5),
        "ret_1m": ret(21),
        "ret_3m": ret(63),
        "ret_1y": ret(252),
        "high_52w": high_52w,
        "low_52w": low_52w,
        "day_high": day_high,
        "day_low": day_low,
        "volume": volume,
        "volatility": _f(df["Return"].std() * np.sqrt(252) * 100),
        "max_drawdown": _f(((close / close.cummax()) - 1).min() * 100),
        "rsi": _f(rsi),
        "above_sma50": above_sma50,
        "sma50_above_sma200": sma50_above_sma200,
        "signals": signals,
    }

    history = [
        {"date": d.strftime("%Y-%m-%d"), "close": _f(r["Close"]), "sma50": _f(r.get("SMA50")),
         "sma200": _f(r.get("SMA200")), "rsi": _f(r.get("RSI"))}
        for d, r in df.tail(250).iterrows()
    ]
    return {"summary": summary, "history": history}


def get_analysis(ticker, name):
    key = f"analysis:{ticker}"
    sanitized = ticker.replace('^', '').replace('=', '').replace('-', '_').replace('.', '_')
    disk_cache = CACHE_DIR / f"{sanitized}.json"
    now = time.time()

    if key in _cache and (now - _cache[key][0]) < TTL:
        return _cache[key][1]

    # Try live fetch
    try:
        result = build_analysis(ticker, name)
        if result:
            _cache[key] = (now, result)
            try:
                disk_cache.write_text(json.dumps({"updated_at": now, "data": result}), encoding="utf-8")
            except Exception:
                pass
            return result
    except Exception:
        pass

    # Fallback to disk cache if available
    if disk_cache.exists():
        try:
            cached = json.loads(disk_cache.read_text(encoding="utf-8"))
            _cache[key] = (cached.get("updated_at", now), cached.get("data"))
            return cached.get("data")
        except Exception:
            pass

    return _cache.get(key, (None, None))[1]


def get_fundamentals(ticker):
    key = f"fund:{ticker}"
    now = time.time()
    if key in _cache and (now - _cache[key][0]) < (TTL * 12):
        return _cache[key][1]

    try:
        info = yf.Ticker(ticker).info or {}
        roe = info.get("returnOnEquity")
        result = {
            "name": info.get("longName") or info.get("shortName") or ticker,
            "pe": _f(info.get("trailingPE")),
            "pb": _f(info.get("priceToBook")),
            "roe": _f(roe * 100) if roe is not None else None,
            "debt_to_equity": _f(info.get("debtToEquity")),
            "market_cap": info.get("marketCap"),
            "sector": info.get("sector") or ("Cryptocurrency" if "-USD" in ticker else None),
            "industry": info.get("industry"),
            "fifty_two_week_high": _f(info.get("fiftyTwoWeekHigh")),
            "fifty_two_week_low": _f(info.get("fiftyTwoWeekLow")),
            "day_high": _f(info.get("dayHigh")),
            "day_low": _f(info.get("dayLow")),
            "volume_24h": info.get("volume24Hr") or info.get("regularMarketVolume"),
            "circulating_supply": info.get("circulatingSupply"),
            "currency": info.get("currency"),
        }
    except Exception:
        result = {}

    _cache[key] = (now, result)
    return result


def score_stock(s, f):
    """Rule-based screening score, out of 100."""
    pts, reasons = 0, []
    if s.get("above_sma50") and s.get("sma50_above_sma200"):
        pts += 2
        reasons.append("Long-term uptrend")
    if (s.get("ret_1m") or 0) > 0:
        pts += 1
        reasons.append("Up over 1 month")
    if (s.get("ret_1y") or 0) > 0:
        pts += 1
        reasons.append("Up over 1 year")
    if s.get("rsi") and 40 <= s["rsi"] <= 65:
        pts += 1
        reasons.append("RSI in a neutral healthy range")
    if s.get("rsi") and s["rsi"] > 75:
        pts -= 1
        reasons.append("RSI high: overbought")
    pe = f.get("pe")
    if pe and 0 < pe <= 30:
        pts += 1
        reasons.append(f"P/E {pe} is reasonable")
    elif pe and pe > 60:
        pts -= 1
        reasons.append(f"P/E {pe} is premium")
    roe = f.get("roe")
    if roe and roe >= 15:
        pts += 1
        reasons.append(f"ROE {roe}%")
    de = f.get("debt_to_equity")
    if de is not None and de < 100:
        pts += 1
        reasons.append("Debt-to-equity under 1")
    if s.get("volatility") and s["volatility"] > 45:
        pts -= 1
        reasons.append("High volatility")
    return {"score": round(max(pts, 0) / 8 * 100), "reasons": reasons}


def _fetch_stock_screen(item):
    name, ticker = item
    a = get_analysis(ticker, name)
    if not a:
        return None
    f = get_fundamentals(ticker)
    sc = score_stock(a["summary"], f)
    # Merge real company name if available
    summary = {**a["summary"]}
    if f.get("name") and f["name"] != ticker:
        summary["name"] = f["name"]
    return {**summary, **f, **sc}


def screener(market):
    key = f"{market}_stocks"
    if key not in UNIVERSE:
        return []
    items = list(UNIVERSE[key].items())
    rows = []
    with ThreadPoolExecutor(max_workers=min(len(items), 12)) as executor:
        futures = [executor.submit(_fetch_stock_screen, item) for item in items]
        for f in as_completed(futures):
            res = f.result()
            if res:
                rows.append(res)
    return sorted(rows, key=lambda r: r.get("score", 0), reverse=True)


def fetch_overview():
    result = {}
    for group in ["indices", "commodities", "crypto"]:
        items = list(UNIVERSE[group].items())
        group_rows = []
        with ThreadPoolExecutor(max_workers=min(len(items), 12)) as executor:
            future_to_item = {executor.submit(get_analysis, ticker, name): name for name, ticker in items}
            for fut in as_completed(future_to_item):
                a = fut.result()
                if a and a.get("summary"):
                    group_rows.append(a["summary"])
        # Maintain universe order
        order = list(UNIVERSE[group].keys())
        group_rows.sort(key=lambda r: order.index(r["name"]) if r["name"] in order else 999)
        result[group] = group_rows
    return result