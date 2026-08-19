import sys, asyncio
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from database.mongodb import init_db, save_telemetry_event, fetch_telemetry_events

async def test_db_collections():
    print("Testing MongoDB collection schemas...\n")
    
    # Initialize the database
    await init_db()
    
    # Standardised Vessel Payload matching: vessel_id, IMO, MMSI, latitude, longitude, speed, heading, timestamp
    sample_vessel = {
        "vessel_id": "IMO9845120",
        "IMO": "9845120",
        "MMSI": "431002930",
        "latitude": 34.215,
        "longitude": 138.840,
        "speed": 14.2,
        "heading": 310,
        "timestamp": "2026-08-17T07:00:00Z"
    }

    # Standardised Prediction Payload
    sample_prediction = {
        "vessel_id": "IMO9845120",
        "eta_predicted": "2026-08-17T15:00:00Z",
        "delay_hours": 2.5,
        "confidence": 0.85
    }

    # Save to standard collections
    await save_telemetry_event("vessels", sample_vessel)
    await save_telemetry_event("predictions", sample_prediction)

    # Fetch and check
    vessels = await fetch_telemetry_events("vessels", limit=1)
    predictions = await fetch_telemetry_events("predictions", limit=1)

    print("Saved Vessel:", vessels[0])
    print("Saved Prediction:", predictions[0])

    assert len(vessels) > 0
    assert len(predictions) > 0
    assert vessels[0]["vessel_id"] == "IMO9845120"
    assert predictions[0]["vessel_id"] == "IMO9845120"

if __name__ == "__main__":
    asyncio.run(test_db_collections())
    print("\nMongoDB collection validation test PASSED successfully!")
