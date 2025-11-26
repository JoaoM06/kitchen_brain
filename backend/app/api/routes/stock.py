from __future__ import annotations
import uuid
from decimal import Decimal
from datetime import datetime, date
from typing import List, Optional, Literal, Dict, DefaultDict
from collections import defaultdict

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.session import get_db
from app.db.models.storage import ItemEstoque, LocalEstoque, MovimentoEstoque
from app.db.models.product import ProdutoGenerico
from app.api.deps import get_current_user

router = APIRouter(prefix="/stock", tags=["stock"])

UnitInput = Literal["un", "g", "kg", "ml", "l"]
Location  = Literal["geladeira", "armário", "armario", "freezer"]

class ConfirmSelection(BaseModel):
    source_text: str
    product_name: str
    product_normalized: Optional[str] = None
    chosen_product_generic_id: Optional[uuid.UUID] = None
    create_new_if_missing: bool = False
    new_product_name: Optional[str] = None
    location: Optional[Location] = None
    quantity: Optional[float] = None
    unit_input: Optional[UnitInput] = None
    expiry_text: Optional[str] = None

class ConfirmResult(BaseModel):
    inserted: int
    created_generic: int
    item_ids: List[uuid.UUID]

UNIT_MAP = {
    None: "UN",
    "un": "UN",
    "g": "G",
    "kg": "KG",
    "ml": "ML",
    "l": "L",
}

def map_unit(u: Optional[str]) -> str:
    return UNIT_MAP.get((u or "").lower(), "UN")

def normalize_loc_name(v: Optional[str]) -> Optional[str]:
    if not v:
        return None
    s = v.strip().lower()
    if s.startswith("arm"):
        return "Armário"
    if "gelad" in s:
        return "Geladeira"
    if "freez" in s:
        return "Freezer"
    return s.capitalize()

def parse_date_soft(text: Optional[str]):
    if not text:
        return None
    t = text.strip()
    for fmt in ("%d/%m/%Y", "%d/%m"):
        try:
            dt = datetime.strptime(t, fmt)
            if fmt == "%d/%m":
                dt = dt.replace(year=datetime.utcnow().year)
            return dt.date()
        except Exception:
            pass
    return None

def get_or_create_local(db: Session, user_id: uuid.UUID, name_in: Optional[str]) -> Optional[uuid.UUID]:
    if not name_in:
        return None
    nice = normalize_loc_name(name_in)
    loc = (
        db.query(LocalEstoque)
        .filter(LocalEstoque.usuario_id == user_id, LocalEstoque.nome.ilike(nice))
        .first()
    )
    if loc:
        return loc.id
    # cria automaticamente
    loc = LocalEstoque(usuario_id=user_id, nome=nice, descricao=None)
    db.add(loc)
    db.flush()
    return loc.id

def get_or_create_generic(db: Session, name: str, normalized: Optional[str]) -> ProdutoGenerico:
    norm = (normalized or name or "").strip().lower()
    existing = (
        db.query(ProdutoGenerico)
        .filter(ProdutoGenerico.nome_normalizado == norm)
        .first()
    )
    if existing:
        return existing
    existing2 = (
        db.query(ProdutoGenerico)
        .filter(ProdutoGenerico.nome == name)
        .first()
    )
    if existing2:
        return existing2
    g = ProdutoGenerico(
        nome=name.strip(),
        nome_normalizado=norm,
        url_imagem=None,
        categoria=None
    )
    db.add(g)
    db.flush()
    return g

