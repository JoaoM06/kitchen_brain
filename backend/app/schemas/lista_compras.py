from __future__ import annotations
import uuid
from datetime import date
from pydantic import BaseModel


class ListaComprasCriar(BaseModel):
    nome: str
    produto_generico_id: uuid.UUID | None = None
    validade: date | None = None


class ListaComprasOut(BaseModel):
    id: int
    nome: str
    comprado: bool
    usuario_id: uuid.UUID | None = None
    produto_generico_id: uuid.UUID | None = None
    validade: date | None = None

    class Config:
        from_attributes = True
