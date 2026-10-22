import feedparser
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

analyzer = SentimentIntensityAnalyzer()

FEEDS = {
    "Indian markets": "https://news.google.com/rss/search?q=Indian+stock+market+NSE+Sensex&hl=en-IN&gl=IN&ceid=IN:en",
    "Commodities": "https://news.google.com/rss/search?q=gold+silver+crude+oil+prices&hl=en-IN&gl=IN&ceid=IN:en",
    "Crypto": "https://news.google.com/rss/search?q=bitcoin+ethereum+crypto+market&hl=en-US&gl=US&ceid=US:en",
    "Global markets": "https://news.google.com/rss/search?q=global+stock+markets+Fed+Wall+Street&hl=en-US&gl=US&ceid=US:en",
}


def fetch_news(per_feed=10):
    items = []
    for source, url in FEEDS.items():
        feed = feedparser.parse(url)
        for e in feed.entries[:per_feed]:
            score = analyzer.polarity_scores(e.title)["compound"]
            label = "Positive" if score >= 0.05 else "Negative" if score <= -0.05 else "Neutral"
            items.append({
                "title": e.title, "link": e.link, "published": e.get("published", ""),
                "source": source, "sentiment": label, "score": round(score, 2),
            })
    return items