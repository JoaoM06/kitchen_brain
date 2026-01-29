def test_criar_e_obter_item(client):
    # Cria item
    item_data = {
        "nome": "Arroz",
        "secoes": ["Cereais", "Grãos"],
        "categorias": ["Alimento"],
        "validade": "2026-01-01"
    }

    response = client.post("/stock/item", json=item_data)
    assert response.status_code == 200

    data = response.json()
    assert data["nome"] == "Arroz"
    assert "id" in data

    # Obtém item
    item_id = data["id"]
    response_get = client.get(f"/stock/itens/{item_id}")
    assert response_get.status_code == 200

    data_get = response_get.json()
    assert data_get["nome"] == "Arroz"
    assert "Cereais" in data_get["secoes"]
