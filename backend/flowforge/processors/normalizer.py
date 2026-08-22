from typing import Dict, Any

class DataNormalizer:
    """Normalizes multi-source telemetry data into standardized domain objects."""

    @staticmethod
    def normalize_vessel_telemetry(raw_vessel: Dict[str, Any], source: str = "AIS") -> Dict[str, Any]:
        lat = raw_vessel.get("latitude") or raw_vessel.get("lat") or 0.0
        lon = raw_vessel.get("longitude") or raw_vessel.get("lon") or 0.0
        speed = raw_vessel.get("speed_knots") or raw_vessel.get("speed") or raw_vessel.get("sog") or 0.0
        
        vessel_id = raw_vessel.get("imo") or raw_vessel.get("mmsi") or "UNKNOWN"
        if not str(vessel_id).startswith("IMO") and raw_vessel.get("imo"):
            vessel_id = f"IMO{vessel_id}"

        return {
            "source": source,
            "entity_type": "vessel",
            "vessel_id": vessel_id,
            "latitude": lat,
            "longitude": lon,
            "speed_knots": speed,
            "timestamp": raw_vessel.get("timestamp") or raw_vessel.get("time") or ""
        }

    @staticmethod
    def normalize_port_status(raw_port: Dict[str, Any]) -> Dict[str, Any]:
        occupied = raw_port.get("berths_occupied", 0)
        total = raw_port.get("total_berths", 1)
        occupancy_ratio = round((occupied / total) * 100, 1)

        return {
            "port_id": raw_port.get("id"),
            "name": raw_port.get("name"),
            "city": raw_port.get("city"),
            "country": raw_port.get("country"),
            "occupancy_rate": f"{occupancy_ratio}%",
            "congestion_index": raw_port.get("congestion_index", 0.5),
            "disruption_probability": raw_port.get("disruption_probability", 0.1),
            "status": raw_port.get("status"),
            "waiting_vessels": raw_port.get("waiting_vessels", 0)
        }

normalizer = DataNormalizer()
