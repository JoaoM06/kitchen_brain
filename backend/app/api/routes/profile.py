from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.auth import ProfileInput
from app.api.deps import get_current_user
from fastapi.security.http import HTTPAuthorizationCredentials, HTTPBearer

router = APIRouter(prefix="/profile", tags=["profile"])

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