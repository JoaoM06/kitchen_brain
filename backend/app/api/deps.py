from fastapi import Depends, HTTPException, status, Header
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import ALGO
from app.db.session import get_db
from app.db.models.user import User

def get_current_user(
    authorization: str = Header(...),
    db: Session = Depends(get_db)
) -> User:
    try:
        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Formato inválido do header Authorization")
        token = authorization.split("Bearer ")[1]
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGO])
        email: str = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    return user

