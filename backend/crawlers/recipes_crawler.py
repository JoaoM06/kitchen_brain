#!/usr/bin/env python3
"""
Crawler para coleta de receitas de sites brasileiros.
Salva dados em formato JSON intermediário para posterior importação.

Uso:
    python -m crawlers.recipes_crawler --source tudogostoso --pages 10
    python -m crawlers.recipes_crawler --import-json recipes.json
"""
import sys
import os
import json
import time
import random
import re
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, asdict
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from unidecode import unidecode

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# User-Agent para evitar bloqueios
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
}

# Diretório de output
OUTPUT_DIR = Path(__file__).parent.parent / "data" / "recipes"


@dataclass
class Ingrediente:
    nome: str
    quantidade: Optional[str] = None
    unidade: Optional[str] = None
    observacao: Optional[str] = None


@dataclass
class Receita:
    titulo: str
    fonte: str
    url: str
    descricao: Optional[str] = None
    ingredientes: List[Dict[str, Any]] = None
    modo_preparo: List[str] = None
    tempo_preparo_min: Optional[int] = None
    rendimento_porcoes: Optional[int] = None
    categoria: Optional[str] = None
    dificuldade: Optional[str] = None
    imagem_url: Optional[str] = None
    data_coleta: str = None

    def __post_init__(self):
        if self.ingredientes is None:
            self.ingredientes = []
        if self.modo_preparo is None:
            self.modo_preparo = []
        if self.data_coleta is None:
            self.data_coleta = datetime.now().isoformat()


class RecipesCrawler:
    """Classe base para crawlers de receitas."""

    def __init__(self, delay_range=(1, 3)):
        self.session = requests.Session()
        self.session.headers.update(HEADERS)
        self.delay_range = delay_range
        self.recipes: List[Receita] = []

    def _delay(self):
        """Aguarda um tempo aleatório entre requisições."""
        time.sleep(random.uniform(*self.delay_range))

    def _get(self, url: str) -> Optional[BeautifulSoup]:
        """Faz uma requisição GET e retorna o BeautifulSoup."""
        try:
            self._delay()
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            return BeautifulSoup(response.text, "html.parser")
        except Exception as e:
            print(f"Erro ao acessar {url}: {e}")
            return None

    def _parse_tempo(self, texto: str) -> Optional[int]:
        """Converte texto de tempo para minutos."""
        if not texto:
            return None

        texto = texto.lower().strip()
        minutos = 0

        # Padrão: "1h30" ou "1h 30min"
        match = re.search(r"(\d+)\s*h", texto)
        if match:
            minutos += int(match.group(1)) * 60

        match = re.search(r"(\d+)\s*min", texto)
        if match:
            minutos += int(match.group(1))

        # Apenas número (assume minutos)
        if minutos == 0:
            match = re.search(r"(\d+)", texto)
            if match:
                minutos = int(match.group(1))

        return minutos if minutos > 0 else None

    def _parse_rendimento(self, texto: str) -> Optional[int]:
        """Extrai número de porções do texto."""
        if not texto:
            return None

        match = re.search(r"(\d+)", texto)
        if match:
            return int(match.group(1))
        return None

    def crawl(self, max_pages: int = 10) -> List[Receita]:
        """Método a ser implementado pelas subclasses."""
        raise NotImplementedError

    def save_json(self, filename: str = None):
        """Salva receitas em arquivo JSON."""
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"recipes_{timestamp}.json"

        filepath = OUTPUT_DIR / filename
        data = [asdict(r) for r in self.recipes]

        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"Salvo {len(self.recipes)} receitas em {filepath}")
        return filepath


