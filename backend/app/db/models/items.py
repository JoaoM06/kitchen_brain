from __future__ import annotations

from sqlalchemy import String, Column, Date, Integer

from app.db.base import Base

class Item(Base):
    __tablename__ = "itens"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, index=True)
    secoes = Column(String)
    categorias = Column(String)
    validade = Column(Date)