from __future__ import annotations
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.db.models.lista_compras import ListaComprasBase
from app.db.models.storage import ItemEstoque
from app.api.routes.stock import get_or_create_generic
from app.schemas.lista_compras import ListaComprasCriar, ListaComprasOut

router = APIRouter(prefix="/lista-compras", tags=["Lista de Compras"])


@router.post("/", response_model=ListaComprasOut)
def add_lista_compras(
    item: ListaComprasCriar,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    db_item = ListaComprasBase(
        usuario_id=user.id,
        produto_generico_id=item.produto_generico_id,
        nome=item.nome,
        validade=item.validade,
        comprado=False,
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@router.get("/", response_model=list[ListaComprasOut])
def listar_lista_compras(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return (
        db.query(ListaComprasBase)
        .filter(ListaComprasBase.usuario_id == user.id)
        .all()
    )


@router.put("/{item_id}/comprado", response_model=ListaComprasOut)
def item_comprado(
    item_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    item = (
        db.query(ListaComprasBase)
        .filter(
            ListaComprasBase.id == item_id,
            ListaComprasBase.usuario_id == user.id,
        )
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado na lista de compras")
    if item.comprado:
        raise HTTPException(status_code=400, detail="Item já foi comprado")

    item.comprado = True
    db.commit()
    db.refresh(item)

    generic = get_or_create_generic(db, item.nome, None)
    estoque = ItemEstoque(
        usuario_id=user.id,
        produto_generico_id=generic.id,
        local_id=None,
        quantidade=Decimal("1"),
        unidade="UN",
        validade=item.validade,
        observacoes=None,
    )
    db.add(estoque)
    db.commit()

    return item


@router.delete("/{item_id}")
def remover_lista_compras(
    item_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    item = (
        db.query(ListaComprasBase)
        .filter(
            ListaComprasBase.id == item_id,
            ListaComprasBase.usuario_id == user.id,
        )
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado na lista de compras")
    db.delete(item)
    db.commit()
    return {"message": "Item removido da lista de compras com sucesso"}
