import os
import json
import urllib.request
import urllib.error
from datetime import datetime
from typing import Dict, List, Optional, Tuple

from flowforge.data.schemas import (
    Disruption,
    DiagnosisResult,
    BlastRadius,
    DisruptionType,
    SeverityLevel
)
from flowforge.analysis.severity import SeverityEngine
from flowforge.analysis.impact import BlastRadiusEngine

class DiagnosisAgent:
    def __init__(self, dataset: Dict[str, List], config: Optional[Dict] = None):
        """
        Initializes the DiagnosisAgent.
        
        Args:
            dataset: The active logistics dataset.
            config: Optional configurations (weights, API keys).
        """
        self.dataset = dataset
        self.config = config or {}
        
        # Initialize engines
        self.severity_engine = SeverityEngine(
            weights=self.config.get("severity_weights"),
            normalizers=self.config.get("severity_normalizers")
        )
        self.blast_radius_engine = BlastRadiusEngine()
        
        # LLM setup
        self.gemini_api_key = self.config.get("gemini_api_key") or os.environ.get("GEMINI_API_KEY")

    def _call_gemini(self, prompt: str) -> Optional[str]:
        """Calls Gemini API directly using urllib."""
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
            return f"[LLM Error: {str(e)}]"

    def calculate_blast_radius(self, disruption: Disruption) -> BlastRadius:
        """Invokes the Blast Radius Engine to map downstream dependencies."""
        return self.blast_radius_engine.calculate_impact(disruption, self.dataset)

    def _calculate_inventory_risk_factor(self, disruption: Disruption, blast_radius: BlastRadius) -> float:
        """Determines the risk factor of running out of inventory (0.0 to 1.0)."""
        dtype = disruption.event_type
        
        if dtype == DisruptionType.INVENTORY_SHORTAGE:
            # High direct inventory risk
            current = disruption.details.get("current_quantity", 0)
            safety = disruption.details.get("safety_stock", 1)
            if safety <= 0:
                safety = 1
            return max(0.0, min(1.0, (safety - current) / safety))
            
        # For delays, see if affected shipments carry SKUs that are near safety stock
        if len(blast_radius.affected_shipments) > 0:
            shipments = self.dataset.get("shipments", [])
            inventories = self.dataset.get("inventory", [])
            warehouses = self.dataset.get("warehouses", [])
            
            risk_scores = []
            
            for shipment_id in blast_radius.affected_shipments:
                shipment = next((s for s in shipments if s.shipment_id == shipment_id), None)
                if not shipment:
                    continue
                    
                # Find destination warehouse ID
                wh = next((w for w in warehouses if w.location.name == shipment.destination.name), None)
                if not wh:
                    continue
                    
                for item_id in shipment.items:
                    # Find inventory of this item at the destination warehouse
                    inv = next((i for i in inventories if i.warehouse_id == wh.warehouse_id and i.item_id == item_id), None)
                    if inv:
                        # If current qty is already below safety stock, max risk
                        if inv.quantity < inv.safety_stock:
                            risk_scores.append(1.0)
                        else:
                            # Proximity to safety stock
                            margin = inv.quantity - inv.safety_stock
                            if margin < 500:  # low buffer
                                risk_scores.append(0.5)
                            else:
                                risk_scores.append(0.1)
            if risk_scores:
                return max(risk_scores)
                
        return 0.0

    def estimate_severity(self, disruption: Disruption, blast_radius: BlastRadius) -> Tuple[float, SeverityLevel]:
        """Calculates severity using the Severity Engine."""
        delay_hours = disruption.details.get("delay_hours", 0.0)
        affected_orders = blast_radius.affected_orders_count
        inventory_risk = self._calculate_inventory_risk_factor(disruption, blast_radius)
        
        return self.severity_engine.evaluate_severity(delay_hours, affected_orders, inventory_risk)

    def diagnose(self, disruption: Disruption) -> DiagnosisResult:
        """
        Performs diagnosis for a disruption. Traces blast radius, severity,
        recommends action context, and generates root cause reasoning.
        """
        # 1. Calculate Blast Radius
        blast_radius = self.calculate_blast_radius(disruption)
        
        # 2. Estimate Severity
        score, level = self.estimate_severity(disruption, blast_radius)
        
        # 3. Determine Root Cause Details
        dtype = disruption.event_type
        base_cause = disruption.details.get("explanation", f"Disruption of type {dtype.value}")
        
        # 4. Action recommendations context flags
        recommended_context = {
            "reroute_required": dtype in [
                DisruptionType.PORT_CLOSURE,
                DisruptionType.ROUTE_CONGESTION,
                DisruptionType.VEHICLE_BREAKDOWN
            ],
            "inventory_risk": (dtype == DisruptionType.INVENTORY_SHORTAGE) or (
                self._calculate_inventory_risk_factor(disruption, blast_radius) > 0.4
            ),
            "supplier_risk": dtype == DisruptionType.SUPPLIER_DELAY
        }
        
        # 5. Agent Diagnosis reasoning (with optional LLM enrichment)
        prompt = (
            "You are the Diagnosis Agent in the FlowForge supply chain control tower.\n"
            f"Analyze the disruption details:\n"
            f"- Disruption Type: {dtype.value}\n"
            f"- Entity ID: {disruption.entity_id}\n"
            f"- Watcher Observation: {base_cause}\n"
            f"- Affected Shipments: {blast_radius.affected_shipments}\n"
            f"- Affected Orders: {blast_radius.affected_orders_count}\n"
            f"- Financial Risk: ${blast_radius.financial_risk}\n\n"
            "Provide a concise summary outlining: 1) The exact root cause, and 2) The cascade impact on downstream logistics.\n"
            "Keep it under 3 sentences.\nDiagnosis Summary:"
        )
        
        llm_diagnosis = self._call_gemini(prompt)
        
        # Choose reasoning based on LLM success
        reasoning = llm_diagnosis if (llm_diagnosis and not llm_diagnosis.startswith("[LLM Error")) else base_cause
        
        # Compute combined confidence score
        confidence = round(0.7 * disruption.confidence + 0.3 * (1.0 - (score / 15.0)), 2)
        confidence = max(0.5, min(1.0, confidence)) # clamp between 0.5 and 1.0
        
        # Map blast radius score based on order impacts
        blast_score = min(10, max(1, int(blast_radius.affected_orders_count / 10) + 1))
        
        return DiagnosisResult(
            disruption_type=dtype,
            root_cause=reasoning,
            severity=level,
            affected_orders=blast_radius.affected_orders_count,
            affected_customers=blast_radius.affected_customers_count,
            blast_radius=blast_score,
            confidence=confidence,
            recommended_context=recommended_context,
            diagnosed_at=datetime.utcnow(),
            details={
                "disruption_id": disruption.disruption_id,
                "entity_id": disruption.entity_id,
                "severity_score": score,
                "financial_risk": blast_radius.financial_risk,
                "impacted_warehouses_count": blast_radius.affected_warehouses_count,
                "impacted_suppliers_count": blast_radius.affected_suppliers_count,
                "impacted_shipments": blast_radius.affected_shipments
            }
        )
