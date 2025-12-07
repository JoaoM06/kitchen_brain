# `backend/app/api/routes`

Lista detalhada dos routers disponíveis na API.

| Arquivo | Prefixo / Tag | O que expõe | Pontos de atenção |
| --- | --- | --- | --- |
| `auth.py` | `/auth` (`["auth"]`) | Registro de usuário, login, refresh token e logout lógico. | Retorna tokens JWT assinados com `SECRET_KEY`. Todas as respostas usam schemas em `schemas/auth.py`. |
| `pantry.py` | `/pantry` (`["pantry"]`) | Listagem de estoque, cálculo de `days_to_expire`, criar/remover itens e busca por código de barras. | Utiliza `get_current_user` para filtrar itens por usuário. Respostas são normalizadas com `PantryResponse`. |
| `profile.py` | `/profile` (`["profile"]`) | Atualiza bio, preferências alimentares, alergias e cardápios salvos; expõe o perfil atual. | Necessita consentimento LGPD ativo; campos opcionais são preservados se `None`. |
| `settings.py` | `/settings` (`["settings"]`) | Flags de localização/notificações/memória, registro de devices e status sincronizado com o SO. | Ao habilitar permissões, cria registros em `Consentimento`; ao desabilitar, marca `revogado_em`. |
| `transcribe.py` | `/voice` (`["voice"]`) | Upload de arquivos de áudio (m4a/mp3/wav/ogg), encaminha ao Whisper e retorna texto. | Valida `content_type` começando com `audio/` e remove arquivos temporários ao final. |

### Como criar um novo router
1. `touch backend/app/api/routes/<nome>.py` e declare `router = APIRouter(prefix="/nome", tags=["nome"])`.
2. Importe `deps`/schemas necessários.
3. Registre o router em `app/main.py` (`app.include_router(router)`), respeitando ordenação alfabética.
4. Documente neste README com a tabela acima.

Todos os routers compartilham dependências de `api/deps.py`, garantindo sessão de banco e contexto de usuário consistentes.
