"""Testes da busca por prefixo (substitui o fallback quadrático) — card 12."""
import app.main as main_module
from app.api.routes import transcribe as transcribe_module
from app.api.routes.barcode import find_best_generico
from app.db.models.product import ProdutoGenerico
from app.services.product_search import overlap_score, prefix_search_genericos


def _seed(db):
    dados = [
        ("Leite Integral", "leite integral"),
        ("Leite Desnatado", "leite desnatado"),
        ("Leite Condensado", "leite condensado"),
        ("Arroz Branco", "arroz branco"),
        ("Feijao Preto", "feijao preto"),
    ]
    for nome, norm in dados:
        db.add(ProdutoGenerico(nome=nome, nome_normalizado=norm))
    db.flush()


def test_overlap_score():
    assert overlap_score("leite condensado", "leite condensado") == 1.0
    assert overlap_score("leite condensado", "leite integral") == 0.5
    assert overlap_score("", "qualquer") == 0.0
    assert overlap_score("leite", "") == 0.0


def test_prefix_search_filtra_por_prefixo(db_session):
    _seed(db_session)
    scored = prefix_search_genericos(db_session, "leite condensado", limit=5)
    # Só retorna itens cujo nome_normalizado começa pelo primeiro termo.
    assert scored
    assert all(g.nome_normalizado.startswith("leite") for g, _ in scored)
    nomes = {g.nome for g, _ in scored}
    assert "Arroz Branco" not in nomes and "Feijao Preto" not in nomes


def test_prefix_search_ordena_por_overlap(db_session):
    _seed(db_session)
    scored = prefix_search_genericos(db_session, "leite condensado", limit=5)
    # O match com os dois termos vem primeiro, com score 1.0.
    assert scored[0][0].nome == "Leite Condensado"
    assert scored[0][1] == 1.0


def test_prefix_search_sem_match_vazio(db_session):
    _seed(db_session)
    assert prefix_search_genericos(db_session, "inexistente", limit=5) == []
    assert prefix_search_genericos(db_session, "", limit=5) == []


def test_find_best_generico_sqlite_por_prefixo(db_session):
    _seed(db_session)
    match = find_best_generico(db_session, "Leite Condensado")
    assert match is not None
    generico, score = match
    assert generico.nome == "Leite Condensado"
    assert score >= 0.3


def test_query_candidates_sqlite_por_prefixo(db_session):
    _seed(db_session)
    candidatos = transcribe_module._query_candidates(
        db_session, "Leite Condensado", None, limit=5
    )
    assert any(c.name == "Leite Condensado" for c in candidatos)
    # Nenhum candidato fora do prefixo "leite".
    assert all(c.normalized.startswith("leite") for c in candidatos)


def test_verify_pg_trgm_noop_em_sqlite():
    # O engine de teste é SQLite → a verificação é um no-op e não levanta.
    main_module._verify_pg_trgm()
