import json
from typing import List
from ..interfaces.executor import BaseAuditSink
from ..contracts import AuditEntry, ExecutionResult
from ..contracts.enums import ActionType, Decision

class InMemoryAuditSink(BaseAuditSink):
    def __init__(self) -> None:
        self.logs: List[AuditEntry] = []

    def log(self, entry: AuditEntry) -> None:
        self.logs.append(entry)

    def fetch_all(self) -> List[AuditEntry]:
        return self.logs

# SQL implementation using SQLAlchemy
try:
    from sqlalchemy import create_engine, Column, String, Float, Boolean, Text
    from sqlalchemy.orm import declarative_base, sessionmaker

    Base = declarative_base()

    class AuditLogModel(Base):
        __tablename__ = "audit_logs"

        id = Column(String, primary_key=True)
        timestamp = Column(String)
        disruption_id = Column(String)
        agent = Column(String)
        action = Column(String)
        decision = Column(String)
        cost = Column(Float)
        reversible = Column(Boolean)
        execution_result_json = Column(Text)

    class SQLiteAuditSink(BaseAuditSink):
        def __init__(self, db_url: str) -> None:
            self.engine = create_engine(db_url, connect_args={"check_same_thread": False})
            Base.metadata.create_all(self.engine)
            self.SessionLocal = sessionmaker(bind=self.engine)

        def log(self, entry: AuditEntry) -> None:
            db = self.SessionLocal()
            try:
                # Deduplicate or check
                res_dict = entry.execution_result.dict() if hasattr(entry.execution_result, "dict") else entry.execution_result
                log_model = AuditLogModel(
                    id=f"{entry.disruption_id}-{entry.timestamp}",
                    timestamp=entry.timestamp,
                    disruption_id=entry.disruption_id,
                    agent=entry.agent,
                    action=entry.action.value,
                    decision=entry.decision.value,
                    cost=entry.cost,
                    reversible=entry.reversible,
                    execution_result_json=json.dumps(res_dict)
                )
                db.add(log_model)
                db.commit()
            finally:
                db.close()

        def fetch_all(self) -> List[AuditEntry]:
            db = self.SessionLocal()
            try:
                rows = db.query(AuditLogModel).order_by(AuditLogModel.timestamp.desc()).all()
                entries = []
                for r in rows:
                    res_data = json.loads(r.execution_result_json)
                    exec_res = ExecutionResult(
                        action=ActionType(res_data.get("action")),
                        target=res_data.get("target"),
                        success=res_data.get("success"),
                        detail=res_data.get("detail")
                    )
                    entries.append(
                        AuditEntry(
                            timestamp=r.timestamp,
                            disruption_id=r.disruption_id,
                            agent=r.agent,
                            action=ActionType(r.action),
                            decision=Decision(r.decision),
                            cost=r.cost,
                            reversible=r.reversible,
                            execution_result=exec_res
                        )
                    )
                return entries
            finally:
                db.close()

except ImportError:
    class SQLiteAuditSink(InMemoryAuditSink):
        def __init__(self, db_url: str = None) -> None:
            super().__init__()

