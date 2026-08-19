"""
collectors/news.py
Unified News Collector — aggregates articles from India and Japan news feeds
and normalizes them into the target schema for the FlowForge AI agent.
"""
import logging
from typing import List, Dict, Any
from .india_news import get_india_news
from .japan_news import get_japan_news

logger = logging.getLogger("flowforge.collectors.news")

def _determine_category(title: str, summary: str) -> str:
    """Classify the article into category buckets: shipping, port, weather, labor, or general."""
    text = (title + " " + summary).lower()
    if any(w in text for w in ["typhoon", "cyclone", "storm", "weather", "flood", "rain"]):
        return "weather"
    if any(w in text for w in ["strike", "labor", "union", "protest", "dockworker"]):
        return "labor"
    if any(w in text for w in ["port", "terminal", "berth", "yokohama", "jnpt", "kobe", "tokyo", "mundra"]):
        return "port"
    return "shipping"

def _determine_severity(sentiment: float, title: str, summary: str) -> str:
    """Map sentiment and keywords to severity levels: low, medium, high, critical."""
    text = (title + " " + summary).lower()
    if any(w in text for w in ["critical", "closure", "shut", "typhoon", "cyclone", "disaster"]):
        return "critical"
    if sentiment <= -0.50 or any(w in text for w in ["strike", "disruption", "delay", "blocked"]):
        return "high"
    if sentiment < 0.0 or any(w in text for w in ["congestion", "slowdown", "waiting"]):
        return "medium"
    return "low"

class UnifiedNewsCollector:
    """Unified news collector aggregating and normalizing India & Japan disruption news feeds."""

    def get_standardized_news(self) -> List[Dict[str, Any]]:
        """Collect and normalize news into standard target schema."""
        try:
            india_raw = get_india_news()
        except Exception as e:
            logger.warning(f"Failed to fetch India news: {e}")
            india_raw = []

        try:
            japan_raw = get_japan_news()
        except Exception as e:
            logger.warning(f"Failed to fetch Japan news: {e}")
            japan_raw = []

        combined = india_raw + japan_raw
        normalized = []

        for art in combined:
            title = art.get("title", "")
            summary = art.get("summary", "")
            sentiment = art.get("sentiment", 0.0)

            normalized.append({
                "title": title,
                "description": summary,
                "source": art.get("source", "Unknown Source"),
                "url": art.get("url", ""),
                "published_at": art.get("published", ""),
                "category": _determine_category(title, summary),
                "severity": _determine_severity(sentiment, title, summary)
            })

        return normalized

unified_news_collector = UnifiedNewsCollector()

def get_latest_news() -> List[Dict[str, Any]]:
    return unified_news_collector.get_standardized_news()
