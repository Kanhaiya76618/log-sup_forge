import os
import json
import urllib.request
import urllib.error
import uuid
from datetime import datetime
from typing import List, Optional, Dict

from flowforge.data.schemas import LogisticsEvent, Disruption, DisruptionType

class WatcherAgent:
    def __init__(self, config: Optional[Dict] = None):
        """
        Initializes the WatcherAgent.
        Optional config can specify thresholds or LLM settings:
        {
            "delay_threshold_hours": 2.0,
            "gemini_api_key": "optional_key_override"
        }
        """
        self.config = config or {}
        self.delay_threshold = self.config.get("delay_threshold_hours", 2.0)
        self.gemini_api_key = self.config.get("gemini_api_key") or os.environ.get("GEMINI_API_KEY")

    def _call_gemini(self, prompt: str) -> Optional[str]:
        """Calls Gemini API directly using urllib to keep package zero-dependency."""
        if not self.gemini_api_key:
            return None
            
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={self.gemini_api_key}"
        data = {
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        }
        
        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        
        try:
            with urllib.request.urlopen(req, timeout=5) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                text = res_data["candidates"][0]["content"]["parts"][0]["text"]
                return text.strip()
        except Exception as e:
            # Silently catch and return None to fall back to rule-based explanation
            return f"[LLM Error: {str(e)}]"

    def _enrich_explanation(self, disruption: Disruption, event: LogisticsEvent) -> str:
        """Generates a detailed summary explanation, attempting LLM enrichment if key is set."""
        desc = (
            f"Event type: {event.event_type}, Entity: {event.entity_id}. "
            f"Properties: {json.dumps(event.properties)}"
        )
        
        prompt = (
            "You are the Watcher Agent in the FlowForge supply chain control tower. "
            "Explain this logistics anomaly to a dashboard user in one or two clear, professional sentences. "
            f"Anomaly data: {desc}\nExplanation:"
        )
        
        llm_response = self._call_gemini(prompt)
        if llm_response and not llm_response.startswith("[LLM Error"):
            return llm_response
            
        # Fallback rule-based explanations
        props = event.properties
        etype = event.event_type
        eid = event.entity_id
        
        if etype == DisruptionType.SHIPMENT_DELAY.value:
            return f"Shipment {eid} is delayed by {props.get('delay_hours', 'N/A')} hours. Expected arrival: {props.get('expected_arrival', 'unknown')}."
        elif etype == DisruptionType.PORT_CLOSURE.value:
            return f"Port closure detected at location '{props.get('port_name', eid)}'. All connecting routes are blocked and incoming shipments are delayed."
        elif etype == DisruptionType.VEHICLE_BREAKDOWN.value:
            return f"Vehicle breakdown reported for shipment {eid} at {props.get('breakdown_location', {}).get('name', 'transit coordinates')}."
        elif etype == DisruptionType.INVENTORY_SHORTAGE.value:
            return f"Inventory shortage detected for SKU {props.get('item_id', 'unknown')} at warehouse {props.get('warehouse_id', 'unknown')}. Stock levels are below safety threshold."
        elif etype == DisruptionType.SUPPLIER_DELAY.value:
            return f"Supplier {eid} has experienced operational delays, causing {props.get('delay_hours', 'N/A')} hours of lag on all pending outbound deliveries."
        elif etype == DisruptionType.ROUTE_CONGESTION.value:
            return f"Heavy congestion detected on route {eid}. Estimated travel duration has increased by a factor of {props.get('congestion_factor', 'N/A')}x."
        
        return f"Anomaly detected on {eid} due to {etype} event."

    def analyze_event(self, event: LogisticsEvent) -> Optional[Disruption]:
        """
        Analyzes a single event. Returns a Disruption object if an anomaly is identified,
        otherwise returns None.
        """
        etype = event.event_type
        eid = event.entity_id
        props = event.properties
        
        disruption_type = None
        confidence = 1.0
        details = {}
        
        # Rule-based validation logic
        if etype == DisruptionType.SHIPMENT_DELAY.value:
            delay = props.get("delay_hours", 0.0)
            if delay >= self.delay_threshold:
                disruption_type = DisruptionType.SHIPMENT_DELAY
                details = {"delay_hours": delay, "expected_arrival": props.get("expected_arrival")}
                
        elif etype == DisruptionType.PORT_CLOSURE.value:
            disruption_type = DisruptionType.PORT_CLOSURE
            details = {
                "port_name": props.get("port_name"),
                "location": props.get("location"),
                "blocked_routes": props.get("blocked_routes", []),
                "delayed_shipments": props.get("delayed_shipments", [])
            }
            
        elif etype == DisruptionType.VEHICLE_BREAKDOWN.value:
            disruption_type = DisruptionType.VEHICLE_BREAKDOWN
            details = {
                "breakdown_location": props.get("breakdown_location"),
                "delay_hours": props.get("delay_hours", 12.0)
            }
            
        elif etype == DisruptionType.INVENTORY_SHORTAGE.value:
            new_qty = props.get("new_quantity", 0)
            safety = props.get("safety_stock", 0)
            if new_qty < safety:
                disruption_type = DisruptionType.INVENTORY_SHORTAGE
                confidence = 0.95
                details = {
                    "item_id": props.get("item_id"),
                    "warehouse_id": props.get("warehouse_id"),
                    "current_quantity": new_qty,
                    "safety_stock": safety,
                    "reorder_point": props.get("reorder_point", 0)
                }
                
        elif etype == DisruptionType.SUPPLIER_DELAY.value:
            disruption_type = DisruptionType.SUPPLIER_DELAY
            details = {
                "supplier_name": props.get("supplier_name"),
                "delay_hours": props.get("delay_hours", 0.0),
                "affected_shipments": props.get("affected_shipments", []),
                "reliability_score": props.get("new_reliability_score")
            }
            
        elif etype == DisruptionType.ROUTE_CONGESTION.value:
            factor = props.get("congestion_factor", 1.0)
            if factor > 1.2:
                disruption_type = DisruptionType.ROUTE_CONGESTION
                confidence = 0.90
                details = {
                    "congestion_factor": factor,
                    "added_hours": props.get("added_hours", 0.0),
                    "affected_shipments": props.get("affected_shipments", [])
                }
                
        if disruption_type:
            disruption = Disruption(
                disruption_id=f"DIS_{uuid.uuid4().hex[:8].upper()}",
                event_type=disruption_type,
                entity_id=eid,
                confidence=confidence,
                details=details,
                detected_at=datetime.utcnow()
            )
            
            # Enrich details with natural language explanation (LLM or template fallback)
            explanation = self._enrich_explanation(disruption, event)
            disruption.details["explanation"] = explanation
            return disruption
            
        return None

    def detect_disruptions(self, events: List[LogisticsEvent]) -> List[Disruption]:
        """Processes a stream/list of events and filters for anomalies."""
        disruptions = []
        for event in events:
            disruption = self.analyze_event(event)
            if disruption:
                disruptions.append(disruption)
        return disruptions
