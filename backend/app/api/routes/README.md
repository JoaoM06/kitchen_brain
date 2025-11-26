# `backend/app/api/routes`

Tabela de routers expostos:

| Arquivo | Prefixo | Descrição |
| --- | --- | --- |
| `auth.py` | `/auth` | Autenticação e gerenciamento de tokens. |
| `pantry.py` | `/pantry` | Itens da despensa, alertas de validade, busca por código de barras. |
| `profile.py` | `/profile` | Perfil do usuário, cardápios e dados pessoais. |
| `settings.py` | `/settings` | Permissões, dispositivos e configurações globais. |
| `transcribe.py` | `/transcribe` | Upload/retorno de transcrições de áudio. |

Todos os routers usam dependências definidas em `api/deps.py`.
