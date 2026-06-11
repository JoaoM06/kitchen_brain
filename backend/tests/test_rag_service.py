"""Testes do RecipeRAGService — foco no N+1 de search_recipes_by_ingredients (card 11)."""
from sqlalchemy import event

from app.db.models.recipe import IngredienteReceita, Receita
from app.services.rag_service import RecipeRAGService


class QueryCounter:
    """Conta execuções de SQL no bind durante o bloco `with`."""

    def __init__(self, bind):
        self.bind = bind
        self.count = 0

    def _callback(self, conn, cursor, statement, parameters, context, executemany):
        self.count += 1

    def __enter__(self):
        event.listen(self.bind, "after_cursor_execute", self._callback)
        return self

    def __exit__(self, *exc):
        event.remove(self.bind, "after_cursor_execute", self._callback)


def _seed_recipes(db, user, n_recipes=50, n_ing=10):
    for r in range(n_recipes):
        receita = Receita(
            usuario_id=user.id,
            titulo=f"Receita {r}",
            rendimento_porcoes=2,
            tempo_preparo_min=30,
        )
        db.add(receita)
        db.flush()
        for i in range(n_ing):
            db.add(IngredienteReceita(receita_id=receita.id, nome_livre=f"ingrediente {i}"))
    db.commit()


def test_search_recipes_sem_n_plus_1(db_session, user_factory):
    user = user_factory()
    _seed_recipes(db_session, user, n_recipes=50, n_ing=10)

    rag = RecipeRAGService(db_session)
    bind = db_session.get_bind()

    with QueryCounter(bind) as qc:
        result = rag.search_recipes_by_ingredients(["ingrediente 1", "ingrediente 5"], limit=20)

    # Antes: 1 (receitas) + 50 (ingredientes por receita) = 51 queries.
    # Agora: 1 (receitas) + 1 (ingredientes em lote) = 2.
    assert qc.count <= 5, f"esperado <= 5 queries, obtido {qc.count}"
    assert len(result) == 20  # respeita o limit


def test_search_recipes_resultado_correto(db_session, user_factory):
    """Regressão: o agrupamento em memória produz os mesmos números do
    comportamento original (1 query por receita)."""
    user = user_factory()
    _seed_recipes(db_session, user, n_recipes=5, n_ing=10)

    rag = RecipeRAGService(db_session)
    result = rag.search_recipes_by_ingredients(["ingrediente 1", "ingrediente 5"], limit=10)

    assert len(result) == 5
    for r in result:
        assert r["total_ingredientes"] == 10
        assert r["matches"] == 2  # "ingrediente 1" e "ingrediente 5"
        assert abs(r["match_ratio"] - 0.2) < 1e-9


def test_search_recipes_sem_match_retorna_vazio(db_session, user_factory):
    user = user_factory()
    _seed_recipes(db_session, user, n_recipes=5, n_ing=3)

    rag = RecipeRAGService(db_session)
    result = rag.search_recipes_by_ingredients(["inexistente xyz"], limit=10)
    assert result == []


def test_search_recipes_lista_vazia(db_session):
    rag = RecipeRAGService(db_session)
    assert rag.search_recipes_by_ingredients([]) == []