@router.post("/confirm-voice", response_model=ConfirmResult)
def confirm_voice_items(
    payload: List[ConfirmSelection],
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    if not payload:
        return ConfirmResult(inserted=0, created_generic=0, item_ids=[])

    inserted = 0
    created_generic = 0
    item_ids: List[uuid.UUID] = []

    for row in payload:
        generic_id: Optional[uuid.UUID] = row.chosen_product_generic_id
        if not generic_id:
            if row.create_new_if_missing:
                g_before = db.query(ProdutoGenerico).count()
                g = get_or_create_generic(db, row.new_product_name or row.product_name, row.product_normalized)
                generic_id = g.id
                g_after = db.query(ProdutoGenerico).count()
                if g_after > g_before:
                    created_generic += 1
            else:
                continue

        local_id = get_or_create_local(db, user.id, row.location)

        qtd = Decimal(str(row.quantity if row.quantity is not None else 1))
        und = map_unit(row.unit_input)
        val = parse_date_soft(row.expiry_text)

        item = ItemEstoque(
            usuario_id=user.id,
            produto_generico_id=generic_id,
            local_id=local_id,
            quantidade=qtd,
            unidade=und,
            validade=val,
            observacoes=None,
        )
        db.add(item)
        db.flush()

        mov = MovimentoEstoque(
            item_id=item.id,
            tipo="ENTRADA",
            quantidade=qtd,
            de_local_id=None,
            para_local_id=local_id,
            motivo="CONFIRM_VOICE",
        )
        db.add(mov)

        inserted += 1
        item_ids.append(item.id)

    db.commit()
    return ConfirmResult(inserted=inserted, created_generic=created_generic, item_ids=item_ids)



class ListItemOut(BaseModel):
    id: uuid.UUID
    name: str
    expiry: Optional[str]
    status: Literal["ok", "warn", "danger"]

class GroupOut(BaseModel):
    location: str
    items: List[ListItemOut]

class StockListOut(BaseModel):
    groups: List[GroupOut]

def _format_ddmm(d: Optional[date]) -> Optional[str]:
    return d.strftime("%d/%m") if d else None

def _status_from_expiry(d: Optional[date]) -> Literal["ok", "warn", "danger"]:
    if not d:
        return "ok"
    delta = (d - date.today()).days
    if delta < 0:
        return "danger"
    if delta <= 2:
        return "danger"
    if delta <= 7:
        return "warn"
    return "ok"

def _norm_loc_for_group(loc_name: Optional[str]) -> str:
    """Padroniza nomes para os grupos exibidos."""
    if not loc_name:
        return "Sem local"
    s = (loc_name or "").strip().lower()
    if s.startswith("arm"):
        return "Armário"
    if "gelad" in s:
        return "Geladeira"
    if "freez" in s:
        return "Freezer"
    return s.capitalize()

_GROUP_ORDER = {"Armário": 0, "Geladeira": 1, "Freezer": 2, "Sem local": 3}

@router.get("/list", response_model=StockListOut)
def list_stock(
    q: Optional[str] = Query(default=None, description="Filtro de busca pelo nome do produto"),
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    base = (
        db.query(
            ItemEstoque.id.label("item_id"),
            ProdutoGenerico.nome.label("prod_nome"),
            ItemEstoque.validade.label("validade"),
            LocalEstoque.nome.label("local_nome"),
        )
        .join(ProdutoGenerico, ProdutoGenerico.id == ItemEstoque.produto_generico_id)
        .outerjoin(LocalEstoque, LocalEstoque.id == ItemEstoque.local_id)
        .filter(ItemEstoque.usuario_id == user.id)
    )

    if q:
        q_like = f"%{q.strip()}%"
        base = base.filter(
            or_(
                ProdutoGenerico.nome.ilike(q_like),
                ProdutoGenerico.nome_normalizado.ilike(q_like),
            )
        )

    rows = base.all()

    buckets: DefaultDict[str, List[ListItemOut]] = defaultdict(list)
    for r in rows:
        loc = _norm_loc_for_group(r.local_nome)
        item = ListItemOut(
            id=r.item_id,
            name=r.prod_nome,
            expiry=_format_ddmm(r.validade),
            status=_status_from_expiry(r.validade),
        )
        buckets[loc].append(item)
    def _status_rank(st: str) -> int:
        return {"danger": 0, "warn": 1, "ok": 2}.get(st, 3)

    for loc_name in buckets:
        buckets[loc_name].sort(
            key=lambda it: (
                _status_rank(it.status),
                (0, it.expiry) if it.expiry is not None else (1, ""),
                it.name.lower(),
            )
        )

    groups = sorted(
        (GroupOut(location=loc, items=items) for loc, items in buckets.items()),
        key=lambda g: (_GROUP_ORDER.get(g.location, 99), g.location),
    )

    return StockListOut(groups=groups)