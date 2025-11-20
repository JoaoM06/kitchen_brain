from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user
from app.db.models.storage import ItemEstoque
from app.db.session import get_db
from app.schemas.pantry import PantryItem, PantryResponse

router = APIRouter()


def _derive_status(days_to_expire: int | None) -> str:
    if days_to_expire is None:
        return "ok"
    if days_to_expire < 0:
        return "expired"
    if days_to_expire <= 2:
        return "danger"
    if days_to_expire <= 5:
        return "alert"
    return "ok"


@router.get("/me/pantry", response_model=PantryResponse)
def get_my_pantry(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> PantryResponse:
    items = (
        db.query(ItemEstoque)
        .options(joinedload(ItemEstoque.produto), joinedload(ItemEstoque.local))
        .filter(ItemEstoque.usuario_id == current_user.id)
        .all()
    )
    today = date.today()
    payload: list[PantryItem] = []
    for item in items:
        validity = item.validade
        days_to_expire = (validity - today).days if validity else None
        payload.append(
            PantryItem(
                id=item.id,
                name=item.produto.nome if item.produto else "Item sem nome",
                quantity=float(item.quantidade or 0),
                unit=item.unidade or "UN",
                location=item.local.nome if item.local else None,
                expires_at=validity,
                days_to_expire=days_to_expire,
                status=_derive_status(days_to_expire),
                observations=item.observacoes,
            )
        )
    return PantryResponse(items=payload)

