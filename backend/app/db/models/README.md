# `backend/app/db/models`

Mapeamento das entidades persistidas pelo Kitchen Brain. Cada arquivo define uma ou mais classes SQLAlchemy e, quando necessário, relacionamentos/associações.

| Arquivo | Entidades / Resumo |
| --- | --- |
| `user.py` | `User`: dados básicos, hash de senha, flags de consentimento, relacionamento com dispositivos e estoque. |
| `device.py` | `Device`: registro de dispositivos móveis/web, push token, plataforma. |
| `lgpd.py` | `Consentimento`: escopos aprovados/revogados por usuário (`allow_location`, `allow_notifications` etc.). |
| `market.py` | `Market`: catálogo usado no mapa quando falha a busca em tempo real. |
| `media.py` | `MediaAsset`: metadata de fotos/vídeos publicados no Recipe Hub. |
| `product.py` | Produtos e códigos de barras associados ao estoque. |
| `recipe.py` | Cardápios gerados, histórico do CardapioBot, receitas curadas. |
| `settings.py` | Preferências individuais (LGPD, notificações, câmera/microfone). |
| `shopping.py` | Listas de compras e itens relacionados. |
| `storage.py` | Anexos genéricos (PDFs de cardápio, por exemplo). |

## Convenções
- Combine `__tablename__` explícitos com `sa.Column` e `ForeignKey` nomeados para facilitar migrações.
- Utilize mixins (timestamps, `id` UUID) se necessário para manter consistência.
- Atualize `__all__` e `Base.metadata.create_all` quando adicionar novos models, além das migrações Alembic.
