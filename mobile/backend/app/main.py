from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

# Rotas
from app.api.routes.auth import router as auth_router
from app.api.routes.settings import router as settings_router
from app.api.routes.profile import router as profile_router
from app.api.routes.transcribe import router as transcribe_router
from app.api.routes.pantry import router as pantry_router
# from app.api.routes.devices import router as devices_router

# ⚠️ Recomendado usar Alembic. Se você quiser criar tabelas sem migração,
# descomente as 3 linhas abaixo (apenas em dev):
from app.db.base import Base
from app.db.session import engine
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Backend FastAPI", version="0.1.0")

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
app.include_router(settings_router, tags=["settings"])
app.include_router(pantry_router, tags=["pantry"])
# app.include_router(devices_router, tags=["devices"])
