from __future__ import annotations
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models.settings import UserSettings
from app.db.models.lgpd import Consentimento
from app.schemas.settings import SettingsRead, SettingsUpdate

from app.api.deps import get_current_user

router = APIRouter()

CONSENTS = {
    "allow_location": "location",
    "allow_notifications": "notifications",
    "allow_memory": "memory",
    "allow_camera": "camera",
    "allow_microphone": "microphone",
}

def _get_or_create_user_settings(db: Session, user_id):
    us = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
    if not us:
        us = UserSettings(user_id=user_id)
        db.add(us)
        db.flush()
    return us

def _set_consent(db: Session, user_id, escopo: str, granted: bool):
    # se granted=True e não existe consentimento ativo -> cria
    # se granted=False e existe ativo -> marca revogado_em
    active = (
        db.query(Consentimento)
        .filter(Consentimento.usuario_id == user_id, Consentimento.escopo == escopo, Consentimento.revogado_em.is_(None))
        .first()
    )
    now = datetime.now(timezone.utc)
    if granted and not active:
        db.add(Consentimento(usuario_id=user_id, escopo=escopo, concedido_em=now))
    elif not granted and active:
        active.revogado_em = now

@router.get("/me/settings", response_model=SettingsRead)
def get_my_settings(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    us = _get_or_create_user_settings(db, current_user.id)
    db.commit()  # persiste caso tenha sido criado
    return SettingsRead(
        user_id=current_user.id,
        allow_location=us.allow_location,
        allow_notifications=us.allow_notifications,
        allow_memory=us.allow_memory,
        allow_camera=us.allow_camera,
        allow_microphone=us.allow_microphone,
    )

@router.patch("/me/settings", response_model=SettingsRead)
def update_my_settings(payload: SettingsUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    us = _get_or_create_user_settings(db, current_user.id)

    # atualiza flags e registra consentimentos/revogação
    for field, escopo in CONSENTS.items():
        val = getattr(payload, field)
        if val is None:
            continue
        setattr(us, field, bool(val))
        _set_consent(db, current_user.id, escopo, bool(val))

    db.add(us)
    db.commit()
    db.refresh(us)
    return SettingsRead(
        user_id=current_user.id,
        allow_location=us.allow_location,
        allow_notifications=us.allow_notifications,
        allow_memory=us.allow_memory,
        allow_camera=us.allow_camera,
        allow_microphone=us.allow_microphone,
    )
