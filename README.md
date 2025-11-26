# Aplicativo Mobile (Expo)

Projeto Expo/React Native que entrega a experiência completa do Kitchen Brain (iOS, Android e Web).

## Scripts principais
| Comando | Descrição |
| --- | --- |
| `npm start` / `expo start` | Inicia o bundler do Expo. |
| `npm run android` | Abre o Expo Go no Android/emulador. |
| `npm run ios` | Abre o Expo Go no iOS/simulador. |
| `npm run web` | Executa o alvo Web (Leaflet substitui mapas nativos). |

## Estrutura
| Caminho | Descrição |
| --- | --- |
| [`App.jsx`](App.jsx) | Componente raiz carregado pelo Expo. |
| [`src/`](src/README.md) | Arquitetura da aplicação. |
| [`assets/`](assets/README.md) | Imagens e demais assets empacotados. |
| [`imagens/`](imagens/README.md) | Screenshots utilizados em documentação. |

## Destaques
- Fluxos de autenticação e onboarding acessíveis.
- Gestão de estoque com leitura de código de barras, voz e formulários.
- Hub de receitas (feed, criação, salvamentos) e mapa de mercados.
- Cardápio bot, geração de PDF e permissões centralizadas.

Configurações sensíveis (URLs de API) são lidas via `expo-constants`. AsyncStorage guarda perfil, cardápios e interações do Hub.
