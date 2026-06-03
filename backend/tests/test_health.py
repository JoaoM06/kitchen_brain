from unittest.mock import MagicMock


def test_readiness_returns_200(client):
    r = client.get("/health/ready")
    assert r.status_code == 200
    data = r.json()
    assert data["ok"] is True
    assert data["db"] == "up"


def test_liveness_returns_200(client):
    r = client.get("/health/liveness")
    assert r.status_code == 200
    assert r.json()["ok"] is True


def test_readiness_returns_503_on_db_failure(client, monkeypatch):
    import app.api.routes.health as health_module

    mock_engine = MagicMock()
    mock_engine.connect.side_effect = Exception("connection refused")
    monkeypatch.setattr(health_module, "engine", mock_engine)

    r = client.get("/health/ready")
    assert r.status_code == 503
    assert r.json()["ok"] is False
