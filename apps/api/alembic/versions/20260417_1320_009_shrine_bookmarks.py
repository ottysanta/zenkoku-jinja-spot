"""Shrine bookmarks (want / saved / visited).

client_id ベースの軽量お気に入り/ウィッシュリスト。認証不要で
「行きたい / 保存 / 行った」を記録できる。既存 Checkin (GPS 検証付き参拝記録)
とは別テーブルとして分離する。

Revision ID: 009
Revises: 008
Create Date: 2026-04-17 13:20:00
"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "009"
down_revision: Union[str, Sequence[str], None] = "008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "shrine_bookmarks",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("client_id", sa.String(length=64), nullable=False),
        sa.Column(
            "spot_id",
            sa.Integer(),
            sa.ForeignKey("spots.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("status", sa.String(length=16), nullable=False),  # want / saved / visited
        sa.Column("note", sa.String(length=280), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.UniqueConstraint(
            "client_id",
            "spot_id",
            "status",
            name="uq_bookmark_client_spot_status",
        ),
    )
    op.create_index("ix_shrine_bookmarks_client_id", "shrine_bookmarks", ["client_id"])
    op.create_index("ix_shrine_bookmarks_spot_id", "shrine_bookmarks", ["spot_id"])
    # マイページ「行きたい/保存/行った」タブ切替のための複合インデックス
    op.create_index(
        "ix_shrine_bookmarks_client_status",
        "shrine_bookmarks",
        ["client_id", "status"],
    )


def downgrade() -> None:
    op.drop_index("ix_shrine_bookmarks_client_status", table_name="shrine_bookmarks")
    op.drop_index("ix_shrine_bookmarks_spot_id", table_name="shrine_bookmarks")
    op.drop_index("ix_shrine_bookmarks_client_id", table_name="shrine_bookmarks")
    op.drop_table("shrine_bookmarks")
