from app.schemas.auth import ProfileInput


def test_profile_update_and_get(client, user_factory, db_session, token_factory):
    user = user_factory(email="perfil@kb.com", nome="Antes")
    token = token_factory(user)

    payload = ProfileInput(
        nome="Novo Nome",
        bio="Bio atualizada",
        preferencias=["Tomate", "Queijo"],
        alergias=["Amendoim"],
        restricoes_alimentares=["Veggie"],
    )

    response = client.post(
        "/profile/",
        headers={"Authorization": f"Bearer {token}"},
        json=payload.model_dump(),
    )
    assert response.status_code == 200

    db_session.refresh(user)
    assert user.nome == "Novo Nome"
    assert user.bio == "Bio atualizada"
    assert user.preferencias == payload.preferencias

    response = client.get("/profile/", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["nome"] == "Novo Nome"
    assert data["preferencias"] == payload.preferencias
