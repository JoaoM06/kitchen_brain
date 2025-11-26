# `backend/app/schemas`

Modelos Pydantic usados em requests/responses.

| Arquivo | Conteúdo |
| --- | --- |
| `auth.py` | Formulários de login, tokens JWT. |
| `device.py` | Registros de dispositivos/push. |
| `pantry.py` | Estruturas para itens de estoque. |
| `settings.py` | Preferências e notificações. |
| `user.py` | Perfis públicos e internos.

Sempre alinhe os schemas com os endpoints correspondentes para garantir validação automática.
