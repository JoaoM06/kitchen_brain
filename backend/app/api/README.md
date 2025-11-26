# `backend/app/api`

Camada onde os roteadores FastAPI e dependências vivem.

## Arquivos
- `deps.py` – Fornece sessão de banco, usuário atual, verificações LGPD e outros helpers.
- `routes/` – Roteadores por domínio (detalhes em [`routes/README.md`](routes/README.md)).

## Rotas
| Router | Responsabilidade |
| --- | --- |
| `auth.py` | Login, refresh token, criação de usuário. |
| `pantry.py` | CRUD de estoque, busca por código de barras. |
| `profile.py` | Perfil, cardápios salvos, dados LGPD. |
| `settings.py` | Preferências, dispositivos, notificações. |
| `transcribe.py` | Upload e transcrição de áudio/voz. |

Todos os routers são incluídos em `app/main.py`.
