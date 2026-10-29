import time
import urllib.parse
from concurrent.futures import ThreadPoolExecutor
import feedparser
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import yfinance as yf

analyzer = SentimentIntensityAnalyzer()

FEEDS = {
    "Indian markets": "https://news.google.com/rss/search?q=Indian+stock+market+NSE+Sensex&hl=en-IN&gl=IN&ceid=IN:en",
    "Commodities": "https://news.google.com/rss/search?q=gold+silver+crude+oil+prices&hl=en-IN&gl=IN&ceid=IN:en",
    "Crypto": "https://news.google.com/rss/search?q=bitcoin+ethereum+crypto+market&hl=en-US&gl=US&ceid=US:en",
    "Global markets": "https://news.google.com/rss/search?q=global+stock+markets+Fed+Wall+Street&hl=en-US&gl=US&ceid=US:en",
}

_news_cache = {}
NEWS_TTL = 300  # 5 minutes


def fetch_news(per_feed=10):
    items = []
    for source, url in FEEDS.items():
        try:
            feed = feedparser.parse(url)
            for e in feed.entries[:per_feed]:
                title = e.title
                extracted_source = source
                if " - " in title:
                    parts = title.rsplit(" - ", 1)
                    title = parts[0].strip()
                    extracted_source = parts[1].strip() or source

                score = analyzer.polarity_scores(title)["compound"]
                label = "Bullish" if score >= 0.05 else "Bearish" if score <= -0.05 else "Neutral"
                items.append({
                    "title": title,
                    "link": e.link,
                    "published": e.get("published", ""),
                    "source": extracted_source,
                    "category": source,
                    "sentiment": label,
                    "score": round(score, 2),
                })
        except Exception:
            continue
    return items


def fetch_ticker_news(ticker: str, name: str = None, limit: int = 10):
    """
    Fetch real-time news specifically for any stock or crypto ticker.
    Uses Google News RSS + sentiment analysis, with fallback to Yahoo Finance news.
    """
    cache_key = f"news:{ticker.upper()}"
    now = time.time()
    if cache_key in _news_cache and (now - _news_cache[cache_key][0]) < NEWS_TTL:
        return _news_cache[cache_key][1]

    clean_ticker = ticker.upper().strip()
    is_crypto = "-USD" in clean_ticker or clean_ticker.startswith("CRYPTO:")
    is_indian = clean_ticker.endswith(".NS") or clean_ticker.endswith(".BO")

    display_name = name or clean_ticker
    # Remove ticker suffix for query readability
    short_ticker = clean_ticker.replace("-USD", "").replace(".NS", "").replace(".BO", "")

    # Construct targeted search query
    if is_crypto:
        query = f'"{display_name}" OR "{short_ticker}" cryptocurrency OR crypto'
        hl, gl, ceid = "en-US", "US", "US:en"
    elif is_indian:
        query = f'"{display_name}" OR "{short_ticker}" stock NSE OR BSE India'
        hl, gl, ceid = "en-IN", "IN", "IN:en"
    else:
        query = f'"{display_name}" OR "{short_ticker}" stock shares'
        hl, gl, ceid = "en-US", "US", "US:en"

    items = []
    seen_titles = set()

    # 1. Try Google News RSS
    try:
        encoded_query = urllib.parse.quote(query)
        rss_url = f"https://news.google.com/rss/search?q={encoded_query}&hl={hl}&gl={gl}&ceid={ceid}"
        feed = feedparser.parse(rss_url)
        for e in feed.entries[:limit]:
            raw_title = e.title or ""
            title = raw_title
            source = "Market Wire"
            if " - " in raw_title:
                parts = raw_title.rsplit(" - ", 1)
                title = parts[0].strip()
                source = parts[1].strip()

            norm_title = title.lower()[:60]
            if norm_title in seen_titles:
                continue
            seen_titles.add(norm_title)

            score = analyzer.polarity_scores(title)["compound"]
            label = "Bullish" if score >= 0.05 else "Bearish" if score <= -0.05 else "Neutral"

            items.append({
                "title": title,
                "link": getattr(e, "link", "#"),
                "published": getattr(e, "published", "Recently"),
                "source": source,
                "sentiment": label,
                "score": round(score, 2),
            })
    except Exception:
        pass

    # 2. If few items found, supplement with Yahoo Finance news
    if len(items) < 4:
        try:
            t = yf.Ticker(clean_ticker)
            yf_news = getattr(t, "news", []) or []
            for item in yf_news[:limit]:
                content = item.get("content", item)
                title = content.get("title", "")
                if not title:
                    continue
                norm_title = title.lower()[:60]
                if norm_title in seen_titles:
                    continue
                seen_titles.add(norm_title)

                provider = content.get("provider", {})
                source = provider.get("displayName") if isinstance(provider, dict) else "Yahoo Finance"
                click_url = content.get("canonicalUrl", {}).get("url") if isinstance(content.get("canonicalUrl"), dict) else content.get("url", "#")
                pub_date = content.get("pubDate", "Recently")

                score = analyzer.polarity_scores(title)["compound"]
                label = "Bullish" if score >= 0.05 else "Bearish" if score <= -0.05 else "Neutral"

                items.append({
                    "title": title,
                    "link": click_url or "#",
                    "published": pub_date,
                    "source": source or "Yahoo Finance",
                    "sentiment": label,
                    "score": round(score, 2),
                })
                if len(items) >= limit:
                    break
        except Exception:
            pass

    _news_cache[cache_key] = (now, items)
    return items