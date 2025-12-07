# `mobile/src/api`

Abstrações de rede usadas pelo aplicativo. Cada arquivo exporta funções baseadas em Promises para serem chamadas dentro de hooks/telas.

| Arquivo | Descrição |
| --- | --- |
| `client.js` | Configura Axios (baseURL lida de `expo-constants`, interceptors para anexar JWT do AsyncStorage, tratamento de erros 401/500). |
| `auth.js` | `login`, `register` e helpers relacionados a tokens. Utiliza `client.post("/auth/...")`. |
| `voice.js` | Upload multipart de áudio para o endpoint `/voice/transcribe`, conversão de `FileSystem` → `FormData`. |
| `places.js` | Consulta APIs externas (Overpass/OSM) e normaliza o resultado para exibição no mapa e fallback do Recipe Hub. |

## Como usar
```javascript
import { login } from "../api/auth";

async function handleLogin() {
  const res = await login({ email, senha });
  // salve o token, trate erros etc.
}
```

## Boas práticas
- Centralize todas as chamadas em arquivos específicos em vez de chamar Axios direto das telas.
- Trate erros com `try/catch` e apresente mensagens amigáveis (veja padrões usados em `LoginScreen` e `CardapioBotScreen`).
- Ao adicionar novas rotas, crie funções claras (`getPantry`, `updateSettings`) para manter as telas pequenas.
