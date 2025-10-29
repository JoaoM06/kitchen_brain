from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models.user import User
from sqlalchemy.orm import Session
from app.db.models.items import Item
from app.schemas.itensEstoque import ItemCreate, ItemUpdate
from schemas.itensEstoque import ItemOut

def get_item(db: Session, item_id: int):
    return db.query(Item).filter(Item.id == item_id).first()

def create_item(db: Session, item: ItemCreate):
    db_item = Item(
        nome=item.nome,
        secoes=",".join(item.secoes),
        categorias=",".join(item.categorias),
        validade=item.validade,
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def update_item(db: Session, item_id: int, item: ItemUpdate):
    db_item = get_item(db, item_id)
    if not db_item:
        return None
    db_item.nome = item.nome
    db_item.secoes = ",".join(item.secoes)
    db_item.categorias = ",".join(item.categorias)
    db_item.validade = item.validade
    db.commit()
    db.refresh(db_item)
    return db_item

def delete_item(db: Session, item_id: int):
    db_item = get_item(db, item_id)
    if db_item:
        db.delete(db_item)
        db.commit()
    return db_item

router = APIRouter(prefix="/stock", tags=["stock"])

@router.post("/item", response_model=ItemOut)
def criar_item(item: ItemCreate, db: Session = Depends(get_db)):
    return create_item(db, item)

@router.get("/itens/{item_id}", response_model=ItemOut)
def obter_item(item_id: int, db: Session = Depends(get_db)):
    db_item = get_item(db, item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    return db_item