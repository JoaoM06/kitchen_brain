"""
Rotas do Hub de Receitas - listagem, busca, sugestões e favoritos.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from typing import Optional, List
from datetime import date, timedelta
import uuid

from app.db.session import get_db
from app.api.deps import get_current_user
from app.db.models.user import User
from app.db.models.recipe import Receita, IngredienteReceita, Playlist, ImportacaoReceita
from app.db.models.storage import ItemEstoque
from app.db.models.product import ProdutoGenerico

router = APIRouter(prefix="/recipes", tags=["recipes"])


# ========== Schemas ==========

class IngredienteOut(BaseModel):
    id: str
    nome: str
    quantidade: Optional[float] = None
    unidade: Optional[str] = None
    observacoes: Optional[str] = None
    produto_generico_id: Optional[str] = None

    class Config:
        from_attributes = True


class ReceitaBase(BaseModel):
    id: str
    titulo: str
    descricao: Optional[str] = None
    tempo_preparo_min: int
    rendimento_porcoes: int
    categoria: Optional[str] = None
    imagem_url: Optional[str] = None
    fonte: Optional[str] = None

    class Config:
        from_attributes = True


class ReceitaDetail(ReceitaBase):
    ingredientes: List[IngredienteOut]
    modo_preparo: Optional[List[str]] = None
    is_favorita: bool = False


class ReceitaCreate(BaseModel):
    titulo: str
    descricao: Optional[str] = None
    tempo_preparo_min: int = 0
    rendimento_porcoes: int = 1
    ingredientes: List[dict]
    modo_preparo: Optional[List[str]] = None


class ReceitaSugerida(ReceitaBase):
    match_percent: float
    ingredientes_disponiveis: int
    ingredientes_total: int
    ingredientes_faltando: List[str]


class IngredienteDisponibilidade(BaseModel):
    nome: str
    quantidade_necessaria: Optional[float] = None
    unidade: Optional[str] = None
    disponivel: bool
    quantidade_estoque: Optional[float] = None
    vencendo_em_dias: Optional[int] = None


# ========== Rotas ==========

@router.get("", response_model=List[ReceitaBase])
def list_recipes(
    q: Optional[str] = Query(None, description="Busca por título"),
    categoria: Optional[str] = Query(None),
    tempo_max: Optional[int] = Query(None, description="Tempo máximo de preparo em minutos"),
    limit: int = Query(20, le=100),
    offset: int = Query(0),
    db: Session = Depends(get_db)
):
    """Lista receitas com filtros opcionais."""
    query = db.query(Receita)

    if q:
        query = query.filter(Receita.titulo.ilike(f"%{q}%"))

    if categoria:
        query = query.join(ImportacaoReceita, isouter=True)
        # Filtrar por categoria da importação ou fonte

    if tempo_max:
        query = query.filter(Receita.tempo_preparo_min <= tempo_max)

    receitas = query.offset(offset).limit(limit).all()

    return [
        ReceitaBase(
            id=str(r.id),
            titulo=r.titulo,
            descricao=r.descricao,
            tempo_preparo_min=r.tempo_preparo_min,
            rendimento_porcoes=r.rendimento_porcoes,
            categoria=r.importacao.fonte if r.importacao else None,
            imagem_url=None,
            fonte=r.importacao.fonte if r.importacao else "usuário",
        )
        for r in receitas
    ]


@router.get("/suggested", response_model=List[ReceitaSugerida])
def get_suggested_recipes(
    limit: int = Query(10, le=50),
    offset: int = Query(0, ge=0),
    priorizar_vencendo: bool = Query(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna receitas sugeridas com base no estoque do usuário.
    Ordena por % de ingredientes disponíveis.
    """
    # Busca itens no estoque do usuário
    estoque = (
        db.query(ItemEstoque)
        .filter(ItemEstoque.usuario_id == current_user.id)
        .filter(ItemEstoque.quantidade > 0)
        .all()
    )

    # Set de produtos genéricos disponíveis
    produtos_disponiveis = {str(item.produto_generico_id) for item in estoque}

    # Identifica itens vencendo em 7 dias
    hoje = date.today()
    limite_validade = hoje + timedelta(days=7)
    produtos_vencendo = {
        str(item.produto_generico_id)
        for item in estoque
        if item.validade and item.validade <= limite_validade
    }

    # Busca candidatos para scoring — 200 é suficiente para ranking relevante
    receitas = (
        db.query(Receita)
        .options(joinedload(Receita.ingredientes))
        .limit(200)
        .all()
    )

    # Calcula match para cada receita
    resultados = []

    for receita in receitas:
        if not receita.ingredientes:
            continue

        total = len(receita.ingredientes)
        disponiveis = 0
        faltando = []
        tem_vencendo = False

        for ing in receita.ingredientes:
            prod_id = str(ing.produto_id) if ing.produto_id else None

            if prod_id and prod_id in produtos_disponiveis:
                disponiveis += 1
                if prod_id in produtos_vencendo:
                    tem_vencendo = True
            else:
                faltando.append(ing.nome_livre or "Ingrediente")

        match_percent = (disponiveis / total * 100) if total > 0 else 0

        # Boost para receitas com ingredientes vencendo
        score = match_percent
        if priorizar_vencendo and tem_vencendo:
            score += 20

        resultados.append({
            "receita": receita,
            "match_percent": match_percent,
            "disponiveis": disponiveis,
            "total": total,
            "faltando": faltando[:5],  # Máximo 5 ingredientes faltando
            "score": score,
        })

    # Ordena por score (match + bonus vencendo) e aplica paginação pós-ranking
    resultados.sort(key=lambda x: x["score"], reverse=True)
    page = resultados[offset : offset + limit]

    return [
        ReceitaSugerida(
            id=str(r["receita"].id),
            titulo=r["receita"].titulo,
            descricao=r["receita"].descricao,
            tempo_preparo_min=r["receita"].tempo_preparo_min,
            rendimento_porcoes=r["receita"].rendimento_porcoes,
            categoria=None,
            imagem_url=None,
            fonte=r["receita"].importacao.fonte if r["receita"].importacao else "usuário",
            match_percent=round(r["match_percent"], 1),
            ingredientes_disponiveis=r["disponiveis"],
            ingredientes_total=r["total"],
            ingredientes_faltando=r["faltando"],
        )
        for r in page
    ]


