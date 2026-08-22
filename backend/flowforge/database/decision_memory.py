"""
SQLite Decision Memory & Persistent Storage Layer for FlowForge.

Stores Step 2 Decision Data Model telemetry (accepted / paused / abandoned) and adaptive preference weights.
Database file: app/database/flowforge_memory.db
"""
import sqlite3
import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

logger = logging.getLogger("flowforge.database.decision_memory")

DB_DIR = Path(__file__).resolve().parent
DB_FILE = DB_DIR / "flowforge_memory.db"


class DecisionMemoryStore:
    """
    SQLite persistent storage for Step 2 Decision Model history and learned preference weights.
    """

    def __init__(self, db_path: Path = DB_FILE):
        self.db_path = db_path
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        """Initializes tables if they do not exist, and migrates existing schema."""
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        with self._get_connection() as conn:
            cursor = conn.cursor()

            # Step 2 Decisions table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS human_decisions (
                    decision_id TEXT PRIMARY KEY,
                    shipment_id TEXT NOT NULL,
                    recommended_route TEXT,
                    recommended_cost REAL,
                    recommended_eta REAL,
                    recommended_risk REAL,
                    decision_status TEXT NOT NULL,
                    abandonment_reason TEXT,
                    abandonment_reason_text TEXT,
                    alternative_route TEXT,
                    profile_key TEXT NOT NULL DEFAULT 'GLOBAL',
                    user_id TEXT,
                    decision_timestamp TEXT NOT NULL
                )
            """)

            # Ensure columns exist if table was created in an earlier build
            existing_cols = {row["name"] for row in cursor.execute("PRAGMA table_info(human_decisions)").fetchall()}
            col_additions = [
                ("shipment_id", "TEXT NOT NULL DEFAULT 'SHIP-000'"),
                ("recommended_route", "TEXT"),
                ("recommended_cost", "REAL"),
                ("recommended_eta", "REAL"),
                ("recommended_risk", "REAL"),
                ("decision_status", "TEXT NOT NULL DEFAULT 'accepted'"),
                ("abandonment_reason_text", "TEXT"),
                ("alternative_route", "TEXT"),
                ("decision_timestamp", "TEXT NOT NULL DEFAULT ''"),
            ]
            for col_name, col_def in col_additions:
                if col_name not in existing_cols:
                    cursor.execute(f"ALTER TABLE human_decisions ADD COLUMN {col_name} {col_def}")

            # User preference weights table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS user_preferences (
                    profile_key TEXT PRIMARY KEY,
                    risk_weight REAL NOT NULL DEFAULT 0.35,
                    eta_weight REAL NOT NULL DEFAULT 0.35,
                    cost_weight REAL NOT NULL DEFAULT 0.30,
                    update_count INTEGER NOT NULL DEFAULT 0,
                    last_updated TEXT NOT NULL
                )
            """)
            conn.commit()
        logger.info(f"Initialized DecisionMemoryStore at {self.db_path}")

    # ── Decision History Operations ─────────────────────────────────────────────

    def save_decision(
        self,
        decision_id: str,
        shipment_id: str,
        recommended_route: str,
        recommended_cost: float,
        recommended_eta: float,
        recommended_risk: float,
        decision_status: str,
        abandonment_reason: Optional[str] = None,
        abandonment_reason_text: Optional[str] = None,
        alternative_route: Optional[str] = None,
        profile_key: str = "GLOBAL",
        user_id: Optional[str] = "ANONYMOUS_OPERATOR",
        decision_timestamp: Optional[str] = None,
    ) -> Dict[str, Any]:
        ts = decision_timestamp or datetime.now(timezone.utc).isoformat()
        status_norm = decision_status.lower().strip()
        reason_norm = abandonment_reason.lower().strip() if abandonment_reason else None

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO human_decisions (
                    decision_id, shipment_id, recommended_route, recommended_cost,
                    recommended_eta, recommended_risk, decision_status, abandonment_reason,
                    abandonment_reason_text, alternative_route, profile_key, user_id, decision_timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    decision_id,
                    shipment_id,
                    recommended_route,
                    recommended_cost,
                    recommended_eta,
                    recommended_risk,
                    status_norm,
                    reason_norm,
                    abandonment_reason_text,
                    alternative_route,
                    profile_key,
                    user_id or "ANONYMOUS_OPERATOR",
                    ts,
                ),
            )
            conn.commit()

        return {
            "decision_id": decision_id,
            "shipment_id": shipment_id,
            "recommended_route": recommended_route,
            "recommended_cost": recommended_cost,
            "recommended_eta": recommended_eta,
            "recommended_risk": recommended_risk,
            "decision_status": status_norm,
            "abandonment_reason": reason_norm,
            "abandonment_reason_text": abandonment_reason_text,
            "alternative_route": alternative_route,
            "profile_key": profile_key,
            "user_id": user_id,
            "decision_timestamp": ts,
        }

    def get_decision_history(
        self, profile_key: Optional[str] = None, limit: int = 50
    ) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            if profile_key:
                cursor.execute(
                    """
                    SELECT * FROM human_decisions
                    WHERE profile_key = ?
                    ORDER BY decision_timestamp DESC LIMIT ?
                    """,
                    (profile_key, limit),
                )
            else:
                cursor.execute(
                    """
                    SELECT * FROM human_decisions
                    ORDER BY decision_timestamp DESC LIMIT ?
                    """,
                    (limit,),
                )
            rows = cursor.fetchall()

        history = []
        for r in rows:
            history.append({
                "decision_id": r["decision_id"],
                "shipment_id": r["shipment_id"] if "shipment_id" in r.keys() else r.get("analysis_id", "SHIP-000"),
                "recommended_route": r["recommended_route"] if "recommended_route" in r.keys() else "",
                "recommended_cost": r["recommended_cost"] if "recommended_cost" in r.keys() else 0.0,
                "recommended_eta": r["recommended_eta"] if "recommended_eta" in r.keys() else 0.0,
                "recommended_risk": r["recommended_risk"] if "recommended_risk" in r.keys() else 0.0,
                "decision_status": r["decision_status"] if "decision_status" in r.keys() else r.get("action", "").lower(),
                "abandonment_reason": r["abandonment_reason"],
                "abandonment_reason_text": r["abandonment_reason_text"] if "abandonment_reason_text" in r.keys() else r.get("custom_notes"),
                "alternative_route": r["alternative_route"] if "alternative_route" in r.keys() else None,
                "profile_key": r["profile_key"],
                "user_id": r["user_id"],
                "decision_timestamp": r["decision_timestamp"] if "decision_timestamp" in r.keys() else r.get("created_at", ""),
            })
        return history

    # ── User Preference Weights Operations ────────────────────────────────────

    def get_preference_weights(self, profile_key: str = "GLOBAL") -> Dict[str, Any]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM user_preferences WHERE profile_key = ?", (profile_key,)
            )
            row = cursor.fetchone()

        if row:
            return {
                "profile_key": row["profile_key"],
                "risk_weight": round(row["risk_weight"], 4),
                "eta_weight": round(row["eta_weight"], 4),
                "cost_weight": round(row["cost_weight"], 4),
                "update_count": row["update_count"],
                "last_updated": row["last_updated"],
            }

        now = datetime.now(timezone.utc).isoformat()
        return {
            "profile_key": profile_key,
            "risk_weight": 0.35,
            "eta_weight": 0.35,
            "cost_weight": 0.30,
            "update_count": 0,
            "last_updated": now,
        }

    def save_preference_weights(
        self,
        profile_key: str,
        risk_weight: float,
        eta_weight: float,
        cost_weight: float,
    ) -> Dict[str, Any]:
        total = risk_weight + eta_weight + cost_weight
        if total > 0:
            rw = round(risk_weight / total, 4)
            ew = round(eta_weight / total, 4)
            cw = round(1.0 - rw - ew, 4)
        else:
            rw, ew, cw = 0.35, 0.35, 0.30

        now = datetime.now(timezone.utc).isoformat()

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO user_preferences (profile_key, risk_weight, eta_weight, cost_weight, update_count, last_updated)
                VALUES (?, ?, ?, ?, 1, ?)
                ON CONFLICT(profile_key) DO UPDATE SET
                    risk_weight = excluded.risk_weight,
                    eta_weight = excluded.eta_weight,
                    cost_weight = excluded.cost_weight,
                    update_count = user_preferences.update_count + 1,
                    last_updated = excluded.last_updated
                """,
                (profile_key, rw, ew, cw, now),
            )
            conn.commit()

        return self.get_preference_weights(profile_key)

    def reset_preference_weights(self, profile_key: str = "GLOBAL") -> Dict[str, Any]:
        return self.save_preference_weights(profile_key, 0.35, 0.35, 0.30)


decision_memory_store = DecisionMemoryStore()
