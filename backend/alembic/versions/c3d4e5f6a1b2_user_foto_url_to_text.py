"""user_foto_url_to_text

Revision ID: c3d4e5f6a1b2
Revises: b2c3d4e5f6a1
Create Date: 2026-06-02 00:02:00.000000

Muda foto_url de VARCHAR(512) para TEXT (Fase 3 — suporte a base64 longo).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "c3d4e5f6a1b2"
down_revision: Union[str, None] = "b2c3d4e5f6a1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "users",
        "foto_url",
        existing_type=sa.String(512),
        type_=sa.Text(),
        existing_nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "users",
        "foto_url",
        existing_type=sa.Text(),
        type_=sa.String(512),
        existing_nullable=True,
    )
