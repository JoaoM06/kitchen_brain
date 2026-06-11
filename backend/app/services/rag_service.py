"""
RAG (Retrieval-Augmented Generation) Service para o CardapioBot.
Busca receitas relevantes para injetar como contexto no prompt do Gemini.

Implementação simplificada usando busca por keywords/trigram.
Para produção, considerar usar um vector store (ChromaDB, Pinecone, etc).
"""
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from unidecode import unidecode
import re

from app.db.models.recipe import Receita, IngredienteReceita
from app.db.models.storage import ItemEstoque
from app.db.models.product import ProdutoGenerico


class RecipeRAGService:
    """Serviço de busca de receitas para contexto do CardapioBot."""

    def __init__(self, db: Session):
        self.db = db

    def search_recipes_by_ingredients(
        self,
        ingredient_names: List[str],
        limit: int = 10,
        exclude_ids: List[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Busca receitas que usam os ingredientes fornecidos.
        Retorna ordenadas por quantidade de ingredientes em comum.
        """
        if not ingredient_names:
            return []

        # Normaliza nomes
        normalized = [self._normalize(n) for n in ingredient_names]

        # Query base
        query = (
            self.db.query(
                Receita.id,
                Receita.titulo,
                Receita.tempo_preparo_min,
                Receita.rendimento_porcoes,
            )
            .distinct()
        )

        if exclude_ids:
            query = query.filter(~Receita.id.in_(exclude_ids))

        # Busca receitas com ingredientes similares
        recipes_with_count = []

        all_recipes = query.limit(500).all()

        # Carrega TODOS os ingredientes das receitas em UMA query (evita N+1:
        # antes era 1 query por receita, até 501 queries por chamada).
        recipe_ids = [recipe.id for recipe in all_recipes]
        ingredientes_por_receita: Dict[Any, List[str]] = {}
        if recipe_ids:
            rows = (
                self.db.query(
                    IngredienteReceita.receita_id,
                    IngredienteReceita.nome_livre,
                )
                .filter(IngredienteReceita.receita_id.in_(recipe_ids))
                .all()
            )
            for receita_id, nome_livre in rows:
                ingredientes_por_receita.setdefault(receita_id, []).append(nome_livre)

        for recipe in all_recipes:
            # Ingredientes já carregados em memória (sem nova query por receita)
            ingredients = ingredientes_por_receita.get(recipe.id, [])

            ing_names = [self._normalize(nome or "") for nome in ingredients]

            # Conta matches
            matches = sum(
                1 for norm in normalized
                if any(norm in ing or ing in norm for ing in ing_names if ing)
            )

            if matches > 0:
                recipes_with_count.append({
                    "id": str(recipe.id),
                    "titulo": recipe.titulo,
                    "tempo_preparo": recipe.tempo_preparo_min,
                    "porcoes": recipe.rendimento_porcoes,
                    "matches": matches,
                    "total_ingredientes": len(ingredients),
                    "match_ratio": matches / len(ingredients) if ingredients else 0,
                })

        # Ordena por match ratio (proporção de ingredientes disponíveis)
        recipes_with_count.sort(key=lambda x: (x["match_ratio"], x["matches"]), reverse=True)

        return recipes_with_count[:limit]

    def search_recipes_by_query(
        self,
        query: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Busca receitas por texto (título, ingredientes)."""
        normalized_query = self._normalize(query)
        terms = normalized_query.split()

        if not terms:
            return []

        # Busca por título
        results = []

        recipes = (
            self.db.query(Receita)
            .filter(
                or_(
                    *[Receita.titulo.ilike(f"%{term}%") for term in terms]
                )
            )
            .limit(limit * 2)
            .all()
        )

        for recipe in recipes:
            # Score baseado em matches no título
            title_norm = self._normalize(recipe.titulo)
            score = sum(1 for t in terms if t in title_norm)

            results.append({
                "id": str(recipe.id),
                "titulo": recipe.titulo,
                "tempo_preparo": recipe.tempo_preparo_min,
                "porcoes": recipe.rendimento_porcoes,
                "score": score / len(terms) if terms else 0,
            })

        # Ordena por score
        results.sort(key=lambda x: x["score"], reverse=True)

        return results[:limit]

    def get_recipe_context(
        self,
        recipe_ids: List[str],
        include_ingredients: bool = True
    ) -> str:
        """
        Gera texto de contexto para as receitas selecionadas.
        Usado para injetar no prompt do Gemini.
        """
        if not recipe_ids:
            return ""

        recipes = (
            self.db.query(Receita)
            .filter(Receita.id.in_(recipe_ids))
            .all()
        )

        context_parts = []

        for recipe in recipes:
            parts = [f"### {recipe.titulo}"]

            if recipe.tempo_preparo_min:
                parts.append(f"Tempo: {recipe.tempo_preparo_min} min")

            if recipe.rendimento_porcoes:
                parts.append(f"Porções: {recipe.rendimento_porcoes}")

            if include_ingredients:
                ingredients = (
                    self.db.query(IngredienteReceita)
                    .filter(IngredienteReceita.receita_id == recipe.id)
                    .all()
                )

                if ingredients:
                    ing_list = []
                    for ing in ingredients:
                        texto = ing.nome_livre or ""
                        if ing.quantidade:
                            texto = f"{ing.quantidade}{' ' + ing.unidade if ing.unidade else ''} {texto}"
                        ing_list.append(f"- {texto}")

                    parts.append("Ingredientes:\n" + "\n".join(ing_list))

            context_parts.append("\n".join(parts))

        return "\n\n".join(context_parts)

    def get_recipes_for_stock(
        self,
        user_id: str,
        prioritize_expiring: bool = True,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Busca receitas relevantes baseadas no estoque do usuário.
        Prioriza receitas que usam itens vencendo.
        """
        from datetime import date, timedelta

        # Busca estoque do usuário
        estoque = (
            self.db.query(ItemEstoque)
            .join(ProdutoGenerico)
            .filter(ItemEstoque.usuario_id == user_id)
            .filter(ItemEstoque.quantidade > 0)
            .all()
        )

        if not estoque:
            return []

        # Separa itens normais e vencendo
        hoje = date.today()
        limite_validade = hoje + timedelta(days=7)

        itens_vencendo = []
        itens_normais = []

        for item in estoque:
            nome = item.produto_generico.nome if item.produto_generico else None
            if not nome:
                continue

            if item.validade and item.validade <= limite_validade:
                itens_vencendo.append(nome)
            else:
                itens_normais.append(nome)

        # Busca receitas priorizando itens vencendo
        receitas_vencendo = []
        if itens_vencendo and prioritize_expiring:
            receitas_vencendo = self.search_recipes_by_ingredients(
                itens_vencendo,
                limit=limit // 2
            )
            # Marca como prioritárias
            for r in receitas_vencendo:
                r["prioridade"] = "vencendo"

        # Busca receitas com todos os itens
        todos_itens = itens_vencendo + itens_normais
        exclude_ids = [r["id"] for r in receitas_vencendo]

        receitas_normais = self.search_recipes_by_ingredients(
            todos_itens,
            limit=limit - len(receitas_vencendo),
            exclude_ids=exclude_ids
        )
        for r in receitas_normais:
            r["prioridade"] = "normal"

        # Combina e retorna
        return receitas_vencendo + receitas_normais

    def _normalize(self, text: str) -> str:
        """Normaliza texto para busca."""
        if not text:
            return ""
        text = unidecode(text).lower()
        text = re.sub(r"[^a-z0-9\s]", " ", text)
        return " ".join(text.split())


def get_rag_context_for_cardapio(
    db: Session,
    user_id: str,
    request_params: Dict[str, Any]
) -> str:
    """
    Função helper que gera contexto RAG completo para geração de cardápio.
    Retorna texto formatado para injetar no prompt.
    """
    rag = RecipeRAGService(db)

    # Busca receitas relevantes
    receitas = rag.get_recipes_for_stock(user_id, limit=15)

    if not receitas:
        return ""

    # Separa por prioridade
    vencendo = [r for r in receitas if r.get("prioridade") == "vencendo"]
    outras = [r for r in receitas if r.get("prioridade") != "vencendo"]

    context_parts = ["## Receitas Sugeridas da Base\n"]

    if vencendo:
        context_parts.append("### Prioridade Alta (usam itens vencendo):")
        for r in vencendo[:5]:
            context_parts.append(f"- {r['titulo']} ({r['tempo_preparo'] or '?'} min, {r['porcoes'] or '?'} porções)")

    if outras:
        context_parts.append("\n### Outras Sugestões:")
        for r in outras[:10]:
            context_parts.append(f"- {r['titulo']} ({r['tempo_preparo'] or '?'} min)")

    context_parts.append(
        "\nConsidere usar estas receitas como base ou inspiração para o cardápio."
    )

    return "\n".join(context_parts)
