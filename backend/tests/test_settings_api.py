from app.db.models.settings import UserSettings
from app.db.models.lgpd import Consentimento


def test_get_settings_creates_defaults(client, user_factory, token_factory, db_session):
    user = user_factory(email="settings@kb.com")
    token = token_factory(user)

    response = client.get("/me/settings", params={"token": token})
    assert response.status_code == 200
    body = response.json()
    assert body["user_id"] == str(user.id)
    assert body["allow_location"] is False

    db_settings = db_session.query(UserSettings).filter_by(user_id=user.id).one()
    assert db_settings.allow_camera is False


def test_update_settings_registers_consents(client, user_factory, token_factory, db_session):
    user = user_factory(email="consent@kb.com")
    token = token_factory(user)

    payload = {
        "allow_location": True,
        "allow_notifications": True,
        "allow_memory": False,
        "allow_camera": True,
        "allow_microphone": True,
    }
    response = client.patch("/me/settings", params={"token": token}, json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["allow_location"] is True
    assert data["allow_memory"] is False

    consents = (
        db_session.query(Consentimento)
        .filter(Consentimento.usuario_id == user.id, Consentimento.revogado_em.is_(None))
        .all()
    )
    scopes = {c.escopo for c in consents}
    # allow_memory False não gera consentimento
    assert scopes == {"location", "notifications", "camera", "microphone"}

    # Revogar notificações
    response = client.patch(
        "/me/settings",
        params={"token": token},
        json={"allow_notifications": False},
    )
    assert response.status_code == 200
    revoked = (
        db_session.query(Consentimento)
        .filter(
            Consentimento.usuario_id == user.id,
            Consentimento.escopo == "notifications",
        )
        .all()
    )
    assert any(c.revogado_em is not None for c in revoked)
