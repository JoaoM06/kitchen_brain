# `mobile/src/storage`

Facades para `AsyncStorage` (mobile) e `localStorage` (web). A ideia é expor funções com semântica de domínio, deixando as telas desacopladas do mecanismo de persistência.

| Arquivo | O que faz |
| --- | --- |
| `savedMenus.js` | CRUD de cardápios gerados pelo CardapioBot: salva título, PDF, data e constraints. Também ordena por `savedAt`. |
| `recipeHub.js` | Gerencia posts criados localmente e reações (`likedIds`, `savedIds`, `ratings`) do usuário. |

## Convenções
- Sempre exporte funções `async` que retornam a lista atualizada (ex.: `const menus = await addSavedMenu(menu)`).
- No web usamos um polyfill (`webStorage`) para evitar dependência do AsyncStorage.
- Ao criar novos módulos (ex.: `notifications.js`), siga o mesmo padrão: chave única (`@kitchen_brain_*`) e helpers para `get`, `set`, `remove`.
- Não manipule `AsyncStorage` diretamente nas telas; chame estes helpers para manter a lógica de serialização centralizada.
