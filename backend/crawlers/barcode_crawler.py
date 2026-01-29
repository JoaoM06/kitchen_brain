#!/usr/bin/env python3
"""
Integração com Open Food Facts API para busca de produtos por código de barras.
API gratuita e aberta com dados de produtos alimentícios do mundo todo.

Docs: https://world.openfoodfacts.org/api/v2/
"""
import time
import json
from typing import Optional, Dict, Any
from pathlib import Path
from dataclasses import dataclass, asdict
from datetime import datetime

import requests

# Cache local para evitar requests repetidos
CACHE_DIR = Path(__file__).parent.parent / "data" / "barcode_cache"

# User-Agent requerido pela Open Food Facts
HEADERS = {
    "User-Agent": "KitchenBrain/1.0 (contact@kitchenbrain.app)",
    "Accept": "application/json",
}


@dataclass
class ProdutoBarcode:
    """Dados de produto obtidos via código de barras."""
    codigo: str
    nome: str
    marca: Optional[str] = None
    categoria: Optional[str] = None
    imagem_url: Optional[str] = None
    quantidade: Optional[str] = None
    nutriscore: Optional[str] = None
    ingredientes: Optional[str] = None
    pais_origem: Optional[str] = None
    fonte: str = "openfoodfacts"
    data_consulta: str = None

    def __post_init__(self):
        if self.data_consulta is None:
            self.data_consulta = datetime.now().isoformat()


