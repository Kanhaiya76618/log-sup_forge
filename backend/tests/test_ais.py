import sys
import asyncio
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from collectors.ais import get_snapshot


async def main():
    print("Connecting to AISstream.io — collecting 5 vessel snapshots …\n")
    vessels = await get_snapshot(n=5)

    for i, v in enumerate(vessels, 1):
        print(f"── Vessel {i} ──────────────────────────────")
        print(f"  Name:        {v['vessel_name']}")
        print(f"  MMSI:        {v['mmsi']}")
        print(f"  Position:    {v['latitude']:.4f}°N, {v['longitude']:.4f}°E")
        print(f"  Speed:       {v['speed']} knots")
        print(f"  Heading:     {v['heading']}°")
        print(f"  Course:      {v['course']}°")
        print(f"  Destination: {v['destination']}")
        print(f"  Timestamp:   {v['timestamp']}")
        print()


if __name__ == "__main__":
    asyncio.run(main())
