from __future__ import annotations

from sqlalchemy import Column, Integer, String, Date, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base


class ListaComprasBase(Base):
    __tablename__ = "lista_compras"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    produto_generico_id = Column(UUID(as_uuid=True), ForeignKey("produtos_genericos.id"), nullable=True)
    nome = Column(String, index=True)
    validade = Column(Date, nullable=True)
    comprado = Column(Boolean, default=False)
