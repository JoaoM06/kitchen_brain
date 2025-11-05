import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.db.base import Base
from app.db.session import engine, SessionLocal


# 🔹 Cria todas as tabelas antes de rodar qualquer teste
@pytest.fixture(scope="session", autouse=True)
def create_test_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)  # opcional: limpa depois dos testes


# 🔹 Cria uma nova sessão de banco para cada teste
@pytest.fixture(scope="function")
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# 🔹 Cria o cliente de teste da API
@pytest.fixture(scope="function")
def client():
    with TestClient(app) as c:
        yield c
