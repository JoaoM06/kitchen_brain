# `mobile/src/data`

Mocks e helpers usados enquanto APIs reais não estão disponíveis ou como fallback offline.

| Arquivo | Conteúdo |
| --- | --- |
| `recipes.js` | Array `RECIPES` com título, imagem, vídeo e metadata exibidos em `RecipesScreen` e `RecipeDetailScreen`. |
| `stock.js` | `getStockSections`, `getLocalStockItems`, `getLocalExpiringItems` – fonte para `StockScreen` e CardapioBot quando não há sync com backend. |
| `markets.js` | Lista estática de mercados paulistas + helpers (`getMarketsWithinRadius`, `annotateMarketDistances`, `getDistanceKm`). Usado como fallback do mapa. |
| `recipeHub.js` | Posts curados padrão que aparecem no Recipe Hub mesmo antes do usuário carregar conteúdo próprio. |

## Quando editar
- Atualize `recipes.js` quando novos vídeos/imagens forem adicionados para evitar links quebrados.
- Ajuste `stock.js` se quiser representar novos estados (ex.: produtos congelados, status `expired`).
- Amplie `markets.js` com dados reais da cidade alvo em demos.
- Use esse diretório para qualquer mock adicional (ex.: `notifications.js`) e documente aqui.
