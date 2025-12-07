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
