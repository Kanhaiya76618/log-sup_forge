import logging
from typing import List, Dict, Any

logger = logging.getLogger("flowforge.collectors.ports_japan")

class PortsJapanCollector:
    """Collects operational metrics, berth capacity, typhoon threat level for Japanese ports."""

    def __init__(self):
        self.ports = [
            {
                "id": "JP-YOK",
                "name": "Port of Yokohama",
                "city": "Yokohama",
                "country": "Japan",
                "coordinates": {"lat": 35.4437, "lon": 139.6380},
                "capacity_utilization": "63.0%",
                "congestion_index": 0.82,
                "disruption_probability": 0.82,
                "status": "AT_RISK_TYPHOON",
                "berths_occupied": 28,
                "total_berths": 32,
                "waiting_vessels": 14,
                "expected_delay_days": 7.2,
                "key_commodities": ["Containers", "Electronics", "Automotive Parts"]
            },
            {
                "id": "JP-UKB",
                "name": "Port of Kobe",
                "city": "Kobe",
                "country": "Japan",
                "coordinates": {"lat": 34.6901, "lon": 135.1955},
                "capacity_utilization": "45.0%",
                "congestion_index": 0.30,
                "disruption_probability": 0.15,
                "status": "RECOVERY_TARGET",
                "berths_occupied": 16,
                "total_berths": 28,
                "waiting_vessels": 2,
                "expected_delay_days": 1.1,
                "key_commodities": ["Containers", "Machinery", "Precision Metals"]
            },
            {
                "id": "JP-TYO",
                "name": "Port of Tokyo",
                "city": "Tokyo",
                "country": "Japan",
                "coordinates": {"lat": 35.6191, "lon": 139.7753},
                "capacity_utilization": "88.0%",
                "congestion_index": 0.71,
                "disruption_probability": 0.65,
                "status": "HIGH_TRAFFIC",
                "berths_occupied": 22,
                "total_berths": 25,
                "waiting_vessels": 9,
                "expected_delay_days": 4.5,
                "key_commodities": ["Consumer Goods", "Foodstuff", "Electronics"]
            },
            {
                "id": "JP-NGO",
                "name": "Port of Nagoya",
                "city": "Nagoya",
                "country": "Japan",
                "coordinates": {"lat": 35.0833, "lon": 136.8833},
                "capacity_utilization": "72.0%",
                "congestion_index": 0.45,
                "disruption_probability": 0.28,
                "status": "OPERATIONAL",
                "berths_occupied": 20,
                "total_berths": 26,
                "waiting_vessels": 4,
                "expected_delay_days": 2.0,
                "key_commodities": ["Automobiles", "Industrial Equipment"]
            },
            {
                "id": "JP-OSA",
                "name": "Port of Osaka",
                "city": "Osaka",
                "country": "Japan",
                "coordinates": {"lat": 34.6500, "lon": 135.4333},
                "capacity_utilization": "54.0%",
                "congestion_index": 0.32,
                "disruption_probability": 0.20,
                "status": "OPERATIONAL",
                "berths_occupied": 13,
                "total_berths": 22,
                "waiting_vessels": 3,
                "expected_delay_days": 1.5,
                "key_commodities": ["Chemicals", "Steel", "Processed Goods"]
            }
        ]

    async def get_japanese_ports(self) -> List[Dict[str, Any]]:
        return self.ports

ports_japan_collector = PortsJapanCollector()
