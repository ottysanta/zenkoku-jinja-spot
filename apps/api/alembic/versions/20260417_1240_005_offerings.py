"""add offering_items / offerings / campaigns / campaign_contributions

奉納 & クラウドファンディング基盤。
- offering_items: 各神社が用意する奉納メニュー（単発、金額固定 or 自由）。
- offerings: 実際の奉納レコード。Stripe Checkout セッションに 1:1。
  intent: gratitude(感謝) / vow(決意) / milestone(節目) / thanks(お礼) / other
- campaigns: 神社が立てる修繕等の募集。
- campaign_contributions: クラファンへの支援。offerings とは区別する（別の会計単位）。

金額は全て「最小通貨単位の整数（円）」で保持。計算誤差を避けるため Float は使わない。

Revision ID: 005
Revises: 004
Create Date: 2026-04-17 12:40:00

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "005"
down_revision: Union[str, Sequence[str], None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "offering_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("spot_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        # 金額固定: amount_jpy に値。自由額: NULL を許容
        sa.Column("amount_jpy", sa.Integer(), nullable=True),
        sa.Column("min_amount_jpy", sa.Integer(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.String(), nullable=False),
        sa.Column("updated_at", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(["spot_id"], ["spots.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_offering_items_spot_id", "offering_items", ["spot_id"])

    op.create_table(
        "offerings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=True),  # 匿名奉納を許容
        sa.Column("client_id", sa.String(), nullable=True),
        sa.Column("spot_id", sa.Integer(), nullable=False),
        sa.Column("offering_item_id", sa.Integer(), nullable=True),
        # intent: gratitude / vow / milestone / thanks / other
        sa.Column("intent", sa.String(), nullable=False, server_default="gratitude"),
        sa.Column("message", sa.Text(), nullable=True),   # 願い事の本文（公開/非公開は別カラム）
        sa.Column("is_public", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("amount_jpy", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(length=8), nullable=False, server_default="jpy"),
        # Stripe
        sa.Column("stripe_session_id", sa.String(), nullable=True),
        sa.Column("stripe_payment_intent_id", sa.String(), nullable=True),
        # status: pending / paid / refunded / failed
        sa.Column("status", sa.String(), nullable=False, server_default="pending"),
        sa.Column("paid_at", sa.String(), nullable=True),
        sa.Column("created_at", sa.String(), nullable=False),
        sa.Column("updated_at", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["spot_id"], ["spots.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(
            ["offering_item_id"], ["offering_items.id"], ondelete="SET NULL"
        ),
        sa.UniqueConstraint("stripe_session_id", name="uq_offerings_stripe_session_id"),
    )
    op.create_index("ix_offerings_spot_id", "offerings", ["spot_id"])
    op.create_index("ix_offerings_user_id", "offerings", ["user_id"])
    op.create_index("ix_offerings_status", "offerings", ["status"])
    op.create_index("ix_offerings_created_at", "offerings", ["created_at"])

    op.create_table(
        "campaigns",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("spot_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("body", sa.Text(), nullable=True),
        sa.Column("cover_image_path", sa.String(), nullable=True),
        sa.Column("goal_amount_jpy", sa.Integer(), nullable=False),
        # キャッシュ（トリガ or アプリ側で更新）
        sa.Column("raised_amount_jpy", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("supporter_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("starts_at", sa.String(), nullable=True),
        sa.Column("ends_at", sa.String(), nullable=True),
        # status: draft / open / closed / canceled / completed
        sa.Column("status", sa.String(), nullable=False, server_default="draft"),
        sa.Column("created_at", sa.String(), nullable=False),
        sa.Column("updated_at", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(["spot_id"], ["spots.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_campaigns_spot_id", "campaigns", ["spot_id"])
    op.create_index("ix_campaigns_status", "campaigns", ["status"])

    op.create_table(
        "campaign_contributions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("campaign_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("client_id", sa.String(), nullable=True),
        sa.Column("amount_jpy", sa.Integer(), nullable=False),
        sa.Column("display_name", sa.String(), nullable=True),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("is_anonymous", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("stripe_session_id", sa.String(), nullable=True),
        sa.Column("stripe_payment_intent_id", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=False, server_default="pending"),
        sa.Column("paid_at", sa.String(), nullable=True),
        sa.Column("created_at", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(
            ["campaign_id"], ["campaigns.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.UniqueConstraint(
            "stripe_session_id", name="uq_campaign_contribs_stripe_session_id"
        ),
    )
    op.create_index(
        "ix_campaign_contribs_campaign_id", "campaign_contributions", ["campaign_id"]
    )
    op.create_index(
        "ix_campaign_contribs_status", "campaign_contributions", ["status"]
    )


def downgrade() -> None:
    op.drop_index("ix_campaign_contribs_status", table_name="campaign_contributions")
    op.drop_index("ix_campaign_contribs_campaign_id", table_name="campaign_contributions")
    op.drop_table("campaign_contributions")

    op.drop_index("ix_campaigns_status", table_name="campaigns")
    op.drop_index("ix_campaigns_spot_id", table_name="campaigns")
    op.drop_table("campaigns")

    op.drop_index("ix_offerings_created_at", table_name="offerings")
    op.drop_index("ix_offerings_status", table_name="offerings")
    op.drop_index("ix_offerings_user_id", table_name="offerings")
    op.drop_index("ix_offerings_spot_id", table_name="offerings")
    op.drop_table("offerings")

    op.drop_index("ix_offering_items_spot_id", table_name="offering_items")
    op.drop_table("offering_items")
