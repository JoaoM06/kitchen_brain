# `mobile/imagens`

Biblioteca de screenshots e figuras usadas em apresentações internas, relatórios de QA e documentação histórica. Diferente de `assets/imgs`, este diretório não é empacotado junto ao app, mas serve como referência visual.

| Arquivo | Descrição |
| --- | --- |
| `AudioContainer.png`, `StartRecFunc.png`, ... | Diagramas de VoiceRec (componentes, estados de gravação, timer). |
| `image.png`, `image3primeira.png`, ... | Capturas de fluxos mais antigos citados em docs do time. |

## Como manter atualizado
1. Ao alterar uma tela relevante, gere uma nova captura (simulador ou aparelho físico) e substitua a imagem correspondente.
2. Use nomes que indiquem contexto (`voice-rec-step1.png`, `perfil-tabs-2025.png`) e adicione notas neste README se necessário.
3. Se as imagens forem usadas em `docs/` ou apresentações externas, atualize os links relativos para evitar “404”.

Essas imagens ajudam a equipe de PM/QA a comparar regressões visuais sem precisar abrir o app.
