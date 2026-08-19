import sys
import json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from collectors.news import get_latest_news

def test_unified_news_schema():
    print("Testing unified collectors/news.py schema output...\n")
    news_list = get_latest_news()
    print(f"Total Unified Disruption Articles: {len(news_list)}")

    if news_list:
        print("\nSample Standardized Article:")
        print(json.dumps(news_list[0], indent=2))
        
        # Verify schema elements
        sample = news_list[0]
        assert "title" in sample
        assert "description" in sample
        assert "source" in sample
        assert "url" in sample
        assert "published_at" in sample
        assert "category" in sample
        assert "severity" in sample
        assert sample["category"] in ["weather", "labor", "port", "shipping"]
        assert sample["severity"] in ["low", "medium", "high", "critical"]

    assert len(news_list) > 0, "No articles aggregated"

if __name__ == "__main__":
    test_unified_news_schema()
    print("\nUnified News collector test PASSED successfully!")
