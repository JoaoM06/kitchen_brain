from __future__ import annotations
import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Consentimento(Base):
    __tablename__ = "consentimentos"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    escopo: Mapped[str] = mapped_column(String(120))
    versao_politica: Mapped[str | None] = mapped_column(String(32))
    concedido_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revogado_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class ExportacaoDados(Base):
    __tablename__ = "exportacoes_dados"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    formato: Mapped[str] = mapped_column(String(16), default="JSON")
    solicitado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    concluido_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    url_resultado: Mapped[str | None] = mapped_column(String(1024))


class ExclusaoConta(Base):
    __tablename__ = "exclusoes_conta"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    status: Mapped[str] = mapped_column(String(16), default="PENDENTE")  # PENDENTE/EFETIVADA/CANCELADA
    solicitado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    efetivado_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
