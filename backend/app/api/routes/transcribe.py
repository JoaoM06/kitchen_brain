from fastapi import APIRouter, UploadFile, File, HTTPException, Query, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, Literal, List
from faster_whisper import WhisperModel
from google import genai
import tempfile, shutil, os
from unidecode import unidecode
import os
import re

from app.core.config import settings
from app.db.session import get_db
from app.db.models.product import ProdutoGenerico

router = APIRouter(prefix="/voice", tags=["voice"])

WHISPER_MODEL_SIZE = "small"
WHISPER_COMPUTE = "int8"  # melhor para CPU
model = WhisperModel(WHISPER_MODEL_SIZE, compute_type=WHISPER_COMPUTE)

class TranscribeOut(BaseModel):
    text: str

@router.post("/transcribe", response_model=TranscribeOut)
async def transcribe_audio(
        audio: UploadFile = File(..., description="Arquivo de áudio (m4a/mp3/wav/ogg...)"),
        language: str = Query("pt", description="Idioma (ex.: 'pt', 'en', 'auto' ...)")
    ):
    if not (audio.content_type or "").startswith("audio/"):
        raise HTTPException(status_code=400, detail="Conteúdo inválido: envie um arquivo de áudio.")

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".bin", delete=False) as tmp:
            shutil.copyfileobj(audio.file, tmp)
            tmp_path = tmp.name

        lang_arg = None if language in ("auto", "", None) else language
        segments, info = model.transcribe(
            tmp_path,
            language=lang_arg,
            vad_filter=True,
            beam_size=5
        )
        text = " ".join([s.text for s in segments]).strip()
        return TranscribeOut(text=text or "")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Falha na transcrição: {e}")
    finally:
        try:
            if tmp_path and os.path.exists(tmp_path):
                os.remove(tmp_path)
        except Exception:
            pass

# Rota parse text com Gemini
client = genai.Client(
    api_key=settings.GEMINI_API_KEY
)

class TextIn(BaseModel):
    text: str

UnitInput = Literal["l", "ml", "kg", "g", "un"]
UnitBase  = Literal["ml", "g", "un"]
Location  = Literal["geladeira", "armário", "armario", "freezer"] # Trazer da tabela de user

class StructuredResponse(BaseModel):
    source_text: str
    product_name: str
    product_normalized: Optional[str]
    quantity: Optional[float]
    unit_input: Optional[UnitInput]
    quantity_base: Optional[float]
    unit_base: Optional[UnitBase]
    expiry_text: Optional[str]
    expiry_date: Optional[str]
    location: Optional[Location]
    confidence: Optional[float]
    warnings: Optional[List[str]]

