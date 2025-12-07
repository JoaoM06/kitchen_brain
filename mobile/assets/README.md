# `mobile/assets`

Repositório de recursos estáticos carregados pelo Expo (imagens, ícones e fontes se necessário). Tudo aqui é empacotado com o app e deve ser referenciado via `require()` ou `Asset.fromModule`.

## Estrutura atual
| Pasta | Conteúdo |
| --- | --- |
| [`imgs/`](imgs/README.md) | Logos, ilustrações do onboarding (1-4) e imagens usadas nos cards de receita (chef, biscoito, sopa, parm etc.). |

## Boas práticas
- Exporte imagens otimizadas (PNG ou WebP) e mantenha resolução suficiente para telas retina (mínimo 2x).
- Nomeie os arquivos com o contexto (`onboarding1.png`, `recipes/chef.png`) para facilitar a busca.
- Atualize `app.json`/`package.json` se adicionar novas fontes ou imagens usadas em splash/icon.
- Ao adicionar assets, lembre-se de limpar caches (`npx expo start -c`) para garantir que foram empacotados corretamente.
