# `backend/app/db`

Ferramentas de persistência.

- `base.py` – Base declarativa SQLAlchemy.
- `session.py` – Cria `SessionLocal` e ajuda a injetar sessões via FastAPI.
- [`models/`](models/README.md) – Entidades do domínio.

Uso típico:
```python
from app.db.session import SessionLocal
with SessionLocal() as session:
    session.add(obj)
    session.commit()
```
