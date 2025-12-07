from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models.lista_compras import ListaComprasBase
from app.db.models.items import Item
from app.schemas.lista_compras import ListaComprasCriar, ListaComprasOut
from app.schemas.itensEstoque import ItemCreate
from app.api.routes.stock import create_item, delete_item

router = APIRouter(prefix="/lista-compras", tags=["Lista de Compras"])

@router.post("/", response_model=ListaComprasOut)
def add_lista_compras(item: ListaComprasCriar, db: Session = Depends(get_db)):
    db_item = ListaComprasBase(
        nome=item.nome,
        secoes=",".join(item.secoes),
        categorias=",".join(item.categorias),
        validade=item.validade,
        comprado=False
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@router.get("/", response_model=list[ListaComprasOut])
def listar_lista_compras(db: Session = Depends(get_db)):
    items = db.query(ListaComprasBase).all()
    for i in items:
        i.secoes = i.secoes.split(",") if i.secoes else []
        i.categorias = i.categorias.split(",") if i.categorias else []
    return items


@router.put("/{item_id}/comprado", response_model=ListaComprasOut)
def item_comprado(item_id: int, db: Session = Depends(get_db)):
    item = db.query(ListaComprasBase).filter(ListaComprasBase.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado na lista de compras")

    if item.comprado:
        raise HTTPException(status_code=400, detail="Item já foi comprado")

    item.comprado = True
    db.commit()
    db.refresh(item)
    
    stock_item = ItemCreate(
        nome=item.nome,
        secoes=item.secoes.split(","),
        categorias=item.categorias.split(","),
        validade=item.validade,
    )
    create_item(db, stock_item)

    return item


@router.delete("/{item_id}")
def remover_lista_compras(item_id: int, db: Session = Depends(get_db)):
    item = db.query(ListaComprasBase).filter(ListaComprasBase.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado na lista de compras")

    db.delete(item)
    db.commit()
    return {"message": "Item removido da lista de compras com sucesso"}