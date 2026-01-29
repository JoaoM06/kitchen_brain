from datetime import date, timedelta
from decimal import Decimal

from app.db.models.product import Produto
from app.db.models.storage import ItemEstoque, LocalEstoque


def test_get_my_pantry_returns_items_with_statuses(
    client, user_factory, token_factory, db_session
):
    user = user_factory(email="pantry@kb.com")
    token = token_factory(user)

    product = Produto(nome="Iogurte")
    location = LocalEstoque(usuario_id=user.id, nome="Geladeira")
    db_session.add_all([product, location])
    db_session.flush()

    items = [
        ItemEstoque(
            usuario_id=user.id,
            produto_id=product.id,
            local_id=location.id,
            quantidade=Decimal("2"),
            unidade="UN",
            validade=date.today() + timedelta(days=10),
        ),
        ItemEstoque(
            usuario_id=user.id,
            produto_id=product.id,
            local_id=location.id,
            quantidade=Decimal("1"),
            unidade="UN",
            validade=date.today() + timedelta(days=2),
        ),
        ItemEstoque(
            usuario_id=user.id,
            produto_id=product.id,
            local_id=location.id,
            quantidade=Decimal("1"),
            unidade="UN",
            validade=date.today() - timedelta(days=1),
        ),
        ItemEstoque(
            usuario_id=user.id,
            produto_id=product.id,
            local_id=None,
            quantidade=Decimal("1"),
            unidade="UN",
            validade=None,
        ),
    ]
    db_session.add_all(items)
    db_session.commit()

    response = client.get("/me/pantry", params={"token": token})
    assert response.status_code == 200
    data = response.json()["items"]
    statuses = {entry["status"] for entry in data}
    assert statuses == {"ok", "danger", "expired"}
    assert any(item["location"] == "Geladeira" for item in data)
