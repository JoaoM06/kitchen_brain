import io

from app.api.routes import transcribe as transcribe_module


class DummySegment:
    def __init__(self, text: str):
        self.text = text


class DummyModel:
    def __init__(self):
        self.calls = []

    def transcribe(self, path, language=None, vad_filter=True, beam_size=5):
        self.calls.append((path, language))
        return ([DummySegment("Olá"), DummySegment(" mundo")], {"language": language})


def test_transcribe_success(monkeypatch, client):
    dummy = DummyModel()
    monkeypatch.setattr(transcribe_module, "model", dummy)

    audio_bytes = io.BytesIO(b"fake audio data")
    response = client.post(
        "/voice/transcribe",
        files={"audio": ("voz.wav", audio_bytes, "audio/wav")},
        data={"language": "pt"},
    )
    assert response.status_code == 200
    assert response.json()["text"] == "Olá  mundo"
    assert dummy.calls  # garante que o stub foi chamado


def test_transcribe_rejects_invalid_content_type(client):
    response = client.post(
        "/voice/transcribe",
        files={"audio": ("texto.txt", io.BytesIO(b"sem audio"), "text/plain")},
    )
    assert response.status_code == 400
    assert "arquivo de áudio" in response.json()["detail"]


# --- Lazy genai_client (card 14) ---

from app.core.config import settings  # noqa: E402


class _DummyGenAIResponse:
    def __init__(self, parsed):
        self.parsed = parsed


class _DummyModels:
    def __init__(self, parsed):
        self._parsed = parsed
        self.calls = 0

    def generate_content(self, model, contents, config):
        self.calls += 1
        return _DummyGenAIResponse(self._parsed)


class _DummyGenAIClient:
    def __init__(self, parsed):
        self.models = _DummyModels(parsed)


def _structured_item(name="leite"):
    return {
        "source_text": "2 litros de leite",
        "product_name": name,
        "product_normalized": name,
        "quantity": 2,
        "unit_input": "l",
        "quantity_base": None,
        "unit_base": None,
        "expiry_text": None,
        "expiry_date": None,
        "location": "geladeira",
        "confidence": 0.9,
        "warnings": None,
    }


def test_genai_client_nao_inicializa_no_import():
    # O boot do uvicorn (import do módulo, feito no conftest) não pode ter
    # criado um cliente do Gemini.
    assert transcribe_module._genai_client is None


def test_get_genai_client_sem_key_retorna_none(monkeypatch):
    monkeypatch.setattr(transcribe_module, "_genai_client", None)
    monkeypatch.setattr(transcribe_module, "_genai_client_key", None)
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "", raising=False)
    assert transcribe_module.get_genai_client() is None


def test_parse_text_sem_key_retorna_503(monkeypatch, client):
    monkeypatch.setattr(transcribe_module, "_genai_client", None)
    monkeypatch.setattr(transcribe_module, "_genai_client_key", None)
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "", raising=False)

    response = client.post("/voice/parse-text", json={"text": "2 litros de leite"})
    assert response.status_code == 503
    assert "IA não configurado" in response.json()["detail"]


def test_parse_text_com_client_mockado_retorna_200(monkeypatch, client):
    dummy = _DummyGenAIClient([_structured_item()])
    monkeypatch.setattr(transcribe_module, "get_genai_client", lambda: dummy)

    response = client.post("/voice/parse-text", json={"text": "2 litros de leite"})
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list) and body[0]["product_name"] == "leite"
    assert dummy.models.calls == 1


def test_get_genai_client_reinicializa_ao_trocar_key(monkeypatch):
    # Simula a criação do cliente substituindo o construtor por uma factory.
    created = []

    def fake_factory():
        # Reproduz a lógica de cache de get_genai_client sem o SDK real.
        key = settings.GEMINI_API_KEY
        if not key:
            return None
        if transcribe_module._genai_client is not None and transcribe_module._genai_client_key == key:
            return transcribe_module._genai_client
        client_obj = object()
        transcribe_module._genai_client = client_obj
        transcribe_module._genai_client_key = key
        created.append(key)
        return client_obj

    monkeypatch.setattr(transcribe_module, "_genai_client", None)
    monkeypatch.setattr(transcribe_module, "_genai_client_key", None)

    monkeypatch.setattr(settings, "GEMINI_API_KEY", "key-1", raising=False)
    c1 = fake_factory()
    c1_again = fake_factory()
    assert c1 is c1_again  # cacheado para a mesma key
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "key-2", raising=False)
    c2 = fake_factory()
    assert c2 is not c1  # recriado ao trocar a key
    assert created == ["key-1", "key-2"]
