# `mobile/src`

Código-fonte principal do aplicativo Expo. A estrutura é dividida por responsabilidade para facilitar reuso e testes.

| Caminho | O que contém | Notas |
| --- | --- | --- |
| [`AccessibilityContext.js`](AccessibilityContext.js) | Provider com preferências de fonte/contraste e helpers (`getFontSize`, `getFontWeight`). | Usado pelas telas de acessibilidade e botões globais. |
| [`api/`](api/README.md) | Clientes REST/serviços (auth, voice, places). | Implementados em Axios com interceptors. |
| [`components/`](components/README.md) | Botões, inputs, Footers e modais reutilizáveis. | Evite duplicar estilos nas telas. |
| [`data/`](data/README.md) | Dados mockados e helpers (recipes, estoque local, mercados). | Úteis offline ou antes da integração real. |
| [`navigation/`](navigation/README.md) | Configuração do React Navigation Stack. | Todas as telas devem ser registradas aqui. |
| [`screens/`](screens/README.md) | Implementação das telas (Receitas, Hub, Estoque, Cardápio, Perfil, Configs, etc.). | Cada arquivo exporta um componente funcional. |
| [`storage/`](storage/README.md) | Facades de AsyncStorage/localStorage (`savedMenus`, `recipeHub`). | Fornecem APIs baseadas em Promises. |
| [`theme/`](theme/README.md) | Tokens (cores, fontes) centralizados. | Importe `colors` para manter consistência visual. |
| [`utils/`](utils/README.md) | Helpers diversos: geração de PDF, formatações. | Mantêm as telas enxutas. |

## Convenções
- Componentes são escritos como funções com hooks (`useState`, `useEffect`, `useFocusEffect`).
- Estilos ficam colocalizados (`StyleSheet.create` no mesmo arquivo) ou extraídos quando reaproveitados.
- Imports relativos começam a partir de `src/` (ex.: `import { colors } from "../theme/colors";`).
- Ao criar novas pastas, adicione um README explicando a responsabilidade.
