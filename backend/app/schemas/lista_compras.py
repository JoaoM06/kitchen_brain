from pydantic import BaseModel
from datetime import date

class BaseListaCompras(BaseModel):
    nome: str
    secoes: list[str]
    categorias: list[str]
    validade: date | None = None
    comprado: bool = False

class ListaComprasCriar(BaseListaCompras):
    pass

class ListaComprasOut(BaseListaCompras):
    id: int

    class Config:
        orm_mode = True