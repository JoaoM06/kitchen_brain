from __future__ import annotations
import uuid
from datetime import datetime
from pydantic import BaseModel, Field

PermStatus = str  # "granted" | "denied" | "blocked" | "limited" | "prompt"

class DeviceCreate(BaseModel):
    platform: str          # "ios" | "android"
    model: str | None = None
    os_version: str | None = None
    app_version: str | None = None
    push_token: str | None = None

class DeviceRead(BaseModel):
    id: uuid.UUID
    platform: str
    model: str | None = None
    os_version: str | None = None
    app_version: str | None = None
    push_token: str | None = None
    p_location: PermStatus | None = None
    p_notifications: PermStatus | None = None
    p_camera: PermStatus | None = None
    p_microphone: PermStatus | None = None
    last_seen_at: datetime | None = None

class PermissionsUpdate(BaseModel):
    p_location: PermStatus | None = None
    p_notifications: PermStatus | None = None
    p_camera: PermStatus | None = None
    p_microphone: PermStatus | None = None
