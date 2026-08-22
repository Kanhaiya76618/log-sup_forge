-- db/schema.sql
-- Maritime Port and Route Optimization Database Schema (PostgreSQL + PostGIS)

CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Ports Table
CREATE TABLE IF NOT EXISTS ports (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    country VARCHAR(100) NOT NULL,
    geom GEOMETRY(Point, 4326) NOT NULL
);

-- 2. Port Edges (Navigable Sea Lanes between Ports)
CREATE TABLE IF NOT EXISTS port_edges (
    id SERIAL PRIMARY KEY,
    source_port_id INTEGER NOT NULL REFERENCES ports(id) ON DELETE CASCADE,
    target_port_id INTEGER NOT NULL REFERENCES ports(id) ON DELETE CASCADE,
    distance_km DOUBLE PRECISION NOT NULL,
    time_hours DOUBLE PRECISION DEFAULT 0.0,
    risk_score DOUBLE PRECISION DEFAULT 0.0,
    carbon_tax_cost DOUBLE PRECISION DEFAULT 0.0,
    edge_cost DOUBLE PRECISION DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_port_edge UNIQUE (source_port_id, target_port_id)
);

CREATE INDEX IF NOT EXISTS idx_ports_geom ON ports USING GIST (geom);

-- ============================================================================
-- Land-Crossing Fix Additions (Additive changes only)
-- ============================================================================

-- 3. Land Polygons for nautical clearance validation
CREATE TABLE IF NOT EXISTS land_polygons (
    id SERIAL PRIMARY KEY,
    geom GEOMETRY(MultiPolygon, 4326)
);

CREATE INDEX IF NOT EXISTS idx_land_polygons_geom ON land_polygons USING GIST (geom);

-- 4. Migration-safe geometry column on port_edges
ALTER TABLE port_edges ADD COLUMN IF NOT EXISTS geometry GEOMETRY(LineString, 4326);
