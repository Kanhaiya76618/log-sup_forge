"""
app/postgis_queries.py

PostGIS Spatial Queries for Port Discovery and Spatial Lookups.
Provides candidate port discovery via ST_DWithin and spatial nearest-neighbor searches.
"""

from typing import List, Dict, Any, Tuple


def find_candidate_ports_within_distance(
    conn: Any,
    lon: float,
    lat: float,
    radius_meters: float = 200000.0
) -> List[Dict[str, Any]]:
    """
    Discovers candidate ports within radius_meters of (lon, lat) using PostGIS ST_DWithin.
    """
    if conn is None:
        return []

    query = """
        SELECT id, name, code, country, ST_X(geom) AS lon, ST_Y(geom) AS lat
        FROM ports
        WHERE ST_DWithin(
            geom::geography,
            ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography,
            %s
        )
        ORDER BY ST_Distance(
            geom::geography,
            ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography
        );
    """
    try:
        if hasattr(conn, "cursor"):
            with conn.cursor() as cur:
                cur.execute(query, (lon, lat, radius_meters, lon, lat))
                rows = cur.fetchall()
                return [
                    {"id": r[0], "name": r[1], "code": r[2], "country": r[3], "lon": r[4], "lat": r[5]}
                    for r in rows
                ]
    except Exception:
        pass
    return []
