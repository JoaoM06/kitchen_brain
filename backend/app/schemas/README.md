# `backend/app/schemas`

Modelos Pydantic que padronizam a entrada/saída dos endpoints. Usar schemas evita expor objetos ORM diretamente e garante validação automática.

| Arquivo | Classes principais | Uso |
| --- | --- | --- |
| `auth.py` | `Token`, `TokenPayload`, `UserCreate`, `LoginRequest`. | Fluxos de autenticação (cadastro, login e refresh). |
| `device.py` | `DeviceCreate`, `DeviceRead`. | Registro/atualização de dispositivos e push tokens. |
| `pantry.py` | `PantryItem`, `PantryResponse`. | Serializa estoque com status calculado e mensagens amigáveis. |
| `settings.py` | `SettingsRead`, `SettingsUpdate`. | Preferências e consents LGPD expostos ao app. |
| `user.py` | `UserRead`, `ProfileInput`. | Views públicas/privadas do perfil. |

## Boas práticas
- Separe schemas em **entrada** (`SomethingCreate`/`Update`) e **saída** (`SomethingRead`) para evitar vazar campos sensíveis.
- Use `Config` com `orm_mode = True` quando retornar instâncias SQLAlchemy.
- Centralize validações customizadas (ex.: normalização de e-mail) nos schemas para reduzir lógica nos routers.
- Quando alterar um schema, atualize o endpoint, o README correspondente e os testes.
