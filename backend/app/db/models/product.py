from __future__ import annotations
import uuid
from datetime import datetime
from sqlalchemy import String, ForeignKey, UniqueConstraint, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional, List
from app.db.base import Base

class ProdutoGenerico(Base):
    __tablename__ = "produtos_genericos"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome: Mapped[str] = mapped_column(String(180))
    nome_normalizado: Mapped[str] = mapped_column(String(180))
    url_imagem: Mapped[Optional[str]] = mapped_column(String(512))
    categoria: Mapped[Optional[str]] = mapped_column(String(120))
    produtos: Mapped[List["Produto"]] = relationship(
        "Produto", back_populates="generico", cascade="all, delete-orphan"
    )

class Produto(Base):
    __tablename__ = "produtos"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome: Mapped[str] = mapped_column(String(180))
    marca: Mapped[str | None] = mapped_column(String(120))
    categoria: Mapped[str | None] = mapped_column(String(120))

    codigos: Mapped[list["CodigoBarras"]] = relationship(
        back_populates="produto", cascade="all, delete-orphan"
    )
    itens: Mapped[list["ItemEstoque"]] = relationship(  # definido em storage.py
        back_populates="produto"
    )
    id_generico: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("produtos_genericos.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    generico: Mapped["ProdutoGenerico"] = relationship(
        "ProdutoGenerico", back_populates="produtos"
    )

    __table_args__ = (
        UniqueConstraint("nome", "marca", name="uq_produto_nome_marca"),
    )

class CodigoBarras(Base):
    __tablename__ = "codigos_barras"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    produto_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("produtos.id", ondelete="CASCADE"), index=True)
    valor: Mapped[str] = mapped_column(String(64))
    tipo: Mapped[str] = mapped_column(String(16), default="EAN13")

    produto: Mapped[Produto] = relationship(back_populates="codigos")

    __table_args__ = (UniqueConstraint("produto_id", "valor", name="uq_produto_codigo"),)
