"""
Rotas de código de barras - lookup, registro e vinculação de produtos.
"""
import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from unidecode import unidecode
import re

logger = logging.getLogger(__name__)

from app.db.session import get_db
from app.db.models.product import ProdutoGenerico, Produto, CodigoBarras

# Import do crawler
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
from crawlers.barcode_crawler import OpenFoodFactsClient, ProdutoBarcode

router = APIRouter(prefix="/barcode", tags=["barcode"])

# Cliente singleton
_off_client = None

def get_off_client() -> OpenFoodFactsClient:
    global _off_client
    if _off_client is None:
        _off_client = OpenFoodFactsClient(use_cache=True)
    return _off_client


# Schemas
class BarcodeLookupResponse(BaseModel):
    found: bool
    barcode: str
    external_data: Optional[dict] = None
    local_product: Optional[dict] = None
    suggested_generico: Optional[dict] = None


class BarcodeRegisterRequest(BaseModel):
    barcode: str
    nome: str
    marca: Optional[str] = None
    categoria: Optional[str] = None
    imagem_url: Optional[str] = None
    produto_generico_id: Optional[str] = None


class BarcodeRegisterResponse(BaseModel):
    success: bool
    produto_id: str
    codigo_barras_id: str
    produto_generico_id: Optional[str] = None


class ProductCandidate(BaseModel):
    id: str
    nome: str
    categoria: Optional[str] = None
    score: float


# Helpers
STOPWORDS = {"de", "do", "da", "dos", "das", "e", "em", "para", "no", "na", "a", "o"}

def normalize_name(s: str) -> str:
    """Normaliza nome para busca."""
    s = unidecode(s or "").lower()
    s = re.sub(r"[^a-z0-9\s]", " ", s)
    parts = [p for p in s.split() if p and p not in STOPWORDS]
    return " ".join(parts)


def find_best_generico(db: Session, nome: str, marca: str = None) -> Optional[tuple]:
    """
    Encontra o melhor ProdutoGenerico para um produto.
    Retorna (ProdutoGenerico, score) ou None.
    """
    # Combina nome e marca para busca
    search_text = nome
    if marca:
        search_text = f"{nome} {marca}"

    norm = normalize_name(search_text)
    if not norm:
        return None

    try:
        # Tenta usar pg_trgm
        result = (
            db.query(
                ProdutoGenerico,
                func.similarity(ProdutoGenerico.nome_normalizado, norm).label("sim")
            )
            .filter(func.similarity(ProdutoGenerico.nome_normalizado, norm) >= 0.2)
            .order_by(func.similarity(ProdutoGenerico.nome_normalizado, norm).desc())
            .first()
        )

        if result:
            return (result[0], float(result[1]))

    except Exception:
        logger.debug("trigram_search_unavailable", exc_info=True)

    # Fallback: busca simples por substring
    produtos = db.query(ProdutoGenerico).limit(1000).all()
    termos = norm.split()

    best_match = None
    best_score = 0.0

    for p in produtos:
        p_norm = p.nome_normalizado or ""
        matches = sum(1 for t in termos if t in p_norm)
        score = matches / len(termos) if termos else 0

        if score > best_score:
            best_score = score
            best_match = p

    if best_match and best_score >= 0.3:
        return (best_match, best_score)

    return None


@router.post("/lookup", response_model=BarcodeLookupResponse)
def lookup_barcode(barcode: str, db: Session = Depends(get_db)):
    """
    Busca produto pelo código de barras.

    1. Verifica se já existe localmente
    2. Se não, busca na API Open Food Facts
    3. Sugere um ProdutoGenerico para vinculação
    """
    barcode = barcode.strip()

    if not barcode:
        raise HTTPException(status_code=400, detail="Código de barras inválido")

    # 1. Verifica produto local
    codigo_local = db.query(CodigoBarras).filter(CodigoBarras.valor == barcode).first()

    if codigo_local:
        produto = codigo_local.produto
        return BarcodeLookupResponse(
            found=True,
            barcode=barcode,
            local_product={
                "id": str(produto.id),
                "nome": produto.nome,
                "marca": produto.marca,
                "categoria": produto.categoria,
                "imagem_url": produto.url_imagem,
                "generico_id": str(produto.id_generico) if produto.id_generico else None,
            }
        )

    # 2. Busca na API externa
    client = get_off_client()
    external = client.lookup(barcode)

    if not external:
        return BarcodeLookupResponse(
            found=False,
            barcode=barcode,
        )

    # 3. Encontra melhor genérico
    suggested = None
    match = find_best_generico(db, external.nome, external.marca)

    if match:
        generico, score = match
        suggested = {
            "id": str(generico.id),
            "nome": generico.nome,
            "categoria": generico.categoria,
            "score": score,
        }

    return BarcodeLookupResponse(
        found=True,
        barcode=barcode,
        external_data={
            "nome": external.nome,
            "marca": external.marca,
            "categoria": external.categoria,
            "imagem_url": external.imagem_url,
            "quantidade": external.quantidade,
            "nutriscore": external.nutriscore,
        },
        suggested_generico=suggested,
    )