class TudoGostosoCrawler(RecipesCrawler):
    """Crawler para o site TudoGostoso."""

    BASE_URL = "https://www.tudogostoso.com.br"

    def get_recipe_links(self, category_url: str, max_pages: int) -> List[str]:
        """Coleta links de receitas de uma categoria."""
        links = []

        for page in range(1, max_pages + 1):
            url = f"{category_url}?page={page}"
            print(f"Coletando links da página {page}...")

            soup = self._get(url)
            if not soup:
                continue

            # Encontrar cards de receitas
            cards = soup.select("a.card-link, a.recipe-card-link, .recipe-card a")
            for card in cards:
                href = card.get("href", "")
                if "/receita/" in href:
                    full_url = urljoin(self.BASE_URL, href)
                    if full_url not in links:
                        links.append(full_url)

            print(f"  -> {len(links)} links coletados até agora")

        return links

    def parse_recipe(self, url: str) -> Optional[Receita]:
        """Extrai dados de uma página de receita."""
        soup = self._get(url)
        if not soup:
            return None

        try:
            # Título
            titulo_el = soup.select_one("h1.recipe-title, h1")
            titulo = titulo_el.get_text(strip=True) if titulo_el else "Sem título"

            # Descrição
            desc_el = soup.select_one(".recipe-description, .description")
            descricao = desc_el.get_text(strip=True) if desc_el else None

            # Ingredientes
            ingredientes = []
            ing_list = soup.select(".ingredients-list li, .ingredient-item, [itemprop='recipeIngredient']")
            for ing in ing_list:
                texto = ing.get_text(strip=True)
                if texto:
                    # Tenta separar quantidade do nome
                    parsed = self._parse_ingrediente(texto)
                    ingredientes.append(asdict(parsed))

            # Modo de preparo
            modo_preparo = []
            steps = soup.select(".steps-list li, .step-item, [itemprop='recipeInstructions'] li")
            for step in steps:
                texto = step.get_text(strip=True)
                if texto:
                    modo_preparo.append(texto)

            # Se não encontrou em lista, tenta texto corrido
            if not modo_preparo:
                prep_el = soup.select_one(".recipe-steps, .preparation")
                if prep_el:
                    texto = prep_el.get_text(strip=True)
                    # Divide por pontos ou números
                    modo_preparo = [s.strip() for s in re.split(r'\d+\.|\n', texto) if s.strip()]

            # Tempo de preparo
            tempo_el = soup.select_one(".recipe-time, [itemprop='totalTime'], .prep-time")
            tempo_preparo = self._parse_tempo(tempo_el.get_text() if tempo_el else "")

            # Rendimento
            rend_el = soup.select_one(".recipe-yield, [itemprop='recipeYield'], .servings")
            rendimento = self._parse_rendimento(rend_el.get_text() if rend_el else "")

            # Categoria
            cat_el = soup.select_one(".recipe-category, .category-link")
            categoria = cat_el.get_text(strip=True) if cat_el else None

            # Imagem
            img_el = soup.select_one(".recipe-image img, [itemprop='image']")
            imagem_url = img_el.get("src") if img_el else None

            return Receita(
                titulo=titulo,
                fonte="TudoGostoso",
                url=url,
                descricao=descricao,
                ingredientes=ingredientes,
                modo_preparo=modo_preparo,
                tempo_preparo_min=tempo_preparo,
                rendimento_porcoes=rendimento,
                categoria=categoria,
                imagem_url=imagem_url,
            )

        except Exception as e:
            print(f"Erro ao parsear {url}: {e}")
            return None

    def _parse_ingrediente(self, texto: str) -> Ingrediente:
        """Tenta extrair quantidade, unidade e nome do ingrediente."""
        texto = texto.strip()

        # Padrões comuns: "2 xícaras de farinha", "1/2 kg de carne"
        patterns = [
            r"^([\d/,\.]+)\s*(xícara|colher|copo|kg|g|ml|l|unidade|un|pitada)s?\s*(?:de\s+)?(.+)$",
            r"^([\d/,\.]+)\s+(.+)$",
        ]

        for pattern in patterns:
            match = re.match(pattern, texto, re.IGNORECASE)
            if match:
                groups = match.groups()
                if len(groups) == 3:
                    return Ingrediente(nome=groups[2], quantidade=groups[0], unidade=groups[1])
                elif len(groups) == 2:
                    return Ingrediente(nome=groups[1], quantidade=groups[0])

        return Ingrediente(nome=texto)

    def crawl(self, max_pages: int = 10, categories: List[str] = None) -> List[Receita]:
        """Executa o crawling de receitas."""
        if categories is None:
            categories = [
                "/receitas/carnes/",
                "/receitas/aves/",
                "/receitas/peixes-e-frutos-do-mar/",
                "/receitas/massas/",
                "/receitas/sopas/",
                "/receitas/saladas/",
                "/receitas/bolos-e-tortas/",
                "/receitas/doces-e-sobremesas/",
            ]

        all_links = []
        for cat in categories:
            cat_url = urljoin(self.BASE_URL, cat)
            print(f"\nColetando categoria: {cat}")
            links = self.get_recipe_links(cat_url, max_pages)
            all_links.extend(links)

        # Remove duplicatas mantendo ordem
        all_links = list(dict.fromkeys(all_links))
        print(f"\nTotal de {len(all_links)} receitas para coletar")

        for i, url in enumerate(all_links, 1):
            print(f"[{i}/{len(all_links)}] Coletando: {url}")
            receita = self.parse_recipe(url)
            if receita:
                self.recipes.append(receita)

        print(f"\nColeta concluída: {len(self.recipes)} receitas")
        return self.recipes


