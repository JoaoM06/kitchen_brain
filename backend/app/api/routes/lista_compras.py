from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models.lista_compras import ShoppingListItem
from app.db.models.items import Item
from app.schemas.lista_compras import ListaComprasCriar, ListaComprasOut
from app.schemas.itensEstoque import ItemCreate
from app.api.routes.stock import create_item, delete_item

router = APIRouter(prefix="/shopping-list", tags=["Shopping List"])

@router.post("/", response_model=ListaComprasOut)
def add_to_shopping_list(item: ListaComprasCriar, db: Session = Depends(get_db)):
    db_item = ShoppingListItem(
        nome=item.nome,
        secoes=",".join(item.secoes),
        categorias=",".join(item.categorias),
        validade=item.validade,
        purchased=False
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@router.get("/", response_model=list[ListaComprasOut])
def list_shopping_list(db: Session = Depends(get_db)):
    items = db.query(ShoppingListItem).all()
    for i in items:
        i.secoes = i.secoes.split(",") if i.secoes else []
        i.categorias = i.categorias.split(",") if i.categorias else []
    return items


@router.put("/{item_id}/purchase", response_model=ListaComprasOut)
def purchase_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(ShoppingListItem).filter(ShoppingListItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado na lista de compras")

    if item.purchased:
        raise HTTPException(status_code=400, detail="Item já foi comprado")

    item.purchased = True
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
def remove_from_shopping_list(item_id: int, db: Session = Depends(get_db)):
    item = db.query(ShoppingListItem).filter(ShoppingListItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado na lista de compras")

    db.delete(item)
    db.commit()
    return {"message": "Item removido da lista de compras com sucesso"}