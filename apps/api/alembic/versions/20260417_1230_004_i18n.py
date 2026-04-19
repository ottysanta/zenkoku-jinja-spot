"""add shrines_i18n / benefits / benefits_i18n / shrine_benefits

多言語対応（ja/en/zh-Hans/zh-Hant/ko）。
- 正規データは spots テーブルに日本語で保持。翻訳は shrines_i18n に分離。
- ご利益はマスタ化（benefits）し、spots とは多対多（shrine_benefits）で繋ぐ。
  既存 spots.benefits (JSON 文字列) は当面併用、後続マイグレーションで剥がす。

Revision ID: 004
Revises: 003
Create Date: 2026-04-17 12:30:00

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "004"
down_revision: Union[str, Sequence[str], None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "shrines_i18n",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("spot_id", sa.Integer(), nullable=False),
        # BCP47: ja / en / zh-Hans / zh-Hant / ko
        sa.Column("locale", sa.String(length=16), nullable=False),
        sa.Column("name", sa.String(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("access_text", sa.Text(), nullable=True),
        sa.Column("goshuin_info", sa.Text(), nullable=True),
        sa.Column("juyohin_info", sa.Text(), nullable=True),
        # 翻訳元: human / deepl / mt_auto
        sa.Column("source", sa.String(), nullable=False, server_default="human"),
        sa.Column("created_at", sa.String(), nullable=False),
        sa.Column("updated_at", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(["spot_id"], ["spots.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("spot_id", "locale", name="uq_shrines_i18n_spot_locale"),
    )
    op.create_index("ix_shrines_i18n_locale", "shrines_i18n", ["locale"])
    op.create_index("ix_shrines_i18n_spot_id", "shrines_i18n", ["spot_id"])

    op.create_table(
        "benefits",
        sa.Column("id", sa.Integer(), primary_key=True),
        # slug は一意な機械識別子（例: "enmusubi", "shobai-hanjo"）
        sa.Column("slug", sa.String(), nullable=False),
        sa.Column("category", sa.String(), nullable=True),  # 例: 縁結び / 商売 / 健康
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.String(), nullable=False),
        sa.UniqueConstraint("slug", name="uq_benefits_slug"),
    )
    op.create_index("ix_benefits_category", "benefits", ["category"])

    op.create_table(
        "benefits_i18n",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("benefit_id", sa.Integer(), nullable=False),
        sa.Column("locale", sa.String(length=16), nullable=False),
        sa.Column("label", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["benefit_id"], ["benefits.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("benefit_id", "locale", name="uq_benefits_i18n_pair"),
    )

    op.create_table(
        "shrine_benefits",
        sa.Column("spot_id", sa.Integer(), primary_key=True),
        sa.Column("benefit_id", sa.Integer(), primary_key=True),
        sa.Column("weight", sa.Integer(), nullable=False, server_default="1"),
        sa.ForeignKeyConstraint(["spot_id"], ["spots.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["benefit_id"], ["benefits.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_shrine_benefits_benefit_id", "shrine_benefits", ["benefit_id"])


def downgrade() -> None:
    op.drop_index("ix_shrine_benefits_benefit_id", table_name="shrine_benefits")
    op.drop_table("shrine_benefits")

    op.drop_table("benefits_i18n")

    op.drop_index("ix_benefits_category", table_name="benefits")
    op.drop_table("benefits")

    op.drop_index("ix_shrines_i18n_spot_id", table_name="shrines_i18n")
    op.drop_index("ix_shrines_i18n_locale", table_name="shrines_i18n")
    op.drop_table("shrines_i18n")
