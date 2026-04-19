"""add reviews / review_photos / reactions / follows / notifications / reports

要件定義書に沿った構造化レビュー & ソーシャル機能。
- reviews: 構造化スコア（0-5）＋本文＋訪問日。1 user × 1 spot = 1 review。
- review_photos: 1 レビューあたり複数写真。
- reactions: 感謝/参考/安心 等の粒度でリアクション（対象は review / user_post / checkin 共通）。
- follows: follower → followee。
- notifications: 汎用。未読管理。
- reports: 通報（対象種別は多態的に保持）。

Revision ID: 003
Revises: 002
Create Date: 2026-04-17 12:20:00

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "003"
down_revision: Union[str, Sequence[str], None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "reviews",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("spot_id", sa.Integer(), nullable=False),
        # 構造化スコア（0-5, 0.5 刻み想定。内部は整数 0-10 でも良いが簡潔に Float）
        sa.Column("score_atmosphere", sa.Float(), nullable=True),
        sa.Column("score_manners", sa.Float(), nullable=True),
        sa.Column("score_access", sa.Float(), nullable=True),
        sa.Column("score_facilities", sa.Float(), nullable=True),
        sa.Column("score_overall", sa.Float(), nullable=True),
        sa.Column("body", sa.Text(), nullable=True),
        sa.Column("visited_at", sa.String(), nullable=True),
        sa.Column("locale", sa.String(), nullable=True, server_default="ja"),
        sa.Column("is_hidden", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.String(), nullable=False),
        sa.Column("updated_at", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["spot_id"], ["spots.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id", "spot_id", name="uq_reviews_user_spot"),
    )
    op.create_index("ix_reviews_spot_id", "reviews", ["spot_id"])
    op.create_index("ix_reviews_user_id", "reviews", ["user_id"])
    op.create_index("ix_reviews_created_at", "reviews", ["created_at"])

    op.create_table(
        "review_photos",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("review_id", sa.Integer(), nullable=False),
        sa.Column("image_path", sa.String(), nullable=False),
        sa.Column("caption", sa.String(), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["review_id"], ["reviews.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_review_photos_review_id", "review_photos", ["review_id"])

    op.create_table(
        "reactions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        # 対象: review / user_post / checkin
        sa.Column("target_type", sa.String(), nullable=False),
        sa.Column("target_id", sa.Integer(), nullable=False),
        # kind: gratitude / helpful / peaceful / inspiring 等
        sa.Column("kind", sa.String(), nullable=False),
        sa.Column("created_at", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint(
            "user_id", "target_type", "target_id", "kind",
            name="uq_reactions_user_target_kind",
        ),
    )
    op.create_index("ix_reactions_target", "reactions", ["target_type", "target_id"])

    op.create_table(
        "follows",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("follower_id", sa.Integer(), nullable=False),
        sa.Column("followee_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["follower_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["followee_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint(
            "follower_id", "followee_id", name="uq_follows_pair"
        ),
        sa.CheckConstraint(
            "follower_id <> followee_id", name="ck_follows_not_self"
        ),
    )
    op.create_index("ix_follows_follower", "follows", ["follower_id"])
    op.create_index("ix_follows_followee", "follows", ["followee_id"])

    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        # kind: reaction / follow / review_reply / system / offering_receipt 等
        sa.Column("kind", sa.String(), nullable=False),
        sa.Column("payload", sa.Text(), nullable=True),  # JSON 文字列
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_notifications_user_unread", "notifications", ["user_id", "is_read"])
    op.create_index("ix_notifications_created_at", "notifications", ["created_at"])

    op.create_table(
        "reports",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("reporter_user_id", sa.Integer(), nullable=True),
        sa.Column("reporter_client_id", sa.String(), nullable=True),
        # target_type: review / user_post / checkin / user / spot
        sa.Column("target_type", sa.String(), nullable=False),
        sa.Column("target_id", sa.Integer(), nullable=False),
        # reason: spam / harassment / misinformation / inappropriate / other
        sa.Column("reason", sa.String(), nullable=False),
        sa.Column("detail", sa.Text(), nullable=True),
        # status: open / reviewing / resolved / rejected
        sa.Column("status", sa.String(), nullable=False, server_default="open"),
        sa.Column("created_at", sa.String(), nullable=False),
        sa.Column("resolved_at", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(
            ["reporter_user_id"], ["users.id"], ondelete="SET NULL"
        ),
    )
    op.create_index("ix_reports_target", "reports", ["target_type", "target_id"])
    op.create_index("ix_reports_status", "reports", ["status"])


def downgrade() -> None:
    op.drop_index("ix_reports_status", table_name="reports")
    op.drop_index("ix_reports_target", table_name="reports")
    op.drop_table("reports")

    op.drop_index("ix_notifications_created_at", table_name="notifications")
    op.drop_index("ix_notifications_user_unread", table_name="notifications")
    op.drop_table("notifications")

    op.drop_index("ix_follows_followee", table_name="follows")
    op.drop_index("ix_follows_follower", table_name="follows")
    op.drop_table("follows")

    op.drop_index("ix_reactions_target", table_name="reactions")
    op.drop_table("reactions")

    op.drop_index("ix_review_photos_review_id", table_name="review_photos")
    op.drop_table("review_photos")

    op.drop_index("ix_reviews_created_at", table_name="reviews")
    op.drop_index("ix_reviews_user_id", table_name="reviews")
    op.drop_index("ix_reviews_spot_id", table_name="reviews")
    op.drop_table("reviews")
