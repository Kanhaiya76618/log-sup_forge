"""Engine settings + gate thresholds. OWNER: P1.
Thresholds are env-tunable (AUTO_APPROVE_CONFIDENCE, MAX_AUTO_COST) so demos
can show the HITL gate tightening/loosening without code changes."""
import os
from pydantic import BaseModel, Field


def env_flag(name: str) -> bool:
    """Truthy env switch: 1/true/yes/on, case-insensitive."""
    return os.environ.get(name, "").strip().lower() in ("1", "true", "yes", "on")


def _env_float(name: str, default: float) -> float:
    try:
        return float(os.environ.get(name, default))
    except ValueError:
        return default


class GateThresholds(BaseModel):
    # Auto-execute only when the Verifier is confident AND the plan is cheap/reversible.
    auto_approve_confidence: float = Field(
        default_factory=lambda: _env_float("AUTO_APPROVE_CONFIDENCE", 0.80))
    max_auto_cost: float = Field(
        default_factory=lambda: _env_float("MAX_AUTO_COST", 5000.0))
    block_irreversible_auto: bool = True


class Settings(BaseModel):
    gate: GateThresholds = Field(default_factory=GateThresholds)
