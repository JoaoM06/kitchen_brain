# `backend/app/api`

Camada responsável por expor os endpoints FastAPI e agrupar dependências reutilizáveis.

## Estrutura
| Item | Descrição |
| --- | --- |
| `deps.py` | Injeções reutilizadas em vários endpoints: sessão de banco (`get_db`), usuário autenticado (`get_current_user`), verificação de consentimentos LGPD, carregamento de dispositivos. |
| `routes/` | Coleção de arquivos que definem `APIRouter` por domínio. Cada router possui seu próprio prefixo e tags (detalhes em [`routes/README.md`](routes/README.md)). |

## Roteadores disponíveis
| Arquivo | Prefixo | Responsabilidades |
| --- | --- | --- |
| `auth.py` | `/auth` | Criação de usuário, login com OAuth2 password flow, emissão/refresh de tokens. |
| `pantry.py` | `/pantry` | Itens de despensa, cálculo de status por validade/local, busca por código de barras. |
| `profile.py` | `/profile` | Atualização/leitura de dados pessoais, bio, preferências alimentares e cardápios. |
| `settings.py` | `/settings` | Permissões LGPD, registro de dispositivos, notificações push. |
| `transcribe.py` | `/voice` | Upload de áudio para transcrição com Whisper, tratamentos de erro e validação de conteúdo. |

Cada router é registrado em `app/main.py` com o prefixo `api_router.include_router(...)`.

## Convenções
- **Schemas**: sempre tipar entradas e saídas com modelos em `app/schemas` (ex.: `PantryItem`, `ProfileRead`). Evite retornar ORM diretamente.
- **Deps**: não abra sessões manualmente dentro do router; injete `Session = Depends(get_db)` em cada endpoint.
- **Segurança**: use `Depends(get_current_user)` para proteger endpoints privados. Quando necessário, crie dependencies adicionais para checar consentimentos/permissões.
- **Paginação/Filtros**: padronize query params (`skip`, `limit`, `search`) e valide-os em schemas auxiliares para reutilização.

## Adicionando um novo router
1. Crie `app/api/routes/meu_modulo.py`.
2. Defina `router = APIRouter(prefix="/meu-modulo", tags=["meu-modulo"])`.
3. Importe schemas necessários e injete dependências via `Depends`.
4. Registre o router em `app/api/routes/__init__.py` (se aplicável) e em `app/main.py`.
5. Documente o novo domínio no README de `routes/`.
