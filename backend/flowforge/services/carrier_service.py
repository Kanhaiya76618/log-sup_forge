import os
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional

logger = logging.getLogger("flowforge.services.carrier")

# Default Configurable Carrier Matrix
DEFAULT_CARRIER_MATRIX: Dict[str, Dict[str, float]] = {
    "MAERSK": {"carrier_risk": 0.12, "reliability_score": 0.88},
    "MSC": {"carrier_risk": 0.15, "reliability_score": 0.85},
    "CMA_CGM": {"carrier_risk": 0.18, "reliability_score": 0.82},
    "COSCO": {"carrier_risk": 0.20, "reliability_score": 0.80},
    "ONE": {"carrier_risk": 0.14, "reliability_score": 0.86},
    "EVERGREEN": {"carrier_risk": 0.22, "reliability_score": 0.78},
    "DEFAULT": {"carrier_risk": 0.20, "reliability_score": 0.80}
}

class CarrierService:
    """
    Carrier Service Abstraction — provides Carrier_Risk and Carrier_Reliability_Score.
    Abstracted behind a clean interface so a live carrier API can be plugged in later
    without changing ML agent logic.
    """

    def __init__(self):
        self.matrix = DEFAULT_CARRIER_MATRIX

    def get_carrier_metrics(self, carrier_code: Optional[str] = None) -> Dict[str, Any]:
        timestamp = datetime.now(timezone.utc).isoformat()
        code = (carrier_code or "DEFAULT").upper().strip()

        metrics = self.matrix.get(code) or self.matrix.get("DEFAULT")
        status = "OK" if code in self.matrix else "FALLBACK"

        return {
            "carrier_code": code,
            "carrier_risk": {
                "value": metrics["carrier_risk"],
                "source": "CONFIGURED",
                "timestamp": timestamp,
                "status": status
            },
            "carrier_reliability_score": {
                "value": metrics["reliability_score"],
                "source": "CONFIGURED",
                "timestamp": timestamp,
                "status": status
            }
        }

carrier_service = CarrierService()
