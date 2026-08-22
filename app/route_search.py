"""
app/route_search.py

K-Shortest Maritime Paths Search via NetworkX Dijkstra.
Computes primary and alternative Pareto-optimal recovery corridors.
"""

import logging
from typing import Dict, Any, List, Optional
import networkx as nx

logger = logging.getLogger("flowforge.route_search")


def find_k_shortest_paths(
    graph: nx.DiGraph,
    source_id: str,
    target_id: str,
    k: int = 3,
    weight_key: str = "weight"
) -> List[Dict[str, Any]]:
    """
    Finds k-shortest paths between source_id and target_id using NetworkX.
    """
    if source_id not in graph or target_id not in graph:
        logger.warning(f"Source {source_id} or target {target_id} not in graph.")
        return []

    results = []
    try:
        paths_generator = nx.shortest_simple_paths(graph, source_id, target_id, weight=weight_key)
        for i, path in enumerate(paths_generator):
            if i >= k:
                break

            total_dist_km = 0.0
            total_weight = 0.0
            total_time_hours = 0.0
            total_risk = 0.0
            linestring_coords: List[List[float]] = []

            for j in range(len(path) - 1):
                u, v = path[j], path[j + 1]
                edge = graph[u][v]
                total_dist_km += edge.get("distance_km", 0.0)
                total_weight += edge.get("weight", 0.0)
                total_time_hours += edge.get("time_hours", 0.0)
                total_risk += edge.get("risk_score", 0.0)

                geom = edge.get("geometry", {})
                if geom and "coordinates" in geom:
                    coords = geom["coordinates"]
                    if linestring_coords and coords and linestring_coords[-1] == coords[0]:
                        linestring_coords.extend(coords[1:])
                    else:
                        linestring_coords.extend(coords)

            results.append({
                "rank": i + 1,
                "node_path": path,
                "distance_km": round(total_dist_km, 2),
                "total_cost_score": round(total_weight, 4),
                "transit_time_hours": round(total_time_hours, 1),
                "risk_score": round(total_risk / max(1, len(path) - 1), 3),
                "geometry": {
                    "type": "LineString",
                    "coordinates": linestring_coords
                }
            })
    except nx.NetworkXNoPath:
        logger.warning(f"No navigable path between {source_id} and {target_id}.")
    except Exception as err:
        logger.error(f"Error during route search: {err}")

    return results
