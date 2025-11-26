from __future__ import annotations
import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import (
    String, Text, Integer, Date, ForeignKey, Table, UniqueConstraint, Column
)
from sqlalchemy.dialects.postgresql import UUID, NUMERIC
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


# ---- Tabelas de associação (N:N)
playlist_receita = Table(
    "playlist_receita",
    Base.metadata,
    # sem PK explícita; par único
    Column("playlist_id", UUID(as_uuid=True), ForeignKey("playlists.id", ondelete="CASCADE"), index=True, nullable=False),
    Column("receita_id",  UUID(as_uuid=True), ForeignKey("receitas.id",  ondelete="CASCADE"), index=True, nullable=False),
    UniqueConstraint("playlist_id", "receita_id", name="uq_playlist_receita"),
)

refeicao_receita = Table(
    "refeicao_receita",
    Base.metadata,
    Column("refeicao_id", UUID(as_uuid=True), ForeignKey("refeicoes.id", ondelete="CASCADE"), index=True, nullable=False),
    Column("receita_id",  UUID(as_uuid=True), ForeignKey("receitas.id",  ondelete="CASCADE"), index=True, nullable=False),
    UniqueConstraint("refeicao_id", "receita_id", name="uq_refeicao_receita"),
)


class Receita(Base):
    __tablename__ = "receitas"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    titulo: Mapped[str] = mapped_column(String(180))
    descricao: Mapped[str | None] = mapped_column(Text)
    rendimento_porcoes: Mapped[int] = mapped_column(Integer, default=1)
    tempo_preparo_min: Mapped[int] = mapped_column(Integer, default=0)

    ingredientes: Mapped[list["IngredienteReceita"]] = relationship(
        back_populates="receita", cascade="all, delete-orphan"
    )
    playlists: Mapped[list["Playlist"]] = relationship(
        secondary=playlist_receita, back_populates="receitas"
    )
    refeicoes: Mapped[list["Refeicao"]] = relationship(
        secondary=refeicao_receita, back_populates="receitas"
    )
    importacao: Mapped["ImportacaoReceita"] = relationship(
        back_populates="receita", uselist=False, cascade="all, delete-orphan"
    )


class IngredienteReceita(Base):
    __tablename__ = "ingredientes_receita"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    receita_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("receitas.id", ondelete="CASCADE"), index=True)
    produto_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("produtos.id"), nullable=True, index=True)
    nome_livre: Mapped[str | None] = mapped_column(String(180))
    quantidade: Mapped[Decimal | None] = mapped_column(NUMERIC(12, 3))
    unidade: Mapped[str | None] = mapped_column(String(16))
    observacoes: Mapped[str | None] = mapped_column(String(240))

    receita: Mapped[Receita] = relationship(back_populates="ingredientes")
    produto: Mapped["Produto"] = relationship()


class Playlist(Base):
    __tablename__ = "playlists"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    nome: Mapped[str] = mapped_column(String(120))
    descricao: Mapped[str | None] = mapped_column(Text)

    receitas: Mapped[list[Receita]] = relationship(
        secondary=playlist_receita, back_populates="playlists"
    )


class Cardapio(Base):
    __tablename__ = "cardapios"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    titulo: Mapped[str] = mapped_column(String(120))
    inicio: Mapped[date | None] = mapped_column(Date, nullable=True)
    fim: Mapped[date | None] = mapped_column(Date, nullable=True)

    refeicoes: Mapped[list["Refeicao"]] = relationship(
        back_populates="cardapio", cascade="all, delete-orphan"
    )


class Refeicao(Base):
    __tablename__ = "refeicoes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cardapio_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("cardapios.id", ondelete="CASCADE"), index=True)
    data: Mapped[date] = mapped_column(Date, nullable=False)
    tipo: Mapped[str] = mapped_column(String(12))  # CAFE, ALMOCO, JANTA, LANCHE
    observacoes: Mapped[str | None] = mapped_column(Text)

    cardapio: Mapped[Cardapio] = relationship(back_populates="refeicoes")
    receitas: Mapped[list[Receita]] = relationship(
        secondary=refeicao_receita, back_populates="refeicoes"
    )


class ImportacaoReceita(Base):
    __tablename__ = "importacoes_receita"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    receita_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("receitas.id", ondelete="CASCADE"), unique=True, index=True)
    fonte: Mapped[str | None] = mapped_column(String(120))
    url: Mapped[str | None] = mapped_column(String(512))

    receita: Mapped[Receita] = relationship(back_populates="importacao")
