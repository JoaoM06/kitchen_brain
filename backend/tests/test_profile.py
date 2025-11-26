from app.api.routes.profile import profile_post, profile_data
from app.db.models.user import User
from app.schemas.auth import ProfileInput
from unittest.mock import MagicMock, patch


def test_profilePost():
    user = User(id=1, email="test@example.com")
    body = ProfileInput(nome = "Tais", preferencias= ["Tomate", "Queijo"], alergias=["Banana"], restricoes_alimentares=[], bio="Labubu")
    def returnUser(_cred, _datab):
        return user
    with patch("app.api.routes.profile.get_current_user", returnUser):
        profile_post(body, db=MagicMock(), auth=MagicMock())
    assert user.nome == "Tais"
    assert user.preferencias == ["Tomate", "Queijo"]
    assert user.alergias == ["Banana"]
    assert user.restricoes_alimentares == []
    assert user.bio == "Labubu"

def test_profile_data():
    user = User(id=1, email="test@example.com", nome = "Tais", preferencias= ["Tomate", "Queijo"], alergias=["Banana"], restricoes_alimentares=[], bio="Labubu")
    def returnUser(_cred, _datab):
        return user
    with patch("app.api.routes.profile.get_current_user", returnUser):
        profile_data(db=MagicMock(), auth=MagicMock())
    assert user.nome == "Tais"
    assert user.preferencias == ["Tomate", "Queijo"]
    assert user.alergias == ["Banana"]
    assert user.restricoes_alimentares == []
    assert user.bio == "Labubu"