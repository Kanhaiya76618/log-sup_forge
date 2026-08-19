import sys
import json
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from collectors.japan_port import get_japan_port_metadata
from collectors.japan_safety import get_japan_safety_information
from collectors.japan_navigation import get_japan_navigational_warnings
from collectors.weather import get_weather
from engine.flowforge_ai import flowforge_ai_engine

def test_japan_full_pipeline():
    ports = get_japan_port_metadata()
    safety = get_japan_safety_information()
    warnings = get_japan_navigational_warnings()
    weather = get_weather(35.4437, 139.6380) # Yokohama

    mock_ais_vessels = [
        {
            "mmsi": "431002930",
            "vessel_name": "MV ORION",
            "latitude": 34.215,
            "longitude": 138.840,
            "speed": 14.2,
            "heading": 310,
            "destination": "YOKOHAMA"
        }
    ]

    decisions = flowforge_ai_engine.evaluate_decisions(
        port_data=ports,
        safety_data=safety,
        navigation_data=warnings,
        ais_vessels=mock_ais_vessels,
        weather_data=weather
    )

    print("── FLOWFORGE JAPAN PIPELINE VERIFICATION ──────────────")
    print(f"MSIL Port Metadata Count:      {len(ports)}")
    print(f"MSIL Safety Links Count:       {len(safety)}")
    print(f"MSIL Navigational Warnings:    {len(warnings)}")
    print(f"Live Weather Hazard Level:     {weather['hazard']}")
    print()
    print("── AI DECISION ENGINE OUTPUT ─────────────────────────")
    print(json.dumps(decisions, indent=2))
    print()

    assert len(ports) > 0
    assert len(warnings) > 0
    assert "risk_scores" in decisions
    assert "ai_decisions" in decisions

if __name__ == "__main__":
    test_japan_full_pipeline()
    print("FlowForge Japan Full Pipeline test PASSED successfully!")
