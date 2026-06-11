"""Testes da implementação única de normalize_name (card 15)."""
import pytest

from app.utils.text import STOPWORDS, normalize_name


class TestNormalizeNameBasico:
    def test_baixa_caixa(self):
        assert normalize_name("LEITE") == "leite"

    def test_remove_acentos(self):
        assert normalize_name("Limão") == "limao"
        assert normalize_name("Açúcar Mascavo") == "acucar mascavo"

    def test_preserva_numeros(self):
        assert normalize_name("Leite 200ml") == "leite 200ml"
        assert normalize_name("Arroz 5kg") == "arroz 5kg"

    def test_troca_simbolos_por_espaco(self):
        assert normalize_name("Pão-de-queijo") == "pao queijo"
        assert normalize_name("Macarrão (parafuso)") == "macarrao parafuso"

    def test_colapsa_espacos(self):
        assert normalize_name("  feijão   preto  ") == "feijao preto"


class TestNormalizeNameStopwords:
    def test_remove_stopwords_comuns(self):
        # "de" é stopword
        assert normalize_name("Leite de Coco") == "leite coco"

    def test_remove_stopword_com(self):
        # "com" entra no conjunto canônico (não estava na versão do barcode.py)
        assert normalize_name("Iogurte com Mel") == "iogurte mel"

    @pytest.mark.parametrize("palavra", sorted(STOPWORDS))
    def test_stopword_isolada_some(self, palavra):
        assert normalize_name(palavra) == ""

    def test_nao_remove_substring_de_palavra(self):
        # "da" é stopword, mas "damasco" deve permanecer intacto
        assert normalize_name("Damasco") == "damasco"


class TestNormalizeNameEdgeCases:
    def test_none(self):
        assert normalize_name(None) == ""

    def test_string_vazia(self):
        assert normalize_name("") == ""

    def test_apenas_simbolos(self):
        assert normalize_name("!!!@#$%") == ""

    def test_apenas_stopwords(self):
        assert normalize_name("de do da com") == ""

    def test_idempotente(self):
        once = normalize_name("Açúcar Refinado de Cana")
        assert normalize_name(once) == once


class TestParidadeComportamentoAntigo:
    """Garante que a versão canônica reproduz a saída esperada das rotas
    (barcode/transcribe usavam regex + stopwords)."""

    @pytest.mark.parametrize(
        "entrada,esperado",
        [
            ("Coca-Cola 2L", "coca cola 2l"),
            ("Filé de Frango", "file frango"),
            ("Queijo Minas", "queijo minas"),
            ("Óleo de Soja 900ml", "oleo soja 900ml"),
        ],
    )
    def test_casos_reais(self, entrada, esperado):
        assert normalize_name(entrada) == esperado
