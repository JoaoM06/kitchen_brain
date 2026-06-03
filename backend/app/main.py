from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import settings
from app.core.logging import configure_logging

# Configure logging before any route modules are imported so their loggers inherit the setup
configure_logging(log_level=settings.LOG_LEVEL, log_format=settings.LOG_FORMAT)

from app.api.routes.auth import router as auth_router  # noqa: E402
from app.api.routes.settings import router as settings_router  # noqa: E402
from app.api.routes.profile import router as profile_router  # noqa: E402
from app.api.routes.transcribe import router as transcribe_router  # noqa: E402
from app.api.routes.stock import router as stock_router  # noqa: E402
from app.api.routes.lista_compras import router as lista_router  # noqa: E402
from app.api.routes.barcode import router as barcode_router  # noqa: E402
from app.api.routes.recipes import router as recipes_router  # noqa: E402
from app.api.routes.cardapiobot import router as cardapiobot_router  # noqa: E402
from app.api.routes.health import router as health_router  # noqa: E402
from app.middlewares.request_logger import RequestLoggerMiddleware  # noqa: E402
from app.core.limiter import limiter  # noqa: E402

# Criar tabelas automaticamente (apenas em dev)
from app.db.base import Base  # noqa: E402
from app.db.session import engine  # noqa: E402

Base.metadata.create_all(bind=engine)

app = FastAPI(title="KitchenBrain API", version="0.1.0")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(RequestLoggerMiddleware)

origins = (
    [o.strip() for o in settings.BACKEND_CORS_ORIGINS.split(",")]
    if getattr(settings, "BACKEND_CORS_ORIGINS", None)
    else ["*"]
)
# allow_credentials=True is incompatible with allow_origins=["*"] per CORS spec
allow_credentials = origins != ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["health"])
def liveness():
    return {"ok": True}


app.include_router(health_router)
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(transcribe_router)
app.include_router(stock_router)
app.include_router(settings_router, tags=["settings"])
app.include_router(lista_router)
app.include_router(barcode_router)
app.include_router(recipes_router)
app.include_router(cardapiobot_router)
