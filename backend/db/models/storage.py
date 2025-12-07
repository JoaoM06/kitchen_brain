from __future__ import annotations
import uuid
from decimal import Decimal
from sqlalchemy import String, Text, Date, ForeignKey, Numeric, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class LocalEstoque(Base):
    __tablename__ = "locais_estoque"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    nome: Mapped[str] = mapped_column(String(120))
    descricao: Mapped[str | None] = mapped_column(String(240))

    itens: Mapped[list["ItemEstoque"]] = relationship(back_populates="local")

class ItemEstoque(Base):
    __tablename__ = "itens_estoque"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    produto_generico_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("produtos_genericos.id", ondelete="RESTRICT"), index=True
    )
    local_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("locais_estoque.id", ondelete="SET NULL"), nullable=True)

    quantidade: Mapped[Decimal] = mapped_column(Numeric(12, 3), default=0)
    unidade: Mapped[str] = mapped_column(String(8), default="UN")  # UN, G, KG, ML, L...
    validade: Mapped[Date | None] = mapped_column(Date, nullable=True)
    observacoes: Mapped[str | None] = mapped_column(Text)
    produto_generico: Mapped["ProdutoGenerico"] = relationship(
        "ProdutoGenerico", back_populates="itens_estoque"
    )
    local: Mapped["LocalEstoque"] = relationship(back_populates="itens")
    movimentos: Mapped[list["MovimentoEstoque"]] = relationship(
        back_populates="item", cascade="all, delete-orphan"
    )

class MovimentoEstoque(Base):
    __tablename__ = "movimentos_estoque"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("itens_estoque.id", ondelete="CASCADE"), index=True)
    tipo: Mapped[str] = mapped_column(String(16))  # ENTRADA, SAIDA, TRANSFERENCIA
    quantidade: Mapped[Decimal] = mapped_column(Numeric(12, 3))
    de_local_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("locais_estoque.id", ondelete="SET NULL"))
    para_local_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("locais_estoque.id", ondelete="SET NULL"))
    motivo: Mapped[str | None] = mapped_column(String(180))

    item: Mapped[ItemEstoque] = relationship(back_populates="movimentos")
    de_local: Mapped["LocalEstoque"] = relationship(foreign_keys=[de_local_id])
    para_local: Mapped["LocalEstoque"] = relationship(foreign_keys=[para_local_id])

    __table_args__ = (
        CheckConstraint("quantidade > 0", name="ck_mov_qtd_pos"),
    )