def generate_prompt(text: str):
    return f"""
    Você é um extrator de dados estruturados para um app de cozinha. 
    Receberá um TEXTO em português do Brasil descrevendo item(ns) de estoque (ex.: “adicionar 2 litros de leite…”).

    ### Tarefa
    Identifique cada item mencionado no TEXTO e produza um **ARRAY JSON** em que **cada elemento** segue o esquema abaixo (NÃO invente campos, NUNCA saia do JSON, não inclua comentários):

    Objeto por item (campos):
    - source_text (string, obrigatório): o trecho do TEXTO de onde este item foi inferido (pode repetir o texto completo se for simples).
    - product_name (string, obrigatório): nome do produto como aparece no texto, já limpo de palavras de ligação (“de”, “do” etc.), mas sem normalização agressiva.
    - product_normalized (string|null): versão normalizada (minúscula, sem acento/stopwords comuns). Se não houver produto claro, use null.
    - quantity (number|null): quantidade conforme o texto (ex.: 2, 1.5, 300). Se não houver, null.
    - unit_input ("l"|"ml"|"kg"|"g"|"un"|null): unidade conforme o texto. Mapeamentos:
    - "litro(s)"→"l"; "ml"→"ml"; "quilo(s)"/"kg"→"kg"; "grama(s)"/"g"→"g"; "unid"/"unidade(s)"→"un"
    Se não houver unidade, null.
    - quantity_base (number|null): **não calcular**; retorne null (o backend calcula).
    - unit_base ("ml"|"g"|"un"|null): **não calcular**; retorne null (o backend define).
    - expiry_text (string|null): validade exatamente como aparece (“05/11”, “21 de outubro”, “amanhã”). Não converter.
    - expiry_date (string|null): **não calcular**; retorne null (o backend converte para ISO).
    - location ("geladeira"|"armário"|"armario"|"freezer"|null): local se houver, precisamente um desses valores; senão null.
    - confidence (number|null): confiança (0..1) da extração daquele item; heurística simples (ex.: menções claras ~0.9, ambíguas ~0.5). Se não souber, use null.
    - warnings (array<string>|null): possíveis avisos (ex.: "unidade ausente", "produto ambíguo"). Caso não haja, null.

    ### Regras
    - Se o TEXTO mencionar múltiplos itens, **retorne um array com vários objetos** (um por item).
    - Não crie itens que não existam no TEXTO original.
    - Não invente unidade, validade ou local; se ausentes, use null.
    - Nunca devolva nada além do **JSON puro** (um array). Sem Markdown, sem comentários, sem texto adicional.

    ### Exemplos

    Entrada:
    "Adicionar 2 litros de leite integral vencendo 21 de outubro na geladeira"
    Saída:
    [
    {{
        "source_text": "Adicionar 2 litros de leite integral vencendo 21 de outubro na geladeira",
        "product_name": "leite integral",
        "product_normalized": "leite integral",
        "quantity": 2,
        "unit_input": "l",
        "quantity_base": null,
        "unit_base": null,
        "expiry_text": "21 de outubro",
        "expiry_date": null,
        "location": "geladeira",
        "confidence": 0.9,
        "warnings": null
    }}
    ]

    Entrada:
    "Tenho 300ml de creme de leite no armário e 1 kg de filé mignon no freezer (val 05/11)"
    Saída:
    [
    {{
        "source_text": "300ml de creme de leite no armário",
        "product_name": "creme de leite",
        "product_normalized": "creme leite",
        "quantity": 300,
        "unit_input": "ml",
        "quantity_base": null,
        "unit_base": null,
        "expiry_text": null,
        "expiry_date": null,
        "location": "armário",
        "confidence": 0.85,
        "warnings": null
    }},
    {{
        "source_text": "1 kg de filé mignon no freezer (val 05/11)",
        "product_name": "filé mignon",
        "product_normalized": "file mignon",
        "quantity": 1,
        "unit_input": "kg",
        "quantity_base": null,
        "unit_base": null,
        "expiry_text": "05/11",
        "expiry_date": null,
        "location": "freezer",
        "confidence": 0.9,
        "warnings": null
    }}
    ]

    Entrada:
    "Adicionar ovos"
    Saída:
    [
    {{
        "source_text": "Adicionar ovos",
        "product_name": "ovos",
        "product_normalized": "ovo",
        "quantity": null,
        "unit_input": null,
        "quantity_base": null,
        "unit_base": null,
        "expiry_text": null,
        "expiry_date": null,
        "location": null,
        "confidence": 0.7,
        "warnings": ["unidade ausente", "quantidade ausente"]
    }}
    ]

    ### TEXTO
    {text}
    """
    
@router.post("/parse-text", response_model=List[StructuredResponse])
def format_text(body: TextIn):
    try:
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL_NAME,
            contents=generate_prompt(body.text),
            config={
                "response_mime_type": "application/json",
                "response_schema": list[StructuredResponse],
            },
        )
        return response.parsed
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Falha ao formatar texto: {e}")
    

#Match de produtos genéricos
class ProductCandidate(BaseModel):
    id: str
    name: str
    normalized: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    score: float

