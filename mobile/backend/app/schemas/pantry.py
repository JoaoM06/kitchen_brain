from __future__ import annotations

from datetime import date
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class PantryItem(BaseModel):
    id: UUID
    name: str
    quantity: float
    unit: str
    location: Optional[str]
    expires_at: Optional[date]
    days_to_expire: Optional[int]
    status: str
    observations: Optional[str]


class PantryResponse(BaseModel):
    items: list[PantryItem]

