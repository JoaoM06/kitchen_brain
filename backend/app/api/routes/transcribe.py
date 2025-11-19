from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from pydantic import BaseModel
from faster_whisper import WhisperModel
import tempfile, shutil, os

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
