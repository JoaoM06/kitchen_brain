# Kitchen Brain

Kitchen Brain é um assistente culinário desenhado para pessoas que desejam organizar a despensa, descobrir receitas e compartilhar cardápios de forma acessível. O repositório reúne **todo o stack** (mobile, backend e documentação) usado pela equipe de produto.

## Índice
1. [Visão Geral](#visão-geral)
2. [Módulos e Responsabilidades](#módulos-e-responsabilidades)
3. [Estrutura do Repositório](#estrutura-do-repositório)
4. [Configuração do Ambiente](#configuração-do-ambiente)
   - [Backend FastAPI](#backend-fastapi)
   - [Aplicativo Mobile/Expo](#aplicativo-mobileexpo)
   - [Scripts rápidos](#scripts-rápidos)
5. [Testes e Qualidade](#testes-e-qualidade)
6. [Documentação Complementar](#documentação-complementar)
7. [Convenções e Suporte](#convenções-e-suporte)

## Visão Geral
O produto responde três perguntas centrais:
- **O que tenho em casa?** → telas de Estoque, inclusão manual/barcode/voz e monitoramento de validade.
- **O que posso cozinhar agora?** → catálogo de receitas, Recipe Hub, filtros e vídeos integrados.
- **Como planejo a semana?** → CardapioBot com IA, exportação em PDF e histórico salvo no perfil.

Tudo é construído com foco em acessibilidade: onboarding guiado, contextos de fonte/contraste, gravação por voz e permissões explícitas com LGPD. O backend (FastAPI + SQLAlchemy) é o núcleo de autenticação, estoque e integrações externas; o aplicativo Expo/React Native entrega a experiência multiplataforma.

## Módulos e Responsabilidades
| Módulo | Resumo | Observações |
| --- | --- | --- |
| `mobile/` | Projeto Expo principal usado em builds e releases. | Contém `src/`, `assets/`, `imagens/` e README específicos por área. |
| `src/` | Espelho leve do app usado em protótipos/POCs dentro deste monorepo. | Compartilha estrutura com `mobile/src`. |
| `backend/` | API FastAPI com rotas de auth, estoque, cardápios, permissões e transcrição de áudio. | Configurações em `.env` (DATABASE_URL, SECRET_KEY, Whisper/Gemini). |
| `docs/` | Requisitos funcionais, PDFs gerados pelo CardapioBot e pesquisas. | Use como referência para QA ou demos. |
| `imagens/` / `imgs_ref/` | Capturas históricas, fluxos e referências visuais. | Atualize quando telas mudarem para manter a documentação coerente. |

## Estrutura do Repositório
```
repo-root
├── App.jsx / src/           # versão Expo usada em dev rápido
├── backend/                # serviço FastAPI
├── mobile/                 # app oficial (Expo)
├── docs/                   # requisitos e PDFs
├── imagens/ e imgs_ref/    # screenshots de apoio
├── assets/                 # assets compartilhados
└── package.json / app.json / requirements.txt
```
Cada subpasta possui um `README.md` detalhando componentes, dependências e fluxos internos.

## Configuração do Ambiente
### Backend FastAPI
Pré-requisitos: Python 3.10+, PostgreSQL (ou SQLite para testes), pip/virtualenv.

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # ajuste DATABASE_URL, SECRET_KEY etc.
uvicorn app.main:app --reload
```
Roda em `http://127.0.0.1:8000`. Os routers e dependências são mapeados em `backend/app/api/README.md`.

### Aplicativo Mobile/Expo
Pré-requisitos: Node 18+, npm ou pnpm, Expo CLI e simuladores ou Expo Go.

```bash
cd mobile
npm install
npx expo start                  # escolha i (iOS), a (Android) ou w (Web)
```
Permissões importantes:
- **Câmera**: scanner de código de barras e upload do Recipe Hub.
- **Microfone**: `VoiceRecScreen`.
- **Localização**: `MarketMapScreen` e contexto de mercados para CardapioBot.

O espelho `App.jsx + src/` na raiz segue os mesmos passos caso deseje executar o app a partir daqui.

### Scripts rápidos
- `pytest -q` dentro de `backend/` para testar a API.
- `npx expo run:android/ios` para builds nativos.
- `eslint --fix` / `npx prettier --write .` (quando configurados) para formatar o app.
- `make format` e `make lint` (se disponíveis) para padronizar o backend.

## Testes e Qualidade
- **Backend**: Pytest cobre fluxos de autenticação, estoque, permissões e transcrição usando TestClient e fixtures para usuários/tokens. Integrações externas (Whisper/Gemini) são mockadas.
- **Mobile**: fluxos críticos são validados manualmente; use `docs/` como checklist funcional. Ainda não há E2E automatizado.
- **Lint/format**: Black/isort para Python; componentes React seguem ESLint/Prettier e colocalização de estilos.

## Documentação Complementar
Os READMEs internos trazem instruções específicas:
- `backend/app/README.md` → arquitetura da API, camadas `api/core/db`.
- `mobile/README.md` → scripts Expo, dicas de depuração, organização de telas.
- `mobile/src/screens/README.md` → descrição das telas (Recipes, RecipeHub, Estoque, CardapioBot, etc.).
- `mobile/src/storage/README.md` → helpers de AsyncStorage (`savedMenus`, `recipeHub`).
- `docs/README.md` → relação de requisitos, PDFs e materiais anexos.

Use a tabela acima como índice rápido para navegar neles.

## Convenções e Suporte
- **Commits**: `tipo(escopo): mensagem` (ex.: `feat(mobile): adicionar permissões`).
- **Branches**: `feature/*`, `fix/*`, `chore/*`, `docs/*`.
- **Estilo**: componentes funcionais React com hooks, imports centralizados; no backend, Pydantic para IO e `HTTPException` para erros.
- **Suporte**: abra issues com passos de reprodução ou fale no Slack `#kitchen-brain-dev` informando ambiente, capturas (presentes em `imagens/`) e logs relevantes.
