from typing import Dict, Any, List

class GeoJSONProcessor:
    """Builds standard GeoJSON Features & FeatureCollections for MSIL warnings, safety links, and AIS vessel tracks."""

    @staticmethod
    def to_point_feature(lat: float, lon: float, properties: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [lon, lat]
            },
            "properties": properties
        }

    @staticmethod
    def to_feature_collection(features: List[Dict[str, Any]]) -> Dict[str, Any]:
        return {
            "type": "FeatureCollection",
            "features": features
        }

geojson_processor = GeoJSONProcessor()
