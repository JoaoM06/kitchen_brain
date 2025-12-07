# `mobile/src/navigation`

Configuração do React Navigation.

- `RootNavigator.jsx` monta o stack principal, agrupa rotas públicas (Welcome/Login/Signup) e privadas (Recipes, RecipeHub, Stock, VoiceRec, Menu, etc.). Os headers são customizados manualmente.

Para adicionar uma tela, importe o componente e registre `name` + `component` no `Stack.Navigator`.
