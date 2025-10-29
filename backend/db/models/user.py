from __future__ import annotations
from datetime import datetime
from typing import Optional, List
import uuid

from sqlalchemy import String, Boolean, DateTime, func
from sqlalchemy.dialects.postgresql import JSONB, ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    nome: Mapped[Optional[str]] = mapped_column(String(255))
    senha_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    fl_ativo: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default="true", default=True
    )
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    preferencias: Mapped[Optional[dict]] = mapped_column(
        JSONB, nullable=True, default=None
    )
    alergias: Mapped[Optional[List[str]]] = mapped_column(
        ARRAY(String(100)), nullable=True, default=None
    )
    restricoes_alimentares: Mapped[Optional[List[str]]] = mapped_column(
        ARRAY(String(100)), nullable=True, default=None
    )