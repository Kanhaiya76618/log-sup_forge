import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from collectors.india_news import get_india_news

def test_india_news_only():
    print("Testing india_news.py collector...\n")
    articles = get_india_news()
    print(f"Total India Port Disruption Articles Fetched: {len(articles)}")
    for i, a in enumerate(articles[:5], 1):
        print(f"\n[{i}] {a['title']}")
        print(f"    Source:    {a['source']}")
        print(f"    Published: {a['published']}")
        print(f"    Sentiment: {a['sentiment']}")
        print(f"    URL:       {a['url']}")
    assert len(articles) > 0, "Failed to fetch India disruption articles"

if __name__ == "__main__":
    test_india_news_only()
    print("\nindia_news.py collector test PASSED successfully!")
