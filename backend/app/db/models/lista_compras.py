from sqlalchemy import Column, Integer, String, Date, Boolean, ForeignKey
from app.db.base import Base

class ListaComprasBase(Base):
    __tablename__ = "lista_compras"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, index=True)
    secoes = Column(String)
    categorias = Column(String)
    validade = Column(Date, nullable=True)
    comprado = Column(Boolean, default=False)