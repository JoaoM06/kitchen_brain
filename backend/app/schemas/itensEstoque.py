from pydantic import BaseModel, EmailStr, Field
from datetime import date

class ItemBase(BaseModel):
    nome: str
    secoes: list[str]
    categorias: list[str]
    validade: date

class ItemCreate(ItemBase):
    pass

class ItemUpdate(ItemBase):
    pass

class ItemOut(ItemBase):
    id: int
    class Config:
        orm_mode = True