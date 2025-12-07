# `mobile/assets/imgs`

Catálogo de imagens empacotadas com o app.

| Arquivo | Uso |
| --- | --- |
| `logo-kitchenbrain.png` | Splash screen, ícone interno e telas de boas-vindas. |
| `onboarding1.png` a `onboarding4.png` | Ilustrações do carrossel de onboarding. |
| `chef.png`, `biscoito.png`, `parm.png`, `sopa.png` | Cards de receitas e placeholders em `RecipesScreen`. |
| Outras imagens | Podem ser usadas no Recipe Hub, banners e CTA do CardapioBot. |

## Dicas
- Use `require('../../assets/imgs/<arquivo>')` para obter caching automático do Expo.
- Mantenha a proporção 1.5:1 nos cards para evitar cortes inesperados.
- Ao substituir imagens, limpe o cache (`npx expo start -c`) para garantir que o asset atualizado seja servido.
