# `backend/tests`

Suite Pytest que cobre os principais roteadores FastAPI.

## Estrutura
| Arquivo | Escopo |
| --- | --- |
| `conftest.py` | Fixtures globais: banco SQLite em memória, `SessionLocal` isolada, `TestClient`, usuários/tokens de teste, mocks de Whisper. |
| `test_auth_api.py` | Cadastro, login, refresh e validação de senhas inválidas. |
| `test_settings_api.py` | GET/PATCH das permissões LGPD e registro de devices. |
| `test_pantry_api.py` | Regras de estoque (status por validade, filtros). |
| `test_profile_api.py` | Atualização do perfil e leitura autenticada. |
| `test_transcribe_api.py` | Upload de áudio, tipos suportados e tratamento de erro. |

## Execução
```bash
cd backend
pytest -q
```
O banco é recriado a cada teste e serviços externos (Whisper/Gemini) são substituídos por fixtures para evitar chamadas reais.

## Convenções
- Ao criar um novo endpoint, escreva testes cobrindo sucesso e falhas esperadas.
- Reaproveite fixtures (`user_factory`, `auth_headers`) para manter os testes enxutos.
- Novos mocks devem ficar em `conftest.py` para evitar duplicação.
