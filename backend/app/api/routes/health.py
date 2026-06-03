import logging

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.db.session import engine

router = APIRouter(prefix="/health", tags=["health"])
logger = logging.getLogger(__name__)


@router.get("/liveness")
def liveness():
    return {"ok": True}


@router.get("/ready")
def readiness():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"ok": True, "db": "up"}
    except Exception:
        logger.exception("readiness_check_failed")
        return JSONResponse(status_code=503, content={"ok": False, "db": "down"})
