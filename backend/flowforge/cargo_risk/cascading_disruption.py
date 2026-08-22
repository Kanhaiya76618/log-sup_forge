"""
backend/flowforge/cargo_risk/cascading_disruption.py
Cascading Disruption Prediction & Dependency Graph Engine.

Models the ripple effect of single disruptions across the entire container supply chain:
Bad Weather -> Vessel Delay -> Berth Congestion -> Missed Transshipment -> Inland Rail/Truck Delay -> Factory Stockout
"""

from typing import Dict, Any, List
import networkx as nx


class CascadingDisruptionEngine:
    """Graph-based probabilistic disruption propagation engine."""

    def build_journey_graph(self, has_transshipment: bool = True, inland_mode: str = "Rail + Truck") -> nx.DiGraph:
        """Constructs the directed dependency graph for container logistics."""
        G = nx.DiGraph()

        # Nodes with baseline processing duration (hours) and vulnerability index
        nodes = [
            ("Origin_GateIn", {"label": "Origin Port Gate-In", "dwell_hours": 4.0, "vulnerability": 0.15}),
            ("Origin_Loading", {"label": "Quay Crane Loading", "dwell_hours": 6.0, "vulnerability": 0.25}),
            ("Vessel_Transit_1", {"label": "Inbound Sea Voyage (Leg 1)", "dwell_hours": 72.0, "vulnerability": 0.65}),
        ]

        if has_transshipment:
            nodes.extend([
                ("Transshipment_Arrival", {"label": "Transshipment Port Arrival", "dwell_hours": 12.0, "vulnerability": 0.70}),
                ("Transshipment_Handling", {"label": "Feeder-to-Mother Yard Transfer", "dwell_hours": 8.0, "vulnerability": 0.75}),
                ("Vessel_Transit_2", {"label": "Mother Vessel Transit (Leg 2)", "dwell_hours": 96.0, "vulnerability": 0.50}),
            ])

        nodes.extend([
            ("Dest_Port_Arrival", {"label": "Destination Port Arrival & Pilotage", "dwell_hours": 14.0, "vulnerability": 0.80}),
            ("Dest_Unloading", {"label": "Container Discharge & Berth Dwell", "dwell_hours": 8.0, "vulnerability": 0.60}),
            ("Customs_Clearance", {"label": "Customs & Security Scan", "dwell_hours": 4.0, "vulnerability": 0.40}),
            ("Inland_Transit", {"label": f"Inland {inland_mode} Delivery", "dwell_hours": 16.0, "vulnerability": 0.45}),
            ("Final_Delivery", {"label": "Factory Consignee Delivery", "dwell_hours": 2.0, "vulnerability": 0.20})
        ])

        for node_id, attrs in nodes:
            G.add_node(node_id, **attrs)

        # Sequential dependency edges with propagation transfer efficiency (0..1)
        node_keys = [n[0] for n in nodes]
        for i in range(len(node_keys) - 1):
            u, v = node_keys[i], node_keys[i+1]
            G.add_edge(u, v, propagation_weight=0.85)

        return G

    def predict_cascade(
        self,
        initial_disruption: str = "Destination port congestion",
        initial_delay_hours: float = 16.0,
        destination_congestion: float = 0.74,
        has_transshipment: bool = True,
        inland_mode: str = "Rail + Truck"
    ) -> Dict[str, Any]:
        """
        Simulates disruption ripple through the shipment dependency graph.
        """
        G = self.build_journey_graph(has_transshipment, inland_mode)

        # Identify trigger node
        trigger_map = {
            "weather": "Vessel_Transit_1",
            "storm": "Vessel_Transit_1",
            "port": "Dest_Port_Arrival",
            "congestion": "Dest_Port_Arrival",
            "transshipment": "Transshipment_Arrival" if has_transshipment else "Dest_Port_Arrival",
            "customs": "Customs_Clearance"
        }

        root_node = "Dest_Port_Arrival"
        for k, v in trigger_map.items():
            if k in initial_disruption.lower():
                root_node = v
                break

        # Compute downstream affected nodes
        downstream = list(nx.dfs_preorder_nodes(G, source=root_node))
        affected_labels = [G.nodes[n].get("label", n) for n in downstream]

        # Propagate delay with compounding bottleneck friction
        accumulated_delay = initial_delay_hours
        propagation_graph = []
        critical_bottlenecks = []

        for node in downstream:
            vuln = G.nodes[node].get("vulnerability", 0.5)
            # Higher congestion amplifies terminal delays
            if "Dest_Port" in node or "Transshipment" in node:
                friction = 1.0 + (destination_congestion * 0.4)
                added_lag = round((vuln * 6.0) * friction, 1)
                critical_bottlenecks.append(G.nodes[node].get("label", node))
            elif "Inland" in node and accumulated_delay > 24.0:
                # Missed truck/train connection penalty
                added_lag = 12.0
                critical_bottlenecks.append("Inland Rail/Truck Connection Window")
            else:
                added_lag = round(vuln * 2.5, 1)

            accumulated_delay += added_lag
            propagation_graph.append({
                "node": node,
                "label": G.nodes[node].get("label", node),
                "delay_accumulated_hours": round(accumulated_delay, 1),
                "lag_added_hours": added_lag,
                "vulnerability_score": round(vuln * 100)
            })

        cascade_prob = min(0.96, 0.45 + (destination_congestion * 0.35) + (initial_delay_hours / 48.0) * 0.20)

        return {
            "initial_disruption": initial_disruption,
            "cascade_probability": round(cascade_prob, 3),
            "affected_nodes": affected_labels,
            "estimated_final_delay_hours": round(accumulated_delay, 1),
            "critical_bottlenecks": list(dict.fromkeys(critical_bottlenecks)),
            "propagation_graph": propagation_graph
        }


cascading_disruption_engine = CascadingDisruptionEngine()
