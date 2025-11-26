# `mobile/src/api`

Camada responsável por conversar com o backend e serviços externos.

| Arquivo | Função |
| --- | --- |
| `client.js` | Instância Axios com baseURL e interceptors de auth. |
| `auth.js` | Login, cadastro, refresh token. |
| `voice.js` | Upload de áudios e consulta de transcrições. |
| `places.js` | Consulta ao Overpass API para mercados próximos (usado no mapa e Recipe Hub).

Cada helper retorna `Promise` para ser consumida em hooks ou efeitos dentro das telas.
