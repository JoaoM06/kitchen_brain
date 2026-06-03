"""
Rotas do CardapioBot - geração de cardápios personalizados com IA.
Move a lógica de IA do frontend para o backend, protegendo a API key.
"""
import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import date, timedelta
import json
import uuid

logger = logging.getLogger(__name__)

from app.db.session import get_db
from app.api.deps import get_current_user
from app.db.models.user import User
from app.db.models.storage import ItemEstoque
from app.db.models.recipe import Receita, Cardapio, Refeicao
from app.core.config import settings

router = APIRouter(prefix="/cardapiobot", tags=["cardapiobot"])


# ========== Schemas ==========

class CardapioRequest(BaseModel):
    dias: int = 7
    orcamento: Optional[float] = None
    tempo_max_preparo: Optional[int] = None  # minutos
    porcoes: int = 2
    estilo_alimentar: Optional[str] = None  # vegetariano, vegano, low-carb, etc
    culinarias: Optional[List[str]] = None  # brasileira, italiana, japonesa, etc
    equipamentos: Optional[List[str]] = None  # forno, air fryer, etc
    mensagem_adicional: Optional[str] = None


class ChatMessage(BaseModel):
    role: str  # user, assistant
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    context: Optional[Dict[str, Any]] = None


class MealInfo(BaseModel):
    tipo: str  # cafe, almoco, janta, lanche
    receita_nome: str
    tempo_preparo: Optional[int] = None
    ingredientes_principais: Optional[List[str]] = None


class DayMenu(BaseModel):
    data: str
    dia_semana: str
    refeicoes: List[MealInfo]


class CardapioResponse(BaseModel):
    id: Optional[str] = None
    titulo: str
    dias: List[DayMenu]
    dicas: Optional[List[str]] = None
    lista_compras_sugerida: Optional[List[str]] = None


class CardapioHistoryItem(BaseModel):
    id: str
    titulo: str
    inicio: str
    fim: str
    criado_em: str


# ========== Helpers ==========

def get_user_context(db: Session, user: User) -> Dict[str, Any]:
    """Monta contexto do usuário para o prompt."""
    # Estoque do usuário
    estoque = (
        db.query(ItemEstoque)
        .filter(ItemEstoque.usuario_id == user.id)
        .filter(ItemEstoque.quantidade > 0)
        .all()
    )

    hoje = date.today()
    limite_validade = hoje + timedelta(days=7)

    itens_estoque = []
    itens_vencendo = []

    for item in estoque:
        nome = item.produto_generico.nome if item.produto_generico else "Item"
        itens_estoque.append(nome)

        if item.validade and item.validade <= limite_validade:
            dias = (item.validade - hoje).days
            itens_vencendo.append(f"{nome} (vence em {dias} dias)")

    # Preferências do usuário
    preferencias = user.preferencias or {}
    alergias = user.alergias or []
    restricoes = user.restricoes_alimentares or []

    return {
        "estoque": itens_estoque[:50],  # Limita para não estourar contexto
        "itens_vencendo": itens_vencendo[:10],
        "preferencias": preferencias,
        "alergias": alergias,
        "restricoes": restricoes,
    }


