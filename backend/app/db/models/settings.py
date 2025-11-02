from __future__ import annotations
import uuid
from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class UserSettings(Base):
    __tablename__ = "user_settings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, unique=True)

    # Preferências/consentimentos nível usuário
    allow_location: Mapped[bool] = mapped_column(Boolean, default=False)
    allow_notifications: Mapped[bool] = mapped_column(Boolean, default=False)
    allow_memory: Mapped[bool] = mapped_column(Boolean, default=False)
    allow_camera: Mapped[bool] = mapped_column(Boolean, default=False)
    allow_microphone: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
