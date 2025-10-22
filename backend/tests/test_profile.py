from app.api.routes.profile import profilePost, profileData
from app.db.models.user import User
from app.schemas.auth import ProfileInput
from unittest.mock import MagicMock, patch


def test_profilePost():
    user = User(id=1, email="test@example.com")
    body = ProfileInput(nome = "Tais", preferencias= ["Tomate", "Queijo"], alergias=["Banana"], restricoes_alimentares=[], bio="Labubu")
    def returnUser(_cred, _datab):
        return user
    with patch("app.api.routes.profile.get_current_user", returnUser):
        profilePost(body, db=MagicMock(), auth=MagicMock())
    assert user.nome == "Tais"
    assert user.preferencias == ["Tomate", "Queijo"]
    assert user.alergias == ["Banana"]
    assert user.restricoes_alimentares == []
    assert user.bio == "Labubu"

def test_profileData():
    user = User(id=1, email="test@example.com", nome = "Tais", preferencias= ["Tomate", "Queijo"], alergias=["Banana"], restricoes_alimentares=[], bio="Labubu")
    def returnUser(_cred, _datab):
        return user
    with patch("app.api.routes.profile.get_current_user", returnUser):
        profileData(db=MagicMock(), auth=MagicMock())
    assert user.nome == "Tais"
    assert user.preferencias == ["Tomate", "Queijo"]
    assert user.alergias == ["Banana"]
    assert user.restricoes_alimentares == []
    assert user.bio == "Labubu"