def build_system_prompt(user_context: Dict[str, Any], params: CardapioRequest) -> str:
    """Constrói o prompt de sistema para o Gemini."""

    estoque_str = ", ".join(user_context.get("estoque", [])) or "não informado"
    vencendo_str = ", ".join(user_context.get("itens_vencendo", [])) or "nenhum"
    alergias_str = ", ".join(user_context.get("alergias", [])) or "nenhuma"
    restricoes_str = ", ".join(user_context.get("restricoes", [])) or "nenhuma"

    culinarias_str = ", ".join(params.culinarias) if params.culinarias else "variada"
    equipamentos_str = ", ".join(params.equipamentos) if params.equipamentos else "básicos (fogão, forno)"

    return f"""Você é o CardapioBot, um assistente culinário especializado em criar cardápios personalizados.

## Contexto do Usuário

### Estoque disponível:
{estoque_str}

### Itens vencendo em breve (PRIORIZE USAR):
{vencendo_str}

### Restrições alimentares:
- Alergias: {alergias_str}
- Restrições: {restricoes_str}
- Estilo: {params.estilo_alimentar or "sem preferência"}

### Parâmetros do cardápio:
- Dias: {params.dias}
- Porções por refeição: {params.porcoes}
- Orçamento: {"R$ " + str(params.orcamento) if params.orcamento else "não definido"}
- Tempo máximo de preparo: {str(params.tempo_max_preparo) + " min" if params.tempo_max_preparo else "flexível"}
- Culinárias preferidas: {culinarias_str}
- Equipamentos disponíveis: {equipamentos_str}

## Instruções

1. Crie um cardápio completo para {params.dias} dias
2. Inclua café da manhã, almoço e jantar (e lanches se apropriado)
3. PRIORIZE usar os itens que estão vencendo em breve
4. Respeite TODAS as alergias e restrições alimentares
5. Varie as receitas para não repetir pratos próximos
6. Considere praticidade - nem todas as refeições precisam ser elaboradas

## Formato de Resposta

Responda SEMPRE em JSON válido seguindo este schema:
{{
  "titulo": "Cardápio Semanal",
  "dias": [
    {{
      "data": "2024-01-29",
      "dia_semana": "Segunda",
      "refeicoes": [
        {{
          "tipo": "cafe",
          "receita_nome": "Nome da receita",
          "tempo_preparo": 15,
          "ingredientes_principais": ["ingrediente1", "ingrediente2"]
        }}
      ]
    }}
  ],
  "dicas": ["Dica útil sobre o cardápio"],
  "lista_compras_sugerida": ["item1", "item2"]
}}

Não inclua nada além do JSON na resposta."""


def get_genai_client():
    """Obtém cliente do Gemini se configurado."""
    if not settings.GEMINI_API_KEY:
        return None
    try:
        from google import genai
        return genai.Client(api_key=settings.GEMINI_API_KEY)
    except ImportError:
        return None


# ========== Rotas ==========

@router.post("/generate", response_model=CardapioResponse)
def generate_cardapio(
    params: CardapioRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Gera um cardápio personalizado usando IA.
    Considera estoque do usuário, preferências e restrições.
    """
    client = get_genai_client()

    if not client:
        raise HTTPException(
            status_code=503,
            detail="Serviço de IA não configurado. Configure GEMINI_API_KEY no backend."
        )

    # Monta contexto
    user_context = get_user_context(db, current_user)
    system_prompt = build_system_prompt(user_context, params)

    user_message = "Gere o cardápio conforme as instruções."
    if params.mensagem_adicional:
        user_message += f"\n\nObservação adicional: {params.mensagem_adicional}"

    try:
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL_NAME,
            contents=[
                {"role": "user", "parts": [{"text": system_prompt + "\n\n" + user_message}]}
            ],
            config={
                "response_mime_type": "application/json",
            }
        )

        # Parse do JSON
        result_text = response.text.strip()
        cardapio_data = json.loads(result_text)

        return CardapioResponse(**cardapio_data)

    except json.JSONDecodeError:
        logger.exception("cardapio_json_parse_failed")
        raise HTTPException(status_code=500, detail="Erro ao processar resposta da IA.")
    except Exception:
        logger.exception("cardapio_generation_failed")
        raise HTTPException(status_code=500, detail="Erro na geração do cardápio.")


@router.post("/chat")
def chat_cardapiobot(
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Conversa interativa com o CardapioBot.
    Permite ajustes no cardápio, perguntas e sugestões.
    """
    client = get_genai_client()

    if not client:
        raise HTTPException(status_code=503, detail="Serviço de IA não configurado.")

    # Contexto do usuário
    user_context = get_user_context(db, current_user)

    # Prompt de sistema para chat
    system_context = f"""Você é o CardapioBot, um assistente culinário amigável.

Contexto do usuário:
- Estoque: {", ".join(user_context.get("estoque", [])[:20]) or "não informado"}
- Itens vencendo: {", ".join(user_context.get("itens_vencendo", [])[:5]) or "nenhum"}
- Alergias: {", ".join(user_context.get("alergias", [])) or "nenhuma"}
- Restrições: {", ".join(user_context.get("restricoes", [])) or "nenhuma"}

Ajude o usuário com:
- Ajustes no cardápio (trocar refeições, substituir ingredientes)
- Sugestões de receitas
- Dicas de preparo e conservação
- Organização das compras

Seja conciso e útil. Use emojis ocasionalmente para tornar a conversa agradável."""

    # Monta histórico de mensagens
    messages = [{"role": "user", "parts": [{"text": system_context}]}]

    for msg in req.messages:
        role = "user" if msg.role == "user" else "model"
        messages.append({"role": role, "parts": [{"text": msg.content}]})

    try:
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL_NAME,
            contents=messages,
        )

        return {
            "response": response.text,
            "role": "assistant"
        }

    except Exception:
        logger.exception("cardapiobot_chat_failed")
        raise HTTPException(status_code=500, detail="Erro no chat.")


