"""Busca de produtos genéricos sem varredura quadrática da tabela.

No Postgres a busca usa ``pg_trgm`` (indexada). Fora dele (ex.: SQLite nos
testes) usa busca por **prefixo** (``nome_normalizado ILIKE 'termo%'``), que
aproveita o índice de ``nome_normalizado`` e limita o conjunto pontuado —
substituindo o antigo fallback que carregava 1000/2000 linhas e iterava em
Python (O(n) no tamanho da base).
"""
from typing import List, Tuple

from sqlalchemy.orm import Session

from app.db.models.product import ProdutoGenerico


def overlap_score(norm: str, candidate_norm: str) -> float:
    """Proporção de termos de ``norm`` presentes em ``candidate_norm``."""
    terms = norm.split()
    if not terms or not candidate_norm:
        return 0.0
    hits = sum(1 for t in terms if t in candidate_norm)
    return hits / len(terms)


def prefix_search_genericos(
    db: Session,
    norm: str,
    limit: int = 5,
    fetch_multiplier: int = 8,
) -> List[Tuple[ProdutoGenerico, float]]:
    """Busca genéricos por prefixo do primeiro termo e pontua por sobreposição.

    Filtra por ``nome_normalizado ILIKE 'primeiro_termo%'`` (indexável) e
    pontua apenas o conjunto reduzido — sem carregar a tabela inteira.
    Retorna ``[(ProdutoGenerico, score)]`` ordenado por score desc.
    """
    terms = norm.split()
    if not terms:
        return []

    first = terms[0]
    rows = (
        db.query(ProdutoGenerico)
        .filter(ProdutoGenerico.nome_normalizado.ilike(f"{first}%"))
        .limit(max(limit, 1) * fetch_multiplier)
        .all()
    )

    scored = [(g, overlap_score(norm, g.nome_normalizado or "")) for g in rows]
    scored = [item for item in scored if item[1] > 0]
    scored.sort(key=lambda item: item[1], reverse=True)
    return scored[:limit]