@router.post("/register", response_model=BarcodeRegisterResponse)
def register_barcode(req: BarcodeRegisterRequest, db: Session = Depends(get_db)):
    """
    Registra um novo produto com código de barras.

    Se produto_generico_id não for fornecido, cria um novo ProdutoGenerico.
    """
    barcode = req.barcode.strip()

    # Verifica se código já existe
    existe = db.query(CodigoBarras).filter(CodigoBarras.valor == barcode).first()
    if existe:
        raise HTTPException(
            status_code=409,
            detail=f"Código de barras já registrado para produto {existe.produto.nome}"
        )

    # Obtém ou cria ProdutoGenerico
    generico_id = None

    if req.produto_generico_id:
        generico = db.query(ProdutoGenerico).filter(
            ProdutoGenerico.id == req.produto_generico_id
        ).first()

        if not generico:
            raise HTTPException(status_code=404, detail="Produto genérico não encontrado")

        generico_id = generico.id

    else:
        # Cria novo genérico
        nome_norm = normalize_name(req.nome)
        generico = ProdutoGenerico(
            nome=req.nome,
            nome_normalizado=nome_norm,
            categoria=req.categoria,
        )
        db.add(generico)
        db.flush()
        generico_id = generico.id

    # Cria Produto
    produto = Produto(
        nome=req.nome,
        marca=req.marca,
        categoria=req.categoria,
        url_imagem=req.imagem_url,
        id_generico=generico_id,
    )
    db.add(produto)
    db.flush()

    # Cria CodigoBarras
    codigo = CodigoBarras(
        produto_id=produto.id,
        valor=barcode,
        tipo="EAN13" if len(barcode) == 13 else "EAN8" if len(barcode) == 8 else "OTHER",
    )
    db.add(codigo)

    db.commit()

    return BarcodeRegisterResponse(
        success=True,
        produto_id=str(produto.id),
        codigo_barras_id=str(codigo.id),
        produto_generico_id=str(generico_id) if generico_id else None,
    )


@router.get("/{barcode}")
def get_barcode_info(barcode: str, db: Session = Depends(get_db)):
    """Obtém informações de um código de barras registrado."""
    codigo = db.query(CodigoBarras).filter(CodigoBarras.valor == barcode).first()

    if not codigo:
        raise HTTPException(status_code=404, detail="Código de barras não encontrado")

    produto = codigo.produto

    return {
        "barcode": barcode,
        "tipo": codigo.tipo,
        "produto": {
            "id": str(produto.id),
            "nome": produto.nome,
            "marca": produto.marca,
            "categoria": produto.categoria,
            "imagem_url": produto.url_imagem,
        },
        "generico": {
            "id": str(produto.generico.id),
            "nome": produto.generico.nome,
            "categoria": produto.generico.categoria,
        } if produto.generico else None,
    }


@router.get("/search/generico")
def search_generico(q: str, limit: int = 10, db: Session = Depends(get_db)) -> List[ProductCandidate]:
    """Busca produtos genéricos por nome."""
    norm = normalize_name(q)

    if not norm or len(norm) < 2:
        return []

    try:
        # Tenta trigram
        rows = (
            db.query(
                ProdutoGenerico.id,
                ProdutoGenerico.nome,
                ProdutoGenerico.categoria,
                func.similarity(ProdutoGenerico.nome_normalizado, norm).label("sim")
            )
            .filter(func.similarity(ProdutoGenerico.nome_normalizado, norm) >= 0.15)
            .order_by(func.similarity(ProdutoGenerico.nome_normalizado, norm).desc())
            .limit(limit)
            .all()
        )

        return [
            ProductCandidate(id=str(r.id), nome=r.nome, categoria=r.categoria, score=float(r.sim))
            for r in rows
        ]

    except Exception:
        logger.debug("trigram_search_unavailable", exc_info=True)
        produtos = (
            db.query(ProdutoGenerico)
            .filter(ProdutoGenerico.nome_normalizado.contains(norm.split()[0] if norm else ""))
            .limit(limit)
            .all()
        )

        return [
            ProductCandidate(id=str(p.id), nome=p.nome, categoria=p.categoria, score=0.5)
            for p in produtos
        ]
