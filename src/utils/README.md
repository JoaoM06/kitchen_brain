# `mobile/src/utils`

Funções auxiliares compartilhadas entre telas. Mantemos aqui o que não se encaixa em `components`/`storage`.

| Arquivo | Descrição |
| --- | --- |
| `menuPdf.js` | Gera HTML/PDF para cardápios usando Expo Print + FileSystem + Sharing. Retorna `{ uri, name }` para ser usado no compartilhamento. |

## Dicas
- Adicione novos helpers (formatadores de datas, wrappers de analytics, máscaras) aqui para evitar poluir as telas.
- Sempre documente o contrato do helper neste README e exporte funções puras (sem dependências de UI).
