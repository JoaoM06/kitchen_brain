from __future__ import annotations
import uuid

from sqlalchemy import String, Text, ForeignKey, Float, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class AnexoMidia(Base):
    __tablename__ = "anexos_midia"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    item_estoque_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("itens_estoque.id", ondelete="SET NULL"))
    url: Mapped[str] = mapped_column(String(1024))
    tipo: Mapped[str | None] = mapped_column(String(30))

    leituras_ocr: Mapped[list["LeituraOCR"]] = relationship(
        back_populates="anexo", cascade="all, delete-orphan"
    )


class LeituraOCR(Base):
    __tablename__ = "leituras_ocr"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    anexo_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("anexos_midia.id", ondelete="CASCADE"), index=True)
    texto: Mapped[str] = mapped_column(Text)
    confianca: Mapped[float | None] = mapped_column(Float)
    extra_json: Mapped[dict | None] = mapped_column(JSON)

    anexo: Mapped[AnexoMidia] = relationship(back_populates="leituras_ocr")
