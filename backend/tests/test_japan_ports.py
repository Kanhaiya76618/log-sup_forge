import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from collectors.japan_ports import get_japan_navigational_warnings, ports_japan_collector

def test_msil_japan_warnings():
    warnings = get_japan_navigational_warnings()
    print("MSIL Japan Navigational Warnings LayerSelection = 1")
    print(f"Total live warning features fetched: {len(warnings)}")
    if warnings:
        print("Sample Warning Feature:")
        print("  Title:      ", warnings[0]["name"])
        print("  Coordinates:", warnings[0]["latitude"], "°N,", warnings[0]["longitude"], "°E")
        print("  Description:", warnings[0]["description"][:120] + "...")
    assert len(warnings) > 0, "Should fetch live warning features from MSIL layer 1"

if __name__ == "__main__":
    test_msil_japan_warnings()
    print("\nMSIL Japan test PASSED successfully!")
