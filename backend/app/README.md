# `backend/app`

Módulo raiz do serviço FastAPI. Aqui vivemos toda a lógica de API, configurações, persistência e schemas.

## Pastas e arquivos
| Caminho | O que contém | Observações |
| --- | --- | --- |
| [`api/`](api/README.md) | `deps.py` (injeção de dependências), routers em `routes/`. | Os routers são incluídos em `app/main.py`. |
| [`core/`](core/README.md) | Config (`Settings`), segurança (hash/JWT), middlewares. | Exporte apenas `settings`/helpers públicos. |
| [`db/`](db/README.md) | Engine, `SessionLocal`, base declarativa e models. | Use `SessionLocal`/`get_db` para transações. |
| [`schemas/`](schemas/README.md) | Modelos Pydantic de entrada/saída. | Cada router deve ter schemas dedicados. |
| [`main.py`](main.py) | Ponto de entrada: cria FastAPI, adiciona routers, handlers e CORS. | Ideal para incluir middlewares futuros (Tracing/Sentry). |

## Ciclo de requisição
1. O cliente chama `/api/...`. Os routers em `api/routes` recebem a requisição.
2. `api/deps.py` injeta sessão do banco, usuário autenticado e validações LGPD/permissões.
3. A camada `db/models` executa queries; os resultados são convertidos em schemas (`schemas/...`) para garantir tipos consistentes.
4. Exceções são transformadas em `HTTPException` com mensagens localizadas e status corretos.

## Adicionando novas features
1. **Router**: crie um arquivo em `api/routes/novo_modulo.py`, defina `APIRouter(prefix="/novo")` e registre em `main.py`.
2. **Model**: se necessário, adicione em `db/models/`, exponha no `__all__` e crie migração.
3. **Schema**: crie classes Pydantic correspondentes (`schemas/novo_modulo.py`).
4. **Testes**: cubra o endpoint em `backend/tests` usando TestClient + fixtures.
5. **Documentação**: atualize os READMEs relevantes para descrever o domínio.

## Convenções internas
- Prefira `Annotated` + `Depends` para injeção, evitando lógica repetida.
- Use transações explícitas (`session.add`, `session.commit`, `session.refresh`) e feche a sessão via dependency.
- Ao expor dados de usuários, sanitize campos sensíveis (`password_hash`, tokens).
- Reaproveite schemas entre mobile/web para manter compatibilidade.
