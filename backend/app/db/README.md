# `backend/app/db`

Infraestrutura de persistência usando SQLAlchemy.

## Arquivos e papéis
| Arquivo | Descrição |
| --- | --- |
| `base.py` | Define `Base` (declarative_base) e utilitários para import dinâmico de models. |
| `session.py` | Cria engine e `SessionLocal`, expõe `get_db()` usado nas dependências FastAPI. |
| [`models/`](models/README.md) | Entidades do domínio (usuários, estoque, devices, LGPD, etc.). |

## Como utilizar
```python
from app.db.session import SessionLocal

with SessionLocal() as session:
    try:
        session.add(obj)
        session.commit()
        session.refresh(obj)
    except:
        session.rollback()
        raise
```
Em endpoints, injete a sessão com `db: Session = Depends(get_db)` para garantir fechamento automático.

## Dicas
- Ao criar novos models, lembre-se de importá-los em `models/__init__.py` ou `base.py` para que o Alembic os descubra.
- Prefira transações curtas; operações longas devem ser offloaded para workers.
- Quando adicionar colunas obrigatórias, crie migrações correspondentes e atualize os schemas.
