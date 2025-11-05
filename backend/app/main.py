from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes.auth import router as auth_router
from app.api.routes.profile import router as profile_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
from app.api.routes.stock import router as stock_router
from app.api.routes.lista_compras import router as lista_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Backend FastAPI")

origins = [o.strip() for o in settings.BACKEND_CORS_ORIGINS.split(",")] if settings.BACKEND_CORS_ORIGINS else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["health"])
def health():
    return {"ok": True}

app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(stock_router)
app.include_router(lista_router)