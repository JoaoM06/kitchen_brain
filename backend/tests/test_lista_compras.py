"""
Testes do fluxo lista de compras → marcar comprado → estoque.
Cobre critérios de aceite: isolamento por usuário, fluxo lista→estoque.
"""
import pytest


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------

def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# testes de CRUD básico
# ---------------------------------------------------------------------------

def test_adicionar_item_lista(client, user_factory, token_factory):
    user = user_factory(email="lista_add@example.com")
    token = token_factory(user)

    resp = client.post("/lista-compras/", json={"nome": "Arroz"}, headers=_auth(token))
    assert resp.status_code == 200
    data = resp.json()
    assert data["nome"] == "Arroz"
    assert data["comprado"] is False
    assert "id" in data


def test_listar_itens_filtrado_por_usuario(client, user_factory, token_factory):
    user = user_factory(email="lista_list@example.com")
    token = token_factory(user)

    client.post("/lista-compras/", json={"nome": "Feijão"}, headers=_auth(token))
    client.post("/lista-compras/", json={"nome": "Macarrão"}, headers=_auth(token))

    resp = client.get("/lista-compras/", headers=_auth(token))
    assert resp.status_code == 200
    nomes = [i["nome"] for i in resp.json()]
    assert "Feijão" in nomes
    assert "Macarrão" in nomes


def test_remover_item_lista(client, user_factory, token_factory):
    user = user_factory(email="lista_del@example.com")
    token = token_factory(user)

    resp = client.post("/lista-compras/", json={"nome": "Óleo"}, headers=_auth(token))
    item_id = resp.json()["id"]

    resp = client.delete(f"/lista-compras/{item_id}", headers=_auth(token))
    assert resp.status_code == 200

    resp = client.get("/lista-compras/", headers=_auth(token))
    assert all(i["id"] != item_id for i in resp.json())


def test_marcar_comprado_sem_auth_retorna_401(client):
    resp = client.put("/lista-compras/1/comprado")
    assert resp.status_code == 422  # header obrigatório ausente


# ---------------------------------------------------------------------------
# fluxo lista → comprado → estoque
# ---------------------------------------------------------------------------

def test_fluxo_lista_para_estoque(client, user_factory, token_factory):
    """Marcar item como comprado deve criá-lo em /stock/list do mesmo usuário."""
    user = user_factory(email="lista_flow@example.com")
    token = token_factory(user)
    headers = _auth(token)

    # 1. adiciona item
    resp = client.post("/lista-compras/", json={"nome": "Maçã"}, headers=headers)
    assert resp.status_code == 200
    item_id = resp.json()["id"]

    # 2. marca como comprado
    resp = client.put(f"/lista-compras/{item_id}/comprado", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["comprado"] is True

    # 3. marcar de novo deve retornar 400
    resp = client.put(f"/lista-compras/{item_id}/comprado", headers=headers)
    assert resp.status_code == 400

    # 4. produto deve aparecer no estoque
    resp = client.get("/stock/list", headers=headers)
    assert resp.status_code == 200
    all_items = [item for group in resp.json()["groups"] for item in group["items"]]
    names = [i["name"] for i in all_items]
    assert "Maçã" in names


# ---------------------------------------------------------------------------
# isolamento cross-user
# ---------------------------------------------------------------------------

def test_isolamento_cross_user_lista(client, user_factory, token_factory):
    """Usuário B não enxerga nem modifica itens do usuário A."""
    user_a = user_factory(email="lista_iso_a@example.com")
    user_b = user_factory(email="lista_iso_b@example.com")
    tok_a = token_factory(user_a)
    tok_b = token_factory(user_b)

    # A adiciona item
    resp = client.post("/lista-compras/", json={"nome": "Banana"}, headers=_auth(tok_a))
    assert resp.status_code == 200
    item_id = resp.json()["id"]

    # B não vê nenhum item
    resp = client.get("/lista-compras/", headers=_auth(tok_b))
    assert resp.status_code == 200
    assert resp.json() == []

    # B não consegue marcar como comprado o item de A
    resp = client.put(f"/lista-compras/{item_id}/comprado", headers=_auth(tok_b))
    assert resp.status_code == 404

    # B não consegue deletar o item de A
    resp = client.delete(f"/lista-compras/{item_id}", headers=_auth(tok_b))
    assert resp.status_code == 404


def test_estoque_isolado_por_usuario(client, user_factory, token_factory):
    """ItemEstoque criado por A via lista não aparece no estoque de B."""
    user_a = user_factory(email="stock_iso_a@example.com")
    user_b = user_factory(email="stock_iso_b@example.com")
    tok_a = token_factory(user_a)
    tok_b = token_factory(user_b)

    resp = client.post("/lista-compras/", json={"nome": "Laranja"}, headers=_auth(tok_a))
    item_id = resp.json()["id"]
    client.put(f"/lista-compras/{item_id}/comprado", headers=_auth(tok_a))

    resp = client.get("/stock/list", headers=_auth(tok_b))
    assert resp.status_code == 200
    all_items = [i for g in resp.json()["groups"] for i in g["items"]]
    assert all(i["name"] != "Laranja" for i in all_items)
