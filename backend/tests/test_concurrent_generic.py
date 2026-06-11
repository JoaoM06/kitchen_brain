"""Testes de inserção idempotente de ProdutoGenerico sob concorrência (card 13)."""
import threading

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

import app.db.models.product  # noqa: F401  (registra modelos no metadata)
import app.db.models.recipe  # noqa: F401
import app.db.models.storage  # noqa: F401
import app.db.models.user  # noqa: F401
from app.db.base import Base
from app.db.models.product import ProdutoGenerico
from app.services.products import get_or_create_generico


def test_get_or_create_generico_idempotente(db_session):
    a = get_or_create_generico(db_session, nome="Arroz", nome_normalizado="arroz")
    db_session.flush()
    b = get_or_create_generico(db_session, nome="Arroz", nome_normalizado="arroz")

    assert a.id == b.id
    count = (
        db_session.query(ProdutoGenerico)
        .filter(ProdutoGenerico.nome_normalizado == "arroz")
        .count()
    )
    assert count == 1


def test_get_or_create_generico_nomes_diferentes(db_session):
    a = get_or_create_generico(db_session, nome="Arroz", nome_normalizado="arroz")
    b = get_or_create_generico(db_session, nome="Feijao", nome_normalizado="feijao")
    assert a.id != b.id


def test_get_or_create_generico_normaliza_para_lower(db_session):
    g = get_or_create_generico(db_session, nome="Leite Integral", nome_normalizado="LEITE INTEGRAL")
    assert g.nome_normalizado == "leite integral"


def _make_file_engine(tmp_path):
    db_file = tmp_path / "concurrent.db"
    engine = create_engine(f"sqlite+pysqlite:///{db_file}")

    @event.listens_for(engine, "connect")
    def _set_sqlite_pragmas(dbapi_conn, _record):
        cur = dbapi_conn.cursor()
        cur.execute("PRAGMA journal_mode=WAL")
        cur.execute("PRAGMA busy_timeout=30000")
        cur.close()

    Base.metadata.create_all(engine)
    return engine


def test_get_or_create_generico_concorrente(tmp_path):
    """10 threads criando o mesmo genérico simultaneamente => 1 linha, sem erro."""
    engine = _make_file_engine(tmp_path)
    Session = sessionmaker(bind=engine)

    n_threads = 10
    barrier = threading.Barrier(n_threads)
    results: dict[int, str | None] = {}
    errors: dict[int, str] = {}

    def worker(idx):
        barrier.wait()  # maximiza a contenção
        session = Session()
        try:
            generico = get_or_create_generico(
                session, nome="Leite", nome_normalizado="leite"
            )
            session.commit()
            results[idx] = str(generico.id) if generico else None
        except Exception as exc:  # noqa: BLE001
            errors[idx] = repr(exc)
        finally:
            session.close()

    threads = [threading.Thread(target=worker, args=(i,)) for i in range(n_threads)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert not errors, f"threads falharam: {errors}"

    check = Session()
    try:
        count = (
            check.query(ProdutoGenerico)
            .filter(ProdutoGenerico.nome_normalizado == "leite")
            .count()
        )
    finally:
        check.close()

    assert count == 1, f"esperado 1 linha, obtido {count}"
    ids = {v for v in results.values() if v}
    assert len(ids) == 1, f"threads receberam ids diferentes: {ids}"
    assert len(results) == n_threads