@router.post("/save")
def save_cardapio(
    cardapio: CardapioResponse,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Salva um cardápio gerado no histórico do usuário."""
    try:
        # Calcula datas de início e fim
        datas = [d.data for d in cardapio.dias if d.data]
        inicio = min(datas) if datas else date.today().isoformat()
        fim = max(datas) if datas else date.today().isoformat()

        # Cria cardápio
        novo_cardapio = Cardapio(
            usuario_id=current_user.id,
            titulo=cardapio.titulo,
            inicio=date.fromisoformat(inicio),
            fim=date.fromisoformat(fim),
        )
        db.add(novo_cardapio)
        db.flush()

        # Cria refeições
        for dia in cardapio.dias:
            for refeicao in dia.refeicoes:
                nova_refeicao = Refeicao(
                    cardapio_id=novo_cardapio.id,
                    data=date.fromisoformat(dia.data),
                    tipo=refeicao.tipo.upper(),
                    observacoes=refeicao.receita_nome,
                )
                db.add(nova_refeicao)

        db.commit()

        return {
            "success": True,
            "cardapio_id": str(novo_cardapio.id),
            "message": "Cardápio salvo com sucesso!"
        }

    except Exception:
        logger.exception("cardapio_save_failed")
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro ao salvar cardápio.")


@router.get("/history", response_model=List[CardapioHistoryItem])
def get_cardapio_history(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retorna histórico de cardápios do usuário."""
    cardapios = (
        db.query(Cardapio)
        .filter(Cardapio.usuario_id == current_user.id)
        .order_by(Cardapio.inicio.desc())
        .limit(limit)
        .all()
    )

    return [
        CardapioHistoryItem(
            id=str(c.id),
            titulo=c.titulo,
            inicio=c.inicio.isoformat() if c.inicio else "",
            fim=c.fim.isoformat() if c.fim else "",
            criado_em=c.inicio.isoformat() if c.inicio else "",
        )
        for c in cardapios
    ]


@router.get("/history/{cardapio_id}")
def get_cardapio_detail(
    cardapio_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retorna detalhes de um cardápio salvo."""
    cardapio = (
        db.query(Cardapio)
        .filter(Cardapio.id == cardapio_id)
        .filter(Cardapio.usuario_id == current_user.id)
        .first()
    )

    if not cardapio:
        raise HTTPException(status_code=404, detail="Cardápio não encontrado")

    # Agrupa refeições por data
    dias_dict = {}
    for refeicao in cardapio.refeicoes:
        data_str = refeicao.data.isoformat()
        if data_str not in dias_dict:
            dias_dict[data_str] = {
                "data": data_str,
                "dia_semana": refeicao.data.strftime("%A"),
                "refeicoes": []
            }

        dias_dict[data_str]["refeicoes"].append({
            "tipo": refeicao.tipo.lower(),
            "receita_nome": refeicao.observacoes or "",
        })

    return {
        "id": str(cardapio.id),
        "titulo": cardapio.titulo,
        "inicio": cardapio.inicio.isoformat() if cardapio.inicio else None,
        "fim": cardapio.fim.isoformat() if cardapio.fim else None,
        "dias": list(dias_dict.values()),
    }
