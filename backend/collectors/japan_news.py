import requests
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any

try:
    from config import NEWS_API_KEY
except ImportError:
    from backend.config import NEWS_API_KEY

logger = logging.getLogger("flowforge.collectors.japan_news")

URL = "https://newsapi.org/v2/everything"

def _normalize_article(raw: Dict[str, Any]) -> Dict[str, Any]:
    source = raw.get("source", {}).get("name", "Unknown Source")
    title = raw.get("title") or ""
    description = raw.get("description") or ""
    url = raw.get("url", "")
    published = raw.get("publishedAt") or datetime.now(timezone.utc).isoformat()

    # Basic sentiment logic
    text = (title + " " + description).lower()
    neg_keywords = ["strike", "typhoon", "cyclone", "closure", "delay", "disruption",
                    "accident", "disaster", "storm", "flood", "earthquake", "shut", "congestion"]
    pos_keywords = ["expansion", "record", "growth", "improved", "launch", "new terminal"]
    neg_hits = sum(1 for w in neg_keywords if w in text)
    pos_hits = sum(1 for w in pos_keywords if w in text)
    sentiment = round(max(-1.0, min(1.0, (pos_hits - neg_hits) * 0.25)), 2)

    return {
        "title": title,
        "source": source,
        "region": "JAPAN",
        "url": url,
        "summary": description[:200] if description else "",
        "published": published,
        "sentiment": sentiment,
    }

class JapanNewsCollector:
    """Collects Japan-specific maritime and port disruption news using NewsAPI."""

    def __init__(self, api_key: str = None):
        self.api_key = api_key or NEWS_API_KEY

    def _has_valid_key(self) -> bool:
        return bool(self.api_key and "YOUR" not in self.api_key)

    def fetch_news(self) -> List[Dict[str, Any]]:
        if not self._has_valid_key():
            logger.warning("NEWS_API_KEY not set — returning empty Japan news feed.")
            return []
        
        # Combine specific search queries targeting Japan shipping delays/disruptions
        query = "Japan AND (port OR ports OR shipping OR logistics) AND (disruption OR delay OR typhoon OR earthquake OR Yokohama OR Kobe OR Tokyo)"
        
        params = {
            "q": query,
            "language": "en",
            "sortBy": "publishedAt",
            "pageSize": 10
        }
        
        headers = {
            "X-Api-Key": self.api_key
        }
        
        try:
            resp = requests.get(URL, params=params, headers=headers, timeout=20)
            resp.raise_for_status()
            articles = resp.json().get("articles", [])
            logger.info(f"Fetched {len(articles)} Japan news articles from NewsAPI.")
            return [_normalize_article(a) for a in articles if a.get("title")]
        except requests.Timeout:
            raise RuntimeError("NewsAPI Japan request timed out")
        except requests.HTTPError as e:
            raise RuntimeError(f"NewsAPI Japan returned HTTP error: {e}")
        except requests.RequestException as e:
            raise RuntimeError(f"NewsAPI Japan request failed: {e}")
        return []

japan_news_collector = JapanNewsCollector()

def get_japan_news() -> List[Dict[str, Any]]:
    return japan_news_collector.fetch_news()
