from app.db.models.user import User


def test_register_creates_user(client, db_session):
    payload = {
        "email": "nova@kitchen.com",
        "nome": "Nova Pessoa",
        "senha": "SenhaMuitoSegura1",
        "preferencias": None,
        "alergias": None,
        "restricoes_alimentares": None,
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == payload["email"].lower()
    created = db_session.query(User).filter_by(email=payload["email"].lower()).one()
    assert created.senha_hash != payload["senha"]
    assert created.fl_ativo is True


def test_register_duplicate_email_returns_400(client, user_factory):
    user_factory(email="duplicado@kitchen.com")
    payload = {
        "email": "duplicado@kitchen.com",
        "nome": "X",
        "senha": "SenhaMuitoSegura1",
        "preferencias": None,
        "alergias": None,
        "restricoes_alimentares": None,
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 400
    assert "Email já cadastrado" in response.json()["detail"]


def test_login_returns_token(client, user_factory):
    user = user_factory(email="login@kb.com", senha="Senha12345")
    response = client.post(
        "/auth/login",
        json={"email": user.email, "senha": "Senha12345"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["token_type"] == "bearer"
    assert isinstance(data["access_token"], str) and data["access_token"]


def test_login_wrong_password(client, user_factory):
    user = user_factory(email="erro@kb.com", senha="Senha12345")
    response = client.post(
        "/auth/login",
        json={"email": user.email, "senha": "SenhaErrada"},
    )
    assert response.status_code == 401
    assert "Senha incorreta" in response.json()["detail"]


def test_login_inactive_user(client, user_factory, db_session):
    user = user_factory(email="inativo@kb.com", senha="Senha12345")
    user.fl_ativo = False
    db_session.commit()
    response = client.post(
        "/auth/login",
        json={"email": user.email, "senha": "Senha12345"},
    )
    assert response.status_code == 403
    assert "Usuário inativo" in response.json()["detail"]
