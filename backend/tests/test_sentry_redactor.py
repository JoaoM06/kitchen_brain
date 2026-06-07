"""
Testa o redactor before_send do Sentry (app/core/sentry.py):
- descarta erros HTTP 4xx;
- mantém 5xx e crashes;
- remove PII (Authorization, senha, token, cookie) de qualquer profundidade.
"""
from app.core.sentry import before_send, REDACTED


class _FakeHTTPError(Exception):
    def __init__(self, status_code):
        self.status_code = status_code


def test_descarta_erro_4xx():
    hint = {"exc_info": (None, _FakeHTTPError(404), None)}
    assert before_send({"message": "not found"}, hint) is None


def test_mantem_erro_5xx():
    hint = {"exc_info": (None, _FakeHTTPError(500), None)}
    event = {"message": "boom"}
    assert before_send(event, hint) == event


def test_mantem_crash_sem_status():
    hint = {"exc_info": (None, RuntimeError("crash"), None)}
    event = {"message": "crash"}
    assert before_send(event, hint) == event


def test_redige_authorization_header():
    event = {
        "request": {
            "headers": {"Authorization": "Bearer abc123", "Accept": "application/json"}
        }
    }
    result = before_send(event, None)
    assert result["request"]["headers"]["Authorization"] == REDACTED
    assert result["request"]["headers"]["Accept"] == "application/json"


def test_redige_campos_sensiveis_aninhados():
    event = {
        "request": {"data": {"email": "a@b.com", "senha": "supersecreta", "token": "xyz"}},
        "extra": {"nested": [{"password": "p"}]},
    }
    result = before_send(event, None)
    assert result["request"]["data"]["senha"] == REDACTED
    assert result["request"]["data"]["token"] == REDACTED
    assert result["request"]["data"]["email"] == "a@b.com"
    assert result["extra"]["nested"][0]["password"] == REDACTED
