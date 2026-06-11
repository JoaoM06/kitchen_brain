"""Utilitários de texto compartilhados.

Implementação única de ``normalize_name``, antes duplicada (com stopwords
divergentes) em ``app/api/routes/barcode.py``, ``app/api/routes/transcribe.py``
e ``scripts/seed_produtos_genericos.py``.
"""
import re

from unidecode import unidecode

# Stopwords PT-BR removidas na normalização de nomes de produtos para busca.
# Conjunto canônico: superset das versões anteriores (a de transcribe.py era a
# mais completa; a de barcode.py não tinha "um/uma/uns/umas/com"; a do seed não
# removia stopword nenhuma).
STOPWORDS = {
    "de", "do", "da", "dos", "das", "e", "em", "para", "no", "na",
    "a", "o", "um", "uma", "uns", "umas", "com",
}


def normalize_name(s: str) -> str:
    """Normaliza um nome de produto para busca.

    Remove acentos, baixa a caixa, troca caracteres não-alfanuméricos por
    espaço e remove stopwords PT-BR. É idempotente e tolerante a ``None``.

    >>> normalize_name("Leite de Coco 200ml")
    'leite coco 200ml'
    >>> normalize_name(None)
    ''
    """
    s = unidecode(s or "").lower()
    s = re.sub(r"[^a-z0-9\s]", " ", s)
    parts = [p for p in s.split() if p and p not in STOPWORDS]
    return " ".join(parts)
