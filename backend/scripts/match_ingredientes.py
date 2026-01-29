#!/usr/bin/env python3
"""
Script para fazer match de ingredientes de receitas com produtos genéricos.
Usa similaridade de texto (trigram) para encontrar correspondências.

Uso:
    python -m scripts.match_ingredientes
    python -m scripts.match_ingredientes --dry-run
    python -m scripts.match_ingredientes --threshold 0.4
"""
import sys
import os
import re
from typing import Optional, List, Tuple
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from unidecode import unidecode
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.db.models.product import ProdutoGenerico
from app.db.models.recipe import IngredienteReceita, Receita


# Stopwords para remover do nome do ingrediente
STOPWORDS = {
    "de", "do", "da", "dos", "das", "e", "em", "para", "no", "na",
    "a", "o", "um", "uma", "uns", "umas", "com", "sem", "ou",
    "picado", "picada", "picados", "picadas",
    "cortado", "cortada", "cortados", "cortadas",
    "fatiado", "fatiada", "fatiados", "fatiadas",
    "ralado", "ralada", "ralados", "raladas",
    "moido", "moida", "moidos", "moidas",
    "inteiro", "inteira", "inteiros", "inteiras",
    "fresco", "fresca", "frescos", "frescas",
    "seco", "seca", "secos", "secas",
    "cozido", "cozida", "cozidos", "cozidas",
    "assado", "assada", "assados", "assadas",
    "frito", "frita", "fritos", "fritas",
    "gosto", "opcional", "necessario",
}

# Mapeamentos manuais para casos especiais
MAPEAMENTOS_MANUAIS = {
    "alho picado": "alho",
    "cebola picada": "cebola",
    "tomate picado": "tomate",
    "cheiro verde": "cheiro verde",
    "sal a gosto": "sal",
    "pimenta do reino": "pimenta do reino",
    "azeite de oliva": "azeite de oliva",
    "oleo de soja": "oleo de soja",
    "farinha de trigo": "farinha de trigo",
    "acucar refinado": "acucar refinado",
    "leite integral": "leite integral",
    "ovo de galinha": "ovo de galinha",
    "peito de frango": "peito de frango",
    "carne moida": "carne moida",
    "queijo mussarela": "queijo mussarela",
    "queijo parmesao": "queijo parmesao",
    "molho de tomate": "molho de tomate",
    "extrato de tomate": "extrato de tomate",
}


def normalize_ingrediente(nome: str) -> str:
    """Normaliza nome do ingrediente para busca."""
    if not nome:
        return ""

    # Remove acentos e converte para minúsculo
    nome = unidecode(nome).lower().strip()

    # Remove caracteres especiais
    nome = re.sub(r"[^a-z0-9\s]", " ", nome)

    # Remove stopwords
    palavras = [p for p in nome.split() if p and p not in STOPWORDS]

    return " ".join(palavras)


def get_best_match_trigram(
    db: Session,
    nome_ingrediente: str,
    threshold: float = 0.3
) -> Optional[Tuple[ProdutoGenerico, float]]:
    """
    Busca o melhor match usando trigram similarity do PostgreSQL.
    Retorna (produto, score) ou None se não encontrar.
    """
    nome_norm = normalize_ingrediente(nome_ingrediente)

    if not nome_norm:
        return None

    # Verifica mapeamento manual primeiro
    if nome_norm in MAPEAMENTOS_MANUAIS:
        nome_norm = MAPEAMENTOS_MANUAIS[nome_norm]

    try:
        result = (
            db.query(
                ProdutoGenerico,
                func.similarity(ProdutoGenerico.nome_normalizado, nome_norm).label("sim")
            )
            .filter(func.similarity(ProdutoGenerico.nome_normalizado, nome_norm) >= threshold)
            .order_by(func.similarity(ProdutoGenerico.nome_normalizado, nome_norm).desc())
            .first()
        )

        if result:
            return (result[0], float(result[1]))

    except Exception:
        # Fallback para busca simples se trigram não disponível
        pass

    return None


def get_best_match_simple(
    db: Session,
    nome_ingrediente: str,
    produtos_cache: List[ProdutoGenerico]
) -> Optional[Tuple[ProdutoGenerico, float]]:
    """
    Busca simples por substring matching (fallback).
    """
    nome_norm = normalize_ingrediente(nome_ingrediente)

    if not nome_norm:
        return None

    termos = nome_norm.split()
    best_match = None
    best_score = 0.0

    for produto in produtos_cache:
        prod_norm = produto.nome_normalizado or ""
        prod_termos = set(prod_norm.split())

        # Calcula score baseado em termos em comum
        matches = sum(1 for t in termos if t in prod_termos or any(t in pt for pt in prod_termos))
        if termos:
            score = matches / len(termos)

            if score > best_score:
                best_score = score
                best_match = produto

    if best_match and best_score >= 0.3:
        return (best_match, best_score)

    return None


