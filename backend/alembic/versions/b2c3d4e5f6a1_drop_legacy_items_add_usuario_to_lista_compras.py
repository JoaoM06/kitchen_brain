"""drop_legacy_items_add_usuario_to_lista_compras

Revision ID: b2c3d4e5f6a1
Revises: a1b2c3d4e5f6
Create Date: 2026-06-02 00:01:00.000000

Remove tabela legada `itens` (INTEGER PK, sem multi-tenant).
Adiciona usuario_id e produto_generico_id à lista_compras.

ATENÇÃO: rows existentes em lista_compras ficam com usuario_id = NULL.
Decida: limpar manualmente ou tolerar NULL até migração de dados.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "b2c3d4e5f6a1"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_index("ix_itens_id", table_name="itens")
    op.drop_index("ix_itens_nome", table_name="itens")
    op.drop_table("itens")

    op.add_column("lista_compras", sa.Column("usuario_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column("lista_compras", sa.Column("produto_generico_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.create_index("ix_lista_compras_usuario_id", "lista_compras", ["usuario_id"], unique=False)
    op.create_foreign_key(
        "fk_lista_compras_usuario_id",
        "lista_compras", "users",
        ["usuario_id"], ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_lista_compras_produto_generico_id",
        "lista_compras", "produtos_genericos",
        ["produto_generico_id"], ["id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_lista_compras_produto_generico_id", "lista_compras", type_="foreignkey")
    op.drop_constraint("fk_lista_compras_usuario_id", "lista_compras", type_="foreignkey")
    op.drop_index("ix_lista_compras_usuario_id", table_name="lista_compras")
    op.drop_column("lista_compras", "produto_generico_id")
    op.drop_column("lista_compras", "usuario_id")

    op.create_table(
        "itens",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("nome", sa.String(), nullable=True),
        sa.Column("secoes", sa.String(), nullable=True),
        sa.Column("categorias", sa.String(), nullable=True),
        sa.Column("validade", sa.Date(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_itens_id", "itens", ["id"], unique=False)
    op.create_index("ix_itens_nome", "itens", ["nome"], unique=False)
