# `mobile/src/theme`

Centraliza tokens de design compartilhados em todo o app.

| Arquivo | Descrição |
| --- | --- |
| `colors.js` (ou `.jsx`) | Define a paleta primária (tons de verde), cores de texto, fundos, estados de erro/sucesso e overlays. |

## Boas práticas
- Importe `colors` em todos os componentes/screen para evitar valores hardcoded (`import { colors } from "../theme/colors";`).
- Se precisar alterar branding ou suportar dark mode, ajuste apenas aqui.
- Use este diretório para novos tokens (espaçamentos, sombras) e documente-os neste README.
