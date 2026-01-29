#!/usr/bin/env python3
"""
Script para popular a tabela de produtos genéricos com ~500 itens comuns.
Executar com: python -m scripts.seed_produtos_genericos
"""
import sys
import os

# Adicionar o diretório raiz ao path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from unidecode import unidecode
from sqlalchemy.dialects.postgresql import insert
from app.db.session import SessionLocal
from app.db.models.product import ProdutoGenerico


def normalize_name(name: str) -> str:
    """Normaliza nome para busca (lowercase, sem acentos)."""
    return unidecode(name).lower().strip()


# Lista de produtos genéricos organizados por categoria
PRODUTOS = {
    "frutas": [
        "Abacate", "Abacaxi", "Acerola", "Ameixa", "Amora", "Banana", "Banana Prata",
        "Banana Nanica", "Caju", "Caqui", "Carambola", "Cereja", "Coco", "Damasco",
        "Figo", "Framboesa", "Goiaba", "Graviola", "Jabuticaba", "Jaca", "Kiwi",
        "Laranja", "Laranja Lima", "Laranja Pera", "Limão", "Limão Siciliano",
        "Lichia", "Maçã", "Maçã Fuji", "Maçã Gala", "Maçã Verde", "Mamão",
        "Mamão Papaia", "Mamão Formosa", "Manga", "Manga Palmer", "Manga Tommy",
        "Maracujá", "Melancia", "Melão", "Mirtilo", "Morango", "Nectarina",
        "Pera", "Pêssego", "Pitanga", "Romã", "Tangerina", "Uva", "Uva Verde",
        "Uva Itália", "Uva Thompson",
    ],
    "verduras": [
        "Acelga", "Agrião", "Alface", "Alface Americana", "Alface Crespa",
        "Alface Roxa", "Almeirão", "Brócolis", "Catalonia", "Chicória",
        "Couve", "Couve Manteiga", "Couve Flor", "Escarola", "Espinafre",
        "Mostarda", "Repolho", "Repolho Roxo", "Rúcula", "Salsão",
    ],
    "legumes": [
        "Abóbora", "Abóbora Cabotiá", "Abóbora Japonesa", "Abobrinha",
        "Abobrinha Italiana", "Berinjela", "Beterraba", "Cará", "Cenoura",
        "Chuchu", "Inhame", "Jiló", "Mandioca", "Mandioquinha", "Maxixe",
        "Nabo", "Pepino", "Pimentão", "Pimentão Amarelo", "Pimentão Vermelho",
        "Pimentão Verde", "Quiabo", "Rabanete", "Tomate", "Tomate Cereja",
        "Tomate Italiano", "Vagem",
    ],
    "temperos_e_ervas": [
        "Alecrim", "Alho", "Alho Poró", "Cebola", "Cebola Roxa", "Cebolinha",
        "Cheiro Verde", "Coentro", "Cominho", "Gengibre", "Hortelã", "Louro",
        "Manjericão", "Orégano", "Pimenta", "Pimenta do Reino", "Pimenta Calabresa",
        "Pimenta Dedo de Moça", "Salsa", "Salsinha", "Tomilho", "Açafrão",
        "Canela", "Cravo", "Noz Moscada", "Páprica", "Curry", "Colorau",
    ],
    "carnes_bovinas": [
        "Acém", "Alcatra", "Carne Moída", "Carne de Sol", "Contra Filé",
        "Costela", "Coxão Duro", "Coxão Mole", "Cupim", "Filé Mignon",
        "Fraldinha", "Lagarto", "Maminha", "Músculo", "Patinho", "Picanha",
        "Paleta", "Rabada", "T-Bone",
    ],
    "carnes_suinas": [
        "Bacon", "Bisteca", "Costelinha", "Linguiça", "Linguiça Calabresa",
        "Linguiça Toscana", "Lombo", "Panceta", "Pernil", "Presunto",
        "Salsicha", "Tender", "Torresmo",
    ],
    "aves": [
        "Frango Inteiro", "Peito de Frango", "Coxa de Frango", "Sobrecoxa",
        "Asa de Frango", "Filé de Frango", "Frango Desfiado", "Coxinha da Asa",
        "Peru", "Chester", "Pato", "Codorna",
    ],
    "peixes_e_frutos_do_mar": [
        "Atum", "Bacalhau", "Camarão", "Caranguejo", "Corvina", "Dourado",
        "Lagosta", "Lula", "Marisco", "Merluza", "Pescada", "Polvo",
        "Robalo", "Salmão", "Sardinha", "Tilápia", "Truta", "Linguado",
        "Anchova", "Peixe Espada", "Mexilhão", "Ostra", "Vieira",
    ],
    "laticinios": [
        "Leite", "Leite Integral", "Leite Desnatado", "Leite Semidesnatado",
        "Leite em Pó", "Leite Condensado", "Creme de Leite", "Chantilly",
        "Iogurte", "Iogurte Natural", "Iogurte Grego", "Coalhada",
        "Queijo Minas", "Queijo Mussarela", "Queijo Prato", "Queijo Coalho",
        "Queijo Parmesão", "Queijo Provolone", "Queijo Gorgonzola",
        "Queijo Cottage", "Queijo Ricota", "Requeijão", "Cream Cheese",
        "Manteiga", "Margarina", "Nata",
    ],
    "ovos": [
        "Ovo de Galinha", "Ovo Caipira", "Ovo de Codorna", "Ovo Orgânico",
    ],
    "graos_e_cereais": [
        "Arroz", "Arroz Branco", "Arroz Integral", "Arroz Parboilizado",
        "Arroz Arbóreo", "Arroz Basmati", "Arroz Japonês", "Feijão",
        "Feijão Preto", "Feijão Carioca", "Feijão Branco", "Feijão Fradinho",
        "Feijão Vermelho", "Lentilha", "Grão de Bico", "Ervilha",
        "Soja", "Milho", "Milho de Pipoca", "Aveia", "Aveia em Flocos",
        "Farelo de Aveia", "Quinoa", "Chia", "Linhaça", "Gergelim",
        "Cevada", "Trigo para Quibe", "Cuscuz",
    ],
    "massas": [
        "Macarrão", "Espaguete", "Penne", "Fusilli", "Farfalle", "Talharim",
        "Lasanha", "Canelone", "Ravióli", "Capeletti", "Nhoque",
        "Macarrão Instantâneo", "Macarrão Integral", "Macarrão de Arroz",
    ],
    "paes_e_farinhas": [
        "Pão Francês", "Pão de Forma", "Pão Integral", "Pão Sírio",
        "Pão de Queijo", "Pão de Batata", "Bisnaguinha", "Croissant",
        "Torrada", "Farinha de Trigo", "Farinha Integral", "Farinha de Rosca",
        "Farinha de Mandioca", "Farinha de Milho", "Fubá", "Polvilho",
        "Polvilho Azedo", "Polvilho Doce", "Amido de Milho", "Fécula de Batata",
        "Farinha de Arroz", "Farinha de Aveia", "Farinha de Amendoim",
    ],
    "acucares_e_adocantes": [
        "Açúcar", "Açúcar Refinado", "Açúcar Mascavo", "Açúcar Demerara",
        "Açúcar Cristal", "Açúcar de Confeiteiro", "Mel", "Melado",
        "Adoçante", "Xilitol", "Eritritol", "Stevia",
    ],
    "oleos_e_gorduras": [
        "Óleo de Soja", "Óleo de Milho", "Óleo de Girassol", "Óleo de Canola",
        "Azeite de Oliva", "Azeite Extra Virgem", "Óleo de Coco",
        "Óleo de Gergelim", "Banha", "Gordura Vegetal",
    ],
    "molhos_e_condimentos": [
        "Molho de Tomate", "Extrato de Tomate", "Catchup", "Mostarda",
        "Maionese", "Molho de Soja", "Shoyu", "Vinagre", "Vinagre Balsâmico",
        "Vinagre de Maçã", "Molho Inglês", "Molho de Pimenta",
        "Molho Barbecue", "Molho Teriyaki", "Tahine", "Pesto",
        "Sal", "Sal Grosso", "Sal Rosa", "Caldo de Galinha", "Caldo de Carne",
        "Caldo de Legumes", "Tempero Pronto",
    ],
    "enlatados_e_conservas": [
        "Atum em Lata", "Sardinha em Lata", "Milho em Conserva",
        "Ervilha em Conserva", "Palmito", "Azeitona", "Azeitona Verde",
        "Azeitona Preta", "Pepino em Conserva", "Cogumelo em Conserva",
        "Aspargo em Conserva", "Alcaparra", "Tomate Pelado",
    ],
    "bebidas": [
        "Água Mineral", "Água com Gás", "Refrigerante", "Suco de Laranja",
        "Suco de Uva", "Suco de Maçã", "Suco de Maracujá", "Água de Coco",
        "Chá", "Chá Verde", "Chá Preto", "Chá de Camomila", "Café",
        "Café em Pó", "Café Solúvel", "Cappuccino", "Achocolatado",
        "Leite de Coco", "Leite de Amêndoas", "Leite de Soja", "Leite de Aveia",
        "Cerveja", "Vinho Tinto", "Vinho Branco", "Espumante",
    ],
    "congelados": [
        "Batata Frita Congelada", "Pizza Congelada", "Lasanha Congelada",
        "Hambúrguer Congelado", "Nuggets", "Empanado de Frango",
        "Legumes Congelados", "Açaí", "Polpa de Fruta", "Sorvete",
        "Picolé", "Pão de Queijo Congelado", "Coxinha Congelada",
    ],
    "doces_e_sobremesas": [
        "Chocolate", "Chocolate ao Leite", "Chocolate Amargo", "Chocolate Branco",
        "Bombom", "Bala", "Chiclete", "Gelatina", "Pudim",
        "Doce de Leite", "Goiabada", "Brigadeiro", "Beijinho",
        "Paçoca", "Pé de Moleque", "Cocada", "Rapadura",
    ],
    "biscoitos_e_snacks": [
        "Biscoito Água e Sal", "Biscoito Cream Cracker", "Biscoito Integral",
        "Biscoito Recheado", "Biscoito Amanteigado", "Bolacha Maria",
        "Cookie", "Wafer", "Torrada", "Granola", "Barra de Cereal",
        "Batata Chips", "Amendoim", "Castanha de Caju", "Castanha do Pará",
        "Nozes", "Amêndoas", "Pistache", "Mix de Nuts",
    ],
    "produtos_de_padaria": [
        "Bolo", "Bolo de Chocolate", "Bolo de Cenoura", "Bolo de Laranja",
        "Sonho", "Pão Doce", "Rosca", "Panetone", "Colomba Pascal",
        "Cupcake", "Brownie", "Empada", "Pastel", "Coxinha", "Esfiha",
    ],
    "produtos_para_cafe": [
        "Café em Grãos", "Café Moído", "Cápsula de Café", "Filtro de Café",
        "Açúcar Sachê", "Adoçante Sachê", "Biscoito para Café",
    ],
    "produtos_orientais": [
        "Tofu", "Missô", "Nori", "Wasabi", "Gengibre em Conserva",
        "Arroz para Sushi", "Vinagre de Arroz", "Macarrão Udon",
        "Macarrão Soba", "Molho de Ostras", "Óleo de Gergelim Torrado",
        "Leite de Coco", "Pasta de Curry", "Broto de Feijão",
    ],
    "produtos_fitness": [
        "Whey Protein", "Albumina", "Creatina", "BCAA", "Pasta de Amendoim",
        "Pasta de Amendoim Integral", "Óleo de Coco", "Tapioca",
        "Farinha de Amêndoas", "Farinha de Coco", "Açúcar de Coco",
    ],
    "produtos_veganos": [
        "Proteína de Soja", "Carne de Soja", "Hambúrguer Vegano",
        "Salsicha Vegana", "Queijo Vegano", "Leite Vegetal",
        "Maionese Vegana", "Manteiga Vegana", "Chocolate Vegano",
    ],
}


