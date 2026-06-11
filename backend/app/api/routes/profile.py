import os
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.security.http import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.auth import ProfileInput

router = APIRouter(prefix="/profile", tags=["profile"])

# Apenas formatos raster comuns (SVG fica de fora: pode embutir <script> → XSS).
ALLOWED_IMAGE_TYPES = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
_UPLOAD_CHUNK = 64 * 1024


def _sniff_image_ext(head: bytes) -> Optional[str]:
    """Detecta o formato pelos magic bytes (não confia no content-type)."""
    if head[:3] == b"\xff\xd8\xff":
        return "jpg"
    if head[:8] == b"\x89PNG\r\n\x1a\n":
        return "png"
    if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        return "webp"
    return None

@router.post("/")
def profile_post(body: ProfileInput, db: Session = Depends(get_db), auth: HTTPAuthorizationCredentials = Depends(HTTPBearer()),):
    user = get_current_user(auth.credentials, db)
    user.bio = body.bio
    if body.nome:
        user.nome = body.nome
    user.preferencias = body.preferencias
    user.alergias = body.alergias
    user.restricoes_alimentares = body.restricoes_alimentares
    db.commit()

@router.get("/")
def profile_data(db: Session = Depends(get_db), auth: HTTPAuthorizationCredentials = Depends(HTTPBearer()),):
    user = get_current_user(auth.credentials, db)
    return user


@router.post("/photo")
async def upload_profile_photo(
    file: UploadFile = File(..., description="Imagem JPEG, PNG ou WEBP (até 5 MB)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload da foto de perfil com validação de tipo, conteúdo e tamanho.

    - Whitelist de content-type (JPEG/PNG/WEBP); SVG e demais → 415.
    - Confirmação por magic bytes (conteúdo precisa bater com o tipo).
    - Limite de 5 MB imposto em streaming (chunks), sem carregar tudo em memória.
    """
    content_type = (file.content_type or "").lower()
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Tipo não suportado. Envie uma imagem JPEG, PNG ou WEBP.",
        )

    # Primeiro chunk: valida os magic bytes antes de gravar qualquer coisa.
    first = await file.read(_UPLOAD_CHUNK)
    sniffed = _sniff_image_ext(first)
    if sniffed is None or ALLOWED_IMAGE_TYPES[content_type] != sniffed:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Conteúdo não corresponde a uma imagem JPEG, PNG ou WEBP válida.",
        )

    photos_dir = os.path.join(settings.MEDIA_ROOT, "photos")
    os.makedirs(photos_dir, exist_ok=True)
    dest = os.path.join(photos_dir, f"{current_user.id}.{sniffed}")

    size = 0
    try:
        with open(dest, "wb") as out:
            chunk = first
            while chunk:
                size += len(chunk)
                if size > settings.MAX_UPLOAD_BYTES:
                    raise HTTPException(
                        status_code=413,  # Content Too Large
                        detail="Imagem maior que o limite de 5 MB.",
                    )
                out.write(chunk)
                chunk = await file.read(_UPLOAD_CHUNK)
    except HTTPException:
        if os.path.exists(dest):
            os.remove(dest)
        raise

    foto_url = f"/media/photos/{current_user.id}.{sniffed}"
    current_user.foto_url = foto_url
    db.commit()
    return {"foto_url": foto_url}
