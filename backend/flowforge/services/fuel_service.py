import os
import logging
import requests
from datetime import datetime, timezone
from typing import Dict, Any, Optional

try:
    from app.config import env_path
except ImportError:
    pass

logger = logging.getLogger("flowforge.services.fuel")

class FuelService:
    """
    Fuel Price Service Abstraction — provides FUEL_PRICE_INDEX and fuel price per ton.
    Supports .env configuration with live API precedence capability & provenance tracking.
    """

    def __init__(self):
        self.live_api_url = os.getenv("BUNKER_FUEL_API_URL")

    def get_fuel_price_index(self) -> Dict[str, Any]:
        """
        Returns fuel price index with full provenance: value, source, timestamp, status.
        Source priority: LIVE > CONFIGURED > FALLBACK
        """
        timestamp = datetime.now(timezone.utc).isoformat()
        
        # 1. Check if live bunker fuel API is configured
        if self.live_api_url:
            try:
                resp = requests.get(self.live_api_url, timeout=5)
                if resp.status_code == 200:
                    val = float(resp.json().get("fuel_price_index", 1.0))
                    return {
                        "value": val,
                        "source": "LIVE",
                        "timestamp": timestamp,
                        "status": "OK"
                    }
            except Exception as e:
                logger.warning(f"Live fuel API request failed ({e}). Falling back to configured index.")

        # 2. Check .env configured fuel index
        env_val = os.getenv("FUEL_PRICE_INDEX")
        if env_val is not None:
            try:
                return {
                    "value": float(env_val),
                    "source": "CONFIGURED",
                    "timestamp": timestamp,
                    "status": "OK"
                }
            except ValueError:
                pass

        # 3. Fallback default
        return {
            "value": 1.0,
            "source": "FALLBACK",
            "timestamp": timestamp,
            "status": "DEFAULT_FALLBACK"
        }

    def get_fuel_price_per_ton(self) -> Dict[str, Any]:
        timestamp = datetime.now(timezone.utc).isoformat()
        env_val = os.getenv("FUEL_PRICE_PER_TON_USD")
        
        if env_val is not None:
            try:
                return {
                    "value": float(env_val),
                    "source": "CONFIGURED",
                    "timestamp": timestamp,
                    "status": "OK"
                }
            except ValueError:
                pass

        return {
            "value": 650.0,
            "source": "FALLBACK",
            "timestamp": timestamp,
            "status": "DEFAULT_FALLBACK"
        }

fuel_service = FuelService()
