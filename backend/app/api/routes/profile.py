from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models.user import User
from app.schemas.user import UserCreate, UserOut
from app.schemas.auth import Token, LoginInput, ProfileInput
from app.api.deps import get_current_user
from fastapi.security.http import HTTPAuthorizationCredentials, HTTPBearer
from app.core.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/profile", tags=["profile"])

@router.post("/profile")
def profile(body: ProfileInput, db: Session = Depends(get_db), auth: HTTPAuthorizationCredentials = Depends(HTTPBearer()),):
    user = get_current_user(auth.credentials, db)
    user.bio = body.bio
    if body.nome:
        user.nome = body.nome
    user.preferencias = body.preferencias
    user.alergias = body.alergias
    user.restricoes_alimentares = body.restricoes_alimentares
    db.commit()

@router.get("/profile")
def profile(db: Session = Depends(get_db), auth: HTTPAuthorizationCredentials = Depends(HTTPBearer()),):
    user = get_current_user(auth.credentials, db)
    return user