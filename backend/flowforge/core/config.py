import os
from pydantic_settings import BaseSettings
from pydantic import BaseModel

class GateThresholds(BaseModel):
    max_cost: float = 5000.0
    min_confidence: float = 0.85

class Settings(BaseSettings):
    LLM_API_KEY: str = "sk-..."
    REDIS_URL: str = "redis://localhost:6379/0"
    DATABASE_URL: str = "sqlite:///flowforge.db"
    AUTO_APPROVE_CONFIDENCE: float = 0.85
    MAX_AUTO_COST: float = 5000.0

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"
