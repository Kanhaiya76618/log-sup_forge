"""
app/graph_builder.py

NetworkX Maritime Graph Builder & Edge Cost Calculator.

Constructs directed sea-lane graphs where edge weights represent multi-objective
costs: EdgeCost = w_d*D + w_t*T + w_r*R + w_c*C

Land-Crossing Fix:
    Edge distances (D) and geometries are now sourced from `app.sea_routing.get_sea_path()`
    instead of straight-line ST_Distance, ensuring zero land crossing while preserving
    exact function signatures and graceful fallback.
"""

import logging
import math
from typing import Dict, Any, List, Optional, Tuple
import networkx as nx

# Import the new sea-routing module for bathymetrically verified open-water paths
from app.sea_routing import get_sea_path

logger = logging.getLogger("flowforge.graph_builder")


def _haversine_distance_km(p1: Tuple[float, float], p2: Tuple[float, float]) -> float:
    """Fallback straight-line PostGIS/spherical distance in km."""
    R = 6371.0
    lon1, lat1 = math.radians(p1[0]), math.radians(p1[1])
    lon2, lat2 = math.radians(p2[0]), math.radians(p2[1])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2.0) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2.0) ** 2
    return R * 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))


class MaritimeGraphBuilder:
    """Builds and manages the NetworkX maritime navigation graph."""

    def __init__(
        self,
        w_d: float = 0.40,
        w_t: float = 0.25,
        w_r: float = 0.20,
        w_c: float = 0.15
    ):
        self.w_d = w_d
        self.w_t = w_t
        self.w_r = w_r
        self.w_c = w_c
        self.graph = nx.DiGraph()

    def compute_edge_cost(
        self,
        distance_km: float,
        time_hours: float = 0.0,
        risk_score: float = 0.0,
        carbon_cost: float = 0.0,
        vessel_speed_knots: float = 16.0
    ) -> float:
        """
        Computes composite EdgeCost = w_d*D + w_t*T + w_r*R + w_c*C
        """
        # If time is not provided, estimate transit hours at standard cruising speed
        if time_hours <= 0.0:
            speed_kmh = max(1.0, vessel_speed_knots * 1.852)
            time_hours = distance_km / speed_kmh

        # Normalize components for balanced optimization
        norm_d = distance_km / 1000.0
        norm_t = time_hours / 24.0
        norm_r = risk_score * 10.0
        norm_c = carbon_cost / 500.0

        edge_cost = (
            self.w_d * norm_d +
            self.w_t * norm_t +
            self.w_r * norm_r +
            self.w_c * norm_c
        )
        return round(edge_cost, 4)

    def add_port_edge(
        self,
        source_id: str,
        target_id: str,
        source_lonlat: Tuple[float, float],
        target_lonlat: Tuple[float, float],
        time_hours: float = 0.0,
        risk_score: float = 0.0,
        carbon_cost: float = 0.0,
        edge_data: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Adds or updates a directed edge between two ports.

        Land-Crossing Fix:
            Replaces straight-line distance with `get_sea_path(source_lonlat, target_lonlat)`
            to ensure bathymetric open-water trajectory and accurate distance D.
        """
        # ---------------------------------------------------------------------
        # LAND-CROSSING FIX: Call sea_routing.get_sea_path() with graceful fallback
        # ---------------------------------------------------------------------
        try:
            sea_result = get_sea_path(source_lonlat, target_lonlat)
            distance_km = float(sea_result.get("distance_km", 0.0))
            geometry = sea_result.get("geometry", {})
        except Exception as err:
            logger.warning(
                f"get_sea_path failed for {source_id} -> {target_id}: {err}. "
                "Falling back to straight-line calculation."
            )
            distance_km = round(_haversine_distance_km(source_lonlat, target_lonlat), 2)
            geometry = {
                "type": "LineString",
                "coordinates": [list(source_lonlat), list(target_lonlat)]
            }

        edge_cost = self.compute_edge_cost(
            distance_km=distance_km,
            time_hours=time_hours,
            risk_score=risk_score,
            carbon_cost=carbon_cost
        )

        data = {
            "distance_km": distance_km,
            "time_hours": time_hours,
            "risk_score": risk_score,
            "carbon_cost": carbon_cost,
            "weight": edge_cost,
            "geometry": geometry,
            "source_coords": source_lonlat,
            "target_coords": target_lonlat
        }
        if edge_data:
            data.update(edge_data)

        self.graph.add_edge(source_id, target_id, **data)

    def build_from_db_records(
        self,
        ports_list: List[Dict[str, Any]],
        edges_list: Optional[List[Dict[str, Any]]] = None
    ) -> nx.DiGraph:
        """
        Populates NetworkX graph from port entities and edge records.
        """
        port_dict = {}
        for p in ports_list:
            pid = str(p["id"])
            coords = (float(p["lon"]), float(p["lat"]))
            port_dict[pid] = coords
            self.graph.add_node(pid, name=p.get("name", pid), code=p.get("code", ""), coords=coords)

        if edges_list:
            for e in edges_list:
                s_id = str(e["source_port_id"])
                t_id = str(e["target_port_id"])
                if s_id in port_dict and t_id in port_dict:
                    self.add_port_edge(
                        source_id=s_id,
                        target_id=t_id,
                        source_lonlat=port_dict[s_id],
                        target_lonlat=port_dict[t_id],
                        time_hours=e.get("time_hours", 0.0),
                        risk_score=e.get("risk_score", 0.0),
                        carbon_cost=e.get("carbon_tax_cost", 0.0)
                    )
        return self.graph