@router.get("/{recipe_id}", response_model=ReceitaDetail)
def get_recipe(
    recipe_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retorna detalhes de uma receita."""
    receita = (
        db.query(Receita)
        .options(joinedload(Receita.ingredientes))
        .filter(Receita.id == recipe_id)
        .first()
    )

    if not receita:
        raise HTTPException(status_code=404, detail="Receita não encontrada")

    # Verifica se é favorita
    is_favorita = False
    playlist_favoritos = (
        db.query(Playlist)
        .filter(Playlist.usuario_id == current_user.id)
        .filter(Playlist.nome == "Favoritos")
        .first()
    )
    if playlist_favoritos and receita in playlist_favoritos.receitas:
        is_favorita = True

    return ReceitaDetail(
        id=str(receita.id),
        titulo=receita.titulo,
        descricao=receita.descricao,
        tempo_preparo_min=receita.tempo_preparo_min,
        rendimento_porcoes=receita.rendimento_porcoes,
        categoria=receita.importacao.fonte if receita.importacao else None,
        imagem_url=None,
        fonte=receita.importacao.fonte if receita.importacao else "usuário",
        ingredientes=[
            IngredienteOut(
                id=str(ing.id),
                nome=ing.nome_livre or "",
                quantidade=float(ing.quantidade) if ing.quantidade else None,
                unidade=ing.unidade,
                observacoes=ing.observacoes,
                produto_generico_id=str(ing.produto_id) if ing.produto_id else None,
            )
            for ing in receita.ingredientes
        ],
        modo_preparo=None,  # TODO: adicionar campo no modelo
        is_favorita=is_favorita,
    )


@router.get("/{recipe_id}/availability", response_model=List[IngredienteDisponibilidade])
def check_recipe_availability(
    recipe_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Verifica disponibilidade de cada ingrediente da receita no estoque do usuário.
    """
    receita = (
        db.query(Receita)
        .options(joinedload(Receita.ingredientes))
        .filter(Receita.id == recipe_id)
        .first()
    )

    if not receita:
        raise HTTPException(status_code=404, detail="Receita não encontrada")

    # Busca estoque do usuário indexado por produto_generico_id
    estoque = (
        db.query(ItemEstoque)
        .filter(ItemEstoque.usuario_id == current_user.id)
        .all()
    )
    estoque_map = {str(item.produto_generico_id): item for item in estoque}

    hoje = date.today()
    resultado = []

    for ing in receita.ingredientes:
        prod_id = str(ing.produto_id) if ing.produto_id else None
        item_estoque = estoque_map.get(prod_id) if prod_id else None

        disponivel = False
        quantidade_estoque = None
        vencendo_em_dias = None

        if item_estoque and item_estoque.quantidade > 0:
            disponivel = True
            quantidade_estoque = float(item_estoque.quantidade)

            if item_estoque.validade:
                dias = (item_estoque.validade - hoje).days
                if dias >= 0:
                    vencendo_em_dias = dias

        resultado.append(IngredienteDisponibilidade(
            nome=ing.nome_livre or "Ingrediente",
            quantidade_necessaria=float(ing.quantidade) if ing.quantidade else None,
            unidade=ing.unidade,
            disponivel=disponivel,
            quantidade_estoque=quantidade_estoque,
            vencendo_em_dias=vencendo_em_dias,
        ))

    return resultado


@router.post("", response_model=ReceitaBase)
def create_recipe(
    data: ReceitaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cria uma nova receita do usuário."""
    receita = Receita(
        usuario_id=current_user.id,
        titulo=data.titulo,
        descricao=data.descricao,
        tempo_preparo_min=data.tempo_preparo_min,
        rendimento_porcoes=data.rendimento_porcoes,
    )
    db.add(receita)
    db.flush()

    # Adiciona ingredientes
    for ing_data in data.ingredientes:
        ingrediente = IngredienteReceita(
            receita_id=receita.id,
            nome_livre=ing_data.get("nome"),
            quantidade=ing_data.get("quantidade"),
            unidade=ing_data.get("unidade"),
            observacoes=ing_data.get("observacoes"),
            produto_id=ing_data.get("produto_generico_id"),
        )
        db.add(ingrediente)

    db.commit()
    db.refresh(receita)

    return ReceitaBase(
        id=str(receita.id),
        titulo=receita.titulo,
        descricao=receita.descricao,
        tempo_preparo_min=receita.tempo_preparo_min,
        rendimento_porcoes=receita.rendimento_porcoes,
        categoria=None,
        imagem_url=None,
        fonte="usuário",
    )


@router.post("/{recipe_id}/favorite")
def toggle_favorite(
    recipe_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Adiciona ou remove receita dos favoritos."""
    receita = db.query(Receita).filter(Receita.id == recipe_id).first()
    if not receita:
        raise HTTPException(status_code=404, detail="Receita não encontrada")

    # Obtém ou cria playlist de favoritos
    playlist = (
        db.query(Playlist)
        .filter(Playlist.usuario_id == current_user.id)
        .filter(Playlist.nome == "Favoritos")
        .first()
    )

    if not playlist:
        playlist = Playlist(
            usuario_id=current_user.id,
            nome="Favoritos",
            descricao="Minhas receitas favoritas",
        )
        db.add(playlist)
        db.flush()

    # Toggle favorito
    is_favorita = receita in playlist.receitas

    if is_favorita:
        playlist.receitas.remove(receita)
        action = "removed"
    else:
        playlist.receitas.append(receita)
        action = "added"

    db.commit()

    return {
        "success": True,
        "action": action,
        "is_favorita": not is_favorita,
    }


@router.get("/playlists/favoritos", response_model=List[ReceitaBase])
def get_favoritos(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retorna receitas favoritas do usuário."""
    playlist = (
        db.query(Playlist)
        .options(joinedload(Playlist.receitas))
        .filter(Playlist.usuario_id == current_user.id)
        .filter(Playlist.nome == "Favoritos")
        .first()
    )

    if not playlist:
        return []

    return [
        ReceitaBase(
            id=str(r.id),
            titulo=r.titulo,
            descricao=r.descricao,
            tempo_preparo_min=r.tempo_preparo_min,
            rendimento_porcoes=r.rendimento_porcoes,
            categoria=None,
            imagem_url=None,
            fonte=r.importacao.fonte if r.importacao else "usuário",
        )
        for r in playlist.receitas
    ]
