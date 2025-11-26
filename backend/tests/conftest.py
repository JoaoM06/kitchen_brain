import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.db.base import Base
from app.db.session import engine, SessionLocal



@pytest.fixture(scope="session", autouse=True)
def create_test_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)  



@pytest.fixture(scope="function")
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def client():
    with TestClient(app) as c:
        yield c
