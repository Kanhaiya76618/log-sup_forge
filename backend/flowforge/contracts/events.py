from pydantic import BaseModel
from .enums import Domain

class RawSignal(BaseModel):
    source: str
    domain: Domain
    payload: dict
