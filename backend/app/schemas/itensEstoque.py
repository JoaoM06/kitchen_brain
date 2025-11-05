from typing import List, Optional
from pydantic import BaseModel, field_validator
from datetime import date


class ItemBase(BaseModel):
    nome: str
    secoes: Optional[List[str]] = []
    categorias: Optional[List[str]] = []
    validade: Optional[date] = None


class ItemCreate(ItemBase):
    pass


class ItemUpdate(BaseModel):
    nome: Optional[str] = None
    secoes: Optional[List[str]] = None
    categorias: Optional[List[str]] = None
    validade: Optional[date] = None


class ItemOut(ItemBase):
    id: int

    @field_validator("secoes", "categorias", mode="before")
    @classmethod
    def split_comma_separated(cls, v):
        if isinstance(v, str):
            return [s.strip() for s in v.split(",") if s.strip()]
        return v

    class Config:
        from_attributes = True  # substitui orm_mode
