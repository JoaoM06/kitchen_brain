# Backend

Serviço FastAPI responsável por autenticação, estoque, perfis, LGPD e funcionalidades auxiliares consumidas pelo app mobile.

## Conteúdo
- [`app/`](app/README.md) – Código-fonte organizado em módulos (API, core, DB, schemas).
- [`requirements.txt`](requirements.txt) – Dependências Python.
- [`tests/`](tests/README.md) – Suite Pytest.

## Como rodar
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
Configure as variáveis descritas em `app/core/config.py` (DATABASE_URL, SECRET_KEY, ACCESS_TOKEN_EXPIRE_MINUTES, etc.).

## Serviços principais
| Módulo | Função |
| --- | --- |
| `app/api` | Rotas e dependências. |
| `app/core` | Configurações globais e utilitários de segurança. |
| `app/db` | Sessões, models e base declarativa. |
| `app/schemas` | Modelos Pydantic para requests/responses. |
| `app/main.py` | Criação do FastAPI, inclusão de rotas e middlewares. |

## Deploy
- Execute `uvicorn app.main:app --host 0.0.0.0 --port 8000` atrás de um proxy reverso.
- Configure migrations (Alembic) quando alterar `app/db/models`.
- Ajuste CORS para aceitar o domínio do Expo/web.