def import_recipes_to_db(json_path: str):
    """Importa receitas do JSON para o banco de dados."""
    from app.db.session import SessionLocal
    from app.db.models.recipe import Receita as ReceitaModel, ImportacaoReceita, IngredienteReceita

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    db = SessionLocal()

    try:
        total_importadas = 0
        total_ignoradas = 0

        for item in data:
            # Verifica se já existe pela URL
            existe = db.query(ImportacaoReceita).filter(
                ImportacaoReceita.url == item["url"]
            ).first()

            if existe:
                total_ignoradas += 1
                continue

            # Cria a receita
            receita = ReceitaModel(
                titulo=item["titulo"],
                descricao=item.get("descricao"),
                tempo_preparo_min=item.get("tempo_preparo_min", 0) or 0,
                rendimento_porcoes=item.get("rendimento_porcoes", 1) or 1,
                usuario_id=None,  # Receitas do sistema não têm usuário
            )
            db.add(receita)
            db.flush()

            # Cria registro de importação
            importacao = ImportacaoReceita(
                receita_id=receita.id,
                fonte=item.get("fonte"),
                url=item["url"],
            )
            db.add(importacao)

            # Adiciona ingredientes
            for ing in item.get("ingredientes", []):
                ingrediente = IngredienteReceita(
                    receita_id=receita.id,
                    nome_livre=ing.get("nome"),
                    quantidade=ing.get("quantidade"),
                    unidade=ing.get("unidade"),
                    observacoes=ing.get("observacao"),
                )
                db.add(ingrediente)

            total_importadas += 1

        db.commit()
        print(f"Importação concluída:")
        print(f"  - Importadas: {total_importadas}")
        print(f"  - Ignoradas (já existem): {total_ignoradas}")

    except Exception as e:
        db.rollback()
        print(f"Erro na importação: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Crawler de receitas")
    parser.add_argument("--source", choices=["tudogostoso"], default="tudogostoso")
    parser.add_argument("--pages", type=int, default=5, help="Páginas por categoria")
    parser.add_argument("--output", type=str, help="Arquivo JSON de saída")
    parser.add_argument("--import-json", type=str, help="Importar JSON para o banco")

    args = parser.parse_args()

    if args.import_json:
        import_recipes_to_db(args.import_json)
    else:
        if args.source == "tudogostoso":
            crawler = TudoGostosoCrawler()

        crawler.crawl(max_pages=args.pages)
        crawler.save_json(args.output)
