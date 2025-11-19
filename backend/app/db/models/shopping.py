from __future__ import annotations
import uuid
from decimal import Decimal
from sqlalchemy import String, Boolean, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class ListaCompras(Base):
    __tablename__ = "listas_compras"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    nome: Mapped[str] = mapped_column(String(120), default="Lista de compras")
    status: Mapped[str] = mapped_column(String(24), default="ABERTA")

    itens: Mapped[list["ItemLista"]] = relationship(
        back_populates="lista", cascade="all, delete-orphan"
    )

class ItemLista(Base):
    __tablename__ = "itens_lista"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lista_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("listas_compras.id", ondelete="CASCADE"), index=True)
    produto_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("produtos.id"), nullable=True, index=True)
    nome_livre: Mapped[str | None] = mapped_column(String(180))
    quantidade: Mapped[Decimal | None] = mapped_column(Numeric(12, 3))
    unidade: Mapped[str | None] = mapped_column(String(16))
    feito: Mapped[bool] = mapped_column(Boolean, default=False)
    preco_estimado: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))

    lista: Mapped[ListaCompras] = relationship(back_populates="itens")
    produto: Mapped["Produto"] = relationship()
