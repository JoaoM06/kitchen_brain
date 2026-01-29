# KitchenBrain

Aplicativo Mobile (Expo) para gestão inteligente de cozinha.

## Início Rápido

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Mobile
```bash
npm install
npm start
```

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
| [`backend/`](backend/README.md) | API FastAPI + SQLAlchemy. |
| [`assets/`](assets/README.md) | Imagens e demais assets empacotados. |

## Funcionalidades
- Fluxos de autenticação e onboarding acessíveis
- Gestão de estoque com leitura de código de barras, voz e formulários
- Hub de receitas (feed, criação, salvamentos) e mapa de mercados
- Cardápio bot com geração de PDF
- Permissões e consentimentos LGPD centralizados

## Documentação de Telas

### ConfigsScreen
Tela de configurações com lista de opções (Perfil, Notificações, Sobre, etc.). Utiliza FlatList para renderização eficiente.

### VoiceRecScreen
Tela de gravação de voz com expo-av. Exibe animação pulsante que simula o volume da fala e gera transcrição via backend.

### CardapioBotScreen
Tela de chat com assistente culinário para gerar cardápios personalizados baseados em:
- Preferências alimentares e restrições
- Itens da despensa (especialmente os que estão para vencer)
- Tempo máximo de preparo e orçamento
- Número de porções e equipamentos disponíveis

### ConfirmItemsScreen
Tela para revisar itens detectados automaticamente (voz/OCR) antes de adicionar ao estoque.
