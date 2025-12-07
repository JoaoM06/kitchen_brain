# `backend/app/core`

Camada com as configurações globais e utilitários de segurança.

## Arquivos
| Arquivo | Responsabilidade |
| --- | --- |
| `config.py` | Define a classe `Settings` (Pydantic BaseSettings). Agrupa `DATABASE_URL`, `SECRET_KEY`, `ACCESS_TOKEN_EXPIRE_MINUTES`, credenciais de IA (Whisper, Gemini) e opções de CORS. Expõe `settings = Settings()` para ser importado em todo o projeto. |
| `security.py` | Funções para gerar/verificar hashes de senha (`pwd_context`), criar/validar JWTs (`create_access_token`, `decode_token`) e helpers OAuth2 (`oauth2_scheme`). |

## Boas práticas
- Centralize **todas as variáveis de ambiente** em `config.py` para evitar valores mágicos espalhados pelo código.
- Ao adicionar um novo segredo, documente-o no `.env.example` e no README raiz.
- Utilize `settings` em vez de acessar `os.environ` diretamente.
- Para tokens, siga o fluxo existente (`create_access_token`) e atualize tempos de expiração apenas em `config.py`.

## Próximos passos
Caso deseje adicionar logging estruturado, middlewares globais ou configurações de i18n, este diretório é o local ideal para novos arquivos (ex.: `logging.py`, `locale.py`). Lembre-se de importá-los em `app/main.py`.
