# Kitchen Brain

Bem-vindo ao **Kitchen Brain**, um assistente culinário com foco em acessibilidade. A plataforma reúne controle de estoque, descoberta de receitas, cardápios inteligentes e um Hub social onde a comunidade compartilha fotos e vídeos. Este repositório contém todo o stack: backend em FastAPI, app Expo/React Native, arquivos de referência e documentação funcional.

## Índice
1. [Visão do Produto](#visão-do-produto)
2. [Principais Funcionalidades](#principais-funcionalidades)
3. [Arquitetura](#arquitetura)
4. [Como Executar](#como-executar)
   - [Backend](#backend)
   - [Mobile (Expo)](#mobile-expo)
5. [Mapa de Documentação](#mapa-de-documentação)
6. [Convenções](#convenções)
7. [Suporte](#suporte)

## Visão do Produto
Kitchen Brain nasceu para tornar o ato de cozinhar mais simples e inclusivo. O usuário consegue ver o que tem na despensa, gerar cardápios, descobrir mercados próximos e dividir suas criações no **Recipe Hub** sem perder privacidade ou autonomia.

## Principais Funcionalidades
- **Estoque**: acompanhamento de validade, inclusão por código de barras/voz/digitação e recomendações com base no que já está em casa.
- **Cardápios**: geração guiada com exportação em PDF e histórico, respeitando preferências e restrições (LGPD inclusa).
- **Recipe Hub**: feed social com publicação de fotos/vídeos, curadoria de chefs, curtidas, salvamentos e avaliações.
- **Mapa inteligente**: localização de mercados via GPS (React Native Maps/Leaflet) e abertura direta do modo de rotas.
- **Acessibilidade**: onboarding guiado, leitores de texto, gravador de voz, gerenciamento de permissões e tela dedicada a acessibilidade.

## Arquitetura
```
repo-root
├── backend/         # FastAPI + SQLAlchemy
├── mobile/          # Aplicativo Expo (iOS/Android/Web)
├── docs/            # Requisitos, PDFs e material de apoio
├── imgs_ref/        # Imagens usadas nas documentações
└── README.md
```

## Como Executar
### Backend
Pré-requisitos: Python 3.10+, virtualenv/pipenv, PostgreSQL (ou SQLite para testes).
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
Configure as variáveis de ambiente descritas em `backend/README.md` (DATABASE_URL, SECRET_KEY, etc.).

### Mobile (Expo)
Pré-requisitos: Node 18+, npm/pnpm e Expo CLI.
```bash
cd mobile
npm install
npx expo start
```
Use o Expo Go ou simuladores para testar. Conceda permissões para câmera, microfone e localização para validar todas as rotas.

## Mapa de Documentação
Cada pasta possui seu próprio README para facilitar a navegação:

| Caminho | Descrição |
| --- | --- |
| [`backend/`](backend/README.md) | Guia do serviço FastAPI. |
| [`backend/app/`](backend/app/README.md) | Estrutura interna do app (API, core, DB, schemas). |
| [`backend/app/api/`](backend/app/api/README.md) | Dependências e roteadores. |
| [`backend/app/api/routes/`](backend/app/api/routes/README.md) | Endpoints por domínio. |
| [`backend/app/core/`](backend/app/core/README.md) | Configurações e segurança. |
| [`backend/app/db/`](backend/app/db/README.md) | Sessões, base declarativa e models. |
| [`backend/app/db/models/`](backend/app/db/models/README.md) | Entidades descritas individualmente. |
| [`backend/app/schemas/`](backend/app/schemas/README.md) | Modelos Pydantic de entrada/saída. |
| [`backend/tests/`](backend/tests/README.md) | Estratégia de testes.
| [`docs/`](docs/README.md) | Requisitos e artefatos gerados. |
| [`imgs_ref/`](imgs_ref/README.md) | Imagens usadas nos guias. |
| [`mobile/`](mobile/README.md) | Guia do app Expo. |
| [`mobile/assets/`](mobile/assets/README.md) | Assets estáticos. |
| [`mobile/assets/imgs/`](mobile/assets/imgs/README.md) | Catálogo de imagens usadas na UI. |
| [`mobile/imagens/`](mobile/imagens/README.md) | Screenshots utilizados em doc histórica. |
| [`mobile/src/`](mobile/src/README.md) | Arquitetura do app. |
| [`mobile/src/api/`](mobile/src/api/README.md) | Clientes REST. |
| [`mobile/src/components/`](mobile/src/components/README.md) | Componentes reutilizáveis. |
| [`mobile/src/data/`](mobile/src/data/README.md) | Dados mockados/auxiliares. |
| [`mobile/src/navigation/`](mobile/src/navigation/README.md) | Navegação. |
| [`mobile/src/screens/`](mobile/src/screens/README.md) | Descrição de cada tela. |
| [`mobile/src/storage/`](mobile/src/storage/README.md) | Persistência local. |
| [`mobile/src/theme/`](mobile/src/theme/README.md) | Tokens de cor. |
| [`mobile/src/utils/`](mobile/src/utils/README.md) | Utilitários gerais. |

## Convenções
- **Commits**: `tipo(escopo): mensagem` (ex: `feat(mobile): adicionar hub`).
- **Branches**: `feature/*`, `fix/*`, `docs/*`.
- **JS/TS**: componentes funcionais, hooks e estilos próximos ao arquivo.
- **Python**: siga Black/isort, retorne schemas Pydantic, use HTTPException para erros.

## Suporte
Abra uma issue ou fale com o time no Slack `#kitchen-brain-dev` com detalhes do ambiente e passos para reproduzir o problema.
