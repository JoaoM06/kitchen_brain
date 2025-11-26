# `backend/app`

Estrutura principal do serviço FastAPI.

## Pastas
| Caminho | Descrição |
| --- | --- |
| [`api/`](api/README.md) | Dependências e roteadores. |
| [`core/`](core/README.md) | Configurações globais e segurança. |
| [`db/`](db/README.md) | Sessão SQLAlchemy, base e models. |
| [`schemas/`](schemas/README.md) | Modelos Pydantic. |
| [`main.py`](main.py) | Ponto de entrada FastAPI (routers, middlewares, CORS). |

## Fluxo
1. Requisições chegam aos routers em `api/routes`.
2. `api/deps.py` injeta sessão de banco, usuário autenticado, consentimentos LGPD, etc.
3. Models em `db/models` manipulam os dados e retornam schemas.
4. Erros são convertidos automaticamente em respostas HTTP.

## Como expandir
- Crie um novo arquivo em `api/routes` e registre o router em `main.py`.
- Adicione os models em `db/models` e exponha-os via `__all__`.
- Crie schemas equivalentes em `schemas/`.
- Cubra com testes em `../tests`.
