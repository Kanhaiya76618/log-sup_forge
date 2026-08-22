"""
scripts/build_sea_edges.py

One-Time Idempotent Seed/Setup Script for Maritime Port Edges.
Loops through all port pairs in the `ports` table, generates bathymetric open-water
paths via `app.sea_routing.get_sea_path()`, verifies zero land crossing with
`validate_no_land_crossing()`, and updates/inserts into `port_edges`.

Usage:
    python scripts/build_sea_edges.py [--db-url postgresql://user:pass@localhost:5432/maritime]
"""

import argparse
import json
import logging
import os
import sys
from typing import List, Dict, Any, Tuple

# Ensure project root is on Python sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.sea_routing import get_sea_path, validate_no_land_crossing

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("build_sea_edges")

# Curated global commercial port coordinates for standalone offline seeding
DEFAULT_PORTS: List[Dict[str, Any]] = [
    {"id": 1, "name": "Jawaharlal Nehru Port (Mumbai)", "code": "BOM", "country": "India", "lon": 72.95, "lat": 18.95},
    {"id": 2, "name": "Chennai Port", "code": "MAA", "country": "India", "lon": 80.29, "lat": 13.08},
    {"id": 3, "name": "Mundra Port", "code": "MUN", "country": "India", "lon": 69.70, "lat": 22.84},
    {"id": 4, "name": "Singapore Tuas Hub", "code": "SIN", "country": "Singapore", "lon": 103.85, "lat": 1.29},
    {"id": 5, "name": "Port Klang", "code": "PKG", "country": "Malaysia", "lon": 101.38, "lat": 3.00},
    {"id": 6, "name": "Port of Yokohama", "code": "YOK", "country": "Japan", "lon": 139.64, "lat": 35.44},
    {"id": 7, "name": "Port of Tokyo", "code": "TYO", "country": "Japan", "lon": 139.77, "lat": 35.62},
    {"id": 8, "name": "Shanghai Yangshan Port", "code": "SHA", "country": "China", "lon": 122.07, "lat": 30.63},
    {"id": 9, "name": "Port of Hong Kong", "code": "HKG", "country": "Hong Kong", "lon": 114.16, "lat": 22.29},
    {"id": 10, "name": "Port of Melbourne", "code": "MEL", "country": "Australia", "lon": 144.92, "lat": -37.82},
    {"id": 11, "name": "Port of Sydney", "code": "SYD", "country": "Australia", "lon": 151.21, "lat": -33.87},
    {"id": 12, "name": "Port Said (Suez)", "code": "PSD", "country": "Egypt", "lon": 32.31, "lat": 31.26},
    {"id": 13, "name": "Rotterdam Gateway", "code": "RTM", "country": "Netherlands", "lon": 4.48, "lat": 51.92},
]


def build_edges_in_memory(ports: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Computes all pairwise open-water edges in memory.
    """
    edges = []
    total_pairs = len(ports) * (len(ports) - 1)
    logger.info(f"Computing bathymetric sea paths for {len(ports)} ports ({total_pairs} directed pairs)...")

    for i, p1 in enumerate(ports):
        for j, p2 in enumerate(ports):
            if i == j:
                continue

            orig_coords = (p1["lon"], p1["lat"])
            dest_coords = (p2["lon"], p2["lat"])

            # Call sea routing
            sea_path = get_sea_path(orig_coords, dest_coords)
            geom = sea_path.get("geometry", {})
            dist_km = sea_path.get("distance_km", 0.0)

            # Validate zero land crossing
            is_safe = validate_no_land_crossing(None, geom)

            edges.append({
                "source_port_id": p1["id"],
                "target_port_id": p2["id"],
                "source_code": p1["code"],
                "target_code": p2["code"],
                "distance_km": dist_km,
                "is_safe": is_safe,
                "geometry": geom,
                "waypoints_count": len(geom.get("coordinates", []))
            })

    logger.info(f"Successfully computed {len(edges)} open-water edges.")
    return edges


def seed_database_edges(db_url: str) -> None:
    """
    Connects to PostgreSQL/PostGIS database and performs an idempotent UPSERT into port_edges.
    """
    try:
        import psycopg2
    except ImportError:
        logger.warning("psycopg2 not installed. Running in standalone mode.")
        return

    logger.info(f"Connecting to database: {db_url}")
    try:
        conn = psycopg2.connect(db_url)
        with conn.cursor() as cur:
            # 1. Fetch ports from table if present
            cur.execute("SELECT id, name, code, country, ST_X(geom), ST_Y(geom) FROM ports;")
            rows = cur.fetchall()
            ports = [
                {"id": r[0], "name": r[1], "code": r[2], "country": r[3], "lon": r[4], "lat": r[5]}
                for r in rows
            ] if rows else DEFAULT_PORTS

            # 2. Build pairwise edges
            edges = build_edges_in_memory(ports)

            # 3. Idempotent UPSERT into port_edges
            upsert_sql = """
                INSERT INTO port_edges (
                    source_port_id, target_port_id, distance_km, geometry
                ) VALUES (
                    %s, %s, %s, ST_SetSRID(ST_GeomFromGeoJSON(%s), 4326)
                )
                ON CONFLICT (source_port_id, target_port_id)
                DO UPDATE SET
                    distance_km = EXCLUDED.distance_km,
                    geometry = EXCLUDED.geometry;
            """
            for e in edges:
                geom_str = json.dumps(e["geometry"])
                cur.execute(upsert_sql, (e["source_port_id"], e["target_port_id"], e["distance_km"], geom_str))

        conn.commit()
        conn.close()
        logger.info("Successfully seeded port_edges table in PostgreSQL/PostGIS.")
    except Exception as err:
        logger.error(f"Failed to seed database: {err}")


def main():
    parser = argparse.ArgumentParser(description="Build and seed bathymetric sea edges for ports.")
    parser.add_argument("--db-url", type=str, default=None, help="PostgreSQL connection string")
    args = parser.parse_args()

    if args.db_url:
        seed_database_edges(args.db_url)
    else:
        edges = build_edges_in_memory(DEFAULT_PORTS)
        logger.info(f"Dry run complete. Sample edge: {edges[0]['source_code']} -> {edges[0]['target_code']} ({edges[0]['distance_km']} km, {edges[0]['waypoints_count']} waypoints)")


if __name__ == "__main__":
    main()
