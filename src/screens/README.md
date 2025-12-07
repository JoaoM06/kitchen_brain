# `mobile/src/screens`

Lista de telas disponíveis e suas responsabilidades.

| Tela | Descrição resumida |
| --- | --- |
| `WelcomeScreen.jsx` | CTA inicial para login, signup ou modo visitante. |
| `LoginScreen.jsx` / `SignupScreen.jsx` | Formulários com validação e feedback. |
| `OnboardingScreen.jsx` | Carrossel ilustrado destacando benefícios do app. |
| `RecipesScreen.jsx` | Catálogo (cards, spotlight, filtros) + banner para Recipe Hub. |
| `RecipeDetailScreen.jsx` | Detalhes da receita (ingredientes, passos, link do vídeo). |
| `RecipeHubScreen.jsx` | Feed social com buscas, filtros por tag, curtidas/salvos/ratings e estatísticas do usuário. |
| `RecipeHubCreateScreen.jsx` | Form de publicação com captura ou upload de foto/vídeo. |
| `StockScreen.jsx` | Lista de itens por seção e botões para adicionar/abrir mapa. |
| `AddItemOptionsScreen.jsx`, `ManualAddScreen.jsx`, `BarcodeScannerScreen.jsx`, `VoiceRecScreen.jsx` | Fluxos de entrada de itens (manual, scanner, voz). |
| `CardapioBotScreen.jsx` | Chat com IA, controles avançados, salvamento/geração de PDFs. |
| `MenuViewScreen.jsx` | Visualização completa do cardápio + download/compartilhamento. |
| `MarketMapScreen.native.jsx` / `.web.jsx` | Mapas e listagem de mercados com botão de rotas. |
| `PermissionsScreen.jsx` | Dashboard de consentimentos, snapshot de permissões do SO e registro de devices. |
| `ProfileScreen.jsx` | Abas (Receitas salvas, Postagens, Cardápios), edição de avatar/nome/bio. |
| `ConfigsScreen.jsx`, `HelpScreen.jsx`, `AboutScreen.jsx`, `AccessibilityScreen.jsx` | Seções auxiliares (logout, FAQ, missão do produto, ajustes de contraste/fonte). |

## Convenções
- Cada tela importa `colors` do `theme` e componentes reutilizáveis (`DefaultButton`, `SafeScreen`).
- A navegação é feita via `navigation.navigate`/`replace`; use `useFocusEffect` quando precisar recarregar dados.
- Mantenha a lógica pesada fora das telas (utils, storage, hooks) para facilitar manutenção.
