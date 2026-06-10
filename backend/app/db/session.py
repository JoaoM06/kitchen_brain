from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

_db_url = str(settings.DATABASE_URL)
_connect_args = {"options": "-c client_encoding=utf8"} if "postgresql" in _db_url else {}

engine = create_engine(
    _db_url,
    pool_pre_ping=True,
    connect_args=_connect_args,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
