"""
collectors/ais.py
AIS Collector — streams live vessel positions from AISstream.io WebSocket
and normalizes the raw AIS message format into FlowForge standard vessel schema.

AISstream raw format:
{
    "MetaData": { "MMSI": 123456789, "ShipName": "ABC", "latitude": 19.076, "longitude": 72.878, "time_utc": "..." },
    "Message":  { "PositionReport": { "Sog": 12.4, "Cog": 245.0, "TrueHeading": 248, "NavigationalStatus": 0 } }
}

FlowForge standard vessel schema:
{
    "source":      "aisstream",
    "timestamp":   "2026-08-17T10:47:00Z",
    "mmsi":        "123456789",
    "imo":         null,
    "name":        "ABC",
    "latitude":    19.076,
    "longitude":   72.878,
    "speed":       12.4,
    "course":      245.0,
    "heading":     248,
    "nav_status":  0,
    "destination": null
}
"""
import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Callable, Optional, List, Dict, Any

import websockets

try:
    from config import AIS_API_KEY
except ImportError:
    from backend.config import AIS_API_KEY

logger = logging.getLogger("flowforge.collectors.ais")

AIS_WS_URL    = "wss://stream.aisstream.io/v0/stream"
BOUNDING_BOXES = [[[-90.0, -180.0], [90.0, 180.0]]]


def _parse_timestamp(time_utc: str) -> str:
    """Convert AISstream time_utc string to ISO 8601."""
    if not time_utc:
        return datetime.now(timezone.utc).isoformat()
    return time_utc.replace(" +0000 UTC", "Z").replace(" ", "T")


def normalize_position_report(message: dict) -> dict:
    """
    Map raw AISstream PositionReport message → FlowForge standard vessel schema.

    AISstream field     → Standard field
    MetaData.MMSI       → mmsi
    MetaData.ShipName   → name
    MetaData.latitude   → latitude
    MetaData.longitude  → longitude
    MetaData.time_utc   → timestamp
    PositionReport.Sog  → speed
    PositionReport.Cog  → course
    PositionReport.TrueHeading       → heading
    PositionReport.NavigationalStatus → nav_status
    """
    meta = message.get("MetaData", {})
    pos  = message.get("Message", {}).get("PositionReport", {})

    time_utc = meta.get("time_utc", "")

    return {
        "source":      "aisstream",
        "timestamp":   _parse_timestamp(time_utc),
        "mmsi":        str(meta.get("MMSI", "")),
        "imo":         None,           # populated by ShipStaticData if available
        "name":        meta.get("ShipName", "").strip() or None,
        "latitude":    meta.get("latitude"),
        "longitude":   meta.get("longitude"),
        "speed":       pos.get("Sog"),
        "course":      pos.get("Cog"),
        "heading":     pos.get("TrueHeading"),
        "nav_status":  pos.get("NavigationalStatus"),
        "destination": None,           # populated by ShipStaticData if available
    }


def normalize_ship_static(message: dict) -> dict:
    """
    Map raw AISstream ShipStaticData message → FlowForge standard vessel schema.

    AISstream field                       → Standard field
    MetaData.MMSI                         → mmsi
    ShipStaticData.ImoNumber              → imo
    ShipStaticData.Name                   → name
    ShipStaticData.Destination            → destination
    ShipStaticData.Type                   → ship_type
    ShipStaticData.MaximumStaticDraught   → draught
    """
    meta   = message.get("MetaData", {})
    static = message.get("Message", {}).get("ShipStaticData", {})

    return {
        "source":      "aisstream",
        "timestamp":   _parse_timestamp(meta.get("time_utc", "")),
        "mmsi":        str(meta.get("MMSI", "")),
        "imo":         str(static.get("ImoNumber")) if static.get("ImoNumber") else None,
        "name":        (static.get("Name") or "").strip() or None,
        "ship_type":   static.get("Type"),
        "destination": (static.get("Destination") or "").strip() or None,
        "draught":     static.get("MaximumStaticDraught"),
        "latitude":    meta.get("latitude"),
        "longitude":   meta.get("longitude"),
        "speed":       None,
        "course":      None,
        "heading":     None,
        "nav_status":  None,
    }


async def stream_vessels(
    on_vessel: Callable[[dict], None],
    max_messages: Optional[int] = None,
    timeout_seconds: float = 10.0,
):
    """
    Open AISstream WebSocket, receive PositionReport and ShipStaticData messages,
    normalize each to standard schema, and pass to on_vessel callback.
    Returns without calling on_vessel if connection fails — no mock fallback.
    """
    subscribe_msg = {
        "APIKey":             AIS_API_KEY,
        "BoundingBoxes":      BOUNDING_BOXES,
        "FilterMessageTypes": ["PositionReport", "ShipStaticData"],
    }

    count = 0
    try:
        async with websockets.connect(AIS_WS_URL) as ws:
            await ws.send(json.dumps(subscribe_msg))
            logger.info("Subscribed to AISstream live feed")

            while True:
                try:
                    raw     = await asyncio.wait_for(ws.recv(), timeout=timeout_seconds)
                    message = json.loads(raw)
                    mtype   = message.get("MessageType")

                    if mtype == "PositionReport":
                        vessel = normalize_position_report(message)
                        on_vessel(vessel)
                        count += 1
                    elif mtype == "ShipStaticData":
                        vessel = normalize_ship_static(message)
                        on_vessel(vessel)
                        count += 1

                    if max_messages and count >= max_messages:
                        break

                except asyncio.TimeoutError:
                    logger.warning(f"AISstream timeout after {timeout_seconds}s — no more messages.")
                    break

    except Exception as e:
        logger.warning(f"AISstream connection error: {e}")


async def get_snapshot(n: int = 5) -> List[Dict[str, Any]]:
    """Collect up to n live vessel records from AISstream."""
    vessels: List[Dict[str, Any]] = []

    def collect(v: dict):
        vessels.append(v)

    await stream_vessels(collect, max_messages=n, timeout_seconds=8.0)
    return vessels


class AISCollector:
    """Async collector class for AIS vessel data — for use in FastAPI endpoints."""

    async def get_active_vessels(self, n: int = 5) -> List[Dict[str, Any]]:
        return await get_snapshot(n)


ais_collector = AISCollector()
