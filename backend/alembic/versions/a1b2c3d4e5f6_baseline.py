"""baseline

Revision ID: a1b2c3d4e5f6
Revises:
Create Date: 2026-06-02 00:00:00.000000

Schema completo pré-refactoring (Fase 4).
Em bancos existentes: `alembic stamp a1b2c3d4e5f6` antes de `upgrade head`.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("nome", sa.String(255), nullable=True),
        sa.Column("senha_hash", sa.String(255), nullable=False),
        sa.Column("fl_ativo", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("criado_em", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("preferencias", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("alergias", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("restricoes_alimentares", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("bio", sa.String(500), nullable=True),
        sa.Column("foto_url", sa.String(512), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

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

    op.create_table(
        "lista_compras",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("nome", sa.String(), nullable=True),
        sa.Column("secoes", sa.String(), nullable=True),
        sa.Column("categorias", sa.String(), nullable=True),
        sa.Column("validade", sa.Date(), nullable=True),
        sa.Column("comprado", sa.Boolean(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_lista_compras_id", "lista_compras", ["id"], unique=False)
    op.create_index("ix_lista_compras_nome", "lista_compras", ["nome"], unique=False)

    op.create_table(
        "produtos_genericos",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("nome", sa.String(180), nullable=False),
        sa.Column("nome_normalizado", sa.String(180), nullable=False),
        sa.Column("url_imagem", sa.String(512), nullable=True),
        sa.Column("categoria", sa.String(120), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("nome_normalizado"),
    )
    op.create_index("ix_produtos_genericos_categoria", "produtos_genericos", ["categoria"], unique=False)
    op.create_index("ix_produtos_genericos_nome_normalizado", "produtos_genericos", ["nome_normalizado"], unique=True)

    op.create_table(
        "produtos",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("nome", sa.String(180), nullable=False),
        sa.Column("marca", sa.String(120), nullable=True),
        sa.Column("categoria", sa.String(120), nullable=True),
        sa.Column("url_imagem", sa.String(512), nullable=True),
        sa.Column("id_generico", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(["id_generico"], ["produtos_genericos.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("nome", "marca", name="uq_produto_nome_marca"),
    )
    op.create_index("ix_produtos_id_generico", "produtos", ["id_generico"], unique=False)

    op.create_table(
        "codigos_barras",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("produto_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("valor", sa.String(64), nullable=False),
        sa.Column("tipo", sa.String(16), nullable=False),
        sa.ForeignKeyConstraint(["produto_id"], ["produtos.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("valor"),
        sa.UniqueConstraint("produto_id", "valor", name="uq_produto_codigo"),
    )
    op.create_index("ix_codigos_barras_produto_id", "codigos_barras", ["produto_id"], unique=False)
    op.create_index("ix_codigos_barras_valor", "codigos_barras", ["valor"], unique=True)

    op.create_table(
        "locais_estoque",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("usuario_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("nome", sa.String(120), nullable=False),
        sa.Column("descricao", sa.String(240), nullable=True),
        sa.Column("icone", sa.String(50), nullable=True),
        sa.Column("ordem", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["usuario_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_locais_estoque_usuario_id", "locais_estoque", ["usuario_id"], unique=False)

    op.create_table(
        "itens_estoque",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("usuario_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("produto_generico_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("local_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("quantidade", sa.Numeric(12, 3), nullable=False),
        sa.Column("unidade", sa.String(8), nullable=False),
        sa.Column("validade", sa.Date(), nullable=True),
        sa.Column("observacoes", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["local_id"], ["locais_estoque.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["produto_generico_id"], ["produtos_genericos.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["usuario_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_itens_estoque_local_id", "itens_estoque", ["local_id"], unique=False)
    op.create_index("ix_itens_estoque_produto_generico_id", "itens_estoque", ["produto_generico_id"], unique=False)
    op.create_index("ix_itens_estoque_usuario_id", "itens_estoque", ["usuario_id"], unique=False)

    op.create_table(
        "movimentos_estoque",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("item_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tipo", sa.String(16), nullable=False),
        sa.Column("quantidade", sa.Numeric(12, 3), nullable=False),
        sa.Column("de_local_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("para_local_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("motivo", sa.String(180), nullable=True),
        sa.CheckConstraint("quantidade > 0", name="ck_mov_qtd_pos"),
        sa.ForeignKeyConstraint(["de_local_id"], ["locais_estoque.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["item_id"], ["itens_estoque.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["para_local_id"], ["locais_estoque.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_movimentos_estoque_item_id", "movimentos_estoque", ["item_id"], unique=False)

    op.create_table(
        "receitas",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("usuario_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("titulo", sa.String(180), nullable=False),
        sa.Column("descricao", sa.Text(), nullable=True),
        sa.Column("rendimento_porcoes", sa.Integer(), nullable=False),
        sa.Column("tempo_preparo_min", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["usuario_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_receitas_usuario_id", "receitas", ["usuario_id"], unique=False)

    op.create_table(
        "playlists",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("usuario_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("nome", sa.String(120), nullable=False),
        sa.Column("descricao", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["usuario_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_playlists_usuario_id", "playlists", ["usuario_id"], unique=False)

    op.create_table(
        "playlist_receita",
        sa.Column("playlist_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("receita_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(["playlist_id"], ["playlists.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["receita_id"], ["receitas.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("playlist_id", "receita_id", name="uq_playlist_receita"),
    )
    op.create_index("ix_playlist_receita_playlist_id", "playlist_receita", ["playlist_id"], unique=False)
    op.create_index("ix_playlist_receita_receita_id", "playlist_receita", ["receita_id"], unique=False)

    op.create_table(
        "ingredientes_receita",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("receita_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("produto_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("nome_livre", sa.String(180), nullable=True),
        sa.Column("quantidade", sa.Numeric(12, 3), nullable=True),
        sa.Column("unidade", sa.String(16), nullable=True),
        sa.Column("observacoes", sa.String(240), nullable=True),
        sa.ForeignKeyConstraint(["produto_id"], ["produtos.id"]),
        sa.ForeignKeyConstraint(["receita_id"], ["receitas.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ingredientes_receita_produto_id", "ingredientes_receita", ["produto_id"], unique=False)
    op.create_index("ix_ingredientes_receita_receita_id", "ingredientes_receita", ["receita_id"], unique=False)

    op.create_table(
        "cardapios",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("usuario_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("titulo", sa.String(120), nullable=False),
        sa.Column("inicio", sa.Date(), nullable=True),
        sa.Column("fim", sa.Date(), nullable=True),
        sa.ForeignKeyConstraint(["usuario_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_cardapios_usuario_id", "cardapios", ["usuario_id"], unique=False)

    op.create_table(
        "refeicoes",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("cardapio_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("data", sa.Date(), nullable=False),
        sa.Column("tipo", sa.String(12), nullable=False),
        sa.Column("observacoes", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["cardapio_id"], ["cardapios.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_refeicoes_cardapio_id", "refeicoes", ["cardapio_id"], unique=False)

    op.create_table(
        "refeicao_receita",
        sa.Column("refeicao_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("receita_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(["refeicao_id"], ["refeicoes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["receita_id"], ["receitas.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("refeicao_id", "receita_id", name="uq_refeicao_receita"),
    )
    op.create_index("ix_refeicao_receita_refeicao_id", "refeicao_receita", ["refeicao_id"], unique=False)
    op.create_index("ix_refeicao_receita_receita_id", "refeicao_receita", ["receita_id"], unique=False)

    op.create_table(
        "importacoes_receita",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("receita_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("fonte", sa.String(120), nullable=True),
        sa.Column("url", sa.String(512), nullable=True),
        sa.ForeignKeyConstraint(["receita_id"], ["receitas.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("receita_id"),
    )
    op.create_index("ix_importacoes_receita_receita_id", "importacoes_receita", ["receita_id"], unique=True)

    op.create_table(
        "listas_compras",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("usuario_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("nome", sa.String(120), nullable=False),
        sa.Column("status", sa.String(24), nullable=False),
        sa.ForeignKeyConstraint(["usuario_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_listas_compras_usuario_id", "listas_compras", ["usuario_id"], unique=False)

    op.create_table(
        "itens_lista",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("lista_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("produto_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("nome_livre", sa.String(180), nullable=True),
        sa.Column("quantidade", sa.Numeric(12, 3), nullable=True),
        sa.Column("unidade", sa.String(16), nullable=True),
        sa.Column("feito", sa.Boolean(), nullable=False),
        sa.Column("preco_estimado", sa.Numeric(12, 2), nullable=True),
        sa.ForeignKeyConstraint(["lista_id"], ["listas_compras.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["produto_id"], ["produtos.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_itens_lista_lista_id", "itens_lista", ["lista_id"], unique=False)
    op.create_index("ix_itens_lista_produto_id", "itens_lista", ["produto_id"], unique=False)

    op.create_table(
        "mercados",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("nome", sa.String(180), nullable=False),
        sa.Column("endereco", sa.String(240), nullable=True),
        sa.Column("cidade", sa.String(120), nullable=True),
        sa.Column("uf", sa.String(2), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "precos_produto",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("produto_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("mercado_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("preco", sa.Numeric(12, 2), nullable=False),
        sa.Column("coletado_em", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["mercado_id"], ["mercados.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["produto_id"], ["produtos.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("produto_id", "mercado_id", "coletado_em", name="uq_preco_coleta"),
    )
    op.create_index("ix_precos_produto_mercado_id", "precos_produto", ["mercado_id"], unique=False)
    op.create_index("ix_precos_produto_produto_id", "precos_produto", ["produto_id"], unique=False)

    op.create_table(
        "anexos_midia",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("usuario_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("item_estoque_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("url", sa.String(1024), nullable=False),
        sa.Column("tipo", sa.String(30), nullable=True),
        sa.ForeignKeyConstraint(["item_estoque_id"], ["itens_estoque.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["usuario_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_anexos_midia_usuario_id", "anexos_midia", ["usuario_id"], unique=False)

    op.create_table(
        "leituras_ocr",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("anexo_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("texto", sa.Text(), nullable=False),
        sa.Column("confianca", sa.Float(), nullable=True),
        sa.Column("extra_json", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(["anexo_id"], ["anexos_midia.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_leituras_ocr_anexo_id", "leituras_ocr", ["anexo_id"], unique=False)

    op.create_table(
        "consentimentos",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("usuario_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("escopo", sa.String(120), nullable=False),
        sa.Column("versao_politica", sa.String(32), nullable=True),
        sa.Column("concedido_em", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revogado_em", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["usuario_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_consentimentos_usuario_id", "consentimentos", ["usuario_id"], unique=False)

    op.create_table(
        "exportacoes_dados",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("usuario_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("formato", sa.String(16), nullable=False),
        sa.Column("solicitado_em", sa.DateTime(timezone=True), nullable=False),
        sa.Column("concluido_em", sa.DateTime(timezone=True), nullable=True),
        sa.Column("url_resultado", sa.String(1024), nullable=True),
        sa.ForeignKeyConstraint(["usuario_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_exportacoes_dados_usuario_id", "exportacoes_dados", ["usuario_id"], unique=False)

    op.create_table(
        "exclusoes_conta",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("usuario_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", sa.String(16), nullable=False),
        sa.Column("solicitado_em", sa.DateTime(timezone=True), nullable=False),
        sa.Column("efetivado_em", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["usuario_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_exclusoes_conta_usuario_id", "exclusoes_conta", ["usuario_id"], unique=False)

    op.create_table(
        "user_settings",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("allow_location", sa.Boolean(), nullable=False),
        sa.Column("allow_notifications", sa.Boolean(), nullable=False),
        sa.Column("allow_memory", sa.Boolean(), nullable=False),
        sa.Column("allow_camera", sa.Boolean(), nullable=False),
        sa.Column("allow_microphone", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index("ix_user_settings_user_id", "user_settings", ["user_id"], unique=True)

    op.create_table(
        "mobile_devices",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("platform", sa.String(16), nullable=False),
        sa.Column("model", sa.String(64), nullable=True),
        sa.Column("os_version", sa.String(32), nullable=True),
        sa.Column("app_version", sa.String(32), nullable=True),
        sa.Column("push_token", sa.String(512), nullable=True),
        sa.Column("p_location", sa.String(16), nullable=True),
        sa.Column("p_notifications", sa.String(16), nullable=True),
        sa.Column("p_camera", sa.String(16), nullable=True),
        sa.Column("p_microphone", sa.String(16), nullable=True),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_mobile_devices_user_id", "mobile_devices", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_table("mobile_devices")
    op.drop_table("user_settings")
    op.drop_table("exclusoes_conta")
    op.drop_table("exportacoes_dados")
    op.drop_table("consentimentos")
    op.drop_table("leituras_ocr")
    op.drop_table("anexos_midia")
    op.drop_table("precos_produto")
    op.drop_table("mercados")
    op.drop_table("itens_lista")
    op.drop_table("listas_compras")
    op.drop_table("importacoes_receita")
    op.drop_table("refeicao_receita")
    op.drop_table("refeicoes")
    op.drop_table("cardapios")
    op.drop_table("ingredientes_receita")
    op.drop_table("playlist_receita")
    op.drop_table("playlists")
    op.drop_table("receitas")
    op.drop_table("movimentos_estoque")
    op.drop_table("itens_estoque")
    op.drop_table("locais_estoque")
    op.drop_table("codigos_barras")
    op.drop_table("produtos")
    op.drop_table("produtos_genericos")
    op.drop_table("lista_compras")
    op.drop_table("itens")
    op.drop_table("users")
