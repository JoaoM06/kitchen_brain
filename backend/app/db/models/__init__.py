<<<<<<< HEAD
from .user import User  # já existente
from .product import Produto, CodigoBarras
from .storage import LocalEstoque, ItemEstoque, MovimentoEstoque
from .recipe import Receita, IngredienteReceita, Playlist, Cardapio, Refeicao, ImportacaoReceita
from .shopping import ListaCompras, ItemLista
from .market import Mercado, PrecoProduto
from .media import AnexoMidia, LeituraOCR
from .lgpd import Consentimento, ExportacaoDados, ExclusaoConta

__all__ = [
    "User",
    "Produto", "CodigoBarras",
    "LocalEstoque", "ItemEstoque", "MovimentoEstoque",
    "Receita", "IngredienteReceita", "Playlist", "Cardapio", "Refeicao", "ImportacaoReceita",
    "ListaCompras", "ItemLista",
    "Mercado", "PrecoProduto",
    "AnexoMidia", "LeituraOCR",
    "Consentimento", "ExportacaoDados", "ExclusaoConta","UserSettings", "MobileDevice"
]
=======
from .user import User
from .storage import LocalEstoque, ItemEstoque, MovimentoEstoque
from .product import Produto, CodigoBarras, ProdutoGenerico
from .recipe import Receita, IngredienteReceita, Playlist, Cardapio, Refeicao, ImportacaoReceita
from .shopping import ListaCompras, ItemLista
from .market import Mercado, PrecoProduto
from .media import AnexoMidia, LeituraOCR
from .lgpd import Consentimento, ExportacaoDados, ExclusaoConta

__all__ = [
    "User",
    "Produto", "CodigoBarras", "ProdutoGenerico",
    "LocalEstoque", "ItemEstoque", "MovimentoEstoque",
    "Receita", "IngredienteReceita", "Playlist", "Cardapio", "Refeicao", "ImportacaoReceita",
    "ListaCompras", "ItemLista",
    "Mercado", "PrecoProduto",
    "AnexoMidia", "LeituraOCR",
    "Consentimento", "ExportacaoDados", "ExclusaoConta","UserSettings", "MobileDevice"
]
>>>>>>> origin/integracao-funciona-por-favor
