# `backend/tests`

Suíte Pytest com foco na API FastAPI.

## Arquivos
| Arquivo | Escopo |
| --- | --- |
| `conftest.py` | Fixtures globais (SQLite em memória, TestClient, fábricas de usuário/token). |
| `test_auth_api.py` | Cadastro e login (casos de sucesso e falha). |
| `test_settings_api.py` | Permissões/consentimentos (GET/PATCH). |
| `test_pantry_api.py` | Estoque: cálculo de status por validade/local. |
| `test_profile_api.py` | Atualização e leitura de perfis autenticados. |
| `test_transcribe_api.py` | Upload de áudio e validação de conteúdo no endpoint /voice. |

## Como executar
```bash
cd backend
pytest -q
```

Serviços externos (ex.: Whisper) são mockados dentro dos testes.
