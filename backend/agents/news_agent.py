import logging
from typing import Dict, Any, List

logger = logging.getLogger("flowforge.agents.news")

class NewsAgent:
    """Agent monitoring global trade news, strike risks, and geopolitical supply chain events."""

    def __init__(self):
        self.name = "NEWS_AGENT"

    async def analyze_news_feeds(self, articles: List[Dict[str, Any]]) -> Dict[str, Any]:
        high_impact_stories = [
            art for art in articles if art.get("severity") in ["CRITICAL", "HIGH"]
        ]
        avg_sentiment = (
            sum(art.get("sentiment_score", 0.0) for art in articles) / len(articles)
            if articles else 0.0
        )

        return {
            "agent": self.name,
            "processed_articles_count": len(articles),
            "high_impact_alerts": len(high_impact_stories),
            "sentiment_index": round(avg_sentiment, 2),
            "status": "FEEDS_ANALYZED"
        }

news_agent = NewsAgent()