class OpenFoodFactsClient:
    """Cliente para a API Open Food Facts."""

    BASE_URL = "https://world.openfoodfacts.org/api/v2"
    BR_URL = "https://br.openfoodfacts.org/api/v2"

    def __init__(self, use_cache: bool = True, cache_ttl_hours: int = 24 * 7):
        self.session = requests.Session()
        self.session.headers.update(HEADERS)
        self.use_cache = use_cache
        self.cache_ttl_seconds = cache_ttl_hours * 3600

        if use_cache:
            CACHE_DIR.mkdir(parents=True, exist_ok=True)

    def _get_cache_path(self, barcode: str) -> Path:
        """Retorna o caminho do arquivo de cache para um código."""
        return CACHE_DIR / f"{barcode}.json"

    def _read_cache(self, barcode: str) -> Optional[Dict]:
        """Lê dados do cache se existir e não estiver expirado."""
        if not self.use_cache:
            return None

        cache_path = self._get_cache_path(barcode)
        if not cache_path.exists():
            return None

        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            # Verifica TTL
            cached_time = datetime.fromisoformat(data.get("_cached_at", "2000-01-01"))
            age_seconds = (datetime.now() - cached_time).total_seconds()

            if age_seconds < self.cache_ttl_seconds:
                return data

        except Exception:
            pass

        return None

    def _write_cache(self, barcode: str, data: Dict):
        """Salva dados no cache."""
        if not self.use_cache:
            return

        cache_path = self._get_cache_path(barcode)
        data["_cached_at"] = datetime.now().isoformat()

        try:
            with open(cache_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception:
            pass

    def lookup(self, barcode: str) -> Optional[ProdutoBarcode]:
        """
        Busca produto pelo código de barras.
        Retorna ProdutoBarcode ou None se não encontrado.
        """
        barcode = barcode.strip()
        if not barcode:
            return None

        # Tenta cache primeiro
        cached = self._read_cache(barcode)
        if cached and cached.get("status") == 1:
            return self._parse_response(barcode, cached)

        # Tenta API brasileira primeiro, depois global
        for base_url in [self.BR_URL, self.BASE_URL]:
            try:
                url = f"{base_url}/product/{barcode}.json"
                response = self.session.get(url, timeout=10)
                response.raise_for_status()

                data = response.json()

                if data.get("status") == 1:
                    self._write_cache(barcode, data)
                    return self._parse_response(barcode, data)

                # Delay entre tentativas para diferentes servidores
                time.sleep(0.5)

            except Exception as e:
                print(f"Erro ao buscar {barcode} em {base_url}: {e}")
                continue

        # Salva no cache que não encontrou
        self._write_cache(barcode, {"status": 0, "code": barcode})
        return None

    def _parse_response(self, barcode: str, data: Dict) -> Optional[ProdutoBarcode]:
        """Extrai dados relevantes da resposta da API."""
        product = data.get("product", {})

        if not product:
            return None

        # Nome do produto (vários campos possíveis)
        nome = (
            product.get("product_name_pt") or
            product.get("product_name_pt-br") or
            product.get("product_name") or
            product.get("generic_name_pt") or
            product.get("generic_name") or
            "Produto sem nome"
        )

        # Marca
        marca = product.get("brands", "").split(",")[0].strip() or None

        # Categoria (pega a primeira)
        categorias = product.get("categories_tags", [])
        categoria = None
        if categorias:
            # Remove prefixo "en:" ou "pt:" e pega primeira
            cat = categorias[0].replace("en:", "").replace("pt:", "").replace("-", " ")
            categoria = cat.title()

        # Imagem
        imagem = product.get("image_url") or product.get("image_front_url")

        # Quantidade
        quantidade = product.get("quantity")

        # NutriScore
        nutriscore = product.get("nutriscore_grade")

        # Ingredientes
        ingredientes = product.get("ingredients_text_pt") or product.get("ingredients_text")

        # País de origem
        paises = product.get("countries_tags", [])
        pais_origem = None
        if paises:
            pais = paises[0].replace("en:", "").replace("pt:", "")
            pais_origem = pais.replace("-", " ").title()

        return ProdutoBarcode(
            codigo=barcode,
            nome=nome,
            marca=marca,
            categoria=categoria,
            imagem_url=imagem,
            quantidade=quantidade,
            nutriscore=nutriscore,
            ingredientes=ingredientes,
            pais_origem=pais_origem,
        )

    def search(self, query: str, page: int = 1, page_size: int = 20) -> list:
        """
        Busca produtos por texto.
        Retorna lista de ProdutoBarcode.
        """
        try:
            url = f"{self.BR_URL}/search"
            params = {
                "search_terms": query,
                "page": page,
                "page_size": page_size,
                "json": 1,
            }

            response = self.session.get(url, params=params, timeout=15)
            response.raise_for_status()

            data = response.json()
            products = data.get("products", [])

            results = []
            for p in products:
                barcode = p.get("code")
                if barcode:
                    parsed = self._parse_response(barcode, {"product": p, "status": 1})
                    if parsed:
                        results.append(parsed)

            return results

        except Exception as e:
            print(f"Erro na busca: {e}")
            return []


def batch_lookup(barcodes: list, client: OpenFoodFactsClient = None) -> Dict[str, Optional[ProdutoBarcode]]:
    """
    Busca múltiplos códigos de barras.
    Retorna dict: {barcode: ProdutoBarcode ou None}
    """
    if client is None:
        client = OpenFoodFactsClient()

    results = {}
    for barcode in barcodes:
        print(f"Buscando: {barcode}...")
        results[barcode] = client.lookup(barcode)
        time.sleep(0.3)  # Rate limiting

    return results


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Busca produtos por código de barras")
    parser.add_argument("--barcode", "-b", type=str, help="Código de barras para buscar")
    parser.add_argument("--search", "-s", type=str, help="Busca por texto")
    parser.add_argument("--no-cache", action="store_true", help="Ignora cache")

    args = parser.parse_args()

    client = OpenFoodFactsClient(use_cache=not args.no_cache)

    if args.barcode:
        produto = client.lookup(args.barcode)
        if produto:
            print(json.dumps(asdict(produto), indent=2, ensure_ascii=False))
        else:
            print(f"Produto não encontrado: {args.barcode}")

    elif args.search:
        produtos = client.search(args.search)
        print(f"Encontrados {len(produtos)} produtos:")
        for p in produtos:
            print(f"  [{p.codigo}] {p.nome} ({p.marca})")

    else:
        # Teste com códigos conhecidos
        test_codes = [
            "7891000100103",  # Leite Ninho
            "7896045100019",  # Macarrão Adria
            "7891910000197",  # Coca-Cola
        ]

        print("Testando com códigos conhecidos...")
        for code in test_codes:
            produto = client.lookup(code)
            if produto:
                print(f"\n[{code}]")
                print(f"  Nome: {produto.nome}")
                print(f"  Marca: {produto.marca}")
                print(f"  Categoria: {produto.categoria}")
            else:
                print(f"\n[{code}] Não encontrado")
