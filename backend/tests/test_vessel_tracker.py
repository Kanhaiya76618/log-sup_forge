"""
tests/test_vessel_tracker.py
End-to-end test of the FlowForge Vessel Tracking Engine pipeline.
Feeds mock AIS vessels through analyze_vessel() and verifies enriched output.
"""
import sys
import json
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from engine.vessel_tracker import analyze_vessel, analyze_fleet

MOCK_VESSELS = [
    {
        "mmsi": "431002930",
        "imo": "9845120",
        "vessel_name": "MV ORION",
        "latitude": 34.215,
        "longitude": 138.840,
        "speed": 14.2,
        "course": 308.5,
        "heading": 310,
        "nav_status": 0,
        "destination": "YOKOHAMA",
        "timestamp": "2026-08-17T07:00:00Z",
    },
    {
        "mmsi": "431094812",
        "imo": "9712034",
        "vessel_name": "EVER LEADER",
        "latitude": 18.210,
        "longitude": 72.100,
        "speed": 18.5,
        "course": 84.2,
        "heading": 85,
        "nav_status": 0,
        "destination": "JNPT",
        "timestamp": "2026-08-17T07:00:00Z",
    },
]


def test_vessel_tracker():
    results = analyze_fleet(MOCK_VESSELS)

    print(f"\nFlowForge Vessel Tracking Engine — {len(results)} vessel(s) analyzed\n")

    for r in results:
        print(f"{'─'*54}")
        print(f"  Vessel:          {r['vessel_name']}  (MMSI: {r['mmsi']})")
        print(f"  Position:        {r['latitude']:.4f}°N, {r['longitude']:.4f}°E")
        print(f"  Speed:           {r['speed']} knots  │  Course: {r['course']}°")
        print(f"  Destination:     {r['destination']}")

        eta = r.get("eta", {})
        print(f"  Distance to port: {eta.get('distance_km')} km")
        print(f"  ETA:             {eta.get('eta_hours')} hrs  (+{eta.get('weather_delay_hours')}h weather delay)")

        w = r.get("weather_now", {})
        print(f"  Weather now:     {w.get('hazard')} │ Wind {w.get('wind_speed')} │ Wave {w.get('wave_height')}m")

        rt = r.get("route", {})
        print(f"  Worst hazard ahead: {rt.get('worst_hazard_ahead')}  │  Cyclone on path: {rt.get('cyclone_on_path')}")

        dec = r.get("ai_decision", {})
        print(f"  Risk Score:      {dec.get('vessel_risk_score')}")
        print(f"  Alert Level:     {dec.get('alert_level')}")
        print(f"  Reroute:         {dec.get('reroute_recommended')} → {dec.get('reroute_suggestion')}")
        print(f"  AI Message:      {dec.get('alert_message')}")
        print()

    # Assertions
    assert len(results) == 2
    for r in results:
        assert "eta" in r
        assert "weather_now" in r
        assert "route" in r
        assert "ai_decision" in r
        assert r["ai_decision"]["alert_level"] in ("LOW", "MODERATE", "HIGH", "CRITICAL")


if __name__ == "__main__":
    test_vessel_tracker()
    print("Vessel Tracker end-to-end test PASSED successfully!")
