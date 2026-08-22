"""
backend/flowforge/cargo_risk/cargo_eta.py
Cargo-Level ETA Prediction & Uncertainty Interval Engine.

Calculates exact operational milestones:
1. Port Arrival ETA (Pilotage)
2. Vessel Berth ETA (Hull touching quay)
3. Container Available ETA (Unloading + Customs clearance ready for gate-out)
4. Final Delivery ETA (Drayage / Rail intermodal delivery at warehouse)
"""

import math
from typing import Dict, Any
from ..contracts.schemas import PredictionIntervals


class CargoETAEngine:
    """Predicts container availability milestones with P50/P80/P90 prediction intervals."""

    def predict_cargo_eta(
        self,
        transit_duration_hours: float = 168.0,
        port_waiting_hours: float = 14.0,
        berth_handling_hours: float = 8.0,
        customs_inspection_hours: float = 4.5,
        inland_transit_hours: float = 12.0,
        disruption_delay_hours: float = 18.0
    ) -> Dict[str, Any]:
        """
        Computes multi-tier cargo availability ETAs.
        """
        # Step 1: Vessel Arrives at Port Outer Anchorage
        port_eta_hours = transit_duration_hours + disruption_delay_hours

        # Step 2: Vessel Berths at Quay
        vessel_eta_hours = port_eta_hours + port_waiting_hours

        # Step 3: Container Discharged & Customs Cleared (Available for Pick-up)
        container_available_eta_hours = vessel_eta_hours + berth_handling_hours + customs_inspection_hours

        # Step 4: Final Consignee Gate Delivery
        final_delivery_eta_hours = container_available_eta_hours + inland_transit_hours

        # Uncertainty intervals (variance scales with disruption severity)
        uncertainty_std = max(2.5, (disruption_delay_hours * 0.25) + (port_waiting_hours * 0.15))

        p50 = round(final_delivery_eta_hours, 1)
        p80 = round(final_delivery_eta_hours + (0.84 * uncertainty_std), 1)
        p90 = round(final_delivery_eta_hours + (1.28 * uncertainty_std), 1)

        confidence = round(max(0.60, min(0.95, 1.0 - (uncertainty_std / 40.0))), 2)

        return {
            "vessel_eta_hours": round(vessel_eta_hours, 1),
            "port_eta_hours": round(port_eta_hours, 1),
            "container_available_eta_hours": round(container_available_eta_hours, 1),
            "final_delivery_eta_hours": round(final_delivery_eta_hours, 1),
            "expected_delay_hours": round(disruption_delay_hours + (port_waiting_hours * 0.6), 1),
            "eta_confidence": confidence,
            "prediction_intervals": {
                "p50_hours": p50,
                "p80_hours": p80,
                "p90_hours": p90
            }
        }


cargo_eta_engine = CargoETAEngine()