class MatchResult(BaseModel):
    source_text: str
    product_name: str
    product_normalized: Optional[str]
    candidates: List[ProductCandidate]
    suggested_action: Literal["select_candidate", "create_new"]

_STOPWORDS = {"de","do","da","dos","das","e","em","para","no","na","a","o","um","uma","uns","umas","com"}

def normalize_name(s: str) -> str:
    s = unidecode(s or "").lower()
    s = re.sub(r"[^a-z0-9\s]", " ", s)
    parts = [p for p in s.split() if p and p not in _STOPWORDS]
    return " ".join(parts)

TRIGRAM_MIN = 0.25
MAX_RESULTS = 5

TRIGRAM_MIN = 0.25
MAX_RESULTS = 5
MIN_CAND_SCORE = 0.20

def _query_candidates(
    db: Session,
    raw_name: str,
    normalized_hint: Optional[str],
    limit: int = MAX_RESULTS
) -> List[ProductCandidate]:
    norm = normalize_name(normalized_hint or raw_name or "")
    if not norm:
        return []

    try:
        rows = (
            db.query(
                ProdutoGenerico.id,
                ProdutoGenerico.nome,
                ProdutoGenerico.nome_normalizado,
                ProdutoGenerico.categoria,
                ProdutoGenerico.url_imagem,
                func.similarity(ProdutoGenerico.nome_normalizado, norm).label("sim")
            )
            .filter(func.similarity(ProdutoGenerico.nome_normalizado, norm) >= TRIGRAM_MIN)
            .order_by(func.similarity(ProdutoGenerico.nome_normalizado, norm).desc())
            .limit(limit)
            .all()
        )

        return [
            ProductCandidate(
                id=str(rid),
                name=display_name,
                normalized=norm_name,
                category=cat,
                image_url=img,
                score=float(sim)
            )
            for rid, display_name, norm_name, cat, img, sim in rows
            if float(sim) >= MIN_CAND_SCORE
        ]

    except Exception:
        all_rows = (
            db.query(
                ProdutoGenerico.id,
                ProdutoGenerico.nome,
                ProdutoGenerico.nome_normalizado,
                ProdutoGenerico.categoria,
                ProdutoGenerico.url_imagem,
            )
            .limit(2000)
            .all()
        )
        terms = norm.split()

        def simple_score(n: Optional[str]) -> float:
            if not n or not terms:
                return 0.0
            hits = sum(1 for t in terms if t in n)
            return hits / len(terms)

        scored = [
            (rid, disp, norm_name, cat, img, simple_score(norm_name))
            for rid, disp, norm_name, cat, img in all_rows
        ]
        scored = [r for r in scored if r[5] >= MIN_CAND_SCORE]
        scored.sort(key=lambda x: x[5], reverse=True)
        top = scored[:limit]

        return [
            ProductCandidate(
                id=str(rid),
                name=disp,
                normalized=norm_name,
                category=cat,
                image_url=img,
                score=float(s)
            )
            for rid, disp, norm_name, cat, img, s in top
        ]
    
@router.post("/match-items", response_model=List[MatchResult])
def match_items(items: List[StructuredResponse], db: Session = Depends(get_db)):
    results: List[MatchResult] = []

    for it in items:
        raw = it.product_name.strip() if it.product_name else ""
        if not raw:
            results.append(MatchResult(
                source_text=it.source_text,
                product_name=it.product_name or "",
                product_normalized=it.product_normalized,
                candidates=[],
                suggested_action="create_new"
            ))
            continue

        cands = _query_candidates(db, raw_name=raw, normalized_hint=it.product_normalized)
        suggested_action = "select_candidate"
        if not cands or (cands and cands[0].score < 0.35):
            suggested_action = "create_new"

        results.append(MatchResult(
            source_text=it.source_text,
            product_name=it.product_name,
            product_normalized=it.product_normalized,
            candidates=cands,
            suggested_action=suggested_action
        ))

    return results