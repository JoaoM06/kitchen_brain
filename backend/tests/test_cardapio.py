from app.api.routes.profile import cardapio_post
from app.db.models.user import User
from unittest.mock import MagicMock, patch
from app.schemas.cardapio import CardapioInput

def test_cardapio_novo():
    user = User(id=1, email="test@example.com")
    body = CardapioInput(cardapio="Biscoitos Scooby de manhã")
    def returnUser(_cred, _datab):
        return user
    with patch("app.api.routes.profile.get_current_user", returnUser):
        cardapio_post(body, MagicMock(), MagicMock())
    assert user.cardapios == ["Biscoitos Scooby de manhã"]
    
def test_cardapio_adicionado():
    user = User(id=1, email="test@example.com", cardapios=["Agua de salsicha", "Estrela de chocolate"])
    body = CardapioInput(cardapio="Danoninho com azeitona")
    def returnUser(_cred, _datab):
        return user
    with patch("app.api.routes.profile.get_current_user", returnUser):
        cardapio_post(body, MagicMock(), MagicMock())
    assert user.cardapios == ["Agua de salsicha", "Estrela de chocolate", "Danoninho com azeitona"]