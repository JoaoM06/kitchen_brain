# `mobile/src/components`

Conjunto de blocos reutilizáveis usados em múltiplas telas.

| Componente | Uso típico |
| --- | --- |
| `DefaultButton.jsx` | Botões principais/outline com suporte a estados de loading. Recebe `variant`, `style` e `textStyle`. |
| `DefaultInput.jsx` | Campo de texto com label invisível e preenchimento consistente. Pode receber ícones via `leftIcon`. |
| `PasswordInput.jsx` | Extende `DefaultInput` com toggle de visibilidade (`Ionicons` eye). |
| `FooterNav.jsx` | Barra inferior com ícones (Receitas, Hub, Estoque, Cardápio, Perfil). Chama `navigation.replace`. |
| `SafeScreen.jsx` | Wrapper com `SafeAreaView` + `StatusBar` para padronizar cores de fundo e comportamento em iOS/Android. |
| `SuccessModal.jsx` | Modal genérico usado pós cadastro/login, exibindo título, descrição e CTA. |

## Diretrizes
- Componentes devem ser puros (sem acessar AsyncStorage ou APIs). Passe callbacks/props das telas.
- Centralize estilos compartilhados aqui para evitar duplicação em `screens/`.
- Ao criar novos componentes, documente a interface de props neste README para incentivar o reuso.
