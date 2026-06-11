"""Testes do upload seguro de foto de perfil (card 10)."""
import io
import os

from app.core.config import settings

PNG_MAGIC = b"\x89PNG\r\n\x1a\n"
JPEG_MAGIC = b"\xff\xd8\xff\xe0"
WEBP_MAGIC = b"RIFF\x00\x00\x00\x00WEBP"


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def _upload(client, token, filename, data, content_type):
    return client.post(
        "/profile/photo",
        headers=_auth(token),
        files={"file": (filename, io.BytesIO(data), content_type)},
    )


def test_upload_png_valido_200(client, user_factory, token_factory, tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "MEDIA_ROOT", str(tmp_path))
    user = user_factory()
    token = token_factory(user)

    resp = _upload(client, token, "foto.png", PNG_MAGIC + b"\x00" * 256, "image/png")
    assert resp.status_code == 200
    foto_url = resp.json()["foto_url"]
    assert foto_url.endswith(".png")
    # arquivo realmente gravado
    assert os.path.exists(tmp_path / "photos" / f"{user.id}.png")


def test_upload_webp_valido_200(client, user_factory, token_factory, tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "MEDIA_ROOT", str(tmp_path))
    user = user_factory()
    token = token_factory(user)

    resp = _upload(client, token, "foto.webp", WEBP_MAGIC + b"\x00" * 64, "image/webp")
    assert resp.status_code == 200
    assert resp.json()["foto_url"].endswith(".webp")


def test_upload_svg_rejeitado_415(client, user_factory, token_factory, tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "MEDIA_ROOT", str(tmp_path))
    user = user_factory()
    token = token_factory(user)

    resp = _upload(client, token, "foto.svg", b"<svg><script>alert(1)</script></svg>", "image/svg+xml")
    assert resp.status_code == 415


def test_upload_txt_renomeado_jpg_415_por_magic_bytes(
    client, user_factory, token_factory, tmp_path, monkeypatch
):
    monkeypatch.setattr(settings, "MEDIA_ROOT", str(tmp_path))
    user = user_factory()
    token = token_factory(user)

    # content-type diz image/jpeg, mas o conteúdo é texto → magic bytes não batem.
    resp = _upload(client, token, "fake.jpg", b"isto eh texto, nao imagem", "image/jpeg")
    assert resp.status_code == 415


def test_upload_acima_de_5mb_413(client, user_factory, token_factory, tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "MEDIA_ROOT", str(tmp_path))
    user = user_factory()
    token = token_factory(user)

    big = PNG_MAGIC + b"\x00" * (6 * 1024 * 1024)
    resp = _upload(client, token, "grande.png", big, "image/png")
    assert resp.status_code == 413
    # não deve restar arquivo parcial
    assert not os.path.exists(tmp_path / "photos" / f"{user.id}.png")


def test_upload_sem_token_401(client, tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "MEDIA_ROOT", str(tmp_path))
    resp = client.post(
        "/profile/photo",
        files={"file": ("foto.png", io.BytesIO(PNG_MAGIC), "image/png")},
    )
    assert resp.status_code in (401, 422)  # sem header Authorization