def seed_produtos_genericos():
    """Popula a tabela de produtos genéricos com dados iniciais."""
    db = SessionLocal()

    try:
        total_inseridos = 0
        total_atualizados = 0

        for categoria, produtos in PRODUTOS.items():
            for nome in produtos:
                nome_normalizado = normalize_name(nome)

                # Upsert: insere ou atualiza se já existir
                stmt = insert(ProdutoGenerico).values(
                    nome=nome,
                    nome_normalizado=nome_normalizado,
                    categoria=categoria,
                    url_imagem=None
                )

                # Em caso de conflito no nome_normalizado, atualiza
                stmt = stmt.on_conflict_do_update(
                    index_elements=['nome_normalizado'],
                    set_={
                        'nome': stmt.excluded.nome,
                        'categoria': stmt.excluded.categoria,
                    }
                )

                result = db.execute(stmt)
                if result.rowcount > 0:
                    total_inseridos += 1

        db.commit()

        # Contar total de produtos
        total = db.query(ProdutoGenerico).count()

        print(f"Seed concluído!")
        print(f"- Produtos processados: {total_inseridos}")
        print(f"- Total na tabela: {total}")
        print(f"- Categorias: {len(PRODUTOS)}")

    except Exception as e:
        db.rollback()
        print(f"Erro ao popular produtos: {e}")
        raise
    finally:
        db.close()


def list_categorias():
    """Lista todas as categorias e quantidade de produtos."""
    for categoria, produtos in PRODUTOS.items():
        print(f"- {categoria}: {len(produtos)} produtos")
    print(f"\nTotal: {sum(len(p) for p in PRODUTOS.values())} produtos")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Seed de produtos genéricos")
    parser.add_argument("--list", action="store_true", help="Listar categorias")
    args = parser.parse_args()

    if args.list:
        list_categorias()
    else:
        seed_produtos_genericos()
