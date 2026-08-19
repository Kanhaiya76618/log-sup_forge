import sys, asyncio, json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from collectors.disasters import disaster_collector

async def test_disasters():
    print("Fetching live disasters (GDACS + USGS)...\n")
    events = await disaster_collector.get_recent_disasters()
    print(f"Total live disaster events: {len(events)}\n")

    print("Sample normalized event:")
    print(json.dumps(events[0], indent=2))
    print()

    print("All events summary:")
    for e in events[:12]:
        print(f"  [{e['source']}] {e['event_type'].upper():<12} | {e['severity']:<8} | {e['location'][:55]}")

    # Schema assertions
    required_keys = {"event_type", "location", "latitude", "longitude", "severity", "start_time", "end_time", "source"}
    for e in events:
        assert required_keys.issubset(e.keys()), f"Missing keys in: {e}"
    
    assert len(events) > 0

if __name__ == "__main__":
    asyncio.run(test_disasters())
    print("\nDisaster collector target schema test PASSED!")
