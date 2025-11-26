from __future__ import annotations
import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

# status possíveis para a permissão no SO do aparelho
# (o app cliente envia esses valores)
PERM_STATUSES = ("granted", "denied", "blocked", "limited", "prompt")

class MobileDevice(Base):
    __tablename__ = "mobile_devices"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    platform: Mapped[str] = mapped_column(String(16))           # "ios" | "android"
    model: Mapped[str | None] = mapped_column(String(64))
    os_version: Mapped[str | None] = mapped_column(String(32))
    app_version: Mapped[str | None] = mapped_column(String(32))
    push_token: Mapped[str | None] = mapped_column(String(512)) # Expo/FCM/APNs token

    # snapshot de permissões no SO (enviado pelo app)
    p_location: Mapped[str | None] = mapped_column(String(16))     # granted/denied/blocked/limited/prompt
    p_notifications: Mapped[str | None] = mapped_column(String(16))
    p_camera: Mapped[str | None] = mapped_column(String(16))
    p_microphone: Mapped[str | None] = mapped_column(String(16))

    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
