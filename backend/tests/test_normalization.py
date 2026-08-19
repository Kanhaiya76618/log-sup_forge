import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from processors.normalizer import normalizer

def test_normalization_mapping():
    print("Testing Normalizer on different API structures...\n")

    # API Structure A
    api_a = {
        "lat": 13.08,
        "lon": 80.29,
        "sog": 8.2,
        "imo": "9845120",
        "timestamp": "2026-08-17T10:30:00Z"
    }

    # API Structure B
    api_b = {
        "latitude": 13.08,
        "longitude": 80.29,
        "speed": 8.2,
        "mmsi": "431002930",
        "timestamp": "2026-08-17T10:30:00Z"
    }

    norm_a = normalizer.normalize_vessel_telemetry(api_a, source="AIS_A")
    norm_b = normalizer.normalize_vessel_telemetry(api_b, source="AIS_B")

    print("Normalized A:")
    print(norm_a)
    print("\nNormalized B:")
    print(norm_b)

    # Check key mappings
    for norm in [norm_a, norm_b]:
        assert norm["entity_type"] == "vessel"
        assert norm["latitude"] == 13.08
        assert norm["longitude"] == 80.29
        assert norm["speed_knots"] == 8.2
        assert norm["timestamp"] == "2026-08-17T10:30:00Z"
    
    assert norm_a["vessel_id"] == "IMO9845120"
    assert norm_b["vessel_id"] == "431002930"

if __name__ == "__main__":
    test_normalization_mapping()
    print("\nStep 4 Normalizer test PASSED successfully!")