def match_ingredientes(
    db: Session,
    threshold: float = 0.3,
    dry_run: bool = False,
    use_trigram: bool = True
) -> dict:
    """
    Processa todos os ingredientes sem produto vinculado e tenta fazer match.
    """
    stats = {
        "total_processados": 0,
        "total_matched": 0,
        "total_sem_match": 0,
        "matches_por_score": defaultdict(int),
        "sem_match": [],
    }

    # Carrega cache de produtos para fallback
    produtos_cache = db.query(ProdutoGenerico).all()
    print(f"Carregados {len(produtos_cache)} produtos genéricos")

    # Busca ingredientes sem produto vinculado
    ingredientes = (
        db.query(IngredienteReceita)
        .filter(IngredienteReceita.produto_id.is_(None))
        .filter(IngredienteReceita.nome_livre.isnot(None))
        .all()
    )

    print(f"Processando {len(ingredientes)} ingredientes sem match...")

    for ing in ingredientes:
        stats["total_processados"] += 1

        nome = ing.nome_livre.strip() if ing.nome_livre else ""
        if not nome:
            continue

        # Tenta match
        match = None
        if use_trigram:
            match = get_best_match_trigram(db, nome, threshold)

        if not match:
            match = get_best_match_simple(db, nome, produtos_cache)

        if match:
            produto, score = match
            stats["total_matched"] += 1

            # Categoriza por faixa de score
            if score >= 0.8:
                stats["matches_por_score"]["alto (>=0.8)"] += 1
            elif score >= 0.5:
                stats["matches_por_score"]["medio (0.5-0.8)"] += 1
            else:
                stats["matches_por_score"]["baixo (<0.5)"] += 1

            if not dry_run:
                ing.produto_id = produto.id

            print(f"  [{score:.2f}] '{nome}' -> '{produto.nome}'")
        else:
            stats["total_sem_match"] += 1
            stats["sem_match"].append(nome)

    if not dry_run:
        db.commit()
        print("\nAlterações salvas no banco.")
    else:
        print("\n[DRY RUN] Nenhuma alteração foi salva.")

    return stats


def generate_report(stats: dict):
    """Gera relatório dos resultados."""
    print("\n" + "=" * 60)
    print("RELATÓRIO DE MATCH DE INGREDIENTES")
    print("=" * 60)

    print(f"\nTotal processados: {stats['total_processados']}")
    print(f"Total com match:   {stats['total_matched']} ({stats['total_matched']/max(stats['total_processados'],1)*100:.1f}%)")
    print(f"Total sem match:   {stats['total_sem_match']} ({stats['total_sem_match']/max(stats['total_processados'],1)*100:.1f}%)")

    print("\nDistribuição por score:")
    for faixa, count in stats["matches_por_score"].items():
        print(f"  {faixa}: {count}")

    if stats["sem_match"]:
        print(f"\nTop 20 ingredientes sem match:")
        # Agrupa por nome normalizado para evitar duplicatas
        sem_match_unique = list(set(normalize_ingrediente(n) for n in stats["sem_match"]))[:20]
        for nome in sem_match_unique:
            print(f"  - {nome}")


def create_missing_produtos(db: Session, nomes: List[str], dry_run: bool = False):
    """
    Cria produtos genéricos para ingredientes sem match.
    Útil para expandir a base de dados.
    """
    # Agrupa e normaliza nomes únicos
    nomes_unicos = {}
    for nome in nomes:
        norm = normalize_ingrediente(nome)
        if norm and norm not in nomes_unicos:
            nomes_unicos[norm] = nome

    print(f"\nCriando {len(nomes_unicos)} novos produtos genéricos...")

    for norm, original in nomes_unicos.items():
        # Verifica se já existe
        existe = db.query(ProdutoGenerico).filter(
            ProdutoGenerico.nome_normalizado == norm
        ).first()

        if not existe and not dry_run:
            novo = ProdutoGenerico(
                nome=original.title(),
                nome_normalizado=norm,
                categoria="outros",
            )
            db.add(novo)
            print(f"  + {original.title()}")

    if not dry_run:
        db.commit()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Match ingredientes com produtos genéricos")
    parser.add_argument("--dry-run", action="store_true", help="Não salva alterações")
    parser.add_argument("--threshold", type=float, default=0.3, help="Score mínimo para match")
    parser.add_argument("--no-trigram", action="store_true", help="Não usar pg_trgm")
    parser.add_argument("--create-missing", action="store_true", help="Criar produtos para ingredientes sem match")

    args = parser.parse_args()

    db = SessionLocal()

    try:
        stats = match_ingredientes(
            db,
            threshold=args.threshold,
            dry_run=args.dry_run,
            use_trigram=not args.no_trigram,
        )

        generate_report(stats)

        if args.create_missing and stats["sem_match"]:
            create_missing_produtos(db, stats["sem_match"], args.dry_run)

    finally:
        db.close()
