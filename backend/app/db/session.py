from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

_db_url = str(settings.DATABASE_URL)
# `options` é um connect_arg específico do psycopg/PostgreSQL; passá-lo para
# outros drivers (ex.: SQLite usado nos testes) levanta TypeError.
_connect_args = {"options": "-c client_encoding=utf8"} if _db_url.startswith("postgres") else {}

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
