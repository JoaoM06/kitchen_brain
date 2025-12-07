# Aplicativo Mobile (Expo)

Projeto Expo/React Native que entrega a experiência completa do Kitchen Brain em iOS, Android e Web. A UI é escrita com componentes funcionais, temas centralizados e navegação stack única.

## Scripts principais
| Comando | Descrição |
| --- | --- |
| `npm start` / `npx expo start` | Inicia o bundler (LAN, Tunnel ou localhost). |
| `npm run android` | Abre o Expo Go no emulador/dispositivo Android conectado. |
| `npm run ios` | Executa no simulador iOS (macOS). |
| `npm run web` | Carrega a versão Web (usa Leaflet no lugar do `react-native-maps`). |

## Estrutura
| Caminho | Descrição |
| --- | --- |
| [`App.jsx`](App.jsx) | Ponto de entrada da aplicação; carrega providers (SafeArea, Navigation, Accessibility). |
| [`src/`](src/README.md) | Código de fato: telas, componentes, hooks, storage e utilitários. |
| [`assets/`](assets/README.md) | Logos, imagens do onboarding e ilustrações. |
| [`imagens/`](imagens/README.md) | Screenshots históricos usados em documentação. |

Use os READMEs específicos para navegar em cada subpasta (`src/screens`, `src/navigation`, etc.).

## Funcionalidades suportadas
- **Autenticação/Onboarding**: telas `Welcome`, `Login`, `Signup`, `Onboarding`.
- **Receitas**: `RecipesScreen`, `RecipeDetailScreen` e `RecipeHubScreen` (feed social, curtidas, salvamentos, filtros).
- **Estoque**: `StockScreen`, `AddItemOptions`, `ManualAdd`, `BarcodeScanner`, `VoiceRec`.
- **Cardápios**: `CardapioBotScreen` (IA + contexto de estoque) e `MenuViewScreen` (PDF/Sharing).
- **Mapa de mercados**: `MarketMapScreen.native`/`.web` com fallback e rotas externas.
- **Perfil**: `ProfileScreen` com abas, `ConfigsScreen`, `Permissions`, `Accessibility`.

Configurações sensíveis (base URLs, chaves dos serviços) são lidas via `expo-constants` e variáveis definidas no `app.json`. A persistência local usa `AsyncStorage`/`localStorage` através dos helpers descritos em `src/storage/README.md`.

## Dicas de desenvolvimento
- Sempre conceda permissões ao testar features (câmera/microfone/localização). Veja `PermissionsScreen` para simular estados.
- Para atualizar assets, execute `npx expo start -c` e limpe o cache do bundler.
- Ao adicionar uma tela, registre-a em `src/navigation/RootNavigator.jsx` e documente em `src/screens/README.md`.
