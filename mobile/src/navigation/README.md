# `mobile/src/navigation`

Configura a stack do React Navigation.

## Arquivos
- `RootNavigator.jsx`: cria um `Stack.Navigator` único que inclui:
  - Rotas públicas (`Welcome`, `Login`, `Signup`, `Onboarding`);
  - Rotas autenticadas (`Recipes`, `RecipeHub`, `CardapioBotScreen`, `Stock`, `VoiceRec`, `Profile`, `Config`, etc.);
  - Telas auxiliares (`MarketMapScreen.native/web`, `MenuView`, `Permissions`, `Help`, `About`).
- Hooks utilitários (quando necessário) podem ser adicionados aqui (ex.: linking).

## Boas práticas
1. **Adicionar telas**: importe o componente e registre-o com `name` único. Use `options={{ headerShown: false }}` quando a tela já tiver cabeçalho customizado.
2. **Navegação por abas**: o `FooterNav` não usa `TabNavigator`; ele chama `navigation.replace`. Se adicionar novas tabs, ajuste a lista em `FooterNav`.
3. **Deep linking**: quando publicar, configure `linking` no `NavigationContainer` para suportar URLs (`kitchenbrain://recipes/...`).
4. **Headers**: preferimos headers personalizados nas próprias telas. Quando usar o header padrão, configure em `options`.

Manter esta pasta enxuta garante que a navegação fique explícita e fácil de evoluir.
