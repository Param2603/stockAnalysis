import json
import time
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import yfinance as yf

IST = ZoneInfo("Asia/Kolkata")
FILE = Path(__file__).parent / "data" / "paper_portfolio.json"
START_CASH = 1_000_000.0  # virtual ₹10,00,000
_prices = {}


def get_price(ticker):
    hit = _prices.get(ticker)
    if hit and time.time() - hit[0] < 60:
        return hit[1]
    price = None
    try:
        t = yf.Ticker(ticker)
        try:
            price = float(t.fast_info["lastPrice"])
        except Exception:
            h = t.history(period="5d")
            if not h.empty:
                price = float(h["Close"].iloc[-1])
    except Exception:
        price = None
    _prices[ticker] = (time.time(), price)
    return price


def _new():
    return {"cash": START_CASH, "positions": {}, "trades": [],
            "created": datetime.now(IST).isoformat()}


def _save(p):
    FILE.parent.mkdir(parents=True, exist_ok=True)
    FILE.write_text(json.dumps(p, indent=2), encoding="utf-8")


def _load():
    if FILE.exists():
        return json.loads(FILE.read_text(encoding="utf-8"))
    p = _new()
    _save(p)
    return p


def reset_account():
    _save(_new())


def place_order(ticker, side, qty):
    if not (ticker.endswith(".NS") or ticker.endswith(".BO")):
        raise ValueError("Paper trading supports Indian stocks only (ticker ending .NS or .BO), e.g. RELIANCE.NS")
    if side not in ("BUY", "SELL"):
        raise ValueError("side must be BUY or SELL")
    if qty <= 0:
        raise ValueError("Quantity must be at least 1")

    price = get_price(ticker)
    if not price:
        raise ValueError(f"Could not get a price for {ticker} right now. Try again shortly.")

    p = _load()
    pos = p["positions"].get(ticker)
    realized = 0.0

    if side == "BUY":
        cost = qty * price
        if cost > p["cash"]:
            raise ValueError(f"Not enough cash. Need ₹{cost:,.2f}, have ₹{p['cash']:,.2f}")
        old_qty = pos["qty"] if pos else 0
        old_avg = pos["avg_price"] if pos else 0.0
        new_qty = old_qty + qty
        p["positions"][ticker] = {
            "qty": new_qty,
            "avg_price": round((old_qty * old_avg + cost) / new_qty, 2),
        }
        p["cash"] -= cost
    else:
        held = pos["qty"] if pos else 0
        if qty > held:
            raise ValueError(f"You hold {held} shares of {ticker}, so you cannot sell {qty}")
        realized = qty * (price - pos["avg_price"])
        p["cash"] += qty * price
        left = held - qty
        if left:
            pos["qty"] = left
        else:
            del p["positions"][ticker]

    p["cash"] = round(p["cash"], 2)
    p["trades"].append({
        "time": datetime.now(IST).strftime("%d %b %Y, %H:%M IST"),
        "ticker": ticker, "side": side, "qty": qty,
        "price": round(price, 2), "realized_pnl": round(realized, 2),
    })
    _save(p)
    return {"ok": True, "price": round(price, 2), "realized_pnl": round(realized, 2)}


def paper_view():
    p = _load()
    rows, mv_total = [], 0.0
    for t, pos in p["positions"].items():
        price = get_price(t) or pos["avg_price"]
        value = pos["qty"] * price
        cost = pos["qty"] * pos["avg_price"]
        mv_total += value
        rows.append({
            "ticker": t, "qty": pos["qty"], "avg_price": pos["avg_price"],
            "price": round(price, 2), "value": round(value, 2),
            "unrealized_pnl": round(value - cost, 2),
            "unrealized_pct": round((value / cost - 1) * 100, 2) if cost else 0,
        })
    equity = p["cash"] + mv_total
    return {
        "start_cash": START_CASH,
        "cash": round(p["cash"], 2),
        "equity": round(equity, 2),
        "return_pct": round((equity / START_CASH - 1) * 100, 2),
        "positions": rows,
        "trades": p["trades"][-20:][::-1],
    }