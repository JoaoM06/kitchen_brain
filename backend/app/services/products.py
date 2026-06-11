"""Helpers de produtos com inserção idempotente sob concorrência.

Centraliza a criação de ``ProdutoGenerico`` (antes duplicada em
``stock.py`` e ``barcode.py`` como SELECT-then-INSERT, sujeito a corrida sob
requisições simultâneas — duas inserções do mesmo ``nome_normalizado`` violavam
a UNIQUE). Usa ``INSERT ... ON CONFLICT DO NOTHING`` no Postgres e fallback
``try/except IntegrityError`` (com savepoint) no SQLite/outros.
"""
from typing import Optional

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.models.product import ProdutoGenerico


def _dialect_name(db: Session) -> str:
    bind = db.get_bind()
    return bind.dialect.name if bind is not None else ""


def get_or_create_generico(
    db: Session,
    *,
    nome: str,
    nome_normalizado: Optional[str] = None,
    categoria: Optional[str] = None,
    url_imagem: Optional[str] = None,
) -> ProdutoGenerico:
    """Retorna o ``ProdutoGenerico`` de ``nome_normalizado``, criando-o se faltar.

    Idempotente sob concorrência (apoiado na UNIQUE de ``nome_normalizado``):
    duas chamadas simultâneas com o mesmo nome resultam em **uma** linha, e
    ambas recebem a mesma instância — sem ``IntegrityError`` propagado.
    """
    nome = (nome or "").strip()
    norm = (nome_normalizado or nome or "").strip().lower()

    existing = (
        db.query(ProdutoGenerico)
        .filter(ProdutoGenerico.nome_normalizado == norm)
        .first()
    )
    if existing:
        return existing

    if _dialect_name(db) == "postgresql":
        from sqlalchemy.dialects.postgresql import insert as pg_insert

        stmt = (
            pg_insert(ProdutoGenerico)
            .values(
                nome=nome,
                nome_normalizado=norm,
                categoria=categoria,
                url_imagem=url_imagem,
            )
            .on_conflict_do_nothing(index_elements=["nome_normalizado"])
        )
        db.execute(stmt)
        # ON CONFLICT DO NOTHING não devolve a linha em caso de conflito;
        # buscar garante a instância correta (criada por esta ou outra tx).
        return (
            db.query(ProdutoGenerico)
            .filter(ProdutoGenerico.nome_normalizado == norm)
            .first()
        )

    # SQLite e outros: savepoint para não abortar a transação externa em conflito.
    savepoint = db.begin_nested()
    try:
        generico = ProdutoGenerico(
            nome=nome,
            nome_normalizado=norm,
            categoria=categoria,
            url_imagem=url_imagem,
        )
        db.add(generico)
        db.flush()
        savepoint.commit()
        return generico
    except IntegrityError:
        savepoint.rollback()
        return (
            db.query(ProdutoGenerico)
            .filter(ProdutoGenerico.nome_normalizado == norm)
            .first()
        )
