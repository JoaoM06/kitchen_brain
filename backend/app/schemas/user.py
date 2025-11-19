from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr
from uuid import UUID

class UserBase(BaseModel):
    email: EmailStr
    nome: Optional[str] = None
    preferencias: Optional[Dict[str, Any]] = None
    alergias: Optional[List[str]] = None
    restricoes_alimentares: Optional[List[str]] = None
    cardapios: Optional[List[str]] = None

class UserCreate(UserBase):
    senha: str

class UserOut(UserBase):
    id: UUID
    fl_ativo: bool

    class Config:
        from_attributes = True