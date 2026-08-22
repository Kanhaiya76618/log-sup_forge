"""
backend/flowforge/cargo_risk/transshipment.py
Transshipment Failure & Connection Buffer Prediction Engine.

Models container handover across feeder and mother vessels at intermediate transshipment hubs:
Inbound Feeder Arrival -> Crane Discharge -> Terminal Yard Stacking -> Feeder Transfer -> Outbound Mother Departure
"""

from typing import Dict, Any


class TransshipmentRiskEngine:
    """Predicts missed connecting vessels and calculates buffer windows."""

    def evaluate_transshipment_risk(
        self,
        predicted_inbound_arrival_hours: float,
        connecting_vessel_departure_hours: float,
        port_congestion_score: float,
        terminal_handling_hours: float = 7.5,
        customs_dwell_hours: float = 2.0
    ) -> Dict[str, Any]:
        """
        Calculates container availability time vs outbound vessel departure.
        """
        # Dynamic handling time adjusted for port congestion
        congestion_multiplier = 1.0 + (port_congestion_score * 0.8)  # up to +80% dwell under high congestion
        adjusted_handling_hours = terminal_handling_hours * congestion_multiplier
        total_intermediate_dwell = adjusted_handling_hours + customs_dwell_hours

        # When the container is physically loaded/available on the outbound quay
        container_available_hours = predicted_inbound_arrival_hours + total_intermediate_dwell

        # Connection buffer (positive = safe window, negative = missed connection)
        buffer_hours = round(connecting_vessel_departure_hours - container_available_hours, 1)

        # Risk calculation based on buffer size and congestion uncertainty
        if buffer_hours >= 12.0:
            risk = round(max(0.05, 0.15 * port_congestion_score), 3)
            status = "SAFE"
            action = "Maintain scheduled transshipment sequence. Buffer window is robust."
        elif buffer_hours >= 6.0:
            risk = round(0.30 + (port_congestion_score * 0.25), 3)
            status = "AT_RISK"
            action = "Request priority crane discharge at intermediate hub. Monitor inbound speed."
        elif buffer_hours >= 0.0:
            risk = round(0.65 + (port_congestion_score * 0.30), 3)
            status = "LIKELY_TO_MISS"
            action = "Pre-book next available feeder connection (+24h) and trigger priority customs clearance."
        else:
            risk = round(min(0.99, 0.88 + (port_congestion_score * 0.11)), 3)
            status = "MISSED"
            action = "Auto-rebook to secondary mother vessel. Notify destination consignee of ETA roll."

        return {
            "transshipment_risk": risk,
            "connection_status": status,
            "buffer_hours": buffer_hours,
            "predicted_container_available_hours": round(container_available_hours, 1),
            "recommended_action": action
        }


transshipment_engine = TransshipmentRiskEngine()
