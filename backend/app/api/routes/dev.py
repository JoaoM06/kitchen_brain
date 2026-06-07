"""
Rotas de desenvolvimento. Incluídas em main.py apenas quando ENVIRONMENT == dev.
Servem para validar instrumentação (ex.: disparar um erro para o Sentry).
"""
from fastapi import APIRouter

router = APIRouter(prefix="/dev", tags=["dev"])


@router.get("/raise-error")
def raise_error():
    """Dispara uma exceção não tratada de propósito para testar o Sentry."""
    raise RuntimeError("Erro proposital para validar o Sentry (rota /dev/raise-error).")
