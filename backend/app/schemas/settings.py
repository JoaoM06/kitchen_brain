from __future__ import annotations
import uuid
from pydantic import BaseModel, Field

class SettingsRead(BaseModel):
    user_id: uuid.UUID
    allow_location: bool = False
    allow_notifications: bool = False
    allow_memory: bool = False
    allow_camera: bool = False
    allow_microphone: bool = False

class SettingsUpdate(BaseModel):
    allow_location: bool | None = None
    allow_notifications: bool | None = None
    allow_memory: bool | None = None
    allow_camera: bool | None = None
    allow_microphone: bool | None = None
