"""
tests/test_sea_routing.py

Unit Tests for the Land-Crossing Fix Module (app/sea_routing.py).
Tests open-water geometry generation, land-avoidance validation, and graceful fallback.
"""

import unittest
from unittest.mock import patch
import sys
import os

# Ensure workspace root is on Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.sea_routing import get_sea_path, validate_no_land_crossing, _haversine_distance_km
from app.graph_builder import MaritimeGraphBuilder


class TestSeaRouting(unittest.TestCase):

    def test_get_sea_path_shanghai_to_yokohama(self):
        """
        Verifies that get_sea_path for Shanghai -> Yokohama generates a realistic
        nautical open-water trajectory with multiple waypoints rounding Japan.
        """
        shanghai = (122.07, 30.63)
        yokohama = (139.64, 35.44)

        result = get_sea_path(shanghai, yokohama)

        self.assertIn("geometry", result)
        self.assertIn("distance_km", result)
        self.assertEqual(result["geometry"]["type"], "LineString")

        coords = result["geometry"]["coordinates"]
        self.assertGreater(len(coords), 1, "Route must contain waypoints along water channels")
        self.assertGreater(result["distance_km"], 1500.0, "Sea distance Shanghai -> Yokohama must be > 1500 km")

        # Straight-line distance across Japan would be ~1760 km, sea route is ~1900-2100 km
        straight_dist = _haversine_distance_km(shanghai, yokohama)
        self.assertGreaterEqual(result["distance_km"], straight_dist, "Sea path cannot be shorter than Euclidean distance")

    def test_get_sea_path_fallback_on_exception(self):
        """
        Verifies that when searoute throws an exception or fails, get_sea_path
        gracefully falls back to straight-line calculation without crashing.
        """
        orig = (72.95, 18.95)   # Mumbai
        dest = (103.85, 1.29)   # Singapore

        with patch("app.sea_routing.sr.searoute", side_effect=RuntimeError("Searoute mock failure")):
            result = get_sea_path(orig, dest)

            self.assertIn("geometry", result)
            self.assertIn("distance_km", result)
            self.assertGreater(result["distance_km"], 0.0)
            self.assertEqual(result["geometry"]["type"], "LineString")
            self.assertEqual(len(result["geometry"]["coordinates"]), 2)

    def test_validate_no_land_crossing_graceful_without_db(self):
        """
        Verifies that validate_no_land_crossing safely returns True when
        database connection is None or unavailable.
        """
        geojson_linestring = {
            "type": "LineString",
            "coordinates": [[72.95, 18.95], [80.29, 13.08]]
        }
        is_safe = validate_no_land_crossing(None, geojson_linestring)
        self.assertTrue(is_safe, "Validation must gracefully return True when connection is None")

    def test_graph_builder_integration(self):
        """
        Verifies that MaritimeGraphBuilder correctly uses get_sea_path to populate
        edge distance D and geometry.
        """
        builder = MaritimeGraphBuilder()
        builder.add_port_edge(
            source_id="SHA",
            target_id="YOK",
            source_lonlat=(122.07, 30.63),
            target_lonlat=(139.64, 35.44),
            risk_score=0.15
        )

        self.assertTrue(builder.graph.has_edge("SHA", "YOK"))
        edge_data = builder.graph["SHA"]["YOK"]
        self.assertIn("distance_km", edge_data)
        self.assertIn("geometry", edge_data)
        self.assertGreater(edge_data["distance_km"], 1500.0)
        self.assertGreater(edge_data["weight"], 0.0)


if __name__ == "__main__":
    unittest.main()
