from __future__ import annotations
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import String, DateTime, ForeignKey, Numeric, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Mercado(Base):
    __tablename__ = "mercados"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome: Mapped[str] = mapped_column(String(180))
    endereco: Mapped[str | None] = mapped_column(String(240))
    cidade: Mapped[str | None] = mapped_column(String(120))
    uf: Mapped[str | None] = mapped_column(String(2))

    precos: Mapped[list["PrecoProduto"]] = relationship(back_populates="mercado")


class PrecoProduto(Base):
    __tablename__ = "precos_produto"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    produto_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("produtos.id", ondelete="CASCADE"), index=True)
    mercado_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("mercados.id", ondelete="CASCADE"), index=True)
    preco: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    coletado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    produto: Mapped["Produto"] = relationship()
    mercado: Mapped[Mercado] = relationship(back_populates="precos")

    __table_args__ = (
        UniqueConstraint("produto_id", "mercado_id", "coletado_em", name="uq_preco_coleta"),
    )
