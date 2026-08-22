import os
import logging
import certifi
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("flowforge.database")

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGODB_DB_NAME", "flowforge")

class InMemStore:
    """In-memory cache & fallback database store when MongoDB is unavailable."""
    def __init__(self):
        self.collections: Dict[str, List[Dict[str, Any]]] = {
            "vessels": [],
            "weather": [],
            "marine": [],
            "ports": [],
            "news_events": [],
            "disasters": [],
            "disruptions": [],
            "predictions": [],
            "alerts": []
        }

    async def insert_one(self, collection_name: str, document: Dict[str, Any]) -> Dict[str, Any]:
        if collection_name not in self.collections:
            self.collections[collection_name] = []
        self.collections[collection_name].append(document)
        return document

    async def find(self, collection_name: str, query: Optional[Dict[str, Any]] = None, limit: int = 100) -> List[Dict[str, Any]]:
        items = self.collections.get(collection_name, [])
        if not query:
            return items[-limit:]
        filtered = []
        for item in items:
            match = True
            for k, v in query.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                filtered.append(item)
        return filtered[-limit:]

in_mem_db = InMemStore()
mongo_client = None
db = None

async def init_db():
    global mongo_client, db
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        mongo_client = AsyncIOMotorClient(
            MONGODB_URI,
            serverSelectionTimeoutMS=10000,
            tlsCAFile=certifi.where(),
            tlsAllowInvalidCertificates=True
        )
        await mongo_client.admin.command('ping')
        db = mongo_client[DB_NAME]
        logger.info(f"Successfully connected to MongoDB database: {DB_NAME}")
    except Exception as e:
        logger.warning(f"MongoDB connection failed ({e}). Falling back to active in-memory operational store.")
        db = None

async def get_db_or_fallback(collection_name: str):
    if db is not None:
        try:
            return db[collection_name]
        except Exception:
            pass
    return None

async def save_telemetry_event(collection: str, data: Dict[str, Any]):
    target_db = await get_db_or_fallback(collection)
    doc_to_save = data.copy()
    if target_db is not None:
        try:
            await target_db.insert_one(doc_to_save)
            return
        except Exception as e:
            logger.error(f"Error saving to MongoDB collection {collection}: {e}")
    await in_mem_db.insert_one(collection, doc_to_save)

async def fetch_telemetry_events(collection: str, query: Optional[Dict[str, Any]] = None, limit: int = 50) -> List[Dict[str, Any]]:
    target_db = await get_db_or_fallback(collection)
    if target_db is not None:
        try:
            cursor = target_db.find(query or {}).limit(limit)
            return await cursor.to_list(length=limit)
        except Exception as e:
            logger.error(f"Error fetching from MongoDB collection {collection}: {e}")
    return await in_mem_db.find(collection, query, limit=limit)
