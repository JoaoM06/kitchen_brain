import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text as _sql_text

from app.core.config import settings
from app.core.sentry import init_sentry

# Inicializa o Sentry antes de criar o app, para capturar erros já na subida.
init_sentry()

# Rotas
from app.api.routes.auth import router as auth_router
from app.api.routes.settings import router as settings_router
from app.api.routes.profile import router as profile_router
from app.api.routes.transcribe import router as transcribe_router
from app.api.routes.stock import router as stock_router
from app.api.routes.lista_compras import router as lista_router
from app.api.routes.barcode import router as barcode_router
from app.api.routes.recipes import router as recipes_router
from app.api.routes.cardapiobot import router as cardapiobot_router

# Criar tabelas automaticamente (apenas em dev)
from app.db.base import Base
from app.db.session import engine
Base.metadata.create_all(bind=engine)

# A busca de produtos genéricos depende da extensão pg_trgm no Postgres
# (ver backend/init.sql). Sem ela não há fallback quadrático — o boot é
# recusado em produção/staging para falhar cedo e de forma clara.
_logger = logging.getLogger(__name__)


def _verify_pg_trgm() -> None:
    if engine.dialect.name != "postgresql":
        return
    with engine.connect() as conn:
        installed = conn.execute(
            _sql_text("SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm'")
        ).first()
    if installed:
        return
    msg = (
        "Extensão pg_trgm ausente no Postgres. Rode "
        "'CREATE EXTENSION IF NOT EXISTS pg_trgm;' (ver backend/init.sql) "
        "antes de subir o backend."
    )
    if settings.ENVIRONMENT in ("staging", "prod"):
        raise RuntimeError(msg)
    _logger.warning(msg)


_verify_pg_trgm()

app = FastAPI(title="KitchenBrain API", version="0.1.0")

# CORS
origins = (
    [o.strip() for o in settings.BACKEND_CORS_ORIGINS.split(",")]
    if getattr(settings, "BACKEND_CORS_ORIGINS", None)
    else ["*"]
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Healthcheck
@app.get("/", tags=["health"])
def health():
    return {"ok": True}


app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(transcribe_router)
app.include_router(stock_router)
app.include_router(settings_router, tags=["settings"])
app.include_router(lista_router)
app.include_router(barcode_router)
app.include_router(recipes_router)
app.include_router(cardapiobot_router)

# Endpoint de teste do Sentry — só existe em dev.
if settings.ENVIRONMENT == "dev":
    from app.api.routes.dev import router as dev_router
    app.include_router(dev_router)
