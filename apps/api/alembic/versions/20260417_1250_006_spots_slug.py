"""add spots.slug (SEO 用の URL 識別子)

- nullable, unique。
- 既存行は slug 未設定のまま。Web 側は未設定時 'spot-{id}' を暗黙的に使う。
- 後続で人間可読な slug を手動 or バッチで付与していく。

Revision ID: 006
Revises: 005
Create Date: 2026-04-17 12:50:00

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "006"
down_revision: Union[str, Sequence[str], None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("spots") as batch:
        batch.add_column(sa.Column("slug", sa.String(), nullable=True))
        batch.create_unique_constraint("uq_spots_slug", ["slug"])
    op.create_index("ix_spots_slug", "spots", ["slug"])


def downgrade() -> None:
    op.drop_index("ix_spots_slug", table_name="spots")
    with op.batch_alter_table("spots") as batch:
        batch.drop_constraint("uq_spots_slug", type_="unique")
        batch.drop_column("slug")
