# Backend

Serviço FastAPI que centraliza:
- autenticação e emissão de tokens JWT;
- gestão de estoque, cardápios e preferências LGPD;
- dispositivos/push notifications;
- transcrição de áudio (Whisper) utilizada por VoiceRec/IA.

Todo o código vive em `app/`, com módulos bem definidos e READMEs específicos descrevendo rotas, schemas e models.

## Estrutura
| Caminho | Descrição |
| --- | --- |
| [`app/`](app/README.md) | Código-fonte separado em `api`, `core`, `db`, `schemas`. |
| [`requirements.txt`](requirements.txt) | Lista de dependências (FastAPI, SQLAlchemy, python-multipart, etc.). |
| [`tests/`](tests/README.md) | Suite Pytest com fixtures para DB e TestClient. |
| `.env.example` | Template de variáveis usadas em `config.py`. |

## Configuração e Execução
```bash
cd backend
python -m venv .venv
source .venv/bin/activate             # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                   # ajuste DATABASE_URL, SECRET_KEY, GEMINI_KEY...
uvicorn app.main:app --reload
```
Variáveis obrigatórias (`app/core/config.py`):
- `DATABASE_URL` → PostgreSQL recomendado (`postgresql+asyncpg://...`), mas SQLite funciona em dev/testes.
- `SECRET_KEY`, `ACCESS_TOKEN_EXPIRE_MINUTES`.
- Credenciais externas (`WHISPER_MODEL_SIZE`, `GEMINI_API_KEY`) quando usar CardapioBot/transcrição.

## Módulos principais
| Módulo | Funções principais | Observações |
| --- | --- | --- |
| `app/api` | Roteadores (`routes/`) e dependências (`deps.py`). | Autenticação OAuth2 password flow, guards LGPD, validação de permissão. |
| `app/core` | Configs, segurança (hash, JWT, CORS, middlewares). | Centralize novos settings aqui. |
| `app/db` | Engine SQLAlchemy, sessão e models. | Veja [`app/db/models/README.md`](app/db/models/README.md) para o domínio completo. |
| `app/schemas` | Pydantic models de request/response. | Mantenha em sincronia com os endpoints. |
| `app/main.py` | Monta FastAPI, inclui routers e middlewares. | Ajuste CORS/headers quando publicar. |

## Testes
```bash
cd backend
pytest -q
```
Os testes criam um banco SQLite em memória, populam usuários/tokens via fixtures e simulam chamadas com `TestClient`. Serviços externos (Whisper, Gemini) são mockados para garantir execução offline.

## Boas práticas
- Use `alembic` ou ferramenta similar para gerenciar migrações quando alterar `app/db/models`.
- Documente novos endpoints em `app/api/routes/README.md` e mantenha os schemas atualizados.
- Trate erros com `HTTPException` e mensagens localizadas; logs sensíveis devem ser escondidos em produção.

## Deploy
1. Configure as variáveis de ambiente (secretos via vault/secret manager).
2. Execute `uvicorn app.main:app --host 0.0.0.0 --port 8000` atrás de Nginx/Traefik.
3. Ajuste CORS para os domínios do Expo/Web (`https://expo.dev`, `https://*.ngrok.io`, etc.).
4. Ative monitoramento (Prometheus, Sentry) se disponível e rode os testes antes de liberar.
