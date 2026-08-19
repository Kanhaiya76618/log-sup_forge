import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from collectors.india_ports import get_india_ports_data

def test_india_ports_collector():
    data = get_india_ports_data("JNPT")
    print(f"Fetched {len(data)} normalized vessel schedule records for JNPT:\n")
    for i, item in enumerate(data, 1):
        print(f"── Record {i} ──────────────────────────────")
        print(f"  Port:      {item['port']}")
        print(f"  Vessel:    {item['vessel']}")
        print(f"  IMO:       {item['imo']}")
        print(f"  Arrival:   {item['arrival']}")
        print(f"  Departure: {item['departure']}")
        print(f"  Berth:     {item['berth']}")
        print(f"  Status:    {item['status']}")
        print(f"  Timestamp: {item['timestamp']}")
        print()
    assert len(data) > 0
    assert data[0]["port"] == "JNPT"
    assert "vessel" in data[0]
    assert "berth" in data[0]

if __name__ == "__main__":
    test_india_ports_collector()
    print("India Ports collector test PASSED successfully!")
